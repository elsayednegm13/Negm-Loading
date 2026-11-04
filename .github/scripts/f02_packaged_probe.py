#!/usr/bin/env python3
"""F-02 packaged-setup gate on a disposable Windows CI runner.

Never launches the packaged GUI, never uses the production uninstall registry
key, never executes a legacy uninstaller, and never touches a user install.
Verifies the freshly built self-extracting archive and exercises the actual
embedded payload through the protected source installer engine in temp paths.
"""
from __future__ import annotations

import hashlib
import io
import json
import os
from pathlib import Path
import sys
import tempfile
import traceback
import zipfile

REPORT_PATH = Path("f02-packaged-build-evidence.json")
# Executing a script under .github/scripts changes sys.path[0]; load project modules
# from the checked-out source root rather than from the CI helper directory.
sys.path.insert(0, str(Path.cwd()))


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def probe() -> int:
    evidence: dict = {
        "type": "F02_PACKAGED_SETUP_PREFLIGHT",
        "source_commit": os.environ.get("GITHUB_SHA", "unknown"),
        "platform": sys.platform,
        "built_from_source": True,
        "interactive_gui_tested": False,
        "packaged_setup_executed": False,
        "production_registry_modified": False,
        "old_uninstaller_executed": False,
        "release_ready": False,
        "tests": {},
    }
    test_key: str | None = None
    try:
        if os.name != "nt":
            raise RuntimeError("This gate is Windows-only")
        from PyInstaller.archive.readers import CArchiveReader
        import installer_engine as engine
        import installer_safety as safety

        app = Path("dist/NegmLoading.exe")
        setup = Path("dist/NegmLoading-Setup.exe")
        assert app.is_file() and setup.is_file(), "Freshly built executables missing"
        for path in (app, setup):
            assert path.open("rb").read(2) == b"MZ", f"Not a Windows PE: {path}"
        evidence["executables"] = {
            "app": {"size": app.stat().st_size, "sha256": sha256_file(app)},
            "setup": {"size": setup.stat().st_size, "sha256": sha256_file(setup)},
        }
        evidence["tests"]["fresh_windows_pe_files"] = "PASS"

        # Inspect the PyInstaller *setup exe*, not just its separate payload.zip.
        archive = CArchiveReader(str(setup.resolve()))
        toc = list(archive.toc)
        entry = next((x for x in toc if x.replace("\\", "/").split("/")[-1] == "payload.zip"), None)
        assert entry is not None, "The packaged setup EXE does not contain payload.zip"
        payload = archive.extract(entry)
        assert isinstance(payload, bytes) and payload, "No extractable payload.zip bytes"
        standalone_zip = Path("payload.zip").read_bytes()
        assert sha256(payload) == sha256(standalone_zip), "Embedded ZIP differs from build ZIP"
        evidence["embedded_payload"] = {
            "archive_entry": entry,
            "size": len(payload),
            "sha256": sha256(payload),
            "same_as_payload_zip": True,
            "archive_members": len(toc),
        }
        evidence["tests"]["setup_archive_contains_exact_payload"] = "PASS"

        with zipfile.ZipFile(io.BytesIO(payload)) as zf:
            names = zf.namelist()
            assert names and zf.testzip() is None, "Broken ZIP member"
            app_member = "NegmLoading.exe"
            assert app_member in names, "Expected fresh app executable missing from ZIP"
            assert sha256(zf.read(app_member)) == sha256_file(app), "Embedded app bytes differ"
            assert any(x.startswith("assets/") for x in names), "Missing assets"
            assert any(x.startswith("browser_extension/") for x in names), "Missing browser extension"
            evidence["zip_file_count"] = len(names)
            evidence["payload_root_executable"] = app_member
            evidence["installer_expected_executable"] = engine.APP_NAME + ".exe"
            evidence["executable_name_match"] = app_member == engine.APP_NAME + ".exe"
            evidence["tests"]["embedded_exe_hash_and_assets"] = "PASS"

        # Only a unique HKCU *test* anchor is used by the source safety engine.
        # This is the real embedded ZIP extracted from the built setup's archive.
        with tempfile.TemporaryDirectory(prefix="negm_f02_pkg_ci_", dir=os.environ.get("RUNNER_TEMP")) as scratch:
            scratch_path = Path(scratch)
            zip_path = scratch_path / "embedded-payload.zip"
            zip_path.write_bytes(payload)
            install = scratch_path / "temporary test install"
            outsider = scratch_path / "outside-user-data.txt"
            outsider.write_bytes(b"NEVER DELETE OUTSIDE USER FILE")
            outsider_before = sha256_file(outsider)
            test_key = safety.make_test_anchor_key()
            run_key = test_key + r"\Run"

            p1 = engine.prepare_and_copy_payload(
                str(install), str(zip_path), startup=False,
                anchor_key=test_key, run_key=run_key,
            )
            assert p1["created_root"] is True
            safety.write_uninstall_artifacts(
                str(install), p1["owned_files"], p1["owned_dirs"],
                app_name=engine.APP_NAME, created_root=p1["created_root"],
                anchor_key=test_key, run_key=run_key, shortcut_paths=[],
            )
            manifest = safety.load_manifest(str(install))
            safety.verify_install_anchor(str(install), manifest, test_key)
            assert (install / app_member).is_file(), "Real packaged app not extracted"
            assert sha256_file(install / app_member) == sha256_file(app)
            evidence["tests"]["real_packaged_payload_install_and_anchor"] = "PASS"

            # Same payload is an owned upgrade; created_root must be preserved.
            p2 = engine.prepare_and_copy_payload(
                str(install), str(zip_path), startup=False,
                anchor_key=test_key, run_key=run_key,
            )
            safety.write_uninstall_artifacts(
                str(install), p2["owned_files"], p2["owned_dirs"],
                app_name=engine.APP_NAME, created_root=p2["created_root"],
                anchor_key=test_key, run_key=run_key, shortcut_paths=[],
            )
            manifest2 = safety.load_manifest(str(install))
            safety.verify_install_anchor(str(install), manifest2, test_key)
            assert manifest2.get("created_root") is True, "Upgrade lost root ownership"
            evidence["tests"]["real_packaged_payload_upgrade"] = "PASS"

            # Refuse a collision before writes (no production/temp root is touched).
            foreign_tmp = install / (safety.UNINSTALL_CMD_FILENAME + ".tmp")
            foreign_tmp.write_bytes(b"foreign temp sentinel")
            owned_before = sha256_file(install / app_member)
            did_refuse = False
            try:
                engine.prepare_and_copy_payload(
                    str(install), str(zip_path), startup=False,
                    anchor_key=test_key, run_key=run_key,
                )
            except safety.InstallSafetyError:
                did_refuse = True
            assert did_refuse, "Upgrade did not reject foreign fixed temp"
            assert sha256_file(install / app_member) == owned_before
            assert foreign_tmp.read_bytes() == b"foreign temp sentinel"
            foreign_tmp.unlink()
            evidence["tests"]["foreign_temp_refused_without_payload_change"] = "PASS"

            # An unowned file under root must survive uninstall with recovery files.
            user_note = install / "user-note.txt"
            user_note.write_bytes(b"USER FILE MUST SURVIVE")
            result1 = safety.safe_uninstall(
                str(install), expected_app_name=engine.APP_NAME, anchor_key=test_key,
            )
            assert result1["exit_code"] == safety.EXIT_PARTIAL, result1
            assert user_note.read_bytes() == b"USER FILE MUST SURVIVE"
            assert (install / safety.MANIFEST_FILENAME).is_file()
            assert sha256_file(outsider) == outsider_before
            evidence["tests"]["uninstall_preserves_foreign_files_and_recovery"] = "PASS"

            # Removing only the *test-created* note allows safe retry.
            user_note.unlink()
            result2 = safety.safe_uninstall(
                str(install), expected_app_name=engine.APP_NAME, anchor_key=test_key,
            )
            assert result2["exit_code"] == safety.EXIT_OK, result2
            assert not install.exists(), "Owned temporary root should now be empty"
            assert sha256_file(outsider) == outsider_before
            evidence["tests"]["uninstall_retry_and_outside_sentinel"] = "PASS"

        # Key mismatch is a release blocker, not a failed integrity check.
        evidence["release_ready"] = bool(evidence["executable_name_match"]) and all(
            x == "PASS" for x in evidence["tests"].values()
        )
        evidence["release_gate"] = "PASS" if evidence["release_ready"] else "NO-GO: F02 executable name mismatch"
        print(json.dumps(evidence, ensure_ascii=False, indent=2), flush=True)
        return 0
    except Exception:
        evidence["probe_error"] = traceback.format_exc(limit=9)
        evidence["release_gate"] = "NO-GO: packaged probe failed"
        print(evidence["probe_error"], file=sys.stderr, flush=True)
        return 1
    finally:
        if test_key:
            try:
                from installer_safety import delete_test_anchor_key
                delete_test_anchor_key(test_key)
            except Exception:
                # This test runs only in an ephemeral GitHub-hosted Windows user.
                evidence["test_key_cleanup_warning"] = "Could not confirm HKCU test key removal"
        REPORT_PATH.write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def gate() -> int:
    if not REPORT_PATH.is_file():
        print("RELEASE NO-GO: packaged evidence file missing", flush=True)
        return 3
    e = json.loads(REPORT_PATH.read_text(encoding="utf-8"))
    print(e.get("release_gate"), flush=True)
    if not e.get("release_ready"):
        return 2
    # This does NOT certify GUI operation. A separate interactive VM gate remains.
    print("STATIC/BACKEND PACKAGE PROBE PASS; INTERACTIVE VM GATE STILL REQUIRED", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(gate() if len(sys.argv) > 1 and sys.argv[1] == "--gate" else probe())

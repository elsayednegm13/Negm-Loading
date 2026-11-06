# -*- coding: utf-8 -*-
r"""F03: TEST-ONLY sealing of an isolated staged install with an F01 anchor.

A payload extracted by legacy_stage is NOT an installed application: it has
neither a verified F01 manifest nor a safe uninstall script / HKCU anchor.
This module demonstrates how to prepare those safety artifacts without using
the product's real HKCU identity. It is deliberately NOT imported by Setup.exe,
does NOT hand over the legacy registry, launch an executable, change startup or
modify any shortcut.

Every call requires explicit opt-in and a *new*, disposable F01 test anchor
under Software\NegmLoadingF01Test\. Never broaden this gate for release.
"""
from __future__ import annotations

import hashlib
import os
import zipfile
from pathlib import Path

import installer_safety as safety
import legacy_migration as legacy
import legacy_data_compatibility as compat

CONSENT = "SEAL_NEW_STAGING_TEST_ONLY"


def _require_test_anchor(key):
    if (not isinstance(key, str)
            or not key.startswith(safety.TEST_ANCHOR_PREFIX)
            or not safety._safe_registry_key(key)):
        raise legacy.MigrationBlocked("F03 sealing requires a disposable HKCU test anchor")
    remainder = key[len(safety.TEST_ANCHOR_PREFIX):]
    if (not remainder or "\\" in remainder or "/" in remainder
            or remainder in (".", "..")):
        raise legacy.MigrationBlocked("F03 test anchor must be a unique direct child")


def _package_hashes(payload):
    files, _ = safety.list_zip_payload_paths(str(payload))
    if not files or len(files) > legacy.MAX_FILES:
        raise legacy.MigrationBlocked("Invalid staged payload inventory")
    expected = {}
    total = 0
    reserved = {
        safety.MANIFEST_FILENAME.casefold(),
        safety.UNINSTALL_CMD_FILENAME.casefold(),
        safety.UNINSTALL_PS1_FILENAME.casefold(),
    }
    with zipfile.ZipFile(payload) as archive:
        for item in archive.infolist():
            if item.is_dir():
                continue
            rel = safety.validate_relative_path(item.filename.replace("\\", "/"))
            key = rel.replace("\\", "/").casefold()
            if key in expected or key in reserved:
                raise legacy.MigrationBlocked("Duplicate or installer-owned payload path")
            total += item.file_size
            if total > legacy.MAX_BYTES:
                raise legacy.MigrationBlocked("Staged package exceeds size policy")
            digest = hashlib.sha256()
            with archive.open(item) as source:
                for part in iter(lambda: source.read(1024 * 1024), b""):
                    digest.update(part)
            expected[key] = {"path": rel.replace("\\", "/"),
                             "sha256": digest.hexdigest()}
    if safety.DEFAULT_APP_EXE_FILENAME.casefold() not in expected:
        raise legacy.MigrationBlocked("Staged payload has no expected EXE")
    return expected


def seal_staged_install_for_test(plan, backup_root, payload_zip, stage_root,
                                 test_anchor_key, *, consent=None,
                                 protector=None, registry_snapshot=None):
    """Prepare F01-safe uninstall of a new staged folder, under a TEST key.

    No user installation, real HKCU uninstall identity, real shortcut, or
    legacy script is changed. The source backup and old program must remain
    valid and unchanged immediately before any staging metadata is written.
    """
    if os.name != "nt":
        raise legacy.MigrationBlocked("F03 staged install sealing requires Windows")
    if consent != CONSENT:
        raise legacy.MigrationBlocked("F03 test sealing needs explicit opt-in")
    _require_test_anchor(test_anchor_key)
    import winreg

    protect = protector or legacy.WindowsDPAPI()
    backed_up = legacy.verify_backup(backup_root, protect)
    records = [{k: v for k, v in item.items() if k != "blob"}
               for item in backed_up["files"]]
    if (backed_up["roots"] != plan["roots"]
            or backed_up["registry"] != plan["registry"]
            or records != plan["files"]):
        raise legacy.MigrationBlocked("Backup is not the approved legacy snapshot")

    current_registry = registry_snapshot
    if current_registry is None:
        current_registry = legacy.read_legacy_registry(
            plan["registry"]["uninstall_key"], plan["registry"]["run_key"]
        )
    if current_registry != plan["registry"]:
        raise legacy.MigrationBlocked("Legacy HKCU data changed after backup")

    current_files = []
    for area, source_root in plan["roots"].items():
        current_files.extend(legacy._walk(source_root, area))
    current_files.sort(key=lambda item: (item["area"], item["relpath"]))
    if current_files != plan["files"]:
        raise legacy.MigrationBlocked("Legacy files changed after backup")
    compat.assess_user_data(plan)

    stage = Path(safety.validate_install_root(str(stage_root)))
    legacy._no_reparse_ancestors(stage)
    if not stage.is_dir():
        raise legacy.MigrationBlocked("Staging folder is missing")
    for protected_root in list(plan["roots"].values()) + [backup_root]:
        if legacy._inside(protected_root, stage) or legacy._inside(stage, protected_root):
            raise legacy.MigrationBlocked("Staging overlaps protected legacy data")

    payload = Path(os.path.abspath(payload_zip))
    legacy._no_reparse_ancestors(payload)
    legacy._checked_file(payload)
    expected = _package_hashes(payload)
    actual = legacy._walk(stage, "staging")
    if len(actual) != len(expected):
        raise legacy.MigrationBlocked("Unowned or missing file in staged install")
    for entry in actual:
        key = entry["relpath"].casefold()
        package = expected.get(key)
        if package is None or entry["sha256"] != package["sha256"]:
            raise legacy.MigrationBlocked("Staged file differs from new package")

    # The F01 helper permits an existing key if InstallLocation matches;
    # this migration preparation is stricter: a test anchor must be absent.
    try:
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, test_anchor_key,
                            0, winreg.KEY_READ):
            raise legacy.MigrationBlocked("F03 test anchor already exists")
    except FileNotFoundError:
        pass

    dirs = []
    for directory, children, _files in os.walk(stage, topdown=True, followlinks=False):
        for child in children:
            folder = Path(directory) / child
            legacy._no_reparse_ancestors(folder)
            rel = folder.relative_to(stage).as_posix()
            dirs.append(safety.validate_relative_path(rel))
    dirs.sort(key=lambda name: (name.count("/"), name))
    owned_files = [{"path": item["path"], "role": "payload"}
                   for item in expected.values()]
    safe_cmd = safety.write_uninstall_artifacts(
        str(stage), owned_files, dirs,
        app_name=safety.DEFAULT_APP_NAME,
        app_version="1.0.0",
        created_root=True,
        anchor_key=test_anchor_key,
        run_key=test_anchor_key + "\\Run",
        shortcut_paths=[],
    )
    manifest = safety.load_manifest(
        str(stage), expected_app_name=safety.DEFAULT_APP_NAME
    )
    safety.verify_install_anchor(str(stage), manifest, test_anchor_key)
    if (not manifest["created_root"]
            or len(manifest["files"]) != len(expected) + 2
            or not os.path.isfile(safe_cmd)):
        raise legacy.MigrationBlocked("Staged install sealing is incomplete")

    return {
        "status": "SEALED_WITH_DISPOSABLE_HKCU_TEST_ANCHOR_ONLY",
        "new_install_root": str(stage),
        "manifest_sha256": safety.manifest_fingerprint(manifest),
        "old_registry_unchanged": True,
        "shortcuts_untouched": True,
        "production_activation": False,
    }

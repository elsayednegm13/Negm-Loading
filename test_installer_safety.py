# -*- coding: utf-8 -*-
"""
Deterministic tests for F-01 safe uninstall / user-data protection.

Uses only temporary directories. Never touches a real install folder,
desktop shortcut, or uninstall registry key.
"""
from __future__ import annotations

import hashlib
import json
import os
import shutil
import stat
import subprocess
import sys
import tempfile
import unittest
import zipfile

import installer_engine
import installer_safety as safety


APP = safety.DEFAULT_APP_NAME


def _write(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    mode = "wb" if isinstance(data, bytes) else "w"
    with open(path, mode, encoding=None if isinstance(data, bytes) else "utf-8") as handle:
        handle.write(data)


def _sha(path):
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        digest.update(handle.read())
    return digest.hexdigest()


def _install_owned(root, mapping, created_root=False, extra_dirs=None):
    files = []
    dirs = list(extra_dirs or [])
    for rel, content in mapping.items():
        full = os.path.join(root, rel.replace("/", os.sep))
        _write(full, content)
        parent = os.path.relpath(os.path.dirname(full), root)
        if parent not in (".", ""):
            dirs.append(parent.replace("/", "\\"))
        files.append({"path": rel.replace("/", "\\"), "role": "payload"})
    safety.write_uninstall_artifacts(root, files, dirs, created_root=created_root)
    return files


def _try_junction(link, target):
    if os.name != "nt":
        return False
    os.makedirs(target, exist_ok=True)
    completed = subprocess.run(
        ["cmd", "/c", "mklink", "/J", link, target],
        capture_output=True,
        text=True,
    )
    return completed.returncode == 0 and os.path.lexists(link)


class TestPathValidation(unittest.TestCase):
    def test_rejects_traversal_absolute_unc_and_devices(self):
        bad = [
            "..\\escape",
            "foo\\..\\bar",
            "foo\\.",
            "C:\\Windows\\notepad.exe",
            "C:foo",
            "\\\\server\\share\\file",
            "/tmp/x",
            "\\Windows\\system32",
            "foo\\..\\..\\secret",
            "CON",
            "aux.txt",
            "foo:bar",
            "",
            "..",
            "a\\..\\b",
        ]
        for item in bad:
            with self.subTest(item=item):
                with self.assertRaises(safety.PathSafetyError):
                    safety.validate_relative_path(item)

    def test_accepts_normal_nested_relative_paths(self):
        self.assertEqual(safety.validate_relative_path("assets/negm.ico"), "assets\\negm.ico")
        self.assertEqual(safety.validate_relative_path("browser_extension\\manifest.json"),
                         "browser_extension\\manifest.json")

    def test_rejects_drive_root_and_unc_install_root(self):
        with self.assertRaises(safety.PathSafetyError):
            safety.validate_install_root("C:\\")
        with self.assertRaises(safety.PathSafetyError):
            safety.validate_install_root("\\\\server\\share\\Negm")

    def test_case_normalization_stays_inside_root(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = os.path.join(tmp, "Install")
            os.makedirs(root)
            owned = safety.resolve_owned_path(root, "Assets\\File.TXT")
            self.assertTrue(safety.is_within_root(root, owned))
            with self.assertRaises(safety.PathSafetyError):
                safety.validate_relative_path("Assets\\..\\..\\outside.txt")


class TestManifestTrust(unittest.TestCase):
    def test_missing_invalid_and_modified_manifest_fail_closed(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = os.path.join(tmp, "app")
            os.makedirs(root)
            user = os.path.join(root, "user-notes.txt")
            _write(user, "keep-me")
            before = _sha(user)

            result = safety.safe_uninstall(root)
            self.assertTrue(result["manual_cleanup"])
            self.assertEqual(_sha(user), before)
            self.assertTrue(os.path.isfile(user))

            _write(os.path.join(root, safety.MANIFEST_FILENAME), "{not-json")
            result = safety.safe_uninstall(root)
            self.assertTrue(result["manual_cleanup"])
            self.assertEqual(_sha(user), before)

            _write(os.path.join(root, safety.MANIFEST_FILENAME), json.dumps({
                "version": 1,
                "app_name": APP,
                "files": [{"path": "..\\secret.txt", "sha256": "ab" * 32, "size": 1}],
                "directories": [],
            }))
            result = safety.safe_uninstall(root)
            self.assertTrue(result["manual_cleanup"])
            self.assertEqual(_sha(user), before)

    def test_missing_owned_file_is_idempotent(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = os.path.join(tmp, "app")
            os.makedirs(root)
            _install_owned(root, {"app.exe": b"exe"})
            os.remove(os.path.join(root, "app.exe"))
            result = safety.safe_uninstall(root)
            self.assertIn("app.exe", result["missing"])
            self.assertFalse(os.path.isfile(os.path.join(root, "app.exe")))


class TestSafeUninstallOwnership(unittest.TestCase):
    def test_owned_files_removed_user_file_byte_identical(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = os.path.join(tmp, "shared folder")
            os.makedirs(root)
            user = os.path.join(root, "my homework.docx")
            payload = b"user-bytes-must-survive-exactly\n"
            _write(user, payload)
            _install_owned(root, {
                "Negm Lodaing.exe": b"app-binary",
                "assets\\negm.ico": b"ico",
            }, created_root=False, extra_dirs=["assets"])
            with open(user, "rb") as handle:
                before = handle.read()
            result = safety.safe_uninstall(root)
            with open(user, "rb") as handle:
                after = handle.read()
            self.assertEqual(before, after)
            self.assertEqual(before, payload)
            self.assertFalse(os.path.isfile(os.path.join(root, "Negm Lodaing.exe")))
            self.assertFalse(os.path.isfile(os.path.join(root, "assets", "negm.ico")))
            self.assertTrue(os.path.isdir(root))
            self.assertTrue(result["manual_cleanup"])

    def test_changed_owned_and_unknown_files_are_preserved(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = os.path.join(tmp, "app")
            os.makedirs(root)
            _install_owned(root, {
                "owned.txt": "original",
                "other-owned.txt": "same",
            })
            _write(os.path.join(root, "owned.txt"), "user-edited")
            unknown = os.path.join(root, "new-user-file.txt")
            _write(unknown, "appeared later")
            result = safety.safe_uninstall(root)
            self.assertTrue(os.path.isfile(os.path.join(root, "owned.txt")))
            with open(os.path.join(root, "owned.txt"), encoding="utf-8") as handle:
                self.assertEqual(handle.read(), "user-edited")
            self.assertTrue(os.path.isfile(unknown))
            self.assertFalse(os.path.isfile(os.path.join(root, "other-owned.txt")))
            self.assertIn("owned.txt", result["preserved"])

    def test_install_root_is_never_recursively_deleted(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = os.path.join(tmp, "Documents")
            os.makedirs(root)
            nested_user = os.path.join(root, "photos", "img.jpg")
            _write(nested_user, b"jpeg")
            _install_owned(root, {"app.bin": b"x"}, created_root=False)
            safety.safe_uninstall(root)
            self.assertTrue(os.path.isdir(root))
            self.assertTrue(os.path.isfile(nested_user))
            with open(nested_user, "rb") as handle:
                self.assertEqual(handle.read(), b"jpeg")


class TestTraversalAndReparse(unittest.TestCase):
    def test_manifest_escape_paths_cannot_delete_outside(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = os.path.join(tmp, "root")
            outside = os.path.join(tmp, "outside")
            os.makedirs(root)
            os.makedirs(outside)
            secret = os.path.join(outside, "secret.txt")
            _write(secret, "do-not-delete")
            before = _sha(secret)
            _install_owned(root, {"ok.txt": "v"})
            manifest_path = os.path.join(root, safety.MANIFEST_FILENAME)
            with open(manifest_path, encoding="utf-8") as handle:
                data = json.loads(handle.read())
            data["files"].append({
                "path": "..\\outside\\secret.txt",
                "sha256": before,
                "size": 13,
                "role": "payload",
            })
            with open(manifest_path, "w", encoding="utf-8") as handle:
                json.dump(data, handle)
            result = safety.safe_uninstall(root)
            self.assertTrue(result["manual_cleanup"])
            self.assertTrue(os.path.isfile(secret))
            self.assertEqual(_sha(secret), before)

    def test_absolute_and_unc_manifest_entries_are_ignored(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = os.path.join(tmp, "root")
            os.makedirs(root)
            victim = os.path.join(tmp, "victim.txt")
            _write(victim, "alive")
            _install_owned(root, {"ok.txt": "v"})
            manifest_path = os.path.join(root, safety.MANIFEST_FILENAME)
            with open(manifest_path, encoding="utf-8") as handle:
                data = json.loads(handle.read())
            data["files"] = [
                {"path": victim, "sha256": _sha(victim), "size": 5},
                {"path": "\\\\server\\share\\x", "sha256": "ab" * 32, "size": 1},
            ]
            with open(manifest_path, "w", encoding="utf-8") as handle:
                json.dump(data, handle)
            safety.safe_uninstall(root)
            self.assertTrue(os.path.isfile(victim))
            with open(victim, encoding="utf-8") as handle:
                self.assertEqual(handle.read(), "alive")

    def test_junction_cannot_redirect_deletion_outside_root(self):
        if os.name != "nt":
            self.skipTest("Windows junction test")
        with tempfile.TemporaryDirectory() as tmp:
            root = os.path.join(tmp, "root")
            outside = os.path.join(tmp, "outside")
            os.makedirs(root)
            os.makedirs(outside)
            secret = os.path.join(outside, "secret.txt")
            _write(secret, "junction-target")
            before = _sha(secret)
            link = os.path.join(root, "escape")
            if not _try_junction(link, outside):
                self.skipTest("could not create directory junction")
            _install_owned(root, {"ok.txt": "v"})
            manifest_path = os.path.join(root, safety.MANIFEST_FILENAME)
            with open(manifest_path, encoding="utf-8") as handle:
                data = json.loads(handle.read())
            data["files"].append({
                "path": "escape\\secret.txt",
                "sha256": before,
                "size": os.path.getsize(secret),
                "role": "payload",
            })
            with open(manifest_path, "w", encoding="utf-8") as handle:
                json.dump(data, handle)
            safety.safe_uninstall(root)
            self.assertTrue(os.path.isfile(secret))
            self.assertEqual(_sha(secret), before)
            self.assertTrue(os.path.lexists(link))

    def test_symlink_file_redirection_is_preserved(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = os.path.join(tmp, "root")
            os.makedirs(root)
            outside = os.path.join(tmp, "outside.txt")
            _write(outside, "link-target")
            link = os.path.join(root, "owned.txt")
            try:
                os.symlink(outside, link)
            except OSError:
                self.skipTest("symlink creation requires privilege or Developer Mode")
            files = [{"path": "owned.txt", "role": "payload"}]
            # Manifest hash of the target would match if followed; write a fake regular-file inventory.
            payload = {
                "version": 1,
                "app_name": APP,
                "app_version": "1.0.0",
                "created_root": False,
                "created_utc": "2026-01-01T00:00:00Z",
                "files": [{
                    "path": "owned.txt",
                    "sha256": _sha(outside),
                    "size": os.path.getsize(outside),
                    "role": "payload",
                }],
                "directories": [],
            }
            with open(os.path.join(root, safety.MANIFEST_FILENAME), "w", encoding="utf-8") as handle:
                json.dump(payload, handle)
            safety.safe_uninstall(root)
            self.assertTrue(os.path.isfile(outside))
            self.assertEqual(open(outside, encoding="utf-8").read(), "link-target")
            self.assertTrue(os.path.lexists(link))


class TestIdempotencyAndPartial(unittest.TestCase):
    def test_repeated_uninstall_leaves_user_files(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = os.path.join(tmp, "app")
            os.makedirs(root)
            user = os.path.join(root, "keep.txt")
            _write(user, "stay")
            _install_owned(root, {"app.exe": b"x"})
            first = safety.safe_uninstall(root)
            second = safety.safe_uninstall(root)
            third = safety.safe_uninstall(root)
            self.assertTrue(os.path.isfile(user))
            with open(user, encoding="utf-8") as handle:
                self.assertEqual(handle.read(), "stay")
            self.assertTrue(first["manual_cleanup"])
            self.assertTrue(second["manual_cleanup"])
            self.assertTrue(third["manual_cleanup"])

    def test_partial_install_without_manifest_does_not_guess_names(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = os.path.join(tmp, "app")
            os.makedirs(root)
            lookalike = os.path.join(root, "Negm Lodaing.exe")
            user = os.path.join(root, "notes.txt")
            _write(lookalike, b"maybe-app-or-user")
            _write(user, "notes")
            result = safety.safe_uninstall(root)
            self.assertTrue(result["manual_cleanup"])
            self.assertTrue(os.path.isfile(lookalike))
            self.assertTrue(os.path.isfile(user))

    def test_existing_nonempty_folder_without_manifest_refuses_install(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = os.path.join(tmp, "app")
            os.makedirs(root)
            _write(os.path.join(root, "preexisting.txt"), "mine")
            with self.assertRaises(safety.InstallSafetyError):
                safety.assess_destination(root, ["Negm Lodaing.exe"])
            self.assertTrue(os.path.isfile(os.path.join(root, "preexisting.txt")))


class TestGeneratedUninstaller(unittest.TestCase):
    def test_generated_scripts_have_no_recursive_root_delete_or_python(self):
        cmd = safety.generate_uninstall_cmd()
        ps1 = safety._powershell_uninstaller(APP)
        for text in (cmd, ps1):
            self.assertFalse(safety.script_contains_forbidden_deletion(text))
            self.assertNotIn("python", text.lower())
            self.assertNotIn("rd /s /q", text.lower())
            self.assertNotIn("Remove-Item -Recurse", text)
        self.assertIn("%~dp0", cmd)
        self.assertIn('taskkill /F /IM "%s.exe"' % APP, cmd)
        desktop_del = 'del /f /q "%USERPROFILE%\\Desktop\\' + APP + '.lnk"'
        self.assertIn(desktop_del, cmd)

    def test_generated_script_does_not_embed_untrusted_dest(self):
        evil = r'C:\Users\Public\my folder & calc.exe & echo "'
        cmd = safety.generate_uninstall_cmd()
        self.assertNotIn(evil, cmd)
        self.assertNotIn("calc.exe", cmd)
        self.assertIn('"%~dp0' + safety.UNINSTALL_PS1_FILENAME + '"', cmd)

    def test_path_with_spaces_windows_ps1_preserves_user_file(self):
        if os.name != "nt":
            self.skipTest("Windows packaged-style uninstall helper")
        with tempfile.TemporaryDirectory() as tmp:
            root = os.path.join(tmp, "Negm Lodaing Install")
            os.makedirs(root)
            user = os.path.join(root, "user file.txt")
            _write(user, "space-path-payload")
            _install_owned(root, {
                "Negm Lodaing.exe": b"bin",
                "assets\\readme.txt": "docs",
            }, extra_dirs=["assets"])
            ps1 = os.path.join(root, safety.UNINSTALL_PS1_FILENAME)
            self.assertTrue(os.path.isfile(ps1))
            completed = subprocess.run(
                [
                    os.path.join(os.environ.get("SystemRoot", r"C:\Windows"),
                                 r"System32\WindowsPowerShell\v1.0\powershell.exe"),
                    "-NoProfile",
                    "-ExecutionPolicy", "Bypass",
                    "-File", ps1,
                ],
                capture_output=True,
                text=True,
            )
            self.assertNotEqual(completed.returncode, 1)
            self.assertTrue(os.path.isfile(user))
            with open(user, encoding="utf-8") as handle:
                self.assertEqual(handle.read(), "space-path-payload")
            self.assertFalse(os.path.isfile(os.path.join(root, "Negm Lodaing.exe")))
            if os.path.isfile(ps1):
                with open(ps1, encoding="utf-8-sig") as handle:
                    self.assertNotIn("python", handle.read().lower())

    def test_engine_source_no_longer_emits_recursive_delete(self):
        engine_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "installer_engine.py")
        with open(engine_path, encoding="utf-8") as handle:
            source = handle.read()
        self.assertNotIn('rd /s /q "{dest}"', source)
        self.assertNotIn("rd /s /q", source)
        self.assertNotIn("shutil.rmtree", source)


class TestZipAndUpgradeSafety(unittest.TestCase):
    def test_zip_slip_is_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            zpath = os.path.join(tmp, "payload.zip")
            root = os.path.join(tmp, "dest")
            os.makedirs(root)
            with zipfile.ZipFile(zpath, "w") as archive:
                archive.writestr("../outside.txt", "nope")
            with self.assertRaises(safety.PathSafetyError):
                safety.list_zip_payload_paths(zpath)
            with self.assertRaises(safety.PathSafetyError):
                safety.safe_extract_zip(zpath, root)
            self.assertFalse(os.path.isfile(os.path.join(tmp, "outside.txt")))

    def test_safe_extract_records_inventory_and_refuses_unknown_collision(self):
        with tempfile.TemporaryDirectory() as tmp:
            zpath = os.path.join(tmp, "payload.zip")
            root = os.path.join(tmp, "dest")
            os.makedirs(root)
            _write(os.path.join(root, "app.exe"), "user-owned-same-name")
            with zipfile.ZipFile(zpath, "w") as archive:
                archive.writestr("app.exe", "installer-copy")
                archive.writestr("assets/a.txt", "a")
            planned, _dirs = safety.list_zip_payload_paths(zpath)
            with self.assertRaises(safety.InstallSafetyError):
                safety.assess_destination(root, planned)
            with open(os.path.join(root, "app.exe"), encoding="utf-8") as handle:
                self.assertEqual(handle.read(), "user-owned-same-name")


class TestEngineIntegration(unittest.TestCase):
    def test_engine_constants_and_safety_import(self):
        self.assertEqual(installer_engine.APP_NAME, APP)
        self.assertTrue(hasattr(installer_engine, "write_safe_uninstaller"))
        self.assertTrue(callable(getattr(installer_engine, "write_safe_uninstaller")))

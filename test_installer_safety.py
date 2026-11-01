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


_OPEN_KEYS = []


def _install_owned(root, mapping, created_root=False, extra_dirs=None, shortcut_paths=None):
    key = safety.make_test_anchor_key()
    files = []
    dirs = list(extra_dirs or [])
    for rel, content in mapping.items():
        full = os.path.join(root, rel.replace("/", os.sep))
        _write(full, content)
        parent = os.path.relpath(os.path.dirname(full), root)
        if parent not in (".", ""):
            dirs.append(parent.replace("/", "\\"))
        files.append({"path": rel.replace("/", "\\"), "role": "payload"})
    safety.write_uninstall_artifacts(
        root,
        files,
        dirs,
        created_root=created_root,
        anchor_key=key,
        run_key=key + "\\Run",
        shortcut_paths=[] if shortcut_paths is None else list(shortcut_paths),
    )
    _OPEN_KEYS.append(key)
    return key


def tearDownModule():
    for key in list(_OPEN_KEYS):
        try:
            safety.delete_test_anchor_key(key)
        except Exception:
            pass
    if os.name == "nt":
        import winreg
        try:
            winreg.DeleteKey(winreg.HKEY_CURRENT_USER, "Software\\NegmLoadingF01Test")
        except OSError:
            pass


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
            key = _install_owned(root, {"app.exe": b"exe"})
            os.remove(os.path.join(root, "app.exe"))
            result = safety.safe_uninstall(root, anchor_key=key)
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
            key = _install_owned(root, {
                "Negm Lodaing.exe": b"app-binary",
                "assets\\negm.ico": b"ico",
            }, created_root=False, extra_dirs=["assets"])
            with open(user, "rb") as handle:
                before = handle.read()
            result = safety.safe_uninstall(root, anchor_key=key)
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
            key = _install_owned(root, {
                "owned.txt": "original",
                "other-owned.txt": "same",
            })
            _write(os.path.join(root, "owned.txt"), "user-edited")
            unknown = os.path.join(root, "new-user-file.txt")
            _write(unknown, "appeared later")
            result = safety.safe_uninstall(root, anchor_key=key)
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
            key = _install_owned(root, {"app.bin": b"x"}, created_root=False)
            safety.safe_uninstall(root, anchor_key=key)
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
            key = _install_owned(root, {"ok.txt": "v"})
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
            result = safety.safe_uninstall(root, anchor_key=key)
            self.assertTrue(result["manual_cleanup"])
            self.assertTrue(os.path.isfile(secret))
            self.assertEqual(_sha(secret), before)

    def test_absolute_and_unc_manifest_entries_are_ignored(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = os.path.join(tmp, "root")
            os.makedirs(root)
            victim = os.path.join(tmp, "victim.txt")
            _write(victim, "alive")
            key = _install_owned(root, {"ok.txt": "v"})
            manifest_path = os.path.join(root, safety.MANIFEST_FILENAME)
            with open(manifest_path, encoding="utf-8") as handle:
                data = json.loads(handle.read())
            data["files"] = [
                {"path": victim, "sha256": _sha(victim), "size": 5},
                {"path": "\\\\server\\share\\x", "sha256": "ab" * 32, "size": 1},
            ]
            with open(manifest_path, "w", encoding="utf-8") as handle:
                json.dump(data, handle)
            safety.safe_uninstall(root, anchor_key=key)
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
            key = _install_owned(root, {"ok.txt": "v"})
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
            safety.safe_uninstall(root, anchor_key=key)
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
            key = safety.make_test_anchor_key()
            _OPEN_KEYS.append(key)
            safety.write_install_anchor(root, key)
            safety.safe_uninstall(root, anchor_key=key)
            self.assertTrue(os.path.isfile(outside))
            with open(outside, encoding="utf-8") as handle:
                self.assertEqual(handle.read(), "link-target")
            self.assertTrue(os.path.lexists(link))


class TestIdempotencyAndPartial(unittest.TestCase):
    def test_repeated_uninstall_leaves_user_files(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = os.path.join(tmp, "app")
            os.makedirs(root)
            user = os.path.join(root, "keep.txt")
            _write(user, "stay")
            key = _install_owned(root, {"app.exe": b"x"})
            first = safety.safe_uninstall(root, anchor_key=key)
            second = safety.safe_uninstall(root, anchor_key=key)
            third = safety.safe_uninstall(root, anchor_key=key)
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
        self.assertNotIn("taskkill", cmd.lower())
        self.assertNotIn("%USERPROFILE%", cmd)
        self.assertNotIn("reg delete", cmd.lower())
        self.assertLess(cmd.find('if "%EC%"=="0"'), cmd.find("del /f /q"))
        self.assertIn(safety.DEFAULT_UNINSTALL_KEY, ps1)
        self.assertIn("InstallAnchor", ps1)
        self.assertIn("Exit code 2", ps1)
        self.assertIn("Exit code 3", ps1)

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
            key = _install_owned(root, {
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
            self.assertEqual(completed.returncode, safety.EXIT_PARTIAL, completed.stdout + "\n" + completed.stderr)
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


def _powershell_exe():
    return os.path.join(os.environ.get("SystemRoot", r"C:\Windows"),
                        r"System32\WindowsPowerShell\v1.0\powershell.exe")


def _run_uninstall_cmd(root):
    cmd = os.path.join(root, safety.UNINSTALL_CMD_FILENAME)
    return subprocess.run(["cmd.exe", "/c", cmd], cwd=root, capture_output=True, text=True)


def _make_shortcut(path, target):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    env = os.environ.copy()
    env["F01_LNK"] = path
    env["F01_TGT"] = target
    completed = subprocess.run(
        [_powershell_exe(), "-NoProfile", "-Command",
         "$s=New-Object -ComObject WScript.Shell; "
         "$l=$s.CreateShortcut($env:F01_LNK); "
         "$l.TargetPath=$env:F01_TGT; $l.Save()"],
        env=env, capture_output=True, text=True,
    )
    if completed.returncode != 0 or not os.path.isfile(path):
        raise AssertionError(completed.stdout + completed.stderr)


def _lock_exclusive(path):
    import ctypes
    kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
    kernel32.CreateFileW.argtypes = [
        ctypes.c_wchar_p, ctypes.c_uint32, ctypes.c_uint32, ctypes.c_void_p,
        ctypes.c_uint32, ctypes.c_uint32, ctypes.c_void_p,
    ]
    kernel32.CreateFileW.restype = ctypes.c_void_p
    handle = kernel32.CreateFileW(path, 0x80000000, 0, None, 3, 0x80, None)
    invalid = ctypes.c_void_p(-1).value
    if not handle or handle == invalid:
        raise OSError(ctypes.get_last_error(), "CreateFileW failed")
    return handle


def _unlock(handle):
    import ctypes
    ctypes.windll.kernel32.CloseHandle(ctypes.c_void_p(handle))


class TestWindowsUninstallChain(unittest.TestCase):
    def test_cmd_missing_helper_exits_2_and_keeps_inventory(self):
        if os.name != "nt":
            self.skipTest("Windows uninstall.cmd chain")
        with tempfile.TemporaryDirectory() as tmp:
            root = os.path.join(tmp, "Negm Lodaing Install")
            os.makedirs(root)
            user = os.path.join(root, "user file.txt")
            _write(user, "keep")
            _install_owned(root, {"owned.exe": b"owned"})
            os.remove(os.path.join(root, safety.UNINSTALL_PS1_FILENAME))
            proc = _run_uninstall_cmd(root)
            self.assertEqual(proc.returncode, safety.EXIT_VERIFY_FAILED, proc.stdout + proc.stderr)
            self.assertEqual(open(user, encoding="utf-8").read(), "keep")
            self.assertTrue(os.path.isfile(os.path.join(root, "owned.exe")))
            self.assertTrue(os.path.isfile(os.path.join(root, safety.MANIFEST_FILENAME)))
            self.assertTrue(os.path.isfile(os.path.join(root, safety.UNINSTALL_CMD_FILENAME)))

    def test_cmd_corrupt_manifest_keeps_recovery(self):
        if os.name != "nt":
            self.skipTest("Windows uninstall.cmd chain")
        with tempfile.TemporaryDirectory() as tmp:
            root = os.path.join(tmp, "app folder")
            os.makedirs(root)
            user = os.path.join(root, "notes.txt")
            _write(user, "notes")
            _install_owned(root, {"owned.exe": b"owned"})
            _write(os.path.join(root, safety.MANIFEST_FILENAME), "{not-json")
            proc = _run_uninstall_cmd(root)
            self.assertEqual(proc.returncode, safety.EXIT_VERIFY_FAILED, proc.stdout + proc.stderr)
            self.assertEqual(open(user, encoding="utf-8").read(), "notes")
            self.assertTrue(os.path.isfile(os.path.join(root, "owned.exe")))
            self.assertTrue(os.path.isfile(os.path.join(root, safety.UNINSTALL_PS1_FILENAME)))
            self.assertTrue(os.path.isfile(os.path.join(root, safety.UNINSTALL_CMD_FILENAME)))

    def test_cmd_spoofed_user_file_hash_deletes_nothing(self):
        if os.name != "nt":
            self.skipTest("Windows uninstall.cmd chain")
        with tempfile.TemporaryDirectory() as tmp:
            root = os.path.join(tmp, "Negm Lodaing Install")
            os.makedirs(root)
            outside = os.path.join(tmp, "outside.txt")
            user = os.path.join(root, "user file.txt")
            _write(outside, "outside-bytes")
            _write(user, "user-bytes")
            _install_owned(root, {"owned.exe": b"owned"})
            manifest_path = os.path.join(root, safety.MANIFEST_FILENAME)
            with open(manifest_path, encoding="utf-8") as handle:
                data = json.loads(handle.read())
            data["files"].append({
                "path": "user file.txt",
                "sha256": _sha(user),
                "size": os.path.getsize(user),
                "role": "payload",
            })
            with open(manifest_path, "w", encoding="utf-8") as handle:
                json.dump(data, handle)
            proc = _run_uninstall_cmd(root)
            self.assertEqual(proc.returncode, safety.EXIT_VERIFY_FAILED, proc.stdout + proc.stderr)
            self.assertEqual(open(user, encoding="utf-8").read(), "user-bytes")
            self.assertEqual(open(outside, encoding="utf-8").read(), "outside-bytes")
            self.assertTrue(os.path.isfile(os.path.join(root, "owned.exe")))
            self.assertTrue(os.path.isfile(manifest_path))
            self.assertTrue(os.path.isfile(os.path.join(root, safety.UNINSTALL_PS1_FILENAME)))
            self.assertTrue(os.path.isfile(os.path.join(root, safety.UNINSTALL_CMD_FILENAME)))

    def test_cmd_modified_file_and_repeat_keep_recovery(self):
        if os.name != "nt":
            self.skipTest("Windows uninstall.cmd chain")
        with tempfile.TemporaryDirectory() as tmp:
            root = os.path.join(tmp, "Negm Lodaing Install")
            os.makedirs(root)
            user = os.path.join(root, "user file.txt")
            _write(user, "stay-put")
            shortcut = os.path.join(tmp, "links", "app.lnk")
            _install_owned(root, {"owned.exe": b"owned", "other.exe": b"other"}, shortcut_paths=[shortcut])
            _make_shortcut(shortcut, os.path.join(root, "owned.exe"))
            _write(os.path.join(root, "owned.exe"), b"user-changed")
            proc = _run_uninstall_cmd(root)
            self.assertEqual(proc.returncode, safety.EXIT_PARTIAL, proc.stdout + proc.stderr)
            self.assertEqual(open(os.path.join(root, "owned.exe"), "rb").read(), b"user-changed")
            self.assertFalse(os.path.isfile(os.path.join(root, "other.exe")))
            self.assertEqual(open(user, encoding="utf-8").read(), "stay-put")
            self.assertTrue(os.path.isfile(shortcut))
            self.assertTrue(os.path.isfile(os.path.join(root, safety.MANIFEST_FILENAME)))
            self.assertTrue(os.path.isfile(os.path.join(root, safety.UNINSTALL_PS1_FILENAME)))
            again = _run_uninstall_cmd(root)
            self.assertEqual(again.returncode, safety.EXIT_PARTIAL, again.stdout + again.stderr)
            self.assertEqual(open(user, encoding="utf-8").read(), "stay-put")
            self.assertTrue(os.path.isfile(os.path.join(root, safety.UNINSTALL_CMD_FILENAME)))

    def test_cmd_locked_file_keeps_recovery(self):
        if os.name != "nt":
            self.skipTest("Windows uninstall.cmd chain")
        with tempfile.TemporaryDirectory() as tmp:
            root = os.path.join(tmp, "app folder")
            os.makedirs(root)
            _install_owned(root, {"owned.exe": b"owned-bytes"})
            handle = _lock_exclusive(os.path.join(root, "owned.exe"))
            try:
                proc = _run_uninstall_cmd(root)
            finally:
                _unlock(handle)
            self.assertEqual(proc.returncode, safety.EXIT_PARTIAL, proc.stdout + proc.stderr)
            self.assertEqual(open(os.path.join(root, "owned.exe"), "rb").read(), b"owned-bytes")
            self.assertTrue(os.path.isfile(os.path.join(root, safety.MANIFEST_FILENAME)))
            self.assertTrue(os.path.isfile(os.path.join(root, safety.UNINSTALL_PS1_FILENAME)))
            self.assertTrue(os.path.isfile(os.path.join(root, safety.UNINSTALL_CMD_FILENAME)))

    def test_cmd_success_preserves_outside_data_and_foreign_records(self):
        if os.name != "nt":
            self.skipTest("Windows uninstall.cmd chain")
        import winreg
        with tempfile.TemporaryDirectory() as tmp:
            root = os.path.join(tmp, "Negm Lodaing Install")
            os.makedirs(root)
            outside = os.path.join(tmp, "outside.txt")
            _write(outside, "do-not-touch")
            inside_lnk = os.path.join(tmp, "links", "inside.lnk")
            outside_lnk = os.path.join(tmp, "links", "outside.lnk")
            key = _install_owned(
                root,
                {"owned.exe": b"payload"},
                created_root=True,
                shortcut_paths=[inside_lnk, outside_lnk],
            )
            _make_shortcut(inside_lnk, os.path.join(root, "owned.exe"))
            _make_shortcut(outside_lnk, outside)
            foreign = safety.make_test_anchor_key()
            _OPEN_KEYS.append(foreign)
            with winreg.CreateKey(winreg.HKEY_CURRENT_USER, foreign) as reg:
                winreg.SetValueEx(reg, "Marker", 0, winreg.REG_SZ, "other-install")
            proc = _run_uninstall_cmd(root)
            self.assertEqual(proc.returncode, safety.EXIT_OK, proc.stdout + proc.stderr)
            self.assertFalse(os.path.isfile(os.path.join(root, "owned.exe")))
            self.assertEqual(open(outside, encoding="utf-8").read(), "do-not-touch")
            self.assertFalse(os.path.isfile(inside_lnk))
            self.assertTrue(os.path.isfile(outside_lnk))
            with winreg.OpenKey(winreg.HKEY_CURRENT_USER, foreign) as reg:
                self.assertEqual(winreg.QueryValueEx(reg, "Marker")[0], "other-install")
            with self.assertRaises(OSError):
                winreg.OpenKey(winreg.HKEY_CURRENT_USER, key)

    def test_stub_powershell_failure_does_not_delete_helper(self):
        if os.name != "nt":
            self.skipTest("Windows uninstall.cmd chain")
        with tempfile.TemporaryDirectory() as tmp:
            root = os.path.join(tmp, "app folder")
            os.makedirs(root)
            user = os.path.join(root, "user.txt")
            _write(user, "keep")
            _install_owned(root, {"owned.exe": b"x"})
            _write(os.path.join(root, safety.UNINSTALL_PS1_FILENAME), "Write-Host 'forced'\nexit 2\n")
            proc = _run_uninstall_cmd(root)
            self.assertEqual(proc.returncode, safety.EXIT_VERIFY_FAILED, proc.stdout + proc.stderr)
            self.assertTrue(os.path.isfile(os.path.join(root, safety.UNINSTALL_PS1_FILENAME)))
            self.assertTrue(os.path.isfile(os.path.join(root, safety.UNINSTALL_CMD_FILENAME)))
            self.assertEqual(open(user, encoding="utf-8").read(), "keep")
            self.assertTrue(os.path.isfile(os.path.join(root, "owned.exe")))

    def test_shared_root_is_not_removed_after_full_payload_removal(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = os.path.join(tmp, "shared")
            os.makedirs(root)
            key = _install_owned(root, {"owned.exe": b"x"}, created_root=False)
            result = safety.safe_uninstall(root, anchor_key=key)
            self.assertEqual(result["exit_code"], safety.EXIT_OK)
            self.assertFalse(result["root_removed"])
            self.assertTrue(os.path.isdir(root))
            self.assertFalse(os.path.isfile(os.path.join(root, "owned.exe")))

    def test_post_install_junction_swap_preserves_target(self):
        if os.name != "nt":
            self.skipTest("Windows junction test")
        content = b"same-bytes"
        with tempfile.TemporaryDirectory() as tmp:
            root = os.path.join(tmp, "root")
            outside = os.path.join(tmp, "outside")
            os.makedirs(root)
            os.makedirs(outside)
            key = _install_owned(root, {"sub\\file.txt": content}, extra_dirs=["sub"])
            shutil.rmtree(os.path.join(root, "sub"))
            if not _try_junction(os.path.join(root, "sub"), outside):
                self.skipTest("could not create directory junction")
            _write(os.path.join(outside, "file.txt"), content)
            before = _sha(os.path.join(outside, "file.txt"))
            result = safety.safe_uninstall(root, anchor_key=key)
            self.assertEqual(_sha(os.path.join(outside, "file.txt")), before)
            self.assertTrue(os.path.lexists(os.path.join(root, "sub")))
            self.assertEqual(result["exit_code"], safety.EXIT_PARTIAL)
            self.assertTrue(os.path.isfile(os.path.join(root, safety.MANIFEST_FILENAME)))
            self.assertTrue(os.path.isfile(os.path.join(root, safety.UNINSTALL_PS1_FILENAME)))

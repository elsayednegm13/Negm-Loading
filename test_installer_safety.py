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


class TestF02ExecutableName(unittest.TestCase):
    def test_executable_filename_matches_build_and_payload(self):
        # Display name stays stable for HKCU, shortcuts and prior manifests.
        self.assertEqual(installer_engine.APP_NAME, "Negm Lodaing")
        self.assertEqual(installer_engine.APP_EXE_FILENAME, "NegmLoading.exe")
        self.assertEqual(safety.DEFAULT_APP_EXE_FILENAME, installer_engine.APP_EXE_FILENAME)
        script = safety._powershell_uninstaller(installer_engine.APP_NAME)
        self.assertIn("$AppExeName = 'NegmLoading.exe'", script)
        self.assertNotIn("__APP_EXE_FILENAME__", script)
        from pathlib import Path
        root = Path(__file__).resolve().parent
        build_spec = (root / "NegmLoading.spec").read_text(encoding="utf-8")
        packaging = (root / "make_installer_package.py").read_text(encoding="utf-8")
        self.assertIn("name='NegmLoading'", build_spec)
        self.assertIn('z.write(exe_path, "NegmLoading.exe")', packaging)

    def test_finish_install_launches_packaged_executable(self):
        from unittest import mock
        from types import SimpleNamespace

        with tempfile.TemporaryDirectory() as root:
            exe = os.path.join(root, installer_engine.APP_EXE_FILENAME)
            _write(exe, b"test executable placeholder")
            wizard = SimpleNamespace(
                chk_launch=SimpleNamespace(get=lambda: True),
                install_dir=SimpleNamespace(get=lambda: root),
                destroy=mock.Mock(),
            )
            with mock.patch.object(installer_engine.subprocess, "Popen") as popen:
                installer_engine.SetupWizard.finish_install(wizard)
            popen.assert_called_once()
            self.assertEqual(popen.call_args.args[0], [exe])
            wizard.destroy.assert_called_once_with()

    def test_finish_install_does_not_launch_missing_executable(self):
        from unittest import mock
        from types import SimpleNamespace

        with tempfile.TemporaryDirectory() as root:
            wizard = SimpleNamespace(
                chk_launch=SimpleNamespace(get=lambda: True),
                install_dir=SimpleNamespace(get=lambda: root),
                destroy=mock.Mock(),
            )
            with mock.patch.object(installer_engine.subprocess, "Popen") as popen:
                installer_engine.SetupWizard.finish_install(wizard)
            popen.assert_not_called()
            wizard.destroy.assert_called_once_with()


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
        self.assertNotIn("del /f /q", cmd.lower())
        self.assertNotIn("EnableDelayedExpansion", cmd)
        self.assertIn('if "%EC%"=="0" goto Announce', cmd)
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
            with self.assertRaises(safety.InstallSafetyError):
                safety.safe_extract_zip(zpath, root)
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
    # cmd.exe /s preserves quotes when the path contains & or parentheses.
    command = 'cmd.exe /s /c ""%s""' % cmd
    return subprocess.run(command, cwd=root, capture_output=True, text=True)


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


def _customize_shortcut(path):
    env = os.environ.copy()
    env["F01_LNK"] = path
    completed = subprocess.run(
        [_powershell_exe(), "-NoProfile", "-Command",
         "$s=New-Object -ComObject WScript.Shell; "
         "$l=$s.CreateShortcut($env:F01_LNK); "
         "$l.Description='user-custom-description'; "
         "$l.Arguments='--user-flag'; "
         "$l.IconLocation='C:\\Windows\\System32\\notepad.exe,0'; "
         "$l.Save()"],
        env=env, capture_output=True, text=True,
    )
    if completed.returncode != 0:
        raise AssertionError(completed.stdout + completed.stderr)


def _retarget_shortcut(path, target):
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
    if completed.returncode != 0:
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
            _make_shortcut(inside_lnk, os.path.join(root, "owned.exe"))
            _make_shortcut(outside_lnk, outside)
            key = _install_owned(
                root,
                {"owned.exe": b"payload"},
                created_root=True,
                shortcut_paths=[inside_lnk, outside_lnk],
            )
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

    def test_cmd_does_not_kill_foreign_process_inside_root(self):
        if os.name != "nt":
            self.skipTest("Windows uninstall.cmd chain")
        system_root = os.environ.get("SystemRoot")
        source = os.path.join(system_root or r"C:\Windows", "System32", "cmd.exe")
        if not os.path.isfile(source):
            self.skipTest("cmd.exe was not available to spawn a synthetic process")
        with tempfile.TemporaryDirectory() as tmp:
            root = os.path.join(tmp, "Negm Lodaing Install")
            os.makedirs(root)
            _install_owned(root, {"owned.exe": b"payload"})
            foreign = os.path.join(root, "foreign-tool.exe")
            shutil.copyfile(source, foreign)
            child = subprocess.Popen(
                [foreign, "/d", "/c", "ping -n 30 127.0.0.1 >nul"],
                cwd=tmp,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            try:
                self.assertIsNone(child.poll())
                proc = _run_uninstall_cmd(root)
                self.assertIsNone(child.poll(), "a foreign process inside the install root was terminated")
                self.assertEqual(proc.returncode, safety.EXIT_PARTIAL, proc.stdout + proc.stderr)
                self.assertFalse(os.path.isfile(os.path.join(root, "owned.exe")))
                self.assertTrue(os.path.isfile(foreign))
                self.assertTrue(os.path.isfile(os.path.join(root, safety.UNINSTALL_PS1_FILENAME)))
            finally:
                subprocess.run(
                    ["taskkill", "/F", "/T", "/PID", str(child.pid)],
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                )
                child.wait(timeout=10)

    def test_cmd_final_cleanup_failure_is_not_success(self):
        if os.name != "nt":
            self.skipTest("Windows uninstall.cmd chain")
        with tempfile.TemporaryDirectory() as tmp:
            root = os.path.join(tmp, "Negm Lodaing Install")
            os.makedirs(root)
            link = os.path.join(tmp, "links", "owned.lnk")
            _make_shortcut(link, os.path.join(root, "owned.exe"))
            key = _install_owned(root, {"owned.exe": b"payload"}, shortcut_paths=[link])
            locked = _lock_exclusive(link)
            try:
                proc = _run_uninstall_cmd(root)
            finally:
                _unlock(locked)
            self.assertEqual(proc.returncode, safety.EXIT_FINAL, proc.stdout + proc.stderr)
            self.assertNotEqual(proc.returncode, safety.EXIT_OK)
            self.assertIn("final cleanup failed", (proc.stdout or "").lower())
            self.assertIn("retry is possible", (proc.stdout or "").lower())
            self.assertFalse(os.path.isfile(os.path.join(root, "owned.exe")))
            self.assertTrue(os.path.isfile(link))
            self.assertTrue(os.path.isfile(os.path.join(root, safety.MANIFEST_FILENAME)))
            self.assertTrue(os.path.isfile(os.path.join(root, safety.UNINSTALL_PS1_FILENAME)))
            self.assertTrue(os.path.isfile(os.path.join(root, safety.UNINSTALL_CMD_FILENAME)))
            import winreg
            winreg.OpenKey(winreg.HKEY_CURRENT_USER, key).Close()

    def test_cmd_exit_4_keeps_recovery_and_retry_succeeds(self):
        if os.name != "nt":
            self.skipTest("Windows uninstall.cmd chain")
        import winreg
        with tempfile.TemporaryDirectory() as tmp:
            root = os.path.join(tmp, "Negm Lodaing Install")
            os.makedirs(root)
            user = os.path.join(tmp, "user-outside.txt")
            _write(user, "user-bytes-v1")
            before = _sha(user)
            link = os.path.join(tmp, "links", "owned.lnk")
            _make_shortcut(link, os.path.join(root, "owned.exe"))
            key = _install_owned(root, {"owned.exe": b"payload"}, shortcut_paths=[link])
            locked = _lock_exclusive(link)
            try:
                first = _run_uninstall_cmd(root)
            finally:
                _unlock(locked)
            self.assertEqual(first.returncode, safety.EXIT_FINAL, first.stdout + first.stderr)
            self.assertTrue(os.path.isfile(os.path.join(root, safety.MANIFEST_FILENAME)))
            self.assertTrue(os.path.isfile(os.path.join(root, safety.UNINSTALL_PS1_FILENAME)))
            self.assertTrue(os.path.isfile(os.path.join(root, safety.UNINSTALL_CMD_FILENAME)))
            winreg.OpenKey(winreg.HKEY_CURRENT_USER, key).Close()
            self.assertEqual(_sha(user), before)
            second = _run_uninstall_cmd(root)
            self.assertEqual(second.returncode, safety.EXIT_OK, second.stdout + second.stderr)
            self.assertFalse(os.path.isfile(os.path.join(root, "owned.exe")))
            self.assertFalse(os.path.isfile(link))
            self.assertEqual(_sha(user), before)
            with self.assertRaises(OSError):
                winreg.OpenKey(winreg.HKEY_CURRENT_USER, key)

    def test_cmd_readonly_manifest_keeps_anchor_for_retry(self):
        if os.name != "nt":
            self.skipTest("Windows uninstall.cmd chain")
        import winreg
        with tempfile.TemporaryDirectory() as tmp:
            root = os.path.join(tmp, "Negm Lodaing Install")
            os.makedirs(root)
            key = _install_owned(root, {"owned.exe": b"payload"})
            manifest = os.path.join(root, safety.MANIFEST_FILENAME)
            os.chmod(manifest, stat.S_IREAD)
            try:
                proc = _run_uninstall_cmd(root)
                self.assertEqual(proc.returncode, safety.EXIT_FINAL, proc.stdout + proc.stderr)
                self.assertIn("retry is possible", (proc.stdout or "").lower())
                self.assertTrue(os.path.isfile(manifest))
                self.assertTrue(os.path.isfile(os.path.join(root, safety.UNINSTALL_PS1_FILENAME)))
                winreg.OpenKey(winreg.HKEY_CURRENT_USER, key).Close()
            finally:
                os.chmod(manifest, stat.S_IWRITE)
            again = _run_uninstall_cmd(root)
            self.assertEqual(again.returncode, safety.EXIT_OK, again.stdout + again.stderr)
            with self.assertRaises(OSError):
                winreg.OpenKey(winreg.HKEY_CURRENT_USER, key)

    def test_cmd_anchor_delete_denied_keeps_manifest(self):
        if os.name != "nt":
            self.skipTest("Windows uninstall.cmd chain")
        import winreg
        with tempfile.TemporaryDirectory() as tmp:
            root = os.path.join(tmp, "Negm Lodaing Install")
            os.makedirs(root)
            key = _install_owned(root, {"owned.exe": b"payload"})
            env = os.environ.copy()
            env["F01_KEY"] = "HKCU:\\" + key
            deny = subprocess.run(
                [_powershell_exe(), "-NoProfile", "-Command",
                 "$ErrorActionPreference = 'Stop'; "
                 "$acl = Get-Acl $env:F01_KEY; "
                 "$who = [Security.Principal.WindowsIdentity]::GetCurrent().Name; "
                 "$rule = New-Object Security.AccessControl.RegistryAccessRule("
                 "$who, [Security.AccessControl.RegistryRights]::Delete, "
                 "[Security.AccessControl.InheritanceFlags]::None, "
                 "[Security.AccessControl.PropagationFlags]::None, "
                 "[Security.AccessControl.AccessControlType]::Deny); "
                 "$acl.AddAccessRule($rule); Set-Acl $env:F01_KEY $acl"],
                env=env, capture_output=True, text=True,
            )
            self.assertEqual(deny.returncode, 0, deny.stdout + deny.stderr)
            try:
                proc = _run_uninstall_cmd(root)
                self.assertEqual(proc.returncode, safety.EXIT_FINAL, proc.stdout + proc.stderr)
                self.assertIn("retry is possible", (proc.stdout or "").lower())
                self.assertNotIn("automatic retry cannot", (proc.stdout or "").lower())
                self.assertTrue(os.path.isfile(os.path.join(root, safety.MANIFEST_FILENAME)))
                self.assertTrue(os.path.isfile(os.path.join(root, safety.UNINSTALL_PS1_FILENAME)))
                winreg.OpenKey(winreg.HKEY_CURRENT_USER, key).Close()
            finally:
                subprocess.run(
                    [_powershell_exe(), "-NoProfile", "-Command",
                     "$acl = Get-Acl $env:F01_KEY; "
                     "$acl.Access | Where-Object { $_.AccessControlType -eq 'Deny' } | ForEach-Object { $acl.RemoveAccessRule($_) | Out-Null }; "
                     "Set-Acl $env:F01_KEY $acl"],
                    env=env, capture_output=True, text=True,
                )
            again = _run_uninstall_cmd(root)
            self.assertEqual(again.returncode, safety.EXIT_OK, again.stdout + again.stderr)


class TestIntegrationOwnership(unittest.TestCase):
    def test_existing_shortcut_is_not_overwritten(self):
        if os.name != "nt":
            self.skipTest("Windows shortcut creation")
        import installer_engine
        with tempfile.TemporaryDirectory() as tmp:
            foreign = os.path.join(tmp, "links", "App.lnk")
            ours = os.path.join(tmp, "app", "Negm Lodaing.exe")
            _write(ours, b"exe")
            _make_shortcut(foreign, r"C:\Foreign\tool.exe")
            before = _sha(foreign)
            outcome = installer_engine.create_windows_shortcut(ours, foreign, "desc", ours)
            self.assertEqual(outcome, "preserved")
            self.assertEqual(_sha(foreign), before)
            same_target = os.path.join(tmp, "links", "Same.lnk")
            _make_shortcut(same_target, ours)
            same_before = _sha(same_target)
            outcome = installer_engine.create_windows_shortcut(ours, same_target, "desc", ours)
            self.assertEqual(outcome, "preserved")
            self.assertEqual(_sha(same_target), same_before)
            fresh = os.path.join(tmp, "links", "Fresh.lnk")
            outcome = installer_engine.create_windows_shortcut(ours, fresh, "desc", ours)
            self.assertEqual(outcome, "created")
            self.assertTrue(os.path.isfile(fresh))

    def test_other_install_key_and_foreign_run_value_stay(self):
        if os.name != "nt":
            self.skipTest("Windows registry")
        import winreg
        key = safety.make_test_anchor_key()
        run_key = key + "\\Run"
        _OPEN_KEYS.append(key)
        with winreg.CreateKey(winreg.HKEY_CURRENT_USER, key) as reg:
            winreg.SetValueEx(reg, "InstallLocation", 0, winreg.REG_SZ, r"D:\Other Install")
            winreg.SetValueEx(reg, "Marker", 0, winreg.REG_SZ, "keep-me")
        with winreg.CreateKey(winreg.HKEY_CURRENT_USER, run_key) as reg:
            winreg.SetValueEx(reg, safety.DEFAULT_APP_NAME, 0, winreg.REG_SZ, r'"D:\Other\app.exe" --tray')
        with tempfile.TemporaryDirectory() as tmp:
            root = os.path.join(tmp, "this install")
            os.makedirs(root)
            with self.assertRaises(safety.InstallSafetyError):
                safety.write_install_anchor(root, key)
            with self.assertRaises(safety.InstallSafetyError):
                safety.assert_run_value_available(
                    run_key, safety.DEFAULT_APP_NAME, os.path.join(root, "Negm Lodaing.exe")
                )
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, key) as reg:
            self.assertEqual(winreg.QueryValueEx(reg, "InstallLocation")[0], r"D:\Other Install")
            self.assertEqual(winreg.QueryValueEx(reg, "Marker")[0], "keep-me")
            self.assertFalse(_value_exists(reg, safety.ANCHOR_VALUE_NAME))
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, run_key) as reg:
            self.assertEqual(
                winreg.QueryValueEx(reg, safety.DEFAULT_APP_NAME)[0],
                r'"D:\Other\app.exe" --tray',
            )

    def test_uninstall_does_not_delete_unrecorded_shortcut(self):
        if os.name != "nt":
            self.skipTest("Windows uninstall.cmd chain")
        with tempfile.TemporaryDirectory() as tmp:
            root = os.path.join(tmp, "Negm Lodaing Install")
            os.makedirs(root)
            _install_owned(root, {"owned.exe": b"payload"})
            link = os.path.join(tmp, "links", "foreign.lnk")
            _make_shortcut(link, os.path.join(root, "owned.exe"))
            before = _sha(link)
            proc = _run_uninstall_cmd(root)
            self.assertEqual(proc.returncode, safety.EXIT_OK, proc.stdout + proc.stderr)
            self.assertEqual(_sha(link), before)
            self.assertFalse(os.path.isfile(os.path.join(root, "owned.exe")))

    def test_cmd_special_characters_in_install_path(self):
        if os.name != "nt":
            self.skipTest("Windows uninstall.cmd chain")
        cases = ["Negm ! Install", "Negm & (Install)"]
        for folder in cases:
            with self.subTest(folder=folder):
                with tempfile.TemporaryDirectory() as tmp:
                    root = os.path.join(tmp, folder)
                    os.makedirs(root)
                    user = os.path.join(tmp, "user " + folder + ".txt")
                    inside_user = os.path.join(root, "notes.txt")
                    _write(user, "keep-" + folder)
                    before = _sha(user)
                    link = os.path.join(tmp, "My Links", folder + ".lnk")
                    _make_shortcut(link, os.path.join(root, "owned.exe"))
                    link_before = _sha(link)
                    _install_owned(root, {"owned.exe": b"payload"}, shortcut_paths=[link])
                    _write(inside_user, "user-inside")
                    inside_before = _sha(inside_user)
                    blocked = _run_uninstall_cmd(root)
                    self.assertEqual(blocked.returncode, safety.EXIT_PARTIAL, blocked.stdout + blocked.stderr)
                    self.assertEqual(_sha(inside_user), inside_before)
                    self.assertEqual(_sha(link), link_before)
                    self.assertTrue(os.path.isfile(link))
                    os.remove(inside_user)
                    proc = _run_uninstall_cmd(root)
                    self.assertEqual(proc.returncode, safety.EXIT_OK, proc.stdout + proc.stderr)
                    self.assertEqual(_sha(user), before)
                    self.assertFalse(os.path.isfile(os.path.join(root, "owned.exe")))
                    self.assertFalse(os.path.isfile(link))

    def test_new_shortcut_fingerprint_is_bound_before_anchor(self):
        if os.name != "nt":
            self.skipTest("Windows uninstall.cmd chain")
        with tempfile.TemporaryDirectory() as tmp:
            root = os.path.join(tmp, "Negm Lodaing Install")
            os.makedirs(root)
            link = os.path.join(tmp, "links", "fresh.lnk")
            _make_shortcut(link, os.path.join(root, "owned.exe"))
            key = _install_owned(root, {"owned.exe": b"payload"}, shortcut_paths=[link])
            manifest = safety.load_manifest(root)
            record = manifest["shortcuts"][0]
            self.assertEqual(record["sha256"], _sha(link))
            self.assertTrue(record["target"])
            safety.verify_install_anchor(root, manifest, key)
            proc = _run_uninstall_cmd(root)
            self.assertEqual(proc.returncode, safety.EXIT_OK, proc.stdout + proc.stderr)
            self.assertFalse(os.path.isfile(link))

    def test_customized_shortcut_is_kept_and_is_not_full_success(self):
        if os.name != "nt":
            self.skipTest("Windows uninstall.cmd chain")
        import winreg
        with tempfile.TemporaryDirectory() as tmp:
            root = os.path.join(tmp, "Negm Lodaing Install")
            os.makedirs(root)
            outside = os.path.join(tmp, "user-note.txt")
            _write(outside, "do-not-touch")
            outside_hash = _sha(outside)
            link = os.path.join(tmp, "links", "owned.lnk")
            _make_shortcut(link, os.path.join(root, "owned.exe"))
            key = _install_owned(root, {"owned.exe": b"payload"}, shortcut_paths=[link])
            _customize_shortcut(link)
            custom_hash = _sha(link)
            proc = _run_uninstall_cmd(root)
            self.assertEqual(proc.returncode, safety.EXIT_FINAL, proc.stdout + proc.stderr)
            self.assertNotIn("Exit code 0", proc.stdout or "")
            self.assertIn("modified after install and was kept", proc.stdout or "")
            self.assertIn("Full cleanup was not completed", proc.stdout or "")
            self.assertEqual(_sha(link), custom_hash)
            self.assertEqual(_sha(outside), outside_hash)
            self.assertFalse(os.path.isfile(os.path.join(root, "owned.exe")))
            self.assertTrue(os.path.isfile(os.path.join(root, safety.MANIFEST_FILENAME)))
            self.assertTrue(os.path.isfile(os.path.join(root, safety.UNINSTALL_PS1_FILENAME)))
            self.assertTrue(os.path.isfile(os.path.join(root, safety.UNINSTALL_CMD_FILENAME)))
            winreg.OpenKey(winreg.HKEY_CURRENT_USER, key).Close()

    def test_shortcut_target_moved_outside_root_is_kept(self):
        if os.name != "nt":
            self.skipTest("Windows uninstall.cmd chain")
        with tempfile.TemporaryDirectory() as tmp:
            root = os.path.join(tmp, "Negm Lodaing Install")
            os.makedirs(root)
            outside = os.path.join(tmp, "elsewhere.exe")
            _write(outside, b"other")
            outside_hash = _sha(outside)
            link = os.path.join(tmp, "links", "owned.lnk")
            _make_shortcut(link, os.path.join(root, "owned.exe"))
            _install_owned(root, {"owned.exe": b"payload"}, shortcut_paths=[link])
            _retarget_shortcut(link, outside)
            changed = _sha(link)
            proc = _run_uninstall_cmd(root)
            self.assertEqual(proc.returncode, safety.EXIT_FINAL, proc.stdout + proc.stderr)
            self.assertIn("no longer points at this installation and was kept", proc.stdout or "")
            self.assertNotIn("Exit code 0", proc.stdout or "")
            self.assertEqual(_sha(link), changed)
            self.assertEqual(_sha(outside), outside_hash)
            self.assertTrue(os.path.isfile(os.path.join(root, safety.MANIFEST_FILENAME)))

    def test_shortcut_created_after_manifest_is_not_deleted(self):
        if os.name != "nt":
            self.skipTest("Windows uninstall.cmd chain")
        with tempfile.TemporaryDirectory() as tmp:
            root = os.path.join(tmp, "Negm Lodaing Install")
            os.makedirs(root)
            link = os.path.join(tmp, "links", "later.lnk")
            _install_owned(root, {"owned.exe": b"payload"}, shortcut_paths=[link])
            _make_shortcut(link, os.path.join(root, "owned.exe"))
            before = _sha(link)
            proc = _run_uninstall_cmd(root)
            self.assertEqual(proc.returncode, safety.EXIT_OK, proc.stdout + proc.stderr)
            self.assertIn("no install-time fingerprint and was kept", proc.stdout or "")
            self.assertEqual(_sha(link), before)
            self.assertFalse(os.path.isfile(os.path.join(root, "owned.exe")))

    def test_legacy_string_shortcut_manifest_keeps_bytes(self):
        if os.name != "nt":
            self.skipTest("Windows uninstall.cmd chain")
        import winreg
        with tempfile.TemporaryDirectory() as tmp:
            root = os.path.join(tmp, "Negm Lodaing Install")
            os.makedirs(root)
            link = os.path.join(tmp, "links", "legacy.lnk")
            key = _install_owned(root, {"owned.exe": b"payload"})
            _make_shortcut(link, os.path.join(root, "owned.exe"))
            manifest_path = os.path.join(root, safety.MANIFEST_FILENAME)
            with open(manifest_path, encoding="utf-8") as handle:
                data = json.load(handle)
            data["shortcuts"] = [os.path.abspath(link)]
            with open(manifest_path, "w", encoding="utf-8") as handle:
                json.dump(data, handle)
            safety.write_install_anchor(root, key, safety.load_manifest(root))
            before = _sha(link)
            proc = _run_uninstall_cmd(root)
            self.assertEqual(proc.returncode, safety.EXIT_OK, proc.stdout + proc.stderr)
            self.assertIn("no install-time fingerprint and was kept", proc.stdout or "")
            self.assertEqual(_sha(link), before)
            self.assertFalse(os.path.isfile(os.path.join(root, "owned.exe")))
            with self.assertRaises(OSError):
                winreg.OpenKey(winreg.HKEY_CURRENT_USER, key)

    def test_spoofed_shortcut_hash_deletes_nothing(self):
        if os.name != "nt":
            self.skipTest("Windows uninstall.cmd chain")
        with tempfile.TemporaryDirectory() as tmp:
            root = os.path.join(tmp, "Negm Lodaing Install")
            os.makedirs(root)
            link = os.path.join(tmp, "links", "owned.lnk")
            _make_shortcut(link, os.path.join(root, "owned.exe"))
            _install_owned(root, {"owned.exe": b"payload"}, shortcut_paths=[link])
            before = _sha(link)
            manifest_path = os.path.join(root, safety.MANIFEST_FILENAME)
            with open(manifest_path, encoding="utf-8") as handle:
                data = json.load(handle)
            data["shortcuts"][0]["sha256"] = "ab" * 32
            with open(manifest_path, "w", encoding="utf-8") as handle:
                json.dump(data, handle)
            proc = _run_uninstall_cmd(root)
            self.assertEqual(proc.returncode, safety.EXIT_VERIFY_FAILED, proc.stdout + proc.stderr)
            self.assertEqual(_sha(link), before)
            self.assertTrue(os.path.isfile(os.path.join(root, "owned.exe")))
            self.assertTrue(os.path.isfile(manifest_path))
            self.assertTrue(os.path.isfile(os.path.join(root, safety.UNINSTALL_PS1_FILENAME)))

    def test_python_uninstall_keeps_customized_shortcut(self):
        if os.name != "nt":
            self.skipTest("Windows shortcut ownership")
        import winreg
        with tempfile.TemporaryDirectory() as tmp:
            root = os.path.join(tmp, "Negm Lodaing Install")
            os.makedirs(root)
            link = os.path.join(tmp, "links", "owned.lnk")
            _make_shortcut(link, os.path.join(root, "owned.exe"))
            key = _install_owned(root, {"owned.exe": b"payload"}, shortcut_paths=[link])
            _customize_shortcut(link)
            custom_hash = _sha(link)
            result = safety.safe_uninstall(root, anchor_key=key)
            self.assertEqual(result["exit_code"], safety.EXIT_FINAL)
            self.assertIn("modified after install and was kept", result["message"])
            self.assertTrue(result["anchor_kept"])
            self.assertEqual(_sha(link), custom_hash)
            self.assertTrue(os.path.isfile(os.path.join(root, safety.MANIFEST_FILENAME)))
            winreg.OpenKey(winreg.HKEY_CURRENT_USER, key).Close()


class TestReinstallPreflight(unittest.TestCase):
    def _installed(self, tmp, payload=b"payload-v1", inside=False):
        root = os.path.join(tmp, "Negm Lodaing Install")
        os.makedirs(root)
        key = _install_owned(root, {"owned.exe": payload})
        outside = os.path.join(tmp, "outside.txt")
        _write(outside, "outside-user")
        inside_path = os.path.join(root, "user-notes.txt")
        if inside:
            _write(inside_path, "inside-user")
        return root, key, outside, inside_path

    def _hashes(self, *paths):
        return {path: _sha(path) if os.path.isfile(path) else "ABSENT" for path in paths}

    def test_a_modified_cmd_blocks_reinstall_before_write(self):
        with tempfile.TemporaryDirectory() as tmp:
            root, key, outside, _inside = self._installed(tmp)
            cmd = os.path.join(root, safety.UNINSTALL_CMD_FILENAME)
            payload = os.path.join(root, "owned.exe")
            with open(cmd, "ab") as handle:
                handle.write(b"\r\nrem USER LINE keep-me\r\n")
            before = self._hashes(cmd, payload, outside)
            zpath = os.path.join(tmp, "next.zip")
            with zipfile.ZipFile(zpath, "w") as archive:
                archive.writestr("owned.exe", b"payload-v2")
            with self.assertRaises(safety.InstallSafetyError):
                installer_engine.prepare_and_copy_payload(root, zpath, anchor_key=key)
            self.assertEqual(self._hashes(cmd, payload, outside), before)
            with open(cmd, "rb") as handle:
                self.assertIn(b"USER LINE keep-me", handle.read())

    def test_b_modified_ps1_blocks_reinstall_before_write(self):
        with tempfile.TemporaryDirectory() as tmp:
            root, key, outside, _inside = self._installed(tmp)
            ps1 = os.path.join(root, safety.UNINSTALL_PS1_FILENAME)
            payload = os.path.join(root, "owned.exe")
            with open(ps1, "ab") as handle:
                handle.write(b"\n# USER PS1 keep-me\n")
            before = self._hashes(ps1, payload, outside)
            zpath = os.path.join(tmp, "next.zip")
            with zipfile.ZipFile(zpath, "w") as archive:
                archive.writestr("owned.exe", b"payload-v2")
            with self.assertRaises(safety.InstallSafetyError):
                installer_engine.prepare_and_copy_payload(root, zpath, anchor_key=key)
            self.assertEqual(self._hashes(ps1, payload, outside), before)

    def test_c_foreign_temp_and_retiring_are_not_replaced(self):
        with tempfile.TemporaryDirectory() as tmp:
            root, key, _outside, _inside = self._installed(tmp)
            manifest = os.path.join(root, safety.MANIFEST_FILENAME)
            temp_file = manifest + ".tmp"
            retiring = manifest + ".retiring"
            _write(temp_file, "FOREIGN TMP")
            _write(retiring, "FOREIGN RETIRING")
            before = self._hashes(temp_file, retiring, manifest)
            with self.assertRaises(safety.InstallSafetyError):
                safety.assess_destination(root, ["owned.exe"], anchor_key=key)
            with self.assertRaises(safety.InstallSafetyError):
                safety.write_uninstall_artifacts(
                    root, [{"path": "owned.exe", "role": "payload"}], [], anchor_key=key
                )
            self.assertEqual(self._hashes(temp_file, retiring, manifest), before)
            with open(temp_file, encoding="utf-8") as handle:
                self.assertEqual(handle.read(), "FOREIGN TMP")
            with open(retiring, encoding="utf-8") as handle:
                self.assertEqual(handle.read(), "FOREIGN RETIRING")

    def test_d_unowned_or_untrusted_uninstaller_is_not_replaced(self):
        with tempfile.TemporaryDirectory() as tmp:
            root, key, _outside, _inside = self._installed(tmp)
            cmd = os.path.join(root, safety.UNINSTALL_CMD_FILENAME)
            manifest_path = os.path.join(root, safety.MANIFEST_FILENAME)
            with open(manifest_path, encoding="utf-8") as handle:
                data = json.load(handle)
            data["files"] = [item for item in data["files"] if item["path"] != safety.UNINSTALL_CMD_FILENAME]
            with open(manifest_path, "w", encoding="utf-8") as handle:
                json.dump(data, handle)
            safety.write_install_anchor(root, key, safety.load_manifest(root))
            with open(cmd, "ab") as handle:
                handle.write(b"\r\nrem unowned\r\n")
            before = _sha(cmd)
            with self.assertRaises(safety.InstallSafetyError):
                safety.assess_destination(root, ["owned.exe"], anchor_key=key)
            self.assertEqual(_sha(cmd), before)
        with tempfile.TemporaryDirectory() as tmp:
            root = os.path.join(tmp, "shared")
            os.makedirs(root)
            cmd = os.path.join(root, safety.UNINSTALL_CMD_FILENAME)
            user = os.path.join(root, "notes.txt")
            _write(cmd, "not-our-uninstaller")
            _write(user, "user")
            before = self._hashes(cmd, user)
            with self.assertRaises(safety.InstallSafetyError):
                safety.assess_destination(root, ["owned.exe"])
            self.assertEqual(self._hashes(cmd, user), before)

    def test_e_matching_upgrade_then_uninstalls(self):
        if os.name != "nt":
            self.skipTest("Windows uninstall.cmd chain")
        with tempfile.TemporaryDirectory() as tmp:
            root, key, outside, _inside = self._installed(tmp)
            zpath = os.path.join(tmp, "next.zip")
            with zipfile.ZipFile(zpath, "w") as archive:
                archive.writestr("owned.exe", b"payload-v2")
            outside_hash = _sha(outside)
            plan = installer_engine.prepare_and_copy_payload(root, zpath, anchor_key=key)
            safety.write_uninstall_artifacts(
                root, plan["owned_files"], plan["owned_dirs"], anchor_key=key, run_key=key + "\\Run"
            )
            with open(os.path.join(root, "owned.exe"), "rb") as handle:
                self.assertEqual(handle.read(), b"payload-v2")
            self.assertEqual(_sha(outside), outside_hash)
            proc = _run_uninstall_cmd(root)
            self.assertEqual(proc.returncode, safety.EXIT_OK, proc.stdout + proc.stderr)
            self.assertFalse(os.path.isfile(os.path.join(root, "owned.exe")))
            self.assertEqual(_sha(outside), outside_hash)

    def test_f_anchor_failure_restores_files_and_retry_works(self):
        with tempfile.TemporaryDirectory() as tmp:
            root, key, outside, inside = self._installed(tmp, inside=True)
            payload = os.path.join(root, "owned.exe")
            cmd = os.path.join(root, safety.UNINSTALL_CMD_FILENAME)
            ps1 = os.path.join(root, safety.UNINSTALL_PS1_FILENAME)
            manifest = os.path.join(root, safety.MANIFEST_FILENAME)
            before = self._hashes(payload, cmd, ps1, manifest, outside, inside)
            zpath = os.path.join(tmp, "next.zip")
            with zipfile.ZipFile(zpath, "w") as archive:
                archive.writestr("owned.exe", b"payload-v2")
            plan = installer_engine.prepare_and_copy_payload(root, zpath, anchor_key=key)
            original = safety.write_install_anchor
            def boom(*_args, **_kwargs):
                raise safety.InstallSafetyError("injected anchor failure")
            safety.write_install_anchor = boom
            try:
                with self.assertRaises(safety.InstallSafetyError):
                    safety.write_uninstall_artifacts(
                        root, plan["owned_files"], plan["owned_dirs"], anchor_key=key, run_key=key + "\\Run"
                    )
            finally:
                safety.write_install_anchor = original
            installer_safety_restore = safety.restore_write_snapshot(plan["snapshot"])
            self.assertIsNone(installer_safety_restore)
            self.assertEqual(self._hashes(payload, cmd, ps1, manifest, outside, inside), before)
            plan = installer_engine.prepare_and_copy_payload(root, zpath, anchor_key=key)
            safety.write_uninstall_artifacts(
                root, plan["owned_files"], plan["owned_dirs"], anchor_key=key, run_key=key + "\\Run"
            )
            with open(payload, "rb") as handle:
                self.assertEqual(handle.read(), b"payload-v2")
            with open(inside, encoding="utf-8") as handle:
                self.assertEqual(handle.read(), "inside-user")

    def test_g_bad_manifest_anchor_and_reparse_stop(self):
        with tempfile.TemporaryDirectory() as tmp:
            root, key, outside, inside = self._installed(tmp, inside=True)
            manifest = os.path.join(root, safety.MANIFEST_FILENAME)
            before = self._hashes(manifest, outside, inside, os.path.join(root, "owned.exe"))
            with open(manifest, "ab") as handle:
                handle.write(b"\nNOT-JSON")
            zpath = os.path.join(tmp, "next.zip")
            with zipfile.ZipFile(zpath, "w") as archive:
                archive.writestr("owned.exe", b"payload-v2")
            with self.assertRaises(safety.InstallSafetyError):
                installer_engine.prepare_and_copy_payload(root, zpath, anchor_key=key)
            self.assertEqual(_sha(outside), before[outside])
            with open(inside, encoding="utf-8") as handle:
                self.assertEqual(handle.read(), "inside-user")
        if os.name != "nt":
            return
        with tempfile.TemporaryDirectory() as tmp:
            root, key, _outside, _inside = self._installed(tmp)
            owned = os.path.join(root, "owned.exe")
            target = os.path.join(tmp, "junction-target")
            os.makedirs(target)
            secret = os.path.join(target, "secret.txt")
            _write(secret, "secret")
            os.remove(owned)
            if not _try_junction(owned, target):
                self.skipTest("could not create a junction")
            secret_hash = _sha(secret)
            with self.assertRaises(safety.InstallSafetyError):
                safety.assess_destination(root, ["owned.exe"], anchor_key=key)
            self.assertEqual(_sha(secret), secret_hash)
            self.assertTrue(os.path.lexists(owned))

    def test_i_special_characters_round_trip(self):
        if os.name != "nt":
            self.skipTest("Windows uninstall.cmd chain")
        folder = "Negm 'تثبيت' & (ok)!"
        with tempfile.TemporaryDirectory() as tmp:
            root = os.path.join(tmp, folder)
            os.makedirs(root)
            outside = os.path.join(tmp, "user " + folder + ".txt")
            _write(outside, "keep")
            before = _sha(outside)
            _install_owned(root, {"owned.exe": b"payload"})
            proc = _run_uninstall_cmd(root)
            self.assertEqual(proc.returncode, safety.EXIT_OK, proc.stdout + proc.stderr)
            self.assertEqual(_sha(outside), before)
            self.assertFalse(os.path.isfile(os.path.join(root, "owned.exe")))

    def test_k_engine_preflight_runs_before_copy(self):
        import inspect
        source = inspect.getsource(installer_engine.SetupWizard._run_install_worker)
        self.assertIn("prepare_and_copy_payload", source)
        self.assertLess(
            source.find("prepare_and_copy_payload"),
            source.find("write_safe_uninstaller"),
        )
        with tempfile.TemporaryDirectory() as tmp:
            root, key, _outside, _inside = self._installed(tmp)
            payload = os.path.join(root, "owned.exe")
            before = _sha(payload)
            cmd = os.path.join(root, safety.UNINSTALL_CMD_FILENAME)
            with open(cmd, "ab") as handle:
                handle.write(b"\r\nrem block\r\n")
            zpath = os.path.join(tmp, "next.zip")
            with zipfile.ZipFile(zpath, "w") as archive:
                archive.writestr("owned.exe", b"should-not-land")
            with self.assertRaises(safety.InstallSafetyError):
                installer_engine.prepare_and_copy_payload(root, zpath, anchor_key=key)
            self.assertEqual(_sha(payload), before)
            with open(payload, "rb") as handle:
                self.assertNotIn(b"should-not-land", handle.read())

    def test_quote_in_shortcut_path_is_not_executed(self):
        link = os.path.join(tempfile.gettempdir(), 'bad"name.lnk')
        outcome = installer_engine.create_windows_shortcut(
            r"C:\Windows\notepad.exe", link, "desc", r"C:\Windows\notepad.exe"
        )
        self.assertEqual(outcome, "failed")
        self.assertFalse(os.path.exists(link))


class TestShortcutUpgradeCarryForward(unittest.TestCase):
    def _upgrade(self, root, key, link, created_shortcuts):
        zpath = os.path.join(os.path.dirname(root), "next.zip")
        with zipfile.ZipFile(zpath, "w") as archive:
            archive.writestr("owned.exe", b"payload-v2")
        plan = installer_engine.prepare_and_copy_payload(root, zpath, anchor_key=key)
        outcome = installer_engine.create_windows_shortcut(
            os.path.join(root, "owned.exe"), link, "Negm Lodaing Download Manager",
            os.path.join(root, "owned.exe"),
        )
        passed = list(created_shortcuts)
        if outcome == "created":
            passed.append(os.path.abspath(link))
        safety.write_uninstall_artifacts(
            root, plan["owned_files"], plan["owned_dirs"],
            created_root=plan["created_root"], anchor_key=key, run_key=key + "\\Run",
            shortcut_paths=passed,
        )
        return plan, outcome

    def test_upgrade_keeps_original_shortcut_identity_and_created_root(self):
        if os.name != "nt":
            self.skipTest("Windows shortcut upgrade")
        with tempfile.TemporaryDirectory() as tmp:
            root = os.path.join(tmp, "Negm Lodaing Install")
            os.makedirs(root)
            link = os.path.join(tmp, "links", "owned.lnk")
            outside = os.path.join(tmp, "outside.txt")
            _write(outside, "outside-user")
            _make_shortcut(link, os.path.join(root, "owned.exe"))
            key = _install_owned(
                root, {"owned.exe": b"payload-v1"}, created_root=True, shortcut_paths=[link]
            )
            before = safety.load_manifest(root)
            before_link = _sha(link)
            outside_hash = _sha(outside)
            plan, outcome = self._upgrade(root, key, link, [])
            after = safety.load_manifest(root)
            self.assertEqual(outcome, "preserved")
            self.assertFalse(plan["created_root"])
            self.assertTrue(before["created_root"])
            self.assertTrue(after["created_root"])
            self.assertEqual(after["shortcuts"], before["shortcuts"])
            self.assertEqual(_sha(link), before_link)
            self.assertEqual(_sha(outside), outside_hash)
            self.assertEqual(
                safety.read_install_anchor(key)["manifest_sha256"],
                safety.manifest_fingerprint(after),
            )
            proc = _run_uninstall_cmd(root)
            self.assertEqual(proc.returncode, safety.EXIT_OK, proc.stdout + proc.stderr)
            self.assertFalse(os.path.isfile(link))
            self.assertEqual(_sha(outside), outside_hash)

    def test_upgrade_does_not_rehash_a_modified_shortcut(self):
        if os.name != "nt":
            self.skipTest("Windows shortcut upgrade")
        with tempfile.TemporaryDirectory() as tmp:
            root = os.path.join(tmp, "Negm Lodaing Install")
            os.makedirs(root)
            link = os.path.join(tmp, "links", "owned.lnk")
            outside = os.path.join(tmp, "outside.txt")
            _write(outside, "outside-user")
            _make_shortcut(link, os.path.join(root, "owned.exe"))
            key = _install_owned(root, {"owned.exe": b"payload-v1"}, shortcut_paths=[link])
            original = safety.load_manifest(root)["shortcuts"][0]
            _customize_shortcut(link)
            customized = _sha(link)
            self.assertNotEqual(customized, original["sha256"])
            self._upgrade(root, key, link, [])
            carried = safety.load_manifest(root)["shortcuts"][0]
            self.assertEqual(carried["sha256"], original["sha256"])
            self.assertEqual(carried["target"], original["target"])
            self.assertEqual(_sha(link), customized)
            outside_hash = _sha(outside)
            proc = _run_uninstall_cmd(root)
            self.assertEqual(proc.returncode, safety.EXIT_FINAL, proc.stdout + proc.stderr)
            self.assertIn("modified after install", proc.stdout or "")
            self.assertEqual(_sha(link), customized)
            self.assertEqual(_sha(outside), outside_hash)
            self.assertTrue(os.path.isfile(os.path.join(root, safety.MANIFEST_FILENAME)))
            self.assertTrue(os.path.isfile(os.path.join(root, safety.UNINSTALL_CMD_FILENAME)))

    def test_upgrade_does_not_adopt_a_foreign_shortcut(self):
        if os.name != "nt":
            self.skipTest("Windows shortcut upgrade")
        with tempfile.TemporaryDirectory() as tmp:
            root = os.path.join(tmp, "shared install")
            os.makedirs(root)
            foreign = os.path.join(tmp, "links", "foreign.lnk")
            _make_shortcut(foreign, os.path.join(root, "owned.exe"))
            foreign_hash = _sha(foreign)
            key = _install_owned(root, {"owned.exe": b"payload-v1"}, created_root=False)
            self._upgrade(root, key, foreign, [])
            after = safety.load_manifest(root)
            self.assertEqual(after["shortcuts"], [])
            self.assertFalse(after["created_root"])
            self.assertEqual(_sha(foreign), foreign_hash)
            proc = _run_uninstall_cmd(root)
            self.assertEqual(proc.returncode, safety.EXIT_OK, proc.stdout + proc.stderr)
            self.assertEqual(_sha(foreign), foreign_hash)
            self.assertTrue(os.path.isdir(root))

    def test_upgrade_failure_restores_previous_shortcut_record(self):
        if os.name != "nt":
            self.skipTest("Windows shortcut upgrade")
        with tempfile.TemporaryDirectory() as tmp:
            root = os.path.join(tmp, "Negm Lodaing Install")
            os.makedirs(root)
            link = os.path.join(tmp, "links", "owned.lnk")
            _make_shortcut(link, os.path.join(root, "owned.exe"))
            key = _install_owned(
                root, {"owned.exe": b"payload-v1"}, created_root=True, shortcut_paths=[link]
            )
            before = safety.load_manifest(root)
            link_hash = _sha(link)
            zpath = os.path.join(tmp, "next.zip")
            with zipfile.ZipFile(zpath, "w") as archive:
                archive.writestr("owned.exe", b"payload-v2")
            plan = installer_engine.prepare_and_copy_payload(root, zpath, anchor_key=key)
            original = safety.write_install_anchor
            def boom(*_args, **_kwargs):
                raise safety.InstallSafetyError("injected anchor failure")
            safety.write_install_anchor = boom
            try:
                with self.assertRaises(safety.InstallSafetyError):
                    safety.write_uninstall_artifacts(
                        root, plan["owned_files"], plan["owned_dirs"],
                        created_root=plan["created_root"], anchor_key=key,
                        run_key=key + "\\Run", shortcut_paths=[],
                    )
            finally:
                safety.write_install_anchor = original
            safety.restore_write_snapshot(plan["snapshot"])
            restored = safety.load_manifest(root)
            self.assertEqual(restored["shortcuts"], before["shortcuts"])
            self.assertTrue(restored["created_root"])
            self.assertEqual(_sha(link), link_hash)
            with open(os.path.join(root, "owned.exe"), "rb") as handle:
                self.assertEqual(handle.read(), b"payload-v1")


def _value_exists(key, name):
    import winreg
    try:
        winreg.QueryValueEx(key, name)
    except FileNotFoundError:
        return False
    return True

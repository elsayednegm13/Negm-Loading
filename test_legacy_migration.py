# -*- coding: utf-8 -*-
"""F-03 tests: inspect and refuse legacy installs WITHOUT executing old scripts."""
from __future__ import annotations

import hashlib
import os
import tempfile
import unittest
from unittest.mock import patch
import zipfile

import installer_engine
import installer_safety as safety
import legacy_migration


def _write(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as handle:
        handle.write(content)


def _sha(path):
    with open(path, "rb") as handle:
        return hashlib.sha256(handle.read()).hexdigest()


class TestF03LegacyReadOnlyAudit(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = os.path.join(self.temp.name, "Legacy Negm Lodaing")
        self.key = safety.make_test_anchor_key()
        self.addCleanup(safety.delete_test_anchor_key, self.key)

    def inspect(self, root=None):
        return legacy_migration.inspect_legacy_destination(
            root if root is not None else self.root, anchor_key=self.key
        )

    def test_missing_and_empty_without_key_are_fresh_candidates_only(self):
        missing = self.inspect()
        self.assertEqual(missing["status"], "FRESH_MISSING_DIRECTORY")
        self.assertTrue(missing["can_install_or_upgrade"])
        self.assertFalse(missing["automatic_legacy_migration"])
        self.assertFalse(os.path.lexists(self.root))
        os.makedirs(self.root)
        empty = self.inspect()
        self.assertEqual(empty["status"], "FRESH_EMPTY_DIRECTORY")
        self.assertTrue(empty["can_install_or_upgrade"])

    def test_actual_legacy_script_pattern_detected_but_never_executed(self):
        os.makedirs(self.root)
        old_exe = os.path.join(self.root, "Negm Lodaing.exe")
        user_file = os.path.join(self.root, "user-notes.txt")
        cmd = os.path.join(self.root, "uninstall.cmd")
        # Pattern directly reflects the historical installer_engine.py on main.
        # Deliberately do NOT pass it to cmd.exe (or any other interpreter).
        _write(cmd, b'@echo off\r\ncd "%TEMP%"\r\nrd /s /q "%USERPROFILE%\\Documents"\r\n')
        _write(old_exe, b"legacy-executable")
        _write(user_file, b"the-user-must-keep-this")
        before = {p: _sha(p) for p in (cmd, old_exe, user_file)}
        with patch("subprocess.run", side_effect=AssertionError("old script executed")), \
             patch("subprocess.Popen", side_effect=AssertionError("process launched")), \
             patch("os.system", side_effect=AssertionError("shell launched")):
            result = self.inspect()
            self.assertEqual(result["status"], "BLOCKED_NO_TRUSTED_MANIFEST")
            self.assertTrue(result["legacy_uninstaller_present"])
            self.assertTrue(result["legacy_uninstaller_content_checked"])
            self.assertTrue(result["legacy_uninstaller_recursive_delete_detected"])
            self.assertTrue(result["has_legacy_executable_name"])
            self.assertFalse(result["can_install_or_upgrade"])
            self.assertFalse(result["automatic_legacy_migration"])
            self.assertNotIn("user-notes.txt", str(result))
            with self.assertRaises(safety.InstallSafetyError):
                safety.assess_destination(self.root, [installer_engine.APP_EXE_FILENAME], anchor_key=self.key)
            outcome = safety.safe_uninstall(self.root, anchor_key=self.key)
            self.assertEqual(outcome["exit_code"], safety.EXIT_VERIFY_FAILED)
        self.assertEqual(before, {p: _sha(p) for p in before})
        self.assertFalse(os.path.exists(os.path.join(self.root, safety.MANIFEST_FILENAME)))

    def test_benign_looking_legacy_uninstaller_is_still_untrusted(self):
        os.makedirs(self.root)
        cmd = os.path.join(self.root, "uninstall.cmd")
        _write(cmd, b"@echo off\r\necho safe looking only\r\n")
        result = self.inspect()
        self.assertEqual(result["status"], "BLOCKED_NO_TRUSTED_MANIFEST")
        self.assertTrue(result["legacy_uninstaller_content_checked"])
        self.assertFalse(result["legacy_uninstaller_recursive_delete_detected"])
        self.assertFalse(result["can_install_or_upgrade"])
        self.assertTrue(os.path.exists(cmd))

    def test_manifestless_executable_alone_never_proves_ownership(self):
        os.makedirs(self.root)
        old_exe = os.path.join(self.root, "NegmLoading.exe")
        _write(old_exe, b"MZpossibly-foreign")
        found = self.inspect()
        self.assertEqual(found["status"], "BLOCKED_NO_TRUSTED_MANIFEST")
        self.assertTrue(found["has_new_executable_name"])
        self.assertFalse(found["can_install_or_upgrade"])
        self.assertEqual(_sha(old_exe), hashlib.sha256(b"MZpossibly-foreign").hexdigest())

    def test_corrupt_or_mismatched_manifest_always_blocks(self):
        os.makedirs(self.root)
        manifest = os.path.join(self.root, safety.MANIFEST_FILENAME)
        _write(manifest, b"{definitely not JSON")
        self.assertEqual(self.inspect()["status"], "BLOCKED_UNTRUSTED_MANIFEST")
        with open(manifest, "rb") as handle:
            self.assertEqual(handle.read(), b"{definitely not JSON")

    def test_reparse_install_root_is_never_inspected_or_followed(self):
        real_root = os.path.join(self.temp.name, "real-user-folder")
        os.makedirs(real_root)
        sentinel = os.path.join(real_root, "original.txt")
        _write(sentinel, b"keep")
        try:
            os.symlink(real_root, self.root, target_is_directory=True)
        except (OSError, NotImplementedError) as exc:
            self.skipTest("symlink privileges unavailable: " + str(exc))
        result = self.inspect()
        self.assertEqual(result["status"], "BLOCKED_UNSAFE_OR_UNREADABLE")
        self.assertFalse(result["can_install_or_upgrade"])
        self.assertEqual(_sha(sentinel), hashlib.sha256(b"keep").hexdigest())

    @unittest.skipUnless(os.name == "nt", "Windows HKCU test only")
    def test_registry_left_by_legacy_install_blocks_empty_and_missing_path(self):
        import winreg
        with winreg.CreateKey(winreg.HKEY_CURRENT_USER, self.key) as reg:
            winreg.SetValueEx(reg, "InstallLocation", 0, winreg.REG_SZ, self.root)
            winreg.SetValueEx(reg, "UninstallString", 0, winreg.REG_SZ,
                              '"' + os.path.join(self.root, "uninstall.cmd") + '"')
            winreg.SetValueEx(reg, "LegacySentinel", 0, winreg.REG_SZ, "untouched")
        self.assertEqual(self.inspect()["status"], "BLOCKED_EXISTING_REGISTRATION")
        os.makedirs(self.root)
        self.assertEqual(self.inspect()["status"], "BLOCKED_EXISTING_REGISTRATION")
        self.assertFalse(self.inspect()["can_install_or_upgrade"])
        payload = os.path.join(self.temp.name, "good.zip")
        with zipfile.ZipFile(payload, "w") as zf:
            zf.writestr(installer_engine.APP_EXE_FILENAME, b"MZnew")
        with self.assertRaises(safety.InstallSafetyError):
            installer_engine.prepare_and_copy_payload(
                self.root, payload, anchor_key=self.key, run_key=self.key + "\\Run"
            )
        with self.assertRaises(safety.InstallSafetyError):
            safety.write_uninstall_artifacts(
                self.root, [], [], anchor_key=self.key, run_key=self.key + "\\Run",
            )
        self.assertEqual(os.listdir(self.root), [])
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, self.key) as reg:
            self.assertEqual(winreg.QueryValueEx(reg, "LegacySentinel")[0], "untouched")
            self.assertTrue(winreg.QueryValueEx(reg, "UninstallString")[0].endswith('uninstall.cmd"'))
            with self.assertRaises(FileNotFoundError):
                winreg.QueryValueEx(reg, safety.ANCHOR_VALUE_NAME)

    @unittest.skipUnless(os.name == "nt", "Windows HKCU test only")
    def test_missing_root_with_old_registry_key_refuses_new_directory(self):
        import winreg
        with winreg.CreateKey(winreg.HKEY_CURRENT_USER, self.key) as reg:
            winreg.SetValueEx(reg, "InstallLocation", 0, winreg.REG_SZ, self.root)
        payload = os.path.join(self.temp.name, "new.zip")
        with zipfile.ZipFile(payload, "w") as zf:
            zf.writestr(installer_engine.APP_EXE_FILENAME, b"MZnew")
        with self.assertRaises(safety.InstallSafetyError):
            installer_engine.prepare_and_copy_payload(self.root, payload, anchor_key=self.key)
        self.assertFalse(os.path.lexists(self.root))

    @unittest.skipUnless(os.name == "nt", "Windows HKCU test only")
    def test_verified_install_remains_upgradeable_with_valid_anchor(self):
        os.makedirs(self.root)
        exe = os.path.join(self.root, installer_engine.APP_EXE_FILENAME)
        _write(exe, b"MZowned")
        safety.write_uninstall_artifacts(
            self.root, [{"path": installer_engine.APP_EXE_FILENAME, "role": "payload"}], [],
            anchor_key=self.key, run_key=self.key + "\\Run", shortcut_paths=[],
        )
        found = self.inspect()
        self.assertEqual(found["status"], "VERIFIED_MANAGED_INSTALL")
        self.assertTrue(found["can_install_or_upgrade"])
        self.assertFalse(found["automatic_legacy_migration"])

        payload = os.path.join(self.temp.name, "upgrade.zip")
        with zipfile.ZipFile(payload, "w") as zf:
            zf.writestr(installer_engine.APP_EXE_FILENAME, b"MZupdated")
        result = installer_engine.prepare_and_copy_payload(
            self.root, payload, anchor_key=self.key, run_key=self.key + "\\Run"
        )
        self.assertFalse(result["created_root"])
        safety.write_uninstall_artifacts(
            self.root, result["owned_files"], result["owned_dirs"],
            anchor_key=self.key, run_key=self.key + "\\Run", shortcut_paths=[],
        )
        self.assertEqual(self.inspect()["status"], "VERIFIED_MANAGED_INSTALL")
        self.assertEqual(_sha(exe), hashlib.sha256(b"MZupdated").hexdigest())

    @unittest.skipUnless(os.name == "nt", "Windows HKCU test only")
    def test_verified_manifest_does_not_trust_modified_destructive_uninstaller(self):
        os.makedirs(self.root)
        _write(os.path.join(self.root, "NegmLoading.exe"), b"MZoriginal")
        safety.write_uninstall_artifacts(
            self.root, [{"path": "NegmLoading.exe", "role": "payload"}], [],
            anchor_key=self.key, run_key=self.key + "\\Run", shortcut_paths=[],
        )
        self.assertEqual(self.inspect()["status"], "VERIFIED_MANAGED_INSTALL")
        cmd = os.path.join(self.root, safety.UNINSTALL_CMD_FILENAME)
        _write(cmd, b'@echo off\r\nrd /s /q "%~dp0"\r\n')
        result = self.inspect()
        self.assertEqual(result["status"], "BLOCKED_UNTRUSTED_UNINSTALLER")
        self.assertTrue(result["legacy_uninstaller_recursive_delete_detected"])
        with self.assertRaises(safety.InstallSafetyError):
            safety.assess_destination(self.root, ["NegmLoading.exe"], anchor_key=self.key)

    @unittest.skipUnless(os.name == "nt", "Windows HKCU test only")
    def test_recorded_file_modified_after_install_blocks_migration_candidate(self):
        os.makedirs(self.root)
        exe = os.path.join(self.root, installer_engine.APP_EXE_FILENAME)
        _write(exe, b"MZtrusted-payload")
        safety.write_uninstall_artifacts(
            self.root, [{"path": installer_engine.APP_EXE_FILENAME, "role": "payload"}], [],
            anchor_key=self.key, run_key=self.key + "\\Run", shortcut_paths=[],
        )
        self.assertEqual(self.inspect()["status"], "VERIFIED_MANAGED_INSTALL")
        _write(exe, b"MZmodified-user-file")
        result = self.inspect()
        self.assertEqual(result["status"], "BLOCKED_MODIFIED_OWNED_PAYLOAD")
        self.assertFalse(result["can_install_or_upgrade"])
        with self.assertRaises(safety.InstallSafetyError):
            safety.assess_destination(
                self.root, [installer_engine.APP_EXE_FILENAME], anchor_key=self.key
            )
        self.assertEqual(_sha(exe), hashlib.sha256(b"MZmodified-user-file").hexdigest())

    @unittest.skipUnless(os.name == "nt", "Windows HKCU test only")
    def test_manifest_recovery_temp_blocks_migration_candidate(self):
        os.makedirs(self.root)
        exe = os.path.join(self.root, installer_engine.APP_EXE_FILENAME)
        _write(exe, b"MZtrusted-payload")
        safety.write_uninstall_artifacts(
            self.root, [{"path": installer_engine.APP_EXE_FILENAME, "role": "payload"}], [],
            anchor_key=self.key, run_key=self.key + "\\Run", shortcut_paths=[],
        )
        self.assertEqual(self.inspect()["status"], "VERIFIED_MANAGED_INSTALL")
        blocker = os.path.join(self.root, safety.MANIFEST_FILENAME + ".retiring")
        _write(blocker, b"foreign-recovery-marker")
        result = self.inspect()
        self.assertEqual(result["status"], "BLOCKED_MODIFIED_OWNED_PAYLOAD")
        self.assertFalse(result["can_install_or_upgrade"])
        self.assertEqual(_sha(blocker), hashlib.sha256(b"foreign-recovery-marker").hexdigest())

    @unittest.skipUnless(os.name == "nt", "Windows HKCU test only")
    def test_manifest_without_anchor_is_not_adopted(self):
        os.makedirs(self.root)
        _write(os.path.join(self.root, "NegmLoading.exe"), b"MZ")
        safety.write_manifest(
            self.root, [{"path": "NegmLoading.exe", "role": "payload"}], [],
            app_name=safety.DEFAULT_APP_NAME,
        )
        report = self.inspect()
        self.assertEqual(report["status"], "BLOCKED_UNTRUSTED_MANIFEST")
        with self.assertRaises(safety.InstallSafetyError):
            safety.assess_destination(self.root, ["NegmLoading.exe"], anchor_key=self.key)

    def test_oversized_legacy_script_never_becomes_trusted(self):
        os.makedirs(self.root)
        _write(os.path.join(self.root, "uninstall.cmd"), b"echo A\n" * 15_000)
        result = self.inspect()
        self.assertFalse(result["legacy_uninstaller_content_checked"])
        self.assertEqual(result["status"], "BLOCKED_NO_TRUSTED_MANIFEST")
        self.assertFalse(result["can_install_or_upgrade"])


if __name__ == "__main__":
    unittest.main()

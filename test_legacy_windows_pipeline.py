# -*- coding: utf-8 -*-
"""Windows-only disposable-HKCU test for the F03 backup/staging pipeline.

Never uses the product's real uninstall key. No old script execution, startup
registration, shortcut modification, program launch or registry handover.
"""
import os
import tempfile
import unittest
import uuid
import zipfile
from pathlib import Path

import installer_safety as safety
import legacy_migration as migration
import legacy_stage


@unittest.skipUnless(os.name == "nt", "Windows and DPAPI required")
class TestWindowsLegacyPipeline(unittest.TestCase):
    def test_dpapi_registry_snapshot_and_stage_with_real_test_key(self):
        import winreg
        with tempfile.TemporaryDirectory(prefix="f03-win-pipeline-") as temp:
            base = Path(temp)
            legacy_root = base / "Old Program"
            legacy_root.mkdir()
            (legacy_root / "NegmLoading.exe").write_bytes(b"old-app")
            (legacy_root / "uninstall.cmd").write_bytes(
                b'@echo off\r\nrd /s /q "%~dp0"\r\n'
            )
            profile = base / "Profile"
            profile.mkdir()
            data = profile / ".negm_stream"
            data.mkdir()
            (data / "site_credentials.json").write_bytes(
                b'[{"id":"a1","domain":"example.org","password":"real-test-secret"}]'
            )
            key = safety.TEST_ANCHOR_PREFIX + "F03Prep" + uuid.uuid4().hex
            run = key + r"\Run"
            backup = base / "Encrypted snapshot"
            stage = base / "Staged v2"
            archive = base / "payload.zip"
            with zipfile.ZipFile(archive, "w") as z:
                z.writestr("NegmLoading.exe", b"new-app")
            try:
                with winreg.CreateKey(winreg.HKEY_CURRENT_USER, key) as reg:
                    winreg.SetValueEx(reg, "DisplayName", 0, winreg.REG_SZ,
                                      migration.APP_NAME)
                    winreg.SetValueEx(reg, "InstallLocation", 0, winreg.REG_SZ,
                                      str(legacy_root))
                    winreg.SetValueEx(
                        reg, "UninstallString", 0, winreg.REG_SZ,
                        '"' + str(legacy_root / "uninstall.cmd") + '"'
                    )
                with winreg.CreateKey(winreg.HKEY_CURRENT_USER, run) as startup:
                    winreg.SetValueEx(
                        startup, migration.APP_NAME, 0, winreg.REG_SZ,
                        '"' + str(legacy_root / "NegmLoading.exe") + '" --tray'
                    )
                plan = migration.inspect_legacy(
                    legacy_root, profile_root=profile,
                    registry=migration.read_legacy_registry(key, run)
                )
                crypto = migration.WindowsDPAPI()
                migration.create_verified_backup(plan, backup, crypto)
                self.assertNotIn(
                    b"real-test-secret",
                    (backup / migration.INDEX_NAME).read_bytes(),
                )
                result = legacy_stage.prepare_staging(
                    plan, backup, archive, stage, protector=crypto
                )
                self.assertEqual(result["status"], "STAGED_ONLY")
                self.assertEqual((stage / "NegmLoading.exe").read_bytes(), b"new-app")
                self.assertEqual((legacy_root / "NegmLoading.exe").read_bytes(),
                                 b"old-app")
                self.assertTrue((legacy_root / "uninstall.cmd").exists())
                with winreg.OpenKey(winreg.HKEY_CURRENT_USER, key) as existing:
                    self.assertEqual(
                        winreg.QueryValueEx(existing, "InstallLocation")[0],
                        str(legacy_root),
                    )
                with winreg.OpenKey(winreg.HKEY_CURRENT_USER, run) as existing:
                    self.assertIn(
                        str(legacy_root),
                        winreg.QueryValueEx(existing, migration.APP_NAME)[0],
                    )
                recovered = base / "Restore only to new folder"
                migration.restore_to_new_directory(backup, recovered, crypto)
                self.assertEqual(
                    (recovered / "user_data" / "site_credentials.json").read_bytes(),
                    b'[{"id":"a1","domain":"example.org","password":"real-test-secret"}]',
                )
            finally:
                try:
                    winreg.DeleteKey(winreg.HKEY_CURRENT_USER, run)
                except FileNotFoundError:
                    pass
                try:
                    winreg.DeleteKey(winreg.HKEY_CURRENT_USER, key)
                except FileNotFoundError:
                    pass


if __name__ == "__main__":
    unittest.main()

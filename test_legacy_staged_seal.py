# -*- coding: utf-8 -*-
"""F03 new-stage sealing acceptance with real F01-safe uninstall on Windows.

ALL registry keys use a random F01 test identity. All files are disposable
temp fixtures. The historical rd /s /q script remains inert bytes and is
never launched. No production HKCU key, Desktop or Start Menu is touched.
"""
import os
import subprocess
import tempfile
import unittest
import zipfile
from pathlib import Path

import installer_safety as safety
import legacy_migration as legacy
import legacy_stage
import legacy_staged_seal as seal
from test_legacy_migration import _reg


@unittest.skipUnless(os.name == "nt", "Real Windows registry and DPAPI required")
class TestSafeSealedStagedInstall(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix="f03-sealed-stage-")
        self.addCleanup(self.tmp.cleanup)
        self.base = Path(self.tmp.name)
        self.old = self.base / "Old Installed App"
        self.old.mkdir()
        self.old_exe = self.old / "NegmLoading.exe"
        self.old_exe.write_bytes(b"old exe - never execute")
        self.old_script = self.old / "uninstall.cmd"
        self.old_script.write_bytes(b'@echo off\r\nrd /s /q "%~dp0"\r\n')
        self.profile = self.base / "Profile"
        self.profile.mkdir()
        data = self.profile / ".negm_stream"
        data.mkdir()
        self.settings = data / "settings.json"
        self.settings.write_text('{"lang":"ar","theme":"Dark"}',
                                 encoding="utf-8")
        self.plan = legacy.inspect_legacy(
            self.old, profile_root=self.profile, registry=_reg(self.old)
        )
        self.crypto = legacy.WindowsDPAPI()
        self.backup = self.base / "Backup"
        legacy.create_verified_backup(self.plan, self.backup, self.crypto)
        self.payload = self.base / "new-payload.zip"
        self.stage = self.base / "New Staged Install"
        self.key = safety.make_test_anchor_key()
        self.addCleanup(safety.delete_test_anchor_key, self.key)
        with zipfile.ZipFile(self.payload, "w") as archive:
            archive.writestr("NegmLoading.exe", b"new app exe - never execute")
            archive.writestr("assets/icon.png", b"icon sample")
        legacy_stage.prepare_staging(
            self.plan, self.backup, self.payload, self.stage,
            protector=self.crypto, registry_snapshot=self.plan["registry"]
        )
        self.original_old_sha = safety.sha256_file(str(self.old_exe))
        self.original_script_sha = safety.sha256_file(str(self.old_script))
        self.original_settings_sha = safety.sha256_file(str(self.settings))

    def seal(self, consent=seal.CONSENT):
        return seal.seal_staged_install_for_test(
            self.plan, self.backup, self.payload, self.stage, self.key,
            consent=consent, protector=self.crypto,
            registry_snapshot=self.plan["registry"],
        )

    def assert_legacy_unchanged(self):
        self.assertEqual(safety.sha256_file(str(self.old_exe)),
                         self.original_old_sha)
        self.assertEqual(safety.sha256_file(str(self.old_script)),
                         self.original_script_sha)
        self.assertEqual(safety.sha256_file(str(self.settings)),
                         self.original_settings_sha)

    def test_sealed_stage_has_trusted_manifest_and_safe_uninstall(self):
        result = self.seal()
        self.assertEqual(
            result["status"],
            "SEALED_WITH_DISPOSABLE_HKCU_TEST_ANCHOR_ONLY"
        )
        self.assertFalse(result["production_activation"])
        self.assertTrue(result["old_registry_unchanged"])
        manifest = safety.load_manifest(
            str(self.stage), expected_app_name=safety.DEFAULT_APP_NAME
        )
        safety.verify_install_anchor(str(self.stage), manifest, self.key)
        self.assertTrue(manifest["created_root"])
        self.assertEqual(len(manifest["files"]), 4)
        self.assertEqual(manifest["shortcuts"], [])
        script = (self.stage / safety.UNINSTALL_PS1_FILENAME).read_text(
            encoding="utf-8-sig"
        )
        self.assertNotIn("rd /s /q", script.lower())
        self.assertIn(self.key, script)
        self.assertNotIn(safety.DEFAULT_UNINSTALL_KEY, script)
        self.assert_legacy_unchanged()

    def test_real_generated_cmd_safely_uninstalls_only_new_stage(self):
        self.seal()
        uninstaller = self.stage / safety.UNINSTALL_CMD_FILENAME
        result = subprocess.run(
            f'cmd.exe /s /c ""{uninstaller}""',
            cwd=str(self.stage), capture_output=True, text=True,
            timeout=120, check=False,
        )
        self.assertEqual(result.returncode, safety.EXIT_OK,
                         "Safe test-scope uninstaller must exit 0")
        self.assertFalse(self.stage.exists())
        self.assert_legacy_unchanged()
        import winreg
        with self.assertRaises(FileNotFoundError):
            winreg.OpenKey(winreg.HKEY_CURRENT_USER, self.key)

    def test_untracked_stage_data_is_preserved_by_generated_uninstaller(self):
        self.seal()
        important = self.stage / "UNTRACKED-USER-FILE.txt"
        important.write_text("keep", encoding="utf-8")
        result = subprocess.run(
            f'cmd.exe /s /c ""{self.stage / safety.UNINSTALL_CMD_FILENAME}""',
            cwd=str(self.stage), capture_output=True, text=True,
            timeout=120, check=False,
        )
        self.assertNotEqual(result.returncode, safety.EXIT_OK)
        self.assertEqual(important.read_text(encoding="utf-8"), "keep")
        self.assertTrue((self.stage / safety.MANIFEST_FILENAME).exists())
        self.assert_legacy_unchanged()

    def test_explicit_consent_required_before_any_registration(self):
        with self.assertRaises(legacy.MigrationBlocked):
            self.seal(consent=None)
        self.assertFalse((self.stage / safety.MANIFEST_FILENAME).exists())
        import winreg
        with self.assertRaises(FileNotFoundError):
            winreg.OpenKey(winreg.HKEY_CURRENT_USER, self.key)
        self.assert_legacy_unchanged()

    def test_extra_unowned_staged_file_blocks_sealing(self):
        (self.stage / "user-added.json").write_text("keep", encoding="utf-8")
        with self.assertRaises(legacy.MigrationBlocked):
            self.seal()
        self.assertFalse((self.stage / safety.MANIFEST_FILENAME).exists())
        self.assertTrue((self.stage / "user-added.json").is_file())
        self.assert_legacy_unchanged()

    def test_staged_file_changed_after_extraction_blocks_sealing(self):
        (self.stage / "NegmLoading.exe").write_bytes(b"tampered v2")
        with self.assertRaises(legacy.MigrationBlocked):
            self.seal()
        self.assertFalse((self.stage / safety.MANIFEST_FILENAME).exists())
        self.assert_legacy_unchanged()

    def test_preexisting_foreign_test_registry_anchor_is_preserved(self):
        import winreg
        with winreg.CreateKey(winreg.HKEY_CURRENT_USER, self.key) as key:
            winreg.SetValueEx(
                key, "ForeignValue", 0, winreg.REG_SZ, "PRESERVE"
            )
        with self.assertRaises(legacy.MigrationBlocked):
            self.seal()
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, self.key) as key:
            self.assertEqual(
                winreg.QueryValueEx(key, "ForeignValue")[0], "PRESERVE"
            )
        self.assertFalse((self.stage / safety.MANIFEST_FILENAME).exists())
        self.assert_legacy_unchanged()

    def test_real_product_registry_anchor_is_always_rejected(self):
        with self.assertRaises(legacy.MigrationBlocked):
            seal.seal_staged_install_for_test(
                self.plan, self.backup, self.payload, self.stage,
                safety.DEFAULT_UNINSTALL_KEY, consent=seal.CONSENT,
                protector=self.crypto,
                registry_snapshot=self.plan["registry"]
            )
        self.assertFalse((self.stage / safety.MANIFEST_FILENAME).exists())
        self.assert_legacy_unchanged()

    def test_modifying_legacy_app_after_backup_stops_sealing(self):
        self.old_exe.write_bytes(b"changed original - preserved")
        with self.assertRaises(legacy.MigrationBlocked):
            self.seal()
        self.assertEqual(self.old_exe.read_bytes(),
                         b"changed original - preserved")
        self.assertFalse((self.stage / safety.MANIFEST_FILENAME).exists())


if __name__ == "__main__":
    unittest.main()

"""Staging new payload must not adopt or alter an untrusted old install."""
import tempfile
import unittest
import zipfile
from pathlib import Path

import installer_safety as safety
import legacy_migration as migration
import legacy_stage as staging
from test_legacy_migration import FakeProtector, _reg


class TestLegacyStaging(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="f03-stage-")
        self.addCleanup(self.temp.cleanup)
        self.base = Path(self.temp.name)
        self.old = self.base / "Old"
        self.old.mkdir()
        self.old.joinpath("NegmLoading.exe").write_bytes(b"v1")
        self.old.joinpath("uninstall.cmd").write_bytes(
            b'@echo off\r\nrd /s /q "%~dp0"\r\n'
        )
        self.profile = self.base / "Profile"
        self.profile.mkdir()
        self.data = self.profile / ".negm_stream"
        self.data.mkdir()
        self.data.joinpath("settings.json").write_text(
            '{"lang":"ar"}', encoding="utf-8"
        )
        self.registry = _reg(self.old)
        self.plan = migration.inspect_legacy(
            self.old, profile_root=self.profile, registry=self.registry
        )
        self.protector = FakeProtector()
        self.backup = self.base / "Backup"
        migration.create_verified_backup(self.plan, self.backup, self.protector)
        self.zip = self.base / "new-build.zip"
        self.stage = self.base / "New"
        self.old_hash = safety.sha256_file(str(self.old / "NegmLoading.exe"))

    def package(self, additional=None):
        with zipfile.ZipFile(self.zip, "w") as z:
            z.writestr("NegmLoading.exe", b"v2")
            for name, data in (additional or {}).items():
                z.writestr(name, data)

    def test_successful_stage_never_activates_or_changes_old_data(self):
        self.package({"assets/icon.png": b"icon"})
        result = staging.prepare_staging(
            self.plan, self.backup, self.zip, self.stage,
            protector=self.protector, registry_snapshot=self.registry
        )
        self.assertEqual(result["status"], "STAGED_ONLY")
        self.assertIs(result["registry_changed"], False)
        self.assertEqual((self.stage / "NegmLoading.exe").read_bytes(), b"v2")
        self.assertEqual(safety.sha256_file(str(self.old / "NegmLoading.exe")),
                         self.old_hash)
        self.assertTrue(self.old.joinpath("uninstall.cmd").exists())
        with self.assertRaises(migration.MigrationBlocked):
            staging.prepare_staging(
                self.plan, self.backup, self.zip, self.stage,
                protector=self.protector, registry_snapshot=self.registry
            )

    def test_registry_drift_refuses_stage(self):
        self.package()
        changed = _reg(self.old)
        changed["uninstall"]["DisplayVersion"] = {
            "kind": 1, "value": "unexpected"
        }
        with self.assertRaises(migration.MigrationBlocked):
            staging.prepare_staging(
                self.plan, self.backup, self.zip, self.stage,
                protector=self.protector, registry_snapshot=changed
            )
        self.assertFalse(self.stage.exists())

    def test_user_state_changed_after_backup_refuses_stage(self):
        self.package()
        self.data.joinpath("settings.json").write_text(
            '{"lang":"en"}', encoding="utf-8"
        )
        with self.assertRaises(migration.MigrationBlocked):
            staging.prepare_staging(
                self.plan, self.backup, self.zip, self.stage,
                protector=self.protector, registry_snapshot=self.registry
            )
        self.assertFalse(self.stage.exists())

    def test_traversal_zip_refused_before_write(self):
        self.package({"../escape.txt": b"unsafe"})
        with self.assertRaises(safety.InstallSafetyError):
            staging.prepare_staging(
                self.plan, self.backup, self.zip, self.stage,
                protector=self.protector, registry_snapshot=self.registry
            )
        self.assertFalse(self.stage.exists())

    def test_stage_inside_protected_directory_refused(self):
        self.package()
        self.stage = self.old / "Stage"
        with self.assertRaises(migration.MigrationBlocked):
            staging.prepare_staging(
                self.plan, self.backup, self.zip, self.stage,
                protector=self.protector, registry_snapshot=self.registry
            )
        self.assertFalse(self.stage.exists())


if __name__ == "__main__":
    unittest.main()

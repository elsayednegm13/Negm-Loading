# -*- coding: utf-8 -*-
"""Safe F03 snapshot tests: NEVER execute a historical uninstall.cmd."""
import hashlib
import os
import tempfile
import unittest
import uuid
from pathlib import Path

import installer_safety as safety
import legacy_migration as migration


class FakeProtector:
    """Unit-test-only reversible transform; NEVER a production backup cipher."""
    def encrypt(self, data):
        return b"UNIT-ONLY:" + data[::-1]
    def decrypt(self, data):
        if not data.startswith(b"UNIT-ONLY:"):
            raise migration.MigrationBlocked("Injected corruption")
        return data[len(b"UNIT-ONLY:"):][::-1]


def _reg(root):
    return {
        "uninstall_key": safety.TEST_ANCHOR_PREFIX + "F03Unit",
        "run_key": safety.TEST_ANCHOR_PREFIX + "F03UnitRun",
        "uninstall": {
            "DisplayName": {"kind": 1, "value": migration.APP_NAME},
            "InstallLocation": {"kind": 1, "value": str(root)},
            "UninstallString": {"kind": 1,
                                "value": '"' + str(root / "uninstall.cmd") + '"'},
        },
        "run_value": None,
    }


class TestLegacyMigration(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="f03-unit-")
        self.addCleanup(self.temp.cleanup)
        self.base = Path(self.temp.name)
        self.old = self.base / "Old Install"
        self.old.mkdir()
        self.profile = self.base / "Profile"
        self.profile.mkdir()
        self.data = self.profile / ".negm_stream"
        self.data.mkdir()
        self.old_exe = self.old / "NegmLoading.exe"
        self.old_exe.write_bytes(b"legacy executable v1")
        self.unsafe_script = self.old / "uninstall.cmd"
        self.unsafe_script.write_text(
            '@echo off\nrd /s /q "%~dp0"\n', encoding="utf-8"
        )
        (self.old / "user-notes.txt").write_text(
            "PRESERVE USER NOTES", encoding="utf-8"
        )
        (self.data / "settings.json").write_text(
            '{"lang":"ar","folder":"D:/Downloads"}', encoding="utf-8"
        )
        (self.data / "site_credentials.json").write_text(
            '{"password":"highly-sensitive-example-secret"}', encoding="utf-8"
        )
        self.registry = _reg(self.old)

    def plan(self):
        return migration.inspect_legacy(
            str(self.old), profile_root=str(self.profile),
            registry=self.registry,
        )

    def test_inventory_is_read_only_and_keeps_every_source_byte(self):
        expected = {
            str(path): safety.sha256_file(str(path))
            for path in (self.old_exe, self.unsafe_script,
                         self.old / "user-notes.txt",
                         self.data / "settings.json",
                         self.data / "site_credentials.json")
        }
        plan = self.plan()
        self.assertEqual(plan["format"], migration.BACKUP_HEADER)
        self.assertEqual(len(plan["files"]), len(expected))
        self.assertEqual(expected, {
            path: safety.sha256_file(path) for path in expected
        })
        self.assertNotIn("manifest", " ".join(p.name for p in self.old.iterdir()))

    def test_legacy_registry_location_mismatch_fails_closed(self):
        self.registry["uninstall"]["InstallLocation"]["value"] = str(self.profile)
        with self.assertRaises(migration.MigrationBlocked):
            self.plan()
        self.assertEqual(self.unsafe_script.read_bytes()[:9], b"@echo off")

    def test_foreign_startup_target_fails_closed(self):
        self.registry["run_value"] = {
            "kind": 1, "value": '"C:\\Other\\foreign.exe" --tray'
        }
        with self.assertRaises(migration.MigrationBlocked):
            self.plan()

    def test_unrecognized_legacy_script_rejected(self):
        self.unsafe_script.write_text("@echo off\nrem not known\n", encoding="utf-8")
        with self.assertRaises(migration.MigrationBlocked):
            self.plan()

    def test_backup_restore_round_trip_into_new_root(self):
        plan = self.plan()
        protect = FakeProtector()
        backup = self.base / "Encrypted snapshot"
        migration.create_verified_backup(plan, backup, protect)
        self.assertEqual(len(migration.verify_backup(backup, protect)["files"]),
                         len(plan["files"]))
        target = self.base / "Restore to new folder"
        migration.restore_to_new_directory(backup, target, protect)
        for item in plan["files"]:
            source = Path(plan["roots"][item["area"]]) / Path(
                *item["relpath"].split("/")
            )
            restored = target / item["area"] / Path(*item["relpath"].split("/"))
            self.assertEqual(safety.sha256_file(str(source)),
                             safety.sha256_file(str(restored)))
        self.assertTrue(self.old_exe.exists())
        self.assertTrue(self.unsafe_script.exists())
        with self.assertRaises(migration.MigrationBlocked):
            migration.restore_to_new_directory(backup, target, protect)
        with self.assertRaises(migration.MigrationBlocked):
            migration.create_verified_backup(plan, backup, protect)

    def test_snapshot_refuses_new_files_created_during_backup(self):
        plan = self.plan()
        added = self.data / 'new-file-during-backup.txt'
        class NewFileDuringBackup(FakeProtector):
            injected = False
            def encrypt(self, data):
                if not self.injected:
                    self.injected = True
                    added.write_text('KEEP ME', encoding='utf-8')
                return super().encrypt(data)
        with self.assertRaises(migration.MigrationBlocked):
            migration.create_verified_backup(
                plan, self.base / 'Inconsistent snapshot',
                NewFileDuringBackup()
            )
        self.assertEqual(added.read_text(encoding='utf-8'), 'KEEP ME')
        self.assertTrue(self.old_exe.exists())

    def test_backup_detects_modified_source_and_never_overwrites(self):
        plan = self.plan()
        self.data.joinpath("settings.json").write_text(
            '{"lang":"modified"}', encoding="utf-8"
        )
        with self.assertRaises(migration.MigrationBlocked):
            migration.create_verified_backup(
                plan, self.base / "Incomplete backup", FakeProtector()
            )
        self.assertTrue(self.old_exe.exists())
        self.assertEqual(
            self.data.joinpath("settings.json").read_text(encoding="utf-8"),
            '{"lang":"modified"}',
        )

    def test_corrupt_encrypted_chunk_fails_verification(self):
        plan = self.plan()
        backup = self.base / "Backup"
        migration.create_verified_backup(plan, backup, FakeProtector())
        encrypted = backup / "00000000.dpapi"
        raw = encrypted.read_bytes()
        encrypted.write_bytes(raw[:-1] + bytes([raw[-1] ^ 0x55]))
        with self.assertRaises(migration.MigrationBlocked):
            migration.verify_backup(backup, FakeProtector())
        self.assertTrue(self.old_exe.exists())

    def test_refuse_backup_inside_install_or_profile_data(self):
        plan = self.plan()
        for proposed, area in ((self.old / "backup", "app"),
                               (self.data / "backup", "user_data")):
            with self.subTest(area=area):
                self.assertTrue(migration._inside(plan["roots"][area], proposed))
                with self.assertRaises(migration.MigrationBlocked):
                    migration.create_verified_backup(plan, proposed, FakeProtector())
                self.assertFalse(proposed.exists())

    def test_containment_requires_exact_directory_boundary(self):
        sibling = self.base / "Old Installation Other" / "backup"
        self.assertFalse(migration._inside(self.old, sibling))
        self.assertTrue(migration._inside(self.old, self.old / "backup"))

    def test_symlink_inside_old_tree_is_never_followed(self):
        victim = self.base / "external-secret.txt"
        victim.write_text("DO NOT TOUCH", encoding="utf-8")
        link = self.old / "foreign-link"
        try:
            link.symlink_to(victim)
        except (OSError, NotImplementedError):
            self.skipTest("Symlink privilege unavailable; scanner still rejects links")
        with self.assertRaises(migration.MigrationBlocked):
            self.plan()
        self.assertEqual(victim.read_text(encoding="utf-8"), "DO NOT TOUCH")

    @unittest.skipUnless(os.name == "nt", "Windows DPAPI user context")
    def test_real_windows_dpapi_protects_secrets_and_restores(self):
        plan = self.plan()
        protect = migration.WindowsDPAPI()
        backup = self.base / "Real encrypted backup"
        migration.create_verified_backup(plan, backup, protect)
        for p in backup.iterdir():
            self.assertNotIn(
                b"highly-sensitive-example-secret", p.read_bytes()
            )
        restored = self.base / "Real restored data"
        migration.restore_to_new_directory(backup, restored, protect)
        self.assertEqual(
            (restored / "user_data" / "site_credentials.json").read_text(encoding="utf-8"),
            '{"password":"highly-sensitive-example-secret"}',
        )

    @unittest.skipUnless(os.name == "nt", "Windows HKCU test key")
    def test_read_registry_uses_only_disposable_test_identity(self):
        import winreg
        key_path = safety.TEST_ANCHOR_PREFIX + "F03" + uuid.uuid4().hex
        run_path = key_path + r"\Run"
        try:
            with winreg.CreateKey(winreg.HKEY_CURRENT_USER, key_path) as reg:
                winreg.SetValueEx(reg, "DisplayName", 0, winreg.REG_SZ,
                                  migration.APP_NAME)
                winreg.SetValueEx(reg, "InstallLocation", 0, winreg.REG_SZ,
                                  str(self.old))
                winreg.SetValueEx(reg, "UninstallString", 0, winreg.REG_SZ,
                                  '"' + str(self.unsafe_script) + '"')
            with winreg.CreateKey(winreg.HKEY_CURRENT_USER, run_path) as run:
                winreg.SetValueEx(
                    run, migration.APP_NAME, 0, winreg.REG_SZ,
                    '"' + str(self.old_exe) + '" --tray'
                )
            snapshot = migration.read_legacy_registry(key_path, run_path)
            plan = migration.inspect_legacy(
                self.old, profile_root=self.profile, registry=snapshot
            )
            self.assertEqual(len(plan["registry"]["uninstall"]), 3)
            self.assertIsNotNone(plan["registry"]["run_value"])
        finally:
            try:
                winreg.DeleteKey(winreg.HKEY_CURRENT_USER, run_path)
            except FileNotFoundError:
                pass
            try:
                winreg.DeleteKey(winreg.HKEY_CURRENT_USER, key_path)
            except FileNotFoundError:
                pass


if __name__ == "__main__":
    unittest.main()

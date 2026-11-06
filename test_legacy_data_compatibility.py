# -*- coding: utf-8 -*-
"""F03 legacy user-state schema acceptance: read-only, no secret disclosure."""
import json
import tempfile
import unittest
import zipfile
from pathlib import Path

import installer_safety as safety
import legacy_data_compatibility as compat
import legacy_migration as migration
import legacy_stage
from test_legacy_migration import FakeProtector, _reg


class TestLegacyDataCompatibility(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix="f03-data-")
        self.addCleanup(self.tmp.cleanup)
        self.base = Path(self.tmp.name)
        self.old = self.base / "Old App"
        self.old.mkdir()
        (self.old / "NegmLoading.exe").write_bytes(b"old payload")
        (self.old / "uninstall.cmd").write_bytes(
            b'@echo off\r\nrd /s /q "%~dp0"\r\n'
        )
        self.profile = self.base / "Profile"
        self.profile.mkdir()
        self.data = self.profile / ".negm_stream"
        self.data.mkdir()
        self.samples = {
            "settings.json": {"lang": "ar", "theme": "Dark",
                              "folder": "D:/Downloads", "max_concurrent": 3},
            "downloads.json": [{"task_id": "task1", "url": "https://example.test/a",
                                "save_path": "D:/Downloads/a"}],
            "history.json": [{"id": "history1", "filename": "a"}],
            "proxies.json": [{"id": "proxy1", "host": "proxy.example.test"}],
            "site_credentials.json": [{"id": "cred1", "domain": "example.test",
                                       "password": "example-secret"}],
        }
        for name, value in self.samples.items():
            self.write(name, value)

    def write(self, name, data):
        (self.data / name).write_text(
            json.dumps(data, ensure_ascii=False), encoding="utf-8"
        )

    def plan(self):
        return migration.inspect_legacy(
            self.old, profile_root=self.profile, registry=_reg(self.old)
        )

    def test_valid_known_data_preserves_extra_files(self):
        (self.data / "user-notes.txt").write_text("Keep this file",
                                                   encoding="utf-8")
        plan = self.plan()
        report = compat.assess_user_data(plan)
        self.assertEqual(report["status"], "COMPATIBLE_FOR_STAGING")
        self.assertEqual(report["checked_files"], 5)
        self.assertEqual(report["counts"]["user_data:downloads"], 1)
        self.assertEqual(report["counts"]["user_data:credentials"], 1)
        self.assertNotIn("example-secret", json.dumps(report))
        self.assertEqual(
            (self.data / "user-notes.txt").read_text(encoding="utf-8"),
            "Keep this file",
        )

    def test_malformed_json_fails_without_leaking_secret(self):
        path = self.data / "site_credentials.json"
        path.write_text('{"password":"test-secret",', encoding="utf-8")
        with self.assertRaises(migration.MigrationBlocked) as failure:
            compat.assess_user_data(self.plan())
        self.assertNotIn("test-secret", str(failure.exception))

    def test_known_schema_conflicts_are_rejected(self):
        invalid = [
            ("settings.json", ["not an object"]),
            ("settings.json", {"lang": []}),
            ("settings.json", {"max_concurrent": False}),
            ("downloads.json", {"task_id": "bad"}),
            ("downloads.json", [{"task_id": "a", "url": "x"}]),
            ("downloads.json", [
                {"task_id": "duplicate", "url": "u", "save_path": "a"},
                {"task_id": "duplicate", "url": "u", "save_path": "b"}]),
            ("history.json", [{"id": "same"}, {"id": "same"}]),
            ("proxies.json", [{"id": "p1"}]),
            ("site_credentials.json", {"domain": "wrong shape"}),
            ("site_credentials.json", [
                {"id": "same", "domain": "a"},
                {"id": "same", "domain": "b"}]),
        ]
        for filename, value in invalid:
            with self.subTest(file=filename, invalid=value):
                # Preserve all other files and restore the fixture each time.
                self.write(filename, value)
                with self.assertRaises(migration.MigrationBlocked):
                    compat.assess_user_data(self.plan())
                self.write(filename, self.samples[filename])

    def test_duplicate_json_object_keys_blocked(self):
        (self.data / "settings.json").write_text(
            '{"lang":"ar","lang":"en"}', encoding="utf-8"
        )
        with self.assertRaises(migration.MigrationBlocked):
            compat.assess_user_data(self.plan())

    def test_modified_data_after_inventory_blocks_schema_check(self):
        plan = self.plan()
        self.write("settings.json", {"lang": "en"})
        with self.assertRaises(migration.MigrationBlocked):
            compat.assess_user_data(plan)

    def test_staging_malformed_credentials_preserves_old_install(self):
        self.write("site_credentials.json", {"password": "not a list"})
        plan = self.plan()
        backup = self.base / "Backup"
        crypto = FakeProtector()
        migration.create_verified_backup(plan, backup, crypto)
        package = self.base / "payload.zip"
        with zipfile.ZipFile(package, "w") as archive:
            archive.writestr("NegmLoading.exe", b"new")
        new_dir = self.base / "New Install"
        old_hash = safety.sha256_file(str(self.old / "NegmLoading.exe"))
        with self.assertRaises(migration.MigrationBlocked):
            legacy_stage.prepare_staging(
                plan, backup, package, new_dir,
                protector=crypto, registry_snapshot=plan["registry"]
            )
        self.assertFalse(new_dir.exists())
        self.assertEqual(safety.sha256_file(str(self.old / "NegmLoading.exe")),
                         old_hash)
        self.assertTrue(backup.joinpath(migration.INDEX_NAME).exists())


if __name__ == "__main__":
    unittest.main()

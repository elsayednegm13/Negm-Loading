# -*- coding: utf-8 -*-
"""Cross-resource crash/rollback regressions for F03 TEST-ONLY coordination."""
import hashlib
import tempfile
import unittest
import uuid
from pathlib import Path

import installer_safety as safety
import legacy_migration as legacy
import legacy_handover_preview as registry
import legacy_shortcut_preview as shortcuts
import legacy_resources_preview as resources
from test_legacy_migration import FakeProtector, _reg


class TestCoordinatedTestResourceRollback(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="f03-coordinated-")
        self.addCleanup(self.temp.cleanup)
        self.base = Path(self.temp.name)
        self.legacy_app = self.base / "Old App"
        self.legacy_app.mkdir()
        (self.legacy_app / "NegmLoading.exe").write_bytes(b"legacy")
        (self.legacy_app / "uninstall.cmd").write_bytes(
            b'@echo off\r\nrd /s /q "%~dp0"\r\n'
        )
        profile = self.base / "Profile"
        profile.mkdir()
        user = profile / ".negm_stream"
        user.mkdir()
        (user / "settings.json").write_text('{"lang":"ar"}', encoding="utf-8")
        plan = legacy.inspect_legacy(
            self.legacy_app, profile_root=profile, registry=_reg(self.legacy_app)
        )
        self.crypto = FakeProtector()
        self.backup = self.base / "Backup"
        legacy.create_verified_backup(plan, self.backup, self.crypto)
        self.registry_root = safety.TEST_ANCHOR_PREFIX + "F03Both" + uuid.uuid4().hex
        self.store = registry.FakeTestRegistry(self.registry_root)
        self.old_install = str(self.legacy_app)
        self.new_install = str(self.base / "Staged New App")
        self.store.set(self.registry_root, "InstallLocation", {
            "kind": registry.REG_SZ, "value": self.old_install
        })
        self.store.set(self.registry_root, "ForeignValue", {
            "kind": registry.REG_SZ, "value": "PRESERVE"
        })
        self.scope = self.base / "f03-shortcuts-transaction-test"
        self.scope.mkdir()
        self.desktop = self.scope / "Desktop" / "Negm Lodaing.lnk"
        self.desktop.parent.mkdir()
        self.desktop.write_bytes(b"old shortcut")
        self.menu = self.scope / "Menu" / "Negm Lodaing.lnk"
        self.menu.parent.mkdir()
        self.menu.write_bytes(b"old menu shortcut")
        self.foreign = self.scope / "Other.lnk"
        self.foreign.write_bytes(b"unrelated user shortcut")
        self.registry_wal = self.base / "registry-wal.dpapi"
        self.links_wal = self.base / "shortcut-wal.dpapi"
        registry.prepare_test_journal(
            self.store, [
                (self.registry_root, "InstallLocation", {
                    "kind": registry.REG_SZ, "value": self.new_install
                })
            ],
            self.registry_wal, self.backup, self.crypto
        )
        shortcuts.prepare_shortcut_test_journal(
            self.scope, [
                ("Desktop/Negm Lodaing.lnk",
                 hashlib.sha256(b"old shortcut").hexdigest(), b"new shortcut"),
                ("Menu/Negm Lodaing.lnk",
                 hashlib.sha256(b"old menu shortcut").hexdigest(), b"new menu shortcut"),
            ],
            self.links_wal, self.backup, self.crypto
        )

    def apply(self, before_step=None):
        return resources.apply_test_resources(
            self.store, self.registry_wal, self.scope, self.links_wal,
            self.backup, self.crypto, before_step=before_step
        )

    def recover(self):
        return resources.restore_test_resources(
            self.store, self.registry_wal, self.scope, self.links_wal,
            self.backup, self.crypto
        )

    def assert_old(self):
        self.assertEqual(
            self.store.get(self.registry_root, "InstallLocation")["value"],
            self.old_install
        )
        self.assertEqual(self.desktop.read_bytes(), b"old shortcut")
        self.assertEqual(self.menu.read_bytes(), b"old menu shortcut")
        self.assertEqual(self.foreign.read_bytes(), b"unrelated user shortcut")
        self.assertTrue((self.legacy_app / "uninstall.cmd").exists())

    def test_both_apply_then_explicit_rollback(self):
        self.assertEqual(self.apply(),
                         "BOTH_TEST_RESOURCES_APPLIED_NOT_ACTIVATED")
        self.assertEqual(self.store.get(self.registry_root, "InstallLocation")["value"],
                         self.new_install)
        self.assertEqual(self.desktop.read_bytes(), b"new shortcut")
        self.assertEqual(self.menu.read_bytes(), b"new menu shortcut")
        self.assertEqual(self.recover(), "BOTH_TEST_RESOURCES_RESTORED")
        self.assert_old()

    def test_denial_on_shortcut_rolls_back_already_written_registry(self):
        def deny(kind, index):
            if (kind, index) == ("shortcut", 1):
                raise PermissionError("Test refusal on second link")
        with self.assertRaises(PermissionError):
            self.apply(deny)
        self.assert_old()

    def test_hard_crash_after_first_shortcut_then_recovery(self):
        class HardExit(BaseException):
            pass
        def crash(kind, index):
            if (kind, index) == ("shortcut", 1):
                raise HardExit()
        with self.assertRaises(HardExit):
            self.apply(crash)
        self.assertEqual(
            self.store.get(self.registry_root, "InstallLocation")["value"],
            self.new_install
        )
        self.assertEqual(self.desktop.read_bytes(), b"new shortcut")
        self.assertEqual(self.menu.read_bytes(), b"old menu shortcut")
        self.assertEqual(self.recover(), "BOTH_TEST_RESOURCES_RESTORED")
        self.assert_old()

    def test_foreign_shortcut_edit_blocks_both_restorations(self):
        self.apply()
        self.desktop.write_bytes(b"unrelated user change")
        with self.assertRaises(legacy.MigrationBlocked):
            self.recover()
        # Neither resource was modified during the refused recovery.
        self.assertEqual(
            self.store.get(self.registry_root, "InstallLocation")["value"],
            self.new_install
        )
        self.assertEqual(self.desktop.read_bytes(), b"unrelated user change")

    def test_foreign_registry_edit_blocks_both_restorations(self):
        self.apply()
        self.store.set(self.registry_root, "InstallLocation", {
            "kind": registry.REG_SZ, "value": "THIRD PARTY VALUE"
        })
        with self.assertRaises(legacy.MigrationBlocked):
            self.recover()
        self.assertEqual(self.desktop.read_bytes(), b"new shortcut")
        self.assertEqual(self.store.get(self.registry_root,
                                        "InstallLocation")["value"], "THIRD PARTY VALUE")

    def test_lock_order_rejects_duplicate_registry_and_shortcut_wal(self):
        with self.assertRaises(legacy.MigrationBlocked):
            resources.restore_test_resources(
                self.store, self.registry_wal, self.scope,
                self.registry_wal, self.backup, self.crypto
            )
        self.assert_old()

    def test_one_busy_wal_refuses_changes_to_both_resources(self):
        with registry._exclusive_preview_lock(self.links_wal):
            with self.assertRaises(legacy.MigrationBlocked):
                self.apply()
        self.assert_old()


if __name__ == "__main__":
    unittest.main()

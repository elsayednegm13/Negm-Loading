# -*- coding: utf-8 -*-
"""Regression tests for test-key-only durable HKCU handover and recovery."""
import os
import tempfile
import unittest
import uuid
from pathlib import Path

import installer_safety as safety
import legacy_handover_preview as handover
import legacy_migration as migration
from test_legacy_migration import FakeProtector, _reg


class TestHandoverPreview(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="f03-journal-")
        self.addCleanup(self.temp.cleanup)
        self.base = Path(self.temp.name)
        self.old = self.base / "Old App"
        self.old.mkdir()
        (self.old / "NegmLoading.exe").write_bytes(b"old executable")
        (self.old / "uninstall.cmd").write_bytes(
            b'@echo off\r\nrd /s /q "%~dp0"\r\n'
        )
        self.profile = self.base / "Profile"
        self.profile.mkdir()
        self.data = self.profile / ".negm_stream"
        self.data.mkdir()
        (self.data / "settings.json").write_text(
            '{"lang":"ar"}', encoding="utf-8"
        )
        self.plan = migration.inspect_legacy(
            self.old, profile_root=self.profile, registry=_reg(self.old)
        )
        self.crypto = FakeProtector()
        self.backup = self.base / "Backup"
        migration.create_verified_backup(self.plan, self.backup, self.crypto)
        self.root = safety.TEST_ANCHOR_PREFIX + "F03Txn" + uuid.uuid4().hex
        self.run = self.root + r"\Run"
        self.store = handover.FakeTestRegistry(self.root)
        self.new_root = str(self.base / "Staged New App")
        self.old_location = str(self.old)
        self.old_cmd = str(self.old / "uninstall.cmd")
        self.new_cmd = str(Path(self.new_root) / "uninstall.cmd")
        self.store.set(self.root, "InstallLocation", {
            "kind": handover.REG_SZ, "value": self.old_location
        })
        self.store.set(self.root, "UninstallString", {
            "kind": handover.REG_SZ, "value": self.old_cmd
        })
        self.store.set(self.run, migration.APP_NAME, {
            "kind": handover.REG_SZ,
            "value": '"' + str(self.old / "NegmLoading.exe") + '" --tray'
        })
        self.store.set(self.root, "ForeignValue", {
            "kind": handover.REG_SZ, "value": "UNTOUCHED"
        })
        self.journal = self.base / "HandoverJournal.dpapi"
        self.changes = [
            (self.root, "InstallLocation", {
                "kind": handover.REG_SZ, "value": self.new_root
            }),
            (self.root, "UninstallString", {
                "kind": handover.REG_SZ, "value": self.new_cmd
            }),
            (self.run, migration.APP_NAME, {
                "kind": handover.REG_SZ,
                "value": '"' + str(Path(self.new_root) / "NegmLoading.exe") + '" --tray'
            }),
        ]

    def prepare(self):
        return handover.prepare_test_journal(
            self.store, self.changes, self.journal,
            self.backup, self.crypto
        )

    def test_journal_applies_recovers_and_preserves_foreign_values(self):
        self.prepare()
        self.assertEqual(self.store.get(self.root, "InstallLocation")["value"],
                         self.old_location)
        self.assertEqual(handover.apply_test_handover(
            self.store, self.journal, self.backup, self.crypto),
            "TEST_ONLY_APPLIED_NOT_PRODUCTION_ACTIVATION")
        self.assertEqual(self.store.get(self.root, "InstallLocation")["value"],
                         self.new_root)
        self.assertEqual(handover.recover_test_handover(
            self.store, self.journal, self.backup, self.crypto),
            "RESTORED_TEST_SCOPE")
        self.assertEqual(self.store.get(self.root, "InstallLocation")["value"],
                         self.old_location)
        self.assertEqual(self.store.get(self.root, "UninstallString")["value"],
                         self.old_cmd)
        self.assertIn(str(self.old),
                      self.store.get(self.run, migration.APP_NAME)["value"])
        self.assertEqual(self.store.get(self.root, "ForeignValue")["value"],
                         "UNTOUCHED")
        self.assertTrue(self.old.joinpath("uninstall.cmd").exists())
        self.assertTrue(self.journal.exists())

    def test_permission_error_on_second_write_rolls_back_first(self):
        self.prepare()
        def deny(index):
            if index == 1:
                raise PermissionError("simulated registry access denied")
        with self.assertRaises(PermissionError):
            handover.apply_test_handover(
                self.store, self.journal, self.backup, self.crypto,
                before_write=deny,
            )
        self.assertEqual(self.store.get(self.root, "InstallLocation")["value"],
                         self.old_location)
        self.assertEqual(self.store.get(self.root, "UninstallString")["value"],
                         self.old_cmd)

    def test_hard_crash_leave_wal_then_explicit_recovery(self):
        self.prepare()
        class HardExit(BaseException):
            pass
        def crash(index):
            if index == 1:
                raise HardExit()
        with self.assertRaises(HardExit):
            handover.apply_test_handover(
                self.store, self.journal, self.backup, self.crypto,
                before_write=crash,
            )
        self.assertEqual(self.store.get(self.root, "InstallLocation")["value"],
                         self.new_root)
        self.assertTrue(self.journal.exists())
        handover.recover_test_handover(
            self.store, self.journal, self.backup, self.crypto
        )
        self.assertEqual(self.store.get(self.root, "InstallLocation")["value"],
                         self.old_location)

    def test_foreign_edit_blocks_recovery_without_partial_overwrite(self):
        self.prepare()
        handover.apply_test_handover(
            self.store, self.journal, self.backup, self.crypto
        )
        self.store.set(self.root, "UninstallString", {
            "kind": handover.REG_SZ, "value": "FOREIGN EDIT"
        })
        with self.assertRaises(migration.MigrationBlocked):
            handover.recover_test_handover(
                self.store, self.journal, self.backup, self.crypto
            )
        self.assertEqual(self.store.get(self.root, "InstallLocation")["value"],
                         self.new_root)
        self.assertEqual(self.store.get(self.root, "UninstallString")["value"],
                         "FOREIGN EDIT")

    def test_duplicate_and_out_of_scope_operations_refused(self):
        with self.assertRaises(migration.MigrationBlocked):
            handover.prepare_test_journal(
                self.store, self.changes + [self.changes[0]],
                self.journal, self.backup, self.crypto
            )
        self.assertFalse(self.journal.exists())
        wrong = self.changes[0][1:]
        with self.assertRaises(migration.MigrationBlocked):
            handover.prepare_test_journal(
                self.store, [(safety.DEFAULT_UNINSTALL_KEY, *wrong)],
                self.journal, self.backup, self.crypto
            )
        self.assertFalse(self.journal.exists())

    def test_second_process_cannot_enter_locked_transaction(self):
        self.prepare()
        with handover._exclusive_preview_lock(self.journal):
            with self.assertRaises(migration.MigrationBlocked):
                handover.apply_test_handover(
                    self.store, self.journal, self.backup, self.crypto
                )
            self.assertEqual(
                self.store.get(self.root, "InstallLocation")["value"],
                self.old_location,
            )
        handover.apply_test_handover(
            self.store, self.journal, self.backup, self.crypto
        )
        self.assertEqual(self.store.get(self.root, "InstallLocation")["value"],
                         self.new_root)
        handover.recover_test_handover(
            self.store, self.journal, self.backup, self.crypto
        )
        self.assertEqual(self.store.get(self.root, "InstallLocation")["value"],
                         self.old_location)

    def test_existing_journal_refused_and_tampering_detected(self):
        self.prepare()
        with self.assertRaises(migration.MigrationBlocked):
            self.prepare()
        self.journal.write_bytes(b"tampered-journal")
        with self.assertRaises(migration.MigrationBlocked):
            handover.apply_test_handover(
                self.store, self.journal, self.backup, self.crypto
            )
        self.assertEqual(self.store.get(self.root, "InstallLocation")["value"],
                         self.old_location)

    def test_modified_encrypted_backup_blocks_apply(self):
        self.prepare()
        index = self.backup / migration.INDEX_NAME
        index.write_bytes(b"tampered")
        with self.assertRaises(migration.MigrationBlocked):
            handover.apply_test_handover(
                self.store, self.journal, self.backup, self.crypto
            )
        self.assertEqual(self.store.get(self.root, "InstallLocation")["value"],
                         self.old_location)

    @unittest.skipUnless(os.name == "nt", "Disposable HKCU test root requires Windows")
    def test_real_windows_registry_recovery_after_injected_crash(self):
        import winreg
        root = safety.TEST_ANCHOR_PREFIX + "F03Handover" + uuid.uuid4().hex
        run = root + r"\Run"
        crypto = migration.WindowsDPAPI()
        try:
            with winreg.CreateKey(winreg.HKEY_CURRENT_USER, root) as key:
                winreg.SetValueEx(key, "InstallLocation", 0,
                                  winreg.REG_SZ, str(self.old))
                winreg.SetValueEx(key, "ForeignValue", 0,
                                  winreg.REG_SZ, "PRESERVE")
            with winreg.CreateKey(winreg.HKEY_CURRENT_USER, run) as key:
                winreg.SetValueEx(key, migration.APP_NAME, 0,
                                  winreg.REG_SZ, "OLD STARTUP")
            store = handover.WindowsDisposableRegistry(root)
            changes = [
                (root, "InstallLocation", {
                    "kind": handover.REG_SZ, "value": self.new_root
                }),
                (run, migration.APP_NAME, {
                    "kind": handover.REG_SZ, "value": "NEW STARTUP"
                }),
            ]
            journal = self.base / "RealJournal.dpapi"
            # The test backup was made with a fake protector: create a real
            # DPAPI snapshot independently for the real-HKCU test case.
            real_backup = self.base / "RealBackup"
            migration.create_verified_backup(self.plan, real_backup, crypto)
            handover.prepare_test_journal(
                store, changes, journal, real_backup, crypto
            )
            class InjectedCrash(BaseException):
                pass
            with self.assertRaises(InjectedCrash):
                handover.apply_test_handover(
                    store, journal, real_backup, crypto,
                    before_write=lambda index:
                        (_ for _ in ()).throw(InjectedCrash()) if index == 1 else None
                )
            self.assertEqual(store.get(root, "InstallLocation")["value"],
                             self.new_root)
            handover.recover_test_handover(
                store, journal, real_backup, crypto
            )
            self.assertEqual(store.get(root, "InstallLocation")["value"],
                             str(self.old))
            self.assertEqual(store.get(run, migration.APP_NAME)["value"],
                             "OLD STARTUP")
            self.assertEqual(store.get(root, "ForeignValue")["value"],
                             "PRESERVE")
            self.assertIn(str(self.old), self.old_cmd)
        finally:
            try:
                winreg.DeleteKey(winreg.HKEY_CURRENT_USER, run)
            except FileNotFoundError:
                pass
            try:
                winreg.DeleteKey(winreg.HKEY_CURRENT_USER, root)
            except FileNotFoundError:
                pass


if __name__ == "__main__":
    unittest.main()

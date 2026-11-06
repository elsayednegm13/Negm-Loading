# -*- coding: utf-8 -*-
"""Safe test-only shortcut rollback exercises. No real user shortcuts touched."""
import hashlib
import os
import tempfile
import unittest
from pathlib import Path

import installer_safety as safety
import legacy_migration as legacy
import legacy_shortcut_preview as preview
from test_legacy_migration import FakeProtector, _reg


class TestShortcutRollbackPreview(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix="f03-shortcut-preview-")
        self.addCleanup(self.tmp.cleanup)
        self.base = Path(self.tmp.name)
        self.old = self.base / "Legacy Program"
        self.old.mkdir()
        (self.old / "NegmLoading.exe").write_bytes(b"old exe")
        (self.old / "uninstall.cmd").write_bytes(
            b'@echo off\r\nrd /s /q "%~dp0"\r\n'
        )
        profile = self.base / "Profile"
        profile.mkdir()
        data = profile / ".negm_stream"
        data.mkdir()
        (data / "settings.json").write_text('{"lang":"ar"}', encoding="utf-8")
        plan = legacy.inspect_legacy(
            self.old, profile_root=profile, registry=_reg(self.old)
        )
        self.crypto = FakeProtector()
        self.backup = self.base / "Backup"
        legacy.create_verified_backup(plan, self.backup, self.crypto)
        self.scope = self.base / "f03-shortcuts-disposable"
        self.scope.mkdir()
        self.desktop = self.scope / "Desktop" / "Negm Lodaing.lnk"
        self.desktop.parent.mkdir()
        self.menu = self.scope / "Start Menu" / "Negm Lodaing.lnk"
        self.menu.parent.mkdir()
        self.foreign = self.scope / "Foreign.lnk"
        self.desktop.write_bytes(b"opaque legacy desktop shortcut bytes")
        self.menu.write_bytes(b"opaque legacy menu shortcut bytes")
        self.foreign.write_bytes(b"other app shortcut; preserve me")
        self.old_desktop = self.desktop.read_bytes()
        self.old_menu = self.menu.read_bytes()
        self.journal = self.base / "shortcut-wal.dpapi"
        self.changes = [
            ("Desktop/Negm Lodaing.lnk",
             hashlib.sha256(self.old_desktop).hexdigest(),
             b"opaque new desktop shortcut bytes"),
            ("Start Menu/Negm Lodaing.lnk",
             hashlib.sha256(self.old_menu).hexdigest(),
             b"opaque new menu shortcut bytes"),
        ]

    def prepare(self, changes=None):
        return preview.prepare_shortcut_test_journal(
            self.scope, self.changes if changes is None else changes,
            self.journal, self.backup, self.crypto
        )

    def test_apply_and_restore_preserves_foreign_shortcut(self):
        self.prepare()
        self.assertEqual(
            preview.apply_shortcut_test_journal(
                self.scope, self.journal, self.backup, self.crypto
            ),
            "SHORTCUT_TEST_APPLIED_NO_ACTIVATION",
        )
        self.assertEqual(self.desktop.read_bytes(), self.changes[0][2])
        self.assertEqual(self.menu.read_bytes(), self.changes[1][2])
        self.assertEqual(preview.restore_shortcut_test_journal(
            self.scope, self.journal, self.backup, self.crypto),
            "SHORTCUT_TEST_RESTORED")
        self.assertEqual(self.desktop.read_bytes(), self.old_desktop)
        self.assertEqual(self.menu.read_bytes(), self.old_menu)
        self.assertEqual(self.foreign.read_bytes(),
                         b"other app shortcut; preserve me")
        self.assertTrue(self.journal.exists())
        self.assertTrue((self.old / "uninstall.cmd").exists())

    def test_denied_write_restores_previously_changed_shortcut(self):
        self.prepare()
        def fail_before(index):
            if index == 1:
                raise PermissionError("Injected permission denial")
        with self.assertRaises(PermissionError):
            preview.apply_shortcut_test_journal(
                self.scope, self.journal, self.backup, self.crypto,
                before_write=fail_before
            )
        self.assertEqual(self.desktop.read_bytes(), self.old_desktop)
        self.assertEqual(self.menu.read_bytes(), self.old_menu)

    def test_hard_exit_requires_explicit_recovery(self):
        self.prepare()
        class AbruptExit(BaseException):
            pass
        def crash(index):
            if index == 1:
                raise AbruptExit()
        with self.assertRaises(AbruptExit):
            preview.apply_shortcut_test_journal(
                self.scope, self.journal, self.backup, self.crypto,
                before_write=crash
            )
        self.assertEqual(self.desktop.read_bytes(), self.changes[0][2])
        self.assertEqual(self.menu.read_bytes(), self.old_menu)
        preview.restore_shortcut_test_journal(
            self.scope, self.journal, self.backup, self.crypto
        )
        self.assertEqual(self.desktop.read_bytes(), self.old_desktop)

    def test_foreign_edit_blocks_rollback_without_other_changes(self):
        self.prepare()
        preview.apply_shortcut_test_journal(
            self.scope, self.journal, self.backup, self.crypto
        )
        self.menu.write_bytes(b"unexpected user-edited shortcut")
        with self.assertRaises(legacy.MigrationBlocked):
            preview.restore_shortcut_test_journal(
                self.scope, self.journal, self.backup, self.crypto
            )
        self.assertEqual(self.desktop.read_bytes(), self.changes[0][2])
        self.assertEqual(self.menu.read_bytes(), b"unexpected user-edited shortcut")

    def test_unknown_shortcut_bytes_cannot_be_adopted(self):
        changes = [(self.changes[0][0], "0" * 64, self.changes[0][2])]
        with self.assertRaises(legacy.MigrationBlocked):
            self.prepare(changes)
        self.assertFalse(self.journal.exists())
        self.assertEqual(self.desktop.read_bytes(), self.old_desktop)

    def test_existing_link_blocks_journal(self):
        outside = self.base / "outside-user-owned.txt"
        outside.write_text("preserve", encoding="utf-8")
        self.desktop.unlink()
        try:
            self.desktop.symlink_to(outside)
        except (NotImplementedError, OSError):
            self.skipTest("Test symlink privilege unavailable")
        with self.assertRaises(legacy.MigrationBlocked):
            self.prepare()
        self.assertEqual(outside.read_text(encoding="utf-8"), "preserve")

    def test_preview_rejects_real_desktop_path(self):
        folder = self.base / "Desktop"
        folder.mkdir()
        (folder / "Negm Lodaing.lnk").write_bytes(b"foreign")
        with self.assertRaises(legacy.MigrationBlocked):
            preview.prepare_shortcut_test_journal(
                folder, [("Negm Lodaing.lnk",
                          hashlib.sha256(b"foreign").hexdigest(),
                          b"overwrite")],
                self.journal, self.backup, self.crypto
            )
        self.assertEqual((folder / "Negm Lodaing.lnk").read_bytes(), b"foreign")

    def test_second_shortcut_writer_is_refused_while_locked(self):
        self.prepare()
        with preview._exclusive_preview_lock(self.journal):
            with self.assertRaises(legacy.MigrationBlocked):
                preview.apply_shortcut_test_journal(
                    self.scope, self.journal, self.backup, self.crypto
                )
        self.assertEqual(self.desktop.read_bytes(), self.old_desktop)

    @unittest.skipUnless(os.name == "nt", "Windows DPAPI only")
    def test_actual_windows_dpapi_encrypts_shortcut_journal(self):
        self.crypto = legacy.WindowsDPAPI()
        # The initial test backup used FakeProtector; create a DPAPI snapshot.
        plan = legacy.inspect_legacy(
            self.old, profile_root=str(self.base / "Profile"),
            registry=_reg(self.old)
        )
        self.backup = self.base / "RealDPAPIBackup"
        legacy.create_verified_backup(plan, self.backup, self.crypto)
        self.prepare()
        self.assertNotIn(self.old_desktop, self.journal.read_bytes())
        preview.apply_shortcut_test_journal(
            self.scope, self.journal, self.backup, self.crypto
        )
        preview.restore_shortcut_test_journal(
            self.scope, self.journal, self.backup, self.crypto
        )
        self.assertEqual(self.desktop.read_bytes(), self.old_desktop)


if __name__ == "__main__":
    unittest.main()

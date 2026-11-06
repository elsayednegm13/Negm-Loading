# -*- coding: utf-8 -*-
"""DPAPI escrow tests with genuine Windows COM .lnk files in TEMP only.

These tests never use the user's real Desktop, Start Menu, or installed HKCU
values. They preserve original test shortcuts and restore only to NEW folders.
"""
import hashlib
import os
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import installer_safety as safety
import legacy_migration as legacy
import legacy_shortcut_inspection as inspection
import legacy_shortcut_escrow as escrow
from test_legacy_migration import _reg
from test_legacy_shortcut_inspection import _CREATE_LINK


@unittest.skipUnless(os.name == "nt", "Windows Shell COM and DPAPI required")
class TestRealShortcutEncryptedEscrow(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="f03-shortcut-escrow-")
        self.addCleanup(self.temp.cleanup)
        self.base = Path(self.temp.name)
        self.old = self.base / "Legacy, Program"
        self.old.mkdir()
        self.exe = self.old / "NegmLoading.exe"
        self.exe.write_bytes(b"old program fixture (never launched)")
        (self.old / "uninstall.cmd").write_bytes(
            b'@echo off\r\nrd /s /q "%~dp0"\r\n'
        )
        self.profile = self.base / "Profile"
        self.profile.mkdir()
        data = self.profile / ".negm_stream"
        data.mkdir()
        (data / "settings.json").write_text('{"lang":"ar"}', encoding="utf-8")
        self.plan = legacy.inspect_legacy(
            self.old, profile_root=self.profile, registry=_reg(self.old)
        )
        self.crypto = legacy.WindowsDPAPI()
        self.backup = self.base / "DPAPI Backup"
        legacy.create_verified_backup(self.plan, self.backup, self.crypto)
        self.desktop = self.base / "Desktop Test Only"
        self.desktop.mkdir()
        self.start = self.base / "Start Menu Test Only"
        self.start.mkdir()
        self.link_desktop = self.desktop / "Negm Lodaing.lnk"
        self.link_start = self.start / "Negm Lodaing.lnk"
        self.candidates = {
            "desktop": self.link_desktop,
            "start_menu": self.link_start,
        }
        self.escrow = self.base / "Escrow"
        self.restored = self.base / "Isolated Restored Shortcuts"
        self.create_shortcut(self.link_desktop)
        self.create_shortcut(self.link_start)

    def create_shortcut(self, path, target=None):
        env = os.environ.copy()
        target = target or self.exe
        env.update({
            "NEGM_F03_TEST_LINK": str(path),
            "NEGM_F03_TEST_TARGET": str(target),
            "NEGM_F03_TEST_ARGUMENTS": "",
            "NEGM_F03_TEST_WORKDIR": str(self.old),
            "NEGM_F03_TEST_ICON": str(self.exe) + ",0",
        })
        proc = subprocess.run(
            ["powershell.exe", "-NoProfile", "-NonInteractive",
             "-Command", _CREATE_LINK],
            env=env, capture_output=True, timeout=20,
            creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
        )
        self.assertEqual(proc.returncode, 0, "Test fixture shortcut creation failed")

    def escrow_originals(self):
        return escrow.create_shortcut_escrow(
            self.old, self.candidates, self.backup, self.escrow, self.crypto
        )

    def test_both_genuine_links_are_encrypted_and_restored_only_into_new_folder(self):
        originals = {name: path.read_bytes()
                     for name, path in self.candidates.items()}
        result = self.escrow_originals()
        self.assertEqual(result["saved_candidates"], 2)
        self.assertFalse(result["safe_to_replace"])
        for item in self.escrow.iterdir():
            data = item.read_bytes()
            self.assertNotIn(originals["desktop"], data)
            self.assertNotIn(originals["start_menu"], data)
            self.assertNotIn(str(self.old).encode("utf-8"), data)
        checked = escrow.verify_shortcut_escrow(
            self.escrow, self.backup, self.crypto
        )
        self.assertEqual(checked["saved_candidates"], 2)
        restored = escrow.restore_shortcuts_to_new_folder(
            self.escrow, self.backup, self.restored, self.crypto
        )
        self.assertEqual(restored["restored_candidates"], 2)
        for name, path in self.candidates.items():
            self.assertEqual(path.read_bytes(), originals[name])
            self.assertEqual((self.restored / (name + ".lnk")).read_bytes(),
                             originals[name])
        self.assertTrue((self.old / "uninstall.cmd").exists())

    def test_foreign_link_blocks_escrow_before_any_output(self):
        foreign = self.base / "Foreign.exe"
        foreign.write_bytes(b"not our program")
        self.create_shortcut(self.link_start, target=foreign)
        originals = {name: path.read_bytes()
                     for name, path in self.candidates.items()}
        with self.assertRaises(legacy.MigrationBlocked):
            self.escrow_originals()
        self.assertFalse(self.escrow.exists())
        for name, path in self.candidates.items():
            self.assertEqual(path.read_bytes(), originals[name])

    def test_tampered_encrypted_shortcut_blocks_verification_and_restore(self):
        self.escrow_originals()
        blob = self.escrow / "desktop.dpapi"
        encrypted = bytearray(blob.read_bytes())
        encrypted[-1] ^= 0x24
        blob.write_bytes(bytes(encrypted))
        with self.assertRaises(legacy.MigrationBlocked):
            escrow.verify_shortcut_escrow(
                self.escrow, self.backup, self.crypto
            )
        with self.assertRaises(legacy.MigrationBlocked):
            escrow.restore_shortcuts_to_new_folder(
                self.escrow, self.backup, self.restored, self.crypto
            )
        self.assertFalse(self.restored.exists())

    def test_existing_restore_destination_cannot_be_overwritten(self):
        self.escrow_originals()
        self.restored.mkdir()
        foreign = self.restored / "desktop.lnk"
        foreign.write_bytes(b"other user's file")
        with self.assertRaises(legacy.MigrationBlocked):
            escrow.restore_shortcuts_to_new_folder(
                self.escrow, self.backup, self.restored, self.crypto
            )
        self.assertEqual(foreign.read_bytes(), b"other user's file")

    def test_mismatched_legacy_root_is_rejected(self):
        self.escrow_originals()
        wrong = self.base / "Wrong Install"
        wrong.mkdir()
        with self.assertRaises(legacy.MigrationBlocked):
            escrow.create_shortcut_escrow(
                wrong, self.candidates, self.backup,
                self.base / "DifferentEscrow", self.crypto
            )
        self.assertFalse((self.base / "DifferentEscrow").exists())

    def test_changed_link_after_com_inspection_blocks_escrow_preflight(self):
        original_inspect = inspection.inspect_legacy_shortcut
        def change_after_read(path, root):
            outcome = original_inspect(path, root)
            if Path(path) == self.link_start:
                self.create_shortcut(self.link_start)
                # A visibly different .lnk while retaining the same target.
                with open(self.link_start, "ab") as stream:
                    stream.write(b"test-only appended change")
            return outcome
        with mock.patch.object(escrow.inspection, "inspect_legacy_shortcut",
                               side_effect=change_after_read):
            with self.assertRaises(legacy.MigrationBlocked):
                self.escrow_originals()
        self.assertFalse(self.escrow.exists())

    def test_duplicate_shortcut_source_is_refused(self):
        with self.assertRaises(legacy.MigrationBlocked):
            escrow.create_shortcut_escrow(
                self.old,
                {"desktop": self.link_desktop,
                 "start_menu": self.link_desktop},
                self.backup, self.escrow, self.crypto
            )
        self.assertFalse(self.escrow.exists())


class TestShortcutEscrowPortability(unittest.TestCase):
    @unittest.skipIf(os.name == "nt", "Windows-only refusal test")
    def test_linux_never_claims_shortcut_ownership(self):
        with self.assertRaises(legacy.MigrationBlocked):
            escrow.create_shortcut_escrow(
                "/tmp/old", {"desktop": "/tmp/x.lnk"},
                "/tmp/backup", "/tmp/escrow"
            )


if __name__ == "__main__":
    unittest.main()

# -*- coding: utf-8 -*-
"""Read-only regression: old untrusted uninstall scripts must never be executed.

This deliberately does not migrate or adopt a legacy installation. It verifies
that the new installer stops before touching any file in an untrusted folder.
"""
import hashlib
import os
import tempfile
import unittest
import zipfile
from pathlib import Path

import installer_engine
import installer_safety as safety


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


class TestLegacyUpgradeGuard(unittest.TestCase):
    def test_legacy_unsafe_script_blocks_upgrade_without_modification(self):
        with tempfile.TemporaryDirectory(prefix="f03-legacy-guard-") as tmp:
            base = Path(tmp)
            old = base / "Negm Old Installation"
            old.mkdir()
            legacy_cmd = old / "uninstall.cmd"
            # This is inert test data. NEVER execute the legacy script.
            legacy_cmd.write_bytes(b'@echo off\r\nrd /s /q "%~dp0"\r\n')
            self.assertTrue(
                safety.script_contains_forbidden_deletion(
                    legacy_cmd.read_text(encoding="utf-8")
                )
            )
            legacy_exe = old / "Negm Lodaing.exe"
            legacy_exe.write_bytes(b"legacy executable placeholder")
            inside_user = old / "my user notes.txt"
            inside_user.write_text("KEEP INSIDE", encoding="utf-8")
            outside_user = base / "my external notes.txt"
            outside_user.write_text("KEEP OUTSIDE", encoding="utf-8")
            package = base / "new-payload.zip"
            with zipfile.ZipFile(package, "w") as z:
                z.writestr(installer_engine.APP_EXE_FILENAME, b"new package")
            watched = [legacy_cmd, legacy_exe, inside_user, outside_user, package]
            before = {str(p): digest(p) for p in watched}
            initial_names = sorted(p.name for p in old.iterdir())

            with self.assertRaises(safety.InstallSafetyError) as rejected:
                installer_engine.prepare_and_copy_payload(
                    str(old), str(package),
                    startup=False,
                    anchor_key=safety.make_test_anchor_key(),
                )

            self.assertIn("بيان تثبيت موثوق", str(rejected.exception))
            self.assertEqual(
                {str(p): digest(p) for p in watched}, before
            )
            self.assertEqual(
                sorted(p.name for p in old.iterdir()), initial_names
            )
            self.assertFalse((old / installer_engine.APP_EXE_FILENAME).exists())
            self.assertFalse((old / safety.MANIFEST_FILENAME).exists())


if __name__ == "__main__":
    unittest.main()

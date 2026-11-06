# -*- coding: utf-8 -*-
"""Read-only ownership-candidate tests using REAL Windows .lnk COM files.

All created .lnk files are under a disposable temporary test directory.
No links are put on Desktop/Start Menu; no shortcut target is launched.
"""
import os
import subprocess
import tempfile
import unittest
from pathlib import Path

import installer_safety as safety
import legacy_migration as legacy
import legacy_shortcut_inspection as inspection


_CREATE_LINK = r"""
$ErrorActionPreference = 'Stop'
$ws = New-Object -ComObject WScript.Shell
$lnk = $ws.CreateShortcut($env:NEGM_F03_TEST_LINK)
$lnk.TargetPath = $env:NEGM_F03_TEST_TARGET
$lnk.Arguments = $env:NEGM_F03_TEST_ARGUMENTS
$lnk.WorkingDirectory = $env:NEGM_F03_TEST_WORKDIR
$lnk.IconLocation = $env:NEGM_F03_TEST_ICON
$lnk.Description = "F03 test-only link"
$lnk.Save()
"""


@unittest.skipUnless(os.name == "nt", "Actual Windows Shell COM required")
class TestRealLegacyShellLinkCandidate(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="f03-shell-link-")
        self.addCleanup(self.temp.cleanup)
        self.base = Path(self.temp.name)
        self.old = self.base / "Legacy, Program"
        self.old.mkdir()
        self.old_exe = self.old / "NegmLoading.exe"
        self.old_exe.write_bytes(b"old program sample, never run")
        self.foreign_exe = self.base / "ForeignTool.exe"
        self.foreign_exe.write_bytes(b"other program sample, never run")
        self.links = self.base / "f03-shortcuts-probe"
        self.links.mkdir()
        self.link = self.links / "Negm Lodaing.lnk"

    def create_link(self, *, target=None, workdir=None, arguments="",
                    icon=None):
        target = target or self.old_exe
        workdir = workdir or self.old
        icon = icon if icon is not None else str(self.old_exe) + ",0"
        env = os.environ.copy()
        env.update({
            "NEGM_F03_TEST_LINK": str(self.link),
            "NEGM_F03_TEST_TARGET": str(target),
            "NEGM_F03_TEST_ARGUMENTS": arguments,
            "NEGM_F03_TEST_WORKDIR": str(workdir),
            "NEGM_F03_TEST_ICON": str(icon),
        })
        result = subprocess.run(
            ["powershell.exe", "-NoProfile", "-NonInteractive",
             "-Command", _CREATE_LINK],
            env=env, capture_output=True, timeout=20,
            creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
        )
        self.assertEqual(result.returncode, 0, "COM test fixture generation failed")
        self.assertTrue(self.link.is_file())

    def test_known_old_exe_link_is_candidate_but_never_owned(self):
        self.create_link()
        expected = safety.sha256_file(str(self.link))
        outcome = inspection.inspect_legacy_shortcut(
            self.link, self.old, expected_sha256=expected
        )
        self.assertEqual(outcome["status"], inspection.CANDIDATE_STATUS)
        self.assertEqual(outcome["sha256"], expected)
        self.assertIs(outcome["safe_to_replace"], False)
        self.assertIs(outcome["requires_explicit_consent"], True)
        self.assertEqual((self.old_exe).read_bytes(), b"old program sample, never run")

    def test_both_legacy_executable_spellings_are_supported(self):
        old_spelling = self.old / "Negm Lodaing.exe"
        old_spelling.write_bytes(b"legacy spelling")
        self.create_link(target=old_spelling, icon=str(old_spelling) + ",0")
        result = inspection.inspect_legacy_shortcut(self.link, self.old)
        self.assertIs(result["safe_to_replace"], False)

    def test_foreign_shortcut_target_is_rejected(self):
        self.create_link(target=self.foreign_exe)
        with self.assertRaises(legacy.MigrationBlocked):
            inspection.inspect_legacy_shortcut(self.link, self.old)
        self.assertEqual(self.foreign_exe.read_bytes(),
                         b"other program sample, never run")

    def test_unexpected_launch_arguments_are_rejected(self):
        self.create_link(arguments="--run-untrusted-script")
        with self.assertRaises(legacy.MigrationBlocked):
            inspection.inspect_legacy_shortcut(self.link, self.old)

    def test_nonmatching_working_directory_is_rejected(self):
        self.create_link(workdir=self.links)
        with self.assertRaises(legacy.MigrationBlocked):
            inspection.inspect_legacy_shortcut(self.link, self.old)

    def test_icon_location_outside_old_install_is_rejected(self):
        self.create_link(icon=str(self.foreign_exe) + ",0")
        with self.assertRaises(legacy.MigrationBlocked):
            inspection.inspect_legacy_shortcut(self.link, self.old)

    def test_changed_link_bytes_are_rejected_before_com(self):
        self.create_link()
        old_sha = safety.sha256_file(str(self.link))
        self.create_link(arguments="--different")
        with self.assertRaises(legacy.MigrationBlocked):
            inspection.inspect_legacy_shortcut(
                self.link, self.old, expected_sha256=old_sha
            )

    def test_missing_or_nonlink_file_is_rejected(self):
        with self.assertRaises((legacy.MigrationBlocked, OSError)):
            inspection.inspect_legacy_shortcut(self.link, self.old)
        self.link.write_bytes(b"not a Windows shortcut")
        with self.assertRaises(legacy.MigrationBlocked):
            inspection.inspect_legacy_shortcut(self.link, self.old)

    def test_shortcut_symlink_is_refused(self):
        self.create_link()
        alias = self.links / "Alias.lnk"
        try:
            alias.symlink_to(self.link)
        except (OSError, NotImplementedError):
            self.skipTest("Windows symlink creation privilege unavailable")
        with self.assertRaises(legacy.MigrationBlocked):
            inspection.inspect_legacy_shortcut(alias, self.old)
        self.assertTrue(self.link.is_file())

    def test_real_shortcut_reader_does_not_change_shortcut_bytes(self):
        self.create_link()
        original = self.link.read_bytes()
        inspection.inspect_legacy_shortcut(self.link, self.old)
        self.assertEqual(self.link.read_bytes(), original)


class TestShortcutInspectionPortability(unittest.TestCase):
    @unittest.skipIf(os.name == "nt", "Non-Windows refusal only")
    def test_refuse_nonwindows_instead_of_guessing(self):
        with self.assertRaises(legacy.MigrationBlocked):
            inspection.inspect_legacy_shortcut("missing.lnk", "/tmp/missing")


if __name__ == "__main__":
    unittest.main()

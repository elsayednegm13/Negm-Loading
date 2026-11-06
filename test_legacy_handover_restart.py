# -*- coding: utf-8 -*-
"""Hard-crash / new-Python-process recovery on disposable Windows HKCU keys.

The child process is intentionally terminated by os._exit to model a sudden
application exit. Only test identity keys from TEST_ANCHOR_PREFIX are used.
No real installer/uninstaller is executed and no real application is launched.
"""
import os
import subprocess
import sys
import tempfile
import unittest
import uuid
from pathlib import Path

import installer_safety as safety
import legacy_handover_preview as handover
import legacy_migration as migration
from test_legacy_migration import _reg


_CHILD = r"""
import os
import sys
import legacy_handover_preview as handover
import legacy_migration as migration
root, backup, journal, mode = sys.argv[1:]
store = handover.WindowsDisposableRegistry(root)
cipher = migration.WindowsDPAPI()
if mode == "crash":
    def crash_before_second(index):
        if index == 1:
            os._exit(77)
    handover.apply_test_handover(store, journal, backup, cipher,
                                 before_write=crash_before_second)
    sys.exit(9)
elif mode == "recover":
    answer = handover.recover_test_handover(store, journal, backup, cipher)
    assert answer == "RESTORED_TEST_SCOPE"
    sys.exit(0)
else:
    raise SystemExit("Unsupported test action")
"""


@unittest.skipUnless(os.name == "nt", "Windows HKCU and DPAPI required")
class TestHandoverAcrossProcessRestart(unittest.TestCase):
    def test_os_exit_releases_lock_and_another_process_restores_values(self):
        import winreg
        with tempfile.TemporaryDirectory(prefix="f03-restart-") as tmp:
            home = Path(tmp)
            app = home / "Old App"
            app.mkdir()
            (app / "NegmLoading.exe").write_bytes(b"old")
            (app / "uninstall.cmd").write_bytes(
                b'@echo off\r\nrd /s /q "%~dp0"\r\n'
            )
            profile = home / "Profile"
            profile.mkdir()
            state = profile / ".negm_stream"
            state.mkdir()
            (state / "settings.json").write_text('{"lang":"ar"}',
                                                  encoding="utf-8")
            plan = migration.inspect_legacy(
                app, profile_root=profile, registry=_reg(app)
            )
            cipher = migration.WindowsDPAPI()
            backup = home / "Backup"
            migration.create_verified_backup(plan, backup, cipher)
            test_root = safety.TEST_ANCHOR_PREFIX + "Restart" + uuid.uuid4().hex
            startup_key = test_root + r"\Run"
            journal = home / "recover-journal.dpapi"
            old_install = str(app)
            new_install = str(home / "New App")
            old_startup = '"' + str(app / "NegmLoading.exe") + '" --tray'
            new_startup = '"' + str(home / "New App" / "NegmLoading.exe") + '" --tray'
            try:
                with winreg.CreateKey(winreg.HKEY_CURRENT_USER, test_root) as key:
                    winreg.SetValueEx(key, "InstallLocation", 0,
                                      winreg.REG_SZ, old_install)
                    winreg.SetValueEx(key, "ForeignValue", 0,
                                      winreg.REG_SZ, "DO NOT CHANGE")
                with winreg.CreateKey(winreg.HKEY_CURRENT_USER, startup_key) as key:
                    winreg.SetValueEx(key, migration.APP_NAME, 0,
                                      winreg.REG_SZ, old_startup)
                store = handover.WindowsDisposableRegistry(test_root)
                handover.prepare_test_journal(
                    store,
                    [
                        (test_root, "InstallLocation",
                         {"kind": handover.REG_SZ, "value": new_install}),
                        (startup_key, migration.APP_NAME,
                         {"kind": handover.REG_SZ, "value": new_startup}),
                    ],
                    journal, backup, cipher,
                )
                args = [sys.executable, "-u", "-c", _CHILD,
                        test_root, str(backup), str(journal)]
                died = subprocess.run(
                    args + ["crash"], capture_output=True, text=True,
                    timeout=35, check=False,
                )
                self.assertEqual(
                    died.returncode, 77,
                    "Subprocess did not reach crash checkpoint: " + died.stderr
                )
                self.assertEqual(
                    store.get(test_root, "InstallLocation")["value"], new_install
                )
                self.assertEqual(
                    store.get(startup_key, migration.APP_NAME)["value"], old_startup
                )
                self.assertTrue(journal.exists(), "Crash must preserve encrypted WAL")
                restored = subprocess.run(
                    args + ["recover"], capture_output=True, text=True,
                    timeout=35, check=False,
                )
                self.assertEqual(
                    restored.returncode, 0,
                    "Fresh process could not recover: " + restored.stderr
                )
                self.assertEqual(
                    store.get(test_root, "InstallLocation")["value"], old_install
                )
                self.assertEqual(
                    store.get(startup_key, migration.APP_NAME)["value"], old_startup
                )
                self.assertEqual(
                    store.get(test_root, "ForeignValue")["value"], "DO NOT CHANGE"
                )
                self.assertEqual((app / "NegmLoading.exe").read_bytes(), b"old")
                self.assertTrue((app / "uninstall.cmd").exists())
            finally:
                # Test-created keys only; never refer to production Uninstall/Run.
                try:
                    winreg.DeleteKey(winreg.HKEY_CURRENT_USER, startup_key)
                except FileNotFoundError:
                    pass
                try:
                    winreg.DeleteKey(winreg.HKEY_CURRENT_USER, test_root)
                except FileNotFoundError:
                    pass


if __name__ == "__main__":
    unittest.main()

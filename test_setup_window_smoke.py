# -*- coding: utf-8 -*-
"""Smoke test the real Windows setup EXE UI WITHOUT choosing Install.

Only opens the freshly built setup, checks that its main window is usable,
and asks the window to close. No installation, registry writes, shortcuts
or legacy uninstall scripts are triggered by the test.
"""
import ctypes
import os
import subprocess
import time
import unittest
from pathlib import Path


class TestPackagedSetupWindow(unittest.TestCase):
    @unittest.skipUnless(os.name == "nt", "Windows desktop required")
    def test_setup_executable_opens_and_closes_without_installing(self):
        from ctypes import wintypes

        setup_exe = Path("dist/NegmLoading-Setup.exe").resolve()
        self.assertTrue(setup_exe.is_file(), "Build setup EXE first")
        self.assertGreater(setup_exe.stat().st_size, 0)
        title = "Negm Lodaing 1.0.0 - Setup Wizard"
        user32 = ctypes.WinDLL("user32", use_last_error=True)
        user32.FindWindowW.argtypes = [wintypes.LPCWSTR, wintypes.LPCWSTR]
        user32.FindWindowW.restype = wintypes.HWND
        user32.PostMessageW.argtypes = [
            wintypes.HWND, wintypes.UINT, wintypes.WPARAM, wintypes.LPARAM
        ]
        user32.PostMessageW.restype = wintypes.BOOL

        def find_setup():
            return user32.FindWindowW(None, title)

        self.assertFalse(find_setup(), "Unexpected existing setup window")
        proc = subprocess.Popen(
            [str(setup_exe)], stdin=subprocess.DEVNULL,
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
        )
        try:
            end = time.monotonic() + 100
            hwnd = None
            while time.monotonic() < end:
                hwnd = find_setup()
                if hwnd:
                    break
                if proc.poll() is not None:
                    self.fail("Setup exited before displaying its main window")
                time.sleep(0.4)
            self.assertTrue(hwnd, "Packaged setup main window did not appear")
            # Ask the real Tk application to close. DO NOT click Install.
            self.assertTrue(
                user32.PostMessageW(hwnd, 0x0010, 0, 0),
                "WM_CLOSE could not be posted to the setup window"
            )
            try:
                proc.wait(timeout=25)
            except subprocess.TimeoutExpired:
                self.fail("Packaged setup did not close naturally")
            self.assertEqual(proc.returncode, 0, "Setup ended abnormally")
        finally:
            if proc.poll() is None:
                proc.kill()
                proc.wait(timeout=10)


if __name__ == "__main__":
    unittest.main()

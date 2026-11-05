# -*- coding: utf-8 -*-
"""Gated end-to-end test of the *packaged setup EXE* on an ephemeral CI VM.

This is intentionally separate from the in-process SetupWizard tests. It
uses the actual PyInstaller binary and unmodified production HKCU paths, but
only inside an explicitly opted-in, disposable GitHub-hosted Windows runner.

Never run this test on an ordinary PC or a persistent/self-hosted runner.
It MUST refuse existing product HKCU keys and values before any GUI action.
The test does not launch a legacy uninstaller or delete a pre-existing key.
"""
import ctypes
import hashlib
import os
import subprocess
import tempfile
import time
import unittest
from ctypes import wintypes
from pathlib import Path

APP = "Negm Lodaing"
APP_EXE = "NegmLoading.exe"
TITLE = "Negm Lodaing 1.0.0 - Setup Wizard"
UNINSTALL_KEY = r"Software\Microsoft\Windows\CurrentVersion\Uninstall\Negm Lodaing"
RUN_KEY = r"Software\Microsoft\Windows\CurrentVersion\Run"

# Mouse input is used only on the ephemeral, interactive CI desktop.
WM_CLOSE = 0x0010
LEFT_DOWN, LEFT_UP = 0x0002, 0x0004


def _sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def _open_user32():
    dll = ctypes.WinDLL("user32", use_last_error=True)
    dll.FindWindowW.argtypes = [wintypes.LPCWSTR, wintypes.LPCWSTR]
    dll.FindWindowW.restype = wintypes.HWND
    dll.IsWindowVisible.argtypes = [wintypes.HWND]
    dll.IsWindowVisible.restype = wintypes.BOOL
    dll.GetClientRect.argtypes = [wintypes.HWND, ctypes.POINTER(wintypes.RECT)]
    dll.GetClientRect.restype = wintypes.BOOL
    dll.ClientToScreen.argtypes = [wintypes.HWND, ctypes.POINTER(wintypes.POINT)]
    dll.ClientToScreen.restype = wintypes.BOOL
    dll.SetCursorPos.argtypes = [ctypes.c_int, ctypes.c_int]
    dll.SetCursorPos.restype = wintypes.BOOL
    dll.SetForegroundWindow.argtypes = [wintypes.HWND]
    dll.SetForegroundWindow.restype = wintypes.BOOL
    dll.ShowWindow.argtypes = [wintypes.HWND, ctypes.c_int]
    dll.PostMessageW.argtypes = [
        wintypes.HWND, wintypes.UINT, wintypes.WPARAM, wintypes.LPARAM
    ]
    dll.PostMessageW.restype = wintypes.BOOL
    dll.mouse_event.argtypes = [
        wintypes.DWORD, wintypes.DWORD, wintypes.DWORD, wintypes.DWORD, ctypes.c_void_p
    ]
    return dll


def _click_next(user32, hwnd):
    rc = wintypes.RECT()
    if not user32.GetClientRect(hwnd, ctypes.byref(rc)):
        raise AssertionError("Cannot read setup window client area")
    width, height = rc.right - rc.left, rc.bottom - rc.top
    if not (500 <= width <= 1600 and 430 <= height <= 1300):
        raise AssertionError(f"Unexpected setup client size: {width}x{height}")
    pt = wintypes.POINT(width - round(90 * width / 640), height - round(32 * height / 510))
    if not user32.ClientToScreen(hwnd, ctypes.byref(pt)):
        raise AssertionError("Cannot convert setup client point to screen")
    user32.ShowWindow(hwnd, 9)
    user32.SetForegroundWindow(hwnd)
    time.sleep(0.3)
    if not user32.SetCursorPos(pt.x, pt.y):
        raise AssertionError("Cannot move CI virtual desktop mouse")
    user32.mouse_event(LEFT_DOWN, 0, 0, 0, None)
    time.sleep(0.09)
    user32.mouse_event(LEFT_UP, 0, 0, 0, None)
    print(f"E2E clicked setup footer button; client={width}x{height}", flush=True)


def _wait_until(predicate, timeout, label):
    end = time.monotonic() + timeout
    while time.monotonic() < end:
        if predicate():
            return
        time.sleep(0.4)
    raise AssertionError(f"Timed out waiting for {label}")


class TestRealPackagedSetupE2E(unittest.TestCase):
    @unittest.skipUnless(os.name == "nt", "Windows GUI only")
    def test_packaged_exe_installs_upgrades_and_uninstalls(self):
        # Fail closed: only a fresh, GitHub-hosted (not self-hosted) disposable
        # runner may use this test, because the binary writes standard HKCU keys.
        self.assertEqual(os.environ.get("GITHUB_ACTIONS"), "true")
        self.assertEqual(os.environ.get("RUNNER_OS"), "Windows")
        self.assertEqual(os.environ.get("NEGM_PACKAGED_E2E_ALLOW"), "isolated-ephemeral-vm")
        self.assertEqual(os.environ.get("RUNNER_ENVIRONMENT"), "github-hosted")
        runner_temp = os.environ.get("RUNNER_TEMP")
        self.assertTrue(runner_temp and Path(runner_temp).is_dir())
        import winreg

        try:
            with winreg.OpenKey(winreg.HKEY_CURRENT_USER, UNINSTALL_KEY):
                self.fail("Product uninstall key already exists: refusing destructive test")
        except FileNotFoundError:
            pass
        try:
            with winreg.OpenKey(winreg.HKEY_CURRENT_USER, RUN_KEY) as run:
                try:
                    winreg.QueryValueEx(run, APP)
                except FileNotFoundError:
                    pass
                else:
                    self.fail("Product startup value exists: refusing destructive test")
        except FileNotFoundError:
            pass

        setup = Path("dist/NegmLoading-Setup.exe").resolve()
        self.assertTrue(setup.is_file())
        self.assertGreater(setup.stat().st_size, 0)
        user32 = _open_user32()
        self.assertFalse(user32.FindWindowW(None, TITLE), "Setup already open")

        with tempfile.TemporaryDirectory(prefix="ne-gui-e2e-", dir=runner_temp) as tmp:
            base = Path(tmp)
            local = base / "LocalAppData"
            roaming = base / "RoamingAppData"
            profile = base / "TestProfile"
            (profile / "Desktop").mkdir(parents=True)
            (roaming / "Microsoft" / "Windows" / "Start Menu" / "Programs").mkdir(parents=True)
            local.mkdir()
            temp_child = base / "Temp"
            temp_child.mkdir()
            env = os.environ.copy()
            env.update({
                "LOCALAPPDATA": str(local),
                "APPDATA": str(roaming),
                "USERPROFILE": str(profile),
                "TEMP": str(temp_child),
                "TMP": str(temp_child),
            })
            install_dir = local / "Programs" / APP
            desktop_lnk = profile / "Desktop" / (APP + ".lnk")
            menu_lnk = roaming / "Microsoft" / "Windows" / "Start Menu" / "Programs" / (APP + ".lnk")
            external = base / "UserNotesKeep.txt"
            external.write_text("User data must survive the install lifecycle.", encoding="utf-8")
            keep_hash = _sha(external)
            shortcut_hashes = None

            def read_registration():
                try:
                    with winreg.OpenKey(winreg.HKEY_CURRENT_USER, UNINSTALL_KEY) as key:
                        folder = winreg.QueryValueEx(key, "InstallLocation")[0]
                        cmd = winreg.QueryValueEx(key, "UninstallString")[0]
                        icon = winreg.QueryValueEx(key, "DisplayIcon")[0]
                    if os.path.normcase(os.path.abspath(folder)) != os.path.normcase(str(install_dir)):
                        return None
                    return cmd, icon
                except (FileNotFoundError, OSError):
                    return None

            for cycle in (1, 2):
                self.assertFalse(user32.FindWindowW(None, TITLE))
                proc = subprocess.Popen(
                    [str(setup)],
                    env=env, stdin=subprocess.DEVNULL,
                    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                )
                try:
                    _wait_until(
                        lambda: bool(user32.FindWindowW(None, TITLE)) or proc.poll() is not None,
                        100, "setup opening",
                    )
                    hwnd = user32.FindWindowW(None, TITLE)
                    self.assertTrue(hwnd, "Setup process exited before opening its window")
                    _wait_until(lambda: user32.IsWindowVisible(hwnd), 15, "visible setup")
                    time.sleep(2.0)
                    self.assertIsNone(proc.poll(), "Setup exited during initialization")
                    _click_next(user32, hwnd)  # Welcome -> options
                    time.sleep(1.0)
                    _click_next(user32, hwnd)  # Options -> real install worker
                    _wait_until(
                        lambda: read_registration() is not None or proc.poll() is not None,
                        110, f"actual installation cycle {cycle} registration",
                    )
                    registration = read_registration()
                    self.assertIsNotNone(
                        registration,
                        f"No product HKCU registration after real setup click in cycle {cycle}",
                    )
                    self.assertTrue((install_dir / APP_EXE).is_file())
                    self.assertEqual(
                        _sha(install_dir / APP_EXE), _sha(Path("dist") / APP_EXE)
                    )
                    self.assertEqual(os.path.normcase(registration[1]),
                                     os.path.normcase(str(install_dir / APP_EXE)))
                    self.assertTrue(desktop_lnk.is_file(), "Desktop shortcut missing")
                    self.assertTrue(menu_lnk.is_file(), "Start Menu shortcut missing")
                    this_hashes = (_sha(desktop_lnk), _sha(menu_lnk))
                    if shortcut_hashes is not None:
                        self.assertEqual(this_hashes, shortcut_hashes,
                                         "Upgrade changed existing shortcuts")
                    shortcut_hashes = this_hashes
                    self.assertEqual(_sha(external), keep_hash)
                    time.sleep(2.0)  # Let the GUI enter the installed step.
                    self.assertTrue(user32.PostMessageW(hwnd, WM_CLOSE, 0, 0))
                    proc.wait(timeout=35)
                    self.assertEqual(proc.returncode, 0, "Setup did not close naturally")
                    print(f"Packaged setup cycle {cycle}: registered and closed.", flush=True)
                finally:
                    if proc.poll() is None:
                        hwnd = user32.FindWindowW(None, TITLE)
                        if hwnd:
                            user32.PostMessageW(hwnd, WM_CLOSE, 0, 0)
                        try:
                            proc.wait(timeout=6)
                        except subprocess.TimeoutExpired:
                            proc.kill()
                            proc.wait(timeout=15)

            registration = read_registration()
            self.assertIsNotNone(registration)
            uninstaller = install_dir / "uninstall.cmd"
            self.assertTrue(uninstaller.is_file())
            self.assertEqual(
                os.path.normcase(registration[0].strip('"')),
                os.path.normcase(str(uninstaller)),
            )
            outcome = subprocess.run(
                'cmd.exe /s /c ""%s""' % uninstaller,
                cwd=str(install_dir), env=env,
                capture_output=True, text=True, timeout=120, check=False,
            )
            self.assertEqual(outcome.returncode, 0, outcome.stdout + outcome.stderr)
            self.assertFalse((install_dir / APP_EXE).exists())
            self.assertFalse(desktop_lnk.exists())
            self.assertFalse(menu_lnk.exists())
            self.assertEqual(_sha(external), keep_hash)
            with self.assertRaises(FileNotFoundError):
                winreg.OpenKey(winreg.HKEY_CURRENT_USER, UNINSTALL_KEY)
            print("Packaged setup E2E: install/upgrade/uninstall passed.", flush=True)


    @unittest.skipUnless(os.name == "nt", "Windows GUI only")
    def test_packaged_exe_refuses_untrusted_legacy_folder(self):
        # The legacy script is inert test data. It is NEVER executed.
        self.assertEqual(os.environ.get("GITHUB_ACTIONS"), "true")
        self.assertEqual(os.environ.get("RUNNER_ENVIRONMENT"), "github-hosted")
        self.assertEqual(os.environ.get("NEGM_PACKAGED_E2E_ALLOW"),
                         "isolated-ephemeral-vm")
        import winreg

        with self.assertRaises(FileNotFoundError):
            winreg.OpenKey(winreg.HKEY_CURRENT_USER, UNINSTALL_KEY)
        runner_temp = os.environ["RUNNER_TEMP"]
        setup = Path("dist/NegmLoading-Setup.exe").resolve()
        self.assertTrue(setup.is_file())
        user32 = _open_user32()
        self.assertFalse(user32.FindWindowW(None, TITLE))
        with tempfile.TemporaryDirectory(prefix="ne-legacy-refusal-", dir=runner_temp) as tmp:
            base = Path(tmp)
            local = base / "Local"
            profile = base / "Profile"
            roaming = base / "Roaming"
            temp_child = base / "Temp"
            for directory in (local, profile / "Desktop", roaming, temp_child):
                directory.mkdir(parents=True, exist_ok=True)
            legacy = local / "Programs" / APP
            legacy.mkdir(parents=True)
            old_script = legacy / "uninstall.cmd"
            old_script.write_bytes(b'@echo off\r\nrd /s /q "%~dp0"\r\n')
            old_exe = legacy / "Negm Lodaing.exe"
            old_exe.write_bytes(b"old executable placeholder")
            inside = legacy / "user-important.txt"
            inside.write_text("PRESERVE OLD USER DATA", encoding="utf-8")
            outside = base / "other-user-data.txt"
            outside.write_text("KEEP OUTSIDE TOO", encoding="utf-8")
            watched = [old_script, old_exe, inside, outside]
            old_hashes = [_sha(p) for p in watched]
            env = os.environ.copy()
            env.update({
                "LOCALAPPDATA": str(local),
                "USERPROFILE": str(profile),
                "APPDATA": str(roaming),
                "TEMP": str(temp_child),
                "TMP": str(temp_child),
            })
            proc = subprocess.Popen(
                [str(setup)], env=env, stdin=subprocess.DEVNULL,
                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
            )
            try:
                _wait_until(
                    lambda: bool(user32.FindWindowW(None, TITLE)) or proc.poll() is not None,
                    100, "legacy refusal setup window",
                )
                hwnd = user32.FindWindowW(None, TITLE)
                self.assertTrue(hwnd, "Legacy refusal test setup failed to open")
                _wait_until(lambda: user32.IsWindowVisible(hwnd), 15, "visible legacy test setup")
                time.sleep(2)
                _click_next(user32, hwnd)
                time.sleep(1)
                _click_next(user32, hwnd)
                # The preflight rejection is synchronous and precedes any write.
                time.sleep(4)
                self.assertEqual([_sha(p) for p in watched], old_hashes)
                self.assertEqual(
                    sorted(p.name for p in legacy.iterdir()),
                    sorted(["uninstall.cmd", "Negm Lodaing.exe", "user-important.txt"]),
                )
                self.assertFalse((legacy / APP_EXE).exists())
                self.assertFalse((legacy / "negmloading-install-manifest.json").exists())
                with self.assertRaises(FileNotFoundError):
                    winreg.OpenKey(winreg.HKEY_CURRENT_USER, UNINSTALL_KEY)
                self.assertTrue(user32.PostMessageW(hwnd, WM_CLOSE, 0, 0))
                proc.wait(timeout=30)
                self.assertEqual(proc.returncode, 0)
                print("Packaged setup refused untrusted legacy folder without writes.", flush=True)
            finally:
                if proc.poll() is None:
                    hwnd = user32.FindWindowW(None, TITLE)
                    if hwnd:
                        user32.PostMessageW(hwnd, WM_CLOSE, 0, 0)
                    try:
                        proc.wait(timeout=5)
                    except subprocess.TimeoutExpired:
                        proc.kill()
                        proc.wait(timeout=15)



if __name__ == "__main__":
    unittest.main()

# -*- coding: utf-8 -*-
"""F03: real packaged Setup EXE -> external owned uninstall E2E, ephemeral CI VM.

Unlike fixture-only unit tests, this test drives the actual PyInstaller setup
GUI, waits for genuine product HKCU registration, and uses a manifest-bound
external coordinator to remove the installed executable and REAL installer-
created shortcuts. The old recursive legacy uninstall is never executed.

HARD GATE: only a fresh GitHub-hosted Windows runner with opt-in env may run
this test. It must refuse any pre-existing product key/startup integration.
No real user's installation or downloaded data may be touched.
"""
import os
import subprocess
import tempfile
import time
import unittest
from pathlib import Path

import installer_external_uninstall as coordinator
import installer_safety as safety
from test_packaged_setup_e2e import (
    APP, APP_EXE, TITLE, UNINSTALL_KEY, RUN_KEY, WM_CLOSE,
    _open_user32, _wait_until, _click_next, _sha,
)


@unittest.skipUnless(os.name == "nt", "Packaged Windows setup requires Windows")
class TestF03PackagedExternalUninstall(unittest.TestCase):
    def test_real_setup_shortcuts_then_external_complete_uninstall(self):
        # Never weaken this guard to accommodate a persistent/private runner.
        self.assertEqual(os.environ.get("GITHUB_ACTIONS"), "true")
        self.assertEqual(os.environ.get("RUNNER_OS"), "Windows")
        self.assertEqual(os.environ.get("RUNNER_ENVIRONMENT"), "github-hosted")
        self.assertEqual(os.environ.get("NEGM_PACKAGED_E2E_ALLOW"),
                         "isolated-ephemeral-vm")
        runner_temp = os.environ.get("RUNNER_TEMP")
        self.assertTrue(runner_temp and Path(runner_temp).is_dir())
        import winreg

        with self.assertRaises(FileNotFoundError):
            winreg.OpenKey(winreg.HKEY_CURRENT_USER, UNINSTALL_KEY)
        try:
            with winreg.OpenKey(winreg.HKEY_CURRENT_USER, RUN_KEY) as startup:
                with self.assertRaises(FileNotFoundError):
                    winreg.QueryValueEx(startup, APP)
        except FileNotFoundError:
            pass

        setup = Path("dist/NegmLoading-Setup.exe").resolve()
        program = Path("dist/NegmLoading.exe").resolve()
        self.assertTrue(setup.is_file() and program.is_file())
        user32 = _open_user32()
        self.assertFalse(user32.FindWindowW(None, TITLE),
                         "Unexpected existing product setup GUI")
        with tempfile.TemporaryDirectory(prefix="f03-packaged-external-",
                                          dir=runner_temp) as temp:
            base = Path(temp)
            local = base / "LocalAppData"
            roaming = base / "RoamingAppData"
            profile = base / "Profile"
            (profile / "Desktop").mkdir(parents=True)
            (roaming / "Microsoft" / "Windows" / "Start Menu" / "Programs").mkdir(
                parents=True
            )
            local.mkdir()
            subprocess_temp = base / "ChildTemp"
            subprocess_temp.mkdir()
            env = os.environ.copy()
            env.update({
                "LOCALAPPDATA": str(local),
                "APPDATA": str(roaming),
                "USERPROFILE": str(profile),
                "TEMP": str(subprocess_temp),
                "TMP": str(subprocess_temp),
            })
            install = local / "Programs" / APP
            desktop = profile / "Desktop" / (APP + ".lnk")
            menu = (roaming / "Microsoft" / "Windows" / "Start Menu" /
                    "Programs" / (APP + ".lnk"))
            preserved = base / "Unrelated-user-data.txt"
            preserved.write_text("NEVER DELETE USER FILE", encoding="utf-8")
            original_user_hash = _sha(preserved)
            process = subprocess.Popen(
                [str(setup)], env=env,
                stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            try:
                _wait_until(
                    lambda: bool(user32.FindWindowW(None, TITLE))
                    or process.poll() is not None,
                    110, "packaged F03 setup window",
                )
                hwnd = user32.FindWindowW(None, TITLE)
                self.assertTrue(hwnd and user32.IsWindowVisible(hwnd))
                time.sleep(2)
                _click_next(user32, hwnd)
                time.sleep(1)
                _click_next(user32, hwnd)

                def registered():
                    try:
                        with winreg.OpenKey(winreg.HKEY_CURRENT_USER,
                                            UNINSTALL_KEY) as key:
                            found = winreg.QueryValueEx(key, "InstallLocation")[0]
                        return os.path.normcase(os.path.abspath(found)) == (
                            os.path.normcase(os.path.abspath(str(install)))
                        )
                    except (OSError, FileNotFoundError):
                        return False

                _wait_until(
                    lambda: registered() or process.poll() is not None,
                    130, "real HKCU registration by packaged setup",
                )
                self.assertTrue(registered(), "Packaged setup failed registration")
                self.assertEqual(_sha(install / APP_EXE), _sha(program))
                self.assertTrue(desktop.is_file())
                self.assertTrue(menu.is_file())
                self.assertTrue((install / safety.MANIFEST_FILENAME).is_file())
                manifest = safety.load_manifest(str(install))
                safety.verify_install_anchor(str(install), manifest, UNINSTALL_KEY)
                self.assertEqual(len(manifest["shortcuts"]), 2)
                time.sleep(2)
                self.assertTrue(user32.PostMessageW(hwnd, WM_CLOSE, 0, 0))
                process.wait(timeout=35)
                self.assertEqual(process.returncode, 0)
            finally:
                if process.poll() is None:
                    hwnd = user32.FindWindowW(None, TITLE)
                    if hwnd:
                        user32.PostMessageW(hwnd, WM_CLOSE, 0, 0)
                    try:
                        process.wait(timeout=7)
                    except subprocess.TimeoutExpired:
                        process.kill()
                        process.wait(timeout=15)

            # A post-install user file must block removal BEFORE any helper.
            inside = install / "KEEP-MY-FILE.txt"
            inside.write_text("NEVER DELETE ME", encoding="utf-8")
            with self.assertRaises(safety.InstallSafetyError):
                coordinator.complete_verified_uninstall(
                    str(install), UNINSTALL_KEY, consent=coordinator.CONSENT
                )
            self.assertEqual(inside.read_text(encoding="utf-8"),
                             "NEVER DELETE ME")
            self.assertTrue((install / APP_EXE).exists())
            self.assertTrue(desktop.is_file() and menu.is_file())
            inside.unlink()  # Remove ONLY our own deliberately created fixture.

            done = coordinator.complete_verified_uninstall(
                str(install), UNINSTALL_KEY, consent=coordinator.CONSENT
            )
            self.assertEqual(done["status"], "COMPLETE_VERIFIED_UNINSTALL")
            self.assertFalse(install.exists())
            self.assertFalse(desktop.exists())
            self.assertFalse(menu.exists())
            self.assertEqual(_sha(preserved), original_user_hash)
            with self.assertRaises(FileNotFoundError):
                winreg.OpenKey(winreg.HKEY_CURRENT_USER, UNINSTALL_KEY)
            print(
                "F03 packaged E2E PASS: real setup, owned shortcut identity, "
                "foreign file refusal and complete external uninstall.",
                flush=True,
            )


if __name__ == "__main__":
    unittest.main()

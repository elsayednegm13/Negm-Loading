# -*- coding: utf-8 -*-
"""F04-VM03/04: real packaged Windows wizard installation into an isolated CI profile.

This program must ONLY run on a disposable GitHub-hosted Windows runner.
It NEVER runs the historical uninstall.cmd; any cleanup invokes the verified
safe_uninstall function with a manifest-bound, runner-temp-only installation.
Failure or non-verified ownership always leaves data untouched for runner disposal.
"""
from __future__ import annotations

import ctypes
from ctypes import wintypes
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import time
import traceback
import winreg

sys.path.insert(0, str(Path.cwd()))
from f04_packaged_gui_smoke import _windows_for_exe, _existing_key
import installer_engine as engine
import installer_safety as safety

REPORT = Path("f04-gui-fresh-install-evidence.json")
SW_RESTORE = 9
MOUSEEVENTF_LEFTDOWN = 0x0002
MOUSEEVENTF_LEFTUP = 0x0004


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _win_error(message: str):
    raise RuntimeError(message + " Windows error=" + str(ctypes.get_last_error()))


def click_next(window):
    """Click the wizard's next/install footer button in client coordinates."""
    user = ctypes.WinDLL("user32", use_last_error=True)
    user.GetClientRect.argtypes = [wintypes.HWND, ctypes.POINTER(wintypes.RECT)]
    user.GetClientRect.restype = wintypes.BOOL
    user.ClientToScreen.argtypes = [wintypes.HWND, ctypes.POINTER(wintypes.POINT)]
    user.ClientToScreen.restype = wintypes.BOOL
    user.SetCursorPos.argtypes = [ctypes.c_int, ctypes.c_int]
    user.SetCursorPos.restype = wintypes.BOOL
    user.ShowWindow.argtypes = [wintypes.HWND, ctypes.c_int]
    user.SetForegroundWindow.argtypes = [wintypes.HWND]
    user.mouse_event.argtypes = [wintypes.DWORD, wintypes.DWORD, wintypes.DWORD, wintypes.DWORD, ctypes.c_ulong]
    rect = wintypes.RECT()
    hwnd = wintypes.HWND(window["hwnd"])
    if not user.GetClientRect(hwnd, ctypes.byref(rect)):
        _win_error("GetClientRect")
    w, h = rect.right - rect.left, rect.bottom - rect.top
    if not (500 <= w <= 1500 and 400 <= h <= 1100):
        raise RuntimeError("Unexpected wizard dimensions; refusing to click: " + repr((w, h)))
    # The footer Next/Install CTkButton is packed right, width=130,
    # right margin=24, with a 64px-high footer (see SetupWizard.build_ui).
    point = wintypes.POINT(w - 24 - 65, h - 32)
    if not user.ClientToScreen(hwnd, ctypes.byref(point)):
        _win_error("ClientToScreen")
    user.ShowWindow(hwnd, SW_RESTORE)
    user.SetForegroundWindow(hwnd)
    time.sleep(0.3)
    if not user.SetCursorPos(point.x, point.y):
        _win_error("SetCursorPos")
    time.sleep(0.15)
    user.mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
    time.sleep(0.15)
    user.mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)
    return {"client_size": [w, h], "clicked_client": [w - 89, h - 32]}


def matching_wizard(exe: Path):
    matches = [w for w in _windows_for_exe(exe)
               if "Setup Wizard" in w["title"] and engine.APP_NAME in w["title"]]
    if len(matches) > 1:
        raise RuntimeError("More than one matching setup wizard; refusing UI automation")
    return matches[0] if matches else None


def wait_wizard(exe: Path, proc, timeout: int = 50):
    limit = time.monotonic() + timeout
    while time.monotonic() < limit:
        win = matching_wizard(exe)
        if win is not None:
            return win
        if proc.poll() is not None:
            raise RuntimeError("Setup.exe exited before wizard window: " + str(proc.returncode))
        time.sleep(1)
    raise RuntimeError("Setup.exe window not found before deadline")


def shortcut_target(path: Path, environment: dict) -> str:
    command = (
        '$ErrorActionPreference = "Stop"; '
        '$s = New-Object -ComObject WScript.Shell; '
        '$k = $s.CreateShortcut($env:F04_SHORTCUT_PATH); '
        '[Console]::Out.WriteLine($k.TargetPath)'
    )
    e = environment.copy()
    e["F04_SHORTCUT_PATH"] = str(path)
    result = subprocess.run(
        ["powershell.exe", "-NoProfile", "-NonInteractive", "-Command", command],
        capture_output=True, text=True, timeout=25, check=True, env=e
    )
    return result.stdout.strip()


def registry_value(key: str, name: str) -> str:
    with winreg.OpenKey(winreg.HKEY_CURRENT_USER, key, 0, winreg.KEY_READ) as entry:
        return winreg.QueryValueEx(entry, name)[0]


def run():
    data = {
        "scope": "F04_DISPOSABLE_CI_GUI_FRESH_INSTALL_ONLY",
        "commit": os.environ.get("GITHUB_SHA", "unknown"),
        "clicked_install": False,
        "ran_legacy_uninstaller": False,
        "automated_real_installer_exe": False,
        "interactive_upgrade_tested": False,
        "interactive_uninstall_tested": False,
        "full_release_ready": False,
        "checks": {}
    }
    proc = None
    install = None
    profile = None
    safe_owned = False
    try:
        if not (os.name == "nt" and os.environ.get("GITHUB_ACTIONS") == "true"
                and os.environ.get("RUNNER_OS") == "Windows"
                and os.environ.get("RUNNER_ENVIRONMENT") == "github-hosted"):
            raise RuntimeError("Refuse GUI install outside GitHub-hosted disposable Windows runner")
        runner_temp = Path(os.environ["RUNNER_TEMP"]).resolve(strict=True)
        if not runner_temp.is_dir():
            raise RuntimeError("RUNNER_TEMP does not exist")
        setup = Path("dist/NegmLoading-Setup.exe").resolve(strict=True)
        packaged_app = Path("dist/NegmLoading.exe").resolve(strict=True)
        if _existing_key(safety.DEFAULT_UNINSTALL_KEY):
            raise RuntimeError("Existing real HKCU uninstall registration; refuse install")
        original_default_dir = Path(engine.get_default_install_dir())
        if original_default_dir.exists():
            raise RuntimeError("Existing real default install directory; refuse install")
        data["initial_real_registry_absent"] = True
        data["initial_real_install_dir_absent"] = True
        profile = Path(tempfile.mkdtemp(prefix="F04GUIOnly_", dir=runner_temp))
        local = profile / "IsolatedLocal"
        user = profile / "IsolatedProfile"
        roaming = profile / "IsolatedRoaming"
        for directory in (local, user, roaming):
            directory.mkdir(parents=True, exist_ok=False)
        install = local / "Programs" / engine.DEFAULT_INSTALL_SUBDIR
        if not str(install.resolve(strict=False)).lower().startswith(str(profile.resolve()).lower() + os.sep.lower()):
            raise RuntimeError("Bad isolated install root")
        data["install_under_runner_temp"] = True
        env = os.environ.copy()
        env.update({"LOCALAPPDATA": str(local), "USERPROFILE": str(user), "APPDATA": str(roaming)})
        desktop_lnk = user / "Desktop" / (engine.APP_NAME + ".lnk")
        start_lnk = roaming / "Microsoft" / "Windows" / "Start Menu" / "Programs" / (engine.APP_NAME + ".lnk")
        guard = profile / "outside-sentinel.txt"
        guard.write_bytes(b"F04 EXTERNAL USER FILE: DO NOT DELETE")
        guard_sha = digest(guard)
        if install.exists() or desktop_lnk.exists() or start_lnk.exists():
            raise RuntimeError("Isolated target unexpectedly exists")
        proc = subprocess.Popen([str(setup)], cwd=str(setup.parent), env=env,
                                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        data["automated_real_installer_exe"] = True
        window = wait_wizard(setup, proc)
        data["initial_window_title"] = window["title"]
        data["next_click"] = click_next(window)
        time.sleep(1)
        window = matching_wizard(setup)
        if window is None:
            raise RuntimeError("Wizard disappeared before install screen")
        # The destination is the default under the child-only LOCALAPPDATA.
        # Startup is unchecked by default; Desktop/Start Menu are checked.
        data["install_click"] = click_next(window)
        data["clicked_install"] = True
        limit = time.monotonic() + 100
        while time.monotonic() < limit:
            if proc.poll() is not None:
                raise RuntimeError("Setup.exe exited before commit: " + str(proc.returncode))
            if install.is_dir() and (install / safety.MANIFEST_FILENAME).is_file():
                try:
                    m = safety.load_manifest(str(install))
                    safety.verify_install_anchor(str(install), m, safety.DEFAULT_UNINSTALL_KEY)
                    if (install / engine.APP_EXE_FILENAME).is_file():
                        safe_owned = True
                        break
                except safety.InstallSafetyError:
                    pass
            time.sleep(1)
        else:
            raise RuntimeError("GUI install did not create verified manifest/anchor within 100s")

        data["checks"]["gui_install_anchor_bound"] = "PASS"
        dest_exe = install / engine.APP_EXE_FILENAME
        if digest(dest_exe) != digest(packaged_app):
            raise RuntimeError("GUI-installed exe differs from just-built EXE")
        data["checks"]["exe_from_exact_new_package"] = "PASS"
        expected_icon = os.path.normcase(os.path.normpath(str(dest_exe)))
        reg_location = registry_value(safety.DEFAULT_UNINSTALL_KEY, "InstallLocation")
        if os.path.normcase(os.path.normpath(reg_location)) != os.path.normcase(os.path.normpath(str(install))):
            raise RuntimeError("HKCU InstallLocation not under isolated test profile")
        if os.path.normcase(os.path.normpath(registry_value(safety.DEFAULT_UNINSTALL_KEY, "DisplayIcon"))) != expected_icon:
            raise RuntimeError("HKCU DisplayIcon points to wrong executable")
        uninstaller = registry_value(safety.DEFAULT_UNINSTALL_KEY, "UninstallString").strip('"')
        if os.path.normcase(os.path.normpath(uninstaller)) != os.path.normcase(os.path.normpath(str(install / safety.UNINSTALL_CMD_FILENAME))):
            raise RuntimeError("HKCU UninstallString points outside the owned install")
        data["checks"]["hkcu_install_icon_uninstaller_contract"] = "PASS"

        expected_desktop = str(desktop_lnk)
        expected_start = str(start_lnk)
        for shortcut in (desktop_lnk, start_lnk):
            limit = time.monotonic() + 15
            while not shortcut.is_file() and time.monotonic() < limit:
                time.sleep(0.5)
            if not shortcut.is_file():
                raise RuntimeError("Expected enabled shortcut missing: " + str(shortcut))
            target = shortcut_target(shortcut, env)
            if os.path.normcase(os.path.normpath(target)) != expected_icon:
                raise RuntimeError("Shortcut target does not match packaged exe: " + repr(target))
        data["checks"]["desktop_and_start_menu_lnk_target"] = "PASS"
        if guard_sha != digest(guard):
            raise RuntimeError("Outside test guard changed during installation")
        data["checks"]["outside_sentinel_untouched"] = "PASS"
        data["install_root_rel"] = str(install.relative_to(profile))
        data["shortcuts_rel"] = [str(desktop_lnk.relative_to(profile)), str(start_lnk.relative_to(profile))]
        data["result"] = "PASS_F04_VM03_VM04_GUI_FRESH_INSTALL"
        return 0
    except Exception as exc:
        data["result"] = "FAIL_OR_BLOCKED"
        data["error"] = repr(exc)
        data["trace"] = traceback.format_exc(limit=7)
        return 1
    finally:
        if proc is not None and proc.poll() is None:
            try:
                user32 = ctypes.WinDLL("user32", use_last_error=True)
                user32.PostMessageW.argtypes = [wintypes.HWND, wintypes.UINT, wintypes.WPARAM, wintypes.LPARAM]
                user32.PostMessageW.restype = wintypes.BOOL
                for win in _windows_for_exe(Path("dist/NegmLoading-Setup.exe").resolve()):
                    if "Setup Wizard" in win["title"]:
                        user32.PostMessageW(win["hwnd"], 0x0010, 0, 0)
                proc.wait(timeout=15)
                data["wizard_exit"] = proc.returncode
            except Exception:
                # Last resort stops ONLY the process tree launched by this job.
                subprocess.run(["taskkill", "/PID", str(proc.pid), "/T", "/F"],
                               check=False, capture_output=True, timeout=15)
                data["killed_only_test_process"] = True
        # Keep unverified data untouched. Verified temporary roots can be
        # cleaned using only the new manifest-bound safe_uninstall routine.
        if safe_owned and install is not None and profile is not None:
            try:
                if str(install.resolve()).lower().startswith(str(profile.resolve()).lower() + os.sep.lower()):
                    cleanup = safety.safe_uninstall(str(install), anchor_key=safety.DEFAULT_UNINSTALL_KEY)
                    data["backend_cleanup_exit"] = cleanup["exit_code"]
                    data["backend_cleanup_root_removed"] = bool(cleanup.get("root_removed"))
                    if cleanup["exit_code"] != safety.EXIT_OK and data.get("result", "").startswith("PASS"):
                        data["result"] = "FAIL_VERIFIED_BACKEND_CLEANUP"
            except Exception as exc:
                data["cleanup_warning"] = repr(exc)
        if profile is not None:
            guard = profile / "outside-sentinel.txt"
            if guard.exists():
                data["outside_sentinel_after_cleanup"] = (
                    digest(guard) == hashlib.sha256(b"F04 EXTERNAL USER FILE: DO NOT DELETE").hexdigest()
                )
        data["manual_vm_install_upgrade_uninstall_gate"] = "NOT_TESTED"
        REPORT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(json.dumps(data, ensure_ascii=False, indent=2), flush=True)


if __name__ == "__main__":
    raise SystemExit(run())

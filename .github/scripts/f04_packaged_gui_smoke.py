# -*- coding: utf-8 -*-
"""F-04 CI-only, non-installing launch/close smoke for the *packaged* Setup.exe.

This probe must not click Install, run old uninstallers, change HKCU, or touch
an actual user installation. GitHub-hosted ephemeral Windows runners only.
The full interactive install/upgrade/uninstall VM gate remains outstanding.
"""
from __future__ import annotations

import ctypes
from ctypes import wintypes
import json
import os
from pathlib import Path
import subprocess
import sys
import time
import traceback
import winreg

REPORT = Path("f04-packaged-gui-smoke.json")
# Scripts under .github/scripts need an explicit repository root on sys.path.
sys.path.insert(0, str(Path.cwd()))
WM_CLOSE = 0x0010
PROCESS_QUERY_LIMITED_INFORMATION = 0x1000


def _existing_key(key: str) -> bool:
    try:
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, key, 0, winreg.KEY_READ):
            return True
    except FileNotFoundError:
        return False


def _windows_for_exe(expected: Path) -> list[dict]:
    user32 = ctypes.WinDLL("user32", use_last_error=True)
    kernel = ctypes.WinDLL("kernel32", use_last_error=True)
    cbtype = ctypes.WINFUNCTYPE(wintypes.BOOL, wintypes.HWND, wintypes.LPARAM)

    user32.EnumWindows.argtypes = [cbtype, wintypes.LPARAM]
    user32.EnumWindows.restype = wintypes.BOOL
    user32.IsWindowVisible.argtypes = [wintypes.HWND]
    user32.IsWindowVisible.restype = wintypes.BOOL
    user32.GetWindowTextLengthW.argtypes = [wintypes.HWND]
    user32.GetWindowTextLengthW.restype = ctypes.c_int
    user32.GetWindowTextW.argtypes = [wintypes.HWND, wintypes.LPWSTR, ctypes.c_int]
    user32.GetWindowTextW.restype = ctypes.c_int
    user32.GetWindowThreadProcessId.argtypes = [wintypes.HWND, ctypes.POINTER(wintypes.DWORD)]
    user32.GetWindowThreadProcessId.restype = wintypes.DWORD
    kernel.OpenProcess.argtypes = [wintypes.DWORD, wintypes.BOOL, wintypes.DWORD]
    kernel.OpenProcess.restype = wintypes.HANDLE
    kernel.QueryFullProcessImageNameW.argtypes = [
        wintypes.HANDLE, wintypes.DWORD, wintypes.LPWSTR, ctypes.POINTER(wintypes.DWORD)
    ]
    kernel.QueryFullProcessImageNameW.restype = wintypes.BOOL
    kernel.CloseHandle.argtypes = [wintypes.HANDLE]
    kernel.CloseHandle.restype = wintypes.BOOL

    out: list[dict] = []
    expected_str = os.path.normcase(os.path.abspath(str(expected)))
    def callback(hwnd, _lparam):
        if not user32.IsWindowVisible(hwnd):
            return True
        n = user32.GetWindowTextLengthW(hwnd)
        if not n:
            return True
        titlebuf = ctypes.create_unicode_buffer(n + 1)
        user32.GetWindowTextW(hwnd, titlebuf, n + 1)
        title = titlebuf.value
        pid = wintypes.DWORD(0)
        user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
        handle = kernel.OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, False, pid.value)
        if not handle:
            return True
        try:
            imagebuf = ctypes.create_unicode_buffer(32768)
            length = wintypes.DWORD(len(imagebuf))
            if not kernel.QueryFullProcessImageNameW(handle, 0, imagebuf, ctypes.byref(length)):
                return True
            if os.path.normcase(os.path.abspath(imagebuf.value)) != expected_str:
                return True
        finally:
            kernel.CloseHandle(handle)
        out.append({"hwnd": int(hwnd), "pid": int(pid.value), "title": title})
        return True

    callback_ref = cbtype(callback)
    if not user32.EnumWindows(callback_ref, 0):
        raise RuntimeError("EnumWindows failed")
    return out


def run() -> int:
    data = {
        "scope": "PACKAGED_GUI_LAUNCH_AND_CLOSE_ONLY",
        "source_sha": os.environ.get("GITHUB_SHA", "unknown"),
        "setup_executed": False,
        "clicked_install": False,
        "legacy_uninstaller_executed": False,
        "production_hkcu_written_by_test": False,
        "interactive_install_upgrade_uninstall_tested": False,
        "full_vm_release_gate": "NOT_TESTED",
    }
    proc = None
    observed = []
    try:
        if os.name != "nt" or os.environ.get("GITHUB_ACTIONS") != "true" or os.environ.get("RUNNER_OS") != "Windows":
            raise RuntimeError("Refusing GUI smoke outside ephemeral GitHub-hosted Windows CI")
        if not os.environ.get("RUNNER_TEMP"):
            raise RuntimeError("Missing runner isolation marker")
        from installer_engine import APP_NAME, get_default_install_dir
        from installer_safety import DEFAULT_UNINSTALL_KEY
        setup = Path("dist/NegmLoading-Setup.exe").resolve(strict=True)
        if APP_NAME != "Negm Lodaing":
            raise RuntimeError("Legacy registration identity unexpectedly changed")
        if _existing_key(DEFAULT_UNINSTALL_KEY):
            raise RuntimeError("Existing HKCU application registration: refuse GUI launch")
        default_dir = Path(get_default_install_dir())
        if default_dir.exists():
            raise RuntimeError("Existing application install folder: refuse GUI launch")
        data["initial_registry_absent"] = True
        data["initial_install_folder_absent"] = True
        data["setup_size"] = setup.stat().st_size
        # Launches the real PyInstaller EXE, not the installer_engine.py script.
        # No GUI events are sent beyond a close request; no installation occurs.
        proc = subprocess.Popen([str(setup)], cwd=str(setup.parent),
                                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        data["setup_executed"] = True
        data["launch_pid"] = proc.pid
        deadline = time.monotonic() + 55
        while time.monotonic() < deadline:
            observed = _windows_for_exe(setup)
            if any("Setup Wizard" in w["title"] and APP_NAME in w["title"] for w in observed):
                break
            if proc.poll() is not None:
                raise RuntimeError("Packaged installer exited before a visible wizard appeared: exit=" + str(proc.returncode))
            time.sleep(1)
        else:
            raise RuntimeError("No visible Setup Wizard window before 55-second deadline")
        data["visible_wizard_found"] = True
        data["window_titles"] = [w["title"] for w in observed]
        # Close only the verified window owned by this exact packaged executable.
        user32 = ctypes.WinDLL("user32", use_last_error=True)
        user32.PostMessageW.argtypes = [wintypes.HWND, wintypes.UINT, wintypes.WPARAM, wintypes.LPARAM]
        user32.PostMessageW.restype = wintypes.BOOL
        for win in observed:
            if "Setup Wizard" in win["title"] and APP_NAME in win["title"]:
                if not user32.PostMessageW(win["hwnd"], WM_CLOSE, 0, 0):
                    raise RuntimeError("Could not send WM_CLOSE to expected wizard")
        proc.wait(timeout=25)
        data["clean_close_exit"] = proc.returncode
        if proc.returncode != 0:
            raise RuntimeError("Wizard closed with non-zero status: " + str(proc.returncode))
        if _existing_key(DEFAULT_UNINSTALL_KEY) or default_dir.exists():
            raise RuntimeError("Unwanted installation or HKCU registration occurred")
        data["no_production_registration_or_install_after_close"] = True
        data["result"] = "PASS_GUI_LAUNCH_CLOSE_ONLY"
        return 0
    except Exception as exc:
        data["result"] = "FAIL_OR_BLOCKED"
        data["error"] = repr(exc)
        data["trace"] = traceback.format_exc(limit=5)
        data["windows_seen"] = [x["title"] for x in observed]
        return 1
    finally:
        if proc is not None and proc.poll() is None:
            # Scope the fallback to the exact process tree launched here.
            # The disposable CI runner contains no production install/user data.
            try:
                subprocess.run(["taskkill", "/PID", str(proc.pid), "/T", "/F"],
                               check=False, capture_output=True, timeout=15)
                data["forced_close_cleanup"] = True
            except Exception as exc:
                data["cleanup_warning"] = str(exc)
        try:
            data["final_registry_absent"] = not _existing_key(
                r"Software\Microsoft\Windows\CurrentVersion\Uninstall\Negm Lodaing"
            )
        except Exception:
            data["final_registry_absent"] = None
        try:
            from installer_engine import get_default_install_dir
            data["final_install_folder_absent"] = not Path(get_default_install_dir()).exists()
        except Exception:
            data["final_install_folder_absent"] = None
        REPORT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(json.dumps(data, ensure_ascii=False, indent=2), flush=True)


if __name__ == "__main__":
    sys.exit(run())

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
        uninstaller = registry_value(safety.DEFAULT_UNINSTALL_KEY, "UninstallString")
        if uninstaller != engine.registry_uninstall_command(str(install)):
            raise RuntimeError("HKCU UninstallString is not the exact registered PowerShell command")
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
        original_manifest = safety.load_manifest(str(install))
        if original_manifest["created_root"] is not True:
            raise RuntimeError("Fresh GUI install did not record ownership of the created root")
        tracked_shortcuts = {os.path.normcase(entry["path"]): entry
                             for entry in original_manifest["shortcuts"]}
        if not all(os.path.normcase(str(p)) in tracked_shortcuts for p in (desktop_lnk, start_lnk)):
            raise RuntimeError("GUI installation did not inventory both created shortcuts")
        shortcut_hashes = {str(p): digest(p) for p in (desktop_lnk, start_lnk)}
        data["checks"]["fresh_shortcuts_are_owned_in_manifest"] = "PASS"

        # Close the first installer before starting an in-place GUI upgrade.
        user32 = ctypes.WinDLL("user32", use_last_error=True)
        user32.PostMessageW.argtypes = [wintypes.HWND, wintypes.UINT, wintypes.WPARAM, wintypes.LPARAM]
        user32.PostMessageW.restype = wintypes.BOOL
        current_window = matching_wizard(setup)
        if current_window is None or not user32.PostMessageW(current_window["hwnd"], 0x0010, 0, 0):
            raise RuntimeError("Could not close the first completed setup wizard")
        proc.wait(timeout=20)
        if proc.returncode != 0:
            raise RuntimeError("First setup wizard exited with failure status")
        data["first_wizard_exit"] = proc.returncode

        # This marker is created BY THE CI TEST after installation. It must
        # survive the upgrade and the first, deliberately partial uninstall.
        user_note = install / "f04-owned-by-test-user-note.txt"
        note_bytes = b"F04 TEST USER FILE - PRESERVE THROUGH UPGRADE AND PARTIAL UNINSTALL"
        user_note.write_bytes(note_bytes)
        manifest_path = install / safety.MANIFEST_FILENAME
        manifest_previous_mtime = manifest_path.stat().st_mtime_ns
        data["upgrade_started_with_foreign_user_file"] = True

        proc = subprocess.Popen([str(setup)], cwd=str(setup.parent), env=env,
                                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        upgrade_window = wait_wizard(setup, proc)
        data["upgrade_next_click"] = click_next(upgrade_window)
        time.sleep(1)
        upgrade_window = matching_wizard(setup)
        if upgrade_window is None:
            raise RuntimeError("Upgrade wizard disappeared before install step")
        data["upgrade_install_click"] = click_next(upgrade_window)
        data["clicked_upgrade"] = True
        deadline = time.monotonic() + 110
        while time.monotonic() < deadline:
            if proc.poll() is not None:
                raise RuntimeError("Upgrade Setup.exe exited before commit")
            if manifest_path.exists() and manifest_path.stat().st_mtime_ns > manifest_previous_mtime:
                try:
                    upgraded_manifest = safety.load_manifest(str(install))
                    safety.verify_install_anchor(str(install), upgraded_manifest, safety.DEFAULT_UNINSTALL_KEY)
                    break
                except safety.InstallSafetyError:
                    pass
            time.sleep(1)
        else:
            raise RuntimeError("GUI upgrade did not update a verified manifest within deadline")

        if upgraded_manifest["created_root"] is not True:
            raise RuntimeError("Upgrade dropped original root-ownership flag")
        if not user_note.is_file() or user_note.read_bytes() != note_bytes:
            raise RuntimeError("User-created test file was lost or modified by upgrade")
        if digest(dest_exe) != digest(packaged_app):
            raise RuntimeError("Upgrade did not preserve the expected app bytes")
        updated_shortcuts = {os.path.normcase(entry["path"]): entry
                             for entry in upgraded_manifest["shortcuts"]}
        if set(tracked_shortcuts) != set(updated_shortcuts):
            raise RuntimeError("Upgrade lost or adopted shortcut inventory records")
        for key in tracked_shortcuts:
            if tracked_shortcuts[key] != updated_shortcuts[key]:
                raise RuntimeError("Upgrade changed original shortcut identity metadata")
        if any(digest(Path(p)) != h for p, h in shortcut_hashes.items()):
            raise RuntimeError("Upgrade modified a pre-existing owned shortcut")
        if digest(guard) != guard_sha:
            raise RuntimeError("External user file changed during upgrade")
        data["checks"]["gui_upgrade_preserves_root_ownership"] = "PASS"
        data["checks"]["gui_upgrade_preserves_user_file"] = "PASS"
        data["checks"]["gui_upgrade_preserves_shortcuts_and_fingerprints"] = "PASS"
        data["checks"]["gui_upgrade_preserves_payload_and_external_guard"] = "PASS"
        data["install_root_rel"] = str(install.relative_to(profile))
        data["shortcuts_rel"] = [str(desktop_lnk.relative_to(profile)), str(start_lnk.relative_to(profile))]
        data["result"] = "PASS_F04_VM03_VM04_VM06_GUI_FRESH_AND_UPGRADE"
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
        # Execute only the registered PowerShell command from this exact new
        # GUI install after validating the bound manifest and both helper hashes.
        # The legacy main-branch CMD is NEVER executed.
        if (safe_owned and install is not None and profile is not None
                and data.get("result") == "PASS_F04_VM03_VM04_VM06_GUI_FRESH_AND_UPGRADE"):
            try:
                root_ok = str(install.resolve()).lower().startswith(
                    str(profile.resolve()).lower() + os.sep.lower()
                )
                if not root_ok:
                    raise RuntimeError("Uninstaller root is not inside the disposable profile")
                manifest = safety.load_manifest(str(install), expected_app_name=engine.APP_NAME)
                safety.verify_install_anchor(str(install), manifest, safety.DEFAULT_UNINSTALL_KEY)
                owned = {x["path"].lower(): x["sha256"].lower()
                         for x in manifest["files"]}
                cmd = install / safety.UNINSTALL_CMD_FILENAME
                ps1 = install / safety.UNINSTALL_PS1_FILENAME
                for path in (cmd, ps1):
                    if (not path.is_file() or safety.is_reparse_point(str(path))
                            or digest(path).lower() != owned.get(path.name.lower())):
                        raise RuntimeError("Missing/modified/non-owned NEW uninstaller helper")
                # Compare the CMD helper with the exact source-generated code,
                # not merely the file name or location.
                expected = safety.generate_uninstall_cmd(engine.APP_NAME,
                    created_root=manifest["created_root"]).encode("ascii")
                if cmd.read_bytes() != expected:
                    raise RuntimeError("Installed CMD is not the new audited helper")
                helper_text = ps1.read_bytes().decode("utf-8-sig")
                if not helper_text.startswith("# NegmLoading safe uninstaller."):
                    raise RuntimeError("Installed PS1 is not the new safe helper")
                if (safety.script_contains_forbidden_deletion(helper_text)
                        or safety.script_contains_forbidden_deletion(expected.decode("ascii"))):
                    raise RuntimeError("Unsafe deletion pattern in generated uninstaller")
                if os.path.normcase(os.path.normpath(
                        registry_value(safety.DEFAULT_UNINSTALL_KEY, "InstallLocation")
                )) != os.path.normcase(os.path.normpath(str(install))):
                    raise RuntimeError("Wrong HKCU location; refusing to run")
                data["new_uninstaller_provenance_checked"] = True

                registered_command = registry_value(
                    safety.DEFAULT_UNINSTALL_KEY, "UninstallString"
                )
                if registered_command != engine.registry_uninstall_command(str(install)):
                    raise RuntimeError("UninstallString changed after ownership preflight")

                def execute_registered_ps1():
                    # On Windows Popen passes a string directly to CreateProcess,
                    # faithfully exercising the actual UninstallString.
                    res = subprocess.run(
                        registered_command, cwd=str(profile),
                        env=env, capture_output=True, text=True,
                        timeout=90, check=False
                    )
                    return res.returncode, (res.stdout + "\n" + res.stderr)[-1200:]

                def execute_owned_cmd_compat():
                    res = subprocess.run(
                        ["cmd.exe", "/d", "/c", str(cmd)], cwd=str(profile),
                        env=env, capture_output=True, text=True,
                        timeout=90, check=False
                    )
                    return res.returncode, (res.stdout + "\n" + res.stderr)[-1200:]

                note = install / "f04-owned-by-test-user-note.txt"
                if not note.is_file():
                    raise RuntimeError("Missing test user note before partial uninstall")
                first_exit, first_log = execute_registered_ps1()
                data["registered_ps_partial_exit"] = first_exit
                data["registered_ps_partial_tail"] = first_log
                data["registered_ps_preserved_user_note"] = (
                    note.is_file() and note.read_bytes() ==
                    b"F04 TEST USER FILE - PRESERVE THROUGH UPGRADE AND PARTIAL UNINSTALL"
                )
                data["registered_ps_recovery_manifest_kept"] = (
                    (install / safety.MANIFEST_FILENAME).is_file()
                )
                data["registered_ps_anchor_kept_after_partial"] = _existing_key(
                    safety.DEFAULT_UNINSTALL_KEY
                )
                if (first_exit != safety.EXIT_PARTIAL
                        or not data["registered_ps_preserved_user_note"]
                        or not data["registered_ps_recovery_manifest_kept"]
                        or not data["registered_ps_anchor_kept_after_partial"]):
                    raise RuntimeError("Registered PowerShell did not return a recoverable partial uninstall")
                # Only the exact test-created note is removed, after proving
                # bytes and absolute position. This never deletes real user data.
                note.unlink()
                compat_exit, compat_log = execute_owned_cmd_compat()
                data["cmd_compat_exit"] = compat_exit
                data["cmd_compat_tail"] = compat_log
                data["cmd_compat_recovery_kept"] = (
                    (install / safety.MANIFEST_FILENAME).is_file()
                    and _existing_key(safety.DEFAULT_UNINSTALL_KEY)
                    and cmd.is_file() and ps1.is_file()
                )
                if compat_exit != safety.EXIT_FINAL or not data["cmd_compat_recovery_kept"]:
                    raise RuntimeError("Compatibility CMD returned misleading success or lost recovery")

                final_exit, final_log = execute_registered_ps1()
                data["registered_ps_final_exit"] = final_exit
                data["registered_ps_final_tail"] = final_log
                data["registered_ps_install_root_absent"] = not install.exists()
                data["registered_ps_anchor_absent"] = not _existing_key(
                    safety.DEFAULT_UNINSTALL_KEY
                )
                data["registered_ps_shortcuts_absent"] = all(
                    not p.exists() for p in (desktop_lnk, start_lnk)
                )
                if (final_exit != safety.EXIT_OK or not data["registered_ps_install_root_absent"]
                        or not data["registered_ps_anchor_absent"]
                        or not data["registered_ps_shortcuts_absent"]):
                    data["result"] = "FAIL_REGISTERED_PS_FINAL_CLEANUP_OR_OWNERSHIP"
            except Exception as exc:
                data["new_uninstaller_error"] = repr(exc)
                data["result"] = "FAIL_REGISTERED_PS_RUNTIME_OR_GUARD"
        if profile is not None:
            guard = profile / "outside-sentinel.txt"
            if guard.exists():
                data["outside_sentinel_after_cleanup"] = (
                    digest(guard) == hashlib.sha256(b"F04 EXTERNAL USER FILE: DO NOT DELETE").hexdigest()
                )
        data["manual_vm_install_upgrade_uninstall_gate"] = "NOT_TESTED"
        if data.get("result") == "PASS_F04_VM03_VM04_VM06_GUI_FRESH_AND_UPGRADE":
            if (data.get("registered_ps_final_exit") != safety.EXIT_OK
                    or data.get("outside_sentinel_after_cleanup") is not True
                    or data.get("wizard_exit") != 0):
                data["result"] = "FAIL_REGISTERED_PS_CLEANUP_OR_EXIT"
        REPORT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(json.dumps(data, ensure_ascii=False, indent=2), flush=True)
        # Enforce post-install safety outcomes as part of the actual CI exit.
        return 0 if data["result"] == "PASS_F04_VM03_VM04_VM06_GUI_FRESH_AND_UPGRADE" else 1


if __name__ == "__main__":
    raise SystemExit(run())

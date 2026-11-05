# -*- coding: utf-8 -*-
"""Windows real-process crash between HKCU and shortcut writes, test scope only.

The child calls os._exit while holding BOTH journal locks. A new Python
process then recovers both the disposable HKCU entries and local fake .lnk
bytes using per-user DPAPI encrypted WALs. No production key or link is used.
"""
import hashlib
import os
import subprocess
import sys
import tempfile
import unittest
import uuid
from pathlib import Path

import installer_safety as safety
import legacy_handover_preview as registry
import legacy_migration as migration
import legacy_shortcut_preview as shortcuts
from test_legacy_migration import _reg


CHILD = r"""
import os
import sys
import legacy_handover_preview as registry
import legacy_resources_preview as resources
import legacy_migration as migration
root, scope, reg_wal, link_wal, backup, operation = sys.argv[1:]
store = registry.WindowsDisposableRegistry(root)
crypto = migration.WindowsDPAPI()
if operation == "crash":
    def kill_after_first_shortcut(kind, index):
        if kind == "shortcut" and index == 1:
            os._exit(71)
    resources.apply_test_resources(
        store, reg_wal, scope, link_wal, backup, crypto,
        before_step=kill_after_first_shortcut
    )
    sys.exit(9)
elif operation == "recover":
    answer = resources.restore_test_resources(
        store, reg_wal, scope, link_wal, backup, crypto
    )
    assert answer == "BOTH_TEST_RESOURCES_RESTORED"
    sys.exit(0)
else:
    sys.exit(8)
"""


@unittest.skipUnless(os.name == "nt", "Windows DPAPI and HKCU only")
class TestCombinedResourceRestart(unittest.TestCase):
    def test_hard_exit_between_shortcuts_recovers_registry_and_both_links(self):
        import winreg
        with tempfile.TemporaryDirectory(prefix="f03-combined-restart-") as tmp:
            base = Path(tmp)
            old = base / "Legacy Program"
            old.mkdir()
            (old / "NegmLoading.exe").write_bytes(b"original exe")
            (old / "uninstall.cmd").write_bytes(
                b'@echo off\r\nrd /s /q "%~dp0"\r\n'
            )
            profile = base / "Profile"
            profile.mkdir()
            data = profile / ".negm_stream"
            data.mkdir()
            (data / "settings.json").write_text('{"lang":"ar"}', encoding="utf-8")
            plan = migration.inspect_legacy(
                old, profile_root=profile, registry=_reg(old)
            )
            backup = base / "DPAPI Backup"
            crypto = migration.WindowsDPAPI()
            migration.create_verified_backup(plan, backup, crypto)
            root = safety.TEST_ANCHOR_PREFIX + "F03Both" + uuid.uuid4().hex
            run = root + r"\Run"
            scope = base / "f03-shortcuts-combined-restart"
            scope.mkdir()
            desktop = scope / "Desktop" / "Negm Lodaing.lnk"
            desktop.parent.mkdir()
            desktop.write_bytes(b"old-desktop-bytes")
            menu = scope / "Menu" / "Negm Lodaing.lnk"
            menu.parent.mkdir()
            menu.write_bytes(b"old-menu-bytes")
            foreign = scope / "Unrelated.lnk"
            foreign.write_bytes(b"FOREIGN SHORTCUT")
            reg_wal = base / "registry-wal.dpapi"
            link_wal = base / "links-wal.dpapi"
            old_startup = '"' + str(old / "NegmLoading.exe") + '" --tray'
            next_exe = base / "New" / "NegmLoading.exe"
            new_startup = '"' + str(next_exe) + '" --tray'
            try:
                with winreg.CreateKey(winreg.HKEY_CURRENT_USER, root) as key:
                    winreg.SetValueEx(key, "InstallLocation", 0,
                                      winreg.REG_SZ, str(old))
                    winreg.SetValueEx(key, "ForeignValue", 0,
                                      winreg.REG_SZ, "PRESERVE")
                with winreg.CreateKey(winreg.HKEY_CURRENT_USER, run) as key:
                    winreg.SetValueEx(key, migration.APP_NAME, 0,
                                      winreg.REG_SZ, old_startup)
                store = registry.WindowsDisposableRegistry(root)
                registry.prepare_test_journal(
                    store, [
                        (root, "InstallLocation", {
                            "kind": registry.REG_SZ,
                            "value": str(next_exe.parent)
                        }),
                        (run, migration.APP_NAME, {
                            "kind": registry.REG_SZ, "value": new_startup
                        }),
                    ],
                    reg_wal, backup, crypto,
                )
                shortcuts.prepare_shortcut_test_journal(
                    scope, [
                        ("Desktop/Negm Lodaing.lnk",
                         hashlib.sha256(desktop.read_bytes()).hexdigest(),
                         b"new-desktop-bytes"),
                        ("Menu/Negm Lodaing.lnk",
                         hashlib.sha256(menu.read_bytes()).hexdigest(),
                         b"new-menu-bytes"),
                    ],
                    link_wal, backup, crypto
                )
                cmd = [
                    sys.executable, "-u", "-c", CHILD, root, str(scope),
                    str(reg_wal), str(link_wal), str(backup)
                ]
                crashed = subprocess.run(
                    cmd + ["crash"], timeout=45, capture_output=True,
                    text=True, check=False
                )
                self.assertEqual(
                    crashed.returncode, 71,
                    "Test child never reached crash: " + crashed.stderr
                )
                self.assertEqual(
                    store.get(root, "InstallLocation")["value"],
                    str(next_exe.parent)
                )
                self.assertEqual(desktop.read_bytes(), b"new-desktop-bytes")
                self.assertEqual(menu.read_bytes(), b"old-menu-bytes")
                recovered = subprocess.run(
                    cmd + ["recover"], timeout=45, capture_output=True,
                    text=True, check=False
                )
                self.assertEqual(recovered.returncode, 0, recovered.stderr)
                self.assertEqual(
                    store.get(root, "InstallLocation")["value"], str(old)
                )
                self.assertEqual(
                    store.get(run, migration.APP_NAME)["value"], old_startup
                )
                self.assertEqual(
                    store.get(root, "ForeignValue")["value"], "PRESERVE"
                )
                self.assertEqual(desktop.read_bytes(), b"old-desktop-bytes")
                self.assertEqual(menu.read_bytes(), b"old-menu-bytes")
                self.assertEqual(foreign.read_bytes(), b"FOREIGN SHORTCUT")
                self.assertTrue((old / "uninstall.cmd").is_file())
            finally:
                try:
                    winreg.DeleteKey(winreg.HKEY_CURRENT_USER, run)
                except FileNotFoundError:
                    pass
                try:
                    winreg.DeleteKey(winreg.HKEY_CURRENT_USER, root)
                except FileNotFoundError:
                    pass


if __name__ == "__main__":
    unittest.main()

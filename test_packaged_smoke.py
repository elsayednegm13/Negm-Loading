# -*- coding: utf-8 -*-
"""Windows-only smoke test of the actual packaged payload and safe uninstall.

Never touches the production uninstall key or the user's installation.
Runs only under a temporary directory with a unique F01 test registry key.
This does NOT replace a GUI setup/upgrade/uninstall test in an isolated VM.
"""
import hashlib
import os
import subprocess
import tempfile
import unittest
import uuid
from pathlib import Path

import installer_engine
import installer_safety as safety


def _sha256(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


class TestPackagedPayloadSmoke(unittest.TestCase):
    @unittest.skipUnless(os.name == "nt", "Windows cmd and HKCU test anchor required")
    def test_packaged_install_upgrade_and_safe_uninstall(self):
        archive = Path("payload.zip").resolve()
        self.assertTrue(archive.is_file(), "Package the application first")
        import winreg
        anchor = safety.make_test_anchor_key()
        run_key = safety.TEST_ANCHOR_PREFIX + "Run" + uuid.uuid4().hex
        with tempfile.TemporaryDirectory(prefix="f02-package-smoke-") as temp:
            root = os.path.join(temp, "Negm & (Test Install)")
            outside = Path(temp) / "user note outside.txt"
            outside.write_text("This is user data. Preserve it.", encoding="utf-8")
            before = _sha256(outside)
            try:
                for iteration in range(2):
                    plan = installer_engine.prepare_and_copy_payload(
                        root, str(archive), startup=False, anchor_key=anchor
                    )
                    executable = Path(root) / installer_engine.APP_EXE_FILENAME
                    self.assertTrue(executable.is_file())
                    self.assertEqual(
                        _sha256(executable),
                        _sha256(Path("dist") / installer_engine.APP_EXE_FILENAME),
                    )
                    safety.write_uninstall_artifacts(
                        root,
                        plan["owned_files"],
                        plan["owned_dirs"],
                        app_name=installer_engine.APP_NAME,
                        app_version=installer_engine.APP_VERSION,
                        created_root=plan["created_root"],
                        anchor_key=anchor,
                        run_key=run_key,
                        shortcut_paths=[],
                    )
                    manifest = safety.load_manifest(root)
                    safety.verify_install_anchor(root, manifest, anchor)
                    self.assertEqual(manifest["created_root"], True)
                    self.assertEqual(_sha256(outside), before)
                    self.assertTrue(executable.is_file())
                # Model a real startup value under an independent disposable test
                # key so deleting the install anchor cannot hide a Run-value bug.
                with winreg.CreateKey(winreg.HKEY_CURRENT_USER, run_key) as reg:
                    winreg.SetValueEx(
                        reg, installer_engine.APP_NAME, 0, winreg.REG_SZ,
                        '"' + str(executable) + '" --tray',
                    )
                    winreg.SetValueEx(
                        reg, "ForeignDoNotTouch", 0, winreg.REG_SZ,
                        r"C:\Foreign\app.exe",
                    )
                cmd = os.path.join(root, safety.UNINSTALL_CMD_FILENAME)
                completed = subprocess.run(
                    'cmd.exe /s /c ""%s""' % cmd,
                    cwd=root,
                    capture_output=True,
                    text=True,
                    timeout=120,
                    check=False,
                )
                self.assertEqual(
                    completed.returncode, safety.EXIT_OK,
                    completed.stdout + completed.stderr,
                )
                self.assertFalse(executable.exists())
                self.assertEqual(_sha256(outside), before)
                with self.assertRaises(safety.InstallSafetyError):
                    safety.read_install_anchor(anchor)
                with winreg.OpenKey(winreg.HKEY_CURRENT_USER, run_key) as reg:
                    try:
                        remaining, _kind = winreg.QueryValueEx(reg, installer_engine.APP_NAME)
                    except FileNotFoundError:
                        pass
                    else:
                        self.fail(
                            "Owned Windows Run value remained after uninstall. "
                            "Uninstall diagnostics: " + completed.stdout
                        )
                    self.assertEqual(
                        winreg.QueryValueEx(reg, "ForeignDoNotTouch")[0],
                        r"C:\Foreign\app.exe",
                    )
            finally:
                try:
                    winreg.DeleteKey(winreg.HKEY_CURRENT_USER, run_key)
                except FileNotFoundError:
                    pass
                safety.delete_test_anchor_key(anchor)



    @unittest.skipUnless(os.name == "nt", "Windows cmd and HKCU test anchor required")
    def test_untracked_user_file_inside_install_is_preserved(self):
        archive = Path("payload.zip").resolve()
        self.assertTrue(archive.is_file())
        anchor = safety.make_test_anchor_key()
        with tempfile.TemporaryDirectory(prefix="f02-user-file-") as tmp:
            root = os.path.join(tmp, "Managed Installation")
            try:
                plan = installer_engine.prepare_and_copy_payload(
                    root, str(archive), startup=False, anchor_key=anchor
                )
                safety.write_uninstall_artifacts(
                    root, plan["owned_files"], plan["owned_dirs"],
                    created_root=plan["created_root"], anchor_key=anchor,
                    run_key=anchor + r"\Run", shortcut_paths=[],
                )
                note = Path(root) / "user-important-notes.txt"
                note.write_text("KEEP THIS UNMANAGED DATA", encoding="utf-8")
                original = _sha256(note)
                cmd = os.path.join(root, safety.UNINSTALL_CMD_FILENAME)
                result = subprocess.run(
                    'cmd.exe /s /c ""%s""' % cmd, cwd=root,
                    capture_output=True, text=True, timeout=120,
                    check=False,
                )
                self.assertEqual(
                    result.returncode, safety.EXIT_PARTIAL,
                    result.stdout + result.stderr,
                )
                self.assertEqual(_sha256(note), original)
                self.assertTrue(Path(root, safety.MANIFEST_FILENAME).exists())
                self.assertTrue(Path(root, safety.UNINSTALL_PS1_FILENAME).exists())
                safety.verify_install_anchor(root, safety.load_manifest(root), anchor)
            finally:
                safety.delete_test_anchor_key(anchor)


if __name__ == "__main__":
    unittest.main()

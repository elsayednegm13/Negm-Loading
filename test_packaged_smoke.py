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
        anchor = safety.make_test_anchor_key()
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
                        run_key=anchor + r"\Run",
                        shortcut_paths=[],
                    )
                    manifest = safety.load_manifest(root)
                    safety.verify_install_anchor(root, manifest, anchor)
                    self.assertEqual(manifest["created_root"], True)
                    self.assertEqual(_sha256(outside), before)
                    self.assertTrue(executable.is_file())
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
            finally:
                safety.delete_test_anchor_key(anchor)


if __name__ == "__main__":
    unittest.main()

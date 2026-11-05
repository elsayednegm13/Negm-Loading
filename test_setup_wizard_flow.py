# -*- coding: utf-8 -*-
"""Test the real SetupWizard stages with a generated payload in an isolated scope.

This drives the Python GUI implementation through its normal page transitions
and worker. The real packaged EXE window startup is tested separately.
Production Uninstall registry registration is mocked; all manifest anchors
and Run values in this test are scoped to disposable F01 test HKCU keys.
"""
import os
import subprocess
import tempfile
import time
import unittest
from pathlib import Path
from unittest import mock

import installer_engine as engine
import installer_safety as safety


class TestSetupWizardFlow(unittest.TestCase):
    @unittest.skipUnless(os.name == "nt", "Windows GUI and test HKCU anchor required")
    def test_wizard_install_upgrade_then_uninstall(self):
        archive = Path("payload.zip").resolve()
        self.assertTrue(archive.is_file(), "Build and package app first")
        anchor = safety.make_test_anchor_key()
        with tempfile.TemporaryDirectory(prefix="f03-wizard-") as tmp:
            dest = Path(tmp) / "Wizard Test Install"
            outside = Path(tmp) / "outside-user-data.txt"
            outside.write_text("PRESERVE THIS USER DATA", encoding="utf-8")
            try:
                for cycle in (1, 2):
                    state = {"done": False, "error": None}
                    with (
                        mock.patch.object(safety, "DEFAULT_UNINSTALL_KEY", anchor),
                        mock.patch.object(safety, "DEFAULT_RUN_KEY", anchor + r"\Run"),
                        mock.patch.object(engine, "register_uninstall") as register,
                    ):
                        wizard = engine.SetupWizard(payload_zip_path=str(archive))
                        try:
                            wizard.install_dir.set(str(dest))
                            wizard.chk_desktop.set(False)
                            wizard.chk_startmenu.set(False)
                            wizard.chk_startup.set(False)
                            wizard.chk_launch.set(False)
                            wizard.go_next()  # Welcome -> options page
                            self.assertEqual(wizard.step, 1)
                            deadline = time.monotonic() + 110

                            def check_status():
                                if time.monotonic() >= deadline:
                                    state["error"] = "Wizard install timed out"
                                    wizard.quit()
                                    return
                                button_text = wizard.btn_next.cget("text")
                                if button_text == "إنهاء  ✔":
                                    state["done"] = True
                                    wizard.quit()
                                    return
                                if button_text == "إغلاق":
                                    state["error"] = str(wizard.lbl_progress.cget("text"))
                                    wizard.quit()
                                    return
                                wizard.after(100, check_status)

                            # Start the worker from an active Tk event loop.
                            wizard.after(80, wizard.go_next)
                            wizard.after(150, check_status)
                            wizard.mainloop()

                            self.assertIsNone(state["error"], state["error"])
                            self.assertTrue(state["done"], "Wizard never reached success")
                            self.assertEqual(wizard.step, 2)
                            register.assert_called_once()
                            self.assertEqual(
                                Path(register.call_args.args[0]), dest
                            )
                        finally:
                            if wizard.winfo_exists():
                                # A CTk root schedules polling callbacks (DPI,
                                # scaling and widget updates). After quit(), stop
                                # those pending test-root callbacks before destroy
                                # so they cannot fire against deleted Tcl commands.
                                for after_id in wizard.tk.call("after", "info"):
                                    try:
                                        wizard.after_cancel(after_id)
                                    except Exception:
                                        pass
                                wizard.destroy()

                    installed_exe = dest / engine.APP_EXE_FILENAME
                    self.assertTrue(installed_exe.is_file())
                    manifest = safety.load_manifest(str(dest))
                    safety.verify_install_anchor(str(dest), manifest, anchor)
                    self.assertTrue(manifest["created_root"])
                    self.assertEqual(outside.read_text(encoding="utf-8"),
                                     "PRESERVE THIS USER DATA")

                result = subprocess.run(
                    'cmd.exe /s /c ""%s""' %
                    str(dest / safety.UNINSTALL_CMD_FILENAME),
                    cwd=str(dest), capture_output=True, text=True,
                    timeout=120, check=False,
                )
                self.assertEqual(
                    result.returncode, safety.EXIT_OK,
                    result.stdout + result.stderr,
                )
                self.assertFalse(installed_exe.exists())
                self.assertEqual(outside.read_text(encoding="utf-8"),
                                 "PRESERVE THIS USER DATA")
            finally:
                safety.delete_test_anchor_key(anchor)


if __name__ == "__main__":
    unittest.main()

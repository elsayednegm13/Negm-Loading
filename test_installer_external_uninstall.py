# -*- coding: utf-8 -*-
"""F03 external uninstall coordinator acceptance, exclusively test-owned HKCU.

Creates an F01-anchored modern mock installation in a disposable directory.
The coordinator is not connected to any shipping installer or user shortcut.
"""
import os
import tempfile
import unittest
from pathlib import Path
from unittest import mock
from types import SimpleNamespace

import installer_safety as safety
import installer_external_uninstall as coordinator


@unittest.skipUnless(os.name == "nt", "Windows PowerShell and HKCU required")
class TestExternalOwnedUninstall(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="f03-external-owner-")
        self.addCleanup(self.temp.cleanup)
        self.base = Path(self.temp.name)
        self.root = self.base / "Isolated & Modern Install"
        self.root.mkdir()
        (self.root / safety.DEFAULT_APP_EXE_FILENAME).write_bytes(b"fake modern app, never run")
        asset = self.root / "assets"
        asset.mkdir()
        (asset / "icon.png").write_bytes(b"sample")
        self.key = safety.make_test_anchor_key()
        self.addCleanup(safety.delete_test_anchor_key, self.key)
        self.anchor = safety.write_uninstall_artifacts(
            str(self.root),
            [{"path": safety.DEFAULT_APP_EXE_FILENAME, "role": "payload"},
             {"path": r"assets\icon.png", "role": "payload"}],
            [{"path": "assets"}],
            created_root=True,
            anchor_key=self.key,
            run_key=self.key + r"\Run",
            shortcut_paths=[],
        )
        self.external = self.base / "foreign-not-owned.txt"
        self.external.write_text("KEEP", encoding="utf-8")

    def run_remove(self, *, consent=coordinator.CONSENT):
        return coordinator.complete_verified_uninstall(
            str(self.root), self.key, consent=consent
        )

    def assert_still_installed(self):
        self.assertTrue((self.root / safety.DEFAULT_APP_EXE_FILENAME).is_file())
        self.assertTrue((self.root / safety.MANIFEST_FILENAME).is_file())
        self.assertEqual(self.external.read_text(encoding="utf-8"), "KEEP")

    def test_full_owned_modern_install_removed_and_anchor_retired(self):
        done = self.run_remove()
        self.assertEqual(done["status"], "COMPLETE_VERIFIED_UNINSTALL")
        self.assertFalse(done["production_wired"])
        self.assertFalse(self.root.exists())
        self.assertEqual(self.external.read_text(encoding="utf-8"), "KEEP")
        import winreg
        with self.assertRaises(FileNotFoundError):
            winreg.OpenKey(winreg.HKEY_CURRENT_USER, self.key)

    def test_missing_consent_refuses_before_payload_changes(self):
        with self.assertRaises(safety.InstallSafetyError):
            self.run_remove(consent=None)
        self.assert_still_installed()

    def test_untracked_file_blocks_before_any_delete(self):
        stray = self.root / "user notes.txt"
        stray.write_text("MUST PRESERVE", encoding="utf-8")
        with self.assertRaises(safety.InstallSafetyError):
            self.run_remove()
        self.assertEqual(stray.read_text(encoding="utf-8"), "MUST PRESERVE")
        self.assert_still_installed()

    def test_untracked_directory_blocks_before_any_delete(self):
        unknown = self.root / "user files"
        unknown.mkdir()
        (unknown / "file.bin").write_bytes(b"KEEP")
        with self.assertRaises(safety.InstallSafetyError):
            self.run_remove()
        self.assertEqual((unknown / "file.bin").read_bytes(), b"KEEP")
        self.assert_still_installed()

    def test_modified_owned_payload_blocks_preflight(self):
        modified = self.root / safety.DEFAULT_APP_EXE_FILENAME
        modified.write_bytes(b"modified, preserve")
        with self.assertRaises(safety.InstallSafetyError):
            self.run_remove()
        self.assertEqual(modified.read_bytes(), b"modified, preserve")
        self.assertTrue((self.root / safety.MANIFEST_FILENAME).exists())

    def test_missing_payload_blocks_preflight(self):
        (self.root / "assets" / "icon.png").unlink()
        with self.assertRaises(safety.InstallSafetyError):
            self.run_remove()
        self.assertTrue((self.root / safety.MANIFEST_FILENAME).exists())
        self.assertTrue((self.root / safety.DEFAULT_APP_EXE_FILENAME).exists())

    def test_modified_launcher_blocks_before_running_it(self):
        cmd = self.root / safety.UNINSTALL_CMD_FILENAME
        cmd.write_bytes(cmd.read_bytes() + b"\r\nrem extra content\r\n")
        with self.assertRaises(safety.InstallSafetyError):
            self.run_remove()
        self.assert_still_installed()

    def test_modified_powershell_helper_blocks_before_running_it(self):
        path = self.root / safety.UNINSTALL_PS1_FILENAME
        path.write_bytes(path.read_bytes() + b"\r\n# extra content\r\n")
        with self.assertRaises(safety.InstallSafetyError):
            self.run_remove()
        self.assert_still_installed()

    def test_wrong_anchor_key_blocks_before_running_it(self):
        key = safety.make_test_anchor_key()
        with self.assertRaises(safety.InstallSafetyError):
            coordinator.complete_verified_uninstall(
                str(self.root), key, consent=coordinator.CONSENT
            )
        self.assert_still_installed()

    def test_legacy_uninstall_key_without_manifest_binding_is_rejected(self):
        with self.assertRaises(safety.InstallSafetyError):
            coordinator.complete_verified_uninstall(
                str(self.root), safety.DEFAULT_UNINSTALL_KEY,
                consent=coordinator.CONSENT
            )
        self.assert_still_installed()

    def test_shortcut_owning_manifest_refused_until_review(self):
        shortcut = self.base / "fake-modern-link.lnk"
        shortcut.write_bytes(b"fake link; not owned")
        manifest = self.root / safety.MANIFEST_FILENAME
        import json
        doc = json.loads(manifest.read_text(encoding="utf-8"))
        doc["shortcuts"] = [{"path": str(shortcut)}]
        manifest.write_text(json.dumps(doc), encoding="utf-8")
        safety.write_install_anchor(
            str(self.root), self.key, safety.load_manifest(str(self.root))
        )
        with self.assertRaises(safety.InstallSafetyError):
            self.run_remove()
        self.assertEqual(shortcut.read_bytes(), b"fake link; not owned")
        self.assert_still_installed()

    def _create_owned_windows_shortcut(self):
        from test_legacy_shortcut_inspection import _CREATE_LINK
        path = self.base / "Disposable Desktop" / "Negm Lodaing.lnk"
        path.parent.mkdir()
        env = os.environ.copy()
        env.update({
            "NEGM_F03_TEST_LINK": str(path),
            "NEGM_F03_TEST_TARGET": str(self.root / safety.DEFAULT_APP_EXE_FILENAME),
            "NEGM_F03_TEST_ARGUMENTS": "",
            "NEGM_F03_TEST_WORKDIR": str(self.root),
            "NEGM_F03_TEST_ICON": str(self.root / safety.DEFAULT_APP_EXE_FILENAME) + ",0",
        })
        result = coordinator.subprocess.run(
            ["powershell.exe", "-NoProfile", "-NonInteractive", "-Command", _CREATE_LINK],
            env=env, capture_output=True, timeout=20,
            creationflags=getattr(coordinator.subprocess, "CREATE_NO_WINDOW", 0),
        )
        self.assertEqual(result.returncode, 0)
        self.assertTrue(path.is_file())
        safety.write_uninstall_artifacts(
            str(self.root),
            [{"path": safety.DEFAULT_APP_EXE_FILENAME, "role": "payload"},
             {"path": r"assets\icon.png", "role": "payload"}],
            [{"path": "assets"}],
            created_root=True, anchor_key=self.key,
            run_key=self.key + r"\Run", shortcut_paths=[str(path)],
        )
        manifest = safety.load_manifest(str(self.root))
        self.assertEqual(len(manifest["shortcuts"]), 1)
        # Windows Shell resolves 8.3 (RUNNER~1) to the long profile name.
        # Verify actual file identity, not textual spelling of TEMP aliases.
        self.assertTrue(os.path.samefile(
            manifest["shortcuts"][0]["target"],
            self.root / safety.DEFAULT_APP_EXE_FILENAME,
        ))
        self.assertTrue(manifest["shortcuts"][0]["sha256"])
        return path

    def test_owned_windows_shortcut_is_deleted_by_verified_helper(self):
        shortcut = self._create_owned_windows_shortcut()
        result = self.run_remove()
        self.assertEqual(result["status"], "COMPLETE_VERIFIED_UNINSTALL")
        self.assertFalse(self.root.exists())
        self.assertFalse(shortcut.exists())
        self.assertEqual(self.external.read_text(encoding="utf-8"), "KEEP")

    def test_modified_owned_windows_shortcut_blocks_preflight(self):
        shortcut = self._create_owned_windows_shortcut()
        with open(shortcut, "ab") as out:
            out.write(b"test-only third-party edit")
        old = shortcut.read_bytes()
        with self.assertRaises(safety.InstallSafetyError):
            self.run_remove()
        self.assertEqual(shortcut.read_bytes(), old)
        self.assert_still_installed()

    def test_original_owned_shortcut_can_be_manually_removed_before_uninstall(self):
        shortcut = self._create_owned_windows_shortcut()
        shortcut.unlink()
        result = self.run_remove()
        self.assertEqual(result["status"], "COMPLETE_VERIFIED_UNINSTALL")
        self.assertFalse(self.root.exists())
        self.assertFalse(shortcut.exists())

    def test_link_recreated_after_helper_blocks_final_result(self):
        shortcut = self._create_owned_windows_shortcut()
        original_run = coordinator.subprocess.run
        def interpose(*args, **kwargs):
            result = original_run(*args, **kwargs)
            self.assertEqual(result.returncode, safety.EXIT_OK)
            shortcut.write_bytes(b"foreign shortcut created after uninstall")
            return result
        with mock.patch.object(coordinator.subprocess, "run", side_effect=interpose):
            with self.assertRaises(safety.InstallSafetyError):
                self.run_remove()
        self.assertEqual(shortcut.read_bytes(),
                         b"foreign shortcut created after uninstall")
        self.assertEqual(self.external.read_text(encoding="utf-8"), "KEEP")
        self.assertTrue((self.root / safety.UNINSTALL_CMD_FILENAME).exists())

    def test_lock_collision_refuses_and_leaves_install_intact(self):
        with coordinator._uninstall_lock(self.root, self.key):
            with self.assertRaises(safety.InstallSafetyError):
                self.run_remove()
        self.assert_still_installed()

    def test_unexpected_subprocess_success_must_not_bypass_anchor_check(self):
        with mock.patch.object(
            coordinator.subprocess, "run",
            return_value=SimpleNamespace(returncode=safety.EXIT_OK),
        ):
            with self.assertRaises(safety.InstallSafetyError):
                self.run_remove()
        self.assert_still_installed()

    def test_powershell_is_called_directly_without_shell_interpolation(self):
        # The test root contains an '&'; passing argv avoids cmd.exe expansion.
        with mock.patch.object(
            coordinator.subprocess, "run",
            return_value=SimpleNamespace(returncode=safety.EXIT_VERIFY_FAILED),
        ) as run:
            with self.assertRaises(safety.InstallSafetyError):
                self.run_remove()
        command = run.call_args.args[0]
        self.assertIsInstance(command, list)
        self.assertTrue(command[0].lower().endswith("powershell.exe"))
        self.assertIn("-File", command)
        self.assertEqual(
            command[command.index("-File") + 1],
            str(self.root / safety.UNINSTALL_PS1_FILENAME),
        )
        self.assert_still_installed()

    def test_post_uninstall_foreign_file_is_preserved_and_blocks_finalize(self):
        original = coordinator.subprocess.run
        extra = self.root / "created-after-helper.txt"
        def interpose(*args, **kwargs):
            done = original(*args, **kwargs)
            self.assertEqual(done.returncode, safety.EXIT_OK)
            extra.write_text("KEEP NEW DATA", encoding="utf-8")
            return done
        with mock.patch.object(coordinator.subprocess, "run",
                               side_effect=interpose):
            with self.assertRaises(safety.InstallSafetyError):
                self.run_remove()
        self.assertEqual(extra.read_text(encoding="utf-8"), "KEEP NEW DATA")
        self.assertTrue((self.root / safety.UNINSTALL_CMD_FILENAME).exists())
        self.assertEqual(self.external.read_text(encoding="utf-8"), "KEEP")

    def test_post_uninstall_launcher_change_blocks_final_delete(self):
        original = coordinator.subprocess.run
        launcher = self.root / safety.UNINSTALL_CMD_FILENAME
        def interpose(*args, **kwargs):
            done = original(*args, **kwargs)
            self.assertEqual(done.returncode, safety.EXIT_OK)
            with open(launcher, "ab") as out:
                out.write(b"\r\nrem altered between verify and finalization\r\n")
            return done
        with mock.patch.object(coordinator.subprocess, "run",
                               side_effect=interpose):
            with self.assertRaises(safety.InstallSafetyError):
                self.run_remove()
        self.assertTrue(launcher.exists())
        self.assertIn(b"altered between verify", launcher.read_bytes())
        self.assertEqual(self.external.read_text(encoding="utf-8"), "KEEP")

    def test_subprocess_error_never_deletes_unverified_launcher(self):
        with mock.patch.object(
            coordinator.subprocess, "run",
            side_effect=OSError("simulated denial"),
        ):
            with self.assertRaises(safety.InstallSafetyError):
                self.run_remove()
        self.assert_still_installed()

    def test_relative_folder_rejected(self):
        with self.assertRaises(safety.InstallSafetyError):
            coordinator.complete_verified_uninstall(
                "relative_install", self.key, consent=coordinator.CONSENT
            )
        self.assert_still_installed()


class TestExternalCoordinatorNonWindows(unittest.TestCase):
    @unittest.skipIf(os.name == "nt", "Windows-only refusal")
    def test_cross_platform_fail_closed(self):
        with self.assertRaises(safety.InstallSafetyError):
            coordinator.complete_verified_uninstall(
                "/tmp/not-an-install", "Software\\some",
                consent=coordinator.CONSENT
            )


if __name__ == "__main__":
    unittest.main()

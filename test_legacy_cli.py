"""F03 CLI is opt-in and does not activate or overwrite legacy installations."""
import tempfile
import unittest
import zipfile
from pathlib import Path
from unittest.mock import patch

import legacy_upgrade_cli as cli
import legacy_migration as migration
from test_legacy_migration import FakeProtector, _reg


class TestLegacyCLI(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix="f03-cli-")
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.old = self.root / "Old"
        self.old.mkdir()
        (self.old / "NegmLoading.exe").write_bytes(b"old")
        (self.old / "uninstall.cmd").write_bytes(
            b'@echo off\r\nrd /s /q "%~dp0"\r\n'
        )
        self.home = self.root / "Profile"
        self.home.mkdir()
        self.registry = _reg(self.old)

    def test_no_consent_cannot_create_any_folder(self):
        backup = self.root / "Backup"
        stage = self.root / "Stage"
        with self.assertRaises(migration.MigrationBlocked):
            cli.prepare(self.old, self.home, backup, stage,
                        self.root / "payload.zip", registry=self.registry,
                        protector=FakeProtector())
        self.assertFalse(backup.exists())
        self.assertFalse(stage.exists())

    def test_opt_in_prepares_but_never_retires_old_install(self):
        payload = self.root / "payload.zip"
        with zipfile.ZipFile(payload, "w") as archive:
            archive.writestr("NegmLoading.exe", b"new")
        backup = self.root / "Backup"
        stage = self.root / "Stage"
        result = cli.prepare(
            self.old, self.home, backup, stage, payload,
            consent=cli.CONSENT, registry=self.registry,
            protector=FakeProtector()
        )
        self.assertEqual(result["status"], "STAGED_ONLY")
        self.assertEqual((self.old / "NegmLoading.exe").read_bytes(), b"old")
        self.assertEqual((stage / "NegmLoading.exe").read_bytes(), b"new")
        self.assertTrue((self.old / "uninstall.cmd").exists())
        self.assertTrue((backup / migration.INDEX_NAME).exists())

    def test_inspection_cli_reports_no_sensitive_paths(self):
        with patch.object(cli.legacy, "inspect_legacy",
                          return_value={"files": [{}, {}], "bytes": 80,
                                        "roots": {"app": "/secret-root"},
                                        "registry": {}}):
            with patch("sys.stdout") as output:
                self.assertEqual(cli.main(["--legacy-root", "unused"]), 0)
            message = "".join(str(call) for call in output.write.call_args_list)
            self.assertIn("READ_ONLY_INSPECTION", message)
            self.assertNotIn("/secret-root", message)


if __name__ == "__main__":
    unittest.main()

# -*- coding: utf-8 -*-
"""F03 safe engine-first-import checks against SANITIZED legacy user state.

The child Python process uses a fresh temporary Windows USERPROFILE/HOME.
It does not create a Tk window, launch the packaged app, open a downloader,
contact a network service, or modify the real user's stored data. This is a
limited engine compatibility test, NOT a complete packaged-app first launch.
"""
import hashlib
import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


_CHILD = r"""
import json
import os
import sys
from pathlib import Path

profile = Path(os.environ["NEGM_F03_SANITIZED_PROFILE"])
if Path(os.path.expanduser("~")).resolve() != profile.resolve():
    sys.exit(23)  # Fail before importing app code, never touch real profile.

import nexus_engine as engine

target = profile / ".negm_stream"
if Path(engine.DATA_DIR).resolve() != target.resolve():
    sys.exit(24)
if not target.is_dir():
    sys.exit(25)

settings = engine.load_json(engine.SETTINGS_FILE, {})
if settings.get("lang") != "ar" or settings.get("theme") != "Dark":
    sys.exit(26)
if settings.get("folder") != str(profile / "Downloads"):
    sys.exit(27)

items = engine.load_json(engine.DOWNLOADS_FILE, [])
if not isinstance(items, list) or len(items) != 1:
    sys.exit(28)
record = items[0]
task = engine.DownloadTask.from_dict(record)
if task.task_id != "sanitized-task" or task.url != "https://example.invalid/file.bin":
    sys.exit(29)
if task.save_path != str(profile / "Downloads" / "file.bin"):
    sys.exit(30)
if task.state != "queued":
    sys.exit(31)

history = engine.DownloadHistoryManager(engine.HISTORY_FILE)
if len(history.get_records()) != 1 or history.get_records()[0]["id"] != "hist-old":
    sys.exit(32)
proxies = engine.ProxyManager(engine.PROXIES_FILE)
if proxies.get_all_proxies():
    sys.exit(33)
credentials = engine.SiteCredentialVault(engine.CREDENTIALS_FILE)
records = credentials.get_all_credentials()
if len(records) != 1 or records[0]["domain"] != "example.invalid":
    sys.exit(34)
if records[0]["password"] != "synthetic-secret-never-logged":
    sys.exit(35)

# No save_json or task.start(); do not launch a network request.
print("F03 sanitized state engine import: PASS")
"""


def _sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


@unittest.skipUnless(os.name == "nt", "Windows profile isolation and engine required")
class TestSanitizedLegacyStateEngineImport(unittest.TestCase):
    def _run_sanitized_profile(self, old_only):
        with tempfile.TemporaryDirectory(prefix="f03-engine-profile-") as tmp:
            profile = Path(tmp) / "FreshTestProfile"
            profile.mkdir()
            data = profile / (".nexus_stream" if old_only else ".negm_stream")
            data.mkdir()
            downloads = profile / "Downloads"
            downloads.mkdir()
            files = {
                "settings.json": {
                    "lang": "ar", "theme": "Dark",
                    "folder": str(downloads), "max_concurrent": 3
                },
                "downloads.json": [{
                    "task_id": "sanitized-task",
                    "url": "https://example.invalid/file.bin",
                    "save_path": str(downloads / "file.bin"),
                    "max_chunks": 4, "storage_mode": "direct",
                    "chunks": [], "state": "queued",
                }],
                "history.json": [{"id": "hist-old", "filename": "file.bin"}],
                "proxies.json": [],
                "site_credentials.json": [{
                    "id": "cred-old",
                    "domain": "example.invalid",
                    "username": "fixture-user",
                    "password": "synthetic-secret-never-logged"
                }],
            }
            for name, value in files.items():
                (data / name).write_text(
                    json.dumps(value, ensure_ascii=False), encoding="utf-8"
                )
            original_sha = {name: _sha(data / name) for name in files}
            env = os.environ.copy()
            env.update({
                "USERPROFILE": str(profile),
                "HOME": str(profile),
                "NEGM_F03_SANITIZED_PROFILE": str(profile),
                "PYTHONDONTWRITEBYTECODE": "1",
            })
            output = subprocess.run(
                [sys.executable, "-B", "-c", _CHILD],
                cwd=str(Path(__file__).resolve().parent),
                env=env,
                capture_output=True, text=True, timeout=65, check=False,
            )
            # Never print the child's stderr here; dependency exceptions may
            # contain paths, URLs, or sensitive stored values in other cases.
            self.assertEqual(
                output.returncode, 0,
                f"Sanitized engine import rejected; exit={output.returncode}"
            )
            self.assertIn("F03 sanitized state engine import: PASS", output.stdout)
            for name in files:
                self.assertEqual(_sha(data / name), original_sha[name])
            if old_only:
                migrated = profile / ".negm_stream"
                for name in files:
                    self.assertEqual(_sha(migrated / name), original_sha[name])

    def test_existing_modern_profile_is_read_without_state_loss(self):
        self._run_sanitized_profile(old_only=False)

    def test_older_profile_copy_remains_byte_identical(self):
        self._run_sanitized_profile(old_only=True)


if __name__ == "__main__":
    unittest.main()

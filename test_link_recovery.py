# -*- coding: utf-8 -*-
"""
test_link_recovery.py - Automated Unit & Integration Tests for Expired Link Recovery and Checksums
Part of NegmLoading Verification Suite (Phase 10)
"""
import os
import sys
import time
import tempfile
import unittest
import hashlib
import zlib
from unittest.mock import MagicMock, patch

import nexus_engine as E
import ui_theme
import ui_dialogs
from nexus_stream_manager import NexusStreamManagerApp


class TestLinkRecoveryAndChecksums(unittest.TestCase):
    def setUp(self):
        self.tmp_dir = tempfile.mkdtemp()
        self.test_file = os.path.join(self.tmp_dir, "sample_data.bin")
        self.sample_bytes = b"NegmLoading 2026 Phase 10 Checksum & Link Recovery Payload Data!" * 500
        with open(self.test_file, "wb") as f:
            f.write(self.sample_bytes)

    def tearDown(self):
        try:
            if os.path.exists(self.test_file):
                os.remove(self.test_file)
            os.rmdir(self.tmp_dir)
        except Exception:
            pass

    def test_checksum_calculator_all_algorithms(self):
        # Calculate expected values
        exp_md5 = hashlib.md5(self.sample_bytes).hexdigest().lower()
        exp_sha1 = hashlib.sha1(self.sample_bytes).hexdigest().lower()
        exp_sha256 = hashlib.sha256(self.sample_bytes).hexdigest().lower()
        exp_sha512 = hashlib.sha512(self.sample_bytes).hexdigest().lower()
        exp_crc32 = format(zlib.crc32(self.sample_bytes) & 0xFFFFFFFF, "08x").lower()

        progress_calls = []

        def on_prog(cur_b, tot_b, pct):
            progress_calls.append(pct)

        res = E.ChecksumCalculator.compute_file_hashes(self.test_file, on_progress=on_prog)

        self.assertEqual(res["size"], len(self.sample_bytes))
        self.assertEqual(res["MD5"], exp_md5)
        self.assertEqual(res["SHA-1"], exp_sha1)
        self.assertEqual(res["SHA-256"], exp_sha256)
        self.assertEqual(res["SHA-512"], exp_sha512)
        self.assertEqual(res["CRC32"], exp_crc32)
        self.assertTrue(len(progress_calls) > 0)

    def test_download_task_refresh_url_success(self):
        task_id = f"test_{int(time.time()*1000)}"
        save_path = os.path.join(self.tmp_dir, "test_file.iso")
        task = E.DownloadTask(task_id, "https://old-server.example.com/expired_link.iso", save_path)
        task.total_size = len(self.sample_bytes)
        task.is_failed = True
        task.status_detail = "HTTP Error 403"
        task.status = "st_failed"

        new_url = "https://fresh-server.example.com/fresh_link.iso"

        # Mock requests.Session.get for server probe
        mock_resp = MagicMock()
        mock_resp.status_code = 206
        mock_resp.headers = {
            "content-range": f"bytes 0-0/{len(self.sample_bytes)}",
            "accept-ranges": "bytes"
        }

        with patch.object(task.session, "get", return_value=mock_resp):
            ok, msg = task.refresh_url(new_url, verify_match=True)

        self.assertTrue(ok)
        self.assertEqual(task.url, new_url)
        self.assertFalse(task.is_failed)
        self.assertEqual(task.status, "st_paused")
        self.assertEqual(task.status_detail, "")

    def test_download_task_refresh_url_size_mismatch(self):
        task_id = f"test_mm_{int(time.time()*1000)}"
        save_path = os.path.join(self.tmp_dir, "test_mismatch.iso")
        task = E.DownloadTask(task_id, "https://old.com/link.iso", save_path)
        task.total_size = 1000000

        new_url = "https://new.com/different_size.iso"

        mock_resp = MagicMock()
        mock_resp.status_code = 206
        mock_resp.headers = {
            "content-range": "bytes 0-0/500000",
            "accept-ranges": "bytes"
        }

        with patch.object(task.session, "get", return_value=mock_resp):
            ok, msg = task.refresh_url(new_url, verify_match=True)

        self.assertFalse(ok)
        self.assertIn("mismatch", msg.lower())
        self.assertNotEqual(task.url, new_url)


class TestDialogsIntegration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        try:
            cls.app = NexusStreamManagerApp()
            cls.app.withdraw()
        except Exception:
            cls.app = None

    @classmethod
    def tearDownClass(cls):
        if cls.app is not None:
            try:
                cls.app.is_closing = True
                cls.app.destroy()
            except Exception:
                pass

    def setUp(self):
        if self.app is None:
            self.skipTest("Tkinter GUI not available in this environment")
        self.tmp_dir = tempfile.mkdtemp()
        self.test_file = os.path.join(self.tmp_dir, "checksum_target.zip")
        with open(self.test_file, "wb") as f:
            f.write(b"PK\x03\x04TestZipContentsForDialogVerification")

    def tearDown(self):
        try:
            if os.path.exists(self.test_file):
                os.remove(self.test_file)
            os.rmdir(self.tmp_dir)
        except Exception:
            pass

    def test_refresh_url_dialog_ui(self):
        task = E.DownloadTask(f"dlg_test_{int(time.time())}", "https://host.com/old.zip", self.test_file)
        task.total_size = 1024
        dlg = ui_dialogs.RefreshUrlDialog(self.app, task)
        self.assertTrue(dlg.winfo_exists())
        self.assertEqual(dlg.old_entry.get(), task.url)
        self.assertTrue(hasattr(dlg, "entry"))
        self.assertTrue(dlg.btn_submit.enabled)
        dlg.destroy()

    def test_checksum_dialog_ui(self):
        task = E.DownloadTask(f"chk_dlg_{int(time.time())}", "https://host.com/file.zip", self.test_file)
        task.total_size = os.path.getsize(self.test_file)
        task.is_completed = True

        dlg = ui_dialogs.ChecksumDialog(self.app, task)
        self.assertTrue(dlg.winfo_exists())
        self.assertEqual(len(dlg.hash_entries), 5)
        for algo in ("MD5", "SHA-1", "SHA-256", "SHA-512", "CRC32"):
            self.assertIn(algo, dlg.hash_entries)
        dlg.destroy()


if __name__ == "__main__":
    unittest.main()


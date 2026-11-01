# -*- coding: utf-8 -*-
"""
test_analytics.py - Automated Unit & Integration Tests for Analytics & History System
Part of NegmLoading Verification Suite
"""
import os
import sys
import time
import tempfile
import unittest
import json
import csv

import nexus_engine as E
import ui_theme
import ui_dialogs
from nexus_stream_manager import NexusStreamManagerApp


class DummyTask:
    def __init__(self, filename, url, size=1048576, status="completed", err=""):
        self.filename = filename
        self.url = url
        self.save_path = os.path.join(tempfile.gettempdir(), filename)
        self.total_size = size
        self.net_bytes_downloaded = size
        self.status_detail = err
        self.queue_id = "main"
        self.current_speed_bps = 524288
        self.added_time = time.time() - 10.0


class TestAnalyticsEngine(unittest.TestCase):
    def setUp(self):
        self.tmp_dir = tempfile.mkdtemp()
        self.hist_file = os.path.join(self.tmp_dir, "test_hist.json")
        self.mgr = E.DownloadHistoryManager(history_file=self.hist_file)

    def tearDown(self):
        try:
            if os.path.exists(self.hist_file):
                os.remove(self.hist_file)
            os.rmdir(self.tmp_dir)
        except Exception:
            pass

    def test_record_and_query_history(self):
        t1 = DummyTask("video_sample.mp4", "https://youtube.com/watch?v=123", 20971520)
        t2 = DummyTask("archive.zip", "https://github.com/user/repo/archive.zip", 5242880)
        t3 = DummyTask("failed_doc.pdf", "https://example.com/docs/manual.pdf", 1048576, err="HTTP 404 Not Found")

        r1 = self.mgr.record_download(t1, status="completed", duration_sec=4.0)
        r2 = self.mgr.record_download(t2, status="completed", duration_sec=2.0)
        r3 = self.mgr.record_download(t3, status="failed", error_msg=t3.status_detail, duration_sec=0.5)

        self.assertEqual(len(self.mgr.records), 3)
        self.assertEqual(r1["domain"], "youtube.com")
        self.assertEqual(r2["domain"], "github.com")
        self.assertEqual(r3["status"], "failed")

        # Query all
        all_recs = self.mgr.get_records()
        self.assertEqual(len(all_recs), 3)

        # Filter by status
        completed_recs = self.mgr.get_records(status_filter="completed")
        self.assertEqual(len(completed_recs), 2)

        failed_recs = self.mgr.get_records(status_filter="failed")
        self.assertEqual(len(failed_recs), 1)
        self.assertEqual(failed_recs[0]["filename"], "failed_doc.pdf")

        # Filter by search
        yt_recs = self.mgr.get_records(search_query="youtube")
        self.assertEqual(len(yt_recs), 1)
        self.assertEqual(yt_recs[0]["filename"], "video_sample.mp4")

        # Delete single record
        deleted = self.mgr.delete_record(r3["id"])
        self.assertTrue(deleted)
        self.assertEqual(len(self.mgr.get_records()), 2)

        # Clear history
        self.mgr.clear_history()
        self.assertEqual(len(self.mgr.get_records()), 0)

    def test_summary_and_kpis(self):
        t1 = DummyTask("clip1.mp4", "https://vimeo.com/video1", 10000000)
        t2 = DummyTask("clip2.mp4", "https://vimeo.com/video2", 15000000)
        t3 = DummyTask("code.tar.gz", "https://github.com/proj/code.tar.gz", 5000000)
        t4 = DummyTask("broken.iso", "https://linux.org/arch.iso", 1000000, err="Timeout")

        self.mgr.record_download(t1, "completed", duration_sec=5.0)
        self.mgr.record_download(t2, "completed", duration_sec=6.0)
        self.mgr.record_download(t3, "completed", duration_sec=2.5)
        self.mgr.record_download(t4, "failed", error_msg="Timeout", duration_sec=1.0)

        summary = self.mgr.get_summary()
        self.assertEqual(summary["total_count"], 4)
        self.assertEqual(summary["completed_count"], 3)
        self.assertEqual(summary["failed_count"], 1)
        self.assertEqual(summary["lifetime_bytes"], 30000000)
        self.assertEqual(summary["success_rate_pct"], 75.0)

        # Top domains check
        top_domains = summary["top_domains"]
        self.assertTrue(len(top_domains) >= 2)
        # vimeo has 25 MB, github has 5 MB
        self.assertEqual(top_domains[0]["domain"], "vimeo.com")
        self.assertEqual(top_domains[0]["bytes"], 25000000)
        self.assertEqual(top_domains[0]["count"], 2)

    def test_export_csv_with_utf8_bom(self):
        t = DummyTask("تقرير تنزيل.mp4", "https://aljazeera.net/video.mp4", 12345678)
        self.mgr.record_download(t, "completed", duration_sec=3.0)

        out_csv = os.path.join(self.tmp_dir, "export_test.csv")
        ok = self.mgr.export_csv(out_csv)
        self.assertTrue(ok)
        self.assertTrue(os.path.exists(out_csv))

        # Check UTF-8 BOM
        with open(out_csv, "rb") as f:
            raw = f.read()
        self.assertEqual(raw[:3], b"\xef\xbb\xbf")

        # Read back CSV
        with open(out_csv, "r", encoding="utf-8-sig") as f:
            reader = csv.reader(f)
            rows = list(reader)
        self.assertEqual(len(rows), 2)  # Header + 1 record
        self.assertEqual(rows[1][1], "تقرير تنزيل.mp4")
        self.assertEqual(rows[1][9], "aljazeera.net")

    def test_export_json_and_html(self):
        t = DummyTask("app_installer.exe", "https://downloads.example.org/setup.exe", 8888888)
        self.mgr.record_download(t, "completed", duration_sec=4.0)

        # Test JSON
        out_json = os.path.join(self.tmp_dir, "export_test.json")
        ok_json = self.mgr.export_json(out_json)
        self.assertTrue(ok_json)
        with open(out_json, "r", encoding="utf-8") as f:
            data = json.load(f)
        self.assertIn(data["app"], ("Negm Lodaing", "NegmLoading"))
        self.assertEqual(data["total_records"], 1)

        # Test HTML
        out_html = os.path.join(self.tmp_dir, "export_test.html")
        ok_html = self.mgr.export_html(out_html)
        self.assertTrue(ok_html)
        with open(out_html, "r", encoding="utf-8") as f:
            html_text = f.read()
        self.assertIn("<!DOCTYPE html>", html_text)
        self.assertTrue("Negm Lodaing" in html_text or "NegmLoading" in html_text)
        self.assertIn("app_installer.exe", html_text)
        self.assertIn("downloads.example.org", html_text)


class TestAnalyticsDialog(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        try:
            cls.app = NexusStreamManagerApp()
            cls.app.withdraw()
        except Exception as e:
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

    def test_analytics_dialog_creation_and_switching(self):
        dlg = ui_dialogs.AnalyticsDialog(self.app)
        self.assertTrue(dlg.winfo_exists())

        # Check KPI cards
        self.assertIn("lifetime", dlg.kpi_vals)
        self.assertIn("today", dlg.kpi_vals)
        self.assertIn("done", dlg.kpi_vals)
        self.assertIn("peak", dlg.kpi_vals)

        # Check pages
        self.assertTrue(hasattr(dlg, "page_overview"))
        self.assertTrue(hasattr(dlg, "page_history"))
        self.assertTrue(hasattr(dlg, "page_domains"))

        # Switch to history tab
        dlg._switch_tab(E.t("st_tab_history"))
        dlg.update_idletasks()
        self.assertEqual(dlg.page_history.winfo_manager(), "pack")

        # Switch to domains tab
        dlg._switch_tab(E.t("st_tab_domains"))
        dlg.update_idletasks()
        self.assertEqual(dlg.page_domains.winfo_manager(), "pack")

        # Switch back to overview
        dlg._switch_tab(E.t("st_tab_overview"))
        dlg.update_idletasks()
        self.assertEqual(dlg.page_overview.winfo_manager(), "pack")

        # Redraw graph
        dlg._draw_graph()

        # Destroy cleanly
        dlg.destroy()


if __name__ == "__main__":
    unittest.main()

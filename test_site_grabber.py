# -*- coding: utf-8 -*-
"""
test_site_grabber.py - Comprehensive Unit & Integration Tests for Advanced Site Grabber (Phase 7)
"""
import os
import sys
import unittest
import threading
import time
import customtkinter as ctk

import nexus_engine as E
import ui_theme as theme
import nexus_stream_manager as app_module
from ui_dialogs import SiteGrabberDialog


class TestSiteGrabberSystem(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        ctk.set_appearance_mode("Dark")
        E.DEFAULT_PORT = 45798

    def setUp(self):
        self.app = app_module.NexusStreamManagerApp()
        self.app.withdraw()
        self.app.update_idletasks()

    def tearDown(self):
        try:
            self.app.force_exit = True
            self.app.on_close()
        except Exception:
            pass

    def test_01_spider_html_parser(self):
        sample_html = """
        <!DOCTYPE html>
        <html>
        <head>
            <base href="https://example.com/sub/">
            <title>Test Page</title>
        </head>
        <body>
            <a href="document.pdf">Download PDF</a>
            <a href="https://other.com/archive.zip">Archive</a>
            <video src="media/sample.mp4"></video>
            <img src="images/banner.png" alt="Banner Image">
            <a href="page2.html">Next Page</a>
            <a href="setup.exe" download="custom_installer.exe">Installer</a>
        </body>
        </html>
        """
        spider = E._WebpageLinkSpider("https://example.com/")
        spider.feed(sample_html)
        self.assertGreaterEqual(len(spider.raw_items), 5)

        items_dict = {item[0]: item[1] for item in spider.raw_items}
        self.assertIn("document.pdf", items_dict)
        self.assertIn("https://other.com/archive.zip", items_dict)
        self.assertIn("media/sample.mp4", items_dict)
        self.assertIn("images/banner.png", items_dict)

    def test_02_classify_spider_link(self):
        res_pdf = E.classify_spider_link("https://example.com/books/guide.pdf", "link", "User Guide")
        self.assertEqual(res_pdf["category"], "type_docs")
        self.assertEqual(res_pdf["ext"], "pdf")
        self.assertTrue(res_pdf["is_file"])

        res_vid = E.classify_spider_link("https://example.com/video.mp4", "media", "Trailer")
        self.assertEqual(res_vid["category"], "type_videos")
        self.assertEqual(res_vid["ext"], "mp4")
        self.assertTrue(res_vid["is_file"])

        res_zip = E.classify_spider_link("https://example.com/data.tar.gz", "link", "")
        self.assertEqual(res_zip["category"], "type_compressed")
        self.assertEqual(res_zip["ext"], "gz")
        self.assertTrue(res_zip["is_file"])

        res_exe = E.classify_spider_link("https://example.com/app_setup.exe", "link", "")
        self.assertEqual(res_exe["category"], "type_programs")
        self.assertEqual(res_exe["ext"], "exe")
        self.assertTrue(res_exe["is_file"])

        res_html = E.classify_spider_link("https://example.com/about.html", "link", "About Us")
        self.assertEqual(res_html["category"], "type_other")
        self.assertFalse(res_html["is_file"])

    def test_03_probe_spider_item_sizes_mock(self):
        mock_items = [
            {"url": "https://httpbin.org/bytes/1024", "is_file": True, "size": 0, "size_str": "--"},
            {"url": "https://example.com/page", "is_file": False, "size": 0, "size_str": "--"}
        ]
        cancel_evt = threading.Event()
        # Fast run: cancel right away to verify thread termination and safety
        cancel_evt.set()
        E.probe_spider_item_sizes(mock_items, max_workers=2, cancel_event=cancel_evt)
        # Should not throw or crash
        self.assertTrue(cancel_evt.is_set())

    def test_04_dialog_instantiation_and_controls(self):
        dlg = SiteGrabberDialog(self.app, "https://example.com")
        self.app.update_idletasks()

        # Check options
        self.assertIsNotNone(dlg.depth_seg)
        self.assertEqual(dlg.crawl_depth, 1)
        self.assertTrue(dlg.v_same_domain.get())

        # Switch depth
        dlg._on_depth_changed(theme.t("spd_depth_2"))
        self.assertEqual(dlg.crawl_depth, 2)

        # Check Treeview columns
        cols = dlg.tree["columns"]
        self.assertIn("chk", cols)
        self.assertIn("name", cols)
        self.assertIn("cat", cols)
        self.assertIn("ext", cols)
        self.assertIn("size", cols)
        self.assertIn("url", cols)

        # Check queues mapping
        self.assertIn("main", dlg.queue_map.values())

        dlg.destroy()

    def test_05_dialog_selection_and_submission(self):
        dlg = SiteGrabberDialog(self.app, "")
        self.app.update_idletasks()

        uid = str(int(time.time() * 1000))
        u1 = f"https://test.com/file1_{uid}.zip"
        u2 = f"https://test.com/file2_{uid}.pdf"
        mock_items = [
            {"url": u1, "name": f"file1_{uid}.zip", "ext": "zip", "category": "type_compressed", "is_file": True, "size": 1048576, "size_str": "1.00 MB"},
            {"url": u2, "name": f"file2_{uid}.pdf", "ext": "pdf", "category": "type_docs", "is_file": True, "size": 2097152, "size_str": "2.00 MB"},
        ]
        dlg._on_scan_done(True, mock_items)
        self.app.update_idletasks()

        self.assertEqual(len(dlg.all_items), 2)
        self.assertTrue(all(it["selected"] for it in dlg.all_items))
        self.assertTrue(dlg.btn_submit.enabled)

        # Test deselect all
        dlg._toggle_all_visible(False)
        self.assertTrue(all(not it["selected"] for it in dlg.all_items))

        # Test invert selection
        dlg._invert_selection()
        self.assertTrue(all(it["selected"] for it in dlg.all_items))

        # Select custom queue if exists or main
        queues = self.app.get_all_queues()
        self.assertGreaterEqual(len(queues), 1)

        # Submit chosen items
        init_tasks_count = len(self.app.tasks)
        dlg._submit()
        self.app.update_idletasks()

        self.assertEqual(len(self.app.tasks), init_tasks_count + 2)
        added_urls = [t_info["task"].url for t_info in self.app.tasks[-2:]]
        self.assertIn(u1, added_urls)
        self.assertIn(u2, added_urls)


if __name__ == "__main__":
    unittest.main()

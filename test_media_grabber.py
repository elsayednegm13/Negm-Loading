# -*- coding: utf-8 -*-
"""
test_media_grabber.py - Unit & Integration Tests for Floating Video Grabber, Stream Sniffer & Media Engine (Phase 8)
"""
import os
import sys
import time
import unittest
import threading
import customtkinter as ctk

import nexus_engine as E
import ui_theme as theme
import nexus_stream_manager as app_module
from ui_dialogs import MediaGrabberDialog


class TestMediaGrabberSystem(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        ctk.set_appearance_mode("Dark")
        E.DEFAULT_PORT = 45797

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

    def test_01_is_media_platform_url_and_streams(self):
        # Major platforms
        self.assertTrue(E.is_media_platform_url("https://www.youtube.com/watch?v=dQw4w9WgXcQ"))
        self.assertTrue(E.is_media_platform_url("https://youtu.be/dQw4w9WgXcQ"))
        self.assertTrue(E.is_media_platform_url("https://x.com/user/status/123456789"))
        self.assertTrue(E.is_media_platform_url("https://www.tiktok.com/@user/video/987654321"))
        self.assertTrue(E.is_media_platform_url("https://vimeo.com/123456"))

        # HLS & DASH streams
        self.assertTrue(E.is_media_platform_url("https://cdn.example.com/live/master.m3u8"))
        self.assertTrue(E.is_media_platform_url("https://streaming.service.org/video.mpd?token=xyz"))
        self.assertTrue(E.is_media_platform_url("https://broadcast.tv/feed.ts"))

        # Regular file downloads should NOT be media platform URLs
        self.assertFalse(E.is_media_platform_url("https://example.com/file.zip"))
        self.assertFalse(E.is_media_platform_url("https://example.com/manual.pdf"))
        self.assertFalse(E.is_media_platform_url("https://example.com/installer.exe"))

    def test_02_media_dialog_instantiation_video_mode(self):
        dlg = MediaGrabberDialog(self.app, default_url="https://www.youtube.com/watch?v=test", audio_only=False)
        self.app.update_idletasks()

        self.assertFalse(dlg.v_audio_only.get())
        self.assertIsNotNone(dlg.q_menu)
        self.assertIsNotNone(dlg.queue_opt)
        self.assertIn("main", dlg.queue_map.values())

        # Check default qualities
        self.assertGreaterEqual(len(dlg.qualities), 3)
        self.assertEqual(dlg.qualities[0]["id"], "best_auto")

        dlg.destroy()

    def test_03_media_dialog_audio_only_mode(self):
        dlg = MediaGrabberDialog(self.app, default_url="https://www.youtube.com/watch?v=test", audio_only=True)
        self.app.update_idletasks()

        self.assertTrue(dlg.v_audio_only.get())
        # Toggling off switches back to video
        dlg.v_audio_only.set(False)
        dlg._on_audio_only_toggle()
        self.assertEqual(theme.strip_bidi(dlg.q_var.get()), dlg.qualities[0]["label"])

        dlg.destroy()

    def test_04_stream_badge_and_mock_analysis(self):
        dlg = MediaGrabberDialog(self.app, "https://stream.nasa.gov/live.m3u8")
        self.app.update_idletasks()

        mock_res = {
            "title": "NASA Live Stream - Earth View",
            "uploader": "NASA",
            "duration": 0,
            "platform": "HLS Stream",
            "webpage_url": "https://stream.nasa.gov/live.m3u8",
            "qualities": dlg._default_qualities(),
            "ffmpeg_available": True,
            "is_live": True,
            "is_stream": True,
            "thumbnail": "",
        }
        dlg._on_analyze_done(True, mock_res)
        self.app.update_idletasks()

        meta_text = theme.strip_bidi(dlg.lbl_meta.cget("text"))
        self.assertIn(theme.t("vid_stream_badge"), meta_text)
        self.assertEqual(dlg.title_var.get(), "NASA Live Stream - Earth View")

        # Test submission with custom queue
        init_tasks_count = len(self.app.tasks)
        dlg._submit(start_now=False)
        self.app.update_idletasks()

        self.assertEqual(len(self.app.tasks), init_tasks_count + 1)
        added_task = self.app.tasks[-1]["task"]
        self.assertEqual(added_task.queue_id, "main")

    def test_05_browser_payload_media_routing(self):
        uid = str(int(time.time() * 1000))
        test_url = f"https://www.youtube.com/watch?v=vid_{uid}"
        payload = {
            "url": test_url,
            "mode": "media",
            "audio_only": True,
            "title": "Super Hits Song",
            "referrer": "https://www.youtube.com/",
        }
        # Process payload through bridge handler
        self.app.handle_browser_payload(payload)
        self.app.update_idletasks()

        # Check that top level dialog was created
        toplevels = [w for w in self.app.winfo_children() if isinstance(w, MediaGrabberDialog)]
        self.assertGreaterEqual(len(toplevels), 1)
        active_dlg = toplevels[-1]
        self.assertEqual(active_dlg.url_var.get(), test_url)
        self.assertTrue(active_dlg.v_audio_only.get())
        self.assertEqual(active_dlg.title_var.get(), "Super Hits Song")

        active_dlg.destroy()


if __name__ == "__main__":
    unittest.main()

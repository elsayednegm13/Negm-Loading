# -*- coding: utf-8 -*-
"""
test_web_remote.py - Automated Unit & Integration Tests for Web Remote Dashboard & Post-Download Automation
Part of NegmLoading Verification Suite (Phase 12)
"""
import os
import sys
import time
import json
import socket
import tempfile
import unittest
import requests

import nexus_engine as E
import ui_theme
import ui_dialogs
from nexus_stream_manager import NexusStreamManagerApp


class MockApp:
    """Mock application manager for WebRemoteServer testing."""
    def __init__(self):
        self.tasks = []
        self.actions_dispatched = []
        self.added_urls = []

    def after(self, ms, func):
        if callable(func):
            func()

    def act_pause_all(self):
        self.actions_dispatched.append("pause_all")

    def act_resume_all(self):
        self.actions_dispatched.append("resume_all")

    def pause_task_by_id(self, t_id):
        self.actions_dispatched.append(f"pause:{t_id}")

    def resume_task_by_id(self, t_id):
        self.actions_dispatched.append(f"resume:{t_id}")

    def cancel_task_by_id(self, t_id):
        self.actions_dispatched.append(f"cancel:{t_id}")

    def add_download_direct(self, url, filename="", chunks=8):
        self.added_urls.append({"url": url, "filename": filename, "chunks": chunks})


class TestWebRemoteServer(unittest.TestCase):
    def setUp(self):
        self.mock_app = MockApp()
        # Find an open port
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.bind(("", 0))
        self.test_port = s.getsockname()[1]
        s.close()
        self.token = "test_pin_4321"
        self.server = E.WebRemoteServer(self.mock_app, port=self.test_port, token=self.token, allow_lan=False)

    def tearDown(self):
        if self.server:
            self.server.stop()
            time.sleep(0.1)

    def test_local_lan_ip_detection(self):
        ip = E.get_local_lan_ip()
        self.assertIsInstance(ip, str)
        self.assertGreater(len(ip), 6)
        parts = ip.split(".")
        self.assertEqual(len(parts), 4)

    def test_server_lifecycle_and_endpoints(self):
        started = self.server.start()
        self.assertTrue(started)
        self.assertTrue(self.server.is_running)

        base_url = f"http://127.0.0.1:{self.test_port}"
        time.sleep(0.3)

        # 1. GET / (Dashboard SPA HTML)
        res_index = requests.get(f"{base_url}/", timeout=3)
        self.assertEqual(res_index.status_code, 200)
        self.assertTrue("Negm Lodaing Web Remote" in res_index.text or "NegmLoading Web Remote" in res_index.text)
        self.assertIn("valSpeed", res_index.text)

        # 2. GET /api/status without token -> 401 Unauthorized
        res_unauth = requests.get(f"{base_url}/api/status", timeout=3)
        self.assertEqual(res_unauth.status_code, 401)

        # 3. GET /api/status with valid token
        res_status = requests.get(f"{base_url}/api/status?token={self.token}", timeout=3)
        self.assertEqual(res_status.status_code, 200)
        st_data = res_status.json()
        self.assertTrue(st_data.get("ok"))
        self.assertIn(st_data.get("app"), ("Negm Lodaing", "NegmLoading"))
        self.assertIn("speed_str", st_data)

        # 4. POST /api/verify token
        res_ver_ok = requests.post(f"{base_url}/api/verify", json={"token": self.token}, timeout=3)
        self.assertTrue(res_ver_ok.json().get("ok"))
        res_ver_bad = requests.post(f"{base_url}/api/verify", json={"token": "wrong"}, timeout=3)
        self.assertFalse(res_ver_bad.json().get("ok"))

        # 5. POST /api/action (Global and per-task)
        res_act1 = requests.post(f"{base_url}/api/action", json={"token": self.token, "action": "pause_all"}, timeout=3)
        self.assertTrue(res_act1.json().get("ok"))
        self.assertIn("pause_all", self.mock_app.actions_dispatched)

        res_act2 = requests.post(f"{base_url}/api/action", json={"token": self.token, "action": "pause", "task_id": "task_42"}, timeout=3)
        self.assertTrue(res_act2.json().get("ok"))
        self.assertIn("pause:task_42", self.mock_app.actions_dispatched)

        # 6. POST /api/add
        res_add = requests.post(
            f"{base_url}/api/add",
            json={"token": self.token, "url": "https://example.com/file.zip", "filename": "sample.zip", "chunks": 16},
            timeout=3
        )
        self.assertTrue(res_add.json().get("ok"))
        self.assertEqual(len(self.mock_app.added_urls), 1)
        self.assertEqual(self.mock_app.added_urls[0]["filename"], "sample.zip")

        # 7. Server stop
        self.server.stop()
        self.assertFalse(self.server.is_running)


class TestPostDownloadAutomation(unittest.TestCase):
    def setUp(self):
        self.tmp_dir = tempfile.mkdtemp()

    def tearDown(self):
        try:
            for f in os.listdir(self.tmp_dir):
                os.remove(os.path.join(self.tmp_dir, f))
            os.rmdir(self.tmp_dir)
        except Exception:
            pass

    def test_power_action_invalid_type_safe_fallback(self):
        res = E.execute_power_action("invalid_nonexistent_action")
        self.assertFalse(res)

    def test_post_completion_custom_command(self):
        marker_file = os.path.join(self.tmp_dir, "executed_marker.txt")
        dummy_download = os.path.join(self.tmp_dir, "test_file.iso")
        with open(dummy_download, "w") as f:
            f.write("dummy")

        class DummyTask:
            def __init__(self, p):
                self.is_finished = True
                self.save_path = p
                self.filename = os.path.basename(p)
                self.total_size = 1024
                self.url = "https://example.com/test.iso"

        task = DummyTask(dummy_download)
        # Custom command that writes to marker_file
        cmd = f'echo completed > "{marker_file}"'
        settings = {"post_command": cmd, "post_webhook": ""}

        E.execute_post_completion(task, settings)
        # Give thread up to 1.5s to run shell command
        time.sleep(1.0)
        self.assertTrue(os.path.exists(marker_file))


class TestPhase12Dialogs(unittest.TestCase):
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

    def test_web_remote_dialog_ui(self):
        dlg = ui_dialogs.WebRemoteDialog(self.app)
        self.assertTrue(dlg.winfo_exists())
        self.assertTrue(hasattr(dlg, "entry_url"))
        self.assertTrue(hasattr(dlg, "entry_pin"))
        self.assertTrue(hasattr(dlg, "entry_port"))
        dlg.destroy()

    def test_post_download_dialog_ui(self):
        dlg = ui_dialogs.PostDownloadDialog(self.app)
        self.assertTrue(dlg.winfo_exists())
        self.assertTrue(hasattr(dlg, "combo_action"))
        self.assertTrue(hasattr(dlg, "entry_cmd"))
        self.assertTrue(hasattr(dlg, "entry_wh"))
        dlg.destroy()


if __name__ == "__main__":
    unittest.main()


# -*- coding: utf-8 -*-
"""
test_queue_system.py - Comprehensive Unit & Integration Tests for NegmLoading Multi-Queue System
"""
import os
import sys
import time
import unittest
import customtkinter as ctk

import nexus_engine as E
import ui_theme as theme
import nexus_stream_manager as app_module
from ui_dialogs import QueueManagerDialog, QueueEditDialog

class TestMultiQueueSystem(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        ctk.set_appearance_mode("Dark")
        E.DEFAULT_PORT = 45799

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

    def test_01_default_queue_initialization(self):
        queues = self.app.get_all_queues()
        self.assertGreaterEqual(len(queues), 1)
        main_q = queues[0]
        self.assertEqual(main_q["id"], "main")
        self.assertTrue(main_q.get("enabled", True))

    def test_02_create_and_update_custom_queue(self):
        new_q = {
            "id": "q_night_test",
            "name": "Night Downloads",
            "max_parallel": 2,
            "folder": "C:\\Downloads\\Night",
            "schedule_start": "02:00",
            "schedule_stop": "06:00",
            "enabled": True,
        }
        self.app.save_queue_item(new_q)
        queues = self.app.get_all_queues()
        ids = [q["id"] for q in queues]
        self.assertIn("q_night_test", ids)

        # Update it
        new_q["max_parallel"] = 4
        self.app.save_queue_item(new_q)
        updated_q = [q for q in self.app.get_all_queues() if q["id"] == "q_night_test"][0]
        self.assertEqual(updated_q["max_parallel"], 4)

    def test_03_task_queue_assignment_and_filtering(self):
        # Create 2 test tasks
        task1 = E.DownloadTask("t_q1", "http://example.com/file1.zip", "C:\\temp\\file1.zip", queue_id="main")
        task2 = E.DownloadTask("t_q2", "http://example.com/file2.zip", "C:\\temp\\file2.zip", queue_id="q_night_test")
        
        self.assertEqual(task1.queue_id, "main")
        self.assertEqual(task2.queue_id, "q_night_test")
        self.assertEqual(task1.to_dict()["queue_id"], "main")
        self.assertEqual(task2.to_dict()["queue_id"], "q_night_test")

        # Test filter matching
        self.app.active_filter = "queue_main"
        self.assertTrue(self.app.matches(task1))
        self.assertFalse(self.app.matches(task2))

        self.app.active_filter = "queue_q_night_test"
        self.assertFalse(self.app.matches(task1))
        self.assertTrue(self.app.matches(task2))

    def test_04_move_tasks_to_queue(self):
        task = E.DownloadTask("t_move", "http://example.com/move.bin", "C:\\temp\\move.bin", queue_id="main")
        self.app.move_tasks_to_queue([task], "q_night_test")
        self.assertEqual(task.queue_id, "q_night_test")

    def test_05_delete_queue_migrates_tasks(self):
        # Add a dummy queue with a task
        custom_q = {
            "id": "q_to_delete",
            "name": "Delete Me",
            "max_parallel": 1,
            "folder": "",
            "schedule_start": "",
            "schedule_stop": "",
            "enabled": True,
        }
        self.app.save_queue_item(custom_q)
        
        # Add task to app.tasks
        task = E.DownloadTask("t_migrate", "http://example.com/migrate.bin", "C:\\temp\\migrate.bin", queue_id="q_to_delete")
        from ui_table import TaskRowHandle
        row = TaskRowHandle(self.app.scroll, task, self.app)
        self.app.tasks.append({"task": task, "row": row})

        # Delete queue
        self.app.delete_queue_item("q_to_delete")
        queues = self.app.get_all_queues()
        self.assertNotIn("q_to_delete", [q["id"] for q in queues])
        self.assertEqual(task.queue_id, "main", "Task in deleted queue must automatically migrate to 'main'")

    def test_06_dialog_instantiation(self):
        # Test QueueManagerDialog
        mgr = QueueManagerDialog(self.app)
        self.assertTrue(mgr.winfo_exists())
        mgr.destroy()

        # Test QueueEditDialog
        edt = QueueEditDialog(self.app, None)
        self.assertTrue(edt.winfo_exists())
        edt.destroy()

if __name__ == "__main__":
    unittest.main()

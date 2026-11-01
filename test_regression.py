# -*- coding: utf-8 -*-
"""
test_regression.py - Comprehensive regression suite for NegmLoading
Tests all decoupled modules, UI widgets, engine core, theme animation, and headless app lifecycle.
"""
import os
import sys
import time
import unittest
import tkinter as tk
import customtkinter as ctk

# Import all modules
import nexus_engine as E
import ui_theme as theme
import ui_components as comp
import ui_table as table
import ui_dialogs as dialogs
import nexus_stream_manager as app_module

class TestNegmLoadingRegression(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        ctk.set_appearance_mode("Dark")
        ctk.set_default_color_theme("blue")
        cls.test_root = ctk.CTk()
        cls.test_root.withdraw()

    @classmethod
    def tearDownClass(cls):
        try:
            cls.test_root.destroy()
        except Exception:
            pass

    def test_01_ui_theme_tokens_and_cache(self):
        """Verify theme palette, font caching, and bidi engine."""
        self.assertIn("bg", theme.PALETTE)
        self.assertIn("accent_cyan", theme.PALETTE)
        self.assertEqual(theme.cur("accent_cyan"), "#22d3ee")  # in Dark mode
        self.assertEqual(theme.col("accent_cyan"), ("#0b5d7a", "#22d3ee"))
        
        # Test font memoization cache
        f1 = theme.uifont(12, "normal")
        f2 = theme.uifont(12, "normal")
        self.assertIs(f1, f2, "Font cache should return the exact same instance")
        
        f_bold = theme.uifont(12, "bold")
        self.assertIsNot(f1, f_bold, "Different weights should have different instances")

        # Test bidi and alignment
        self.assertTrue(callable(theme.bidi))
        self.assertTrue(callable(theme.col))

    def test_02_engine_classification_and_tasks(self):
        """Verify file type classification and task creation in engine."""
        self.assertEqual(E.detect_category("archive.zip"), "type_compressed")
        self.assertEqual(E.detect_category("movie.mp4"), "type_videos")
        self.assertEqual(E.detect_category("song.mp3"), "type_music")
        self.assertEqual(E.detect_category("document.pdf"), "type_docs")
        self.assertEqual(E.detect_category("setup.exe"), "type_programs")

        task = E.DownloadTask(
            task_id="test_id_123",
            url="http://127.0.0.1:45791/test",
            save_path="test_download.bin",
            max_chunks=8
        )
        self.assertEqual(task.state, "queued")
        self.assertEqual(task.task_id, "test_id_123")

    def test_03_ui_components_instantiation(self):
        """Verify UI widgets instantiate properly inside a hidden CTk root."""
        root = ctk.CTk()
        root.withdraw()
        try:
            # IconButton
            btn = comp.IconButton(root, icon="download", text="Download")
            self.assertIsNotNone(btn)

            # StatusPill
            pill = comp.StatusPill(root)
            self.assertIsNotNone(pill)
            pill.set("check", "Active", "pill_active", "accent_cyan")

            # SegmentedControl
            seg = comp.SegmentedControl(root, values=["All", "Active"])
            self.assertIsNotNone(seg)

            # ToggleSwitch
            var = ctk.BooleanVar(value=True)
            switch = comp.ToggleSwitch(root, text="Test Switch", variable=var)
            self.assertIsNotNone(switch)

            # CheckOption
            check = comp.CheckOption(root, text="Test Check", variable=var)
            self.assertIsNotNone(check)

            root.update_idletasks()
        finally:
            root.destroy()

    def test_04_app_headless_lifecycle(self):
        """Verify full NexusStreamManagerApp starts, builds UI, and tears down cleanly."""
        E.DEFAULT_PORT = 45798
        app = app_module.NexusStreamManagerApp()
        app.withdraw()  # keep hidden during tests
        try:
            app.update_idletasks()
            self.assertIsNotNone(app.table)
            self.assertEqual(app.active_filter, "cat_all")
            
            # Test quick language toggle
            initial_lang = app.settings.get("lang", "ar")
            app.quick_language()
            app.update_idletasks()
            toggled_lang = app.settings.get("lang")
            self.assertNotEqual(initial_lang, toggled_lang)
            
            # Toggle back
            app.quick_language()
            app.update_idletasks()
            self.assertEqual(app.settings.get("lang"), initial_lang)

            # Verify table can redraw
            app.table.refresh_viewport()
            app.update_idletasks()

            # Test Command Palette (Ctrl+K)
            app.show_command_palette()
            self.assertTrue(hasattr(app, "palette_dialog"))
            self.assertTrue(app.palette_dialog.winfo_exists())
            app.palette_dialog.query_var.set("video")
            app.palette_dialog._filter_commands()
            self.assertGreaterEqual(len(app.palette_dialog.rendered_items), 1)
            app.palette_dialog.destroy()

            # Test quick theme toggle
            initial_mode = ctk.get_appearance_mode()
            app.quick_theme()
            app.update_idletasks()
            new_mode = ctk.get_appearance_mode()
            self.assertNotEqual(initial_mode, new_mode)
            app.quick_theme()
            app.update_idletasks()
            self.assertEqual(ctk.get_appearance_mode(), initial_mode)
        finally:
            app.force_exit = True
            app.on_close()

if __name__ == "__main__":
    unittest.main()

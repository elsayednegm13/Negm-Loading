# -*- coding: utf-8 -*-
"""
nexus_stream_manager.py - Main Desktop Application Orchestrator for NegmLoading
Part of NegmLoading Modular Architecture

This module coordinates the desktop UI and re-exports all symbols from:
  - ui_theme: design tokens, colors, typography, RTL/LTR mirroring, and bidi engine
  - ui_components: reusable interactive widgets (Tooltip, IconButton, NavItem, StatusPill, Toast, etc.)
  - ui_table: zero-lag virtualized hardware-accelerated download table
  - ui_dialogs: all modal dialogs, configuration panels, media grabbers, and utilities

100% backward compatibility is guaranteed for all imports and external entry points.
"""
from __future__ import annotations

import os
import re
import sys
import time
import math
import ctypes
import tempfile
import threading
import subprocess
import webbrowser
import queue
import collections
import pystray
from typing import Optional, Callable, Any, Dict, List, Tuple

import tkinter as tk
from tkinter import ttk, messagebox, filedialog
import customtkinter as ctk
from PIL import Image, ImageTk, ImageDraw

import nexus_engine as E
from nexus_engine import *

# Re-export all submodules for 100% backward compatibility
from ui_theme import *
from ui_components import *
from ui_table import *
from ui_dialogs import *

# ----------------------------------------------------------------------
# 4. Main Application (RTL/LTR Mirrored, Responsive, Accessible)
# ----------------------------------------------------------------------
if E.DND_OK:
    class _AppBase(ctk.CTk, E.TkinterDnD.DnDWrapper):
        pass
else:
    class _AppBase(ctk.CTk):
        pass


FILTERS = (
    ("cat_all", "list", "text_muted", "nav_all"),
    ("cat_active", "download", "accent_cyan", "nav_active"),
    ("cat_completed", "check", "success", "nav_done"),
    ("cat_paused", "circle-pause", "warning", "nav_paused"),
    ("cat_failed", "circle-xmark", "danger", "nav_failed"),
)
TYPE_FILTERS = (
    ("type_compressed", "zip", "warning"),
    ("type_programs", "cube", "primary_text"),
    ("type_videos", "film", "danger"),
    ("type_music", "music", "success"),
    ("type_docs", "doc", "accent_cyan"),
)


class NexusStreamManagerApp(_AppBase):
    def __init__(self):
        if sys.platform == "win32":
            try:
                ctypes.windll.shell32.SetCurrentProcessExplicitAppUserModelID("Negm.Lodaing.App.1")
            except Exception:
                pass
        load_icon_font()
        self.settings = dict(DEFAULT_SETTINGS)
        self.settings.update(load_json(SETTINGS_FILE, {}))
        E.set_language(self.settings["lang"])
        ctk.set_appearance_mode(self.settings["theme"])
        super().__init__()
        detect_icon_family(self)
        if E.DND_OK:
            try:
                self.TkdndVersion = E.TkinterDnD._require(self)
            except Exception:
                pass

        self.title("Negm Lodaing")
        apply_window_icon(self)
        self.after(220, lambda: apply_window_icon(self))
        try:
            sw = self.winfo_screenwidth()
            sh = self.winfo_screenheight()
            init_w = min(1220, max(760, sw - 60))
            init_h = min(740, max(520, sh - 80))
            pos_x = max(10, (sw - init_w) // 2)
            pos_y = max(10, (sh - init_h) // 2)
            self.geometry(f"{init_w}x{init_h}+{pos_x}+{pos_y}")
        except Exception:
            self.geometry("1220x740")
        self.minsize(720, 520)
        self.configure(fg_color=col("bg"))

        self.tasks = []
        self.selected = []
        self.anchor = None
        self.active_filter = "cat_all"
        self.toasts = []
        self.add_dialog = None
        self.last_clip = None
        self.is_closing = False
        self.session_done = 0
        self.schedule_dt = None
        self.history_manager = E.DownloadHistoryManager()
        self.proxy_manager = E.get_default_proxy_manager()
        self.credential_vault = E.get_default_credential_vault()
        self.web_remote_server = None
        if self.settings.get("web_remote_enabled", False):
            self.after(600, self.start_web_remote)
        self._last_toolbar = None
        self._last_save = 0

        self._sidebar_user_pref = None  # None = auto responsive (< 980px), bool = manual override
        self._sidebar_collapsed = False
        self._toolbar_compact = False
        self._resize_job = None
        self._syncing_search = False

        self.search_var = ctk.StringVar()
        self.search_var.trace_add("write", self._on_search_var_changed)

        self.tray_icon = None
        self.drop_basket = None
        self.force_exit = False
        self._last_speed_txt = None
        self._last_cnt_txt = None
        self._last_sel_txt = None
        self._last_sch_txt = None
        self._last_lim_txt = None
        self._last_quota_txt = None
        self._last_proxy_txt = None
        self._last_clip_seq = None
        self._quota_exceeded_notified = False
        self._sync_quota_date()

        self.analytics_dialog = None
        self._bridge_queue = queue.SimpleQueue()
        self.speed_samples = collections.deque([0] * 60, maxlen=60)
        self.peak_speed_bps = int(self.settings.get("peak_speed_bps", 0) or 0)
        self.bridge_server = BrowserBridgeServer(
            self._on_bridge_payload_thread,
            port=int(self.settings.get("bridge_port", DEFAULT_BRIDGE_PORT) or DEFAULT_BRIDGE_PORT),
        )
        if self.settings.get("browser_bridge", True):
            self.bridge_server.start()

        self.setup_tray()
        self.build_ui()
        self.bind_hotkeys()
        self.bind("<Configure>", self._on_root_configure, "+")
        self.restore_tasks()
        self.restore_schedule()
        self.setup_dnd()
        self.protocol("WM_DELETE_WINDOW", self.on_close)
        self.after(250, lambda: set_dark_titlebar(self))
        self._tick_timer_id = self.after(350, self.tick)
        self._clip_timer_id = self.after(2000, self.clipboard_loop)
        if self.settings.get("show_drop_basket", False):
            self.after(400, lambda: self.toggle_drop_basket(True))
        if "--tray" in sys.argv:
            self.after(50, self.withdraw)

    # ------------------------------------------------------------ Responsive & Search Sync
    def _logical_width(self) -> int:
        try:
            scale = float(self._get_window_scaling())
        except Exception:
            scale = 1.0
        return int(self.winfo_width() / max(0.75, scale))

    def _on_root_configure(self, event=None):
        if event is not None and event.widget is not self:
            return
        if self._resize_job is not None:
            try:
                self.after_cancel(self._resize_job)
            except Exception:
                pass
        self._resize_job = self.after(45, self._apply_responsive_layout)

    def toggle_sidebar(self):
        self._sidebar_user_pref = not self._sidebar_collapsed
        self._apply_responsive_layout(force=True)

    def _apply_responsive_layout(self, force: bool = False):
        self._resize_job = None
        if self.is_closing or not self.winfo_exists():
            return
        lw = self._logical_width()
        if lw < 200:
            return

        want_collapsed = self._sidebar_user_pref if self._sidebar_user_pref is not None else (lw < 980)
        want_compact_tb = (lw < 960)
        brand_short = (lw < 940)
        target_search_w = 270 if lw >= 1160 else (210 if lw >= 760 else 150)

        if hasattr(self, "lbl_brand_title") and self.lbl_brand_title.winfo_exists():
            want_brand = "Negm Lodaing" if brand_short else t("app_title")
            if self.lbl_brand_title.cget("text") != want_brand:
                self.lbl_brand_title.configure(text=want_brand)

        if hasattr(self, "search_entry") and self.search_entry.winfo_exists():
            if int(self.search_entry.cget("width")) != target_search_w:
                self.search_entry.configure(width=target_search_w)

        if force or want_collapsed != self._sidebar_collapsed:
            self._sidebar_collapsed = want_collapsed
            if hasattr(self, "sidebar_frame") and self.sidebar_frame.winfo_exists():
                new_w = 68 if want_collapsed else 240
                self.sidebar_frame.configure(width=new_w)
                for hdr in getattr(self, "_sidebar_headers", ()):
                    if hdr.winfo_exists():
                        if want_collapsed:
                            hdr.pack_forget()
                        else:
                            pass
                self._repack_sidebar_nav(want_collapsed)
                for item in self.nav.values():
                    item.set_collapsed(want_collapsed)
                for qb in getattr(self, "_qstrip_btns", ()):
                    qb.set_compact(want_collapsed)

        if force or want_compact_tb != self._toolbar_compact:
            self._toolbar_compact = want_compact_tb
            for key in ("video", "spider", "batch", "resume", "pause", "options"):
                btn = self.tb.get(key)
                if btn is not None and btn.winfo_exists():
                    btn.set_compact(want_compact_tb)

    def _repack_sidebar_nav(self, collapsed: bool):
        if not hasattr(self, "nav_inner") or not self.nav_inner.winfo_exists():
            return
        for child in self.nav_inner.winfo_children():
            child.pack_forget()
        px_item = 8 if collapsed else 10
        if not collapsed:
            self._hdr_cats.pack(fill="x", padx=18, pady=(12, 4))
        for key, *_ in FILTERS:
            self.nav[key].pack(fill="x", padx=px_item, pady=1)
        self._nav_divider.pack(fill="x", padx=10 if collapsed else 18, pady=(8, 4 if collapsed else 0))
        if not collapsed:
            self._hdr_types.pack(fill="x", padx=18, pady=(8, 4))
        for key, *_ in TYPE_FILTERS:
            self.nav[key].pack(fill="x", padx=px_item, pady=1)
        if hasattr(self, "_nav_divider_queues") and self._nav_divider_queues.winfo_exists():
            self._nav_divider_queues.pack(fill="x", padx=10 if collapsed else 18, pady=(8, 4 if collapsed else 0))
            if not collapsed and hasattr(self, "_hdr_queues_frame") and self._hdr_queues_frame.winfo_exists():
                self._hdr_queues_frame.pack(fill="x", padx=18, pady=(8, 4))
            for key, item in getattr(self, "queue_nav", {}).items():
                if item.winfo_exists():
                    item.pack(fill="x", padx=px_item, pady=1)

    def _on_search_entry_key(self, event=None):
        if self._syncing_search:
            return
        val = strip_bidi(self.search_entry.get())
        self._syncing_search = True
        try:
            self.search_var.set(val)
        finally:
            self._syncing_search = False
        self._sync_search_clear_btn(val)
        deb_job = getattr(self, "_search_deb_job", None)
        if deb_job is not None:
            try:
                self.after_cancel(deb_job)
            except Exception:
                pass
        self._search_deb_job = self.after(110, self._debounced_search_relayout)

    def _debounced_search_relayout(self):
        self._search_deb_job = None
        self.relayout_grid()

    def _on_search_var_changed(self, *args):
        val = strip_bidi(self.search_var.get())
        if not self._syncing_search and hasattr(self, "search_entry") and self.search_entry.winfo_exists():
            self._syncing_search = True
            try:
                cur_ent = strip_bidi(self.search_entry.get())
                if cur_ent != val:
                    self.search_entry.delete(0, "end")
                    if val:
                        self.search_entry.insert(0, val)
                    else:
                        try:
                            if self.focus_get() != self.search_entry._entry:
                                self.search_entry._activate_placeholder()
                        except Exception:
                            pass
            finally:
                self._syncing_search = False
        self._sync_search_clear_btn(val)
        self.relayout_grid()

    def _sync_search_clear_btn(self, val: str):
        if not hasattr(self, "btn_search_clear") or not self.btn_search_clear.winfo_exists():
            return
        if val:
            if not self.btn_search_clear.winfo_ismapped():
                self.btn_search_clear.pack(side=s_end(), padx=px_inline(2, 6))
        else:
            if self.btn_search_clear.winfo_ismapped():
                self.btn_search_clear.pack_forget()

    def clear_search(self):
        self.search_var.set("")
        if hasattr(self, "table") and self.table is not None:
            self.table.canvas.focus_set()

    def reset_filters_and_search(self):
        self.active_filter = "cat_all"
        self.search_var.set("")
        self.update_nav()
        self.relayout_grid()

    # ------------------------------------------------------------ UI Construction
    def build_ui(self):
        self.configure(fg_color=col("bg"))
        self.build_topbar()
        self.build_toolbar()
        self.build_statusbar()
        body = ctk.CTkFrame(self, fg_color="transparent")
        body.pack(fill="both", expand=True)
        self.build_sidebar(body)
        self.build_content(body)
        self.build_context_menu()
        self.update_nav()
        self.after(60, lambda: self._apply_responsive_layout(force=True))

    def build_topbar(self):
        bar = ctk.CTkFrame(self, height=60, corner_radius=0, fg_color=col("header"))
        bar.pack(fill="x")
        bar.pack_propagate(False)
        side_st = s_start()
        side_en = s_end()

        self.btn_sidebar = IconButton(
            bar, "list", "", self.toggle_sidebar, style="ghost",
            tooltip=t("u_toggle_sidebar"), padx=10, pady=8,
        )
        self.btn_sidebar.pack(side=side_st, padx=px_inline(14, 4), pady=11)

        logo = ctk.CTkFrame(bar, width=36, height=36, corner_radius=10, fg_color=col("primary"))
        logo.pack(side=side_st, padx=px_inline(4, 10), pady=12)
        logo.pack_propagate(False)
        ctk.CTkLabel(logo, text=ico("bolt"), font=ifont(15), text_color="#ffffff").place(relx=.5, rely=.5, anchor="center")
        self.lbl_brand_title = ctk.CTkLabel(bar, text=t("app_title"), font=uifont(14, "bold"), text_color=col("text"))
        self.lbl_brand_title.pack(side=side_st)

        # End-side utility controls
        self.btn_theme = IconButton(
            bar, "sun" if ctk.get_appearance_mode() == "Dark" else "moon", "", self.quick_theme,
            style="soft", tooltip=t("u_theme"), padx=10, pady=8,
        )
        self.btn_theme.pack(side=side_en, padx=px_inline(3, 18), pady=11)

        lang_tag = "EN" if E.LANG == "ar" else "عربي"
        IconButton(
            bar, "language", lang_tag, self.quick_language, style="soft",
            tooltip=t("u_lang"), text_size=11, padx=10, pady=8,
        ).pack(side=side_en, padx=3, pady=11)

        IconButton(
            bar, "keyboard", "", self.show_shortcuts, style="ghost",
            tooltip=lambda: f"{t('tip_shortcuts')} (F1)", padx=10, pady=8,
        ).pack(side=side_en, padx=2, pady=11)

        ctk.CTkFrame(bar, width=1, height=24, fg_color=col("border_light")).pack(side=side_en, padx=7, pady=18)

        self.btn_bridge_top = IconButton(
            bar, "puzzle", "", self.show_browser_bridge, style="ghost",
            icon_color="accent_cyan" if (self.bridge_server and self.bridge_server.is_running) else "text_muted",
            tooltip=t("tip_browser"), padx=10, pady=8,
        )
        self.btn_bridge_top.pack(side=side_en, padx=2, pady=11)

        IconButton(
            bar, "exchange", "", self.show_export_import, style="ghost",
            tooltip=lambda: f"{t('tip_exp_imp')} (Ctrl+Shift+E)", padx=10, pady=8,
        ).pack(side=side_en, padx=2, pady=11)

        IconButton(
            bar, "chart-pie", "", self.show_analytics, style="ghost",
            icon_color="primary_text", tooltip=t("tip_stats"), padx=10, pady=8,
        ).pack(side=side_en, padx=2, pady=11)

        # Accessible Search Box with live placeholder + 1-click Clear button
        self.search_frame = ctk.CTkFrame(
            bar, corner_radius=11, fg_color=col("input"),
            border_width=1, border_color=col("border"), height=38,
        )
        self.search_frame.pack(side=side_st, padx=px_inline(22, 12), pady=11)
        ctk.CTkLabel(
            self.search_frame, text=ico("search"), font=ifont(13),
            text_color=col("text_muted"), width=22,
        ).pack(side=side_st, padx=px_inline(10, 2))

        self.btn_search_clear = ctk.CTkButton(
            self.search_frame, text=ico("xmark"), font=ifont(11),
            width=24, height=24, corner_radius=6,
            fg_color="transparent", hover_color=col("row_hover"),
            text_color=col("text_muted"), command=self.clear_search,
        )
        Tooltip(self.btn_search_clear, t("u_clear_search"))

        ph_txt = bidi(f"{t('u_search_ph')}  (Ctrl+F)")
        self.search_entry = ctk.CTkEntry(
            self.search_frame, width=270, height=32, border_width=0,
            fg_color="transparent", text_color=col("text"),
            placeholder_text=ph_txt, placeholder_text_color=col("text_muted"),
            font=uifont(12), justify=j_start(),
        )
        self.search_entry.pack(side=side_st, padx=px_inline(2, 6))
        self.search_entry.bind("<KeyRelease>", self._on_search_entry_key)
        self.search_entry._entry.bind(
            "<FocusIn>", lambda e: self.search_frame.configure(border_width=2, border_color=col("focus_ring")), "+",
        )
        self.search_entry._entry.bind(
            "<FocusOut>", lambda e: self.search_frame.configure(border_width=1, border_color=col("border")), "+",
        )
        if self.search_var.get():
            self.search_entry.insert(0, strip_bidi(self.search_var.get()))
            self._sync_search_clear_btn(self.search_var.get())
        Tooltip(self.search_frame, t("tip_search"))

        ctk.CTkFrame(self, height=1, fg_color=col("border_light")).pack(fill="x")

    def build_toolbar(self):
        """RTL/LTR mirrored action toolbar with automatic compact responsive mode."""
        tb_outer = ctk.CTkFrame(self, height=56, corner_radius=0, fg_color=col("card"))
        tb_outer.pack(fill="x")
        tb_outer.pack_propagate(False)
        tb = ctk.CTkFrame(tb_outer, fg_color="transparent")
        tb.pack(fill="both", expand=True, padx=16, pady=8)
        self.tb = {}
        side_st = s_start()
        side_en = s_end()

        def sep(side=side_st):
            ctk.CTkFrame(tb, width=1, height=24, fg_color=col("border_light")).pack(side=side, padx=7, pady=7)

        def add(key, icon, label, tip, shortcut, cmd, style="ghost", icon_color=None, side=side_st, padx=11):
            b = IconButton(
                tb, icon, label, cmd, style=style, vertical=False, icon_color=icon_color, icon_size=14,
                tooltip=lambda: f"{t(tip)}  ({shortcut})" if shortcut else t(tip),
                text_size=11, padx=padx, pady=7,
            )
            b.pack(side=side, padx=3)
            self.tb[key] = b

        lbl_vid = "فيديو" if E.LANG == "ar" else "Video"
        lbl_spd = "الروابط" if E.LANG == "ar" else "Grabber"
        lbl_bat = "دفعات" if E.LANG == "ar" else "Batch"
        add("add", "plus", t("u_add"), "tip_add", "Ctrl+N", self.show_add_dialog, style="primary", padx=13)
        add("video", "film", lbl_vid, "tip_video", "Ctrl+Y", self.show_media_dialog, style="soft", icon_color="danger", padx=10)
        add("spider", "globe", lbl_spd, "tip_spider", "Ctrl+G", self.show_spider_dialog, style="soft", icon_color="accent_cyan", padx=10)
        add("batch", "list", lbl_bat, "tip_batch", "Ctrl+B", self.show_batch_dialog, style="soft", padx=10)
        sep(side_st)

        add("resume", "play", t("u_resume"), "tip_resume", "Space", self.act_resume, style="ghost", icon_color="success", padx=10)
        add("pause", "pause", t("u_pause"), "tip_pause", "Space", self.act_pause, style="ghost", icon_color="warning", padx=10)
        add("resume_all", "forward", "", "tip_resume_all", "", self.act_resume_all, style="ghost", icon_color="accent_cyan", padx=10)
        add("stop_all", "stop", "", "tip_stop_all", "", self.act_stop_all, style="ghost", icon_color="danger", padx=10)
        add("delete", "trash", "", "tip_delete", "Delete", self.act_remove, style="danger", padx=10)

        add("options", "gear", t("u_options"), "tip_options", "Ctrl+,", self.show_options, style="soft", side=side_en, padx=12)
        add("sched", "clock", "", "tip_scheduler", "Ctrl+T", self.show_scheduler, style="ghost", side=side_en, padx=10)
        add("limit", "gauge", "", "tip_limiter", "Ctrl+L", self.show_limiter, style="ghost", side=side_en, padx=10)
        add("basket", "layers", "", "tip_basket", "F9", lambda: self.toggle_drop_basket(), style="ghost", side=side_en, padx=10)

        ctk.CTkFrame(self, height=1, fg_color=col("border_light")).pack(fill="x")

    def build_statusbar(self):
        sb_wrap = ctk.CTkFrame(self, height=34, corner_radius=0, fg_color=col("header"))
        sb_wrap.pack(fill="x", side="bottom")
        sb_wrap.pack_propagate(False)
        ctk.CTkFrame(sb_wrap, height=1, fg_color=col("border_light")).pack(fill="x", side="top")
        sb = ctk.CTkFrame(sb_wrap, fg_color="transparent")
        sb.pack(fill="both", expand=True, padx=18)
        side_st = s_start()
        side_en = s_end()

        ctk.CTkLabel(sb, text=ico("gauge"), font=ifont(12), text_color=col("accent_cyan")).pack(side=side_st, padx=px_inline(0, 6))
        self.lbl_speed = ctk.CTkLabel(sb, text="0 B/s", font=uifont(11, "bold"), text_color=col("accent_cyan"))
        self.lbl_speed.pack(side=side_st)
        self.speed_sparkline = SpeedSparkline(sb, width=96, height=20)
        self.speed_sparkline.pack(side=side_st, padx=px_inline(8, 14))
        self.lbl_count = ctk.CTkLabel(sb, text="", font=uifont(11), text_color=col("text_muted"))
        self.lbl_count.pack(side=side_st, padx=16)
        self.lbl_sched = ctk.CTkLabel(sb, text="", font=uifont(11, "bold"), text_color=col("warning"))
        self.lbl_sched.pack(side=side_st)
        self.lbl_limit = ctk.CTkLabel(sb, text="", font=uifont(11), text_color=col("text_muted"))
        self.lbl_limit.pack(side=side_st, padx=10)
        self.lbl_quota = ctk.CTkLabel(sb, text="", font=uifont(11, "bold"), text_color=col("accent_cyan"))
        self.lbl_quota.pack(side=side_st, padx=8)
        self.lbl_proxy = ctk.CTkLabel(sb, text="", font=uifont(11), text_color=col("text_muted"))
        self.lbl_proxy.pack(side=side_st, padx=8)

        ctk.CTkLabel(sb, text=bidi(f"F1  {t('u_shortcuts')}"), font=uifont(11), text_color=col("text_muted")).pack(side=side_en)
        self.lbl_sel = ctk.CTkLabel(sb, text="", font=uifont(11, "bold"), text_color=col("primary_text"))
        self.lbl_sel.pack(side=side_en, padx=12)

    def build_sidebar(self, body):
        """
        RTL/LTR mirrored sidebar with collapsible icon-rail mode.
        Packs bottom Quick-Tools card FIRST (side='bottom') so Analytics, Import/Export,
        and Browser Extension buttons are NEVER clipped at any DPI or window height.
        """
        side = ctk.CTkFrame(body, width=240, corner_radius=0, fg_color=col("sidebar"))
        side.pack(side=s_start(), fill="y")
        side.pack_propagate(False)
        self.sidebar_frame = side
        self.sidebar_sep = ctk.CTkFrame(body, width=1, fg_color=col("border_light"))
        self.sidebar_sep.pack(side=s_start(), fill="y")
        self.nav = {}

        # 1. Pack Bottom Quick-Tools Strip FIRST so its height is guaranteed at all resolutions
        self.qstrip = ctk.CTkFrame(side, corner_radius=12, fg_color=col("card"), border_width=1, border_color=col("border_light"))
        self.qstrip.pack(side="bottom", fill="x", padx=10, pady=(6, 10))
        q_in = ctk.CTkFrame(self.qstrip, fg_color="transparent")
        q_in.pack(fill="x", padx=5, pady=5)

        btn_stats = IconButton(
            q_in, "chart-pie", t("u_stats"), self.show_analytics, style="ghost",
            icon_color="primary_text", tooltip=t("tip_stats"), text_size=11, padx=9, pady=5,
        )
        btn_stats.pack(fill="x", pady=1)

        btn_ei = IconButton(
            q_in, "exchange", t("u_exp_imp"), self.show_export_import, style="ghost",
            icon_color="warning", tooltip=t("tip_exp_imp"), text_size=11, padx=9, pady=5,
        )
        btn_ei.pack(fill="x", pady=1)

        self.btn_bridge_side = IconButton(
            q_in, "puzzle", t("u_browser"), self.show_browser_bridge, style="ghost",
            icon_color="success" if (self.bridge_server and self.bridge_server.is_running) else "text_muted",
            tooltip=t("tip_browser"), text_size=11, padx=9, pady=5,
        )
        self.btn_bridge_side.pack(fill="x", pady=1)
        self._qstrip_btns = (btn_stats, btn_ei, self.btn_bridge_side)

        # 2. Flexible / Scrollable Navigation Area above Quick-Tools
        self.nav_canvas = tk.Canvas(side, bg=cur("sidebar"), highlightthickness=0, bd=0)
        self.nav_canvas.pack(side="top", fill="both", expand=True)
        self.nav_inner = ctk.CTkFrame(self.nav_canvas, fg_color="transparent")
        self._nav_win_id = self.nav_canvas.create_window((0, 0), window=self.nav_inner, anchor="nw")

        self.nav_canvas.bind(
            "<Configure>",
            lambda e: self.nav_canvas.itemconfigure(self._nav_win_id, width=e.width),
        )
        self.nav_inner.bind(
            "<Configure>",
            lambda e: self.nav_canvas.configure(scrollregion=self.nav_canvas.bbox("all") or (0, 0, 100, 100)),
        )

        def _scroll_sidebar(event):
            bbox = self.nav_canvas.bbox("all")
            if not bbox:
                return
            ch = self.nav_canvas.winfo_height()
            th = bbox[3] - bbox[1]
            if th > ch + 2:
                self.nav_canvas.yview_scroll(-int(event.delta / 120), "units")

        self._hdr_cats = ctk.CTkLabel(
            self.nav_inner, text=bidi(t("cat_title")), anchor=a_start(),
            font=uifont(10, "bold"), text_color=col("text_muted"),
        )
        for key, icon, color, _ in FILTERS:
            item = NavItem(self.nav_inner, icon, t(key), lambda k=key: self.set_filter(k), icon_color=color)
            self.nav[key] = item

        self._nav_divider = ctk.CTkFrame(self.nav_inner, height=1, fg_color=col("border_light"))
        self._hdr_types = ctk.CTkLabel(
            self.nav_inner, text=bidi(t("types_title")), anchor=a_start(),
            font=uifont(10, "bold"), text_color=col("text_muted"),
        )
        for key, icon, color in TYPE_FILTERS:
            item = NavItem(self.nav_inner, icon, t(key), lambda k=key: self.set_filter(k), icon_color=color)
            self.nav[key] = item

        # Queues Section
        self._nav_divider_queues = ctk.CTkFrame(self.nav_inner, height=1, fg_color=col("border_light"))
        self._hdr_queues_frame = ctk.CTkFrame(self.nav_inner, fg_color="transparent")
        self._hdr_queues = ctk.CTkLabel(
            self._hdr_queues_frame, text=bidi(t("cat_queues")), anchor=a_start(),
            font=uifont(10, "bold"), text_color=col("text_muted"),
        )
        self._hdr_queues.pack(side=s_start())
        self._btn_add_queue_hdr = IconButton(
            self._hdr_queues_frame, "plus", "", self.show_new_queue_dialog, style="ghost",
            icon_color="primary_text", tooltip=t("dlg_new_queue"), padx=4, pady=2
        )
        self._btn_add_queue_hdr.pack(side=s_end())

        self.queue_nav = {}
        self._sidebar_headers = (self._hdr_cats, self._hdr_types, self._hdr_queues_frame)
        self.refresh_queue_nav()
        self._repack_sidebar_nav(False)

        for w in iter_ctk_tree(self.nav_inner):
            w.bind("<MouseWheel>", _scroll_sidebar, "+")
        self.nav_canvas.bind("<MouseWheel>", _scroll_sidebar, "+")

    def build_content(self, body):
        area = ctk.CTkFrame(body, fg_color="transparent")
        area.pack(side=s_start(), fill="both", expand=True, padx=16, pady=14)
        self.table = VirtualDownloadTable(area, self)
        self.table.pack(fill="both", expand=True)
        self.scroll = self.table

    def build_context_menu(self):
        m = ModernContextMenu(self, min_width=260)
        self.menu = m
        self.menu_idx = {}

        def item(key, label, cmd, accel="", icon=""):
            m.add_command(label=label, command=cmd, accelerator=accel, icon=icon, key=key)
            self.menu_idx[key] = key

        item("toggle", t("ctx_resume"), self.act_toggle, "Space", "play")
        item("open", t("ctx_open"), self.act_open_file, "Enter", "file")
        item("details", t("ctx_details"), self.act_details, "", "circle-info")
        item("folder", t("ctx_folder"), self.act_folder, "Ctrl+E", "folder-open")
        self.queue_menu = ModernContextMenu(self.menu, min_width=220)
        self.menu.add_cascade(label=t("menu_move_to_queue"), menu=self.queue_menu, icon="layer-group", key="move_queue")
        self.menu_idx["move_queue"] = "move_queue"
        m.add_separator()
        item("redo", t("ctx_redownload"), self.act_redownload, "F5", "rotate-right")
        item("refresh_url", t("ctx_refresh_url"), self.act_refresh_url, "", "link")
        item("checksum", t("ctx_checksum"), self.act_checksum, "", "fingerprint")
        item("av_scan", t("ctx_av_scan"), self.act_av_scan, "", "shield-halved")
        item("extract", t("ctx_extract"), self.act_extract, "", "box-open")
        item("copy", "Copy link" if E.LANG == "en" else "نسخ الرابط", self.act_copy_link, "", "copy")
        m.add_separator()
        item("remove", t("ctx_remove_list"), self.act_remove, "Delete", "xmark")
        item("delfile", t("ctx_delete_file"), self.act_delete_files, "Shift+Del", "trash-can")

    def show_context_menu(self, event):
        tasks = self.sel_tasks()
        one = len(tasks) == 1
        done = bool(tasks) and all(x.is_completed for x in tasks)
        running = any(x.state == "active" for x in tasks)
        idx = self.menu_idx

        def st(key, ok):
            self.menu.entryconfigure(idx[key], state="normal" if ok else "disabled")

        toggle_label = t("ctx_pause") if running else t("ctx_resume")
        toggle_icon = "pause" if running else "play"
        self.menu.entryconfigure(idx["toggle"], label=toggle_label, icon=toggle_icon)

        st("toggle", bool(tasks) and not done)
        st("open", one and done)
        st("details", one)
        st("folder", one)
        # Populate Queue submenu
        self.queue_menu.delete(0, "end")
        queues = self.get_all_queues()
        cur_qids = {getattr(t, "queue_id", "main") for t in tasks}
        for q in queues:
            qid = q.get("id", "main")
            qname = q.get("name", t("queue_main"))
            prefix = "✔  " if (len(cur_qids) == 1 and qid in cur_qids) else "    "
            self.queue_menu.add_command(
                label=f"{prefix}{qname}",
                command=lambda target_qid=qid: self.move_tasks_to_queue(tasks, target_qid),
                icon="layer-group"
            )
        self.queue_menu.add_separator()
        self.queue_menu.add_command(
            label="+ " + t("dlg_new_queue"),
            command=self.show_new_queue_dialog,
            icon="plus"
        )
        st("move_queue", bool(tasks))
        st("redo", bool(tasks))
        st("refresh_url", one and not done)
        st("checksum", one and done)
        st("av_scan", one and done)
        st("extract", one and done and is_extractable_archive(tasks[0].filename))
        st("copy", bool(tasks))
        st("remove", bool(tasks))
        st("delfile", bool(tasks))
        try:
            self.menu.tk_popup(event.x_root, event.y_root)
        finally:
            self.menu.grab_release()

    # ------------------------------------------------------------ hotkeys
    def bind_hotkeys(self):
        def hk(seqs, fn, in_entry=False):
            for seq in ([seqs] if isinstance(seqs, str) else seqs):
                self.bind_all(seq, self._wrap_hotkey(fn, in_entry))

        hk(["<Control-n>", "<Control-N>"], self.show_add_dialog)
        hk(["<Control-v>", "<Control-V>"], self.show_add_dialog)
        hk(["<Control-c>", "<Control-C>"], self.act_copy_link)
        hk(["<Control-y>", "<Control-Y>"], self.show_media_dialog, in_entry=True)
        hk(["<Control-g>", "<Control-G>"], self.show_spider_dialog, in_entry=True)
        hk(["<Control-b>", "<Control-B>"], self.show_batch_dialog, in_entry=True)
        hk(["<Control-q>", "<Control-Q>"], self.show_queue_manager, in_entry=True)
        hk(["<Control-i>", "<Control-I>", "<Control-h>", "<Control-H>"], self.show_analytics, in_entry=True)
        hk(["<Control-Shift-E>", "<Control-Shift-e>"], self.show_export_import, in_entry=True)
        hk(["<Control-r>", "<Control-R>"], self.act_refresh_url, in_entry=True)
        hk(["<Control-Shift-P>", "<Control-Shift-p>"], self.show_proxy_manager, in_entry=True)
        hk(["<Control-Shift-K>", "<Control-Shift-k>"], self.show_site_vault, in_entry=True)
        hk(["<Control-Shift-W>", "<Control-Shift-w>"], self.show_web_remote, in_entry=True)
        hk(["<Control-Shift-A>", "<Control-Shift-a>"], self.show_post_download_dialog, in_entry=True)
        hk("<space>", self.act_toggle)
        hk("<Return>", self.act_open_or_details)
        hk("<KP_Enter>", self.act_open_or_details)
        hk("<Delete>", self.act_remove)
        hk("<Shift-Delete>", self.act_delete_files)
        hk(["<Control-a>", "<Control-A>"], self.select_all)
        hk("<Up>", lambda: self.move_selection(-1))
        hk("<Down>", lambda: self.move_selection(1))
        hk("<Home>", lambda: self.move_selection(-9999))
        hk("<End>", lambda: self.move_selection(9999))
        hk(["<Control-k>", "<Control-K>"], self.show_command_palette, in_entry=True)
        hk(["<Control-f>", "<Control-F>"], self.focus_search, in_entry=True)
        hk("<Escape>", self.on_escape, in_entry=True)
        hk(["<Control-e>", "<Control-E>"], self.act_folder)
        hk(["<Control-l>", "<Control-L>"], self.show_limiter, in_entry=True)
        hk(["<Control-t>", "<Control-T>"], self.show_scheduler, in_entry=True)
        hk("<Control-comma>", self.show_options, in_entry=True)
        hk("<F5>", self.act_redownload, in_entry=True)
        hk("<F9>", lambda: self.toggle_drop_basket(), in_entry=True)
        hk("<F1>", self.show_shortcuts, in_entry=True)
        for i, (key, *_rest) in enumerate(FILTERS, start=1):
            hk(f"<Control-Key-{i}>", lambda k=key: self.set_filter(k), in_entry=True)

        # Global input accelerators & universal context menu bindings (works across all languages & layouts)
        self.bind_all("<Key>", self._on_global_key)
        self.bind_class("Entry", "<Button-3>", self.show_text_context_menu)
        self.bind_class("Text", "<Button-3>", self.show_text_context_menu)

    def _on_global_key(self, event):
        if not (event.state & 4):
            return None
        kc = event.keycode
        w = event.widget
        try:
            wcls = w.winfo_class()
        except Exception:
            return None

        is_text = wcls in ("Entry", "Text", "TEntry", "Spinbox")

        if is_text:
            if kc == 65:  # VK_A (Ctrl+A in English & Arabic layouts)
                try:
                    if wcls == "Entry":
                        w.select_range(0, "end")
                        w.icursor("end")
                    elif wcls == "Text":
                        w.tag_add("sel", "1.0", "end")
                except Exception:
                    pass
                return "break"
            elif kc == 67:  # VK_C (Ctrl+C)
                try:
                    w.event_generate("<<Copy>>")
                except Exception:
                    pass
                return "break"
            elif kc == 86:  # VK_V (Ctrl+V)
                try:
                    w.event_generate("<<Paste>>")
                except Exception:
                    pass
                return "break"
            elif kc == 88:  # VK_X (Ctrl+X)
                try:
                    w.event_generate("<<Cut>>")
                except Exception:
                    pass
                return "break"
            elif kc == 90:  # VK_Z (Ctrl+Z)
                try:
                    w.event_generate("<<Undo>>")
                except Exception:
                    pass
                return "break"
        else:
            if kc == 67:  # VK_C (Ctrl+C on selected downloads)
                if getattr(self, "selected", None):
                    self.act_copy_link()
                    return "break"
            elif kc == 86:  # VK_V (Ctrl+V on main window)
                self.show_add_dialog()
                return "break"
            elif kc == 65:  # VK_A (Ctrl+A on main window)
                self.select_all()
                return "break"
            elif kc == 70:  # VK_F (Ctrl+F)
                self.focus_search()
                return "break"
        return None

    def show_text_context_menu(self, event):
        w = event.widget
        try:
            wcls = w.winfo_class()
        except Exception:
            return
        if wcls not in ("Entry", "Text", "TEntry"):
            return

        try:
            w.focus_set()
        except Exception:
            pass

        menu = getattr(self, "_text_ctx_menu", None)
        if menu is None:
            menu = tk.Menu(
                self, tearoff=0, bd=1, relief="solid", font=(UI_FONT, 10),
                bg=cur("card"), fg=cur("text"),
                activebackground=cur("primary"), activeforeground="#ffffff",
                disabledforeground=cur("text_muted"),
            )
            self._text_ctx_menu = menu

        menu.delete(0, "end")
        has_selection = False
        has_content = False
        can_paste = False
        is_readonly = False

        try:
            is_readonly = str(w.cget("state")) in ("disabled", "readonly")
        except Exception:
            pass

        if wcls == "Entry":
            try:
                has_selection = w.selection_present()
            except Exception:
                has_selection = False
            try:
                has_content = bool(w.get())
            except Exception:
                has_content = False
        elif wcls == "Text":
            try:
                has_selection = bool(w.tag_ranges("sel"))
            except Exception:
                has_selection = False
            try:
                has_content = bool(w.get("1.0", "end-1c").strip())
            except Exception:
                has_content = False

        try:
            clip = w.clipboard_get()
            can_paste = bool(clip)
        except Exception:
            can_paste = False

        def do_cut():
            try:
                w.event_generate("<<Cut>>")
            except Exception:
                pass

        def do_copy():
            try:
                w.event_generate("<<Copy>>")
            except Exception:
                pass

        def do_paste():
            try:
                w.event_generate("<<Paste>>")
            except Exception:
                pass

        def do_delete():
            try:
                if wcls == "Entry" and w.selection_present():
                    w.delete("sel.first", "sel.last")
                elif wcls == "Text" and w.tag_ranges("sel"):
                    w.delete("sel.first", "sel.last")
            except Exception:
                pass

        def do_select_all():
            try:
                if wcls == "Entry":
                    w.select_range(0, "end")
                    w.icursor("end")
                elif wcls == "Text":
                    w.tag_add("sel", "1.0", "end")
            except Exception:
                pass

        menu.add_command(
            label=bidi(t("ctx_cut")), accelerator="Ctrl+X", command=do_cut,
            state="normal" if (has_selection and not is_readonly) else "disabled",
        )
        menu.add_command(
            label=bidi(t("ctx_copy")), accelerator="Ctrl+C", command=do_copy,
            state="normal" if has_selection else "disabled",
        )
        menu.add_command(
            label=bidi(t("ctx_paste")), accelerator="Ctrl+V", command=do_paste,
            state="normal" if (can_paste and not is_readonly) else "disabled",
        )
        menu.add_command(
            label=bidi(t("ctx_delete")), accelerator="Del", command=do_delete,
            state="normal" if (has_selection and not is_readonly) else "disabled",
        )
        menu.add_separator()
        menu.add_command(
            label=bidi(t("ctx_select_all")), accelerator="Ctrl+A", command=do_select_all,
            state="normal" if has_content else "disabled",
        )

        try:
            menu.tk_popup(event.x_root, event.y_root)
        finally:
            menu.grab_release()

    def _wrap_hotkey(self, fn, in_entry):
        def handler(event):
            try:
                if event.widget.winfo_toplevel() is not self:
                    return None
                wcls = event.widget.winfo_class()
                typing = wcls in ("Entry", "Text", "TEntry", "Spinbox", "TCombobox")
                if not typing and fn in (self.act_toggle, self.act_open_or_details):
                    # Let focused buttons/nav items handle their own keyboard Space/Enter activation!
                    cur_f = self.focus_get()
                    if cur_f is not None and cur_f is not self and cur_f is not self.table.canvas:
                        return None
            except Exception:
                return None
            if typing and not in_entry:
                return None
            fn()
            return "break"
        return handler

    def focus_search(self):
        self.search_entry.focus_set()
        self.search_entry._entry.select_range(0, "end")

    def on_escape(self):
        if strip_bidi(self.search_var.get()):
            self.clear_search()
        else:
            self.clear_selection()
            if hasattr(self, "table") and self.table is not None:
                self.table.canvas.focus_set()

    # ------------------------------------------------------------ selection
    def visible_rows(self):
        return [it["row"] for it in reversed(self.tasks) if self.matches(it["task"])]

    def sel_tasks(self):
        return [r.task for r in self.selected]

    def select_row(self, row, ctrl=False, shift=False):
        rows = self.visible_rows()
        if shift and self.anchor in rows and row in rows:
            a, b = rows.index(self.anchor), rows.index(row)
            new = rows[min(a, b): max(a, b) + 1]
            if not ctrl:
                for r in self.selected:
                    if r not in new:
                        r.set_selected(False)
                self.selected = []
            for r in new:
                if r not in self.selected:
                    self.selected.append(r)
                    r.set_selected(True)
            return
        if ctrl:
            if row in self.selected:
                self.selected.remove(row)
                row.set_selected(False)
            else:
                self.selected.append(row)
                row.set_selected(True)
            self.anchor = row
            return
        for r in self.selected:
            r.set_selected(False)
        self.selected = [row]
        row.set_selected(True)
        self.anchor = row

    def clear_selection(self):
        for r in self.selected:
            try:
                r.set_selected(False)
            except Exception:
                pass
        self.selected = []

    def select_all(self):
        self.clear_selection()
        for r in self.visible_rows():
            r.set_selected(True)
            self.selected.append(r)
        if self.selected:
            self.anchor = self.selected[0]

    def move_selection(self, delta):
        rows = self.visible_rows()
        if not rows:
            return
        if self.selected and self.anchor in rows:
            cur_i = rows.index(self.selected[-1] if len(self.selected) == 1 else self.anchor)
        else:
            cur_i = -1 if delta > 0 else len(rows)
        new_i = max(0, min(len(rows) - 1, cur_i + delta))
        self.select_row(rows[new_i])
        self.ensure_visible(rows[new_i])

    def ensure_visible(self, row):
        if hasattr(self, "table") and self.table is not None:
            self.table.ensure_row_visible(row)

    # ------------------------------------------------------------ filters
    def matches(self, task):
        q = strip_bidi(self.search_var.get()).strip().lower()
        if q and q not in task.filename.lower() and q not in task.url.lower():
            return False
        f = self.active_filter
        st = task.state
        if f == "cat_all":
            return True
        if f == "cat_active":
            return st in ("active", "queued")
        if f == "cat_completed":
            return st == "completed"
        if f == "cat_paused":
            return st == "paused"
        if f == "cat_failed":
            return st == "failed"
        if f.startswith("queue_"):
            target_qid = f[6:]
            return getattr(task, "queue_id", "main") == target_qid
        return detect_category(task.filename) == f

    def set_filter(self, key):
        self.active_filter = key
        self.update_nav()
        self.relayout_grid()

    def update_nav(self):
        counts = {k: 0 for k in self.nav}
        q_counts = {k: 0 for k in getattr(self, "queue_nav", {})}
        for it in self.tasks:
            task = it["task"]
            st = task.state
            counts["cat_all"] += 1
            if st in ("active", "queued"):
                counts["cat_active"] += 1
            elif st == "completed":
                counts["cat_completed"] += 1
            elif st == "paused":
                counts["cat_paused"] += 1
            elif st == "failed":
                counts["cat_failed"] += 1
            cat = it.get("_cat")
            if cat is None:
                cat = detect_category(task.filename)
                it["_cat"] = cat
            if cat in counts:
                counts[cat] += 1
            qid = getattr(task, "queue_id", "main")
            qk = f"queue_{qid}"
            if qk in q_counts:
                q_counts[qk] += 1
        for key, item in self.nav.items():
            item.set_active(key == self.active_filter)
            item.set_count(counts.get(key, 0))
        for key, item in getattr(self, "queue_nav", {}).items():
            item.set_active(key == self.active_filter)
            item.set_count(q_counts.get(key, 0))

    def relayout_grid(self):
        for it in self.tasks:
            it["row"].visible = False
        rows = self.visible_rows()
        vis_set = set(rows)
        for r in rows:
            r.visible = True
        for r in list(self.selected):
            if r not in vis_set:
                r.set_selected(False)
                self.selected.remove(r)
        if hasattr(self, "table") and self.table is not None:
            self.table.set_rows(rows)
        self.update_nav()

    # ------------------------------------------------------------ task actions
    def toast(self, title, body="", accent="primary", icon="info", category="NegmLoading",
              action_label=None, on_click=None, duration=5000):
        # Native Windows Notifications only - per user requirement (no floating CTk toplevels)
        self.toasts = []
        try:
            clean_title = strip_bidi(title) if title else "Negm Lodaing"
            clean_body = strip_bidi(body) if body else ""
            sound = bool(self.settings.get("sound", True)) if hasattr(self, "settings") else True
            send_windows_toast(
                title=clean_title,
                message=clean_body,
                attribution=category or "Negm Lodaing",
                sound=sound,
            )
        except Exception as e:
            pass

    def on_toast_closed(self, closed_toast):
        self.toasts = []

    def get_active_proxy(self) -> str:
        if self.settings.get("proxy_enabled", False):
            return (self.settings.get("proxy_url", "") or "").strip()
        return ""

    def _sync_quota_date(self):
        today = datetime.date.today().isoformat()
        if self.settings.get("quota_date") != today:
            self.settings["quota_date"] = today
            self.settings["quota_used_bytes"] = 0
            self._quota_exceeded_notified = False

    def get_all_queues(self):
        queues = self.settings.get("queues")
        if not queues or not isinstance(queues, list):
            queues = [{
                "id": "main",
                "name": t("queue_main"),
                "max_parallel": int(self.settings.get("max_concurrent", 3)),
                "folder": "",
                "schedule_start": "",
                "schedule_stop": "",
                "enabled": True,
            }]
            self.settings["queues"] = queues
            self.save_state()
        return queues

    def save_queue_item(self, data):
        queues = self.get_all_queues()
        found = False
        for idx, q in enumerate(queues):
            if q.get("id") == data["id"]:
                queues[idx] = data
                found = True
                break
        if not found:
            queues.append(data)
        self.settings["queues"] = queues
        self.save_state()
        self.refresh_queue_nav()
        self.toast(t("queue_updated"), data.get("name", ""), "success", "layer-group")

    def delete_queue_item(self, qid):
        if qid == "main":
            return
        queues = [q for q in self.get_all_queues() if q.get("id") != qid]
        self.settings["queues"] = queues
        self.save_state()
        # Move all tasks in this queue to main queue
        affected = 0
        for it in self.tasks:
            if getattr(it["task"], "queue_id", "main") == qid:
                it["task"].queue_id = "main"
                affected += 1
        if affected > 0:
            self.save_state()
        if self.active_filter == f"queue_{qid}":
            self.active_filter = "cat_all"
        self.refresh_queue_nav()
        self.relayout_grid()
        self.toast(t("queue_deleted"), f"{affected} {t('u_downloads')}", "warning", "trash")

    def move_tasks_to_queue(self, tasks, target_qid):
        if not tasks:
            return
        for t_obj in tasks:
            t_obj.queue_id = target_qid
        self.save_state()
        self.update_nav()
        self.relayout_grid()
        # Find queue name
        qname = target_qid
        for q in self.get_all_queues():
            if q.get("id") == target_qid:
                qname = q.get("name", target_qid)
                break
        self.toast(t("queue_updated"), f"{len(tasks)} {t('u_downloads')} ➔ {qname}", "success", "layer-group")

    def show_queue_manager(self):
        from ui_dialogs import QueueManagerDialog
        QueueManagerDialog(self)

    def show_new_queue_dialog(self):
        from ui_dialogs import QueueEditDialog
        QueueEditDialog(self, None, on_saved=lambda _: self.refresh_queue_nav())

    def refresh_queue_nav(self):
        if not hasattr(self, "queue_nav") or not hasattr(self, "nav_inner"):
            return
        for item in list(self.queue_nav.values()):
            try:
                item.destroy()
            except Exception:
                pass
        self.queue_nav.clear()
        queues = self.get_all_queues()
        for q in queues:
            qid = q.get("id", "main")
            qname = q.get("name", t("queue_main"))
            k = f"queue_{qid}"
            item = NavItem(self.nav_inner, "layer-group", qname, lambda key=k: self.set_filter(key), icon_color="primary_text")
            self.queue_nav[k] = item
        collapsed = getattr(self, "sidebar_collapsed", False)
        self._repack_sidebar_nav(collapsed)
        self.update_nav()

    def is_quota_exceeded(self):
        self._sync_quota_date()
        q_mb = int(self.settings.get("daily_quota_mb", 0) or 0)
        if q_mb <= 0:
            return False
        return int(self.settings.get("quota_used_bytes", 0) or 0) >= (q_mb * 1024 * 1024)

    def reset_daily_quota(self):
        self.settings["quota_date"] = datetime.date.today().isoformat()
        self.settings["quota_used_bytes"] = 0
        self._quota_exceeded_notified = False
        self._last_quota_txt = None
        self.save_state()
        self.toast(t("quota_reset_done"), "", accent="cyan", icon="check", category=t("quota_cat"))

    def apply_network_settings(self):
        proxy = self.get_active_proxy()
        for it in self.tasks:
            it["task"].set_proxy(proxy)
        if not self.is_quota_exceeded():
            self._quota_exceeded_notified = False
        self._last_quota_txt = None
        self._last_proxy_txt = None
        self.save_state()

    def show_add_dialog(self, url=None, extra_headers=None, suggested_name=""):
        if self.add_dialog is not None and self.add_dialog.winfo_exists():
            if url:
                self.add_dialog.url_var.set(url)
                if extra_headers:
                    self.add_dialog.extra_headers = dict(extra_headers)
                if suggested_name:
                    self.add_dialog._name_touched = True
                    self.add_dialog.name_var.set(suggested_name)
            self.add_dialog.focus_force()
            return
        if url is None:
            url = ""
            try:
                clip = self.clipboard_get().strip()
                m = URL_REGEX.search(clip)
                if m:
                    url = m.group(0)
            except Exception:
                pass
        self.add_dialog = AddDownloadDialog(
            self, default_url=url, on_submit=self.add_task,
            extra_headers=extra_headers, suggested_name=suggested_name,
        )

    def show_batch_dialog(self):
        BatchDownloadDialog(self)

    def show_analytics(self):
        if self.analytics_dialog is not None and self.analytics_dialog.winfo_exists():
            self.analytics_dialog.lift()
            self.analytics_dialog.focus_force()
            return
        self.analytics_dialog = AnalyticsDialog(self)

    def show_export_import(self):
        ExportImportDialog(self)

    def show_browser_bridge(self):
        BrowserBridgeDialog(self)

    def show_proxy_manager(self):
        ProxyManagerDialog(self)

    def show_site_vault(self):
        SiteCredentialsDialog(self)

    def show_web_remote(self):
        WebRemoteDialog(self)

    def show_post_download_dialog(self):
        PostDownloadDialog(self)

    def start_web_remote(self):
        if self.web_remote_server and self.web_remote_server.is_running:
            return
        p = int(self.settings.get("web_remote_port", 45792))
        tok = str(self.settings.get("web_remote_token", "")).strip()
        lan = bool(self.settings.get("web_remote_allow_lan", True))
        self.web_remote_server = E.WebRemoteServer(self, port=p, token=tok, allow_lan=lan)
        ok = self.web_remote_server.start()
        if ok:
            print(f"Web Remote Server started on {self.web_remote_server.get_access_url()}")

    def stop_web_remote(self):
        if self.web_remote_server:
            self.web_remote_server.stop()
            self.web_remote_server = None

    def restart_web_remote(self):
        self.stop_web_remote()
        if self.settings.get("web_remote_enabled", False):
            self.start_web_remote()

    def pause_task_by_id(self, task_id: str):
        for it in self.tasks:
            t = it.get("task")
            if t and getattr(t, "task_id", "") == task_id:
                self.act_pause_task(it)
                break

    def resume_task_by_id(self, task_id: str):
        for it in self.tasks:
            t = it.get("task")
            if t and getattr(t, "task_id", "") == task_id:
                self.act_resume_task(it)
                break

    def cancel_task_by_id(self, task_id: str):
        for it in self.tasks:
            t = it.get("task")
            if t and getattr(t, "task_id", "") == task_id:
                self.act_delete_task(it, confirm=False)
                break

    def add_download_direct(self, url: str, filename: str = "", chunks: int = 8):
        if not url:
            return
        dest_folder = self.settings.get("folder") or os.path.join(os.path.expanduser("~"), "Downloads")
        if not filename:
            filename = E.suggest_filename(url)
        save_path = os.path.join(dest_folder, filename)
        t_id = hex(int(time.time() * 1000))[2:]
        task = E.DownloadTask(t_id, url, save_path, max_chunks=chunks)
        task.on_finish = lambda ok: self.after(0, lambda: self.finished(task, ok))
        self.tasks.append({"task": task, "state": "active"})
        task.start()
        self.render_all_tasks()

    def set_browser_bridge(self, enabled: bool):
        self.settings["browser_bridge"] = bool(enabled)
        if enabled:
            self.bridge_server.start()
        else:
            self.bridge_server.stop()
        running = bool(self.bridge_server and self.bridge_server.is_running)
        if hasattr(self, "btn_bridge_top") and self.btn_bridge_top.winfo_exists():
            self.btn_bridge_top.set_icon_color("accent_cyan" if running else "text_muted")
        if hasattr(self, "btn_bridge_side") and self.btn_bridge_side.winfo_exists():
            self.btn_bridge_side.set_icon_color("success" if running else "text_muted")
        self.save_state()

    def _on_bridge_payload_thread(self, payload: dict):
        if self.is_closing:
            return
        try:
            self._bridge_queue.put(dict(payload))
        except Exception:
            pass

    def _drain_bridge_queue(self):
        while not self._bridge_queue.empty():
            try:
                p = self._bridge_queue.get_nowait()
            except queue.Empty:
                break
            try:
                self.handle_browser_payload(p)
            except Exception as e:
                print("bridge payload error:", e)

    def handle_browser_payload(self, payload: dict):
        if self.is_closing:
            return
        url = str(payload.get("url") or "").strip()
        if not url.startswith(("http://", "https://")):
            return
        mode = str(payload.get("mode") or "auto").strip().lower()
        hdrs = {}
        ref = str(payload.get("referrer") or payload.get("referer") or "").strip()
        ck = str(payload.get("cookies") or payload.get("cookie") or "").strip()
        ua = str(payload.get("userAgent") or payload.get("user_agent") or "").strip()
        if ref:
            hdrs["Referer"] = ref
        if ck:
            hdrs["Cookie"] = ck
            try:
                dom = extract_domain(url)
                if dom and dom != "unknown" and hasattr(self, "credential_vault"):
                    self.credential_vault.add_credential(dom, auth_type="cookie", cookies=ck, notes="Auto-synced from browser")
            except Exception:
                pass
        if ua:
            hdrs["User-Agent"] = ua

        if mode == "spider":
            self.restore_from_tray()
            self.show_spider_dialog(url)
            return

        if mode == "media" or (mode == "dialog" and is_media_platform_url(url)):
            self.restore_from_tray()
            is_aud = bool(payload.get("audio_only", False))
            sug_title = str(payload.get("title") or "").strip()
            self.show_media_dialog(url, audio_only=is_aud, suggested_title=sug_title)
            return

        raw_fn = str(payload.get("filename") or "").strip()
        sug_name = E.sanitize_filename(raw_fn) if raw_fn else ""
        if mode == "dialog":
            self.restore_from_tray()
            self.show_add_dialog(url, extra_headers=hdrs or None, suggested_name=sug_name)
            return

        fname = sug_name or extract_filename_from_url(url, "download_file.bin")
        save_path = os.path.join(self.settings.get("folder", os.path.expanduser("~")), fname)
        task = self.add_task(url, save_path, start_now=True, silent_toast=True, extra_headers=hdrs or None)
        if task is not None:
            self.toast(
                title=t("br_captured_toast"),
                body=task.filename,
                accent="cyan",
                icon="puzzle",
                category="Browser",
                action_label=t("tray_show"),
                on_click=self.restore_from_tray,
                duration=5500,
            )

    def show_media_dialog(self, url=None, audio_only=False, suggested_title=""):
        if url is None:
            url = ""
            try:
                clip = self.clipboard_get().strip()
                m = URL_REGEX.search(clip)
                if m and is_media_platform_url(m.group(0)):
                    url = m.group(0)
            except Exception:
                pass
        MediaGrabberDialog(self, default_url=url, audio_only=audio_only, suggested_title=suggested_title)

    def show_spider_dialog(self, url=None):
        if url is None:
            url = ""
            try:
                clip = self.clipboard_get().strip()
                m = URL_REGEX.search(clip)
                if m:
                    url = m.group(0)
            except Exception:
                pass
        SiteGrabberDialog(self, default_url=url)

    def add_media_task(self, url, save_path, format_selector="b[ext=mp4]/b",
                       audio_only=False, est_size=0, start_now=True, silent_toast=False, queue_id="main"):
        task = MediaDownloadTask(
            task_id=uuid.uuid4().hex[:8],
            url=url,
            save_path=save_path,
            format_selector=format_selector,
            audio_only=audio_only,
            speed_limit_kb=int(self.settings.get("global_limit_kb", 0)),
            auto_sort=bool(self.settings.get("auto_sort", True)),
            proxy_url=self.get_active_proxy(),
            est_size=est_size,
            queue_id=queue_id or "main",
        )
        task.hold = not start_now
        row = DownloadRow(self.scroll, task, self)
        self.tasks.append({"task": task, "row": row})
        if self.active_filter not in ("cat_all", "cat_active"):
            self.active_filter = "cat_all"
        self.relayout_grid()
        self.select_row(row)
        self.ensure_visible(row)
        if start_now:
            if self.is_quota_exceeded():
                self.toast(t("quota_reached"), task.filename, accent="warning", icon="warning",
                           category=t("quota_cat"), action_label=t("u_options"), on_click=self.show_options)
            else:
                self.process_queue()
        if not silent_toast:
            self.toast(t("vid_added"), task.filename, "success", "film")
        self.save_state()
        return task

    def add_task(self, url, save_path, start_now=True, silent_toast=False, extra_headers=None, max_chunks=None, queue_id="main"):
        if is_media_platform_url(url) and not extra_headers and find_ytdlp_executable():
            return self.add_media_task(url, save_path, start_now=start_now, silent_toast=silent_toast, queue_id=queue_id)
        for it in self.tasks:
            if it["task"].url == url and not it["task"].is_completed:
                if extra_headers and hasattr(it["task"], "extra_headers"):
                    it["task"].extra_headers.update(extra_headers)
                if not silent_toast:
                    self.toast(t("u_dup"), it["task"].filename, "warning", "warning")
                self.select_row(it["row"])
                return None
        n_chunks = int(max_chunks if max_chunks is not None else self.settings.get("default_chunks", 8))
        task = DownloadTask(
            uuid.uuid4().hex[:8], url, save_path,
            max_chunks=n_chunks,
            speed_limit_kb=int(self.settings.get("global_limit_kb", 0)),
            auto_sort=bool(self.settings.get("auto_sort", True)),
            buffer_kb=int(self.settings.get("buffer_kb", 256)),
            proxy_url=self.get_active_proxy(),
            extra_headers=extra_headers,
            queue_id=queue_id or "main",
        )
        task.hold = not start_now
        row = DownloadRow(self.scroll, task, self)
        self.tasks.append({"task": task, "row": row})
        if self.active_filter not in ("cat_all", "cat_active"):
            self.active_filter = "cat_all"
        self.relayout_grid()
        self.select_row(row)
        self.ensure_visible(row)
        if start_now:
            if self.is_quota_exceeded():
                self.toast(t("quota_reached"), task.filename, accent="warning", icon="warning",
                           category=t("quota_cat"), action_label=t("u_options"), on_click=self.show_options)
            else:
                self.process_queue()
        if not silent_toast:
            self.toast(t("u_added"), task.filename, "success", "check")
        self.save_state()
        return task

    def activate(self, task):
        """Resume / start / retry a task depending on its real state."""
        if self.is_quota_exceeded():
            self.toast(t("quota_reached"), task.filename, accent="warning", icon="warning",
                       category=t("quota_cat"), action_label=t("u_options"), on_click=self.show_options)
            return
        st = task.state
        if st == "paused":
            if task.chunks:
                task.resume()
            else:
                task.is_paused = False
                task.started = False
                task.start()
        elif st == "queued":
            task.hold = False
            task.start()
        elif st == "failed":
            task._notified = False
            task.retry()

    def toggle_task(self, task):
        if task.state == "active":
            task.pause()
        elif task.state in ("paused", "queued", "failed"):
            self.activate(task)
        self.save_state()

    def act_toggle(self):
        tasks = [x for x in self.sel_tasks() if not x.is_completed]
        if not tasks:
            return
        if any(x.state == "active" for x in tasks):
            for x in tasks:
                if x.state == "active":
                    x.pause()
        else:
            for x in tasks:
                self.activate(x)
        self.save_state()

    def act_resume(self):
        for x in self.sel_tasks():
            if x.state in ("paused", "queued", "failed"):
                self.activate(x)
        self.save_state()

    def act_pause(self):
        for x in self.sel_tasks():
            if x.state == "active":
                x.pause()
        self.save_state()

    def act_stop_all(self):
        for it in self.tasks:
            if it["task"].state == "active":
                it["task"].pause()
        self.save_state()

    def act_resume_all(self):
        for it in self.tasks:
            if it["task"].state in ("paused", "queued", "failed"):
                self.activate(it["task"])
        self.save_state()

    def _remove_rows(self, rows):
        for r in rows:
            if not r.task.is_completed:
                r.task.cancel()
            self.tasks = [it for it in self.tasks if it["row"] is not r]
            if r in self.selected:
                self.selected.remove(r)
            r.destroy()
        self.relayout_grid()
        self.save_state()

    def act_remove(self):
        rows = list(self.selected)
        if not rows:
            return
        if any(r.task.state == "active" for r in rows):
            if not mb.askyesno(strip_bidi(t("app_title")), strip_bidi(t("u_confirm_remove_active")), parent=self):
                return
        self._remove_rows(rows)

    def act_delete_files(self):
        rows = list(self.selected)
        if not rows:
            return
        if not mb.askyesno(strip_bidi(t("app_title")), strip_bidi(t("u_confirm_delete_file")), icon="warning", parent=self):
            return
        paths = [r.task.save_path for r in rows if r.task.is_completed]
        self._remove_rows(rows)
        for p in paths:
            try:
                if os.path.exists(p):
                    os.remove(p)
            except Exception:
                pass

    def act_redownload(self):
        for x in self.sel_tasks():
            x.reset_for_redownload()
            self.activate(x)
        self.save_state()

    def act_refresh_url(self):
        rows = self.selected
        if len(rows) == 1 and not rows[0].task.is_completed:
            RefreshUrlDialog(self, rows[0].task)

    def act_checksum(self):
        rows = self.selected
        if len(rows) == 1 and rows[0].task.is_completed:
            ChecksumDialog(self, rows[0].task)

    def act_av_scan(self):
        rows = self.selected
        if len(rows) == 1 and rows[0].task.is_completed:
            self.run_av_scan(rows[0].task, silent_start=False)

    def run_av_scan(self, task, silent_start=False):
        if getattr(task, "_av_scanning", False):
            return
        task._av_scanning = True
        if not silent_start:
            self.toast(t("av_scanning"), task.filename, accent="cyan", icon="shield", category=t("av_cat"), duration=3500)
        custom_av = self.settings.get("custom_av_path", "")

        def _worker():
            try:
                status, detail = scan_file_antivirus(task.save_path, custom_av)
                self.after(0, lambda: self._on_av_scan_done(task, status, detail))
            except Exception as e:
                self.after(0, lambda err=str(e): self._on_av_scan_done(task, "error", err))

        threading.Thread(target=_worker, daemon=True).start()

    def _on_av_scan_done(self, task, status, detail):
        task._av_scanning = False
        if self.is_closing:
            return
        if status == "clean":
            self.toast(t("av_clean"), f"{task.filename} • {detail}", accent="success", icon="shield", category=t("av_cat"), duration=5500)
        elif status == "threat":
            self.toast(t("av_threat"), f"{task.filename} — {detail}", accent="danger", icon="bug", category=t("av_cat"), duration=9000)
            send_windows_toast(t("av_threat"), f"{task.filename}: {detail}", sound=True)
        else:
            self.toast(t("av_unavail"), f"{task.filename} — {detail}", accent="warning", icon="warning", category=t("av_cat"), duration=5500)

    def act_extract(self):
        rows = self.selected
        if len(rows) == 1 and rows[0].task.is_completed and is_extractable_archive(rows[0].task.filename):
            self.run_extract(rows[0].task, silent_start=False)

    def run_extract(self, task, silent_start=False):
        if getattr(task, "_extracting", False):
            return
        task._extracting = True
        if not silent_start:
            self.toast(t("ext_running"), task.filename, accent="cyan", icon="box-open", category=t("ext_cat"), duration=4000)

        def _worker():
            try:
                ok, info = extract_archive_file(task.save_path)
                self.after(0, lambda: self._on_extract_done(task, ok, info))
            except Exception as e:
                self.after(0, lambda err=str(e): self._on_extract_done(task, False, err))

        threading.Thread(target=_worker, daemon=True).start()

    def _on_extract_done(self, task, ok, info):
        task._extracting = False
        if self.is_closing:
            return
        if ok:
            folder_name = os.path.basename(info)
            self.toast(
                t("ext_done"),
                f"{task.filename}  →  {folder_name}",
                accent="success",
                icon="box-open",
                category=t("ext_cat"),
                action_label=t("dlg_open_folder"),
                on_click=lambda d=info: os.startfile(d) if os.path.isdir(d) else None,
                duration=7500,
            )
        else:
            self.toast(t("ext_fail"), f"{task.filename}: {info}", accent="danger", icon="warning", category=t("ext_cat"), duration=6500)

    # ------------------------------------------------------------ Tray & Basket
    def setup_tray(self):
        try:
            if os.path.isfile(ICON_PNG_PATH):
                img = Image.open(ICON_PNG_PATH).convert("RGBA").resize((64, 64), Image.Resampling.LANCZOS)
            else:
                img = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
                draw = ImageDraw.Draw(img)
                draw.ellipse((2, 2, 62, 62), fill=(16, 20, 34), outline=(79, 70, 229), width=3)
                draw.polygon([(32, 42), (18, 26), (26, 26), (26, 14), (38, 14), (38, 26), (46, 26)], fill=(6, 182, 212))
                draw.rectangle([(20, 48), (44, 52)], fill=(243, 246, 251))

            def _show():
                self.after(0, self.restore_from_tray)

            def _add():
                self.after(0, lambda: (self.restore_from_tray(), self.show_add_dialog()))

            def _resume():
                self.after(0, self.act_resume_all)

            def _pause():
                self.after(0, self.act_stop_all)

            def _basket():
                self.after(0, lambda: self.toggle_drop_basket())

            def _exit(icon):
                self.after(0, self.exit_app)

            menu = pystray.Menu(
                pystray.MenuItem(t("tray_show"), _show, default=True),
                pystray.MenuItem(t("tray_add"), _add),
                pystray.MenuItem(t("tray_resume_all"), _resume),
                pystray.MenuItem(t("tray_pause_all"), _pause),
                pystray.MenuItem(t("tray_basket"), _basket),
                pystray.Menu.SEPARATOR,
                pystray.MenuItem(t("tray_exit"), _exit),
            )
            self.tray_icon = pystray.Icon("Negm Lodaing", img, "Negm Lodaing", menu)
            self.tray_icon.run_detached()
        except Exception as e:
            print("setup_tray error:", e)

    def restore_from_tray(self):
        try:
            self.deiconify()
            self.lift()
            self.focus_force()
            set_dark_titlebar(self)
        except Exception:
            pass

    def toggle_drop_basket(self, show=None):
        if show is None:
            show = not (self.drop_basket is not None and self.drop_basket.winfo_exists())
        self.settings["show_drop_basket"] = bool(show)
        self.save_state()
        if show:
            if self.drop_basket is None or not self.drop_basket.winfo_exists():
                self.drop_basket = DropBasket(self)
            else:
                self.drop_basket.lift()
        else:
            if self.drop_basket is not None and self.drop_basket.winfo_exists():
                self.drop_basket.destroy()
                self.drop_basket = None

    def exit_app(self):
        self.force_exit = True
        if self.tray_icon:
            try:
                self.tray_icon.stop()
            except Exception:
                pass
        if self.drop_basket and self.drop_basket.winfo_exists():
            try:
                self.drop_basket.destroy()
            except Exception:
                pass
        self.on_close()

    def act_open_file(self):
        rows = self.selected
        if len(rows) == 1 and rows[0].task.is_completed and os.path.exists(rows[0].task.save_path):
            os.startfile(rows[0].task.save_path)

    def act_folder(self):
        if len(self.selected) == 1:
            p = os.path.normpath(self.selected[0].task.save_path)
            if os.path.exists(p):
                subprocess.run(["explorer", f"/select,{p}"])
            elif os.path.isdir(os.path.dirname(p)):
                os.startfile(os.path.dirname(p))

    def act_details(self):
        if len(self.selected) == 1:
            DetailsDialog(self, self.selected[0].task)

    def act_open_or_details(self):
        if len(self.selected) != 1:
            return
        if self.selected[0].task.is_completed:
            self.act_open_file()
        else:
            self.act_details()

    def act_copy_link(self):
        urls = "\n".join(x.url for x in self.sel_tasks())
        if urls:
            self.clipboard_clear()
            self.clipboard_append(urls)
            n = len(self.sel_tasks())
            msg = t("toast_link_copied") if n == 1 else f"{t('toast_link_copied')} ({n})"
            self.toast(t("app_title"), msg, accent="success", icon="clipboard", duration=2500)

    # ------------------------------------------------------------ dialogs
    def show_options(self):
        OptionsDialog(self)

    def show_limiter(self):
        SpeedLimiterDialog(self)

    def show_scheduler(self):
        SchedulerDialog(self)

    def show_command_palette(self, event=None):
        if getattr(self, "palette_dialog", None) and self.palette_dialog.winfo_exists():
            try:
                self.palette_dialog.lift()
                self.palette_dialog.focus_force()
            except Exception:
                pass
            return "break"
        self.palette_dialog = CommandPaletteDialog(self)
        return "break"

    def show_shortcuts(self):
        ShortcutsDialog(self)

    def apply_global_limit(self, kb):
        self.settings["global_limit_kb"] = kb
        for it in self.tasks:
            it["task"].set_speed_limit(kb)
        self.save_state()

    def apply_schedule(self, text, shutdown):
        self.settings["shutdown_when_done"] = shutdown
        self.settings["schedule_start"] = text
        if text:
            self.schedule_dt = parse_hhmm(text)
            self.toast(t("u_sched_set"), self.schedule_dt.strftime("%H:%M"), "warning", "clock")
        else:
            self.schedule_dt = None
            self.toast(t("u_sched_cleared"), "", "primary", "clock")
        self.session_done = 0
        self.save_state()

    def restore_schedule(self):
        text = self.settings.get("schedule_start", "")
        try:
            self.schedule_dt = parse_hhmm(text) if text else None
        except Exception:
            self.schedule_dt = None

    def quick_theme(self):
        if getattr(self, "_theme_animating", False):
            return
        origin_x = None
        origin_y = None
        if hasattr(self, "btn_theme") and self.btn_theme.winfo_exists():
            try:
                origin_x = self.btn_theme.winfo_rootx() - self.winfo_rootx() + self.btn_theme.winfo_width() // 2
                origin_y = self.btn_theme.winfo_rooty() - self.winfo_rooty() + self.btn_theme.winfo_height() // 2
            except Exception:
                origin_x = None
                origin_y = None
        self.toggle_theme(origin_x=origin_x, origin_y=origin_y)

    def toggle_theme(self, origin_x=None, origin_y=None):
        if getattr(self, "_theme_animating", False):
            return
        new_theme = "Light" if ctk.get_appearance_mode() == "Dark" else "Dark"
        self.switch_theme_animated(new_theme, origin_x=origin_x, origin_y=origin_y)

    def switch_theme_animated(self, new_theme, origin_x=None, origin_y=None, force_animate=False):
        if getattr(self, "_theme_animating", False):
            return
        if self.settings.get("theme") == new_theme and ctk.get_appearance_mode() == new_theme:
            return

        # Check for prefers-reduced-motion or missing capture support
        if not force_animate and (prefers_reduced_motion() or not self.winfo_exists() or self.is_closing):
            self.settings["theme"] = new_theme
            self.apply_look(True)
            return

        old_img = capture_window_client_image(self)
        if old_img is None:
            self.settings["theme"] = new_theme
            self.apply_look(True)
            return

        self._theme_animating = True
        self.settings["theme"] = new_theme
        ctk.set_appearance_mode(new_theme)
        self.save_state()

        # Rebuild UI to generate the new appearance
        self.rebuild_ui()
        self.update_idletasks()
        self.update()

        new_img = capture_window_client_image(self)
        if new_img is None:
            self._theme_animating = False
            return

        win_w = max(10, self.winfo_width())
        win_h = max(10, self.winfo_height())
        img_w, img_h = old_img.size

        scale_x = img_w / float(win_w)
        scale_y = img_h / float(win_h)

        if origin_x is None:
            origin_x = win_w - 45 if not is_rtl() else 45
        if origin_y is None:
            origin_y = 35

        cx = int(origin_x * scale_x)
        cy = int(origin_y * scale_y)

        corners = [(0, 0), (img_w, 0), (0, img_h), (img_w, img_h)]
        max_r = max(math.hypot(x - cx, y - cy) for x, y in corners)

        # Create overlay canvas on top of entire window
        canvas = tk.Canvas(self, width=win_w, height=win_h, highlightthickness=0, bd=0)
        canvas.place(x=0, y=0, relwidth=1, relheight=1)
        tk.Misc.lift(canvas)

        # Place initial old frame image item once to reuse via itemconfigure (eliminates canvas recreation overhead)
        initial_frame = old_img if (img_w, img_h) == (win_w, win_h) else old_img.resize((win_w, win_h), Image.Resampling.BILINEAR)
        p_initial = ImageTk.PhotoImage(initial_frame)
        canvas_img_id = canvas.create_image(0, 0, image=p_initial, anchor="nw")
        canvas.image = p_initial

        total_frames = 14
        interval_ms = 30  # 14 * 30ms = 420ms animation duration
        step = [0]
        mask = Image.new("L", (img_w, img_h), 0)
        draw = ImageDraw.Draw(mask)

        def _tick():
            if self.is_closing or not self.winfo_exists() or not canvas.winfo_exists():
                _cleanup()
                return

            step[0] += 1
            progress = min(1.0, step[0] / float(total_frames))
            # Smooth ease-out cubic curve (Telegram style)
            ease = 1.0 - math.pow(1.0 - progress, 3)
            r = max_r * ease

            mask.paste(0, [0, 0, img_w, img_h])
            draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=255)
            frame = Image.composite(new_img, old_img, mask)

            if (img_w, img_h) != (win_w, win_h):
                frame = frame.resize((win_w, win_h), Image.Resampling.BILINEAR)

            tk_img = ImageTk.PhotoImage(frame)
            canvas.itemconfigure(canvas_img_id, image=tk_img)
            canvas.image = tk_img  # retain reference to prevent GC

            if progress < 1.0:
                self.after(interval_ms, _tick)
            else:
                _cleanup()

        def _cleanup():
            nonlocal old_img, new_img, mask
            try:
                if canvas.winfo_exists():
                    canvas.destroy()
            except Exception:
                pass
            # Clear sensitive captured screenshots from memory immediately
            old_img = None
            new_img = None
            mask = None
            self._theme_animating = False

        self.after(interval_ms, _tick)

    def quick_language(self):
        self.settings["lang"] = "en" if E.LANG == "ar" else "ar"
        self.apply_look(True)

    def apply_look(self, rebuild):
        E.set_language(self.settings["lang"])
        ctk.set_appearance_mode(self.settings["theme"])
        self.save_state()
        if rebuild:
            self.after(60, self.rebuild_ui)

    def rebuild_ui(self):
        sel_urls = {r.task.url for r in self.selected}
        for child in list(self.winfo_children()):
            child.destroy()
        self.selected = []
        self.anchor = None
        self.nav = {}
        self._sidebar_collapsed = False
        self._toolbar_compact = False
        self._last_speed_txt = None
        self._last_cnt_txt = None
        self._last_sel_txt = None
        self._last_sch_txt = None
        self._last_lim_txt = None
        self._last_quota_txt = None
        self._last_proxy_txt = None
        self._last_toolbar = None
        self.build_ui()
        for it in self.tasks:
            it["row"] = DownloadRow(self.scroll, it["task"], self)
        self.relayout_grid()
        for r in self.visible_rows():
            if r.task.url in sel_urls:
                self.select_row(r, ctrl=True)
        if self.settings.get("show_drop_basket", False):
            self.drop_basket = DropBasket(self)
        apply_window_icon(self)
        set_dark_titlebar(self)

    # ------------------------------------------------------------ queue + loops
    def process_queue(self):
        if self.is_quota_exceeded():
            return
        if self.schedule_dt:
            if datetime.datetime.now() < self.schedule_dt:
                return
            self.schedule_dt = None
            self.settings["schedule_start"] = ""
            self.toast(t("u_queue_at"), datetime.datetime.now().strftime("%H:%M"), "success", "clock")
        global_max = int(self.settings.get("max_concurrent", 3))
        queues = self.get_all_queues()
        q_map = {q.get("id", "main"): q for q in queues}

        # Track active downloads per queue and overall
        active_per_queue = {q.get("id", "main"): 0 for q in queues}
        total_running = 0
        for it in self.tasks:
            t_obj = it["task"]
            if t_obj.state == "active":
                total_running += 1
                qid = getattr(t_obj, "queue_id", "main")
                active_per_queue[qid] = active_per_queue.get(qid, 0) + 1

        if total_running >= global_max:
            return

        for it in self.tasks:
            if total_running >= global_max:
                break
            task = it["task"]
            if task.state == "queued" and not getattr(task, "hold", False):
                qid = getattr(task, "queue_id", "main")
                q_cfg = q_map.get(qid, q_map.get("main", {}))

                # Check if queue is active
                if not q_cfg.get("enabled", True):
                    continue

                # Check queue schedule window
                s_start = q_cfg.get("schedule_start", "")
                s_stop = q_cfg.get("schedule_stop", "")
                if s_start and s_stop:
                    if not E.is_queue_time_active(s_start, s_stop):
                        continue

                # Check per-queue concurrency
                q_max = int(q_cfg.get("max_parallel", global_max))
                if active_per_queue.get(qid, 0) >= q_max:
                    continue

                task.start()
                active_per_queue[qid] = active_per_queue.get(qid, 0) + 1
                total_running += 1

    def update_toolbar(self):
        tasks = self.sel_tasks()
        all_tasks = [it["task"] for it in self.tasks]
        state = (
            any(x.state in ("paused", "queued", "failed") for x in tasks),
            any(x.state == "active" for x in tasks),
            bool(tasks),
            any(x.state == "active" for x in all_tasks),
            any(x.state in ("paused", "queued", "failed") for x in all_tasks),
        )
        if state == self._last_toolbar:
            return
        self._last_toolbar = state
        for key, ok in zip(("resume", "pause", "delete", "stop_all", "resume_all"), state):
            self.tb[key].set_enabled(ok)

    def tick(self):
        if self.is_closing:
            return
        active = 0
        try:
            self._drain_bridge_queue()
            self._sync_quota_date()
            speed = 0
            changed = False
            net_delta = 0
            for it in self.tasks:
                task, row = it["task"], it["row"]
                net_delta += task.pop_net_bytes()
                st = task.state
                if st == "active":
                    speed += task.current_speed_bps
                    active += 1
                if st != row._cache.get("last_state"):
                    row._cache["last_state"] = st
                    changed = True
                if st in ("completed", "failed") and not getattr(task, "_notified", False):
                    task._notified = True
                    self.finished(task, st == "completed")

            if hasattr(self, "table") and self.table is not None:
                if active > 0 or changed or getattr(self.table, "_dirty", False):
                    self.table.refresh_viewport()

            # Queue completion celebration & sound
            if getattr(self, "_last_active_count", 0) > 0 and active == 0:
                all_done = bool(self.tasks) and all(it["task"].state in ("completed", "paused", "failed") for it in self.tasks)
                if all_done and getattr(self, "session_done", 0) > 0:
                    if not getattr(self, "_queue_done_notified", False):
                        self._queue_done_notified = True
                        if bool(self.settings.get("sound", True)):
                            play_event_sound("queue_done")
                        self.toast(
                            t("queue_all_done_title"),
                            f"{t('queue_all_done_desc')} ({self.session_done} {t('u_downloads')})",
                            accent="success",
                            icon="check-double",
                            category=t("st_completed"),
                            duration=6000,
                        )
            elif active > 0:
                self._queue_done_notified = False

            self._last_active_count = active

            if net_delta > 0:
                self.settings["quota_used_bytes"] = int(self.settings.get("quota_used_bytes", 0) or 0) + net_delta
                self.settings["total_lifetime_bytes"] = int(self.settings.get("total_lifetime_bytes", 0) or 0) + net_delta

            self.speed_samples.append(float(speed))
            if speed > self.peak_speed_bps:
                self.peak_speed_bps = int(speed)
                self.settings["peak_speed_bps"] = self.peak_speed_bps

            if self.is_quota_exceeded():
                if active > 0:
                    self.act_stop_all()
                    active = 0
                    speed = 0
                if not self._quota_exceeded_notified:
                    self._quota_exceeded_notified = True
                    used_s = fmt_size(self.settings.get("quota_used_bytes", 0))
                    lim_s = fmt_size(int(self.settings.get("daily_quota_mb", 0)) * 1024 * 1024)
                    self.toast(
                        t("quota_reached"),
                        f"{used_s} / {lim_s}",
                        accent="warning",
                        icon="warning",
                        category=t("quota_cat"),
                        action_label=t("u_options"),
                        on_click=self.show_options,
                        duration=8000,
                    )
                    send_windows_toast(t("quota_reached"), f"{used_s} / {lim_s}", sound=True)

            if changed:
                if self.active_filter != "cat_all" or strip_bidi(self.search_var.get()).strip():
                    self.relayout_grid()
                self.update_nav()
                self.save_state()
            self.process_queue()
            self.update_toolbar()

            spd_txt = fmt_speed(speed)
            if self._last_speed_txt != spd_txt:
                self._last_speed_txt = spd_txt
                self.lbl_speed.configure(text=spd_txt)
            if hasattr(self, "speed_sparkline") and self.speed_sparkline.winfo_exists():
                self.speed_sparkline.update_samples(self.speed_samples, speed)

            cnt_txt = bidi(f"{len(self.tasks)} {t('u_downloads')}  •  {active} {t('u_active_n')}")
            if self._last_cnt_txt != cnt_txt:
                self._last_cnt_txt = cnt_txt
                self.lbl_count.configure(text=cnt_txt)

            sel_txt = bidi(f"{len(self.selected)} {t('u_selected')}") if self.selected else ""
            if self._last_sel_txt != sel_txt:
                self._last_sel_txt = sel_txt
                self.lbl_sel.configure(text=sel_txt)

            sch_txt = bidi(f"{t('u_queue_at')} {self.schedule_dt.strftime('%H:%M')}") if self.schedule_dt else ""
            if self._last_sch_txt != sch_txt:
                self._last_sch_txt = sch_txt
                self.lbl_sched.configure(text=sch_txt)

            lim = int(self.settings.get("global_limit_kb", 0))
            lim_txt = bidi(f"{t('tb_limiter')}: {fmt_size(lim * 1024)}/s") if lim else ""
            if self._last_lim_txt != lim_txt:
                self._last_lim_txt = lim_txt
                self.lbl_limit.configure(text=lim_txt)

            q_mb = int(self.settings.get("daily_quota_mb", 0) or 0)
            if q_mb > 0:
                used_b = int(self.settings.get("quota_used_bytes", 0) or 0)
                lim_b = q_mb * 1024 * 1024
                q_txt = bidi(f"{t('sb_quota')}: {fmt_size(used_b)} / {fmt_size(lim_b)}")
                q_col = "danger" if used_b >= lim_b else "accent_cyan"
            else:
                q_txt = ""
                q_col = "accent_cyan"
            if self._last_quota_txt != (q_txt, q_col):
                self._last_quota_txt = (q_txt, q_col)
                self.lbl_quota.configure(text=q_txt, text_color=col(q_col))

            px = self.get_active_proxy()
            px_txt = bidi(f"{ico('globe')} {t('sb_proxy')}") if px else ""
            if self._last_proxy_txt != px_txt:
                self._last_proxy_txt = px_txt
                self.lbl_proxy.configure(text=px_txt)

            self.check_shutdown()
            if self.drop_basket and self.drop_basket.winfo_exists():
                self.drop_basket.update_stats(spd_txt, active)
            if time.time() - self._last_save > 6 and active:
                self.save_state()
                self._last_save = time.time()
        except Exception as e:
            print("tick error:", e)
        next_ms = 250 if active > 0 else 600
        if not self.is_closing and self.winfo_exists():
            self._tick_timer_id = self.after(next_ms, self.tick)

    def finished(self, task, ok):
        if ok:
            self.session_done += 1
        if hasattr(self, "history_manager") and self.history_manager is not None:
            try:
                status_str = "completed" if ok else "failed"
                err_str = str(getattr(task, "status_detail", "") or "") if not ok else ""
                dur_sec = max(0.1, time.time() - getattr(task, "added_time", time.time()))
                self.history_manager.record_download(task, status=status_str, error_msg=err_str, duration_sec=dur_sec)
                if hasattr(self, "analytics_dialog") and self.analytics_dialog is not None and self.analytics_dialog.winfo_exists():
                    self.analytics_dialog.notify_history_changed()
            except Exception as e:
                print("History record error:", e)
        play_snd = bool(self.settings.get("sound", True))
        if self.settings.get("notify", True):
            title_txt = t("t_done") if ok else t("t_fail")
            cat_txt = t("st_completed") if ok else t("st_failed")
            if ok:
                act_lbl = t("dlg_open_file")
                act_fn = (lambda p=task.save_path: os.startfile(p) if os.path.exists(p) else None)
            else:
                st_detail = str(getattr(task, "status_detail", "") or "")
                if any(code in st_detail for code in ("401", "403", "404", "410", "Forbidden", "Expired")):
                    act_lbl = t("ref_toast_act")
                    act_fn = (lambda t_obj=task: RefreshUrlDialog(self, t_obj))
                else:
                    act_lbl = None
                    act_fn = None
            fail_body = f"{task.filename} — {task.status_detail}" if (not ok and getattr(task, "status_detail", "")) else task.filename
            self.toast(
                title=title_txt,
                body=fail_body,
                accent="success" if ok else "danger",
                icon="check" if ok else "circle-xmark",
                category=cat_txt,
                action_label=act_lbl,
                on_click=act_fn,
                duration=6500,
            )
            send_windows_toast(
                title=title_txt,
                message=f"{task.filename} ({fmt_size(task.total_size)})" if ok and task.total_size else task.filename,
                file_path=task.save_path if ok else "",
                sound=play_snd,
            )
        if play_snd:
            play_event_sound("complete" if ok else "failed")

        if ok:
            if self.settings.get("auto_av_scan", False):
                self.run_av_scan(task, silent_start=True)
            if self.settings.get("auto_extract", False) and is_extractable_archive(task.filename):
                self.run_extract(task, silent_start=False)
            E.execute_post_completion(task, self.settings)

    def check_shutdown(self):
        act = self.settings.get("post_finish_action", "none")
        if act == "none":
            if not self.settings.get("shutdown_when_done"):
                return
            act = "shutdown"
        if self.session_done == 0:
            return
        if any(it["task"].state in ("active", "queued") for it in self.tasks):
            return
        self.settings["shutdown_when_done"] = False
        self.settings["post_finish_action"] = "none"
        self.save_state()

        if act == "exit_app":
            self.after(2000, self.on_close)
            self.toast(t("post_title"), t("post_act_exit"), accent="amber", icon="power", duration=3000)
            return

        E.execute_power_action(act)
        dlg = BaseDialog(self, t("post_title"), 440, 200)
        c = dlg.card()
        ctk.CTkLabel(
            c, text=bidi(ico("power") + "  " + t("post_action_toast")),
            font=uifont(13, "bold"), text_color=col("text"), wraplength=380,
        ).pack(pady=(24, 16), padx=16)
        IconButton(
            c, "xmark", t("post_cancel_act"),
            lambda: (E.cancel_pending_shutdown(), dlg.destroy(), self.toast(t("post_title"), t("post_toast_cancel_ok"), accent="success")),
            style="danger_fill", padx=16, pady=8,
        ).pack(pady=(0, 14))

    def clipboard_loop(self):
        if self.is_closing:
            return
        try:
            if self.settings.get("clip_monitor", True):
                seq = None
                if sys.platform == "win32":
                    try:
                        seq = ctypes.windll.user32.GetClipboardSequenceNumber()
                    except Exception:
                        seq = None
                if seq is not None and getattr(self, "_last_clip_seq", None) == seq:
                    pass
                else:
                    self._last_clip_seq = seq
                    try:
                        txt = self.clipboard_get().strip()
                    except Exception:
                        txt = ""
                    if self.last_clip is None:
                        self.last_clip = txt
                    elif txt and txt != self.last_clip:
                        self.last_clip = txt
                        if URL_REGEX.fullmatch(txt) and not any(it["task"].url == txt for it in self.tasks):
                            if is_media_platform_url(txt):
                                self.toast(
                                    title=t("u_media_detected"),
                                    body=txt,
                                    accent="primary",
                                    icon="film",
                                    category=t("u_video"),
                                    action_label=t("u_video"),
                                    on_click=lambda u=txt: self.show_media_dialog(u),
                                    duration=8000,
                                )
                            else:
                                self.toast(
                                    title=t("u_link_detected"),
                                    body=txt,
                                    accent="cyan",
                                    icon="clipboard",
                                    category=t("cat_all"),
                                    action_label=t("u_add"),
                                    on_click=lambda u=txt: self.show_add_dialog(u),
                                    duration=7000,
                                )
        except Exception:
            pass
        if not self.is_closing and self.winfo_exists():
            self._clip_timer_id = self.after(2000, self.clipboard_loop)

    # ------------------------------------------------------------ dnd, persistence, close
    def setup_dnd(self):
        if not E.DND_OK:
            return
        try:
            self.drop_target_register(E.DND_TEXT)
            self.dnd_bind("<<Drop>>", self._on_drop)
        except Exception:
            pass

    def _on_drop(self, event):
        links = list(dict.fromkeys(URL_REGEX.findall(event.data or "")))
        if len(links) == 1:
            if is_media_platform_url(links[0]):
                self.show_media_dialog(links[0])
            else:
                self.show_add_dialog(links[0])
        else:
            for link in links:
                save_p = os.path.join(self.settings["folder"], extract_filename_from_url(link, "download_file.bin"))
                if is_media_platform_url(link) and find_ytdlp_executable():
                    self.add_media_task(link, save_p, start_now=True, silent_toast=True)
                else:
                    self.add_task(link, save_p, start_now=True, silent_toast=True, max_chunks=4)
        return event.action

    def save_state(self, async_write: bool = True):
        tasks_data = [it["task"].to_dict() for it in self.tasks]
        settings_data = dict(self.settings)
        if async_write:
            def _writer():
                save_json(DOWNLOADS_FILE, tasks_data)
                save_json(SETTINGS_FILE, settings_data)
            threading.Thread(target=_writer, daemon=True).start()
        else:
            save_json(DOWNLOADS_FILE, tasks_data)
            save_json(SETTINGS_FILE, settings_data)

    def restore_tasks(self):
        proxy = self.get_active_proxy()
        for d in load_json(DOWNLOADS_FILE, []):
            try:
                task = DownloadTask.from_dict(d)
                task.hold = False
                if proxy:
                    task.set_proxy(proxy)
                if task.state in ("completed", "failed"):
                    task._notified = True
                self.tasks.append({"task": task, "row": DownloadRow(self.scroll, task, self)})
            except Exception as e:
                print("restore error:", e)
        self.relayout_grid()

    def on_close(self):
        if self.is_closing:
            return
        if self.settings.get("minimize_to_tray", True) and not getattr(self, "force_exit", False):
            self.withdraw()
            if not getattr(self, "_minimized_notified", False):
                self._minimized_notified = True
                self.toast(t("app_title"), t("toast_minimized"), accent="primary", icon="info")
            return
        self.is_closing = True
        if getattr(self, "_tick_timer_id", None):
            try:
                self.after_cancel(self._tick_timer_id)
            except Exception:
                pass
            self._tick_timer_id = None
        if getattr(self, "_clip_timer_id", None):
            try:
                self.after_cancel(self._clip_timer_id)
            except Exception:
                pass
            self._clip_timer_id = None
        if getattr(self, "_resize_job", None):
            try:
                self.after_cancel(self._resize_job)
            except Exception:
                pass
            self._resize_job = None
        if getattr(self, "tray_icon", None):
            try:
                self.tray_icon.stop()
            except Exception:
                pass
        if getattr(self, "drop_basket", None) and self.drop_basket.winfo_exists():
            try:
                self.drop_basket.destroy()
            except Exception:
                pass
        if getattr(self, "bridge_server", None):
            self.bridge_server.stop()
        for it in self.tasks:
            if it["task"].state in ("active", "queued"):
                it["task"].pause()
        self.save_state(async_write=False)
        self.destroy()


if __name__ == "__main__":
    app = NexusStreamManagerApp()
    app.mainloop()

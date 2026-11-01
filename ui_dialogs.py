# -*- coding: utf-8 -*-
"""
ui_dialogs.py - All Modal Dialogs and Popups (RTL/LTR Mirrored, High-Contrast)
Part of NegmLoading Modular Architecture
"""
from __future__ import annotations

import os
import sys
import time
import math
import ctypes
import hashlib
import html
import base64
import threading
import subprocess
import webbrowser
from typing import Optional, Callable, Any, Dict, List, Tuple

import tkinter as tk
from tkinter import filedialog, messagebox, ttk
import customtkinter as ctk
from PIL import Image, ImageTk

import nexus_engine as E
from nexus_engine import *
from ui_theme import *
from ui_components import *

# ----------------------------------------------------------------------
# 3. Dialogs (RTL/LTR Mirrored, High-Contrast, Accessible Focus Restore)
# ----------------------------------------------------------------------
class BaseDialog(ctk.CTkToplevel):
    def __init__(self, app, title, width, height, modal=True):
        super().__init__(app)
        self.app = app
        self.modal = modal
        self._prev_focus = None
        try:
            self._prev_focus = app.focus_get()
        except Exception:
            self._prev_focus = None

        self._scheduled_jobs = []
        self.title(strip_bidi(title))
        self.resizable(True, True)
        self.configure(fg_color=col("bg"))
        self.transient(app)
        try:
            sw, sh = self.winfo_screenwidth(), self.winfo_screenheight()
            height = min(height, max(320, sh - 72))
            width = min(width, max(400, sw - 48))
            self.minsize(min(420, width), min(260, height))
            x = app.winfo_x() + (app.winfo_width() - width) // 2
            y = app.winfo_y() + (app.winfo_height() - height) // 2
            x = max(16, min(sw - width - 16, x))
            y = max(16, min(sh - height - 56, y))
        except Exception:
            x, y = 180, 90
        self.geometry(f"{width}x{height}+{x}+{y}")
        self.bind("<Escape>", lambda e: self.destroy())
        apply_window_icon(self)
        self.after(120, self._ready)
        self.after(200, lambda: apply_window_icon(self) if self.winfo_exists() else None)

    def destroy(self):
        prev = getattr(self, "_prev_focus", None)
        for j in getattr(self, "_scheduled_jobs", []):
            try:
                self.after_cancel(j)
            except Exception:
                pass
        self._scheduled_jobs = []
        try:
            if self.modal:
                self.grab_release()
        except Exception:
            pass
        super().destroy()
        if prev is not None:
            try:
                if prev.winfo_exists():
                    prev.focus_set()
            except Exception:
                pass

    def _ready(self):
        try:
            if not self.winfo_exists():
                return
            self.update_idletasks()
            req_h = self.winfo_reqheight()
            cur_h = self.winfo_height()
            cur_w = self.winfo_width()
            if req_h > cur_h + 4:
                sh = self.winfo_screenheight()
                new_h = min(req_h + 10, max(cur_h, sh - 68))
                if new_h > cur_h:
                    ny = max(16, min(sh - new_h - 52, self.winfo_y() - (new_h - cur_h) // 2))
                    self.geometry(f"{cur_w}x{new_h}+{self.winfo_x()}+{ny}")
            set_dark_titlebar(self)
            self.lift()
            self.focus_force()
            if self.modal:
                self.grab_set()
            self.on_ready()
        except Exception:
            pass

    def on_ready(self):
        pass

    def card(self, pady=(0, 0)):
        c = ctk.CTkFrame(self, corner_radius=16, fg_color=col("card"), border_width=1, border_color=col("border_light"))
        c.pack(fill="both", expand=True, padx=16, pady=16)
        return c

    def dialog_header(self, parent, icon_name: str, title_text: str, icon_color: str = "primary_text", padx: int = 20, pady=(16, 6)):
        head = ctk.CTkFrame(parent, fg_color="transparent")
        head.pack(fill="x", padx=padx, pady=pady)
        side = s_start()
        badge = ctk.CTkFrame(head, width=36, height=36, corner_radius=10, fg_color=col("card_alt"),
                             border_width=1, border_color=col("border_light"))
        badge.pack(side=side, padx=px_inline(0, 10))
        badge.pack_propagate(False)
        ctk.CTkLabel(badge, text=ico(icon_name), font=ifont(16), text_color=col(icon_color)).place(relx=0.5, rely=0.5, anchor="center")
        ctk.CTkLabel(
            head, text=bidi(title_text), font=uifont(16, "bold"),
            text_color=col("text"), anchor=a_start(),
        ).pack(side=side, fill="x", expand=True)
        return head

    def section(self, parent, text, padx=20, pady=(10, 4)):
        ctk.CTkLabel(
            parent, text=bidi(text), anchor=a_start(),
            font=uifont(11, "bold"), text_color=col("text_muted"),
        ).pack(fill="x", padx=padx, pady=pady)


class AddDownloadDialog(BaseDialog):
    def __init__(self, app, default_url="", on_submit=None, extra_headers=None, suggested_name=""):
        super().__init__(app, t("dlg_add_title"), 660, 520)
        self.on_submit = on_submit
        self.extra_headers = dict(extra_headers or {})
        self._suggested_name = (suggested_name or "").strip()
        self._name_touched = bool(self._suggested_name)
        self._submitting = False
        card = self.card()

        self.dialog_header(card, "cloud-down", t("dlg_add_title"), icon_color="primary_text", padx=22, pady=(18, 4))

        # Pack bottom footer BEFORE body so action buttons never clip at high DPI
        btns = ctk.CTkFrame(card, fg_color="transparent")
        btns.pack(fill="x", padx=22, pady=(10, 18), side="bottom")
        IconButton(btns, "xmark", t("u_cancel"), self.destroy, style="ghost", padx=14, pady=8).pack(side=s_end())
        IconButton(btns, "download", t("u_download_now"), lambda: self._submit(True), style="primary", padx=16, pady=8).pack(side=s_start())
        IconButton(btns, "clock", t("u_later"), lambda: self._submit(False), style="soft", padx=14, pady=8).pack(
            side=s_start(), padx=px_inline(10, 0),
        )

        self.section(card, t("dlg_url"), padx=22)
        row = ctk.CTkFrame(card, fg_color="transparent")
        row.pack(fill="x", padx=22)
        self.url_var = ctk.StringVar(value=default_url)
        IconButton(row, "clipboard", t("u_paste"), self._paste, style="soft", tooltip=t("u_paste"), padx=12, pady=8).pack(side=s_end())
        self.url_entry = ctk.CTkEntry(
            row, textvariable=self.url_var, height=38, corner_radius=10, font=uifont(12),
            fg_color=col("input"), border_color=col("border"), text_color=col("text"),
        )
        self.url_entry.pack(side=s_start(), fill="x", expand=True, padx=px_inline(0, 8))
        self.err_lbl = ctk.CTkLabel(
            card, text="", height=18, anchor=a_start(), font=uifont(11, "bold"), text_color=col("danger"),
        )
        self.err_lbl.pack(fill="x", padx=24, pady=(2, 0))

        row2 = ctk.CTkFrame(card, fg_color="transparent")
        row2.pack(fill="x", padx=22, pady=(4, 0))

        cat_col = ctk.CTkFrame(row2, fg_color="transparent")
        cat_col.pack(side=s_end())
        ctk.CTkLabel(cat_col, text=bidi(t("u_category")), anchor=a_start(), font=uifont(11, "bold"),
                     text_color=col("text_muted")).pack(fill="x", pady=(0, 4))
        self.cat_chip = ctk.CTkFrame(cat_col, corner_radius=10, fg_color=col("card_alt"), height=38, border_width=1, border_color=col("border_light"))
        self.cat_chip.pack(fill="x")
        self.cat_icon = ctk.CTkLabel(self.cat_chip, text="", font=ifont(14), width=22)
        self.cat_icon.pack(side=s_start(), padx=px_inline(12, 6), pady=8)
        self.cat_text = ctk.CTkLabel(
            self.cat_chip, text="", font=uifont(12, "bold"),
            text_color=col("text"), width=98, anchor=a_start(),
        )
        self.cat_text.pack(side=s_start(), padx=px_inline(0, 12))

        name_col = ctk.CTkFrame(row2, fg_color="transparent")
        name_col.pack(side=s_start(), fill="x", expand=True, padx=px_inline(0, 12))
        ctk.CTkLabel(name_col, text=bidi(t("dlg_name")), anchor=a_start(), font=uifont(11, "bold"),
                     text_color=col("text_muted")).pack(fill="x", pady=(0, 4))
        self.name_var = ctk.StringVar(value=self._suggested_name)
        self.name_entry = ctk.CTkEntry(
            name_col, textvariable=self.name_var, height=38, corner_radius=10, font=uifont(12),
            fg_color=col("input"), border_color=col("border"), text_color=col("text"),
        )
        self.name_entry.pack(fill="x")
        self.name_entry._entry.bind("<Key>", lambda e: setattr(self, "_name_touched", True), "+")

        self.section(card, t("dlg_save"), padx=22)
        row3 = ctk.CTkFrame(card, fg_color="transparent")
        row3.pack(fill="x", padx=22)
        IconButton(row3, "folder-open", "", self._browse, style="soft", tooltip=t("u_browse"), padx=12, pady=8).pack(side=s_end())
        self.save_entry = ctk.CTkEntry(
            row3, height=38, corner_radius=10, font=uifont(12),
            fg_color=col("input"), border_color=col("border"), text_color=col("text"),
        )
        self.save_entry.insert(0, app.settings.get("folder", os.path.expanduser("~")))
        self.save_entry.pack(side=s_start(), fill="x", expand=True, padx=px_inline(0, 8))

        row4 = ctk.CTkFrame(card, fg_color="transparent")
        row4.pack(fill="x", padx=22, pady=(14, 0))
        ctk.CTkLabel(
            row4, text=bidi(t("dlg_chunks")), font=uifont(11, "bold"),
            text_color=col("text_muted"),
        ).pack(side=s_start(), padx=px_inline(0, 12))
        def_c = str(app.settings.get("default_chunks", 8))
        if def_c not in ("1", "4", "8", "16", "32"):
            def_c = "8"
        self.chunks_seg = SegmentedControl(row4, values=["1", "4", "8", "16", "32"], height=34, expand_items=False)
        self.chunks_seg.set(def_c)
        self.chunks_seg.pack(side=s_start())

        # Queue selector
        queues = getattr(app, "get_all_queues", lambda: [{"id": "main", "name": t("queue_main")}])()
        self.q_names_map = {q.get("name", t("queue_main")): q.get("id", "main") for q in queues}
        q_options = list(self.q_names_map.keys()) or [t("queue_main")]
        active_q_name = q_options[0]
        if hasattr(app, "active_filter") and str(app.active_filter).startswith("queue_"):
            act_id = str(app.active_filter)[6:]
            for name, qid in self.q_names_map.items():
                if qid == act_id:
                    active_q_name = name
                    break
        self.queue_opt = ctk.CTkOptionMenu(
            row4, values=q_options, height=34, font=uifont(11),
            fg_color=col("card_alt"), text_color=col("text"), button_color=col("border_light"),
            dropdown_fg_color=col("card"), dropdown_text_color=col("text"),
            width=130
        )
        self.queue_opt.set(active_q_name)
        self.queue_opt.pack(side=s_end())
        ctk.CTkLabel(row4, text=bidi(t("queue_target")), font=uifont(11, "bold"), text_color=col("text_muted")).pack(side=s_end(), padx=px_inline(0, 6))

        self.url_var.trace_add("write", self._on_url)
        self._on_url()
        self.bind("<Return>", lambda e: self._submit(True))
        self.bind("<Control-Return>", lambda e: self._submit(False))

    def on_ready(self):
        self.url_entry.focus_set()
        self.url_entry._entry.select_range(0, "end")

    def _on_url(self, *a):
        url = self.url_var.get().strip()
        if not self._name_touched:
            self.name_var.set(extract_filename_from_url(url, "download_file.bin") if url else "")
        cat = detect_category(self.name_var.get() or "x.bin")
        self.cat_icon.configure(text=ico(CAT_ICON[cat]), text_color=col(CAT_COLOR[cat]))
        self.cat_text.configure(text=bidi(t(cat)))
        if self.err_lbl.cget("text"):
            self.err_lbl.configure(text="")
            self.url_entry.configure(border_color=col("border"))

    def _paste(self):
        try:
            self.url_var.set(self.clipboard_get().strip())
            self.url_entry.focus_set()
        except Exception:
            pass

    def _browse(self):
        sel = fd.askdirectory(initialdir=self.save_entry.get(), parent=self)
        if sel:
            self.save_entry.delete(0, "end")
            self.save_entry.insert(0, sel)

    def _submit(self, start_now):
        if self._submitting:
            return
        url = self.url_var.get().strip()
        if not is_valid_url(url):
            self.err_lbl.configure(text=bidi("⚠ " + t("u_bad_url")))
            self.url_entry.configure(border_color=col("danger"))
            self.url_entry.focus_set()
            return
        self._submitting = True
        if not re.match(r"^https?://", url, re.I):
            url = "http://" + url
        if is_media_platform_url(url) and not self.extra_headers:
            self.destroy()
            self.app.show_media_dialog(url)
            return
        name = E.sanitize_filename(self.name_var.get().strip() or "download_file.bin")
        folder = self.save_entry.get().strip() or self.app.settings["folder"]
        sel_chunks = int(self.chunks_seg.get() or self.app.settings.get("default_chunks", 8))
        chosen_qid = getattr(self, "q_names_map", {}).get(getattr(self, "queue_opt", None) and self.queue_opt.get(), "main")
        if self.on_submit:
            self.on_submit(
                url, os.path.join(folder, name), start_now,
                extra_headers=self.extra_headers or None, max_chunks=sel_chunks,
                queue_id=chosen_qid
            )
        self.destroy()


class DetailsDialog(BaseDialog):
    """Live details + IDM style segment map. Non-modal; any number can be open."""
    def __init__(self, app, task: DownloadTask):
        super().__init__(app, f"{t('dlg_prog_title')} {task.filename}", 710, 540, modal=False)
        self.task = task
        card = self.card()

        btns = ctk.CTkFrame(card, fg_color="transparent")
        btns.pack(fill="x", padx=18, pady=(12, 16), side="bottom")
        self.toggle_btn = IconButton(btns, "pause", t("u_pause"), self._toggle, style="soft")
        self.toggle_btn.pack(side=s_start())
        self.open_btn = IconButton(btns, "play", t("dlg_open_file"), self._open, style="primary")
        self.folder_btn = IconButton(btns, "folder-open", t("dlg_open_folder"), self._folder, style="soft")
        IconButton(btns, "xmark", t("u_close"), self.destroy, style="ghost").pack(side=s_end())

        hdr = ctk.CTkFrame(card, fg_color="transparent")
        hdr.pack(fill="x", padx=18, pady=(16, 10))
        cat = detect_category(task.filename)
        chip = ctk.CTkFrame(hdr, width=46, height=46, corner_radius=12, fg_color=col("card_alt"),
                            border_width=1, border_color=col("border_light"))
        chip.pack(side=s_start(), padx=px_inline(0, 12))
        chip.pack_propagate(False)
        ctk.CTkLabel(chip, text=ico(CAT_ICON[cat]), font=ifont(20), text_color=col(CAT_COLOR[cat])).place(relx=.5, rely=.5, anchor="center")
        tb = ctk.CTkFrame(hdr, fg_color="transparent")
        tb.pack(side=s_start(), fill="x", expand=True)
        ctk.CTkLabel(tb, text=bidi(short_text(task.filename, 54)), anchor=a_start(), font=uifont(15, "bold"),
                     text_color=col("text")).pack(fill="x")
        ctk.CTkLabel(tb, text=short_text(task.url, 78), anchor=a_start(), font=uifont(11),
                     text_color=col("text_muted")).pack(fill="x")

        grid = ctk.CTkFrame(card, corner_radius=10, fg_color=col("header"), border_width=1, border_color=col("border_light"))
        grid.pack(fill="x", padx=18, pady=(0, 12))
        grid.grid_columnconfigure((0, 1, 2, 3), weight=1, uniform="s")
        self.vals = {}
        items = [("dlg_file_size", 0, 0), ("dlg_downloaded", 1, 0), ("dlg_transfer_rate", 2, 0),
                 ("dlg_time_left", 3, 0), ("dlg_resume_cap", 0, 1), ("col_status", 1, 1),
                 ("dlg_segments", 2, 1), ("col_progress", 3, 1)]
        titles = {"dlg_segments": "Connections" if E.LANG == "en" else "الاتصالات"}
        stk = "e" if is_rtl() else "w"
        for key, c_idx, r in items:
            col_actual = (3 - c_idx) if is_rtl() else c_idx
            ctk.CTkLabel(
                grid, text=bidi(titles.get(key, t(key)).rstrip(":")), anchor=a_start(),
                font=uifont(10, "bold"), text_color=col("text_muted"),
            ).grid(row=r * 2, column=col_actual, sticky=stk, padx=12, pady=(8, 0))
            lbl = ctk.CTkLabel(grid, text="--", anchor=a_start(), font=uifont(13, "bold"), text_color=col("text"))
            lbl.grid(row=r * 2 + 1, column=col_actual, sticky=stk, padx=12, pady=(0, 8))
            self.vals[key] = lbl

        self.bar = ctk.CTkProgressBar(card, height=12, corner_radius=6, progress_color=col("primary"), fg_color=col("track"))
        self.bar.pack(fill="x", padx=18, pady=(0, 12))
        self.bar.set(0)

        ctk.CTkLabel(card, text=bidi(t("dlg_segments")), anchor=a_start(), font=uifont(11, "bold"),
                     text_color=col("text_muted")).pack(fill="x", padx=18)
        self.canvas = tk.Canvas(card, height=44, highlightthickness=1, highlightbackground=cur("border_light"),
                                bd=0, bg=cur("header"))
        self.canvas.pack(fill="x", padx=18, pady=(4, 0))

        self._done_shown = False
        self.bind("<space>", lambda e: self._toggle())
        self._tick()

    def _toggle(self):
        self.app.toggle_task(self.task)

    def _open(self):
        if os.path.exists(self.task.save_path):
            os.startfile(self.task.save_path)

    def _folder(self):
        subprocess.run(["explorer", f"/select,{os.path.normpath(self.task.save_path)}"])

    def _tick(self):
        try:
            if not self.winfo_exists():
                return
        except Exception:
            return
        task = self.task
        prog = task.get_progress()
        pct = 1.0 if task.is_completed else prog["percent"]
        self.bar.set(pct)
        spd = prog["speed_bps"]
        rem = max(0, task.total_size - prog["downloaded"])
        self.vals["dlg_file_size"].configure(text=fmt_size(task.total_size) if task.total_size else "--")
        self.vals["dlg_downloaded"].configure(text=fmt_size(prog["downloaded"]))
        self.vals["dlg_transfer_rate"].configure(text=fmt_speed(spd) if spd else "--")
        self.vals["dlg_time_left"].configure(text=fmt_eta(rem / spd) if spd > 0 and task.total_size > 0 else "--")
        self.vals["dlg_resume_cap"].configure(text=bidi(t("dlg_yes") if task.can_resume else t("dlg_no")))
        self.vals["col_status"].configure(text=bidi(state_view(task)[1]))
        self.vals["dlg_segments"].configure(text=f"{prog['active_chunks']} / {prog['total_chunks']}")
        self.vals["col_progress"].configure(text=f"{pct * 100:.1f}%")
        if task.state == "active":
            self.toggle_btn.set_text(t("u_pause"))
            self.toggle_btn.set_icon("pause")
        else:
            self.toggle_btn.set_text(t("u_resume"))
            self.toggle_btn.set_icon("play")
        if task.is_completed and not self._done_shown:
            self._done_shown = True
            self.toggle_btn.pack_forget()
            self.open_btn.pack(side=s_start())
            self.folder_btn.pack(side=s_start(), padx=px_inline(8, 0))
        self._draw_segments(pct)
        if self.winfo_exists() and not getattr(self.app, "is_closing", False):
            j = self.after(300, self._tick)
            if hasattr(self, "_scheduled_jobs"):
                self._scheduled_jobs.append(j)

    def _draw_segments(self, pct):
        c = self.canvas
        c.delete("all")
        w = max(c.winfo_width(), 100)
        h = 44
        tot = self.task.total_size
        if tot > 0 and self.task.chunks:
            for ch in self.task.chunks:
                with ch.lock:
                    s = int(ch.start_byte / tot * w)
                    e = int(ch.end_byte / tot * w) if ch.end_byte > 0 else w
                    d = int((ch.start_byte + ch.downloaded_bytes) / tot * w)
                    done = ch.is_completed
                c.create_rectangle(s, 2, e, h - 2, outline=cur("border_light"), fill=cur("track"))
                if d > s:
                    c.create_rectangle(s, 3, d, h - 3, outline="", fill=cur("success") if done else cur("primary"))
        else:
            c.create_rectangle(0, 0, int(pct * w), h, fill=cur("primary"), outline="")


class SpeedLimiterDialog(BaseDialog):
    PRESETS = ((256, "256 KB/s"), (512, "512 KB/s"), (1024, "1 MB/s"), (2048, "2 MB/s"), (5120, "5 MB/s"), (10240, "10 MB/s"))

    def __init__(self, app):
        super().__init__(app, t("lim_title"), 510, 390)
        card = self.card()
        self.dialog_header(card, "gauge", t("lim_title"), icon_color="primary_text", padx=20, pady=(16, 4))

        btns = ctk.CTkFrame(card, fg_color="transparent")
        btns.pack(fill="x", padx=20, pady=(12, 16), side="bottom")
        IconButton(btns, "xmark", t("u_cancel"), self.destroy, style="ghost").pack(side=s_end())
        IconButton(btns, "check", t("u_save"), self._save, style="primary").pack(side=s_start())

        cur_limit = int(app.settings.get("global_limit_kb", 0))
        self.enable = ctk.BooleanVar(value=cur_limit > 0)
        make_switch(card, t("lim_enable"), self.enable, progress_color="primary", padx=20, pady=(10, 4))
        self.section(card, t("lim_max"), padx=20)
        self.entry = ctk.CTkEntry(
            card, height=38, corner_radius=9, font=uifont(12),
            fg_color=col("input"), border_color=col("border"), text_color=col("text"),
        )
        self.entry.insert(0, str(cur_limit or 1024))
        self.entry.pack(fill="x", padx=20)
        chips = ctk.CTkFrame(card, fg_color="transparent")
        chips.pack(fill="x", padx=20, pady=(10, 0))
        for kb, label in self.PRESETS:
            IconButton(chips, None, label, lambda k=kb: self._preset(k), style="soft", text_size=11, padx=9, pady=6).pack(
                side=s_start(), padx=px_inline(0, 6),
            )
        self.bind("<Return>", lambda e: self._save())

    def on_ready(self):
        self.entry.focus_set()

    def _preset(self, kb):
        self.enable.set(True)
        self.entry.delete(0, "end")
        self.entry.insert(0, str(kb))

    def _save(self):
        try:
            val = max(0, int(self.entry.get().strip() or "0")) if self.enable.get() else 0
        except ValueError:
            self.entry.configure(border_color=col("danger"))
            return
        self.app.apply_global_limit(val)
        self.destroy()


class SchedulerDialog(BaseDialog):
    def __init__(self, app):
        super().__init__(app, t("sched_title"), 500, 390)
        card = self.card()
        self.dialog_header(card, "clock", t("sched_title"), icon_color="primary_text", padx=20, pady=(16, 4))

        btns = ctk.CTkFrame(card, fg_color="transparent")
        btns.pack(fill="x", padx=20, pady=(12, 16), side="bottom")
        IconButton(btns, "xmark", t("u_cancel"), self.destroy, style="ghost").pack(side=s_end())
        IconButton(btns, "check", t("sched_save"), self._save, style="primary").pack(side=s_start())
        IconButton(btns, "eraser", t("u_clear"), self._clear, style="soft").pack(side=s_start(), padx=px_inline(8, 0))

        self.section(card, t("sched_start_queue"), padx=20)
        self.entry = ctk.CTkEntry(
            card, height=38, corner_radius=9, font=uifont(12), placeholder_text="HH:MM  (e.g. 02:30)",
            fg_color=col("input"), border_color=col("border"), text_color=col("text"),
        )
        if app.settings.get("schedule_start", ""):
            self.entry.insert(0, app.settings.get("schedule_start", ""))
        self.entry.pack(fill="x", padx=20)
        self.err = ctk.CTkLabel(card, text="", anchor=a_start(), font=uifont(11, "bold"), text_color=col("danger"))
        self.err.pack(fill="x", padx=22, pady=(2, 0))
        self.shutdown = ctk.BooleanVar(value=app.settings.get("shutdown_when_done", False))
        make_switch(card, t("sched_shutdown"), self.shutdown, progress_color="danger", padx=20, pady=(10, 0))
        self.bind("<Return>", lambda e: self._save())

    def on_ready(self):
        self.entry.focus_set()

    def _clear(self):
        self.entry.delete(0, "end")
        self._save()

    def _save(self):
        text = self.entry.get().strip()
        if text:
            try:
                parse_hhmm(text)
            except Exception:
                self.err.configure(text=bidi("⚠ " + t("u_bad_time")))
                self.entry.configure(border_color=col("danger"))
                return
        self.app.apply_schedule(text, bool(self.shutdown.get()))
        self.destroy()


def parse_batch_pattern(template, from_num=1, to_num=10, digits=1):
    template = template.strip()
    num_bracket = re.search(r"\[(\d+)-(\d+)\]", template)
    if num_bracket:
        s_str, e_str = num_bracket.group(1), num_bracket.group(2)
        s, e = int(s_str), int(e_str)
        pad = len(s_str) if s_str.startswith("0") and len(s_str) > 1 else 0
        if s <= e and (e - s) <= 1000:
            return [f"{template[:num_bracket.start()]}{str(i).zfill(pad)}{template[num_bracket.end():]}" for i in range(s, e + 1)]

    char_bracket = re.search(r"\[([a-zA-Z])-([a-zA-Z])\]", template)
    if char_bracket:
        s_c, e_c = char_bracket.group(1), char_bracket.group(2)
        s, e = ord(s_c), ord(e_c)
        if s <= e and (e - s) <= 100:
            return [f"{template[:char_bracket.start()]}{chr(i)}{template[char_bracket.end():]}" for i in range(s, e + 1)]

    if "*" in template:
        if from_num <= to_num and (to_num - from_num) <= 1000:
            return [template.replace("*", str(i).zfill(digits), 1) for i in range(from_num, to_num + 1)]

    return []


class BatchDownloadDialog(BaseDialog):
    """Dialog for generating and queuing sequential URL patterns."""
    def __init__(self, app):
        super().__init__(app, t("dlg_batch_title"), 680, 610)
        self.app = app
        self.generated_links = []
        self._submitting = False
        card = self.card()

        self.dialog_header(card, "list", t("dlg_batch_title"), icon_color="primary_text", padx=20, pady=(15, 6))

        btns = ctk.CTkFrame(card, fg_color="transparent")
        btns.pack(fill="x", padx=20, pady=(8, 16), side="bottom")
        IconButton(btns, "xmark", t("u_cancel"), self.destroy, style="ghost").pack(side=s_end())
        self.btn_submit = IconButton(btns, "check", t("dlg_batch_add"), self._submit, style="primary")
        self.btn_submit.pack(side=s_start())

        body = ctk.CTkFrame(card, fg_color="transparent")
        body.pack(fill="both", expand=True, padx=20, pady=2)

        ctk.CTkLabel(body, text=bidi(t("dlg_batch_address")), anchor=a_start(), font=uifont(11, "bold"),
                     text_color=col("text_muted")).pack(fill="x", pady=(2, 3))

        self.entry_template = ctk.CTkEntry(
            body, height=36, corner_radius=9, font=uifont(12), fg_color=col("input"),
            border_color=col("border"), text_color=col("text"),
            placeholder_text="https://example.com/files/part_[01-20].zip",
        )
        self.entry_template.pack(fill="x", pady=(0, 4))
        self.entry_template.bind("<KeyRelease>", lambda e: self._on_template_change())

        hint_text = (
            "أنماط مدعومة: [01-20] للأرقام  |  [a-z] للحروف  |  * للنجمة مع تحديد النطاق"
            if E.LANG == "ar"
            else "Patterns: [01-20] for numbers  |  [a-z] for letters  |  * for wildcard range"
        )
        ctk.CTkLabel(body, text=bidi(hint_text), anchor=a_start(), font=uifont(10), text_color=col("text_muted")).pack(fill="x", pady=(0, 6))

        self.range_frame = ctk.CTkFrame(body, fg_color=col("card_alt"), corner_radius=9, border_width=1, border_color=col("border_light"))
        self.range_frame.pack(fill="x", pady=(0, 8))

        rf_inner = ctk.CTkFrame(self.range_frame, fg_color="transparent")
        rf_inner.pack(fill="x", padx=12, pady=7)
        side = s_start()

        ctk.CTkLabel(rf_inner, text=bidi(t("dlg_batch_range")), font=uifont(11, "bold"), text_color=col("text")).pack(
            side=side, padx=px_inline(0, 10),
        )
        ctk.CTkLabel(rf_inner, text=bidi(t("dlg_batch_from")), font=uifont(11), text_color=col("text_muted")).pack(
            side=side, padx=px_inline(0, 4),
        )
        self.spin_from = ctk.CTkEntry(rf_inner, width=54, height=30, corner_radius=7, font=uifont(12),
                                      fg_color=col("input"), border_color=col("border"), text_color=col("text"))
        self.spin_from.insert(0, "1")
        self.spin_from.pack(side=side, padx=px_inline(0, 10))
        self.spin_from.bind("<KeyRelease>", lambda e: self._on_template_change())

        ctk.CTkLabel(rf_inner, text=bidi(t("dlg_batch_to")), font=uifont(11), text_color=col("text_muted")).pack(
            side=side, padx=px_inline(0, 4),
        )
        self.spin_to = ctk.CTkEntry(rf_inner, width=54, height=30, corner_radius=7, font=uifont(12),
                                    fg_color=col("input"), border_color=col("border"), text_color=col("text"))
        self.spin_to.insert(0, "10")
        self.spin_to.pack(side=side, padx=px_inline(0, 10))
        self.spin_to.bind("<KeyRelease>", lambda e: self._on_template_change())

        ctk.CTkLabel(rf_inner, text=bidi(t("dlg_batch_digits")), font=uifont(11), text_color=col("text_muted")).pack(
            side=side, padx=px_inline(0, 4),
        )
        self.spin_digits = ctk.CTkEntry(rf_inner, width=48, height=30, corner_radius=7, font=uifont(12),
                                        fg_color=col("input"), border_color=col("border"), text_color=col("text"))
        self.spin_digits.insert(0, "2")
        self.spin_digits.pack(side=side, padx=px_inline(0, 6))
        self.spin_digits.bind("<KeyRelease>", lambda e: self._on_template_change())

        prev_head = ctk.CTkFrame(body, fg_color="transparent")
        prev_head.pack(fill="x", pady=(2, 4))
        ctk.CTkLabel(prev_head, text=bidi(t("dlg_batch_preview")), font=uifont(11, "bold"),
                     text_color=col("text_muted")).pack(side=side)
        IconButton(
            prev_head, "file", "استيراد TXT" if E.LANG == "ar" else "Import .txt", self._import_file,
            style="soft", pady=4, padx=10, text_size=11,
        ).pack(side=side, padx=10)
        self.lbl_count = ctk.CTkLabel(
            prev_head, text=bidi(f"0 {t('dlg_batch_count')}"), font=uifont(11, "bold"),
            text_color=col("primary_text"),
        )
        self.lbl_count.pack(side=s_end())

        self.preview_box = ctk.CTkTextbox(
            body, height=118, corner_radius=9, fg_color=col("input"),
            border_width=1, border_color=col("border"), text_color=col("text"), font=monofont(10),
        )
        self.preview_box.pack(fill="both", expand=True, pady=(0, 8))
        self.preview_box.bind("<KeyRelease>", lambda e: self._on_box_change())

        ctk.CTkLabel(body, text=bidi(t("dlg_save")), anchor=a_start(), font=uifont(11, "bold"),
                     text_color=col("text_muted")).pack(fill="x", pady=(0, 2))
        frow = ctk.CTkFrame(body, fg_color="transparent")
        frow.pack(fill="x", pady=(0, 4))
        IconButton(frow, "folder-open", "", self._browse, style="soft", pady=6, padx=10).pack(side=s_end())
        self.folder = ctk.CTkEntry(
            frow, height=34, corner_radius=8, font=uifont(12), fg_color=col("input"),
            border_color=col("border"), text_color=col("text"),
        )
        self.folder.insert(0, app.settings.get("folder", ""))
        self.folder.pack(side=s_start(), fill="x", expand=True, padx=px_inline(0, 6))

        self.v_start = ctk.BooleanVar(value=True)
        make_checkbox(body, t("dlg_batch_start_now"), self.v_start, pady=(2, 2))

        try:
            cb = self.clipboard_get().strip()
            if cb.startswith("http"):
                self.entry_template.insert(0, cb)
        except Exception:
            pass

        self._on_template_change()

    def _browse(self):
        sel = fd.askdirectory(initialdir=self.folder.get(), parent=self)
        if sel:
            self.folder.delete(0, "end")
            self.folder.insert(0, sel)

    def _import_file(self):
        sel = fd.askopenfilename(filetypes=[("Text files (*.txt)", "*.txt"), ("All files", "*.*")], parent=self)
        if not sel:
            return
        try:
            with open(sel, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            urls = URL_REGEX.findall(content)
            if urls:
                self.generated_links = urls
                self.preview_box.delete("1.0", "end")
                self.preview_box.insert("1.0", "\n".join(urls))
                self.lbl_count.configure(text=bidi(f"{len(urls)} {t('dlg_batch_count')}"), text_color=col("primary_text"))
                self.btn_submit.set_enabled(True)
                self.app.toast(t("u_added"), f"{len(urls)} {t('u_downloads')}", accent="cyan", icon="clipboard")
            else:
                self.app.toast("No links", "No valid URLs found in file", accent="warning", icon="warning")
        except Exception as e:
            self.app.toast("Error", str(e), accent="danger", icon="circle-xmark")

    def _on_box_change(self):
        box_text = self.preview_box.get("1.0", "end").strip()
        lines = [line.strip() for line in box_text.splitlines() if line.strip().startswith("http")]
        if lines:
            self.lbl_count.configure(text=bidi(f"{len(lines)} {t('dlg_batch_count')}"), text_color=col("primary_text"))
            self.btn_submit.set_enabled(True)
        else:
            self.lbl_count.configure(text=bidi(f"0 {t('dlg_batch_count')}"), text_color=col("text_muted"))
            self.btn_submit.set_enabled(False)

    def _on_template_change(self):
        tmpl = self.entry_template.get().strip()
        try:
            fn = int(self.spin_from.get() or 1)
        except Exception:
            fn = 1
        try:
            tn = int(self.spin_to.get() or 10)
        except Exception:
            tn = 10
        try:
            dg = int(self.spin_digits.get() or 1)
        except Exception:
            dg = 1

        self.generated_links = parse_batch_pattern(tmpl, from_num=fn, to_num=tn, digits=dg)
        self.preview_box.delete("1.0", "end")
        if self.generated_links:
            self.preview_box.insert("1.0", "\n".join(self.generated_links))
            self.lbl_count.configure(text=bidi(f"{len(self.generated_links)} {t('dlg_batch_count')}"), text_color=col("primary_text"))
            self.btn_submit.set_enabled(True)
        else:
            self.preview_box.insert("1.0", bidi(t("dlg_batch_no_links")))
            self.lbl_count.configure(text=bidi(f"0 {t('dlg_batch_count')}"), text_color=col("text_muted"))
            self.btn_submit.set_enabled(False)

    def _submit(self):
        if self._submitting:
            return
        box_text = self.preview_box.get("1.0", "end").strip()
        lines = [line.strip() for line in box_text.splitlines() if line.strip().startswith("http")]
        links = lines if lines else self.generated_links
        if not links:
            return
        self._submitting = True
        folder = self.folder.get().strip() or self.app.settings["folder"]
        start_now = bool(self.v_start.get())
        count = 0
        for link in links:
            fn = extract_filename_from_url(link, f"file_{count + 1}.bin")
            save_p = os.path.join(folder, fn)
            if is_media_platform_url(link) and find_ytdlp_executable():
                self.app.add_media_task(link, save_p, start_now=start_now, silent_toast=True)
            else:
                self.app.add_task(link, save_p, start_now=start_now, silent_toast=True, max_chunks=4)
            count += 1
        self.app.toast(t("dlg_batch_added"), f"{count} {t('u_downloads')}", accent="primary", icon="list")
        self.destroy()


class MediaGrabberDialog(BaseDialog):
    """Smart Video & Audio Grabber powered by standalone yt-dlp + FFmpeg with 1-click engine setup."""
    def __init__(self, app, default_url="", audio_only=False, suggested_title=""):
        super().__init__(app, t("vid_title"), 760, 680)
        self.app = app
        self._busy = False
        self._probed_info = None
        self.qualities = self._default_qualities()
        self.initial_audio_only = bool(audio_only)
        card = self.card()

        self.dialog_header(card, "film", t("vid_title"), icon_color="danger", padx=20, pady=(15, 6))

        # Bottom buttons
        btns = ctk.CTkFrame(card, fg_color="transparent")
        btns.pack(fill="x", padx=20, pady=(8, 15), side="bottom")
        IconButton(btns, "xmark", t("u_cancel"), self.destroy, style="ghost").pack(side=s_end())
        self.btn_now = IconButton(btns, "download", t("u_download_now"), lambda: self._submit(True), style="primary")
        self.btn_now.pack(side=s_start())
        self.btn_later = IconButton(btns, "clock", t("u_later"), lambda: self._submit(False), style="soft")
        self.btn_later.pack(side=s_start(), padx=px_inline(8, 0))

        # Engine setup banner
        self.eng_bar = ctk.CTkFrame(card, corner_radius=10, fg_color=col("header"), border_width=1, border_color=col("border_light"))
        self.eng_bar.pack(fill="x", padx=20, pady=(2, 6))
        self.eng_inner = ctk.CTkFrame(self.eng_bar, fg_color="transparent")
        self.eng_inner.pack(fill="x", padx=12, pady=7)
        self.btn_eng = IconButton(
            self.eng_inner, "download", t("vid_eng_install"), self._install_or_update_engine,
            style="primary", text_size=11, padx=10, pady=6,
        )
        self.btn_eng.pack(side=s_end())
        self.lbl_eng = ctk.CTkLabel(self.eng_inner, text="", font=uifont(11, "bold"), anchor=a_start())
        self.lbl_eng.pack(side=s_start(), fill="x", expand=True, padx=px_inline(0, 8))
        self.eng_prog = ctk.CTkProgressBar(self.eng_bar, height=5, corner_radius=3, progress_color=col("accent_cyan"), fg_color=col("track"))
        self.eng_prog.set(0)
        self._refresh_engine_banner()

        body = ctk.CTkFrame(card, fg_color="transparent")
        body.pack(fill="both", expand=True, padx=20, pady=2)

        # 1. URL Row
        ctk.CTkLabel(body, text=bidi(t("vid_url_lbl")), anchor=a_start(), font=uifont(11, "bold"),
                     text_color=col("text_muted")).pack(fill="x", pady=(4, 3))
        urow = ctk.CTkFrame(body, fg_color="transparent")
        urow.pack(fill="x")
        self.url_var = ctk.StringVar(value=default_url)
        self.btn_analyze = IconButton(urow, "search", t("vid_analyze"), self._analyze, style="primary", pady=8)
        self.btn_analyze.pack(side=s_end())
        IconButton(urow, "clipboard", "", self._paste, style="soft", tooltip=t("u_paste"), pady=8, padx=10).pack(
            side=s_end(), padx=px_inline(0, 6),
        )
        self.url_entry = ctk.CTkEntry(
            urow, textvariable=self.url_var, height=38, corner_radius=9, font=uifont(12),
            fg_color=col("input"), border_color=col("border"), text_color=col("text"),
            placeholder_text="https://www.youtube.com/watch?v=... / .m3u8",
        )
        self.url_entry.pack(side=s_start(), fill="x", expand=True, padx=px_inline(0, 6))

        self.lbl_status = ctk.CTkLabel(
            body, text=bidi(t("vid_info_ph")), anchor=a_start(), font=uifont(11),
            text_color=col("text_muted"),
        )
        self.lbl_status.pack(fill="x", pady=(5, 4))

        # 2. Info Card
        info_card = ctk.CTkFrame(body, corner_radius=10, fg_color=col("card_alt"), border_width=1, border_color=col("border_light"))
        info_card.pack(fill="x", pady=(2, 8))
        ic_in = ctk.CTkFrame(info_card, fg_color="transparent")
        ic_in.pack(fill="x", padx=12, pady=8)

        ctk.CTkLabel(ic_in, text=bidi(t("dlg_name")), anchor=a_start(), font=uifont(10, "bold"),
                     text_color=col("text_muted")).pack(fill="x")
        self.title_var = ctk.StringVar(value=suggested_title)
        self.title_entry = ctk.CTkEntry(
            ic_in, textvariable=self.title_var, height=34, corner_radius=8, font=uifont(12),
            fg_color=col("input"), border_color=col("border"), text_color=col("text"),
        )
        self.title_entry.pack(fill="x", pady=(2, 5))

        self.lbl_meta = ctk.CTkLabel(ic_in, text="--", anchor=a_start(), font=uifont(11), text_color=col("accent_cyan"))
        self.lbl_meta.pack(fill="x")

        # 3. Quality Header Row with Audio-Only Switch
        q_hdr = ctk.CTkFrame(body, fg_color="transparent")
        q_hdr.pack(fill="x", pady=(2, 3))
        ctk.CTkLabel(q_hdr, text=bidi(t("vid_quality")), anchor=a_start(), font=uifont(11, "bold"),
                     text_color=col("text_muted")).pack(side=s_start())

        self.v_audio_only = ctk.BooleanVar(value=self.initial_audio_only)
        make_checkbox(q_hdr, t("vid_audio_only_switch"), self.v_audio_only, command=self._on_audio_only_toggle, side=s_end())

        q_labels = [bidi(q["label"]) for q in self.qualities]
        self.q_var = ctk.StringVar(value=q_labels[0])
        self.q_menu = ctk.CTkOptionMenu(
            body, variable=self.q_var, values=q_labels, height=36, corner_radius=9,
            font=uifont(12, "bold"), dropdown_font=uifont(12),
            fg_color=col("card_alt"), button_color=col("primary"), button_hover_color=col("primary_hover"),
            text_color=col("text"), dropdown_fg_color=col("card"), dropdown_text_color=col("text"),
        )
        self.q_menu.pack(fill="x", pady=(0, 8))

        # 4. Save Path + Target Queue Picker
        srow = ctk.CTkFrame(body, fg_color="transparent")
        srow.pack(fill="x", pady=(0, 4))

        side = s_start()
        ctk.CTkLabel(srow, text=bidi(t("dlg_save")), anchor=a_start(), font=uifont(11, "bold"),
                     text_color=col("text_muted")).pack(side=side, padx=px_inline(0, 6))
        IconButton(srow, "folder-open", "", self._browse, style="soft", tooltip=t("u_browse"), pady=6, padx=8).pack(
            side=side, padx=px_inline(0, 8)
        )
        self.save_entry = ctk.CTkEntry(
            srow, height=34, corner_radius=8, font=uifont(12), fg_color=col("input"),
            border_color=col("border"), text_color=col("text"),
        )
        self.save_entry.insert(0, app.settings.get("folder", ""))
        self.save_entry.pack(side=side, fill="x", expand=True, padx=px_inline(0, 10))

        # Target Queue
        ctk.CTkLabel(srow, text=bidi(t("spd_target_queue")), font=uifont(11, "bold"),
                     text_color=col("text_muted")).pack(side=side, padx=px_inline(0, 6))

        all_queues = self.app.get_all_queues() if hasattr(self.app, "get_all_queues") else [{"id": "main", "name": t("q_main_default")}]
        self.queue_map = {q.get("name") or q.get("id"): q.get("id") for q in all_queues}
        q_names = list(self.queue_map.keys()) or [t("q_main_default")]
        default_q_name = q_names[0]
        self.v_queue = ctk.StringVar(value=default_q_name)

        self.queue_opt = ctk.CTkOptionMenu(
            srow, values=q_names, variable=self.v_queue, height=32, corner_radius=8,
            font=uifont(11, "bold"), fg_color=col("seg_unselected"), button_color=col("primary"),
            button_hover_color=col("primary_hover"), text_color=col("text"), dropdown_font=uifont(11),
        )
        self.queue_opt.pack(side=side)

        self.bind("<Return>", lambda e: self._analyze())
        if self.initial_audio_only:
            self._on_audio_only_toggle()
        if default_url and find_ytdlp_executable():
            self.after(220, self._analyze)

    def on_ready(self):
        self.url_entry.focus_set()

    def _default_qualities(self):
        ff = E.has_ffmpeg()
        return [
            {"id": "best_auto", "label": t("vid_q_best"), "selector": "bv*+ba/b" if ff else "b[ext=mp4]/b", "audio_only": False, "ext": "mp4", "est_size": 0},
            {"id": "res_720", "label": "🎬  MP4 / Video  —  720p HD", "selector": "bv*[height<=720]+ba/b[height<=720]/b" if ff else "b[height<=720]/b", "audio_only": False, "ext": "mp4", "est_size": 0},
            {"id": "res_480", "label": "🎬  MP4 / Video  —  480p SD", "selector": "bv*[height<=480]+ba/b[height<=480]/b" if ff else "b[height<=480]/b", "audio_only": False, "ext": "mp4", "est_size": 0},
            {"id": "audio_only", "label": f"🎵  {t('vid_q_audio')}", "selector": "ba[ext=m4a]/ba/b", "audio_only": True, "ext": "mp3" if ff else "m4a", "est_size": 0},
        ]

    def _on_audio_only_toggle(self):
        is_audio = bool(self.v_audio_only.get())
        if is_audio:
            for q in self.qualities:
                if q.get("audio_only"):
                    self.q_var.set(bidi(q["label"]))
                    break
        else:
            if self.qualities:
                self.q_var.set(bidi(self.qualities[0]["label"]))

    def _refresh_engine_banner(self):
        exe = find_ytdlp_executable()
        ff = has_ffmpeg()
        if exe and ff:
            ready_lbl = (
                "محرك الفيديو والدمج عالي الجودة جاهز (yt-dlp + FFmpeg)"
                if E.LANG == "ar"
                else "HD Video & Audio Merger Ready (yt-dlp + FFmpeg)"
            )
            self.lbl_eng.configure(text=bidi(f"✔  {ready_lbl}"), text_color=col("success"))
            self.btn_eng.set_text(t("vid_eng_update"))
            self.btn_eng.set_icon("retry")
            self.eng_prog.pack_forget()
        elif exe and not ff:
            part_lbl = (
                "yt-dlp جاهز — اضغط لتفعيل محرك دمج 1080p/4K (FFmpeg)"
                if E.LANG == "ar"
                else "yt-dlp ready — click to enable 1080p/4K Merger (FFmpeg)"
            )
            self.lbl_eng.configure(text=bidi(f"⚡  {part_lbl}"), text_color=col("accent_cyan"))
            self.btn_eng.set_text(t("vid_eng_install"))
            self.btn_eng.set_icon("download")
            self.eng_prog.pack_forget()
        else:
            self.lbl_eng.configure(text=bidi(f"⚡  {t('vid_eng_missing')}"), text_color=col("warning"))
            self.btn_eng.set_text(t("vid_eng_install"))
            self.btn_eng.set_icon("download")

    def _install_or_update_engine(self):
        if self._busy:
            return
        self._busy = True
        self.btn_eng.set_enabled(False)
        self.lbl_eng.configure(text=bidi(t("vid_eng_installing")), text_color=col("accent_cyan"))
        self.eng_prog.set(0)
        self.eng_prog.pack(fill="x", padx=12, pady=(0, 6))
        proxy = self.app.get_active_proxy()

        def _prog(dl, tot):
            if tot > 0:
                self.after(0, lambda r=dl / tot, d=dl, t_b=tot: self._update_eng_prog(r, d, t_b))

        def _worker():
            ok, msg = install_or_update_ytdlp(progress_cb=_prog, proxy_url=proxy)
            self.after(0, lambda: self._on_eng_done(ok, msg))

        threading.Thread(target=_worker, daemon=True).start()

    def _update_eng_prog(self, ratio, dl, tot):
        if self.winfo_exists():
            self.eng_prog.set(min(1.0, max(0.0, ratio)))
            self.lbl_eng.configure(text=bidi(f"{t('vid_eng_installing')} {int(ratio * 100)}% ({fmt_size(dl)} / {fmt_size(tot)})"))

    def _on_eng_done(self, ok, msg):
        self._busy = False
        if not self.winfo_exists():
            return
        self.btn_eng.set_enabled(True)
        self._refresh_engine_banner()
        if ok:
            self.app.toast(t("vid_eng_updated"), os.path.basename(msg), accent="success", icon="check")
            if self.url_var.get().strip():
                self._analyze()
        else:
            self.lbl_status.configure(text=bidi(str(msg)), text_color=col("danger"))

    def _paste(self):
        try:
            self.url_var.set(self.clipboard_get().strip())
            self.url_entry.focus_set()
        except Exception:
            pass

    def _browse(self):
        sel = fd.askdirectory(initialdir=self.save_entry.get(), parent=self)
        if sel:
            self.save_entry.delete(0, "end")
            self.save_entry.insert(0, sel)

    def _analyze(self):
        if self._busy:
            return
        url = self.url_var.get().strip()
        if not is_valid_url(url):
            self.lbl_status.configure(text=bidi("⚠ " + t("u_bad_url")), text_color=col("danger"))
            return
        if not find_ytdlp_executable():
            self._install_or_update_engine()
            return
        if not re.match(r"^https?://", url, re.I):
            url = "https://" + url
            self.url_var.set(url)

        self._busy = True
        self.btn_analyze.set_enabled(False)
        self.lbl_status.configure(text=bidi(t("vid_analyzing")), text_color=col("accent_cyan"))
        proxy = self.app.get_active_proxy()

        def _worker():
            ok, res = probe_media_info(url, proxy_url=proxy)
            self.after(0, lambda: self._on_analyze_done(ok, res))

        threading.Thread(target=_worker, daemon=True).start()

    def _on_analyze_done(self, ok, res):
        self._busy = False
        if not self.winfo_exists():
            return
        self.btn_analyze.set_enabled(True)
        if not ok:
            if res == "NO_YTDLP":
                self._refresh_engine_banner()
            else:
                self.lbl_status.configure(text=bidi(str(res)), text_color=col("danger"))
            return

        self._probed_info = res
        self.title_var.set(res["title"])
        dur_txt = fmt_eta(res["duration"]) if res["duration"] > 0 else "--"
        stream_badge = f"{t('vid_stream_badge')}   •   " if res.get("is_stream") else ""
        meta = f"{stream_badge}{t('vid_platform')}: {res['platform']}   •   {t('vid_channel')}: {short_text(str(res['uploader']), 28)}   •   {t('vid_duration')}: {dur_txt}"
        self.lbl_meta.configure(text=bidi(meta))
        self.qualities = res["qualities"] or self._default_qualities()
        labels = [bidi(q["label"]) for q in self.qualities]
        self.q_menu.configure(values=labels)
        if self.v_audio_only.get():
            self._on_audio_only_toggle()
        else:
            self.q_var.set(labels[0])
        self.lbl_status.configure(text=bidi("✔  " + res["title"]), text_color=col("success"))

    def _submit(self, start_now: bool):
        url = self.url_var.get().strip()
        if not is_valid_url(url):
            self.lbl_status.configure(text=bidi("⚠ " + t("u_bad_url")), text_color=col("danger"))
            return
        if not find_ytdlp_executable():
            self._install_or_update_engine()
            return
        if not re.match(r"^https?://", url, re.I):
            url = "https://" + url

        sel_raw = strip_bidi(self.q_var.get())
        chosen = next((q for q in self.qualities if strip_bidi(q["label"]) == sel_raw), self.qualities[0])
        title_clean = E.sanitize_filename(self.title_var.get().strip() or extract_filename_from_url(url, "Video_Download"))
        base_stem, _ = os.path.splitext(title_clean)
        ext = chosen.get("ext", "mp4")
        folder = self.save_entry.get().strip() or self.app.settings.get("folder", os.path.expanduser("~"))
        save_path = os.path.join(folder, f"{base_stem or 'Video_Download'}.{ext}")
        target_queue_id = self.queue_map.get(self.v_queue.get(), "main")

        self.app.add_media_task(
            url=url,
            save_path=save_path,
            format_selector=chosen["selector"],
            audio_only=chosen["audio_only"],
            est_size=chosen.get("est_size", 0),
            start_now=start_now,
            queue_id=target_queue_id,
        )
        self.destroy()


class SiteGrabberDialog(BaseDialog):
    """
    Advanced Multi-Depth Webpage Link Grabber & Media Crawler (Phase 7).
    Extracts direct links, downloadable media, videos, audios, archives, docs, and programs.
    Features:
      - Multi-depth crawl (depth 1 single page, depth 2 deep crawl)
      - Same-domain filter toggle
      - Category chip filters + Real-time text search
      - Multithreaded live size probing via HEAD/Range
      - Target queue selection
      - Right-click context menu (Copy URL, Open in browser, Select all, Deselect all, Invert selection)
      - Live selection stats (items count + total size)
    """
    FILTER_CHIPS = (
        ("files", "spd_filter_files"),
        ("type_compressed", "type_compressed"),
        ("type_programs", "type_programs"),
        ("type_videos", "type_videos"),
        ("type_music", "type_music"),
        ("type_docs", "type_docs"),
        ("type_images", "spd_filter_images"),
        ("all", "spd_filter_all"),
    )

    def __init__(self, app, default_url=""):
        super().__init__(app, t("spd_title"), 920, 680)
        self.app = app
        self.all_items = []
        self.visible_idx = []
        self.active_cat = "files"
        self._scanning = False
        self._probing = False
        self._probe_cancel_event = threading.Event()
        self.crawl_depth = 1
        card = self.card()

        self.dialog_header(card, "globe", t("spd_title"), icon_color="accent_cyan", padx=20, pady=(14, 4))

        # Bottom buttons
        btns = ctk.CTkFrame(card, fg_color="transparent")
        btns.pack(fill="x", padx=20, pady=(6, 14), side="bottom")
        IconButton(btns, "xmark", t("u_cancel"), self.destroy, style="ghost").pack(side=s_end())
        self.btn_submit = IconButton(btns, "download", t("spd_download_sel"), self._submit, style="primary")
        self.btn_submit.pack(side=s_start())
        self.btn_submit.set_enabled(False)

        body = ctk.CTkFrame(card, fg_color="transparent")
        body.pack(fill="both", expand=True, padx=20, pady=2)

        # 1. URL Row
        ctk.CTkLabel(body, text=bidi(t("spd_url_lbl")), anchor=a_start(), font=uifont(11, "bold"),
                     text_color=col("text_muted")).pack(fill="x", pady=(2, 3))
        urow = ctk.CTkFrame(body, fg_color="transparent")
        urow.pack(fill="x")
        self.url_var = ctk.StringVar(value=default_url)
        self.btn_scan = IconButton(urow, "search", t("spd_scan"), self._scan_page, style="primary", pady=8)
        self.btn_scan.pack(side=s_end())
        IconButton(urow, "clipboard", "", self._paste, style="soft", tooltip=t("u_paste"), pady=8, padx=10).pack(
            side=s_end(), padx=px_inline(0, 6),
        )
        self.url_entry = ctk.CTkEntry(
            urow, textvariable=self.url_var, height=38, corner_radius=9, font=uifont(12),
            fg_color=col("input"), border_color=col("border"), text_color=col("text"),
            placeholder_text="https://example.com/resources",
        )
        self.url_entry.pack(side=s_start(), fill="x", expand=True, padx=px_inline(0, 6))

        # 2. Crawl Options Row: Depth (1 vs 2) + Same-domain checkbox
        opts_row = ctk.CTkFrame(body, fg_color="transparent")
        opts_row.pack(fill="x", pady=(6, 3))
        side = s_start()

        ctk.CTkLabel(opts_row, text=bidi(t("spd_depth")), font=uifont(11, "bold"),
                     text_color=col("text_muted")).pack(side=side, padx=px_inline(0, 6))
        self.depth_seg = SegmentedControl(
            opts_row,
            values=[t("spd_depth_1"), t("spd_depth_2")],
            command=self._on_depth_changed,
            height=30,
            expand_items=False,
        )
        self.depth_seg.pack(side=side, padx=px_inline(0, 16))

        self.v_same_domain = ctk.BooleanVar(value=True)
        make_checkbox(opts_row, t("spd_same_domain"), self.v_same_domain, side=side)

        # 3. Category Filter Chips
        chips_bar = ctk.CTkFrame(body, fg_color="transparent")
        chips_bar.pack(fill="x", pady=(6, 4))
        self.chip_btns = {}
        for key, lbl_key in self.FILTER_CHIPS:
            active = (key == self.active_cat)
            b = ctk.CTkButton(
                chips_bar, text=bidi(t(lbl_key)), height=28, width=42, corner_radius=8,
                font=uifont(11, "bold"),
                fg_color=col("primary") if active else col("seg_unselected"),
                hover_color=col("primary_hover") if active else col("row_hover"),
                text_color="#ffffff" if active else col("text"),
                command=lambda k=key: self._set_cat(k),
            )
            b.pack(side=side, padx=px_inline(0, 5))
            self.chip_btns[key] = b

        # 4. Search bar + Selection buttons + Size Prober + Counter
        sbar = ctk.CTkFrame(body, fg_color="transparent")
        sbar.pack(fill="x", pady=(3, 6))
        self.q_var = ctk.StringVar()
        self.q_entry = ctk.CTkEntry(
            sbar, height=32, width=220, corner_radius=8, font=uifont(12),
            fg_color=col("input"), border_color=col("border"), text_color=col("text"),
            placeholder_text=bidi(t("spd_search_ph")), justify=j_start(),
        )
        self.q_entry.pack(side=side, padx=px_inline(0, 6))
        self.q_entry.bind("<KeyRelease>", self._on_q_key)

        IconButton(
            sbar, "check", t("spd_sel_all"), lambda: self._toggle_all_visible(True),
            style="soft", text_size=11, padx=8, pady=5,
        ).pack(side=side, padx=px_inline(0, 4))
        IconButton(
            sbar, "eraser", t("spd_desel_all"), lambda: self._toggle_all_visible(False),
            style="soft", text_size=11, padx=8, pady=5,
        ).pack(side=side, padx=px_inline(0, 4))

        self.btn_probe = IconButton(
            sbar, "scale-balanced", t("spd_probe_sizes"), self._toggle_probe_sizes,
            style="soft", text_size=11, padx=8, pady=5,
        )
        self.btn_probe.pack(side=side, padx=px_inline(0, 4))
        self.btn_probe.set_enabled(False)

        self.lbl_count = ctk.CTkLabel(
            sbar, text=bidi(t("spd_empty")), font=uifont(11, "bold"),
            text_color=col("accent_cyan"),
        )
        self.lbl_count.pack(side=s_end())

        # 5. Treeview Table (with Size column!)
        tbl_wrap = ctk.CTkFrame(body, corner_radius=9, fg_color=col("card_alt"), border_width=1, border_color=col("border_light"))
        tbl_wrap.pack(fill="both", expand=True, pady=(0, 6))

        style = ttk.Style(self)
        try:
            style.theme_use("clam")
        except Exception:
            pass
        style.configure(
            "NegmSpider.Treeview",
            background=cur("card_alt"),
            fieldbackground=cur("card_alt"),
            foreground=cur("text"),
            rowheight=28,
            borderwidth=0,
            font=(UI_FONT, 10),
        )
        style.configure(
            "NegmSpider.Treeview.Heading",
            background=cur("header"),
            foreground=cur("text_muted"),
            relief="flat",
            font=(UI_FONT, 10, "bold"),
        )
        style.map(
            "NegmSpider.Treeview",
            background=[("selected", cur("row_select"))],
            foreground=[("selected", cur("text"))],
        )

        cols = ("chk", "name", "cat", "ext", "size", "url")
        self.tree = ttk.Treeview(tbl_wrap, columns=cols, show="headings", style="NegmSpider.Treeview", selectmode="browse")
        self.tree.heading("chk", text="☑")
        self.tree.heading("name", text=bidi(t("spd_col_name")), anchor="w")
        self.tree.heading("cat", text=bidi(t("spd_col_type")), anchor="w")
        self.tree.heading("ext", text=bidi(t("spd_col_ext")), anchor="center")
        self.tree.heading("size", text=bidi(t("spd_col_size")), anchor="center")
        self.tree.heading("url", text=bidi(t("spd_col_url")), anchor="w")

        self.tree.column("chk", width=38, stretch=False, anchor="center")
        self.tree.column("name", width=230, stretch=True, anchor="w")
        self.tree.column("cat", width=105, stretch=False, anchor="w")
        self.tree.column("ext", width=62, stretch=False, anchor="center")
        self.tree.column("size", width=85, stretch=False, anchor="center")
        self.tree.column("url", width=290, stretch=True, anchor="w")

        vsb = ttk.Scrollbar(tbl_wrap, orient="vertical", command=self.tree.yview)
        self.tree.configure(yscrollcommand=vsb.set)
        self.tree.pack(side=s_start(), fill="both", expand=True, padx=px_inline(2, 0), pady=2)
        vsb.pack(side=s_end(), fill="y", padx=px_inline(0, 2), pady=2)

        self.tree.bind("<ButtonRelease-1>", self._on_row_click)
        self.tree.bind("<space>", self._on_space_toggle)
        self.tree.bind("<Button-3>", self._on_tree_right_click)

        # 6. Bottom Config Row: Save Path + Target Queue Picker + Start Now
        frow = ctk.CTkFrame(body, fg_color="transparent")
        frow.pack(fill="x", pady=(0, 4))

        ctk.CTkLabel(frow, text=bidi(t("dlg_save")), font=uifont(11, "bold"),
                     text_color=col("text_muted")).pack(side=side, padx=px_inline(0, 6))
        IconButton(frow, "folder-open", "", self._browse, style="soft", pady=6, padx=8).pack(
            side=side, padx=px_inline(0, 10),
        )
        self.save_entry = ctk.CTkEntry(
            frow, height=34, corner_radius=8, font=uifont(12), fg_color=col("input"),
            border_color=col("border"), text_color=col("text"),
        )
        self.save_entry.insert(0, app.settings.get("folder", ""))
        self.save_entry.pack(side=side, fill="x", expand=True, padx=px_inline(0, 12))

        # Target Queue
        ctk.CTkLabel(frow, text=bidi(t("spd_target_queue")), font=uifont(11, "bold"),
                     text_color=col("text_muted")).pack(side=side, padx=px_inline(0, 6))

        all_queues = self.app.get_all_queues() if hasattr(self.app, "get_all_queues") else [{"id": "main", "name": t("q_main_default")}]
        self.queue_map = {q.get("name") or q.get("id"): q.get("id") for q in all_queues}
        q_names = list(self.queue_map.keys()) or [t("q_main_default")]
        default_q_name = q_names[0]
        self.v_queue = ctk.StringVar(value=default_q_name)

        self.queue_opt = ctk.CTkOptionMenu(
            frow, values=q_names, variable=self.v_queue, height=32, corner_radius=8,
            font=uifont(11, "bold"), fg_color=col("seg_unselected"), button_color=col("primary"),
            button_hover_color=col("primary_hover"), text_color=col("text"), dropdown_font=uifont(11),
        )
        self.queue_opt.pack(side=side, padx=px_inline(0, 12))

        self.v_start = ctk.BooleanVar(value=True)
        make_checkbox(frow, t("dlg_batch_start_now"), self.v_start, side=s_end())

        self.bind("<Return>", lambda e: self._scan_page())
        if default_url:
            self.after(200, self._scan_page)

    def on_ready(self):
        self.url_entry.focus_set()

    def destroy(self):
        self._probe_cancel_event.set()
        super().destroy()

    def _on_depth_changed(self, val):
        self.crawl_depth = 2 if val == t("spd_depth_2") else 1

    def _on_q_key(self, event=None):
        self.q_var.set(self.q_entry.get())
        self._refresh_table()

    def _paste(self):
        try:
            self.url_var.set(self.clipboard_get().strip())
            self.url_entry.focus_set()
        except Exception:
            pass

    def _browse(self):
        sel = fd.askdirectory(initialdir=self.save_entry.get(), parent=self)
        if sel:
            self.save_entry.delete(0, "end")
            self.save_entry.insert(0, sel)

    def _set_cat(self, key: str):
        self.active_cat = key
        for k, btn in self.chip_btns.items():
            active = (k == key)
            btn.configure(
                fg_color=col("primary") if active else col("seg_unselected"),
                hover_color=col("primary_hover") if active else col("row_hover"),
                text_color="#ffffff" if active else col("text"),
            )
        self._refresh_table()

    def _scan_page(self):
        if self._scanning:
            return
        url = self.url_var.get().strip()
        if not is_valid_url(url):
            self.lbl_count.configure(text=bidi("⚠ " + t("u_bad_url")), text_color=col("danger"))
            return
        self._scanning = True
        self.btn_scan.set_enabled(False)
        self.btn_probe.set_enabled(False)
        self.lbl_count.configure(text=bidi(t("spd_scanning")), text_color=col("accent_cyan"))
        proxy = self.app.get_active_proxy() if hasattr(self.app, "get_active_proxy") else ""
        depth = getattr(self, "crawl_depth", 1)
        same_domain = bool(self.v_same_domain.get())

        def _worker():
            ok, items = scrape_webpage_links(
                url,
                max_depth=depth,
                same_domain_only=same_domain,
                proxy_url=proxy,
                progress_callback=lambda msg: self.after(0, lambda: self._on_scan_progress(msg)),
            )
            self.after(0, lambda: self._on_scan_done(ok, items))

        threading.Thread(target=_worker, daemon=True).start()

    def _on_scan_progress(self, msg: str):
        if not self.winfo_exists():
            return
        self.lbl_count.configure(text=bidi(msg), text_color=col("accent_cyan"))

    def _on_scan_done(self, ok, items):
        self._scanning = False
        if not self.winfo_exists():
            return
        self.btn_scan.set_enabled(True)
        if not ok:
            self.lbl_count.configure(text=bidi(str(items)), text_color=col("danger"))
            return
        self.all_items = []
        has_files = any(it.get("is_file") for it in items)
        for it in items:
            d = dict(it)
            d["selected"] = bool(it.get("is_file") and it.get("category") != "type_images")
            self.all_items.append(d)

        self.btn_probe.set_enabled(len(self.all_items) > 0)
        if not has_files and items:
            self._set_cat("all")
        else:
            self._refresh_table()

    def _toggle_probe_sizes(self):
        if self._probing:
            self._probe_cancel_event.set()
            self._probing = False
            self.btn_probe.configure(text=bidi(t("spd_probe_sizes")), fg_color=col("card_alt"))
            self._update_counter()
            return

        file_items = [it for it in self.all_items if it.get("is_file") and it.get("size", 0) <= 0]
        if not file_items:
            return

        self._probing = True
        self._probe_cancel_event.clear()
        self.btn_probe.configure(text=bidi(t("u_cancel")), fg_color=col("warning"))
        self.lbl_count.configure(text=bidi(t("spd_probing")), text_color=col("accent_cyan"))

        def _done():
            self._probing = False
            if not self.winfo_exists():
                return
            self.btn_probe.configure(text=bidi(t("spd_probe_sizes")), fg_color=col("card_alt"))
            self._update_counter()

        def _worker():
            proxy = self.app.get_active_proxy() if hasattr(self.app, "get_active_proxy") else ""
            probe_spider_item_sizes(
                self.all_items,
                max_workers=8,
                proxy_url=proxy,
                callback=lambda idx, it: self.after(0, lambda: self._on_probe_item_size(idx, it)),
                cancel_event=self._probe_cancel_event,
            )
            self.after(0, _done)

        threading.Thread(target=_worker, daemon=True).start()

    def _on_probe_item_size(self, idx: int, it: dict):
        if not self.winfo_exists():
            return
        iid = str(idx)
        if self.tree.exists(iid):
            mark = "☑" if it.get("selected") else "☐"
            self.tree.item(
                iid,
                values=(
                    mark,
                    it["name"],
                    self._cat_label(it["category"]),
                    it["ext"].upper(),
                    it.get("size_str", "--"),
                    it["url"],
                ),
            )
        self._update_counter()

    def _cat_label(self, cat_key: str) -> str:
        if cat_key == "type_images":
            return bidi(t("spd_filter_images"))
        return bidi(t(cat_key))

    def _matches_item(self, it: dict) -> bool:
        if self.active_cat == "files":
            if not it.get("is_file"):
                return False
        elif self.active_cat != "all":
            if it.get("category") != self.active_cat:
                return False
        q = strip_bidi(self.q_var.get()).strip().lower()
        if q:
            if q not in it["name"].lower() and q not in it["url"].lower() and q.lstrip(".") != it["ext"].lower():
                return False
        return True

    def _refresh_table(self):
        self.tree.delete(*self.tree.get_children())
        self.visible_idx = []
        for idx, it in enumerate(self.all_items):
            if self._matches_item(it):
                self.visible_idx.append(idx)
                mark = "☑" if it.get("selected") else "☐"
                self.tree.insert(
                    "", "end", iid=str(idx),
                    values=(
                        mark,
                        it["name"],
                        self._cat_label(it["category"]),
                        it["ext"].upper(),
                        it.get("size_str", "--"),
                        it["url"],
                    ),
                )
        self._update_counter()

    def _update_counter(self):
        sel_items = [it for it in self.all_items if it.get("selected")]
        sel_n = len(sel_items)
        tot_n = len(self.visible_idx)
        total_bytes = sum(it.get("size", 0) for it in sel_items)
        size_str = f" ({fmt_size(total_bytes)})" if total_bytes > 0 else ""

        if not self.all_items:
            self.lbl_count.configure(text=bidi(t("spd_empty")), text_color=col("text_muted"))
        elif tot_n == 0:
            self.lbl_count.configure(text=bidi(t("spd_no_match")), text_color=col("warning"))
        else:
            self.lbl_count.configure(
                text=bidi(f"{sel_n}{size_str} {t('spd_selected_n')} {len(self.all_items)}"),
                text_color=col("primary_text") if sel_n > 0 else col("text_muted"),
            )
        self.btn_submit.set_enabled(sel_n > 0)

    def _on_row_click(self, event):
        region = self.tree.identify_region(event.x, event.y)
        if region not in ("cell", "tree"):
            return
        iid = self.tree.identify_row(event.y)
        if not iid:
            return
        idx = int(iid)
        self.all_items[idx]["selected"] = not self.all_items[idx]["selected"]
        it = self.all_items[idx]
        self.tree.item(
            iid,
            values=(
                "☑" if it["selected"] else "☐",
                it["name"],
                self._cat_label(it["category"]),
                it["ext"].upper(),
                it.get("size_str", "--"),
                it["url"],
            ),
        )
        self._update_counter()

    def _on_space_toggle(self, event):
        sel = self.tree.selection()
        if not sel:
            return
        iid = sel[0]
        idx = int(iid)
        self.all_items[idx]["selected"] = not self.all_items[idx]["selected"]
        it = self.all_items[idx]
        self.tree.item(
            iid,
            values=(
                "☑" if it["selected"] else "☐",
                it["name"],
                self._cat_label(it["category"]),
                it["ext"].upper(),
                it.get("size_str", "--"),
                it["url"],
            ),
        )
        self._update_counter()

    def _toggle_all_visible(self, flag: bool):
        for idx in self.visible_idx:
            self.all_items[idx]["selected"] = flag
            it = self.all_items[idx]
            self.tree.item(
                str(idx),
                values=(
                    "☑" if flag else "☐",
                    it["name"],
                    self._cat_label(it["category"]),
                    it["ext"].upper(),
                    it.get("size_str", "--"),
                    it["url"],
                ),
            )
        self._update_counter()

    def _invert_selection(self):
        for idx in self.visible_idx:
            it = self.all_items[idx]
            it["selected"] = not it.get("selected", False)
            self.tree.item(
                str(idx),
                values=(
                    "☑" if it["selected"] else "☐",
                    it["name"],
                    self._cat_label(it["category"]),
                    it["ext"].upper(),
                    it.get("size_str", "--"),
                    it["url"],
                ),
            )
        self._update_counter()

    def _on_tree_right_click(self, event):
        iid = self.tree.identify_row(event.y)
        if iid:
            self.tree.selection_set(iid)
            idx = int(iid)
            it = self.all_items[idx]
        else:
            it = None

        menu = tk.Menu(self, tearoff=0, bg=cur("card"), fg=cur("text"), activebackground=cur("primary"), activeforeground="#ffffff", disabledforeground=cur("text_muted"), font=(UI_FONT, 10))
        if it:
            target_url = it["url"]
            def _copy():
                try:
                    self.clipboard_clear()
                    self.clipboard_append(target_url)
                    if hasattr(self.app, "toast"):
                        self.app.toast(t("ctx_copy_link"), short_text(target_url, 45), accent="primary", icon="clipboard")
                except Exception:
                    pass

            menu.add_command(label=bidi(t("ctx_copy_link")), command=_copy)
            menu.add_command(label=bidi(t("spd_open_browser")), command=lambda u=target_url: webbrowser.open(u))
            menu.add_separator()

        menu.add_command(label=bidi(t("spd_sel_all")), command=lambda: self._toggle_all_visible(True))
        menu.add_command(label=bidi(t("spd_desel_all")), command=lambda: self._toggle_all_visible(False))
        menu.add_command(label=bidi(t("spd_invert_sel")), command=self._invert_selection)

        try:
            menu.tk_popup(event.x_root, event.y_root)
        finally:
            menu.grab_release()

    def _submit(self):
        chosen = [it for it in self.all_items if it.get("selected")]
        if not chosen:
            return
        folder = self.save_entry.get().strip() or self.app.settings.get("folder", os.path.expanduser("~"))
        target_queue_id = self.queue_map.get(self.v_queue.get(), "main")
        start_now = bool(self.v_start.get())
        added = 0

        for it in chosen:
            fn = E.sanitize_filename(it["name"] or extract_filename_from_url(it["url"], f"item_{added + 1}.bin"))
            if "." not in fn and it["ext"] not in ("web", "media", ""):
                fn = f"{fn}.{it['ext']}"
            save_p = os.path.join(folder, fn)
            if is_media_platform_url(it["url"]) and find_ytdlp_executable():
                t_obj = self.app.add_media_task(
                    it["url"], save_p, start_now=start_now, silent_toast=True, queue_id=target_queue_id
                )
            else:
                t_obj = self.app.add_task(
                    it["url"], save_p, start_now=start_now, silent_toast=True, queue_id=target_queue_id
                )
            if t_obj is not None:
                added += 1

        queue_name = self.v_queue.get()
        self.app.toast(t("dlg_batch_added"), f"{added} {t('u_downloads')} -> {queue_name}", accent="primary", icon="globe")
        self.destroy()


class ChecksumDialog(BaseDialog):
    """
    High-Performance Cryptographic Hash & File Integrity Verifier:
    - Multi-algorithm single-pass streaming: MD5, SHA-1, SHA-256, SHA-512, CRC32
    - Background worker thread with live percentage and throughput progress
    - Instant cryptographic verification and comparison with clipboard / user expected hash
    - One-click copy for individual hashes or full verification report
    """
    ALGOS = ("MD5", "SHA-1", "SHA-256", "SHA-512", "CRC32")

    def __init__(self, app, task):
        super().__init__(app, t("chk_dialog_title"), 680, 620)
        self.app = app
        self.task = task
        self.file_path = getattr(task, "save_path", "")
        self.cancel_event = threading.Event()
        card = self.card()

        self.dialog_header(card, "shield", t("chk_dialog_title"), icon_color="accent_cyan", padx=20, pady=(16, 6))

        # Bottom Actions Bar
        btns = ctk.CTkFrame(card, fg_color="transparent")
        btns.pack(fill="x", padx=20, pady=(8, 16), side="bottom")
        IconButton(btns, "xmark", t("u_close"), self._on_close, style="ghost").pack(side=s_end())
        IconButton(btns, "copy", t("chk_copy_all"), self._copy_all_hashes, style="soft", text_size=11).pack(side=s_start(), padx=(0, 6))
        IconButton(btns, "retry", "", self._start_hash_calc, style="ghost", tooltip=t("u_refresh"), pady=6, padx=8).pack(side=s_start())

        body = ctk.CTkFrame(card, fg_color="transparent")
        body.pack(fill="both", expand=True, padx=20, pady=4)

        # File Info Card
        info_card = ctk.CTkFrame(body, corner_radius=10, fg_color=col("card_alt"), border_width=1, border_color=col("border_light"))
        info_card.pack(fill="x", pady=(0, 8))
        ic_top = ctk.CTkFrame(info_card, fg_color="transparent")
        ic_top.pack(fill="x", padx=12, pady=(8, 4))
        ctk.CTkLabel(ic_top, text=ico("file"), font=ifont(13), text_color=col("primary_text")).pack(side=s_start(), padx=px_inline(0, 8))
        ctk.CTkLabel(ic_top, text=bidi(short_text(task.filename, 48)), font=uifont(12, "bold"), text_color=col("text")).pack(side=s_start())

        file_sz = os.path.getsize(self.file_path) if (self.file_path and os.path.exists(self.file_path)) else int(getattr(task, "total_size", 0) or 0)
        ctk.CTkLabel(ic_top, text=fmt_size(file_sz), font=uifont(11, "bold"), text_color=col("accent_cyan")).pack(side=s_end())

        # Progress bar & status
        self.prog_bar = ctk.CTkProgressBar(body, height=7, corner_radius=3, progress_color=col("accent_cyan"), fg_color=col("track"))
        self.prog_bar.set(0)
        self.prog_bar.pack(fill="x", pady=(0, 4))

        self.lbl_calc = ctk.CTkLabel(body, text=bidi(t("chk_computing")), font=uifont(10, "bold"), text_color=col("text_muted"), anchor=a_start())
        self.lbl_calc.pack(fill="x", pady=(0, 8))

        # 5 Hash algorithm rows
        self.hash_entries = {}
        for algo in self.ALGOS:
            row = ctk.CTkFrame(body, fg_color="transparent")
            row.pack(fill="x", pady=2)
            lbl_w = 72
            ctk.CTkLabel(row, text=algo + ":", width=lbl_w, anchor="w", font=monofont(10, "bold"), text_color=col("text")).pack(side="left")
            IconButton(row, "copy", "", lambda a=algo: self._copy_hash(a), style="ghost", tooltip=t("u_copy"), pady=5, padx=8).pack(side="right")
            ent = ctk.CTkEntry(
                row, height=30, corner_radius=6, font=monofont(10),
                fg_color=col("input"), border_color=col("border_light"), text_color=col("text"),
            )
            ent.pack(side="left", fill="x", expand=True, padx=(4, 6))
            self.hash_entries[algo] = ent

        # Compare & Verify Section
        ctk.CTkLabel(body, text=bidi(t("chk_compare_title")), anchor=a_start(), font=uifont(11, "bold"),
                     text_color=col("text_muted")).pack(fill="x", pady=(10, 3))

        cmp_wrap = ctk.CTkFrame(body, fg_color="transparent")
        cmp_wrap.pack(fill="x", pady=(0, 4))

        self.ent_compare = ctk.CTkEntry(
            cmp_wrap, height=34, corner_radius=8, font=monofont(10), fg_color=col("input"),
            border_color=col("border"), text_color=col("text"),
            placeholder_text=t("chk_compare_ph"),
        )
        self.ent_compare.pack(side="left", fill="x", expand=True, padx=(0, 6))
        self.ent_compare.bind("<KeyRelease>", lambda e: self._check_match())

        IconButton(cmp_wrap, "paste", t("u_paste"), self._paste_compare, style="soft", pady=5, text_size=10).pack(side="right")

        self.lbl_match = ctk.CTkLabel(body, text="", font=uifont(11, "bold"), anchor=a_start())
        self.lbl_match.pack(fill="x", pady=(2, 4))

        self.protocol("WM_DELETE_WINDOW", self._on_close)
        self._start_hash_calc()

    def _paste_compare(self):
        try:
            clip = self.clipboard_get().strip()
            if clip:
                self.ent_compare.delete(0, "end")
                self.ent_compare.insert(0, clip)
                self._check_match()
        except Exception:
            pass

    def _copy_hash(self, algo):
        txt = self.hash_entries[algo].get().strip()
        if txt:
            self.clipboard_clear()
            self.clipboard_append(txt)
            self.app.toast(t("chk_copied"), f"{algo}: {txt[:20]}...", accent="cyan", icon="check", duration=3000)

    def _copy_all_hashes(self):
        lines = [f"File: {self.task.filename}", f"Path: {self.file_path}"]
        for algo in self.ALGOS:
            val = self.hash_entries[algo].get().strip()
            if val:
                lines.append(f"{algo}: {val}")
        full_text = "\n".join(lines)
        self.clipboard_clear()
        self.clipboard_append(full_text)
        self.app.toast(t("chk_copied_all"), self.task.filename, accent="success", icon="check", duration=3500)

    def _check_match(self):
        target = strip_bidi(self.ent_compare.get()).strip().lower()
        if not target:
            self.lbl_match.configure(text="")
            self.ent_compare.configure(border_color=col("border"))
            return

        matched_algo = None
        for algo in self.ALGOS:
            val = self.hash_entries[algo].get().strip().lower()
            if val and val == target:
                matched_algo = algo
                break

        if matched_algo:
            self.lbl_match.configure(
                text=bidi(f"\u2714  {t('chk_match_success')} ({matched_algo})"),
                text_color=col("success")
            )
            self.ent_compare.configure(border_color=col("success"), border_width=2)
        else:
            self.lbl_match.configure(
                text=bidi(f"\u2716  {t('chk_match_failed')}"),
                text_color=col("danger")
            )
            self.ent_compare.configure(border_color=col("danger"), border_width=1.5)

    def _start_hash_calc(self):
        if not self.file_path or not os.path.exists(self.file_path):
            self.lbl_calc.configure(text=bidi(t("fn_not_found") if "fn_not_found" in E.I18N.get(E.LANG, {}) else "File not found on disk"), text_color=col("danger"))
            return

        self.cancel_event.clear()
        self.prog_bar.set(0)
        self.lbl_calc.configure(text=bidi(t("chk_computing")), text_color=col("text_muted"))

        def progress_cb(cur_b, tot_b, pct):
            if not self.cancel_event.is_set():
                self._safe_ui(lambda: self._update_prog(pct / 100.0, cur_b, tot_b))

        def worker():
            try:
                res = E.ChecksumCalculator.compute_file_hashes(
                    self.file_path,
                    on_progress=progress_cb,
                    cancel_token=self.cancel_event.is_set
                )
                if not self.cancel_event.is_set() and res:
                    self._safe_ui(lambda: self._on_hash_done(res))
            except Exception as e:
                self._safe_ui(lambda err=str(e): self.lbl_calc.configure(text=f"Error: {err}", text_color=col("danger")))

        t_thread = threading.Thread(target=worker, daemon=True)
        t_thread.start()

    def _safe_ui(self, fn):
        if self.cancel_event.is_set():
            return
        try:
            if self.winfo_exists():
                self.after(0, fn)
        except Exception:
            pass

    def _update_prog(self, ratio, processed, total):
        if self.winfo_exists():
            self.prog_bar.set(ratio)
            pct = int(ratio * 100)
            self.lbl_calc.configure(text=bidi(f"{t('chk_computing')} {pct}% ({fmt_size(processed)} / {fmt_size(total)})"))

    def _on_hash_done(self, res):
        if not self.winfo_exists():
            return
        self.prog_bar.set(1.0)
        self.lbl_calc.configure(text=bidi("\u2714 " + t("st_status_ok")), text_color=col("success"))
        for algo in self.ALGOS:
            val = res.get(algo, "")
            self.hash_entries[algo].delete(0, "end")
            self.hash_entries[algo].insert(0, val)
        self._check_match()

    def _on_close(self):
        self.cancel_event.set()
        self.destroy()

    def destroy(self):
        self.cancel_event.set()
        super().destroy()


class RefreshUrlDialog(BaseDialog):
    """
    Smart Expired Link Recovery & Address Refresh Wizard:
    - Replaces expired/broken download URL with a fresh one
    - Zero-loss resume: preserves all previously downloaded chunks (.negm.part)
    - One-click 'Open in Browser' to quickly fetch fresh download token
    - Background asynchronous Range & Size verification before applying
    - Instant error clearing and automatic download activation
    """
    def __init__(self, app, task):
        super().__init__(app, t("ref_dialog_title"), 660, 480)
        self.app = app
        self.task = task
        self._busy = False
        card = self.card()

        self.dialog_header(card, "redo", t("ref_dialog_title"), icon_color="accent_cyan", padx=20, pady=(16, 6))

        # Bottom Buttons Bar
        btns = ctk.CTkFrame(card, fg_color="transparent")
        btns.pack(fill="x", padx=20, pady=(8, 16), side="bottom")
        IconButton(btns, "xmark", t("u_cancel"), self.destroy, style="ghost").pack(side=s_end())
        self.btn_submit = IconButton(btns, "check", t("ref_btn_apply"), self._submit, style="primary")
        self.btn_submit.pack(side=s_start())

        body = ctk.CTkFrame(card, fg_color="transparent")
        body.pack(fill="both", expand=True, padx=20, pady=4)

        # File & Download Progress Card
        prog = task.get_progress()
        down_bytes = int(prog.get("downloaded", 0) or 0)
        tot_bytes = int(prog.get("total", 0) or task.total_size or 0)
        pct_val = prog.get("percent", 0.0)

        card_info = ctk.CTkFrame(body, corner_radius=10, fg_color=col("card_alt"), border_width=1, border_color=col("border_light"))
        card_info.pack(fill="x", pady=(0, 10))

        ci_top = ctk.CTkFrame(card_info, fg_color="transparent")
        ci_top.pack(fill="x", padx=12, pady=(8, 2))
        ctk.CTkLabel(ci_top, text=ico("bolt"), font=ifont(12), text_color=col("accent_cyan")).pack(side=s_start(), padx=px_inline(0, 6))
        ctk.CTkLabel(ci_top, text=bidi(short_text(task.filename, 48)), font=uifont(12, "bold"), text_color=col("text")).pack(side=s_start())

        ci_stat = f"{fmt_size(down_bytes)} / {fmt_size(tot_bytes)} ({pct_val:.1f}%)"
        ctk.CTkLabel(ci_top, text=bidi(ci_stat), font=uifont(11, "bold"), text_color=col("primary_text")).pack(side=s_end())

        pbar = ctk.CTkProgressBar(card_info, height=6, corner_radius=3, progress_color=col("accent_cyan"), fg_color=col("track"))
        pbar.set(min(1.0, max(0.0, pct_val / 100.0)))
        pbar.pack(fill="x", padx=12, pady=(2, 6))

        ctk.CTkLabel(
            card_info, text=bidi(t("ref_desc")), font=uifont(10), text_color=col("text_muted"), anchor=a_start()
        ).pack(fill="x", padx=12, pady=(0, 8))

        # Expired Original Link Row
        ctk.CTkLabel(body, text=bidi(t("ref_old_url")), anchor=a_start(), font=uifont(11, "bold"), text_color=col("text_muted")).pack(fill="x", pady=(2, 2))
        old_row = ctk.CTkFrame(body, fg_color="transparent")
        old_row.pack(fill="x", pady=(0, 8))

        self.old_entry = ctk.CTkEntry(
            old_row, height=32, corner_radius=8, font=uifont(11), fg_color=col("card_alt"),
            border_color=col("border_light"), text_color=col("text_muted")
        )
        self.old_entry.pack(side="left", fill="x", expand=True, padx=(0, 6))
        self.old_entry.insert(0, task.url)
        self.old_entry.configure(state="readonly")

        IconButton(old_row, "copy", "", lambda: self._copy_text(task.url), style="ghost", tooltip=t("u_copy"), pady=5, padx=8).pack(side="right")
        IconButton(old_row, "globe", t("ref_open_browser"), self._open_in_browser, style="soft", text_size=10, pady=5, padx=8).pack(side="right", padx=(0, 4))

        # Fresh Direct Link Row
        ctk.CTkLabel(body, text=bidi(t("ref_new_url")), anchor=a_start(), font=uifont(11, "bold"), text_color=col("text")).pack(fill="x", pady=(2, 2))
        new_row = ctk.CTkFrame(body, fg_color="transparent")
        new_row.pack(fill="x", pady=(0, 8))

        self.entry = ctk.CTkEntry(
            new_row, height=36, corner_radius=8, font=uifont(11), fg_color=col("input"),
            border_color=col("border"), text_color=col("text"), placeholder_text=t("ref_url_ph")
        )
        self.entry.pack(side="left", fill="x", expand=True, padx=(0, 6))
        self.entry.focus_set()

        IconButton(new_row, "paste", t("u_paste"), self._paste_new_url, style="soft", text_size=10, pady=6, padx=10).pack(side="right")

        # Range & Size Verification Option
        self.var_verify = tk.BooleanVar(value=True)
        chk = ctk.CTkCheckBox(
            body, text=bidi(t("ref_verify_chk")), variable=self.var_verify,
            font=uifont(11), fg_color=col("primary"), hover_color=col("primary_hover")
        )
        chk.pack(fill="x", pady=(2, 8))

        # Status Label
        self.lbl_status = ctk.CTkLabel(body, text="", font=uifont(11, "bold"), text_color=col("danger"), anchor=a_start())
        self.lbl_status.pack(fill="x", pady=(2, 4))

        self.bind("<Return>", lambda e: self._submit())

    def _copy_text(self, text: str):
        if text:
            self.clipboard_clear()
            self.clipboard_append(text)
            self.app.toast(t("u_copy"), text[:30] + "...", accent="cyan", icon="check", duration=2500)

    def _paste_new_url(self):
        try:
            clip = self.clipboard_get().strip()
            if clip:
                self.entry.delete(0, "end")
                self.entry.insert(0, clip)
        except Exception:
            pass

    def _open_in_browser(self):
        url = self.task.url
        if url:
            try:
                webbrowser.open(url)
            except Exception as e:
                messagebox.showerror("Error", str(e), parent=self)

    def _submit(self):
        if self._busy:
            return
        new_url = self.entry.get().strip()
        if not new_url or not URL_REGEX.fullmatch(new_url):
            self.lbl_status.configure(text=bidi("\u26a0 " + t("u_bad_url")), text_color=col("danger"))
            return

        self._busy = True
        self.btn_submit.set_enabled(False)
        self.lbl_status.configure(text=bidi(t("dlg_probing_lbl")), text_color=col("accent_cyan"))

        verify = self.var_verify.get()

        def worker():
            ok, msg = self.task.refresh_url(new_url, verify_match=verify)
            self._safe_ui(lambda: self._on_verify_done(ok, msg))

        threading.Thread(target=worker, daemon=True).start()

    def _safe_ui(self, fn):
        try:
            if self.winfo_exists():
                self.after(0, fn)
        except Exception:
            pass

    def _on_verify_done(self, ok: bool, msg: str):
        self._busy = False
        if not self.winfo_exists():
            return
        self.btn_submit.set_enabled(True)
        if ok:
            self.app.toast(t("ref_success"), self.task.filename, accent="success", icon="check", category=t("st_completed"))
            self.destroy()
            self.app.activate(self.task)
            self.app.save_state()
        else:
            self.lbl_status.configure(text=bidi(f"\u2716 {msg}"), text_color=col("danger"))


class ProxyEditDialog(BaseDialog):
    """Sub-dialog to add or edit a proxy server configuration."""
    PROTOCOLS = ("http", "https", "socks5", "socks4")

    def __init__(self, parent, on_save, proxy_data=None):
        title = t("pm_edit_btn") if proxy_data else t("pm_add_btn")
        super().__init__(parent.app, title, 520, 480)
        self.parent_dialog = parent
        self.on_save = on_save
        self.proxy_data = proxy_data or {}
        card = self.card()

        self.dialog_header(card, "globe", title, icon_color="accent_cyan", padx=20, pady=(14, 6))

        btns = ctk.CTkFrame(card, fg_color="transparent")
        btns.pack(fill="x", padx=20, pady=(8, 16), side="bottom")
        IconButton(btns, "xmark", t("u_cancel"), self.destroy, style="ghost").pack(side=s_end())
        IconButton(btns, "check", t("u_save"), self._save, style="primary").pack(side=s_start())

        body = ctk.CTkFrame(card, fg_color="transparent")
        body.pack(fill="both", expand=True, padx=20, pady=4)

        # Name
        ctk.CTkLabel(body, text=bidi(t("pm_col_name")), anchor=a_start(), font=uifont(11, "bold"), text_color=col("text")).pack(fill="x", pady=(2, 2))
        self.ent_name = ctk.CTkEntry(body, height=32, corner_radius=7, font=uifont(11), fg_color=col("input"))
        self.ent_name.pack(fill="x", pady=(0, 6))
        self.ent_name.insert(0, self.proxy_data.get("name", ""))

        # Protocol & Port Row
        pr_row = ctk.CTkFrame(body, fg_color="transparent")
        pr_row.pack(fill="x", pady=(0, 6))

        # Protocol dropdown
        p_sub = ctk.CTkFrame(pr_row, fg_color="transparent")
        p_sub.pack(side="left", fill="x", expand=True, padx=(0, 6))
        ctk.CTkLabel(p_sub, text=bidi(t("pm_col_proto")), anchor=a_start(), font=uifont(11, "bold"), text_color=col("text")).pack(fill="x", pady=(0, 2))
        self.proto_var = tk.StringVar(value=self.proxy_data.get("protocol", "http").lower())
        self.combo_proto = ctk.CTkOptionMenu(
            p_sub, values=list(self.PROTOCOLS), variable=self.proto_var,
            height=32, corner_radius=7, font=uifont(11), fg_color=col("card_alt"), button_color=col("card_alt")
        )
        self.combo_proto.pack(fill="x")

        # Port entry
        pt_sub = ctk.CTkFrame(pr_row, fg_color="transparent")
        pt_sub.pack(side="right", padx=(6, 0))
        ctk.CTkLabel(pt_sub, text="Port:", anchor=a_start(), font=uifont(11, "bold"), text_color=col("text")).pack(fill="x", pady=(0, 2))
        self.ent_port = ctk.CTkEntry(pt_sub, width=90, height=32, corner_radius=7, font=uifont(11), fg_color=col("input"))
        self.ent_port.pack()
        self.ent_port.insert(0, str(self.proxy_data.get("port", 8080)))

        # Host
        ctk.CTkLabel(body, text="Host / IP:", anchor=a_start(), font=uifont(11, "bold"), text_color=col("text")).pack(fill="x", pady=(2, 2))
        self.ent_host = ctk.CTkEntry(body, height=32, corner_radius=7, font=uifont(11), fg_color=col("input"), placeholder_text="127.0.0.1 or proxy.example.com")
        self.ent_host.pack(fill="x", pady=(0, 6))
        self.ent_host.insert(0, self.proxy_data.get("host", ""))

        # Username & Password
        auth_row = ctk.CTkFrame(body, fg_color="transparent")
        auth_row.pack(fill="x", pady=(0, 6))

        u_sub = ctk.CTkFrame(auth_row, fg_color="transparent")
        u_sub.pack(side="left", fill="x", expand=True, padx=(0, 4))
        ctk.CTkLabel(u_sub, text="Username (Optional):", anchor=a_start(), font=uifont(10), text_color=col("text_muted")).pack(fill="x")
        self.ent_user = ctk.CTkEntry(u_sub, height=32, corner_radius=7, font=uifont(11), fg_color=col("input"))
        self.ent_user.pack(fill="x")
        self.ent_user.insert(0, self.proxy_data.get("username", ""))

        pwd_sub = ctk.CTkFrame(auth_row, fg_color="transparent")
        pwd_sub.pack(side="right", fill="x", expand=True, padx=(4, 0))
        ctk.CTkLabel(pwd_sub, text="Password (Optional):", anchor=a_start(), font=uifont(10), text_color=col("text_muted")).pack(fill="x")
        self.ent_pwd = ctk.CTkEntry(pwd_sub, height=32, corner_radius=7, font=uifont(11), fg_color=col("input"), show="*")
        self.ent_pwd.pack(fill="x")
        self.ent_pwd.insert(0, self.proxy_data.get("password", ""))

        # Active Checkbox
        self.chk_active = ctk.CTkCheckBox(body, text=bidi(t("pm_set_active")), font=uifont(11))
        self.chk_active.pack(fill="x", pady=(6, 4))
        if self.proxy_data.get("is_active"):
            self.chk_active.select()

    def _save(self):
        h = self.ent_host.get().strip()
        if not h:
            messagebox.showerror("Error", "Host cannot be empty", parent=self)
            return
        try:
            pt = int(self.ent_port.get().strip() or 8080)
        except ValueError:
            messagebox.showerror("Error", "Invalid Port number", parent=self)
            return

        payload = {
            "name": self.ent_name.get().strip() or f"{h}:{pt}",
            "protocol": self.proto_var.get().lower(),
            "host": h,
            "port": pt,
            "username": self.ent_user.get().strip(),
            "password": self.ent_pwd.get().strip(),
            "is_active": self.chk_active.get() == 1
        }
        self.on_save(payload)
        self.destroy()


class ProxyManagerDialog(BaseDialog):
    """
    Advanced Multi-Proxy Manager Dialog:
    - Lists all saved proxies with protocol, endpoint, authentication, and live latency ping
    - Add, edit, remove, ping test, and toggle active global proxy
    """
    def __init__(self, app):
        super().__init__(app, t("pm_dialog_title"), 840, 600, modal=False)
        self.app = app
        self.proxy_mgr = getattr(app, "proxy_manager", None) or E.get_default_proxy_manager()
        self._current_proxies = []
        card = self.card()

        self.dialog_header(card, "globe", t("pm_dialog_title"), icon_color="accent_cyan", padx=20, pady=(14, 6))

        # Bottom Bar
        btns = ctk.CTkFrame(card, fg_color="transparent")
        btns.pack(fill="x", padx=20, pady=(8, 16), side="bottom")
        IconButton(btns, "xmark", t("u_close"), self.destroy, style="ghost").pack(side=s_end())
        IconButton(btns, "power", t("pm_disable_all"), self._disable_all, style="danger_outline", text_size=11).pack(side=s_start(), padx=(0, 6))
        IconButton(btns, "check", t("pm_set_active"), self._set_active_selected, style="primary", text_size=11).pack(side=s_start())

        body = ctk.CTkFrame(card, fg_color="transparent")
        body.pack(fill="both", expand=True, padx=20, pady=4)

        # Active Proxy Status Card
        self.status_card = ctk.CTkFrame(body, corner_radius=10, fg_color=col("card_alt"), border_width=1, border_color=col("border_light"))
        self.status_card.pack(fill="x", pady=(0, 8))
        sc_row = ctk.CTkFrame(self.status_card, fg_color="transparent")
        sc_row.pack(fill="x", padx=12, pady=8)

        self.lbl_active_icon = ctk.CTkLabel(sc_row, text=ico("globe"), font=ifont(13), text_color=col("accent_cyan"))
        self.lbl_active_icon.pack(side=s_start(), padx=px_inline(0, 8))
        self.lbl_active_status = ctk.CTkLabel(sc_row, text="", font=uifont(12, "bold"), text_color=col("text"), anchor=a_start())
        self.lbl_active_status.pack(side=s_start(), fill="x", expand=True)

        # Action Toolbar
        tb = ctk.CTkFrame(body, fg_color="transparent")
        tb.pack(fill="x", pady=(0, 6))
        IconButton(tb, "plus", t("pm_add_btn"), self._add_proxy, style="soft", text_size=10, pady=5, padx=8).pack(side=s_start(), padx=(0, 4))
        IconButton(tb, "gear", t("pm_edit_btn"), self._edit_selected, style="soft", text_size=10, pady=5, padx=8).pack(side=s_start(), padx=(0, 4))
        IconButton(tb, "trash", t("pm_del_btn"), self._del_selected, style="danger_outline", text_size=10, pady=5, padx=8).pack(side=s_start(), padx=(0, 6))
        IconButton(tb, "bolt", t("pm_test_btn"), self._test_selected, style="soft", text_size=10, pady=5, padx=8).pack(side=s_start())

        # Proxy Treeview
        tbl_frame = ctk.CTkFrame(body, corner_radius=10, fg_color=col("card_alt"), border_width=1, border_color=col("border_light"))
        tbl_frame.pack(fill="both", expand=True, pady=(0, 4))

        style = ttk.Style()
        try:
            style.theme_use("clam")
        except Exception:
            pass
        style.configure(
            "NegmProxy.Treeview",
            background=cur("card_alt"),
            fieldbackground=cur("card_alt"),
            foreground=cur("text"),
            rowheight=28,
            borderwidth=0,
            font=(UI_FONT, 9),
        )
        style.configure(
            "NegmProxy.Treeview.Heading",
            background=cur("header"),
            foreground=cur("text_muted"),
            relief="flat",
            font=(UI_FONT, 9, "bold"),
        )
        style.map(
            "NegmProxy.Treeview",
            background=[("selected", cur("row_select"))],
            foreground=[("selected", cur("text"))],
        )

        cols = ("active", "name", "proto", "endpoint", "auth", "latency", "ip")
        self.tree = ttk.Treeview(tbl_frame, columns=cols, show="headings", style="NegmProxy.Treeview", selectmode="browse")

        self.tree.heading("active", text=bidi(t("pm_col_active")))
        self.tree.heading("name", text=bidi(t("pm_col_name")))
        self.tree.heading("proto", text=bidi(t("pm_col_proto")))
        self.tree.heading("endpoint", text=bidi(t("pm_col_endpoint")))
        self.tree.heading("auth", text=bidi(t("pm_col_auth")))
        self.tree.heading("latency", text=bidi(t("pm_col_latency")))
        self.tree.heading("ip", text=bidi(t("pm_col_ip")))

        self.tree.column("active", width=65, anchor="center")
        self.tree.column("name", width=160, anchor="w")
        self.tree.column("proto", width=80, anchor="center")
        self.tree.column("endpoint", width=150, anchor="center")
        self.tree.column("auth", width=70, anchor="center")
        self.tree.column("latency", width=85, anchor="center")
        self.tree.column("ip", width=120, anchor="center")

        vsb = ttk.Scrollbar(tbl_frame, orient="vertical", command=self.tree.yview)
        self.tree.configure(yscrollcommand=vsb.set)
        vsb.pack(side="right" if not is_rtl() else "left", fill="y")
        self.tree.pack(fill="both", expand=True)

        self.tree.bind("<Double-1>", lambda e: self._edit_selected())
        self._reload_table()

    def _reload_table(self):
        for it in self.tree.get_children():
            self.tree.delete(it)

        self._current_proxies = self.proxy_mgr.get_all_proxies()
        active_proxy = None

        for p in self._current_proxies:
            is_act = p.get("is_active", False)
            if is_act:
                active_proxy = p
            act_txt = "✔ Active" if is_act else ""
            proto = p.get("protocol", "http").upper()
            ep = f"{p.get('host', '')}:{p.get('port', 8080)}"
            has_auth = "✔ Yes" if p.get("username") else "No"
            lat = p.get("latency_ms", -1)
            lat_txt = f"{lat} ms" if lat >= 0 else "-"
            ip = p.get("public_ip", "-")

            tag = "active" if is_act else ("good" if (lat >= 0 and lat < 300) else "normal")
            self.tree.insert("", "end", values=(act_txt, p.get("name", ""), proto, ep, has_auth, lat_txt, ip), tags=(tag,))

        self.tree.tag_configure("active", foreground=cur("success"))
        self.tree.tag_configure("good", foreground=cur("accent_cyan"))

        if active_proxy:
            lat_str = f" • Latency: {active_proxy.get('latency_ms')} ms" if active_proxy.get('latency_ms', -1) >= 0 else ""
            txt = f"✔ Active: {active_proxy.get('name')} ({active_proxy.get('protocol').upper()}://{active_proxy.get('host')}:{active_proxy.get('port')}){lat_str}"
            self.lbl_active_status.configure(text=bidi(txt), text_color=col("success"))
            self.lbl_active_icon.configure(text_color=col("success"))
        else:
            self.lbl_active_status.configure(text=bidi(t("pm_direct_mode")), text_color=col("text_muted"))
            self.lbl_active_icon.configure(text_color=col("text_muted"))

    def _get_selected_proxy(self):
        sel = self.tree.selection()
        if not sel:
            return None
        idx = self.tree.index(sel[0])
        if 0 <= idx < len(self._current_proxies):
            return self._current_proxies[idx]
        return None

    def _add_proxy(self):
        ProxyEditDialog(self, on_save=lambda data: (self.proxy_mgr.add_proxy(**data), self._reload_table()))

    def _edit_selected(self):
        p = self._get_selected_proxy()
        if not p:
            return
        p_id = p.get("id")
        ProxyEditDialog(self, on_save=lambda data: (self.proxy_mgr.update_proxy(p_id, **data), self._reload_table()), proxy_data=p)

    def _del_selected(self):
        p = self._get_selected_proxy()
        if not p:
            return
        if messagebox.askyesno(t("pm_del_btn"), f"Delete proxy {p.get('name')}?", parent=self):
            self.proxy_mgr.delete_proxy(p.get("id"))
            self._reload_table()

    def _set_active_selected(self):
        p = self._get_selected_proxy()
        if not p:
            return
        self.proxy_mgr.set_active_proxy(p.get("id"))
        self._reload_table()
        self.app.toast(t("pm_set_active"), p.get("name"), accent="success", icon="check")

    def _disable_all(self):
        self.proxy_mgr.set_active_proxy(None)
        self._reload_table()
        self.app.toast(t("pm_disable_all"), t("pm_direct_mode"), accent="cyan", icon="power")

    def _test_selected(self):
        p = self._get_selected_proxy()
        if not p:
            return

        def worker():
            ok, lat, ip = E.ProxyManager.test_proxy_connection(p)
            self._safe_ui(lambda: self._on_test_done(p.get("id"), ok, lat, ip))

        threading.Thread(target=worker, daemon=True).start()
        self.app.toast(t("pm_test_btn"), f"Testing {p.get('name')}...", accent="cyan", icon="bolt", duration=2500)

    def _on_test_done(self, proxy_id, ok, lat, ip):
        if not self.winfo_exists():
            return
        self.proxy_mgr.update_proxy(proxy_id, latency_ms=lat if ok else -1, public_ip=ip if ok else "Failed")
        self._reload_table()
        if ok:
            self.app.toast(t("pm_test_ok"), f"Ping: {lat} ms  •  IP: {ip}", accent="success", icon="check")
        else:
            self.app.toast(t("pm_test_err"), str(ip), accent="danger", icon="circle-xmark")

    def _safe_ui(self, fn):
        try:
            if self.winfo_exists():
                self.after(0, fn)
        except Exception:
            pass


class CredentialEditDialog(BaseDialog):
    """Sub-dialog to add or edit site authentication credentials."""
    AUTH_TYPES = ("basic", "bearer", "cookie")

    def __init__(self, parent, on_save, cred_data=None):
        title = t("pm_edit_btn") if cred_data else t("vault_add_btn")
        super().__init__(parent.app, title, 540, 520)
        self.on_save = on_save
        self.cred_data = cred_data or {}
        card = self.card()

        self.dialog_header(card, "key", title, icon_color="primary_text", padx=20, pady=(14, 6))

        btns = ctk.CTkFrame(card, fg_color="transparent")
        btns.pack(fill="x", padx=20, pady=(8, 16), side="bottom")
        IconButton(btns, "xmark", t("u_cancel"), self.destroy, style="ghost").pack(side=s_end())
        IconButton(btns, "check", t("u_save"), self._save, style="primary").pack(side=s_start())

        body = ctk.CTkFrame(card, fg_color="transparent")
        body.pack(fill="both", expand=True, padx=20, pady=4)

        # Domain
        ctk.CTkLabel(body, text=bidi(t("vault_col_domain")), anchor=a_start(), font=uifont(11, "bold"), text_color=col("text")).pack(fill="x", pady=(2, 2))
        self.ent_domain = ctk.CTkEntry(body, height=32, corner_radius=7, font=uifont(11), fg_color=col("input"), placeholder_text=t("vault_domain_ph"))
        self.ent_domain.pack(fill="x", pady=(0, 6))
        self.ent_domain.insert(0, self.cred_data.get("domain", ""))

        # Auth Type dropdown
        ctk.CTkLabel(body, text=bidi(t("vault_col_type")), anchor=a_start(), font=uifont(11, "bold"), text_color=col("text")).pack(fill="x", pady=(2, 2))
        self.type_var = tk.StringVar(value=self.cred_data.get("auth_type", "basic").lower())
        combo = ctk.CTkOptionMenu(
            body, values=list(self.AUTH_TYPES), variable=self.type_var,
            height=32, corner_radius=7, font=uifont(11), fg_color=col("card_alt"), button_color=col("card_alt")
        )
        combo.pack(fill="x", pady=(0, 6))

        # Username & Password
        ctk.CTkLabel(body, text="Username (for Basic auth):", anchor=a_start(), font=uifont(10), text_color=col("text_muted")).pack(fill="x")
        self.ent_user = ctk.CTkEntry(body, height=32, corner_radius=7, font=uifont(11), fg_color=col("input"))
        self.ent_user.pack(fill="x", pady=(0, 4))
        self.ent_user.insert(0, self.cred_data.get("username", ""))

        ctk.CTkLabel(body, text="Password / Token:", anchor=a_start(), font=uifont(10), text_color=col("text_muted")).pack(fill="x")
        self.ent_pwd = ctk.CTkEntry(body, height=32, corner_radius=7, font=uifont(11), fg_color=col("input"), show="*")
        self.ent_pwd.pack(fill="x", pady=(0, 6))
        self.ent_pwd.insert(0, self.cred_data.get("password", "") or self.cred_data.get("token", ""))

        # Cookies
        ctk.CTkLabel(body, text=bidi(t("vault_col_cookies")), anchor=a_start(), font=uifont(10), text_color=col("text_muted")).pack(fill="x")
        self.ent_cookies = ctk.CTkEntry(body, height=34, corner_radius=7, font=uifont(10), fg_color=col("input"), placeholder_text=t("vault_cookies_ph"))
        self.ent_cookies.pack(fill="x", pady=(0, 6))
        self.ent_cookies.insert(0, self.cred_data.get("cookies", ""))

        # Notes
        ctk.CTkLabel(body, text="Notes (Optional):", anchor=a_start(), font=uifont(10), text_color=col("text_muted")).pack(fill="x")
        self.ent_notes = ctk.CTkEntry(body, height=30, corner_radius=7, font=uifont(10), fg_color=col("input"))
        self.ent_notes.pack(fill="x", pady=(0, 4))
        self.ent_notes.insert(0, self.cred_data.get("notes", ""))

    def _save(self):
        d = self.ent_domain.get().strip()
        if not d:
            messagebox.showerror("Error", "Domain cannot be empty", parent=self)
            return

        at = self.type_var.get().lower()
        pwd_val = self.ent_pwd.get().strip()
        payload = {
            "domain": d,
            "auth_type": at,
            "username": self.ent_user.get().strip(),
            "password": pwd_val if at == "basic" else "",
            "token": pwd_val if at == "bearer" else "",
            "cookies": self.ent_cookies.get().strip(),
            "notes": self.ent_notes.get().strip()
        }
        self.on_save(payload)
        self.destroy()


class SiteCredentialsDialog(BaseDialog):
    """
    Site Credentials & Auth Vault Dialog:
    - Lists all saved domain credentials (HTTP Basic, Bearer Tokens, Session Cookies)
    - Automatically injects matching authentication into downloads from those domains
    """
    def __init__(self, app):
        super().__init__(app, t("vault_dialog_title"), 820, 580, modal=False)
        self.app = app
        self.vault = getattr(app, "credential_vault", None) or E.get_default_credential_vault()
        self._current_creds = []
        card = self.card()

        self.dialog_header(card, "key", t("vault_dialog_title"), icon_color="primary_text", padx=20, pady=(14, 6))

        # Bottom Bar
        btns = ctk.CTkFrame(card, fg_color="transparent")
        btns.pack(fill="x", padx=20, pady=(8, 16), side="bottom")
        IconButton(btns, "xmark", t("u_close"), self.destroy, style="ghost").pack(side=s_end())

        body = ctk.CTkFrame(card, fg_color="transparent")
        body.pack(fill="both", expand=True, padx=20, pady=4)

        # Info Box
        info = ctk.CTkFrame(body, corner_radius=9, fg_color=col("card_alt"), border_width=1, border_color=col("border_light"))
        info.pack(fill="x", pady=(0, 8))
        ctk.CTkLabel(
            info, text=bidi("Auto-Vault: Saved credentials & cookies are automatically attached to matching downloads."),
            font=uifont(10), text_color=col("text_muted")
        ).pack(fill="x", padx=12, pady=6)

        # Action Toolbar
        tb = ctk.CTkFrame(body, fg_color="transparent")
        tb.pack(fill="x", pady=(0, 6))
        IconButton(tb, "plus", t("vault_add_btn"), self._add_cred, style="primary", text_size=10, pady=5, padx=10).pack(side=s_start(), padx=(0, 4))
        IconButton(tb, "gear", t("pm_edit_btn"), self._edit_selected, style="soft", text_size=10, pady=5, padx=8).pack(side=s_start(), padx=(0, 4))
        IconButton(tb, "trash", t("pm_del_btn"), self._del_selected, style="danger_outline", text_size=10, pady=5, padx=8).pack(side=s_start())

        # Treeview
        tbl_frame = ctk.CTkFrame(body, corner_radius=10, fg_color=col("card_alt"), border_width=1, border_color=col("border_light"))
        tbl_frame.pack(fill="both", expand=True, pady=(0, 4))

        style = ttk.Style()
        try:
            style.theme_use("clam")
        except Exception:
            pass
        style.configure(
            "NegmVault.Treeview",
            background=cur("card_alt"),
            fieldbackground=cur("card_alt"),
            foreground=cur("text"),
            rowheight=28,
            borderwidth=0,
            font=(UI_FONT, 9),
        )
        style.configure(
            "NegmVault.Treeview.Heading",
            background=cur("header"),
            foreground=cur("text_muted"),
            relief="flat",
            font=(UI_FONT, 9, "bold"),
        )
        style.map(
            "NegmVault.Treeview",
            background=[("selected", cur("row_select"))],
            foreground=[("selected", cur("text"))],
        )

        cols = ("domain", "type", "identity", "cookies", "notes")
        self.tree = ttk.Treeview(tbl_frame, columns=cols, show="headings", style="NegmVault.Treeview", selectmode="browse")

        self.tree.heading("domain", text=bidi(t("vault_col_domain")))
        self.tree.heading("type", text=bidi(t("vault_col_type")))
        self.tree.heading("identity", text=bidi(t("vault_col_identity")))
        self.tree.heading("cookies", text=bidi(t("vault_col_cookies")))
        self.tree.heading("notes", text="Notes")

        self.tree.column("domain", width=180, anchor="w")
        self.tree.column("type", width=90, anchor="center")
        self.tree.column("identity", width=150, anchor="w")
        self.tree.column("cookies", width=180, anchor="w")
        self.tree.column("notes", width=120, anchor="w")

        vsb = ttk.Scrollbar(tbl_frame, orient="vertical", command=self.tree.yview)
        self.tree.configure(yscrollcommand=vsb.set)
        vsb.pack(side="right" if not is_rtl() else "left", fill="y")
        self.tree.pack(fill="both", expand=True)

        self.tree.bind("<Double-1>", lambda e: self._edit_selected())
        self._reload_table()

    def _reload_table(self):
        for it in self.tree.get_children():
            self.tree.delete(it)

        self._current_creds = self.vault.get_all_credentials()
        for c in self._current_creds:
            dom = c.get("domain", "")
            at = c.get("auth_type", "basic").upper()
            ident = c.get("username", "") or ("Token: " + c.get("token", "")[:8] + "..." if c.get("token") else "-")
            ck = c.get("cookies", "")
            ck_txt = (ck[:25] + "...") if len(ck) > 25 else (ck or "-")
            notes = c.get("notes", "")

            self.tree.insert("", "end", values=(dom, at, ident, ck_txt, notes))

    def _get_selected(self):
        sel = self.tree.selection()
        if not sel:
            return None
        idx = self.tree.index(sel[0])
        if 0 <= idx < len(self._current_creds):
            return self._current_creds[idx]
        return None

    def _add_cred(self):
        CredentialEditDialog(self, on_save=lambda data: (self.vault.add_credential(**data), self._reload_table(), self.app.toast(t("vault_saved"), data.get("domain"), accent="success", icon="check")))

    def _edit_selected(self):
        c = self._get_selected()
        if not c:
            return
        c_id = c.get("id")
        CredentialEditDialog(self, on_save=lambda data: (self.vault.update_credential(c_id, **data), self._reload_table(), self.app.toast(t("vault_saved"), data.get("domain"), accent="success", icon="check")), cred_data=c)

    def _del_selected(self):
        c = self._get_selected()
        if not c:
            return
        if messagebox.askyesno(t("pm_del_btn"), f"Delete credentials for {c.get('domain')}?", parent=self):
            self.vault.delete_credential(c.get("id"))
            self._reload_table()


class DropBasket(ctk.CTkToplevel):
    """Floating desktop drop basket widget with live speed, RTL/LTR layout, and DND link capture."""
    WIDTH = 160
    HEIGHT = 60

    def __init__(self, app):
        super().__init__(app)
        self.app = app
        self.overrideredirect(True)
        self.attributes("-topmost", True)
        self.configure(fg_color=col("bg"))

        pos = app.settings.get("drop_basket_pos")
        sw, sh = self.winfo_screenwidth(), self.winfo_screenheight()
        if pos and len(pos) == 2 and 0 <= pos[0] < sw and 0 <= pos[1] < sh:
            x, y = pos
        else:
            x, y = sw - self.WIDTH - 36, 120
        self.geometry(f"{self.WIDTH}x{self.HEIGHT}+{x}+{y}")

        self.card = ctk.CTkFrame(self, corner_radius=14, fg_color=col("card"), border_width=1.5, border_color=col("border"))
        self.card.pack(fill="both", expand=True)

        inner = ctk.CTkFrame(self.card, fg_color="transparent")
        inner.pack(fill="both", expand=True, padx=9, pady=7)
        side = s_start()

        self.badge = ctk.CTkFrame(
            inner, width=40, height=40, corner_radius=11, fg_color=col("pill_idle"),
            border_width=1, border_color=col("border_light"),
        )
        self.badge.pack(side=side, padx=px_inline(0, 9))
        self.badge.pack_propagate(False)

        self.lbl_ico = ctk.CTkLabel(self.badge, text=ico("download"), font=ifont(17), text_color=col("text_muted"))
        self.lbl_ico.place(relx=0.5, rely=0.5, anchor="center")

        txt_box = ctk.CTkFrame(inner, fg_color="transparent")
        txt_box.pack(side=side, fill="both", expand=True)

        self.lbl_speed = ctk.CTkLabel(
            txt_box, text="NegmLoading", font=uifont(11, "bold"),
            text_color=col("text"), anchor=a_start(),
        )
        self.lbl_speed.pack(fill="x", anchor=a_start())

        idle_text = "اسحب الرابط هنا" if E.LANG == "ar" else "Drop link here"
        self.lbl_status = ctk.CTkLabel(
            txt_box, text=bidi(idle_text), font=uifont(9),
            text_color=col("text_muted"), anchor=a_start(),
        )
        self.lbl_status.pack(fill="x", anchor=a_start())

        self._drag_data = {"x": 0, "y": 0}
        for wdg in iter_ctk_tree(self):
            wdg.bind("<Button-1>", self._start_drag, "+")
            wdg.bind("<B1-Motion>", self._on_drag, "+")
            wdg.bind("<ButtonRelease-1>", self._end_drag, "+")
            wdg.bind("<Double-Button-1>", lambda e: self.app.restore_from_tray(), "+")
            wdg.bind("<Button-3>", self._show_menu, "+")

        if E.DND_OK:
            try:
                self.drop_target_register(E.DND_TEXT)
                self.dnd_bind("<<Drop>>", self._on_drop)
            except Exception:
                pass

    def _start_drag(self, event):
        self._drag_data["x"] = event.x_root - self.winfo_x()
        self._drag_data["y"] = event.y_root - self.winfo_y()

    def _on_drag(self, event):
        x = event.x_root - self._drag_data["x"]
        y = event.y_root - self._drag_data["y"]
        self.geometry(f"+{x}+{y}")

    def _end_drag(self, event):
        self.app.settings["drop_basket_pos"] = [self.winfo_x(), self.winfo_y()]
        self.app.save_state()

    def _on_drop(self, event):
        links = list(dict.fromkeys(URL_REGEX.findall(event.data or "")))
        if len(links) == 1 and is_media_platform_url(links[0]):
            self.app.restore_from_tray()
            self.app.show_media_dialog(links[0])
        elif links:
            for link in links:
                fn = extract_filename_from_url(link, "download_file.bin")
                self.app.add_task(link, os.path.join(self.app.settings["folder"], fn))
        return event.action

    def _show_menu(self, event):
        menu = tk.Menu(self, tearoff=0, bg=cur("card"), fg=cur("text"), activebackground=cur("primary"), activeforeground="#ffffff", disabledforeground=cur("text_muted"), font=(UI_FONT, 10))
        menu.add_command(label=bidi(t("tray_show")), command=self.app.restore_from_tray)
        menu.add_command(label=bidi(t("u_add")), command=lambda: (self.app.restore_from_tray(), self.app.show_add_dialog()))
        menu.add_separator()
        menu.add_command(label=bidi(t("u_close")), command=lambda: self.app.toggle_drop_basket(False))
        try:
            menu.tk_popup(event.x_root, event.y_root)
        finally:
            menu.grab_release()

    def update_stats(self, speed_str, active_count):
        if not self.winfo_exists():
            return
        key = (speed_str, active_count)
        if getattr(self, "_last_stats", None) == key:
            return
        self._last_stats = key
        if active_count > 0:
            self.lbl_speed.configure(text=speed_str)
            active_label = bidi(f"{active_count} {t('u_active_n')}")
            self.lbl_status.configure(text=active_label, text_color=col("accent_cyan"))
            self.badge.configure(fg_color=col("pill_active"), border_color=col("accent_cyan"))
            self.lbl_ico.configure(text_color=col("accent_cyan"))
            self.card.configure(border_color=col("accent_cyan"))
        else:
            self.lbl_speed.configure(text="NegmLoading")
            idle_text = "اسحب الرابط هنا" if E.LANG == "ar" else "Drop link here"
            self.lbl_status.configure(text=bidi(idle_text), text_color=col("text_muted"))
            self.badge.configure(fg_color=col("pill_idle"), border_color=col("border_light"))
            self.lbl_ico.configure(text_color=col("text_muted"))
            self.card.configure(border_color=col("border"))


class OptionsDialog(BaseDialog):
    def __init__(self, app):
        super().__init__(app, t("opt_title"), 650, 630)
        s = app.settings
        self._opt_dark = t("opt_dark")
        self._opt_light = t("opt_light")
        card = self.card()

        self.dialog_header(card, "gear", t("opt_title"), icon_color="primary_text", padx=20, pady=(16, 6))

        btns = ctk.CTkFrame(card, fg_color="transparent")
        btns.pack(fill="x", padx=20, pady=(8, 16), side="bottom")
        IconButton(btns, "xmark", t("u_cancel"), self.destroy, style="ghost").pack(side=s_end())
        IconButton(btns, "check", t("opt_save"), self._save, style="primary").pack(side=s_start())

        tab_names = [t("u_tab_general"), t("u_tab_conn"), t("u_tab_look")]
        self._tab_keys = tab_names
        self.tab_switcher = SegmentedControl(card, values=tab_names, command=self._switch_tab, height=38)
        self.tab_switcher.pack(fill="x", padx=20, pady=(2, 8))

        self.pages_wrap = ctk.CTkFrame(
            card, corner_radius=12, fg_color=col("card_alt"),
            border_width=1, border_color=col("border_light"),
        )
        self.pages_wrap.pack(fill="both", expand=True, padx=20, pady=(0, 4))

        g = ctk.CTkScrollableFrame(self.pages_wrap, fg_color="transparent")
        c = ctk.CTkScrollableFrame(self.pages_wrap, fg_color="transparent")
        a = ctk.CTkFrame(self.pages_wrap, fg_color="transparent")
        self._pages = {
            tab_names[0]: g,
            tab_names[1]: c,
            tab_names[2]: a,
        }

        # --- Tab 1: General ---
        ctk.CTkLabel(g, text=bidi(t("opt_default_folder")), anchor=a_start(), font=uifont(11, "bold"),
                     text_color=col("text_muted")).pack(fill="x", padx=8, pady=(6, 3))
        frow = ctk.CTkFrame(g, fg_color="transparent")
        frow.pack(fill="x", padx=8, pady=(0, 6))
        IconButton(frow, "folder-open", "", self._browse, style="soft", pady=7, padx=10, tooltip=t("u_browse")).pack(side=s_end())
        self.folder = ctk.CTkEntry(
            frow, height=36, corner_radius=9, font=uifont(12),
            fg_color=col("input"), border_color=col("border"), text_color=col("text"),
        )
        self.folder.insert(0, s.get("folder", ""))
        self.folder.pack(side=s_start(), fill="x", expand=True, padx=px_inline(0, 8))

        self.v_sort = ctk.BooleanVar(value=s.get("auto_sort", True))
        self.v_clip = ctk.BooleanVar(value=s.get("clip_monitor", True))
        self.v_sound = ctk.BooleanVar(value=s.get("sound", True))
        self.v_notify = ctk.BooleanVar(value=s.get("notify", True))
        self.v_tray = ctk.BooleanVar(value=s.get("minimize_to_tray", True))
        self.v_startup = ctk.BooleanVar(value=s.get("start_with_windows", False))
        self.v_basket = ctk.BooleanVar(value=s.get("show_drop_basket", False))
        self.v_extract = ctk.BooleanVar(value=s.get("auto_extract", False))
        self.v_av = ctk.BooleanVar(value=s.get("auto_av_scan", False))

        for text, var in (
            (t("opt_auto_sort"), self.v_sort),
            (t("opt_clip_monitor"), self.v_clip),
            (t("opt_sound"), self.v_sound),
            (t("opt_notify"), self.v_notify),
            (t("opt_minimize_to_tray"), self.v_tray),
            (t("opt_start_windows"), self.v_startup),
            (t("opt_drop_basket"), self.v_basket),
            (t("opt_auto_extract"), self.v_extract),
            (t("opt_auto_av"), self.v_av),
        ):
            sw = make_switch(g, text, var, progress_color="primary", padx=8, pady=3)
            if var is self.v_sound:
                # Add inline sound preview button next to sound toggle
                snd_test_row = ctk.CTkFrame(g, fg_color="transparent")
                snd_test_row.pack(fill="x", padx=16, pady=(0, 4))
                IconButton(
                    snd_test_row, "volume-high", t("opt_sound_test"),
                    lambda: play_event_sound("complete"),
                    style="soft", pady=5, padx=10
                ).pack(side=s_start())

        ctk.CTkLabel(g, text=bidi(t("opt_custom_av")), anchor=a_start(), font=uifont(11, "bold"),
                     text_color=col("text_muted")).pack(fill="x", padx=8, pady=(10, 3))
        avrow = ctk.CTkFrame(g, fg_color="transparent")
        avrow.pack(fill="x", padx=8, pady=(0, 8))
        IconButton(avrow, "eraser", "", lambda: self.av_path.delete(0, "end"), style="soft", tooltip=t("u_clear"), pady=7, padx=10).pack(side=s_end())
        IconButton(avrow, "folder-open", "", self._browse_av, style="soft", tooltip=t("u_browse"), pady=7, padx=10).pack(
            side=s_end(), padx=px_inline(0, 4),
        )
        self.av_path = ctk.CTkEntry(
            avrow, height=36, corner_radius=9, font=uifont(12), fg_color=col("input"),
            border_color=col("border"), text_color=col("text"), placeholder_text=bidi(t("opt_av_ph")),
        )
        if s.get("custom_av_path"):
            self.av_path.insert(0, s.get("custom_av_path", ""))
        self.av_path.pack(side=s_start(), fill="x", expand=True, padx=px_inline(0, 6))

        # --- Tab 2: Connection ---
        ctk.CTkLabel(c, text=bidi(t("opt_concurrency")), anchor=a_start(), font=uifont(11, "bold"),
                     text_color=col("text_muted")).pack(fill="x", padx=8, pady=(6, 3))
        crow = ctk.CTkFrame(c, fg_color="transparent")
        crow.pack(fill="x", padx=8)
        self.conc_val = ctk.CTkLabel(
            crow, text=str(s.get("max_concurrent", 3)), width=34,
            font=uifont(14, "bold"), text_color=col("primary_text"),
        )
        self.conc_val.pack(side=s_end())
        self.conc = ctk.CTkSlider(
            crow, from_=1, to=10, number_of_steps=9, progress_color=col("primary"),
            button_color=col("primary"), button_hover_color=col("primary_hover"),
            command=lambda v: self.conc_val.configure(text=str(int(v))),
        )
        self.conc.set(int(s.get("max_concurrent", 3)))
        self.conc.pack(side=s_start(), fill="x", expand=True, padx=px_inline(0, 10))

        ctk.CTkLabel(c, text=bidi(t("opt_chunks_default")), anchor=a_start(), font=uifont(11, "bold"),
                     text_color=col("text_muted")).pack(fill="x", padx=8, pady=(12, 3))
        self.chunks = SegmentedControl(c, values=["4", "8", "16", "32"], height=36)
        self.chunks.set(str(s.get("default_chunks", 8)))
        self.chunks.pack(fill="x", padx=8)

        ctk.CTkLabel(c, text=bidi(t("opt_buffer_size")), anchor=a_start(), font=uifont(11, "bold"),
                     text_color=col("text_muted")).pack(fill="x", padx=8, pady=(12, 3))
        self.buffer = SegmentedControl(c, values=["64", "128", "256", "512"], height=36)
        self.buffer.set(str(s.get("buffer_kb", 256)))
        self.buffer.pack(fill="x", padx=8)

        ctk.CTkFrame(c, height=1, fg_color=col("border_light")).pack(fill="x", padx=8, pady=(14, 10))
        self.v_proxy = ctk.BooleanVar(value=s.get("proxy_enabled", False))
        make_switch(c, t("opt_proxy_enable"), self.v_proxy, progress_color="accent_cyan", padx=8, pady=(0, 6))
        ctk.CTkLabel(c, text=bidi(t("opt_proxy_url")), anchor=a_start(), font=uifont(11, "bold"),
                     text_color=col("text_muted")).pack(fill="x", padx=8, pady=(0, 3))
        self.proxy_entry = ctk.CTkEntry(
            c, height=36, corner_radius=9, font=uifont(12), fg_color=col("input"),
            border_color=col("border"), text_color=col("text"), placeholder_text=t("opt_proxy_ph"),
        )
        if s.get("proxy_url"):
            self.proxy_entry.insert(0, s.get("proxy_url", ""))
        self.proxy_entry.pack(fill="x", padx=8)

        ctk.CTkFrame(c, height=1, fg_color=col("border_light")).pack(fill="x", padx=8, pady=(14, 10))
        ctk.CTkLabel(c, text=bidi(t("opt_quota_title")), anchor=a_start(), font=uifont(11, "bold"),
                     text_color=col("text_muted")).pack(fill="x", padx=8, pady=(0, 4))
        qrow = ctk.CTkFrame(c, fg_color="transparent")
        qrow.pack(fill="x", padx=8, pady=(0, 8))
        self.quota_entry = ctk.CTkEntry(
            qrow, width=110, height=36, corner_radius=9, font=uifont(12),
            fg_color=col("input"), border_color=col("border"), text_color=col("text"),
        )
        self.quota_entry.insert(0, str(int(s.get("daily_quota_mb", 0) or 0)))
        self.quota_entry.pack(side=s_start(), padx=px_inline(0, 12))
        app._sync_quota_date()
        used_str = bidi(f"{t('opt_quota_used')} {fmt_size(s.get('quota_used_bytes', 0))}")
        self.lbl_quota_used = ctk.CTkLabel(qrow, text=used_str, font=uifont(11, "bold"), text_color=col("accent_cyan"))
        self.lbl_quota_used.pack(side=s_start())
        IconButton(qrow, "eraser", t("opt_quota_reset"), self._reset_quota, style="soft", text_size=11, padx=10, pady=6).pack(side=s_end())

        # --- Tab 3: Appearance ---
        a_in = ctk.CTkFrame(a, fg_color="transparent")
        a_in.pack(fill="both", expand=True, padx=14, pady=12)
        ctk.CTkLabel(a_in, text=bidi(t("opt_lang")), anchor=a_start(), font=uifont(11, "bold"),
                     text_color=col("text_muted")).pack(fill="x", pady=(4, 4))
        self.lang = SegmentedControl(a_in, values=["العربية", "English"], height=38)
        self.lang.set("العربية" if E.LANG == "ar" else "English")
        self.lang.pack(fill="x")

        ctk.CTkLabel(a_in, text=bidi(t("opt_theme")), anchor=a_start(), font=uifont(11, "bold"),
                     text_color=col("text_muted")).pack(fill="x", pady=(16, 4))
        self.theme = SegmentedControl(a_in, values=[self._opt_dark, self._opt_light], height=38)
        self.theme.set(self._opt_dark if s.get("theme") == "Dark" else self._opt_light)
        self.theme.pack(fill="x")

        self._switch_tab(tab_names[0])

    def _switch_tab(self, name: str):
        for k, frame in self._pages.items():
            frame.pack_forget()
        page = self._pages.get(name)
        if page is not None:
            page.pack(fill="both", expand=True, padx=4, pady=4)

    def _browse(self):
        sel = fd.askdirectory(initialdir=self.folder.get(), parent=self)
        if sel:
            self.folder.delete(0, "end")
            self.folder.insert(0, sel)

    def _browse_av(self):
        sel = fd.askopenfilename(filetypes=[("Executable (*.exe)", "*.exe"), ("All files", "*.*")], parent=self)
        if sel:
            self.av_path.delete(0, "end")
            self.av_path.insert(0, sel)

    def _reset_quota(self):
        self.app.reset_daily_quota()
        self.lbl_quota_used.configure(text=bidi(f"{t('opt_quota_used')} {fmt_size(0)}"))

    def _save(self):
        s = self.app.settings
        s["folder"] = self.folder.get().strip() or s["folder"]
        s["auto_sort"] = bool(self.v_sort.get())
        s["minimize_to_tray"] = bool(self.v_tray.get())
        st_val = bool(self.v_startup.get())
        s["start_with_windows"] = st_val
        set_windows_startup(st_val)
        b_val = bool(self.v_basket.get())
        s["show_drop_basket"] = b_val
        self.app.toggle_drop_basket(b_val)
        s["clip_monitor"] = bool(self.v_clip.get())
        s["sound"] = bool(self.v_sound.get())
        s["notify"] = bool(self.v_notify.get())
        s["auto_extract"] = bool(self.v_extract.get())
        s["auto_av_scan"] = bool(self.v_av.get())
        s["custom_av_path"] = self.av_path.get().strip()
        s["max_concurrent"] = int(self.conc.get())
        s["default_chunks"] = int(self.chunks.get())
        s["buffer_kb"] = int(self.buffer.get())
        s["proxy_enabled"] = bool(self.v_proxy.get())
        s["proxy_url"] = self.proxy_entry.get().strip()
        try:
            q_mb = max(0, int(float(self.quota_entry.get().strip() or "0")))
        except ValueError:
            q_mb = int(s.get("daily_quota_mb", 0) or 0)
        s["daily_quota_mb"] = q_mb
        self.app.apply_network_settings()
        new_lang = "ar" if strip_bidi(self.lang.get()) == "العربية" else "en"
        new_theme = "Dark" if strip_bidi(self.theme.get()) == strip_bidi(self._opt_dark) else "Light"
        lang_changed = new_lang != E.LANG
        theme_changed = new_theme != s.get("theme")
        s["lang"] = new_lang
        self.destroy()
        if theme_changed:
            self.app.switch_theme_animated(new_theme)
        elif lang_changed:
            self.app.apply_look(True)


class AnalyticsDialog(BaseDialog):
    """
    Advanced Download Analytics, Real-Time Bandwidth Monitor & Exportable History Reports:
    - Tab 1: Overview & Live Network Monitor (4 KPI Cards, Real-Time Dynamic Canvas Graph with Y-axis speed scales, peak badge, time marks, storage category breakdown)
    - Tab 2: Detailed Download Logs & History (Search, Status Filter, Date Filter, Category Filter, Modern Treeview with right-click context menu, File & Folder launcher)
    - Tab 3: Domain & Source Analysis (Top downloaded domains leaderboard with progress bars and transfer statistics)
    - Multi-Format Export: CSV (UTF-8 BOM), JSON, HTML
    """
    CAT_ORDER = (
        "type_videos",
        "type_compressed",
        "type_programs",
        "type_music",
        "type_docs",
        "type_other",
    )

    def __init__(self, app):
        super().__init__(app, t("st_dash_title"), 900, 680, modal=False)
        self.app = app
        self.history_manager = getattr(app, "history_manager", None) or E.DownloadHistoryManager()
        card = self.card()

        # Header
        self.dialog_header(card, "chart-pie", t("st_dash_title"), icon_color="primary_text", padx=20, pady=(14, 6))

        # Bottom Action Bar
        btns = ctk.CTkFrame(card, fg_color="transparent")
        btns.pack(fill="x", padx=20, pady=(6, 12), side="bottom")
        IconButton(btns, "eraser", t("st_reset_stats"), self._reset_stats, style="soft", text_size=11).pack(side=s_start(), padx=(0, 6))
        IconButton(btns, "file-export", t("st_export_report"), self._prompt_export, style="primary", text_size=11).pack(side=s_start())
        IconButton(btns, "xmark", t("u_close"), self.destroy, style="ghost").pack(side=s_end())

        # Tabs Switcher
        tab_names = [t("st_tab_overview"), t("st_tab_history"), t("st_tab_domains")]
        self._tab_names = tab_names
        self.tab_switcher = SegmentedControl(card, values=tab_names, command=self._switch_tab, height=36)
        self.tab_switcher.pack(fill="x", padx=20, pady=(2, 8))

        # Container Frame for Pages
        self.pages_wrap = ctk.CTkFrame(card, corner_radius=11, fg_color="transparent")
        self.pages_wrap.pack(fill="both", expand=True, padx=20, pady=(0, 4))

        # -------------------------------------------------------------
        # PAGE 1: Overview & Real-Time Bandwidth Monitor
        # -------------------------------------------------------------
        self.page_overview = ctk.CTkFrame(self.pages_wrap, fg_color="transparent")

        # Top 4 KPI Cards
        kpi_row = ctk.CTkFrame(self.page_overview, fg_color="transparent")
        kpi_row.pack(fill="x", pady=(0, 8))
        for i in range(4):
            kpi_row.grid_columnconfigure(i, weight=1, uniform="kpi")

        self.kpi_vals = {}
        self.kpi_subs = {}
        kpi_specs = (
            ("lifetime", "st_kpi_lifetime", "cloud-down", "primary_text"),
            ("today", "st_kpi_today", "bolt", "accent_cyan"),
            ("done", "st_kpi_done", "check", "success"),
            ("peak", "st_kpi_peak", "gauge", "warning"),
        )
        side = s_start()
        for idx, (key, title_key, ic_name, color_tok) in enumerate(kpi_specs):
            col_i = (3 - idx) if is_rtl() else idx
            box = ctk.CTkFrame(kpi_row, corner_radius=11, fg_color=col("card_alt"), border_width=1, border_color=col("border_light"))
            box.grid(row=0, column=col_i, sticky="nsew", padx=(0 if col_i == 0 else 4, 0 if col_i == 3 else 4), pady=2)
            top = ctk.CTkFrame(box, fg_color="transparent")
            top.pack(fill="x", padx=10, pady=(8, 2))
            ctk.CTkLabel(top, text=ico(ic_name), font=ifont(12), text_color=col(color_tok)).pack(side=side, padx=px_inline(0, 6))
            ctk.CTkLabel(top, text=bidi(t(title_key)), font=uifont(10, "bold"), text_color=col("text_muted"), anchor=a_start()).pack(side=side)
            val_lbl = ctk.CTkLabel(box, text="0 B", font=uifont(15, "bold"), text_color=col(color_tok), anchor=a_start())
            val_lbl.pack(fill="x", padx=10, pady=(0, 2))
            sub_lbl = ctk.CTkLabel(box, text="", font=uifont(9), text_color=col("text_muted"), anchor=a_start())
            sub_lbl.pack(fill="x", padx=10, pady=(0, 6))
            self.kpi_vals[key] = val_lbl
            self.kpi_subs[key] = sub_lbl

        # Live Bandwidth Canvas Graph
        g_head = ctk.CTkFrame(self.page_overview, fg_color="transparent")
        g_head.pack(fill="x", pady=(2, 4))
        ctk.CTkLabel(g_head, text=bidi(t("st_graph_title")), font=uifont(11, "bold"), text_color=col("text_muted")).pack(side=side)
        self.lbl_now_speed = ctk.CTkLabel(g_head, text="0 B/s", font=uifont(12, "bold"), text_color=col("accent_cyan"))
        self.lbl_now_speed.pack(side=s_end())

        graph_wrap = ctk.CTkFrame(self.page_overview, corner_radius=11, fg_color=col("input"), border_width=1, border_color=col("border_light"))
        graph_wrap.pack(fill="x", pady=(0, 8))
        self.canvas = tk.Canvas(graph_wrap, height=140, bg=cur("input"), highlightthickness=0, bd=0)
        self.canvas.pack(fill="x", padx=6, pady=6)
        self.canvas.bind("<Configure>", lambda e: self._draw_graph())

        # Category Storage Breakdown
        ctk.CTkLabel(self.page_overview, text=bidi(t("st_cat_breakdown")), anchor=a_start(), font=uifont(11, "bold"),
                     text_color=col("text_muted")).pack(fill="x", pady=(2, 4))
        cat_grid = ctk.CTkFrame(self.page_overview, fg_color="transparent")
        cat_grid.pack(fill="x", pady=(0, 2))
        cat_grid.grid_columnconfigure(0, weight=1, uniform="cat")
        cat_grid.grid_columnconfigure(1, weight=1, uniform="cat")

        self.cat_widgets = {}
        for i, cat_key in enumerate(self.CAT_ORDER):
            r, c_idx = divmod(i, 2)
            col_actual = (1 - c_idx) if is_rtl() else c_idx
            cell = ctk.CTkFrame(cat_grid, corner_radius=9, fg_color=col("card_alt"), border_width=1, border_color=col("border_light"))
            cell.grid(row=r, column=col_actual, sticky="ew", padx=(0 if col_actual == 0 else 4, 4 if col_actual == 0 else 0), pady=2)
            crow = ctk.CTkFrame(cell, fg_color="transparent")
            crow.pack(fill="x", padx=8, pady=(4, 2))
            ic_tok = CAT_ICON.get(cat_key, "file")
            col_tok = CAT_COLOR.get(cat_key, "text_muted")
            ctk.CTkLabel(crow, text=ico(ic_tok), font=ifont(12), text_color=col(col_tok)).pack(side=side, padx=px_inline(0, 6))
            ctk.CTkLabel(crow, text=bidi(t(cat_key)), font=uifont(11, "bold"), text_color=col("text")).pack(side=side)
            sz_lbl = ctk.CTkLabel(crow, text="0 B", font=uifont(10, "bold"), text_color=col("text_muted"))
            sz_lbl.pack(side=s_end())
            pbar = ctk.CTkProgressBar(cell, height=5, corner_radius=3, progress_color=col(col_tok), fg_color=col("track"))
            pbar.set(0)
            pbar.pack(fill="x", padx=8, pady=(0, 6))
            self.cat_widgets[cat_key] = (sz_lbl, pbar)

        # -------------------------------------------------------------
        # PAGE 2: Detailed Download Logs & History
        # -------------------------------------------------------------
        self.page_history = ctk.CTkFrame(self.pages_wrap, fg_color="transparent")

        # History Filters Header
        h_filter_bar = ctk.CTkFrame(self.page_history, fg_color="transparent")
        h_filter_bar.pack(fill="x", pady=(0, 6))

        # Search Box
        self.h_search_var = tk.StringVar()
        self.h_search_entry = ctk.CTkEntry(
            h_filter_bar, width=220, height=32, corner_radius=8,
            placeholder_text=t("u_search_ph"), textvariable=self.h_search_var,
            font=uifont(11), fg_color=col("input"), border_color=col("border_light")
        )
        self.h_search_entry.pack(side=s_start(), padx=(0, 6))
        self.h_search_entry.bind("<KeyRelease>", lambda e: self._filter_history())

        # Status Filter Menu
        self._cur_status_filter = "all"
        self._cur_date_filter = "all"
        self._status_opts = [
            (t("st_all"), "all"),
            (t("st_status_ok"), "completed"),
            (t("st_status_fail"), "failed")
        ]
        self.h_status_combo = ctk.CTkOptionMenu(
            h_filter_bar, values=[opt[0] for opt in self._status_opts],
            command=self._on_status_filter_selected,
            width=120, height=32, corner_radius=8, font=uifont(11),
            fg_color=col("card_alt"), button_color=col("card_alt"), text_color=col("text")
        )
        self.h_status_combo.pack(side=s_start(), padx=(0, 6))

        # Date Range Filter Menu
        self._date_opts = [
            (t("st_date_all"), "all"),
            (t("st_date_today"), "today"),
            (t("st_date_week"), "week"),
            (t("st_date_month"), "month")
        ]
        self.h_date_combo = ctk.CTkOptionMenu(
            h_filter_bar, values=[opt[0] for opt in self._date_opts],
            command=self._on_date_filter_selected,
            width=120, height=32, corner_radius=8, font=uifont(11),
            fg_color=col("card_alt"), button_color=col("card_alt"), text_color=col("text")
        )
        self.h_date_combo.pack(side=s_start(), padx=(0, 6))

        # Quick Actions
        IconButton(h_filter_bar, "retry", "", self._reload_history, style="ghost", tooltip=t("u_refresh"), pady=6, padx=8).pack(side=s_end(), padx=(4, 0))
        IconButton(h_filter_bar, "eraser", t("st_clear_hist"), self._confirm_clear, style="danger_outline", text_size=10, pady=5, padx=8).pack(side=s_end(), padx=(4, 0))

        # History Treeview Table
        tbl_frame = ctk.CTkFrame(self.page_history, corner_radius=10, fg_color=col("card_alt"), border_width=1, border_color=col("border_light"))
        tbl_frame.pack(fill="both", expand=True, pady=(0, 4))

        style = ttk.Style()
        try:
            style.theme_use("clam")
        except Exception:
            pass
        style.configure(
            "NegmHistory.Treeview",
            background=cur("card_alt"),
            fieldbackground=cur("card_alt"),
            foreground=cur("text"),
            rowheight=26,
            borderwidth=0,
            font=(UI_FONT, 9),
        )
        style.configure(
            "NegmHistory.Treeview.Heading",
            background=cur("header"),
            foreground=cur("text_muted"),
            relief="flat",
            font=(UI_FONT, 9, "bold"),
        )
        style.map(
            "NegmHistory.Treeview",
            background=[("selected", cur("row_select"))],
            foreground=[("selected", cur("text"))],
        )

        h_cols = ("time", "name", "cat", "size", "status", "speed", "duration", "domain")
        self.h_tree = ttk.Treeview(tbl_frame, columns=h_cols, show="headings", style="NegmHistory.Treeview", selectmode="browse")

        align_main = "e" if is_rtl() else "w"
        self.h_tree.heading("time", text=bidi(t("st_col_time")))
        self.h_tree.heading("name", text=bidi(t("st_col_name")))
        self.h_tree.heading("cat", text=bidi(t("st_col_cat")))
        self.h_tree.heading("size", text=bidi(t("st_col_size")))
        self.h_tree.heading("status", text=bidi(t("st_col_status")))
        self.h_tree.heading("speed", text=bidi(t("st_col_speed")))
        self.h_tree.heading("duration", text=bidi(t("st_col_duration")))
        self.h_tree.heading("domain", text=bidi(t("st_col_domain")))

        self.h_tree.column("time", width=130, anchor="center")
        self.h_tree.column("name", width=220, anchor=align_main)
        self.h_tree.column("cat", width=90, anchor="center")
        self.h_tree.column("size", width=80, anchor="center")
        self.h_tree.column("status", width=75, anchor="center")
        self.h_tree.column("speed", width=80, anchor="center")
        self.h_tree.column("duration", width=65, anchor="center")
        self.h_tree.column("domain", width=120, anchor=align_main)

        vsb = ttk.Scrollbar(tbl_frame, orient="vertical", command=self.h_tree.yview)
        self.h_tree.configure(yscrollcommand=vsb.set)
        vsb.pack(side="right" if not is_rtl() else "left", fill="y")
        self.h_tree.pack(fill="both", expand=True)

        self.h_tree.bind("<Double-1>", self._on_tree_double_click)
        self.h_tree.bind("<Button-3>", self._show_tree_context_menu)

        # History Count Bar
        self.lbl_h_status = ctk.CTkLabel(self.page_history, text="", font=uifont(10), text_color=col("text_muted"), anchor=a_start())
        self.lbl_h_status.pack(fill="x", pady=(2, 0))

        # -------------------------------------------------------------
        # PAGE 3: Domain & Source Analysis
        # -------------------------------------------------------------
        self.page_domains = ctk.CTkFrame(self.pages_wrap, fg_color="transparent")
        d_head = ctk.CTkFrame(self.page_domains, fg_color="transparent")
        d_head.pack(fill="x", pady=(0, 6))
        ctk.CTkLabel(d_head, text=bidi(t("st_top_domains")), font=uifont(12, "bold"), text_color=col("text")).pack(side=s_start())

        self.domains_scroll = ctk.CTkScrollableFrame(
            self.page_domains, corner_radius=10, fg_color=col("card_alt"),
            border_width=1, border_color=col("border_light")
        )
        self.domains_scroll.pack(fill="both", expand=True)

        # Tab pages map
        self._pages = {
            tab_names[0]: self.page_overview,
            tab_names[1]: self.page_history,
            tab_names[2]: self.page_domains,
        }

        # Initialize Default View
        self.page_overview.pack(fill="both", expand=True)
        self._history_dirty = True
        self._current_history_records = []
        self._refresh_all()
        self.after(500, self._tick_loop)

    def _switch_tab(self, name: str):
        for frame in self._pages.values():
            frame.pack_forget()
        page = self._pages.get(name)
        if page is not None:
            page.pack(fill="both", expand=True)
        if page == self.page_history and self._history_dirty:
            self._reload_history()
        elif page == self.page_domains:
            self._refresh_domains()

    def _on_status_filter_selected(self, chosen_label: str):
        for lbl, val in self._status_opts:
            if lbl == chosen_label:
                self._cur_status_filter = val
                break
        self._filter_history()

    def _on_date_filter_selected(self, chosen_label: str):
        for lbl, val in self._date_opts:
            if lbl == chosen_label:
                self._cur_date_filter = val
                break
        self._filter_history()

    def notify_history_changed(self):
        self._history_dirty = True
        if self.winfo_exists() and self.page_history.winfo_ismapped():
            self._reload_history()

    def _reset_stats(self):
        self.app.settings["total_lifetime_bytes"] = 0
        self.app.settings["peak_speed_bps"] = 0
        self.app.peak_speed_bps = 0
        self.app.speed_samples.clear()
        self.app.speed_samples.extend([0] * 60)
        self.app.save_state()
        self._refresh_all()

    def _refresh_all(self):
        if not self.winfo_exists():
            return
        tasks = [it["task"] for it in self.app.tasks]
        done_n = sum(1 for x in tasks if x.is_completed)
        progs = [(x, x.get_progress()) for x in tasks]
        sum_task_bytes = sum(
            max(int(pr.get("downloaded", 0) or 0), int(pr.get("total", 0) or 0) if x.is_completed else 0)
            for x, pr in progs
        )

        summary = self.history_manager.get_summary()
        hist_lifetime = summary.get("lifetime_bytes", 0)
        lifetime_b = max(int(self.app.settings.get("total_lifetime_bytes", 0) or 0), sum_task_bytes, hist_lifetime)
        today_b = max(int(self.app.settings.get("quota_used_bytes", 0) or 0), summary.get("today_bytes", 0))
        peak_bps = max(int(self.app.peak_speed_bps or 0), int(self.app.settings.get("peak_speed_bps", 0) or 0), summary.get("peak_speed_bps", 0))
        cur_bps = self.app.speed_samples[-1] if self.app.speed_samples else 0

        self.kpi_vals["lifetime"].configure(text=fmt_size(lifetime_b))
        self.kpi_subs["lifetime"].configure(text=f"{summary.get('total_count', 0)} {t('u_downloads')}")

        self.kpi_vals["today"].configure(text=fmt_size(today_b))
        self.kpi_subs["today"].configure(text=f"7d: {fmt_size(summary.get('week_bytes', 0))}")

        total_done = done_n + summary.get("completed_count", 0)
        self.kpi_vals["done"].configure(text=f"{total_done}")
        self.kpi_subs["done"].configure(text=f"{t('st_success_rate')}: {summary.get('success_rate_pct', 100.0)}%")

        self.kpi_vals["peak"].configure(text=fmt_speed(peak_bps))
        self.kpi_subs["peak"].configure(text=f"Avg: {fmt_speed(summary.get('avg_speed_bps', 0))}")

        self.lbl_now_speed.configure(text=fmt_speed(cur_bps))

        cat_map = {k: 0 for k in self.CAT_ORDER}
        for x, pr in progs:
            ck = detect_category(x.filename)
            if ck not in cat_map:
                ck = "type_other"
            cat_map[ck] += max(int(pr.get("total", 0) or 0), int(pr.get("downloaded", 0) or 0))

        hist_cats = summary.get("category_stats", {})
        for ck, cdata in hist_cats.items():
            if ck in cat_map:
                cat_map[ck] = max(cat_map[ck], cdata.get("bytes", 0))

        tot_cat = max(1, sum(cat_map.values()))
        for ck, (lbl, pbar) in self.cat_widgets.items():
            b = cat_map.get(ck, 0)
            lbl.configure(text=fmt_size(b))
            pbar.set(min(1.0, b / tot_cat) if sum(cat_map.values()) > 0 else 0.0)

        self._draw_graph()

    def _draw_graph(self):
        if not self.winfo_exists():
            return
        c = self.canvas
        c.configure(bg=cur("input"))
        c.delete("all")
        w = max(200, c.winfo_width())
        h = max(90, c.winfo_height())
        pad_top, pad_bot = 16, 20
        pad_left = 68 if not is_rtl() else 12
        pad_right = 12 if not is_rtl() else 68
        plot_h = max(30, h - pad_top - pad_bot)
        plot_w = max(60, w - pad_left - pad_right)

        samples = list(self.app.speed_samples) or [0] * 60
        if len(samples) < 2:
            samples = [0] + samples
        max_sample = max(samples)
        max_v = max(max_sample, 1024.0) * 1.15

        grid_col = cur("border_light")
        for frac in (0.25, 0.5, 0.75, 1.0):
            gy = pad_top + plot_h * (1.0 - frac)
            c.create_line(pad_left, gy, pad_left + plot_w, gy, fill=grid_col, dash=(2, 4))
            lbl_x = (pad_left - 6) if not is_rtl() else (pad_left + plot_w + 6)
            c.create_text(
                lbl_x, gy, text=fmt_speed(max_v * frac),
                fill=cur("text_muted"), font=(UI_FONT, 8),
                anchor="e" if not is_rtl() else "w"
            )

        # Bottom timeline ticks
        t_marks = (("-60s", 0.0), ("-45s", 0.25), ("-30s", 0.5), ("-15s", 0.75), ("Now", 1.0))
        for t_lbl, t_frac in t_marks:
            tx = pad_left + plot_w * t_frac
            c.create_line(tx, pad_top + plot_h, tx, pad_top + plot_h + 3, fill=grid_col)
            c.create_text(tx, h - 8, text=t_lbl, fill=cur("text_muted"), font=(UI_FONT, 7, "bold"), anchor="center")

        pts = []
        n = len(samples)
        for i, val in enumerate(samples):
            px = pad_left + (i / (n - 1)) * plot_w
            py = pad_top + plot_h * (1.0 - min(1.0, max(0.0, val / max_v)))
            pts.append((px, py))

        fill_col = "#132c45" if ctk.get_appearance_mode() == "Dark" else "#dbeafe"
        line_col = cur("accent_cyan")

        # Shaded area polygon
        poly = [pad_left, pad_top + plot_h]
        for px, py in pts:
            poly.extend((px, py))
        poly.extend((pts[-1][0], pad_top + plot_h))
        c.create_polygon(poly, fill=fill_col, outline="")

        # Main curve line
        flat_line = []
        for px, py in pts:
            flat_line.extend((px, py))
        c.create_line(flat_line, fill=line_col, width=2.2, smooth=True)

        # Peak indicator dashed line & badge
        if max_sample > 0:
            peak_y = pad_top + plot_h * (1.0 - min(1.0, max_sample / max_v))
            c.create_line(pad_left, peak_y, pad_left + plot_w, peak_y, fill=cur("warning"), dash=(3, 3))
            c.create_text(
                pad_left + plot_w - 6 if not is_rtl() else pad_left + 6,
                max(pad_top + 6, peak_y - 6),
                text=f"{t('st_peak_line')}: {fmt_speed(max_sample)}",
                fill=cur("warning"), font=(UI_FONT, 8, "bold"),
                anchor="e" if not is_rtl() else "w"
            )

        # Pulse dot on latest sample
        lx, ly = pts[-1]
        c.create_oval(lx - 5, ly - 5, lx + 5, ly + 5, outline=line_col, width=1.5)
        c.create_oval(lx - 3, ly - 3, lx + 3, ly + 3, fill=line_col, outline="#ffffff", width=1)

    def _filter_history(self):
        sq = self.h_search_var.get()
        records = self.history_manager.get_records(
            status_filter=self._cur_status_filter,
            search_query=sq,
            date_filter=self._cur_date_filter,
            limit=500
        )
        self._populate_tree(records)

    def _reload_history(self):
        self._history_dirty = False
        self._filter_history()

    def _populate_tree(self, records: list):
        self._current_history_records = records
        for item in self.h_tree.get_children():
            self.h_tree.delete(item)

        total_bytes = 0
        for r in records:
            sz = int(r.get("size_bytes", 0) or r.get("downloaded_bytes", 0) or 0)
            total_bytes += sz
            st = r.get("status", "")
            st_text = t("st_status_ok") if st == "completed" else t("st_status_fail")
            spd = int(r.get("avg_speed_bps", 0) or 0)
            dur = f"{r.get('duration_sec', 0.0):.1f}s"
            cat_key = r.get("category", "")
            cat_label = t(cat_key) if cat_key in E.I18N.get(E.LANG, {}) else cat_key
            row_id = self.h_tree.insert(
                "", "end",
                values=(
                    r.get("timestamp", ""),
                    bidi(r.get("filename", "")),
                    bidi(cat_label),
                    fmt_size(sz),
                    bidi(st_text),
                    fmt_speed(spd),
                    dur,
                    r.get("domain", "")
                ),
                tags=(st,)
            )

        self.h_tree.tag_configure("completed", foreground=cur("success"))
        self.h_tree.tag_configure("failed", foreground=cur("danger"))

        cnt_msg = f"{len(records)} {t('u_downloads')}  •  {fmt_size(total_bytes)}"
        self.lbl_h_status.configure(text=bidi(cnt_msg))

    def _on_tree_double_click(self, event):
        sel = self.h_tree.selection()
        if not sel:
            return
        idx = self.h_tree.index(sel[0])
        if 0 <= idx < len(self._current_history_records):
            rec = self._current_history_records[idx]
            p = rec.get("save_path", "")
            if p and os.path.exists(p):
                try:
                    os.startfile(p)
                except Exception as e:
                    messagebox.showerror("Error", str(e), parent=self)
            else:
                messagebox.showinfo("NegmLoading", t("fn_not_found") if "fn_not_found" in E.I18N.get(E.LANG, {}) else "File no longer exists on disk.", parent=self)

    def _show_tree_context_menu(self, event):
        row_id = self.h_tree.identify_row(event.y)
        if not row_id:
            return
        self.h_tree.selection_set(row_id)
        idx = self.h_tree.index(row_id)
        if not (0 <= idx < len(self._current_history_records)):
            return
        rec = self._current_history_records[idx]

        menu = tk.Menu(self, tearoff=0, bg=cur("card"), fg=cur("text"), activebackground=cur("primary"), activeforeground="#ffffff", disabledforeground=cur("text_muted"), font=(UI_FONT, 10))
        p = rec.get("save_path", "")
        file_exists = bool(p and os.path.exists(p))

        if file_exists:
            menu.add_command(label=t("st_ctx_open_file"), command=lambda: os.startfile(p))
            menu.add_command(
                label=t("st_ctx_open_dir"),
                command=lambda: subprocess.run(["explorer", "/select,", os.path.normpath(p)], check=False)
            )
            menu.add_separator()

        menu.add_command(label=t("st_ctx_copy_url"), command=lambda: self._copy_to_clip(rec.get("url", "")))
        menu.add_command(label=t("st_ctx_copy_name"), command=lambda: self._copy_to_clip(rec.get("filename", "")))
        menu.add_separator()
        menu.add_command(label=t("st_ctx_del_rec"), command=lambda: self._delete_history_record(rec.get("id", "")))

        try:
            menu.tk_popup(event.x_root, event.y_root)
        finally:
            menu.grab_release()

    def _copy_to_clip(self, text: str):
        if text:
            self.clipboard_clear()
            self.clipboard_append(text)

    def _delete_history_record(self, record_id: str):
        if record_id:
            self.history_manager.delete_record(record_id)
            self._reload_history()
            self._refresh_all()

    def _confirm_clear(self):
        if messagebox.askyesno(t("st_clear_hist"), t("st_confirm_clear_hist"), parent=self):
            self.history_manager.clear_history()
            self._reload_history()
            self._refresh_domains()
            self._refresh_all()

    def _refresh_domains(self):
        for w in self.domains_scroll.winfo_children():
            w.destroy()

        summary = self.history_manager.get_summary()
        top_domains = summary.get("top_domains", [])
        tot_bytes = max(1, summary.get("lifetime_bytes", 0))

        if not top_domains:
            ctk.CTkLabel(
                self.domains_scroll, text=bidi(t("st_hist_empty")),
                font=uifont(12), text_color=col("text_muted")
            ).pack(pady=40)
            return

        side = s_start()
        for idx, d in enumerate(top_domains, 1):
            dm = d["domain"]
            cnt = d["count"]
            sz = d["bytes"]
            pct = min(1.0, sz / tot_bytes)

            row = ctk.CTkFrame(self.domains_scroll, corner_radius=9, fg_color=col("card"), border_width=1, border_color=col("border_light"))
            row.pack(fill="x", pady=3, padx=2)

            top = ctk.CTkFrame(row, fg_color="transparent")
            top.pack(fill="x", padx=10, pady=(6, 2))

            ctk.CTkLabel(top, text=ico("globe"), font=ifont(12), text_color=col("accent_cyan")).pack(side=side, padx=px_inline(0, 6))
            ctk.CTkLabel(top, text=f"#{idx}  {dm}", font=uifont(11, "bold"), text_color=col("text")).pack(side=side)

            info_txt = f"{cnt} {t('st_domain_files')}  •  {fmt_size(sz)} ({pct*100.0:.1f}%)"
            ctk.CTkLabel(top, text=bidi(info_txt), font=uifont(10, "bold"), text_color=col("text_muted")).pack(side=s_end())

            pbar = ctk.CTkProgressBar(row, height=5, corner_radius=3, progress_color=col("accent_cyan"), fg_color=col("track"))
            pbar.set(pct)
            pbar.pack(fill="x", padx=10, pady=(0, 6))

    def _prompt_export(self):
        fpath = filedialog.asksaveasfilename(
            parent=self,
            title=t("st_export_report"),
            defaultextension=".csv",
            filetypes=[
                ("CSV Spreadsheet (*.csv)", "*.csv"),
                ("Interactive HTML Report (*.html)", "*.html"),
                ("JSON Data (*.json)", "*.json")
            ]
        )
        if not fpath:
            return

        ext = os.path.splitext(fpath)[1].lower()
        records = getattr(self, "_current_history_records", None) or self.history_manager.get_records(limit=10000)
        ok = False
        if ext == ".json":
            ok = self.history_manager.export_json(fpath, records)
        elif ext == ".html" or ext == ".htm":
            ok = self.history_manager.export_html(fpath, records, title="NegmLoading Analytics Report")
        else:
            ok = self.history_manager.export_csv(fpath, records)

        if ok:
            self.app.toast(
                t("st_export_ok"),
                os.path.basename(fpath),
                accent="success",
                icon="check",
                action_label=t("dlg_open_file"),
                on_click=lambda: os.startfile(fpath) if os.path.exists(fpath) else None,
                duration=6000
            )
        else:
            messagebox.showerror("Error", "Failed to export report.", parent=self)

    def _tick_loop(self):
        if not self.winfo_exists() or self.app.is_closing:
            return
        if self.page_overview.winfo_ismapped():
            self._refresh_all()
        self.after(500, self._tick_loop)


class ExportImportDialog(BaseDialog):
    """Export & Import download lists (.txt, IDM .ef2 with headers, and full NEGM .json backup)."""
    def __init__(self, app):
        super().__init__(app, t("ei_title"), 640, 520)
        self.app = app
        card = self.card()

        self.dialog_header(card, "exchange", t("ei_title"), icon_color="primary_text", padx=20, pady=(16, 6))

        btns = ctk.CTkFrame(card, fg_color="transparent")
        btns.pack(fill="x", padx=20, pady=(6, 14), side="bottom")
        IconButton(btns, "xmark", t("u_close"), self.destroy, style="ghost").pack(side=s_end())

        self.section(card, t("ei_exp_sec"), padx=20)
        exp_box = ctk.CTkFrame(card, corner_radius=11, fg_color=col("card_alt"), border_width=1, border_color=col("border_light"))
        exp_box.pack(fill="x", padx=20, pady=(2, 8))

        opt_all = t("ei_exp_scope_all")
        opt_sel = t("ei_exp_scope_sel")
        self._opt_all = opt_all
        self._opt_sel = opt_sel
        default_scope = opt_sel if len(app.selected) > 0 else opt_all
        self.scope_var = ctk.StringVar(value=default_scope)

        srow = ctk.CTkFrame(exp_box, fg_color="transparent")
        srow.pack(fill="x", padx=12, pady=(10, 6))
        self.seg = SegmentedControl(
            srow, values=[opt_all, opt_sel], variable=self.scope_var,
            command=lambda _v: self._update_scope_lbl(), height=34, expand_items=False,
        )
        self.seg.pack(side=s_start())
        self.lbl_scope_cnt = ctk.CTkLabel(srow, text="", font=uifont(11, "bold"), text_color=col("accent_cyan"))
        self.lbl_scope_cnt.pack(side=s_end(), padx=6)

        ebtns = ctk.CTkFrame(exp_box, fg_color="transparent")
        ebtns.pack(fill="x", padx=12, pady=(4, 12))
        side = s_start()
        IconButton(ebtns, "file-export", t("ei_exp_json"), lambda: self._do_export("json"), style="primary", text_size=11, padx=11, pady=7).pack(
            side=side, padx=px_inline(0, 6),
        )
        IconButton(ebtns, "layers", t("ei_exp_ef2"), lambda: self._do_export("ef2"), style="soft", text_size=11, padx=10, pady=7).pack(
            side=side, padx=px_inline(0, 6),
        )
        IconButton(ebtns, "doc", t("ei_exp_txt"), lambda: self._do_export("txt"), style="soft", text_size=11, padx=10, pady=7).pack(side=side)

        self.section(card, t("ei_imp_sec"), padx=20)
        imp_box = ctk.CTkFrame(card, corner_radius=11, fg_color=col("card_alt"), border_width=1, border_color=col("border_light"))
        imp_box.pack(fill="x", padx=20, pady=(2, 8))
        ctk.CTkLabel(
            imp_box, text=bidi(t("ei_imp_desc")), anchor=a_start(), justify=j_start(), wraplength=540,
            font=uifont(11), text_color=col("text_muted"),
        ).pack(fill="x", padx=12, pady=(10, 8))

        irow = ctk.CTkFrame(imp_box, fg_color="transparent")
        irow.pack(fill="x", padx=12, pady=(0, 12))
        self.v_start_imp = ctk.BooleanVar(value=True)
        make_checkbox(irow, t("dlg_batch_start_now"), self.v_start_imp, side=side)
        IconButton(irow, "file-import", t("ei_imp_btn"), self._do_import, style="primary", text_size=11, padx=14, pady=8).pack(side=s_end())

        self._update_scope_lbl()

    def _target_tasks(self):
        if strip_bidi(self.scope_var.get()) == strip_bidi(self._opt_sel):
            return self.app.sel_tasks()
        return [it["task"] for it in self.app.tasks]

    def _update_scope_lbl(self):
        n = len(self._target_tasks())
        self.lbl_scope_cnt.configure(text=bidi(f"{n} {t('u_downloads')}"))

    def _do_export(self, fmt: str):
        tasks = self._target_tasks()
        if not tasks and fmt != "json":
            self.app.toast(t("app_title"), f"0 {t('u_downloads')}", accent="warning", icon="warning")
            return
        ext_map = {
            "txt": (".txt", [("Text URL List", "*.txt")]),
            "ef2": (".ef2", [("IDM Export File", "*.ef2")]),
            "json": (".json", [("NegmLoading Full Backup", "*.json")]),
        }
        def_ext, ftypes = ext_map[fmt]
        stamp = datetime.date.today().strftime("%Y%m%d")
        default_name = f"negm_downloads_{stamp}{def_ext}"
        path = fd.asksaveasfilename(
            parent=self, defaultextension=def_ext, initialfile=default_name, filetypes=ftypes,
        )
        if not path:
            return
        ok, res = export_tasks_to_file(tasks, path, fmt=fmt, settings=self.app.settings)
        if ok:
            self.app.toast(t("ei_exp_ok"), f"{res} {t('u_downloads')} • {os.path.basename(path)}", accent="success", icon="check")
        else:
            self.app.toast(t("t_fail"), str(res), accent="danger", icon="warning")

    def _do_import(self):
        path = fd.askopenfilename(
            parent=self,
            filetypes=[
                ("NegmLoading / IDM / URL Lists", "*.txt *.ef2 *.json"),
                ("IDM Export (.ef2)", "*.ef2"),
                ("NegmLoading Backup (.json)", "*.json"),
                ("URL Text (.txt)", "*.txt"),
                ("All Files", "*.*"),
            ],
        )
        if not path:
            return
        kind, data = parse_import_file(path)
        if kind == "error":
            self.app.toast(t("t_fail"), str(data), accent="danger", icon="warning")
            return

        added = 0
        start_now = bool(self.v_start_imp.get())
        if kind == "links":
            folder = self.app.settings.get("folder", os.path.expanduser("~"))
            for item in data:
                u = (item.get("url") or "").strip()
                if not u:
                    continue
                fname = item.get("filename") or extract_filename_from_url(u, "download_file.bin")
                save_path = os.path.join(folder, E.sanitize_filename(fname))
                hdrs = item.get("headers") or None
                t_obj = self.app.add_task(u, save_path, start_now=start_now, silent_toast=True, extra_headers=hdrs)
                if t_obj is not None:
                    added += 1
        elif kind == "backup":
            existing_ids = {it["task"].task_id for it in self.app.tasks}
            existing_active_urls = {it["task"].url for it in self.app.tasks if not it["task"].is_completed}
            proxy = self.app.get_active_proxy()
            for td in data.get("tasks", []):
                try:
                    if td.get("task_id") in existing_ids:
                        continue
                    if td.get("url") in existing_active_urls and not td.get("is_completed"):
                        continue
                    task = DownloadTask.from_dict(td)
                    task.hold = not start_now
                    if proxy:
                        task.set_proxy(proxy)
                    if task.state in ("completed", "failed"):
                        task._notified = True
                    row = DownloadRow(self.app.scroll, task, self.app)
                    self.app.tasks.append({"task": task, "row": row})
                    existing_ids.add(task.task_id)
                    added += 1
                except Exception:
                    pass
            self.app.relayout_grid()
            if start_now and not self.app.is_quota_exceeded():
                self.app.process_queue()
            self.app.save_state()

        self.app.toast(t("ei_imp_ok"), f"{added} {t('u_downloads')} • {os.path.basename(path)}", accent="success", icon="file-import")
        self.destroy()


class BrowserBridgeDialog(BaseDialog):
    """Setup & live control panel for NEGM's Local Browser Bridge & Chrome/Edge Extension."""
    def __init__(self, app):
        super().__init__(app, t("br_title"), 670, 545)
        self.app = app
        self.ext_dir = resolve_browser_extension_dir()
        card = self.card()

        self.dialog_header(card, "puzzle", t("br_title"), icon_color="accent_cyan", padx=20, pady=(16, 6))

        btns = ctk.CTkFrame(card, fg_color="transparent")
        btns.pack(fill="x", padx=20, pady=(4, 14), side="bottom")
        IconButton(btns, "xmark", t("u_close"), self.destroy, style="ghost").pack(side=s_end())

        self.banner = ctk.CTkFrame(card, corner_radius=10, fg_color=col("card_alt"), border_width=1, border_color=col("border_light"))
        self.banner.pack(fill="x", padx=20, pady=(4, 8))
        brow = ctk.CTkFrame(self.banner, fg_color="transparent")
        brow.pack(fill="x", padx=14, pady=10)
        side = s_start()
        self.lbl_dot = ctk.CTkLabel(brow, text="●", font=uifont(15, "bold"))
        self.lbl_dot.pack(side=side, padx=px_inline(0, 8))
        self.lbl_status = ctk.CTkLabel(brow, text="", font=uifont(12, "bold"), anchor=a_start())
        self.lbl_status.pack(side=side, fill="x", expand=True)

        self.v_enable = ctk.BooleanVar(value=bool(app.settings.get("browser_bridge", True)))
        make_switch(card, t("br_enable_sw"), self.v_enable, progress_color="primary", command=self._on_toggle, padx=20, pady=(2, 8))

        prow = ctk.CTkFrame(card, fg_color="transparent")
        prow.pack(fill="x", padx=20, pady=(4, 6))
        ent_path = ctk.CTkEntry(
            prow, height=36, corner_radius=8, font=monofont(11),
            fg_color=col("input"), border_color=col("border"), text_color=col("text"),
        )
        ent_path.insert(0, self.ext_dir)
        ent_path.configure(state="readonly")
        ent_path.pack(fill="x")

        act_row = ctk.CTkFrame(card, fg_color="transparent")
        act_row.pack(fill="x", padx=20, pady=(2, 10))
        IconButton(act_row, "folder-open", t("br_open_folder"), self._open_ext_folder, style="primary", text_size=11, padx=12, pady=7).pack(
            side=side, padx=px_inline(0, 6),
        )
        IconButton(act_row, "copy", t("br_copy_chrome"), lambda: self._copy_ext_url("chrome://extensions"), style="soft", text_size=11, padx=10, pady=7).pack(
            side=side, padx=px_inline(0, 6),
        )
        IconButton(act_row, "copy", t("br_copy_edge"), lambda: self._copy_ext_url("edge://extensions"), style="soft", text_size=11, padx=10, pady=7).pack(side=side)

        steps_box = ctk.CTkFrame(card, corner_radius=11, fg_color=col("header"), border_width=1, border_color=col("border_light"))
        steps_box.pack(fill="x", padx=20, pady=(2, 8))
        ctk.CTkLabel(
            steps_box, text=bidi(t("br_steps_title")), anchor=a_start(), font=uifont(12, "bold"),
            text_color=col("accent_cyan"),
        ).pack(fill="x", padx=14, pady=(10, 4))
        for sk in ("br_step1", "br_step2", "br_step3"):
            ctk.CTkLabel(
                steps_box, text=bidi(t(sk)), anchor=a_start(), justify=j_start(), wraplength=570,
                font=uifont(11), text_color=col("text"),
            ).pack(fill="x", padx=14, pady=2)
        ctk.CTkFrame(steps_box, height=6, fg_color="transparent").pack()

        self._refresh_banner()

    def _refresh_banner(self):
        running = bool(self.app.bridge_server and self.app.bridge_server.is_running)
        if running:
            self.lbl_dot.configure(text_color=col("success"))
            self.lbl_status.configure(text=bidi(t("br_status_on")), text_color=col("success"))
        else:
            self.lbl_dot.configure(text_color=col("warning"))
            self.lbl_status.configure(text=bidi(t("br_status_off")), text_color=col("warning"))

    def _on_toggle(self):
        self.app.set_browser_bridge(bool(self.v_enable.get()))
        self._refresh_banner()

    def _open_ext_folder(self):
        os.makedirs(self.ext_dir, exist_ok=True)
        try:
            os.startfile(self.ext_dir)
        except Exception:
            pass

    def _copy_ext_url(self, text: str):
        try:
            self.app.last_clip = text
            self.clipboard_clear()
            self.clipboard_append(text)
            self.app.toast(t("dlg_hash_copied"), text, accent="cyan", icon="copy", duration=3500)
        except Exception:
            pass


class ShortcutsDialog(BaseDialog):
    ROWS = (
        ("Ctrl+N / V", "sc_add"), ("Ctrl+Y", "u_video"),
        ("Ctrl+G", "u_spider"), ("Ctrl+B", "u_batch"),
        ("Ctrl+I", "u_stats"), ("Ctrl+Shift+E", "u_exp_imp"),
        ("Space", "sc_toggle"), ("Enter", "sc_open"),
        ("Delete", "sc_remove"), ("Shift+Del", "sc_delfile"),
        ("Ctrl+A", "sc_all"), ("↑ / ↓", "sc_nav"),
        ("Ctrl+F", "sc_search"), ("Esc", "sc_esc"),
        ("Ctrl+E", "sc_folder"), ("Ctrl+1…5", "sc_cats"),
        ("Ctrl+L", "sc_limit"), ("Ctrl+T", "sc_sched"),
        ("Ctrl+,", "sc_opts"), ("F5", "sc_retry"),
        ("F9", "u_drop_basket"), ("F1", "sc_help"),
    )

    def __init__(self, app):
        super().__init__(app, t("u_sc_title"), 760, 565, modal=False)
        card = self.card()
        self.dialog_header(card, "keyboard", t("u_sc_title"), icon_color="primary_text", padx=22, pady=(16, 6))

        btns = ctk.CTkFrame(card, fg_color="transparent")
        btns.pack(fill="x", padx=22, pady=(8, 16), side="bottom")
        IconButton(btns, "xmark", t("u_close"), self.destroy, style="soft", padx=16, pady=8).pack(side=s_end())

        for key in ("sc_mouse2", "sc_mouse1"):
            ctk.CTkLabel(
                card, text=bidi(t(key)), anchor=a_start(), font=uifont(11),
                text_color=col("text_muted"),
            ).pack(fill="x", padx=24, pady=1, side="bottom")

        body = ctk.CTkScrollableFrame(card, fg_color=col("header"), corner_radius=12, height=300)
        body.pack(fill="both", expand=True, padx=22, pady=(4, 8))
        body.grid_columnconfigure((0, 1), weight=1, uniform="sc")

        side = s_start()
        for idx, (keys, desc) in enumerate(self.ROWS):
            r, c_idx = divmod(idx, 2)
            col_actual = (1 - c_idx) if is_rtl() else c_idx
            cell = ctk.CTkFrame(body, fg_color="transparent")
            cell.grid(row=r, column=col_actual, sticky="ew", padx=10, pady=3)
            kbd = ctk.CTkFrame(cell, corner_radius=7, fg_color=col("card"), border_width=1, border_color=col("border_light"), width=106, height=26)
            kbd.pack(side=side)
            kbd.pack_propagate(False)
            ctk.CTkLabel(kbd, text=keys, font=monofont(10, "bold"), text_color=col("primary_text")).place(relx=0.5, rely=0.5, anchor="center")
            ctk.CTkLabel(
                cell, text=bidi(short_text(t(desc), 30)), anchor=a_start(), font=uifont(11),
                text_color=col("text"),
            ).pack(side=side, padx=10)


class QueueEditDialog(BaseDialog):
    """Modal dialog for creating a new queue or editing an existing queue."""
    def __init__(self, app, queue_data=None, on_saved=None):
        self.queue_data = dict(queue_data) if queue_data else None
        is_edit = bool(self.queue_data)
        title = t("dlg_edit_queue") if is_edit else t("dlg_new_queue")
        super().__init__(app, title, 500, 480)
        self.on_saved = on_saved
        card = self.card()
        self.dialog_header(card, "layer-group", title, icon_color="primary_text", padx=20, pady=(16, 4))

        btns = ctk.CTkFrame(card, fg_color="transparent")
        btns.pack(fill="x", padx=20, pady=(12, 16), side="bottom")
        IconButton(btns, "xmark", t("u_cancel"), self.destroy, style="ghost").pack(side=s_end())
        IconButton(btns, "check", t("u_save"), self._save, style="primary").pack(side=s_start())

        # Queue Name
        self.section(card, t("dlg_queue_name"), padx=20)
        self.name_entry = ctk.CTkEntry(
            card, height=36, corner_radius=8, font=uifont(12),
            fg_color=col("input"), border_color=col("border"), text_color=col("text"),
        )
        if self.queue_data:
            self.name_entry.insert(0, self.queue_data.get("name", ""))
        self.name_entry.pack(fill="x", padx=20)

        # Max Parallel Downloads
        self.section(card, t("dlg_queue_max_parallel"), padx=20, pady=(10, 4))
        cur_parallel = str(self.queue_data.get("max_parallel", 3)) if self.queue_data else "3"
        self.parallel_var = ctk.StringVar(value=cur_parallel)
        self.parallel_seg = SegmentedControl(
            card, values=["1", "2", "3", "4", "5", "8"],
            variable=self.parallel_var
        )
        self.parallel_seg.set(cur_parallel)
        self.parallel_seg.pack(fill="x", padx=20)

        # Custom Folder (Optional)
        self.section(card, t("dlg_queue_folder"), padx=20, pady=(10, 4))
        f_row = ctk.CTkFrame(card, fg_color="transparent")
        f_row.pack(fill="x", padx=20)
        self.folder_entry = ctk.CTkEntry(
            f_row, height=36, corner_radius=8, font=uifont(11),
            placeholder_text=app.settings.get("folder", ""),
            fg_color=col("input"), border_color=col("border"), text_color=col("text"),
        )
        if self.queue_data:
            self.folder_entry.insert(0, self.queue_data.get("folder", ""))
        self.folder_entry.pack(side=s_start(), fill="x", expand=True)
        IconButton(f_row, "folder-open", t("u_browse"), self._browse_folder, style="soft").pack(side=s_end(), padx=px_inline(6, 0))

        # Schedule Window
        self.section(card, t("dlg_queue_sched_start") + "  ➔  " + t("dlg_queue_sched_stop"), padx=20, pady=(10, 4))
        s_row = ctk.CTkFrame(card, fg_color="transparent")
        s_row.pack(fill="x", padx=20)
        self.start_entry = ctk.CTkEntry(
            s_row, height=36, corner_radius=8, font=uifont(11), placeholder_text="02:00",
            fg_color=col("input"), border_color=col("border"), text_color=col("text"), width=120
        )
        if self.queue_data:
            self.start_entry.insert(0, self.queue_data.get("schedule_start", ""))
        self.start_entry.pack(side=s_start())

        ctk.CTkLabel(s_row, text="  ➔  ", font=uifont(12, "bold"), text_color=col("text_muted")).pack(side=s_start(), padx=4)

        self.stop_entry = ctk.CTkEntry(
            s_row, height=36, corner_radius=8, font=uifont(11), placeholder_text="06:00",
            fg_color=col("input"), border_color=col("border"), text_color=col("text"), width=120
        )
        if self.queue_data:
            self.stop_entry.insert(0, self.queue_data.get("schedule_stop", ""))
        self.stop_entry.pack(side=s_start())

        self.err_lbl = ctk.CTkLabel(card, text="", font=uifont(11, "bold"), text_color=col("danger"))
        self.err_lbl.pack(fill="x", padx=20, pady=(6, 0))

    def _browse_folder(self):
        f = fd.askdirectory(parent=self)
        if f:
            self.folder_entry.delete(0, "end")
            self.folder_entry.insert(0, f)

    def _save(self):
        name = self.name_entry.get().strip()
        if not name:
            self.err_lbl.configure(text=bidi("⚠ " + t("dlg_queue_name")))
            return
        st = self.start_entry.get().strip()
        sp = self.stop_entry.get().strip()
        for t_val in (st, sp):
            if t_val:
                try:
                    parts = t_val.split(":")
                    h, m = int(parts[0]), int(parts[1])
                    if not (0 <= h < 24 and 0 <= m < 60):
                        raise ValueError
                except Exception:
                    self.err_lbl.configure(text=bidi("⚠ " + t("u_bad_time")))
                    return

        try:
            par = int(self.parallel_var.get())
        except Exception:
            par = 3

        folder = self.folder_entry.get().strip()
        qid = self.queue_data.get("id") if self.queue_data else f"q_{int(time.time()*1000)%1000000}"
        enabled = self.queue_data.get("enabled", True) if self.queue_data else True

        data = {
            "id": qid,
            "name": name,
            "max_parallel": par,
            "folder": folder,
            "schedule_start": st,
            "schedule_stop": sp,
            "enabled": enabled,
        }
        self.app.save_queue_item(data)
        if callable(self.on_saved):
            self.on_saved(data)
        self.destroy()


class QueueManagerDialog(BaseDialog):
    """Modal dialog for viewing, adding, configuring and deleting custom download queues."""
    def __init__(self, app):
        super().__init__(app, t("dlg_queue_manager_title"), 640, 520)
        card = self.card()
        self.dialog_header(card, "layer-group", t("dlg_queue_manager_title"), icon_color="primary_text", padx=20, pady=(16, 4))

        # Bottom button
        bottom = ctk.CTkFrame(card, fg_color="transparent")
        bottom.pack(fill="x", padx=20, pady=(10, 16), side="bottom")
        IconButton(bottom, "check", t("u_close"), self.destroy, style="primary").pack(side=s_end())

        # Top action bar with "+ New Queue"
        top_bar = ctk.CTkFrame(card, fg_color="transparent")
        top_bar.pack(fill="x", padx=20, pady=(6, 10))
        IconButton(top_bar, "plus", t("dlg_new_queue"), self._new_queue, style="primary").pack(side=s_start())

        # Scrollable list
        self.scroll = ctk.CTkScrollableFrame(card, fg_color="transparent")
        self.scroll.pack(fill="both", expand=True, padx=20, pady=4)
        self._refresh_list()

    def _refresh_list(self):
        for child in self.scroll.winfo_children():
            child.destroy()

        queues = self.app.get_all_queues()
        side_st = s_start()
        side_en = s_end()

        for q in queues:
            qid = q.get("id", "main")
            qname = q.get("name", t("queue_main"))
            par = q.get("max_parallel", 3)
            sched = ""
            if q.get("schedule_start") and q.get("schedule_stop"):
                sched = f"{q['schedule_start']} - {q['schedule_stop']}"
            folder = q.get("folder", "")
            is_enabled = q.get("enabled", True)

            # Count tasks
            q_tasks = [t for t in self.app.tasks if getattr(t["task"], "queue_id", "main") == qid]
            q_active = sum(1 for t in q_tasks if t["task"].state == "active")

            q_card = ctk.CTkFrame(
                self.scroll, corner_radius=10, fg_color=col("card_row"),
                border_width=1, border_color=col("border_light")
            )
            q_card.pack(fill="x", pady=5)

            # Top header inside card
            hdr_f = ctk.CTkFrame(q_card, fg_color="transparent")
            hdr_f.pack(fill="x", padx=12, pady=(10, 4))

            title_txt = f"{qname}"
            if qid == "main":
                title_txt += f" ({t('queue_badge_default_folder')})"
            lbl_title = ctk.CTkLabel(hdr_f, text=bidi(title_txt), font=uifont(12, "bold"), text_color=col("text"))
            lbl_title.pack(side=side_st)

            # Actions on the end of header
            if qid != "main":
                IconButton(hdr_f, "trash", "", lambda q_item=q: self._delete_queue(q_item), style="ghost", icon_color="danger", tooltip=t("u_delete")).pack(side=side_en, padx=2)
            IconButton(hdr_f, "gear", "", lambda q_item=q: self._edit_queue(q_item), style="ghost", icon_color="text_muted", tooltip=t("u_options")).pack(side=side_en, padx=2)

            # Badges row
            bdg_f = ctk.CTkFrame(q_card, fg_color="transparent")
            bdg_f.pack(fill="x", padx=12, pady=(0, 10))

            # Concurrency badge
            p_badge = ctk.CTkFrame(bdg_f, corner_radius=6, fg_color=col("pill_active"))
            p_badge.pack(side=side_st, padx=px_inline(0, 6))
            ctk.CTkLabel(p_badge, text=bidi(f"⚡ {par} {t('queue_badge_concurrent')}"), font=uifont(10), text_color=col("accent_cyan")).pack(padx=6, pady=2)

            # Task count badge
            c_badge = ctk.CTkFrame(bdg_f, corner_radius=6, fg_color=col("pill_idle"))
            c_badge.pack(side=side_st, padx=px_inline(0, 6))
            c_txt = f"{len(q_tasks)} {t('u_downloads')}"
            if q_active > 0:
                c_txt += f" ({q_active} {t('u_active_n')})"
            ctk.CTkLabel(c_badge, text=bidi(c_txt), font=uifont(10), text_color=col("text")).pack(padx=6, pady=2)

            # Schedule badge if present
            if sched:
                s_badge = ctk.CTkFrame(bdg_f, corner_radius=6, fg_color=col("pill_warn"))
                s_badge.pack(side=side_st, padx=px_inline(0, 6))
                ctk.CTkLabel(s_badge, text=bidi(f"⏱ {sched}"), font=uifont(10), text_color=col("warning")).pack(padx=6, pady=2)

            # Folder badge if custom
            if folder:
                f_badge = ctk.CTkFrame(bdg_f, corner_radius=6, fg_color=col("pill_idle"))
                f_badge.pack(side=side_st, padx=px_inline(0, 6))
                ctk.CTkLabel(f_badge, text=bidi(f"📁 {os.path.basename(folder) or folder}"), font=uifont(10), text_color=col("text_muted")).pack(padx=6, pady=2)

    def _new_queue(self):
        QueueEditDialog(self.app, None, on_saved=lambda _: self._refresh_list())

    def _edit_queue(self, queue_item):
        QueueEditDialog(self.app, queue_item, on_saved=lambda _: self._refresh_list())

    def _delete_queue(self, queue_item):
        self.app.delete_queue_item(queue_item.get("id"))
        self._refresh_list()


class CommandPaletteDialog(BaseDialog):
    """
    Spotlight / Raycast style Command Palette (Ctrl+K).
    Instant keyboard-driven launcher across all actions, dialogs, settings, and URLs.
    """
    def __init__(self, app):
        title = t("cmd_palette_title")
        super().__init__(app, title, 540, 420, modal=True)
        self.app = app
        self.selected_idx = 0
        self.rendered_items = []

        self.commands_def = [
            ("plus", "primary", "إضافة رابط جديد", "Add Link", "Ctrl+N", app.show_add_dialog),
            ("film", "danger", "ساحب الفيديو والوسائط", "Video Grabber", "Ctrl+Y", app.show_media_dialog),
            ("list", "accent_cyan", "تحميل دفعة روابط", "Batch Download", "Ctrl+B", app.show_batch_dialog),
            ("globe", "warning", "ساحب الروابط من المواقع", "Site Links Spider", "Ctrl+G", app.show_spider_dialog),
            ("play", "success", "استئناف كل التحميلات", "Resume All", "", app.act_resume_all),
            ("pause", "warning", "إيقاف كل التحميلات", "Pause All", "", app.act_stop_all),
            ("gauge", "accent_cyan", "محدد السرعة العام", "Speed Limiter", "Ctrl+L", app.show_limiter),
            ("clock", "warning", "جدولة التنزيلات والإطفاء", "Scheduler", "Ctrl+T", app.show_scheduler),
            ("gear", "primary_text", "خيارات وإعدادات البرنامج", "Options", "Ctrl+,", app.show_options),
            ("chart-bar", "accent_cyan", "الإحصائيات والتحليلات", "Analytics", "Ctrl+I", app.show_analytics),
            ("arrow-right-arrow-left", "primary", "تصدير / استيراد التنزيلات", "Export / Import", "Ctrl+Shift+E", app.show_export_import),
            ("shield", "success", "فحص التجزئة Checksum", "Verify Checksum", "", app.act_checksum),
            ("puzzle", "accent_cyan", "ربط المتصفح والإضافة", "Browser Bridge", "", app.show_browser_bridge),
            ("moon", "primary", "تبديل المظهر الداكن / الفاتح", "Toggle Theme", "", app.toggle_theme),
            ("language", "accent_cyan", "تبديل اللغة (عربي / English)", "Switch Language", "", app.quick_language),
            ("layer-group", "primary_text", "إدارة طوابير التنزيل", "Queue Manager", "Ctrl+Q", app.show_queue_manager),
            ("keyboard", "text_muted", "دليل الاختصارات السريعة", "Shortcuts Guide", "F1", app.show_shortcuts),
            ("server", "accent_cyan", "مدير البروكسيات المتقدم", "Proxy Manager", "Ctrl+Shift+P", app.show_proxy_manager),
            ("key", "primary_text", "خزنة بيانات الحسابات والمواقع", "Site Credentials Vault", "Ctrl+Shift+K", app.show_site_vault),
            ("mobile", "accent_cyan", "التحكم عن بُعد عبر الويب والهاتف", "Web Remote Control", "Ctrl+Shift+W", app.show_web_remote),
            ("power", "danger", "أتمتة ما بعد اكتمال التحميل", "Post-Download Automation", "Ctrl+Shift+A", app.show_post_download_dialog),
        ]

        # Top search container
        top_bar = ctk.CTkFrame(self, fg_color=col("card"), corner_radius=12, border_width=1, border_color=col("border_light"), height=52)
        top_bar.pack(fill="x", padx=16, pady=(16, 10))
        top_bar.pack_propagate(False)

        side = s_start()
        side_rev = s_end()

        ctk.CTkLabel(top_bar, text=ico("search"), font=ifont(14), text_color=col("accent_cyan")).pack(side=side, padx=12)

        self.query_var = ctk.StringVar()
        self.query_var.trace_add("write", lambda *_: self._filter_commands())

        self.entry = ctk.CTkEntry(
            top_bar,
            textvariable=self.query_var,
            placeholder_text=bidi(t("cmd_palette_ph")),
            font=uifont(12),
            fg_color="transparent",
            border_width=0,
            text_color=col("text")
        )
        self.entry.pack(side=side, fill="both", expand=True, padx=4)

        kbd_tag = ctk.CTkFrame(top_bar, corner_radius=6, fg_color=col("bg"), border_width=1, border_color=col("border_light"))
        kbd_tag.pack(side=side_rev, padx=10, pady=12)
        ctk.CTkLabel(kbd_tag, text="ESC", font=monofont(9, "bold"), text_color=col("text_muted")).pack(padx=6, pady=2)

        # Scrollable list of actions
        self.scroll = ctk.CTkScrollableFrame(self, fg_color="transparent", corner_radius=0)
        self.scroll.pack(fill="both", expand=True, padx=12, pady=(0, 10))

        # Keyboard bindings
        self.bind("<Up>", self._on_up)
        self.bind("<Down>", self._on_down)
        self.bind("<Return>", self._on_enter)
        self.entry.bind("<Return>", self._on_enter)
        self.entry.bind("<Up>", self._on_up)
        self.entry.bind("<Down>", self._on_down)

        self._filter_commands()
        self.after(50, lambda: self.entry.focus_set() if self.winfo_exists() else None)

    def _filter_commands(self):
        q = strip_bidi(self.query_var.get()).strip().lower()
        for child in self.scroll.winfo_children():
            child.destroy()

        self.rendered_items = []
        is_ar = (E.LANG == "ar")
        side = s_start()
        side_rev = s_end()

        # Check if query is an active URL
        if q.startswith("http://") or q.startswith("https://"):
            action_label = f"{t('cmd_quick_add_url')}: {q[:45]}..."
            item_fn = lambda url=q: (self.destroy(), self.app.show_add_dialog(url))
            self.rendered_items.append((action_label, item_fn))

            row = ctk.CTkFrame(self.scroll, corner_radius=10, fg_color=col("row_select"), border_width=1, border_color=col("accent_cyan"), height=44)
            row.pack(fill="x", pady=2)
            row.pack_propagate(False)

            ctk.CTkLabel(row, text=ico("download"), font=ifont(13), text_color=col("accent_cyan")).pack(side=side, padx=12)
            ctk.CTkLabel(row, text=bidi(action_label), font=uifont(11, "bold"), text_color=col("text")).pack(side=side)
            row.bind("<Button-1>", lambda e, fn=item_fn: fn())
            for ch in row.winfo_children():
                ch.bind("<Button-1>", lambda e, fn=item_fn: fn())

        for icon_name, accent, ar_txt, en_txt, shortcut, callback in self.commands_def:
            display_title = ar_txt if is_ar else en_txt
            haystack = f"{ar_txt} {en_txt} {shortcut}".lower()
            if q and q not in haystack:
                continue

            row_idx = len(self.rendered_items)
            self.rendered_items.append((display_title, callback))

            is_sel = (row_idx == self.selected_idx)
            bg_c = col("row_select") if is_sel else col("card_row")
            bd_c = col("accent_cyan") if is_sel else col("border_light")
            bd_w = 1.5 if is_sel else 1

            row = ctk.CTkFrame(self.scroll, corner_radius=10, fg_color=bg_c, border_width=bd_w, border_color=bd_c, height=44)
            row.pack(fill="x", pady=2)
            row.pack_propagate(False)

            # Icon badge
            ic_box = ctk.CTkFrame(row, width=28, height=28, corner_radius=8, fg_color=col("pill_active"))
            ic_box.pack(side=side, padx=10, pady=8)
            ic_box.pack_propagate(False)
            ctk.CTkLabel(ic_box, text=ico(icon_name), font=ifont(12), text_color=col(accent)).place(relx=0.5, rely=0.5, anchor="center")

            # Title
            lbl_title = ctk.CTkLabel(row, text=bidi(display_title), font=uifont(11, "bold" if is_sel else "normal"), text_color=col("text"))
            lbl_title.pack(side=side, padx=6)

            # Shortcut pill (if exists)
            if shortcut:
                sh_box = ctk.CTkFrame(row, corner_radius=6, fg_color=col("bg"), border_width=1, border_color=col("border_light"))
                sh_box.pack(side=side_rev, padx=12, pady=10)
                ctk.CTkLabel(sh_box, text=shortcut, font=monofont(9, "bold"), text_color=col("text_muted")).pack(padx=6, pady=2)

            # Click binding
            def _make_click(cb):
                return lambda e: (self.destroy(), cb())
            row.bind("<Button-1>", _make_click(callback))
            for ch in iter_ctk_tree(row):
                ch.bind("<Button-1>", _make_click(callback))

    def _on_up(self, event=None):
        if self.rendered_items:
            self.selected_idx = (self.selected_idx - 1) % len(self.rendered_items)
            self._filter_commands()
        return "break"

    def _on_down(self, event=None):
        if self.rendered_items:
            self.selected_idx = (self.selected_idx + 1) % len(self.rendered_items)
            self._filter_commands()
        return "break"

    def _on_enter(self, event=None):
        if self.rendered_items and 0 <= self.selected_idx < len(self.rendered_items):
            _, cb = self.rendered_items[self.selected_idx]
            self.destroy()
            if callable(cb):
                self.after(20, cb)
        return "break"



# ==============================================================================
# PHASE 12: WEB REMOTE DASHBOARD & POST-DOWNLOAD AUTOMATION DIALOGS
# ==============================================================================

class WebRemoteDialog(BaseDialog):
    """
    Web Remote Dashboard & LAN Mobile Control Setup Dialog:
    - View and toggle server state
    - Displays mobile-friendly connection URL with LAN IP
    - One-click Copy URL and Open in Browser
    - Configurable PIN / Access Token with instant regeneration
    - LAN access permission toggle and port configuration
    """
    def __init__(self, app):
        super().__init__(app, t("wr_title"), 660, 560)
        self.app = app
        card = self.card()
        self.dialog_header(card, "mobile", t("wr_title"), icon_color="accent_cyan", padx=20, pady=(16, 8))

        # Bottom Action Bar
        btns = ctk.CTkFrame(card, fg_color="transparent")
        btns.pack(fill="x", padx=20, pady=(12, 16), side="bottom")
        IconButton(btns, "xmark", t("u_close"), self.destroy, style="ghost").pack(side=s_end())
        IconButton(btns, "check", t("u_save"), self._save_and_restart, style="primary").pack(side=s_start())

        # Scrollable content frame
        body = ctk.CTkScrollableFrame(card, fg_color="transparent")
        body.pack(fill="both", expand=True, padx=16, pady=4)

        # 1. Server Status Card
        st_box = ctk.CTkFrame(body, corner_radius=12, fg_color=col("card_alt"), border_width=1, border_color=col("border"))
        st_box.pack(fill="x", padx=4, pady=(0, 10))

        top_row = ctk.CTkFrame(st_box, fg_color="transparent")
        top_row.pack(fill="x", padx=14, pady=10)

        srv_running = bool(getattr(app, "web_remote_server", None) and app.web_remote_server.is_running)
        status_txt = t("wr_status_running") if srv_running else t("wr_status_stopped")
        status_col = "emerald" if srv_running else "text_muted"
        dot_char = "●"

        self.lbl_status = ctk.CTkLabel(
            top_row, text=bidi(f"{dot_char}  {status_txt}"),
            font=uifont(12, "bold"), text_color=col(status_col)
        )
        self.lbl_status.pack(side=s_start())

        self.var_enable = ctk.BooleanVar(value=app.settings.get("web_remote_enabled", False))
        make_switch(st_box, t("wr_enable"), self.var_enable, progress_color="primary", padx=14, pady=(0, 10))

        # 2. Connection URL Card
        url_box = ctk.CTkFrame(body, corner_radius=12, fg_color=col("card_alt"), border_width=1, border_color=col("border"))
        url_box.pack(fill="x", padx=4, pady=6)

        ctk.CTkLabel(url_box, text=bidi(t("wr_url_lbl")), font=uifont(11, "bold"), text_color=col("text_muted")).pack(anchor=a_start(), padx=14, pady=(10, 4))

        url_row = ctk.CTkFrame(url_box, fg_color="transparent")
        url_row.pack(fill="x", padx=14, pady=(0, 10))

        lan_ip = E.get_local_lan_ip()
        curr_port = int(app.settings.get("web_remote_port", 45792))
        curr_token = str(app.settings.get("web_remote_token", "")).strip()
        tok_q = f"?token={curr_token}" if curr_token else ""
        self.curr_url = f"http://{lan_ip}:{curr_port}/{tok_q}"

        self.entry_url = ctk.CTkEntry(
            url_row, height=36, corner_radius=8, font=monofont(11),
            fg_color=col("bg"), border_color=col("border_light"), text_color=col("accent_cyan")
        )
        self.entry_url.insert(0, self.curr_url)
        self.entry_url.configure(state="readonly")
        self.entry_url.pack(side="left", fill="x", expand=True, padx=(0, 8))

        IconButton(url_row, "copy", t("wr_copy_url"), self._copy_url, style="soft").pack(side="left", padx=2)
        IconButton(url_row, "globe", t("wr_open_browser"), self._open_browser, style="primary").pack(side="left", padx=2)

        # 3. Security PIN / Access Token Card
        pin_box = ctk.CTkFrame(body, corner_radius=12, fg_color=col("card_alt"), border_width=1, border_color=col("border"))
        pin_box.pack(fill="x", padx=4, pady=6)

        ctk.CTkLabel(pin_box, text=bidi(t("wr_pin_lbl")), font=uifont(11, "bold"), text_color=col("text_muted")).pack(anchor=a_start(), padx=14, pady=(10, 4))

        pin_row = ctk.CTkFrame(pin_box, fg_color="transparent")
        pin_row.pack(fill="x", padx=14, pady=(0, 10))

        if not curr_token:
            curr_token = f"negm_{hex(int(time.time()))[-4:]}"

        self.entry_pin = ctk.CTkEntry(
            pin_row, height=36, corner_radius=8, font=monofont(12, "bold"),
            fg_color=col("bg"), border_color=col("border_light"), text_color=col("text")
        )
        self.entry_pin.insert(0, curr_token)
        self.entry_pin.pack(side="left", fill="x", expand=True, padx=(0, 8))

        IconButton(pin_row, "redo", t("wr_regen_pin"), self._regen_pin, style="soft").pack(side="left")

        # 4. Port & LAN Access Settings
        cfg_box = ctk.CTkFrame(body, corner_radius=12, fg_color=col("card_alt"), border_width=1, border_color=col("border"))
        cfg_box.pack(fill="x", padx=4, pady=6)

        p_row = ctk.CTkFrame(cfg_box, fg_color="transparent")
        p_row.pack(fill="x", padx=14, pady=10)
        ctk.CTkLabel(p_row, text=bidi(t("wr_port_lbl")), font=uifont(11, "bold"), text_color=col("text_muted")).pack(side=s_start())

        self.entry_port = ctk.CTkEntry(
            p_row, width=90, height=32, corner_radius=8, font=monofont(11),
            fg_color=col("bg"), border_color=col("border_light"), text_color=col("text")
        )
        self.entry_port.insert(0, str(curr_port))
        self.entry_port.pack(side=s_end())

        self.var_lan = ctk.BooleanVar(value=app.settings.get("web_remote_allow_lan", True))
        make_switch(cfg_box, t("wr_lan_access"), self.var_lan, progress_color="primary", padx=14, pady=(0, 10))

        # 5. User Guidance Note
        hint_card = ctk.CTkFrame(body, corner_radius=10, fg_color=col("pill_active"), border_width=1, border_color=col("border_light"))
        hint_card.pack(fill="x", padx=4, pady=8)
        ctk.CTkLabel(
            hint_card, text=bidi(f"💡 {t('wr_hint')}"),
            font=uifont(10), text_color=col("text_muted"), wraplength=580, anchor=a_start(), justify=j_start()
        ).pack(padx=12, pady=10)

    def _copy_url(self):
        try:
            self.clipboard_clear()
            self.clipboard_append(self.curr_url)
            self.app.toast(t("wr_title"), t("wr_url_copied"), accent="success", icon="check", duration=3000)
        except Exception:
            pass

    def _open_browser(self):
        import webbrowser
        try:
            webbrowser.open(self.curr_url)
        except Exception:
            pass

    def _regen_pin(self):
        import random
        new_pin = f"{random.randint(1000, 9999)}"
        self.entry_pin.delete(0, "end")
        self.entry_pin.insert(0, new_pin)
        self._update_url_preview()

    def _update_url_preview(self):
        p = self.entry_port.get().strip() or "45792"
        tok = self.entry_pin.get().strip()
        ip = E.get_local_lan_ip() if self.var_lan.get() else "127.0.0.1"
        tok_q = f"?token={tok}" if tok else ""
        self.curr_url = f"http://{ip}:{p}/{tok_q}"
        self.entry_url.configure(state="normal")
        self.entry_url.delete(0, "end")
        self.entry_url.insert(0, self.curr_url)
        self.entry_url.configure(state="readonly")

    def _save_and_restart(self):
        try:
            port_val = int(self.entry_port.get().strip() or 45792)
        except ValueError:
            port_val = 45792
        pin_val = self.entry_pin.get().strip()
        en_val = bool(self.var_enable.get())
        lan_val = bool(self.var_lan.get())

        self.app.settings["web_remote_enabled"] = en_val
        self.app.settings["web_remote_port"] = port_val
        self.app.settings["web_remote_token"] = pin_val
        self.app.settings["web_remote_allow_lan"] = lan_val
        self.app.save_state()

        if hasattr(self.app, "restart_web_remote"):
            self.app.restart_web_remote()

        self.destroy()


class PostDownloadDialog(BaseDialog):
    """
    Post-Download Automation Configuration Dialog:
    - Power actions when all downloads complete (None, Shutdown, Sleep, Hibernate, Lock, Exit)
    - Auto-archive extraction toggle
    - Custom command on download completion
    - Notification Webhook integration (Discord, Slack, etc.)
    """
    def __init__(self, app):
        super().__init__(app, t("post_title"), 620, 540)
        self.app = app
        card = self.card()
        self.dialog_header(card, "power", t("post_title"), icon_color="danger", padx=20, pady=(16, 8))

        btns = ctk.CTkFrame(card, fg_color="transparent")
        btns.pack(fill="x", padx=20, pady=(12, 16), side="bottom")
        IconButton(btns, "xmark", t("u_cancel"), self.destroy, style="ghost").pack(side=s_end())
        IconButton(btns, "check", t("u_save"), self._save, style="primary").pack(side=s_start())

        body = ctk.CTkScrollableFrame(card, fg_color="transparent")
        body.pack(fill="both", expand=True, padx=16, pady=4)

        # 1. Action When All Finished Card
        act_box = ctk.CTkFrame(body, corner_radius=12, fg_color=col("card_alt"), border_width=1, border_color=col("border"))
        act_box.pack(fill="x", padx=4, pady=(0, 10))

        ctk.CTkLabel(act_box, text=bidi(t("post_action_lbl")), font=uifont(11, "bold"), text_color=col("text_muted")).pack(anchor=a_start(), padx=14, pady=(10, 6))

        action_keys = [
            ("none", t("post_act_none")),
            ("shutdown", t("post_act_shutdown")),
            ("sleep", t("post_act_sleep")),
            ("hibernate", t("post_act_hibernate")),
            ("lock", t("post_act_lock")),
            ("exit_app", t("post_act_exit")),
        ]
        self.action_keys_map = {label: k for k, label in action_keys}
        self.keys_action_map = {k: label for k, label in action_keys}

        curr_act = app.settings.get("post_finish_action", "none")
        if curr_act not in self.keys_action_map:
            curr_act = "none"

        self.combo_action = ctk.CTkComboBox(
            act_box, height=36, corner_radius=8, font=uifont(11),
            values=[label for _, label in action_keys],
            fg_color=col("bg"), border_color=col("border_light"), text_color=col("text")
        )
        self.combo_action.set(self.keys_action_map[curr_act])
        self.combo_action.pack(fill="x", padx=14, pady=(0, 12))

        # 2. Auto-Extract Archive Card
        ext_box = ctk.CTkFrame(body, corner_radius=12, fg_color=col("card_alt"), border_width=1, border_color=col("border"))
        ext_box.pack(fill="x", padx=4, pady=6)
        self.var_extract = ctk.BooleanVar(value=app.settings.get("auto_extract", False))
        make_switch(ext_box, t("post_extract_lbl"), self.var_extract, progress_color="primary", padx=14, pady=12)

        # 3. Custom Command Card
        cmd_box = ctk.CTkFrame(body, corner_radius=12, fg_color=col("card_alt"), border_width=1, border_color=col("border"))
        cmd_box.pack(fill="x", padx=4, pady=6)

        ctk.CTkLabel(cmd_box, text=bidi(t("post_custom_cmd")), font=uifont(11, "bold"), text_color=col("text_muted")).pack(anchor=a_start(), padx=14, pady=(10, 4))
        self.entry_cmd = ctk.CTkEntry(
            cmd_box, height=36, corner_radius=8, font=monofont(11), placeholder_text=t("post_custom_cmd_ph"),
            fg_color=col("bg"), border_color=col("border_light"), text_color=col("text")
        )
        if app.settings.get("post_command"):
            self.entry_cmd.insert(0, app.settings.get("post_command"))
        self.entry_cmd.pack(fill="x", padx=14, pady=(0, 12))

        # 4. Webhook Card
        wh_box = ctk.CTkFrame(body, corner_radius=12, fg_color=col("card_alt"), border_width=1, border_color=col("border"))
        wh_box.pack(fill="x", padx=4, pady=6)

        ctk.CTkLabel(wh_box, text=bidi(t("post_webhook_lbl")), font=uifont(11, "bold"), text_color=col("text_muted")).pack(anchor=a_start(), padx=14, pady=(10, 4))
        self.entry_wh = ctk.CTkEntry(
            wh_box, height=36, corner_radius=8, font=monofont(11), placeholder_text=t("post_webhook_ph"),
            fg_color=col("bg"), border_color=col("border_light"), text_color=col("text")
        )
        if app.settings.get("post_webhook"):
            self.entry_wh.insert(0, app.settings.get("post_webhook"))
        self.entry_wh.pack(fill="x", padx=14, pady=(0, 12))

    def _save(self):
        sel_label = self.combo_action.get()
        act_key = self.action_keys_map.get(sel_label, "none")
        self.app.settings["post_finish_action"] = act_key
        self.app.settings["shutdown_when_done"] = (act_key == "shutdown")
        self.app.settings["auto_extract"] = bool(self.var_extract.get())
        self.app.settings["post_command"] = self.entry_cmd.get().strip()
        self.app.settings["post_webhook"] = self.entry_wh.get().strip()
        self.app.save_state()
        self.destroy()

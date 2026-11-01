# -*- coding: utf-8 -*-
"""
ui_table.py - Zero-Lag Virtualized Download Table (RTL/LTR + Responsive)
Part of NegmLoading Modular Architecture
"""
from __future__ import annotations

import os
import sys
import time
import math
import ctypes
import threading
import subprocess
from typing import Optional, Callable, Any, Dict, List, Tuple

import tkinter as tk
import customtkinter as ctk
from PIL import Image, ImageTk

import nexus_engine as E
from nexus_engine import *
from ui_theme import *
from ui_components import *

# ----------------------------------------------------------------------
# 2. Zero-Lag Virtualized Download Table (RTL/LTR + Responsive + Keyboard Ring)
# ----------------------------------------------------------------------
COLS = ((1, 260), (0, 98), (0, 205), (0, 132), (0, 106), (0, 86))


def state_view(task):
    st = task.state
    if st == "completed":
        return "check", t("st_completed"), "pill_ok", "success"
    if st == "failed":
        return "circle-xmark", t("st_failed"), "pill_bad", "danger"
    if st == "paused":
        return "circle-pause", t("st_paused"), "pill_warn", "warning"
    if st == "queued":
        return "hourglass", t("st_queued"), "pill_idle", "text_muted"
    if task.status == "st_assembling":
        return "layers", t("st_assembling_short"), "pill_active", "accent_cyan"
    if task.status == "st_probing":
        return "bolt", t("st_probing"), "pill_active", "accent_cyan"
    return "download", t("st_downloading"), "pill_active", "accent_cyan"


def _canvas_round_rect(canvas: tk.Canvas, x1: float, y1: float, x2: float, y2: float, r: float = 10, **kw):
    """Draws a crisp smooth rounded rectangle on a single tk.Canvas item using doubled-endpoint spline vertices."""
    r = max(0.0, min(r, (x2 - x1) / 2.0, (y2 - y1) / 2.0))
    if r <= 1.0:
        return canvas.create_rectangle(x1, y1, x2, y2, **kw)
    if r <= 4.0:
        # Fast 8-point beveled polygon for small badges/progress bars (avoids heavy Bezier spline evaluation)
        pts = [
            x1 + r, y1,
            x2 - r, y1,
            x2, y1 + r,
            x2, y2 - r,
            x2 - r, y2,
            x1 + r, y2,
            x1, y2 - r,
            x1, y1 + r,
        ]
        return canvas.create_polygon(pts, **kw)
    pts = [
        x1 + r, y1, x1 + r, y1,
        x2 - r, y1, x2 - r, y1,
        x2, y1, x2, y1 + r, x2, y1 + r,
        x2, y2 - r, x2, y2 - r,
        x2, y2, x2 - r, y2, x2 - r, y2,
        x1 + r, y2, x1 + r, y2,
        x1, y2, x1, y2 - r, x1, y2 - r,
        x1, y1 + r, x1, y1 + r,
        x1, y1,
    ]
    return canvas.create_polygon(pts, smooth=True, **kw)


class TaskRowHandle:
    """
    Zero-widget row model replacing per-row CTkFrames.
    Eliminates 15+ CustomTkinter widgets per download while preserving 100% API compatibility.
    """
    __slots__ = ("task", "app", "is_selected", "visible", "_cache")

    def __init__(self, master, task: DownloadTask, app):
        self.task = task
        self.app = app
        self.is_selected = False
        self.visible = False
        self._cache = {}

    def set_selected(self, selected: bool):
        sel = bool(selected)
        if self.is_selected != sel:
            self.is_selected = sel
            if hasattr(self.app, "table") and self.app.table is not None:
                self.app.table.mark_dirty()

    def refresh(self, force: bool = False):
        if force and hasattr(self.app, "table") and self.app.table is not None:
            self.app.table.mark_dirty()

    def destroy(self):
        self.visible = False


DownloadRow = TaskRowHandle


class VirtualDownloadTable(ctk.CTkFrame):
    """
    Hardware-fast single-Canvas virtualized download list:
    - Paints ONLY visible rows in the viewport (0 child widgets per row)
    - True RTL (Arabic) & LTR (English) column coordinate mirroring
    - Responsive 6-column full view + 4-column compact split-screen view
    - Distinct Empty State vs Filtered/Search Empty State with 1-click Reset CTA
    - WCAG 2.2 AA keyboard focus indicator on canvas
    """
    PAD_X = 14
    PAD_TOP = 12
    ROW_H = 68
    ROW_GAP = 8
    STRIDE = ROW_H + ROW_GAP
    HDR_H = 42

    CAT_BADGE_BG = {
        "type_compressed": ("#fef3c7", "#352811"),
        "type_programs": ("#e0e7ff", "#1e264a"),
        "type_videos": ("#fee2e2", "#3a1921"),
        "type_music": ("#d1fae5", "#113328"),
        "type_docs": ("#cffafe", "#10313d"),
        "type_other": ("#e8edf6", "#222942"),
    }

    def __init__(self, master, app):
        super().__init__(master, corner_radius=14, fg_color=col("card"), border_width=1, border_color=col("border_light"))
        self.app = app
        self.rows: list[TaskRowHandle] = []
        self.hover_idx: int = -1
        self._dirty: bool = True
        self._last_sig = None
        self._last_vw: int = 0
        self._last_vh: int = 0
        self._resize_job = None
        self._empty_cta_bbox = None
        self._empty_cta_mode = None
        self._tip_win = None
        self._tip_job = None
        self._tip_idx = -1

        self.hdr_wrap = ctk.CTkFrame(self, height=self.HDR_H, corner_radius=0, fg_color="transparent")
        self.hdr_wrap.pack(fill="x", padx=2, pady=(2, 0))
        self.hdr_wrap.pack_propagate(False)

        self.hdr_canvas = tk.Canvas(
            self.hdr_wrap, height=self.HDR_H, bg=cur("header"),
            highlightthickness=0, bd=0,
        )
        self.hdr_canvas.pack(fill="both", expand=True)
        ctk.CTkFrame(self, height=1, fg_color=col("border_light")).pack(fill="x", padx=1)

        self.body_wrap = ctk.CTkFrame(self, fg_color="transparent", corner_radius=0)
        self.body_wrap.pack(fill="both", expand=True, padx=2, pady=(0, 2))

        self.canvas = tk.Canvas(
            self.body_wrap, bg=cur("bg_list"), highlightthickness=0, bd=0,
            yscrollincrement=1, takefocus=1,
        )
        self.vbar = ctk.CTkScrollbar(
            self.body_wrap, orientation="vertical", command=self._on_scrollbar,
            width=14, fg_color="transparent",
            button_color=col("border"), button_hover_color=col("primary"),
        )
        self.canvas.configure(yscrollcommand=self._on_yscroll)
        self.canvas.pack(side=s_start(), fill="both", expand=True)
        self._vbar_shown = False

        self.hdr_canvas.bind("<Configure>", lambda e: self._draw_header() if self._last_vw == 0 else None)
        self.canvas.bind("<Configure>", self._on_configure)
        self.canvas.bind("<Motion>", self._on_motion)
        self.canvas.bind("<Leave>", self._on_leave)
        self.canvas.bind("<Button-1>", self._on_click)
        self.canvas.bind("<Double-Button-1>", self._on_double)
        self.canvas.bind("<Button-3>", self._on_right_click)
        self.canvas.bind("<MouseWheel>", self._on_mousewheel)
        self.canvas.bind("<FocusIn>", self._on_canvas_focus_in)
        self.canvas.bind("<FocusOut>", self._on_canvas_focus_out)

    def _on_canvas_focus_in(self, event=None):
        self.configure(border_width=2, border_color=col("focus_ring"))
        if not self.rows and self._empty_cta_bbox:
            self._dirty = True
            self.refresh_viewport(force=True)

    def _on_canvas_focus_out(self, event=None):
        self.configure(border_width=1, border_color=col("border_light"))
        if not self.rows and self._empty_cta_bbox:
            self._dirty = True
            self.refresh_viewport(force=True)

    def mark_dirty(self):
        self._dirty = True

    def set_rows(self, rows: list[TaskRowHandle]):
        self.rows = list(rows)
        if self.hover_idx >= len(self.rows):
            self.hover_idx = -1
        self._dirty = True
        self._sync_scrollregion()
        self.refresh_viewport(force=True)

    def _total_content_height(self) -> int:
        if not self.rows:
            return max(260, self.canvas.winfo_height())
        return self.PAD_TOP * 2 + len(self.rows) * self.STRIDE - self.ROW_GAP

    def _sync_scrollregion(self):
        vw = max(100, self.canvas.winfo_width())
        vh = max(100, self.canvas.winfo_height())
        th = self._total_content_height()
        need_bar = bool(self.rows) and (th > vh + 2)
        if need_bar and not self._vbar_shown:
            self.canvas.pack_forget()
            self.vbar.pack(side=s_end(), fill="y", padx=px_inline(0, 2), pady=4)
            self.canvas.pack(side=s_start(), fill="both", expand=True)
            self._vbar_shown = True
            self.after_idle(self._draw_header)
        elif not need_bar and self._vbar_shown:
            self.vbar.pack_forget()
            self._vbar_shown = False
            self.canvas.yview_moveto(0.0)
            self.after_idle(self._draw_header)
        self.canvas.configure(scrollregion=(0, 0, vw, max(vh, th)))

    def _on_scrollbar(self, *args):
        self.canvas.yview(*args)
        self._dirty = True
        self.refresh_viewport(force=True)

    def _on_yscroll(self, first, last):
        self.vbar.set(first, last)

    def _on_configure(self, event=None):
        if self._resize_job is not None:
            try:
                self.after_cancel(self._resize_job)
            except Exception:
                pass
            self._resize_job = None
        if self._last_vw == 0:
            self._handle_debounced_resize()
            return
        self._resize_job = self.after(35, self._handle_debounced_resize)

    def _handle_debounced_resize(self):
        self._resize_job = None
        if not self.winfo_exists():
            return
        vw = max(100, self.canvas.winfo_width())
        vh = max(100, self.canvas.winfo_height())
        if vw == self._last_vw and vh == self._last_vh and not self._dirty:
            return
        self._last_vw = vw
        self._last_vh = vh
        self._dirty = True
        self._sync_scrollregion()
        self._draw_header()
        self.refresh_viewport(force=True)

    def _on_mousewheel(self, event):
        if not self.rows:
            return
        vh = max(1, self.canvas.winfo_height())
        th = self._total_content_height()
        if th <= vh:
            return
        step = -int(event.delta / 120) * 56
        top_px = self.canvas.canvasy(0)
        new_top = max(0.0, min(float(th - vh), top_px + step))
        self.canvas.yview_moveto(new_top / float(th))
        self._dirty = True
        
        # Debounce/throttle heavy redraw during rapid wheel rotation for 60 FPS fluidity
        if getattr(self, "_scroll_job", None) is not None:
            try:
                self.after_cancel(self._scroll_job)
            except Exception:
                pass
        self._scroll_job = self.after(16, self._handle_scroll_refresh)

    def _handle_scroll_refresh(self):
        self._scroll_job = None
        if not self.winfo_exists():
            return
        self.refresh_viewport(force=False)

    def _col_layout(self, total_w: int):
        """
        Computes exact (x_left, col_width) pairs shared identically by Header and Row cards,
        supporting both RTL (right-to-left) and LTR (left-to-right) plus compact (< 640px) mode.
        Fast-cached to eliminate allocation overhead during real-time rendering.
        """
        rtl = is_rtl()
        try:
            sc = max(1.0, float(self.app._get_window_scaling()))
        except Exception:
            sc = 1.0
        cache_key = (total_w, rtl, sc)
        if getattr(self, "_col_cache_key", None) == cache_key:
            return self._col_cache_val

        card_x0 = self.PAD_X
        card_x1 = max(card_x0 + 360, total_w - self.PAD_X)
        inner_x0 = card_x0 + 16
        inner_x1 = card_x1 - 16
        avail = max(328, inner_x1 - inner_x0)

        if avail < int(690 * sc):
            gap = int(12 * sc)
            w_stat = int(112 * sc)
            w_spd = int(86 * sc)
            w_prog = max(int(108 * sc), min(int(156 * sc), int(avail * 0.25)))
            w_name = max(int(136 * sc), avail - (w_prog + w_stat + w_spd + gap * 3))
            if w_name + w_prog + w_stat + w_spd + gap * 3 > avail:
                scale = avail / float(w_name + w_prog + w_stat + w_spd + gap * 3)
                w_name = max(int(110 * sc), int(w_name * scale))
                w_prog = max(int(90 * sc), int(w_prog * scale))
                w_stat = max(int(86 * sc), int(w_stat * scale))
                w_spd = max(int(70 * sc), int(w_spd * scale))
            spec = [("name", w_name), ("prog", w_prog), ("stat", w_stat), ("spd", w_spd)]
            compact = True
        else:
            gap = int(14 * sc)
            w_size = int(94 * sc)
            w_prog = int(196 * sc)
            w_stat = int(126 * sc)
            w_spd = int(98 * sc)
            w_eta = int(76 * sc)
            fixed = w_size + w_prog + w_stat + w_spd + w_eta + gap * 5
            w_name = max(int(190 * sc), avail - fixed)
            if fixed + w_name > avail:
                scale = avail / float(fixed + w_name)
                w_name = max(int(160 * sc), int(w_name * scale))
                w_prog = max(int(140 * sc), int(w_prog * scale))
                w_size = max(int(78 * sc), int(w_size * scale))
            spec = [
                ("name", w_name), ("size", w_size), ("prog", w_prog),
                ("stat", w_stat), ("spd", w_spd), ("eta", w_eta),
            ]
            compact = False

        cols_map = {"name": None, "size": None, "prog": None, "stat": None, "spd": None, "eta": None}
        if rtl:
            cx_r = inner_x1
            for key, w in spec:
                cols_map[key] = (cx_r - w, w)
                cx_r -= (w + gap)
        else:
            cx_l = inner_x0
            for key, w in spec:
                cols_map[key] = (cx_l, w)
                cx_l += (w + gap)
        self._col_cache_key = cache_key
        self._col_cache_val = (card_x0, card_x1, compact, cols_map)
        return self._col_cache_val

    def _draw_header(self):
        hc = self.hdr_canvas
        cur_hbg = cur("header")
        if getattr(self, "_curr_hdr_bg", None) != cur_hbg:
            self._curr_hdr_bg = cur_hbg
            hc.configure(bg=cur_hbg)
        hc.delete("all")
        rtl = is_rtl()
        bar_pad = 16 if self._vbar_shown else 0
        total_w = max(300, hc.winfo_width() - bar_pad)
        shift_x = bar_pad if (rtl and self._vbar_shown) else 0
        _, _, _, cols_map = self._col_layout(total_w)
        key_labels = (
            ("name", "col_name"),
            ("size", "col_size"),
            ("prog", "col_progress"),
            ("stat", "col_status"),
            ("spd", "col_speed"),
            ("eta", "col_eta"),
        )
        fg = cur("text_muted")
        fnt = (UI_FONT, 9, "bold")
        cy = self.HDR_H // 2
        anc = "e" if rtl else "w"
        for col_id, i18n_key in key_labels:
            slot = cols_map.get(col_id)
            if not slot:
                continue
            cx, cw = slot
            cx += shift_x
            if col_id == "name":
                tx = (cx + cw - 54) if rtl else (cx + 54)
            else:
                tx = (cx + cw) if rtl else cx
            hc.create_text(tx, cy, text=bidi(t(i18n_key)), anchor=anc, fill=fg, font=fnt)

    def _row_index_at_y(self, event_y: int) -> int:
        if not self.rows:
            return -1
        cy = self.canvas.canvasy(event_y)
        rel = cy - self.PAD_TOP
        if rel < 0:
            return -1
        idx = int(rel // self.STRIDE)
        in_row = rel - (idx * self.STRIDE)
        if 0 <= idx < len(self.rows) and in_row <= self.ROW_H:
            return idx
        return -1

    def _on_motion(self, event):
        if not self.rows:
            new_cur = "arrow"
            hover_act = -1
            if getattr(self, "_empty_actions", None):
                for a_i, (b_box, _) in enumerate(self._empty_actions):
                    if b_box[0] <= event.x <= b_box[2] and b_box[1] <= event.y <= b_box[3]:
                        new_cur = "hand2"
                        hover_act = a_i
                        break
            elif getattr(self, "_empty_cta_bbox", None):
                bx0, by0, bx1, by1 = self._empty_cta_bbox
                if bx0 <= event.x <= bx1 and by0 <= event.y <= by1:
                    new_cur = "hand2"

            if getattr(self, "_curr_cursor", None) != new_cur:
                self._curr_cursor = new_cur
                self.canvas.configure(cursor=new_cur)

            if getattr(self, "_empty_hover_idx", -1) != hover_act:
                self._empty_hover_idx = hover_act
                self._dirty = True
                self.refresh_viewport(force=True)
            return

        idx = self._row_index_at_y(event.y)
        new_cur = "hand2" if idx >= 0 else "arrow"
        if getattr(self, "_curr_cursor", None) != new_cur:
            self._curr_cursor = new_cur
            self.canvas.configure(cursor=new_cur)
        if idx != self.hover_idx:
            self.hover_idx = idx
            self._dirty = True
            self.refresh_viewport(force=True)
            self._schedule_tip(idx)

    def _on_leave(self, event=None):
        self._hide_tip()
        if self.hover_idx != -1:
            self.hover_idx = -1
            self._dirty = True
            self.refresh_viewport(force=True)

    def _schedule_tip(self, idx: int):
        self._hide_tip()
        if idx < 0 or idx >= len(self.rows):
            return
        self._tip_idx = idx
        self._tip_job = self.after(650, self._show_tip)

    def _hide_tip(self):
        if self._tip_job is not None:
            try:
                self.after_cancel(self._tip_job)
            except Exception:
                pass
            self._tip_job = None
        if self._tip_win is not None:
            try:
                self._tip_win.destroy()
            except Exception:
                pass
            self._tip_win = None

    def _show_tip(self):
        self._tip_job = None
        Tooltip.hide_any_active()
        idx = self._tip_idx
        if idx < 0 or idx >= len(self.rows) or idx != self.hover_idx or not pointer_inside(self.canvas):
            return
        task = self.rows[idx].task
        lines = [task.filename, task.url]
        if task.save_path:
            lines.append(task.save_path)
        if task.is_failed and task.status_detail:
            lines.append(f"⚠ {strip_bidi(task.status_detail)}")
        try:
            self._hide_tip()
            tw = tk.Toplevel(self.canvas)
            tw.overrideredirect(True)
            tw.attributes("-topmost", True)
            tw.bind("<Enter>", lambda e: self._hide_tip())
            tw.bind("<ButtonPress>", lambda e: self._hide_tip())
            lbl = tk.Label(
                tw, text=bidi("\n".join(lines)), justify=j_start(), padx=10, pady=6,
                bd=1, relief="solid", bg=cur("card_alt"), fg=cur("text"), font=(UI_FONT, 9),
            )
            lbl.pack()
            tw.update_idletasks()
            sw, sh = self.canvas.winfo_screenwidth(), self.canvas.winfo_screenheight()
            req_w, req_h = tw.winfo_reqwidth(), tw.winfo_reqheight()
            px = max(8, min(sw - req_w - 10, self.canvas.winfo_pointerx() + 14))
            py = max(8, min(sh - req_h - 48, self.canvas.winfo_pointery() + 18))
            tw.geometry(f"+{px}+{py}")
            self._tip_win = tw
            self.after(3500, self._hide_tip)
        except Exception:
            self._tip_win = None

    def _on_click(self, event):
        self._hide_tip()
        self.canvas.focus_set()
        if not self.rows:
            if getattr(self, "_empty_actions", None):
                for (x0, y0, x1, y1), action_fn in self._empty_actions:
                    if x0 <= event.x <= x1 and y0 <= event.y <= y1:
                        if callable(action_fn):
                            action_fn()
                        return
            elif getattr(self, "_empty_cta_bbox", None):
                x0, y0, x1, y1 = self._empty_cta_bbox
                if x0 <= event.x <= x1 and y0 <= event.y <= y1:
                    if self._empty_cta_mode == "reset" and hasattr(self.app, "reset_filters_and_search"):
                        self.app.reset_filters_and_search()
                    else:
                        self.app.show_add_dialog()
                    return
            self.app.clear_selection()
            return

        idx = self._row_index_at_y(event.y)
        if idx < 0:
            self.app.clear_selection()
            return
        ctrl = bool(event.state & 0x4)
        shift = bool(event.state & 0x1)
        self.app.select_row(self.rows[idx], ctrl=ctrl, shift=shift)

    def _on_double(self, event):
        idx = self._row_index_at_y(event.y)
        if idx >= 0:
            self.app.select_row(self.rows[idx])
            self.app.act_open_or_details()

    def _on_right_click(self, event):
        idx = self._row_index_at_y(event.y)
        if idx >= 0:
            row = self.rows[idx]
            if not row.is_selected:
                self.app.select_row(row)
            self.app.show_context_menu(event)

    def ensure_row_visible(self, row: TaskRowHandle):
        if row not in self.rows:
            return
        idx = self.rows.index(row)
        vh = max(1, self.canvas.winfo_height())
        th = max(1, self._total_content_height())
        if th <= vh:
            return
        y0 = self.PAD_TOP + idx * self.STRIDE
        y1 = y0 + self.ROW_H
        top = self.canvas.canvasy(0)
        if y0 < top + 6:
            self.canvas.yview_moveto(max(0.0, (y0 - self.PAD_TOP) / float(th)))
        elif y1 > top + vh - 6:
            self.canvas.yview_moveto(max(0.0, (y1 - vh + self.PAD_TOP) / float(th)))
        self._dirty = True
        self.refresh_viewport(force=True)

    def _badge_bg(self, cat: str) -> str:
        pair = self.CAT_BADGE_BG.get(cat, self.CAT_BADGE_BG["type_other"])
        return pair[1] if ctk.get_appearance_mode() == "Dark" else pair[0]

    def refresh_viewport(self, force: bool = False):
        """Paints only visible rows on the canvas; skips redraw completely if visible state is unchanged."""
        c = self.canvas
        vw = max(300, c.winfo_width())
        vh = max(160, c.winfo_height())
        top_y = c.canvasy(0)
        bot_y = top_y + vh
        is_dark = (ctk.get_appearance_mode() == "Dark")
        rtl = is_rtl()

        if not self.rows:
            filtered_empty = bool(getattr(self.app, "tasks", None))
            sig = ("empty", filtered_empty, vw, vh, E.LANG, is_dark)
            if not force and not self._dirty and sig == self._last_sig:
                return
            self._last_sig = sig
            self._dirty = False
            c.configure(bg=cur("bg_list"))
            c.delete("all")
            cx, cy = vw // 2, vh // 2
            ic_fnt = (ICON_FAMILY, 40) if ICON_FAMILY else ("Segoe UI Emoji", 34)

            if filtered_empty:
                c.create_text(cx, cy - 64, text=ico("search"), fill=cur("border"), font=ic_fnt)
                c.create_text(cx, cy - 12, text=bidi(t("empty_filter_title")), fill=cur("text"), font=(UI_FONT, 13, "bold"))
                c.create_text(cx, cy + 15, text=bidi(t("empty_filter_sub")), fill=cur("text_muted"), font=(UI_FONT, 9))
                bw, bh = 232, 38
                bx0, by0, bx1, by1 = cx - bw // 2, cy + 38, cx + bw // 2, cy + 38 + bh
                _canvas_round_rect(c, bx0, by0, bx1, by1, r=10, fill=cur("primary"), outline="")
                cta_lbl = bidi(t("empty_filter_cta"))
                c.create_text(cx, (by0 + by1) // 2, text=cta_lbl, fill="#ffffff", font=(UI_FONT, 10, "bold"))
                self._empty_cta_bbox = (bx0, by0, bx1, by1)
                self._empty_cta_mode = "reset"
            else:
                self._empty_actions = []
                self._empty_cta_bbox = None
                self._empty_cta_mode = None

                c.create_text(cx, cy - 88, text=ico("cloud-down"), fill=cur("border"), font=ic_fnt)
                c.create_text(cx, cy - 42, text=bidi(t("empty_title")), fill=cur("text"), font=(UI_FONT, 14, "bold"))
                c.create_text(cx, cy - 18, text=bidi(t("empty_sub")), fill=cur("text_muted"), font=(UI_FONT, 9))

                cards_def = [
                    ("plus", "primary", t("card_add_title"), t("card_add_sub"), self.app.show_add_dialog),
                    ("film", "danger", t("card_vid_title"), t("card_vid_sub"), self.app.show_media_dialog),
                    ("list", "accent_cyan", t("card_batch_title"), t("card_batch_sub"), self.app.show_batch_dialog),
                ]

                if vw >= 540:
                    card_w = min(176, (vw - 80) // 3)
                    card_h = 88
                    total_w = card_w * 3 + 24
                    start_x = cx - total_w // 2
                    cards_y0 = cy + 12
                    cards_y1 = cards_y0 + card_h
                    hover_a = getattr(self, "_empty_hover_idx", -1)

                    ordered_cards = list(enumerate(cards_def))
                    if rtl:
                        ordered_cards.reverse()

                    for slot_idx, (card_idx, (icon_name, accent_color, title_txt, sub_txt, action_cb)) in enumerate(ordered_cards):
                        c_x0 = start_x + slot_idx * (card_w + 12)
                        c_x1 = c_x0 + card_w
                        is_h = (hover_a == card_idx)
                        bg_c = cur("row_hover") if is_h else cur("card_row")
                        bd_c = cur(accent_color) if is_h else cur("border_light")
                        bd_w = 2 if is_h else 1

                        _canvas_round_rect(c, c_x0, cards_y0, c_x1, cards_y1, r=12, fill=bg_c, outline=bd_c, width=bd_w)

                        ic_box_x = c_x0 + 16 if not rtl else c_x1 - 44
                        ic_box_y = cards_y0 + 14
                        _canvas_round_rect(c, ic_box_x, ic_box_y, ic_box_x + 28, ic_box_y + 28, r=8, fill=cur("pill_active"), outline="")
                        c.create_text(ic_box_x + 14, ic_box_y + 14, text=ico(icon_name), fill=cur(accent_color), font=ifont(12))

                        t_x = c_x0 + 52 if not rtl else c_x1 - 52
                        t_anc = "w" if not rtl else "e"
                        c.create_text(t_x, cards_y0 + 28, text=bidi(title_txt), anchor=t_anc, fill=cur("text"), font=uifont(10, "bold"))
                        c.create_text(t_x, cards_y0 + 54, text=bidi(sub_txt), anchor=t_anc, fill=cur("text_muted"), font=uifont(8))

                        self._empty_actions.append(((c_x0, cards_y0, c_x1, cards_y1), action_cb))

                    hint_y = cards_y1 + 24
                else:
                    bw, bh = 176, 38
                    bx0, by0, bx1, by1 = cx - bw // 2, cy + 24, cx + bw // 2, cy + 24 + bh
                    _canvas_round_rect(c, bx0, by0, bx1, by1, r=10, fill=cur("primary"), outline="")
                    cta_lbl = bidi(f"+  {t('u_add')}")
                    c.create_text(cx, (by0 + by1) // 2, text=cta_lbl, fill="#ffffff", font=(UI_FONT, 10, "bold"))
                    self._empty_cta_bbox = (bx0, by0, bx1, by1)
                    self._empty_cta_mode = "add"
                    hint_y = by1 + 18

                c.create_text(cx, hint_y, text=bidi(t("empty_tip_paste")), fill=cur("text_muted"), font=uifont(9))
            return

        self._empty_cta_bbox = None
        self._empty_cta_mode = None
        first_i = max(0, int((top_y - self.PAD_TOP) // self.STRIDE) - 1)
        last_i = min(len(self.rows) - 1, int((bot_y - self.PAD_TOP) // self.STRIDE) + 1)

        vis_snap = []
        vis_progs = {}
        for idx in range(first_i, last_i + 1):
            r = self.rows[idx]
            tk_obj = r.task
            pr = tk_obj.get_progress()
            vis_progs[idx] = pr
            vis_snap.append((
                id(tk_obj),
                tk_obj.filename,
                tk_obj.state,
                tk_obj.status,
                tk_obj.status_detail,
                r.is_selected,
                int(pr["percent"] * 200),
                int(pr["downloaded"] // 16384),
                int(pr["speed_bps"] // 1024),
                pr["active_chunks"],
                pr["total_chunks"],
            ))

        sig = (vw, vh, int(top_y), len(self.rows), self.hover_idx, E.LANG, is_dark, tuple(vis_snap))
        if not force and not self._dirty and sig == self._last_sig:
            return
        self._last_sig = sig
        self._dirty = False

        cur_bg = cur("bg_list")
        if getattr(self, "_curr_canvas_bg", None) != cur_bg:
            self._curr_canvas_bg = cur_bg
            c.configure(bg=cur_bg)
        c.delete("all")

        card_x0, card_x1, compact, cols_map = self._col_layout(vw)
        x_name, w_name = cols_map["name"]
        x_prog, w_prog = cols_map["prog"]
        x_stat, w_stat = cols_map["stat"]
        x_spd, w_spd = cols_map["spd"]
        slot_size = cols_map["size"]
        slot_eta = cols_map["eta"]

        fa_15 = (ICON_FAMILY, 15) if ICON_FAMILY else ("Segoe UI Emoji", 13)
        fa_10 = (ICON_FAMILY, 10) if ICON_FAMILY else ("Segoe UI Emoji", 9)
        f_title = (UI_FONT, 10, "bold")
        f_sub = (UI_FONT, 8)
        f_cell = (UI_FONT, 9)
        f_bold = (UI_FONT, 9, "bold")

        c_text = cur("text")
        c_muted = cur("text_muted")
        c_cyan = cur("accent_cyan")
        c_track = cur("track")
        anc = "e" if rtl else "w"

        try:
            sc_row = max(1.0, float(self.app._get_window_scaling()))
        except Exception:
            sc_row = 1.0

        for idx in range(first_i, last_i + 1):
            row = self.rows[idx]
            task = row.task
            prog = vis_progs[idx]
            st = task.state

            y0 = self.PAD_TOP + idx * self.STRIDE
            y1 = y0 + self.ROW_H
            cy = (y0 + y1) // 2

            if row.is_selected:
                bg_card = cur("row_select")
                bd_card = cur("primary")
                bd_w = 2
            elif idx == self.hover_idx:
                bg_card = cur("row_hover")
                bd_card = cur("border")
                bd_w = 1
            elif st == "active":
                bg_card = cur("card_row")
                bd_card = cur("accent_cyan")
                bd_w = 2
            else:
                bg_card = cur("card_row")
                bd_card = cur("border_light")
                bd_w = 1

            _canvas_round_rect(c, card_x0, y0, card_x1, y1, r=12, fill=bg_card, outline=bd_card, width=bd_w)

            # 1. Category Squircle + Filename + Host / Multi-Part Status Subtitle
            rc = row._cache
            cat = rc.get("cat")
            if cat is None:
                cat = detect_category(task.filename)
                rc["cat"] = cat
                rc["host"] = urllib.parse.urlparse(task.url).netloc or task.url
                rc["cat_icon"] = ico(CAT_ICON.get(cat, "file"))
            host = rc["host"]

            bx0 = (x_name + w_name - 42) if rtl else x_name
            by0 = y0 + 13
            _canvas_round_rect(c, bx0, by0, bx0 + 42, by0 + 42, r=11, fill=self._badge_bg(cat), outline="")
            c.create_text(bx0 + 21, by0 + 21, text=rc["cat_icon"],
                          fill=cur(CAT_COLOR.get(cat, "text_muted")), font=fa_15)
            if st == "active":
                dot_x = bx0 + 35 if rtl else bx0 + 7
                dot_y = by0 + 7
                c.create_oval(dot_x - 3.5, dot_y - 3.5, dot_x + 3.5, dot_y + 3.5, fill=cur("success"), outline="#ffffff", width=1)

            tx = (x_name + w_name - int(52 * sc_row)) if rtl else (x_name + int(52 * sc_row))
            avail_txt_px = max(60, w_name - int(58 * sc_row))
            max_chars = max(12, int(avail_txt_px / (7.6 * sc_row)))
            max_sub = max(14, int(avail_txt_px / (6.6 * sc_row)))
            c.create_text(tx, y0 + 23, text=bidi(short_text(task.filename, max_chars)), anchor=anc, fill=c_text, font=f_title)
            if task.is_failed and task.status_detail:
                sub_txt = bidi("⚠ " + short_text(task.status_detail, max(10, max_sub - 2)))
                sub_col = cur("danger")
            elif st == "active" and prog["total_chunks"] > 1:
                parts_ar = f"⚡ {prog['active_chunks']}/{prog['total_chunks']} أجزاء متوازية"
                parts_en = f"⚡ {prog['active_chunks']}/{prog['total_chunks']} parallel parts"
                if max_sub < len(parts_ar) + 12:
                    sub_txt = f"\u202b{short_text(parts_ar, max_sub)}\u202c" if rtl else short_text(parts_en, max_sub)
                elif rtl:
                    rem_h = max(8, max_sub - len(parts_ar) - 5)
                    sub_txt = f"\u202b{parts_ar}  •  \u200e{short_text(host, rem_h)}\u200e\u202c"
                else:
                    rem_h = max(8, max_sub - len(parts_en) - 5)
                    sub_txt = f"{short_text(host, rem_h)}  •  {parts_en}"
                sub_col = c_cyan
            else:
                sub_txt = short_text(host, max_sub)
                sub_col = c_muted
            c.create_text(tx, y0 + 45, text=sub_txt, anchor=anc, fill=sub_col, font=f_sub)

            # 2. Size Column (when full 6-col view is active)
            dl_b = prog["downloaded"]
            if slot_size is not None:
                x_size, w_size = slot_size
                sx_anc = (x_size + w_size) if rtl else x_size
                if task.total_size > 0:
                    if st in ("active", "paused", "failed") and 0 < dl_b < task.total_size:
                        c.create_text(sx_anc, y0 + 24, text=fmt_size(task.total_size), anchor=anc, fill=c_text, font=f_bold)
                        c.create_text(sx_anc, y0 + 44, text=fmt_size(dl_b), anchor=anc, fill=c_muted, font=f_sub)
                    else:
                        c.create_text(sx_anc, cy, text=fmt_size(task.total_size), anchor=anc, fill=c_text, font=f_cell)
                else:
                    c.create_text(sx_anc, cy, text=fmt_size(dl_b) if dl_b > 0 else "--", anchor=anc, fill=c_muted, font=f_cell)

            # 3. Progress Bar + Live Multi-Segment Map Strip
            pct = 1.0 if st == "completed" else prog["percent"]
            bar_tok = {"completed": "success", "failed": "danger", "paused": "warning"}.get(st, "primary")
            bar_col = cur(bar_tok)

            px_start = (x_prog + w_prog) if rtl else x_prog
            px_opp = x_prog if rtl else (x_prog + w_prog)
            opp_anc = "w" if rtl else "e"
            c.create_text(px_start, y0 + 20, text=f"{int(pct * 100)}%", anchor=anc, fill=c_text, font=f_bold)
            if prog["total_chunks"] > 1 and not task.is_completed:
                c.create_text(px_opp, y0 + 20, text=f"{prog['total_chunks']}×", anchor=opp_anc, fill=c_muted, font=f_sub)

            py0 = y0 + 32
            _canvas_round_rect(c, x_prog, py0, x_prog + w_prog, py0 + 8, r=4, fill=c_track, outline="")
            fill_w = int(w_prog * min(1.0, max(0.0, pct)))
            if fill_w >= 4:
                if rtl:
                    _canvas_round_rect(c, x_prog + w_prog - fill_w, py0, x_prog + w_prog, py0 + 8, r=4, fill=bar_col, outline="")
                else:
                    _canvas_round_rect(c, x_prog, py0, x_prog + fill_w, py0 + 8, r=4, fill=bar_col, outline="")

            if task.total_size > 0 and len(task.chunks) > 1 and not task.is_completed:
                sy0 = y0 + 45
                c.create_rectangle(x_prog, sy0, x_prog + w_prog, sy0 + 4, fill=c_track, outline="")
                tot_b = float(task.total_size)
                c_ok = cur("success")
                raw_spans = []
                for ch in list(task.chunks)[:48]:
                    if ch.downloaded_bytes <= 0:
                        continue
                    o0 = int((ch.start_byte / tot_b) * w_prog)
                    o1 = int(((ch.start_byte + ch.downloaded_bytes) / tot_b) * w_prog)
                    if o1 > o0:
                        raw_spans.append((o0, o1, bool(ch.is_completed)))
                if raw_spans:
                    merged = []
                    for s0, s1, comp in sorted(raw_spans, key=lambda x: x[0]):
                        if merged and merged[-1][2] == comp and s0 <= merged[-1][1]:
                            merged[-1] = (merged[-1][0], max(merged[-1][1], s1), comp)
                        else:
                            merged.append((s0, s1, comp))
                    for off0, off1, is_comp in merged:
                        if rtl:
                            rx1 = x_prog + w_prog - off0
                            rx0 = max(x_prog, x_prog + w_prog - off1)
                        else:
                            rx0 = x_prog + off0
                            rx1 = min(x_prog + w_prog, x_prog + off1)
                        c.create_rectangle(rx0, sy0, rx1, sy0 + 4, fill=c_ok if is_comp else c_cyan, outline="")

            # 4. Status Pill
            ic_name, st_txt, pill_bg, pill_fg = state_view(task)
            raw_st = short_text(st_txt, 14)
            pw = min(w_stat, max(86, len(raw_st) * 7 + 34))
            px0 = (x_stat + w_stat - pw) if rtl else x_stat
            py_p0 = cy - 13
            _canvas_round_rect(c, px0, py_p0, px0 + pw, py_p0 + 26, r=13, fill=cur(pill_bg), outline="")
            if rtl:
                c.create_text(px0 + pw - 15, cy, text=ico(ic_name), fill=cur(pill_fg), font=fa_10)
                c.create_text(px0 + pw - 27, cy, text=bidi(raw_st), anchor="e", fill=cur(pill_fg), font=(UI_FONT, 8, "bold"))
            else:
                c.create_text(px0 + 15, cy, text=ico(ic_name), fill=cur(pill_fg), font=fa_10)
                c.create_text(px0 + 27, cy, text=bidi(raw_st), anchor="w", fill=cur(pill_fg), font=(UI_FONT, 8, "bold"))

            # 5. Speed & 6. ETA
            spd_x = (x_spd + w_spd) if rtl else x_spd
            if st == "active":
                spd = prog["speed_bps"]
                rem = max(0, task.total_size - dl_b)
                c.create_text(spd_x, cy, text=fmt_speed(spd) if spd > 0 else "--", anchor=anc,
                              fill=c_cyan if spd > 0 else c_muted, font=f_bold if spd > 0 else f_cell)
                if slot_eta is not None:
                    x_eta, w_eta = slot_eta
                    eta_x = (x_eta + w_eta) if rtl else x_eta
                    eta_str = fmt_eta(rem / spd) if (spd > 0 and task.total_size > 0) else "--"
                    c.create_text(eta_x, cy, text=eta_str, anchor=anc, fill=c_text if eta_str != "--" else c_muted, font=f_cell)
            else:
                if compact and task.total_size > 0:
                    c.create_text(spd_x, cy, text=fmt_size(task.total_size), anchor=anc, fill=c_text, font=f_cell)
                else:
                    c.create_text(spd_x, cy, text="--", anchor=anc, fill=c_muted, font=f_cell)
                if slot_eta is not None:
                    x_eta, w_eta = slot_eta
                    eta_x = (x_eta + w_eta) if rtl else x_eta
                    c.create_text(eta_x, cy, text="" if st == "completed" else "--", anchor=anc, fill=c_muted, font=f_cell)



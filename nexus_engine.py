"""
================================================================================
  NEGM DOWNLOAD ENGINE (core module)
  High-Performance Multi-Part Segmentation Engine & IDM-Inspired Architecture
================================================================================
  - Fast 1-Trip Server Probe with Connection Pooling (requests.Session)
  - IDM-Grade Dynamic Chunk Slicing & Low-CPU 256KB Buffer Streaming
  - Clean, Clutter-Free Modern Grid UX (No Redundant Dropdowns or Sliders)
  - IDM Action Toolbar: Add URL, Resume, Pause, Stop All, Resume All, Delete, Scheduler, Speed Limiter, Settings
  - IDM Category Hierarchy: All, Downloading, Completed, Paused, Failed + File Types (Compressed, Programs, Video, Music, Documents)
  - IDM 'Download File Info' Dialog: Instant Size/Name Probe + Category Routing + Download Now / Later
  - IDM 'Download Status & Segment Visualizer' Dialog: Real-time Multi-Chunk Slice Visualization
  - Right-Click Context Menu, Queue Scheduler, Global Speed Limiter, Auto PC Shutdown
  - Arabic & English Bilingual Support + Dark / Light Glassmorphism Themes
================================================================================
"""

import os
import re
import sys
import socket
import json
import csv
import time
import math
import uuid
import shutil
import zlib
import hashlib
import base64
import glob
import zipfile
import tarfile
import threading
from typing import Optional, Callable, Any, Dict, List, Tuple
import subprocess
import collections
import datetime
import urllib.parse
from html.parser import HTMLParser
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
import requests
from requests.adapters import HTTPAdapter
import customtkinter as ctk

# Sound support (Windows standard)
try:
    import winsound
except Exception:
    winsound = None

# Optional native desktop notifications
try:
    from plyer import notification as _plyer_notification  # pyrefly: ignore[missing-import]
except Exception:
    _plyer_notification = None

# Optional Drag & Drop
try:
    from tkinterdnd2 import TkinterDnD, DND_TEXT  # pyrefly: ignore[missing-import]
    DND_OK = True
except Exception:
    TkinterDnD = None
    DND_TEXT = None
    DND_OK = False

# Set default theme
ctk.set_appearance_mode("Dark")
ctk.set_default_color_theme("blue")


# ----------------------------------------------------------------------
# 0. Global Design System, Localization & Shared Utilities
# ----------------------------------------------------------------------
DATA_DIR = os.path.join(os.path.expanduser("~"), ".negm_stream")
_OLD_DATA_DIR = os.path.join(os.path.expanduser("~"), ".nexus_stream")
if not os.path.exists(DATA_DIR) and os.path.exists(_OLD_DATA_DIR):
    try:
        import shutil
        shutil.copytree(_OLD_DATA_DIR, DATA_DIR, dirs_exist_ok=True)
    except Exception:
        DATA_DIR = _OLD_DATA_DIR

SETTINGS_FILE = os.path.join(DATA_DIR, "settings.json")
DOWNLOADS_FILE = os.path.join(DATA_DIR, "downloads.json")
HISTORY_FILE = os.path.join(DATA_DIR, "history.json")
PROXIES_FILE = os.path.join(DATA_DIR, "proxies.json")
CREDENTIALS_FILE = os.path.join(DATA_DIR, "site_credentials.json")
BIN_DIR = os.path.join(DATA_DIR, "bin")
DEFAULT_BRIDGE_PORT = 45791

# Harmonious, WCAG 2.2 AA verified color tokens (Light, Dark)
PALETTE = {
    "bg": ("#f1f5f9", "#0b0e17"),
    "sidebar": ("#e8edf5", "#101422"),
    "header": ("#eef2f8", "#13182b"),
    "card": ("#ffffff", "#161b2e"),
    "card_alt": ("#f8fafc", "#1c233b"),
    "border": ("#64748b", "#7889ad"),
    "border_light": ("#d5deec", "#252f4d"),
    "text": ("#0f172a", "#f8fafc"),
    "text_muted": ("#475569", "#94a3b8"),
    "primary": ("#3653d9", "#4f46e5"),
    "primary_hover": ("#2b44b8", "#4338ca"),
    "primary_text": ("#2b44b8", "#8b96ff"),
    "accent_cyan": ("#0b5d7a", "#22d3ee"),
    "success": ("#065f46", "#34d399"),
    "warning": ("#92400e", "#fbbf24"),
    "danger": ("#b91c1c", "#f87171"),
    "danger_fill": ("#dc2626", "#dc2626"),
    "focus_ring": ("#2563eb", "#60a5fa"),
    "seg_unselected": ("#e2e8f0", "#232c48"),
    "row_select": ("#dbeafe", "#222c4d"),
    "row_hover": ("#edf2fb", "#1b223a"),
    "track": ("#dbe3ef", "#111628"),
}

DEFAULT_SETTINGS = {
    "lang": "ar",
    "theme": "Dark",
    "folder": os.path.join(os.path.expanduser("~"), "Downloads"),
    "max_concurrent": 3,
    "default_chunks": 8,
    "buffer_kb": 256,
    "auto_sort": True,
    "notify": True,
    "sound": True,
    "clip_monitor": True,
    "global_limit_kb": 0,  # 0 = unlimited
    "shutdown_when_done": False,
    "schedule_start": "",
    "schedule_stop": "",
    "opacity": 0.98,
    "minimize_to_tray": True,
    "start_with_windows": False,
    "show_drop_basket": False,
    "drop_basket_pos": [],
    # Phase 3 Settings
    "auto_av_scan": False,
    "custom_av_path": "",
    "auto_extract": False,
    "proxy_enabled": False,
    "proxy_url": "",
    "daily_quota_mb": 0,  # 0 = unlimited
    "quota_date": "",
    "quota_used_bytes": 0,
    # Phase 5 Settings
    "browser_bridge": True,
    "bridge_port": 45791,
    "total_lifetime_bytes": 0,
    "peak_speed_bps": 0,
    # Phase 12 Web Remote & LAN Automation
    "web_remote_enabled": False,
    "web_remote_port": 45792,
    "web_remote_token": "",
    "web_remote_allow_lan": True,
    "post_finish_action": "none",  # none, shutdown, sleep, hibernate, lock, exit_app
    "post_command": "",
    "post_webhook": "",
    # Phase 6 Multi-Queue System
    "queues": [
        {
            "id": "main",
            "name": "الطابور الرئيسي",
            "max_parallel": 3,
            "folder": "",
            "schedule_start": "",
            "schedule_stop": "",
            "enabled": True,
        }
    ],
}

LANG = "ar"

I18N = {
    "en": {
        "app_title": "Negm Lodaing",
        # Toolbar
        "tb_add": "+ Add URL",
        "tb_resume": "▶ Resume",
        "tb_pause": "⏸ Pause",
        "tb_stop_all": "⏹ Stop All",
        "tb_resume_all": "▶ Resume All",
        "tb_delete": "🗑 Delete",
        "tb_limiter": "⚡ Speed Limiter",
        "tb_scheduler": "⏱ Scheduler",
        "tb_settings": "⚙ Options",
        # Sidebar Categories
        "cat_title": "CATEGORIES",
        "cat_all": "All Downloads",
        "cat_active": "Downloading",
        "cat_completed": "Completed",
        "cat_paused": "Paused / Stopped",
        "cat_failed": "Failed / Error",
        "types_title": "FILE TYPES",
        "type_compressed": "Compressed",
        "type_programs": "Programs",
        "type_videos": "Videos",
        "type_music": "Audio / Music",
        "type_docs": "Documents",
        "type_other": "Other",
        # Grid Headers
        "col_name": "File Name",
        "col_size": "Size",
        "col_progress": "Progress",
        "col_status": "Status",
        "col_speed": "Speed",
        "col_eta": "Time Left",
        # Status Strings
        "st_queued": "Queued",
        "st_probing": "Connecting...",
        "st_downloading": "Downloading",
        "st_paused": "Paused",
        "st_completed": "Completed",
        "st_failed": "Failed",
        "st_assembling": "Assembling...",
        # Empty placeholder
        "empty_title": "No downloads in this view",
        "empty_sub": "Click [+ Add URL] or copy a download link to get started.",
        # Add Dialog
        "dlg_add_title": "Enter New Address to Download",
        "dlg_url": "Address (URL):",
        "dlg_name": "File Name:",
        "dlg_category": "Category:",
        "dlg_save": "Save To:",
        "dlg_chunks": "Connections:",
        "dlg_download_now": "▶ Download Now",
        "dlg_download_later": "⏳ Download Later",
        "dlg_cancel": "Cancel",
        "dlg_probing_lbl": "Checking file details from server...",
        # Progress Dialog
        "dlg_prog_title": "Download Status -",
        "dlg_file_size": "File Size:",
        "dlg_downloaded": "Downloaded:",
        "dlg_transfer_rate": "Transfer Rate:",
        "dlg_time_left": "Time Left:",
        "dlg_resume_cap": "Resume Support:",
        "dlg_yes": "Yes (Multi-part)",
        "dlg_no": "No (Single stream)",
        "dlg_segments": "Dynamic Chunks / Segments:",
        "dlg_limit_speed": "Speed Limiter:",
        "dlg_open_file": "Open File",
        "dlg_open_folder": "Open Folder",
        "dlg_close": "Close",
        # Context Menu
        "ctx_resume": "Resume Download",
        "ctx_pause": "Pause Download",
        "ctx_open": "Open File",
        "ctx_folder": "Open Containing Folder",
        "ctx_details": "Show Download Details",
        "ctx_redownload": "Redownload from Beginning",
        "ctx_remove_list": "Remove from List",
        "ctx_delete_file": "Delete File and Entry",
        "ctx_cut": "Cut",
        "ctx_copy": "Copy",
        "ctx_paste": "Paste",
        "ctx_delete": "Delete",
        "ctx_select_all": "Select All",
        "ctx_copy_link": "Copy Download Link",
        "toast_link_copied": "Link copied to clipboard",
        # Options Dialog
        "opt_title": "Negm Lodaing Options",
        "opt_tab_general": "General",
        "opt_tab_connection": "Connection",
        "opt_tab_appearance": "Appearance & Language",
        "opt_default_folder": "Default Download Folder:",
        "opt_auto_sort": "Automatically sort files into category folders",
        "opt_clip_monitor": "Monitor clipboard for downloadable links",
        "opt_sound": "Play sound when download finishes",
        "opt_notify": "Show desktop notification when download finishes",
        "opt_concurrency": "Maximum concurrent downloads:",
        "opt_chunks_default": "Default connection chunks per file:",
        "opt_buffer_size": "Disk buffer size (KB):",
        "opt_lang": "Language:",
        "opt_theme": "Theme:",
        "opt_dark": "Dark Mode",
        "opt_light": "Light Mode",
        "opt_opacity": "Window Opacity:",
        "opt_save": "Save Settings",
        # Speed Limiter Dialog
        "lim_title": "Speed Limiter Settings",
        "lim_enable": "Enable Global Speed Limiter",
        "lim_max": "Maximum download speed (KB/s):",
        "lim_unlimited": "0 = Unlimited",
        # Scheduler Dialog
        "sched_title": "Download Scheduler",
        "sched_start_queue": "Start queue at:",
        "sched_stop_queue": "Stop queue at:",
        "sched_shutdown": "Shut down computer when all downloads are completed",
        "sched_save": "Save Schedule",
        # Toasts & Warnings
        "t_done": "Download Completed",
        "t_fail": "Download Failed",
        "t_captured": "Download link detected from clipboard",
        "t_deleted": "Task removed",
        "t_started": "Download started",
        "t_invalid_url": "Please provide a valid download URL",
        # Phase 1 Translations
        "ctx_refresh_url": "Refresh Download Address (URL)",
        "dlg_refresh_title": "Refresh Expired Address",
        "dlg_refresh_desc": "Enter new download link for this task. Existing chunks will be preserved:",
        "dlg_refresh_btn": "Update Address",
        "dlg_refresh_success": "Download address updated successfully",
        "dlg_refresh_mismatch": "Warning: New link file size does not match existing chunks",
        "opt_minimize_to_tray": "Minimize to system tray on close instead of exiting",
        "opt_start_windows": "Launch NegmLoading automatically on Windows startup",
        "opt_drop_basket": "Show floating drop basket on desktop",
        "tray_show": "Show Negm Lodaing",
        "tray_add": "Add URL...",
        "tray_resume_all": "Resume All",
        "tray_pause_all": "Pause All",
        "tray_basket": "Toggle Drop Basket",
        "tray_exit": "Exit Negm Lodaing",
        "u_drop_basket": "Drop Basket",
        "tip_basket": "Toggle floating drop basket widget",
        "toast_minimized": "NegmLoading is running in the background in system tray",
        # Phase 2 Translations
        "u_batch": "Batch Download",
        "tip_batch": "Add sequential batch links (Ctrl+B)",
        "dlg_batch_title": "Batch Download Pattern",
        "dlg_batch_address": "Address with pattern (e.g. site.com/chap_[01-20].pdf or file_*.zip):",
        "dlg_batch_range": "Wildcard range (*):",
        "dlg_batch_from": "From:",
        "dlg_batch_to": "To:",
        "dlg_batch_digits": "Digits padding:",
        "dlg_batch_preview": "Generated Links Preview:",
        "dlg_batch_add": "Add to Queue",
        "dlg_batch_start_now": "Start downloading immediately",
        "dlg_batch_no_links": "Enter a valid pattern like [01-10] or *",
        "dlg_batch_count": "links generated",
        "dlg_batch_added": "Batch links added to queue",
        "ctx_checksum": "Verify File Checksum (Hash / MD5 / SHA256)",
        "dlg_hash_title": "File Checksum & Hash Verifier",
        "dlg_hash_calc": "Calculating file hashes in background...",
        "dlg_hash_compare": "Compare with expected checksum:",
        "dlg_hash_match": "Hash Matches 100% Valid",
        "dlg_hash_mismatch": "Hash Mismatch - File may be corrupted or modified",
        "dlg_hash_copy": "Copy",
        "dlg_hash_copied": "Hash copied to clipboard",
        # Phase 3 Translations
        "ctx_av_scan": "Scan File for Viruses",
        "opt_auto_av": "Automatically scan completed downloads for viruses",
        "opt_custom_av": "Custom Antivirus Scanner (.exe - leave blank for Windows Defender):",
        "opt_av_ph": "Auto: Windows Defender (MpCmdRun.exe)",
        "av_cat": "SECURITY",
        "av_scanning": "Scanning file for viruses...",
        "av_clean": "File is 100% Clean & Safe",
        "av_threat": "Security Alert: Threat Detected!",
        "av_unavail": "Antivirus scanner not available",
        "ctx_extract": "Extract Archive Here",
        "opt_auto_extract": "Automatically extract archives (ZIP / RAR / 7Z) after download",
        "ext_cat": "EXTRACTOR",
        "ext_running": "Extracting archive in background...",
        "ext_done": "Archive Extracted Successfully",
        "ext_fail": "Archive Extraction Failed",
        "opt_proxy_enable": "Use Proxy Server for Downloads (HTTP / HTTPS)",
        "opt_proxy_url": "Proxy Server Address:",
        "opt_proxy_ph": "http://127.0.0.1:8080  or  http://user:pass@host:port",
        "opt_quota_title": "Daily Data Quota Limit (MB - 0 = Unlimited):",
        "opt_quota_used": "Used today:",
        "opt_quota_reset": "Reset Counter",
        "quota_cat": "DATA QUOTA",
        "quota_reached": "Daily Data Quota Reached - Downloads Paused",
        "quota_reset_done": "Daily data usage counter reset to 0",
        "sb_quota": "Quota",
        "sb_proxy": "Proxy",
        # Phase 4 Translations: Video Grabber & Site Link Spider
        "u_video": "Video Grabber",
        "tip_video": "Download videos & audio from YouTube and platforms (Ctrl+Y)",
        "u_spider": "Link Grabber",
        "tip_spider": "Extract all downloadable files & media from any webpage (Ctrl+G)",
        "u_media_detected": "Video / Media link detected — click to choose quality",
        "vid_title": "Smart Video & Media Grabber (yt-dlp)",
        "vid_url_lbl": "Video or Audio Page URL (YouTube, TikTok, Facebook, X, Instagram, SoundCloud...):",
        "vid_analyze": "Analyze Quality",
        "vid_analyzing": "Analyzing media streams & available resolutions...",
        "vid_eng_ready": "Video Engine Ready (yt-dlp)",
        "vid_eng_missing": "yt-dlp Video Engine is not installed yet (~17 MB portable, 1-click setup)",
        "vid_eng_install": "1-Click Download Engine",
        "vid_eng_installing": "Downloading official yt-dlp.exe...",
        "vid_eng_update": "Update Engine",
        "vid_eng_updated": "Video engine is ready and up to date!",
        "vid_quality": "Select Quality / Format:",
        "vid_q_best": "Best Available Quality (Auto Video + Audio)",
        "vid_q_audio": "Audio Only — High Quality (M4A / MP3)",
        "vid_info_ph": "Paste a video link above and click [Analyze Quality] to preview title, duration, and resolutions.",
        "vid_duration": "Duration",
        "vid_channel": "Channel",
        "vid_platform": "Platform",
        "vid_added": "Media download added to queue",
        "spd_title": "Webpage Link Grabber & Media Spider",
        "spd_url_lbl": "Webpage URL to scan for files, videos, documents & images:",
        "spd_scan": "Scan Page",
        "spd_scanning": "Scanning webpage and extracting links...",
        "spd_filter_files": "Files & Media",
        "spd_filter_all": "All Links",
        "spd_filter_images": "Images",
        "spd_search_ph": "Filter by name or extension (e.g. .pdf, .mp4)...",
        "spd_sel_all": "Select All",
        "spd_desel_all": "Clear Selection",
        "spd_selected_n": "selected of",
        "spd_download_sel": "Add Selected to Queue",
        "spd_empty": "Enter a webpage URL and click [Scan Page] to discover all downloadable files.",
        "spd_no_match": "No links match the current filter.",
        "spd_col_name": "File / Item Name",
        "spd_col_type": "Category",
        "spd_col_ext": "Ext",
        "spd_col_url": "Direct URL",
        # Phase 5 Translations: Analytics, Export/Import & Browser Bridge
        "u_stats": "Analytics",
        "tip_stats": "Live speed graph & download statistics (Ctrl+I)",
        "st_dash_title": "Download Analytics & Live Speed Monitor",
        "st_kpi_lifetime": "Total Downloaded",
        "st_kpi_today": "Today's Data",
        "st_kpi_done": "Completed Files",
        "st_kpi_peak": "Peak Speed",
        "st_graph_title": "Real-Time Transfer Rate (Last 60 Samples)",
        "st_cat_breakdown": "Storage Breakdown by File Category",
        "st_reset_stats": "Reset Statistics",
        "u_exp_imp": "Import / Export",
        "tip_exp_imp": "Export or import download lists & backups (.txt / .ef2 / .json)",
        "ei_title": "Export & Import Download Lists",
        "ei_exp_sec": "Export Downloads",
        "ei_exp_scope_all": "All Downloads in List",
        "ei_exp_scope_sel": "Selected Rows Only",
        "ei_exp_txt": "Export Plain URLs (.txt)",
        "ei_exp_ef2": "Export IDM Format (.ef2)",
        "ei_exp_json": "Full NegmLoading Backup (.json)",
        "ei_imp_sec": "Import Links or Backup",
        "ei_imp_desc": "Import links from .txt, IDM .ef2 (with Referer/Cookies), or NegmLoading .json backup:",
        "ei_imp_btn": "Choose File & Import...",
        "ei_exp_ok": "Exported successfully",
        "ei_imp_ok": "Imported items successfully",
        "u_browser": "Browser Extension",
        "tip_browser": "Connect Chrome, Edge & Brave to Negm Lodaing",
        "br_title": "Browser Integration & Official Extension",
        "br_status_on": "Local Browser Bridge Active on 127.0.0.1:45791",
        "br_status_off": "Local Browser Bridge is Disabled",
        "br_enable_sw": "Enable Local Browser Integration Server (Port 45791)",
        "br_open_folder": "Open Extension Folder",
        "br_copy_chrome": "Copy chrome://extensions",
        "br_copy_edge": "Copy edge://extensions",
        "br_steps_title": "How to Activate in Chrome / Edge / Brave (30 Seconds):",
        "br_step1": "1. Open chrome://extensions or edge://extensions and enable [Developer mode].",
        "br_step2": "2. Click [Load unpacked] and select the 'browser_extension' folder below.",
        "br_step3": "3. Enjoy automatic download capture, cookies/referer pass-through & right-click menu!",
        "br_captured_toast": "Captured from Browser",
    },
    "ar": {
        "app_title": "Negm Lodaing",
        # Toolbar
        "tb_add": "+ إضافة رابط",
        "tb_resume": "▶ استئناف",
        "tb_pause": "⏸ إيقاف مؤقت",
        "tb_stop_all": "⏹ إيقاف الكل",
        "tb_resume_all": "▶ بدء الكل",
        "tb_delete": "🗑 حذف",
        "tb_limiter": "⚡ محدد السرعة",
        "tb_scheduler": "⏱ الجدولة",
        "tb_settings": "⚙ الخيارات",
        # Sidebar Categories
        "cat_title": "التصنيفات",
        "cat_all": "كل التنزيلات",
        "cat_active": "جاري التحميل",
        "cat_completed": "مكتمل",
        "cat_paused": "متوقف مؤقتًا",
        "cat_failed": "فاشل / خطأ",
        "types_title": "أنواع الملفات",
        "type_compressed": "المضغوطات",
        "type_programs": "البرامج",
        "type_videos": "الفيديوهات",
        "type_music": "الصوتيات والموسيقى",
        "type_docs": "المستندات",
        "type_other": "أخرى",
        # Grid Headers
        "col_name": "اسم الملف",
        "col_size": "الحجم",
        "col_progress": "التقدم",
        "col_status": "الحالة",
        "col_speed": "السرعة",
        "col_eta": "الوقت المتبقي",
        # Status Strings
        "st_queued": "في الانتظار",
        "st_probing": "جاري الاتصال...",
        "st_downloading": "جاري التحميل",
        "st_paused": "متوقف",
        "st_completed": "مكتمل",
        "st_failed": "فشل التحميل",
        "st_assembling": "جاري تجميع الملف...",
        # Empty placeholder
        "empty_title": "لا توجد تنزيلات في هذا القسم",
        "empty_sub": "اضغط على [+ إضافة رابط] أو انسخ أي رابط تنزيل للبدء فورًا.",
        # Add Dialog
        "dlg_add_title": "إدخال رابط جديد للتنزيل",
        "dlg_url": "عنوان الرابط (URL):",
        "dlg_name": "اسم الملف:",
        "dlg_category": "التصنيف:",
        "dlg_save": "مكان الحفظ:",
        "dlg_chunks": "عدد خيوط الاتصال:",
        "dlg_download_now": "▶ بدء التحميل الآن",
        "dlg_download_later": "⏳ إضافة للطابور لاحقًا",
        "dlg_cancel": "إلغاء",
        "dlg_probing_lbl": "جاري فحص حجم واسم الملف من الخادم...",
        # Progress Dialog
        "dlg_prog_title": "تفاصيل التنزيل -",
        "dlg_file_size": "حجم الملف الكلي:",
        "dlg_downloaded": "المحمل حتى الآن:",
        "dlg_transfer_rate": "معدل النقل (السرعة):",
        "dlg_time_left": "الوقت المقدر للانتهاء:",
        "dlg_resume_cap": "دعم الاستئناف:",
        "dlg_yes": "نعم (تجزئة متعددة)",
        "dlg_no": "لا (اتصال فردي)",
        "dlg_segments": "خريطة الأجزاء الحية (Segments):",
        "dlg_limit_speed": "محدد السرعة:",
        "dlg_open_file": "فتح الملف",
        "dlg_open_folder": "فتح المجلد",
        "dlg_close": "إغلاق",
        # Context Menu
        "ctx_resume": "استئناف التنزيل",
        "ctx_pause": "إيقاف مؤقت",
        "ctx_open": "فتح الملف مباشرة",
        "ctx_folder": "فتح المجلد الحاوي للملف",
        "ctx_details": "عرض تفاصيل وأجزاء التنزيل",
        "ctx_redownload": "إعادة التنزيل من البداية",
        "ctx_remove_list": "إزالة من القائمة فقط",
        "ctx_delete_file": "حذف الملف تمامًا من القرص",
        "ctx_cut": "قص",
        "ctx_copy": "نسخ",
        "ctx_paste": "لصق",
        "ctx_delete": "حذف",
        "ctx_select_all": "تحديد الكل",
        "ctx_copy_link": "نسخ رابط التحميل",
        "toast_link_copied": "تم نسخ الرابط إلى الحافظة بنجاح",
        # Options Dialog
        "opt_title": "خيارات وإعدادات NegmLoading",
        "opt_tab_general": "عام",
        "opt_tab_connection": "الاتصال والشبكة",
        "opt_tab_appearance": "المظهر واللغة",
        "opt_default_folder": "مجلد الحفظ الافتراضي:",
        "opt_auto_sort": "تصنيف وترتيب الملفات تلقائيًا في مجلدات حسب نوعها",
        "opt_clip_monitor": "مراقبة الحافظة والتقاط الروابط تلقائيًا",
        "opt_sound": "تشغيل نغمة صوتية عند انتهاء التنزيل",
        "opt_notify": "إظهار إشعار على سطح المكتب عند انتهاء التنزيل",
        "opt_concurrency": "الحد الأقصى للتنزيلات المتزامنة:",
        "opt_chunks_default": "عدد أجزاء التجزئة الافتراضي لكل ملف:",
        "opt_buffer_size": "حجم مخزن القرص المؤقت (كيلوبايت):",
        "opt_lang": "اللغة:",
        "opt_theme": "المظهر:",
        "opt_dark": "النمط الداكن",
        "opt_light": "النمط الفاتح",
        "opt_opacity": "شفافية الواجهة الزجاجية:",
        "opt_save": "حفظ الإعدادات",
        # Speed Limiter Dialog
        "lim_title": "إعدادات محدد السرعة",
        "lim_enable": "تفعيل محدد السرعة العام للبرنامج",
        "lim_max": "أقصى سرعة إجمالية مسموحة (كيلوبايت/ثانية):",
        "lim_unlimited": "0 = سرعة غير محدودة (أقصى طاقة)",
        # Scheduler Dialog
        "sched_title": "جدولة التنزيلات التلقائية",
        "sched_start_queue": "بدء الطابور تلقائيًا عند الساعة:",
        "sched_stop_queue": "إيقاف الطابور تلقائيًا عند الساعة:",
        "sched_shutdown": "إطفاء جهاز الكمبيوتر تلقائيًا بعد اكتمال كل التنزيلات",
        "sched_save": "تفعيل الجدولة",
        # Toasts & Warnings
        "t_done": "اكتمل تنزيل الملف بنجاح",
        "t_fail": "تعذر تنزيل الملف",
        "t_captured": "تم التقاط رابط تنزيل من الحافظة",
        "t_deleted": "تم حذف المهمة",
        "t_started": "بدأ التنزيل",
        "t_invalid_url": "يرجى إدخال رابط تنزيل صحيح (HTTP/HTTPS)",
        # Phase 1 Translations
        "ctx_refresh_url": "تحديث رابط التنزيل (في حال انتهاء صلاحيته)",
        "dlg_refresh_title": "تحديث رابط التنزيل المنتهي",
        "dlg_refresh_desc": "أدخل الرابط الجديد لنفس الملف لمواصلة التحميل دون فقد الأجزاء المحملة:",
        "dlg_refresh_btn": "تحديث الرابط الآن",
        "dlg_refresh_success": "تم تحديث رابط التنزيل بنجاح",
        "dlg_refresh_mismatch": "تنبيه: حجم الملف في الرابط الجديد يختلف عن الحجم الأصلي",
        "opt_minimize_to_tray": "التصغير إلى شريط المهام (System Tray) عند إغلاق البرنامج",
        "opt_start_windows": "تشغيل NegmLoading تلقائياً مع بدء إقلاع ويندوز",
        "opt_drop_basket": "إظهار سلة الإسقاط العائمة على سطح المكتب",
        "tray_show": "فتح NegmLoading",
        "tray_add": "إضافة رابط جديد...",
        "tray_resume_all": "استئناف الكل",
        "tray_pause_all": "إيقاف الكل مؤقتاً",
        "tray_basket": "إظهار/إخفاء سلة الإسقاط العائمة",
        "tray_exit": "خروج نهائي",
        "u_drop_basket": "سلة الإسقاط",
        "tip_basket": "إظهار أو إخفاء سلة الإسقاط العائمة",
        "toast_minimized": "NegmLoading يواصل العمل في الخلفية في شريط المهام",
        # Phase 2 Translations
        "u_batch": "تنزيل الدفعات",
        "tip_batch": "إضافة روابط متسلسلة دفعة واحدة (Ctrl+B)",
        "dlg_batch_title": "تنزيل الدفعات المتسلسلة (Batch Download)",
        "dlg_batch_address": "عنوان الرابط مع النمط (مثال: site.com/chap_[01-20].pdf أو file_*.zip):",
        "dlg_batch_range": "نطاق النجمة (*):",
        "dlg_batch_from": "من:",
        "dlg_batch_to": "إلى:",
        "dlg_batch_digits": "خانة الأصفار:",
        "dlg_batch_preview": "معاينة الروابط المتولدة:",
        "dlg_batch_add": "إضافة الروابط للقائمة",
        "dlg_batch_start_now": "بدء التحميل فوراً",
        "dlg_batch_no_links": "يرجى كتابة نمط صحيح مثل [01-10] أو *",
        "dlg_batch_count": "رابط متولد",
        "dlg_batch_added": "تمت إضافة دفعة الروابط إلى طابور التنزيل",
        "ctx_checksum": "فحص ومطابقة الهاش (MD5 / SHA256 Checksum)",
        "dlg_hash_title": "فاحص سلامة الملف ومطابقة الهاش",
        "dlg_hash_calc": "جاري فحص وحساب قيم الهاش للملف...",
        "dlg_hash_compare": "مقارنة مع الهاش المتوقع من الموقع:",
        "dlg_hash_match": "الهاش متطابق 100% - الملف سليم تماماً",
        "dlg_hash_mismatch": "الهاش غير متطابق! - قد يكون الملف تالفاً أو معدلاً",
        "dlg_hash_copy": "نسخ",
        "dlg_hash_copied": "تم نسخ قيمة الهاش إلى الحافظة",
        # Phase 3 Translations
        "ctx_av_scan": "فحص الملف من الفيروسات (حماية)",
        "opt_auto_av": "فحص الملفات تلقائياً من الفيروسات فور اكتمال التحميل",
        "opt_custom_av": "مسار برنامج الحماية المخصص (اتركه فارغاً لاستخدام Windows Defender تلقائياً):",
        "opt_av_ph": "تلقائي: Windows Defender المدمج في ويندوز",
        "av_cat": "الحماية",
        "av_scanning": "جاري فحص الملف أمنياً من الفيروسات...",
        "av_clean": "الملف آمن وسليم 100% (لا توجد تهديدات)",
        "av_threat": "تحذير أمني خطير: تم اكتشاف تهديد في الملف!",
        "av_unavail": "تعذر العثور على محرك فحص الفيروسات",
        "ctx_extract": "فك ضغط الأرشيف في مجلد فرعي",
        "opt_auto_extract": "فك ضغط الملفات المضغوطة (ZIP / RAR / 7Z) تلقائياً بعد التحميل",
        "ext_cat": "فك الضغط",
        "ext_running": "جاري فك ضغط الأرشيف في الخلفية...",
        "ext_done": "تم فك ضغط الأرشيف بنجاح",
        "ext_fail": "تعذر فك ضغط الأرشيف",
        "opt_proxy_enable": "استخدام خادم بروكسي للتنزيلات (HTTP / HTTPS)",
        "opt_proxy_url": "عنوان ومنفذ خادم البروكسي:",
        "opt_proxy_ph": "http://127.0.0.1:8080  أو  http://user:pass@host:port",
        "opt_quota_title": "الحد اليومي لاستهلاك باقة الإنترنت (بالميجابايت - 0 غير محدود):",
        "opt_quota_used": "المستهلك اليوم:",
        "opt_quota_reset": "تصفير العداد",
        "quota_cat": "باقة الإنترنت",
        "quota_reached": "انتهى الحد اليومي المحدد للباقة — تم إيقاف التنزيلات مؤقتاً",
        "quota_reset_done": "تم تصفير عداد استهلاك الباقة اليومي",
        "sb_quota": "الباقة",
        "sb_proxy": "بروكسي",
        # Phase 4 Translations: Video Grabber & Site Link Spider
        "u_video": "ساحب الفيديو",
        "tip_video": "تحميل الفيديوهات والصوتيات من يوتيوب والمنصات باختيار الجودة (Ctrl+Y)",
        "u_spider": "مستكشف الروابط",
        "tip_spider": "استخراج جميع الملفات والوسائط من أي صفحة ويب دفعة واحدة (Ctrl+G)",
        "u_media_detected": "تم رصد رابط فيديو/وسائط في الحافظة — اضغط لاختيار الجودة",
        "vid_title": "ساحب الفيديوهات والوسائط الذكي (yt-dlp)",
        "vid_url_lbl": "رابط صفحة الفيديو أو الصوت (يوتيوب، تيك توك، فيسبوك، إكس، إنستغرام، ساوندكلاود...):",
        "vid_analyze": "تحليل الجودات",
        "vid_analyzing": "جاري الاتصال واستخراج الجودات والصيغ المتاحة...",
        "vid_eng_ready": "محرك الفيديوهات جاهز للعمل (yt-dlp)",
        "vid_eng_missing": "محرك الفيديوهات (yt-dlp) غير مثبت بعد — يمكنك تنزيله وتفعيله تلقائياً بنقرة واحدة",
        "vid_eng_install": "تثبيت المحرك بنقرة واحدة",
        "vid_eng_installing": "جاري تنزيل محرك yt-dlp الرسمي...",
        "vid_eng_update": "تحديث المحرك",
        "vid_eng_updated": "محرك الفيديوهات جاهز ومحدّث بنجاح!",
        "vid_quality": "اختر الجودة والصيغة المطلوبة:",
        "vid_q_best": "أفضل جودة متاحة تلقائياً (فيديو + صوت)",
        "vid_q_audio": "صوت فقط — جودة نقية (M4A / MP3)",
        "vid_info_ph": "الصق رابط الفيديو بالأعلى واضغط [تحليل الجودات] لعرض عنوان الفيديو ومدته وقائمة الدقات المتاحة.",
        "vid_duration": "المدة",
        "vid_channel": "القناة / الناشر",
        "vid_platform": "المنصة",
        "vid_added": "تمت إضافة الفيديو إلى قائمة التنزيلات",
        "spd_title": "مستكشف وساحب روابط الصفحات (Site Link Grabber)",
        "spd_url_lbl": "عنوان صفحة الويب المراد استخراج الملفات والفيديوهات والكتب والصور منها:",
        "spd_scan": "فحص الصفحة",
        "spd_scanning": "جاري فحص الصفحة واستخراج كافة الروابط...",
        "spd_filter_files": "الملفات والوسائط",
        "spd_filter_all": "كل الروابط",
        "spd_filter_images": "الصور",
        "spd_search_ph": "تصفية بالاسم أو الامتداد (مثل .pdf أو .mp4)...",
        "spd_sel_all": "تحديد الكل",
        "spd_desel_all": "إلغاء التحديد",
        "spd_selected_n": "محدد من أصل",
        "spd_download_sel": "تنزيل الملفات المحددة",
        "spd_empty": "أدخل رابط أي صفحة ويب واضغط [فحص الصفحة] لاكتشاف كل الملفات القابلة للتحميل بداخلها.",
        "spd_no_match": "لا توجد روابط مطابقة للتصفية الحالية.",
        "spd_col_name": "اسم الملف / العنصر",
        "spd_col_type": "التصنيف",
        "spd_col_ext": "الامتداد",
        "spd_col_url": "الرابط المباشر",
        # Phase 5 Translations: Analytics, Export/Import & Browser Bridge
        "u_stats": "الإحصائيات",
        "tip_stats": "مخطط السرعة الحي وإحصائيات التحميل الشاملة (Ctrl+I)",
        "st_dash_title": "لوحة الإحصائيات ومراقب السرعة الحي",
        "st_kpi_lifetime": "إجمالي المحمّل الكلي",
        "st_kpi_today": "استهلاك اليوم",
        "st_kpi_done": "الملفات المكتملة",
        "st_kpi_peak": "أعلى سرعة مسجلة",
        "st_graph_title": "مخطط معدل النقل اللحظي (آخر 60 قراءة حية)",
        "st_cat_breakdown": "توزيع حجم التحميلات حسب تصنيف الملفات",
        "st_reset_stats": "تصفير الإحصائيات",
        "u_exp_imp": "تصدير / استيراد",
        "tip_exp_imp": "تصدير أو استيراد قوائم التنزيل والنسخ الاحتياطية (.txt / .ef2 / .json)",
        "ei_title": "تصدير واستيراد قوائم التنزيل والنسخ الاحتياطي",
        "ei_exp_sec": "تصدير قائمة التنزيلات",
        "ei_exp_scope_all": "تصدير كل القائمة",
        "ei_exp_scope_sel": "تصدير المحدد فقط",
        "ei_exp_txt": "تصدير روابط نصية (.txt)",
        "ei_exp_ef2": "تصدير صيغة IDM (.ef2)",
        "ei_exp_json": "نسخة احتياطية شاملة (.json)",
        "ei_imp_sec": "استيراد روابط أو استعادة نسخة",
        "ei_imp_desc": "يدعم استيراد ملفات .txt أو ملفات IDM (.ef2 مع الكوكيز والـ Referer) أو نسخ NEGM (.json):",
        "ei_imp_btn": "اختيار ملف للاستيراد...",
        "ei_exp_ok": "تم تصدير القائمة بنجاح",
        "ei_imp_ok": "تم استيراد العناصر بنجاح",
        "u_browser": "إضافة المتصفح",
        "tip_browser": "ربط متصفح Chrome و Edge و Brave ببرنامج NegmLoading تلقائياً",
        "br_title": "ربط المتصفح وإضافة NegmLoading الرسمية",
        "br_status_on": "جسر المتصفح المحلي متصل ونشط (127.0.0.1:45791)",
        "br_status_off": "جسر المتصفح المحلي متوقف حالياً",
        "br_enable_sw": "تفعيل جسر استقبال التنزيلات المباشر من المتصفح (منفذ 45791)",
        "br_open_folder": "فتح مجلد الإضافة",
        "br_copy_chrome": "نسخ chrome://extensions",
        "br_copy_edge": "نسخ edge://extensions",
        "br_steps_title": "خطوات تفعيل إضافة NegmLoading على كروم أو إيدج في ثوانٍ:",
        "br_step1": "1. افتح الرابط chrome://extensions أو edge://extensions وفعّل [وضع المطور Developer mode].",
        "br_step2": "2. اضغط [تحميل غير محزوم Load unpacked] واختر مجلد browser_extension بالأسفل.",
        "br_step3": "3. ستلتقط الإضافة التنزيلات تلقائياً مع تمرير الكوكيز والـ Referer وقائمة الكليك يمين!",
        "br_captured_toast": "تم الاستلام من المتصفح",
    }
}


def set_language(code):
    global LANG
    LANG = code if code in I18N else "en"


def set_windows_startup(enabled: bool):
    """Enables or disables auto-startup with Windows in HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run."""
    if sys.platform != "win32":
        return
    import winreg
    key_path = r"Software\Microsoft\Windows\CurrentVersion\Run"
    app_name = "Negm Lodaing"
    if getattr(sys, "frozen", False):
        cmd = f'"{os.path.abspath(sys.executable)}" --tray'
    else:
        app_path = os.path.abspath(sys.argv[0])
        cmd = f'"{sys.executable}" "{app_path}" --tray'
    try:
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, key_path, 0, winreg.KEY_SET_VALUE) as key:
            if enabled:
                winreg.SetValueEx(key, app_name, 0, winreg.REG_SZ, cmd)
            else:
                try:
                    winreg.DeleteValue(key, app_name)
                except FileNotFoundError:
                    pass
    except Exception as e:
        print("set_windows_startup error:", e)


def get_windows_startup() -> bool:
    if sys.platform != "win32":
        return False
    import winreg
    key_path = r"Software\Microsoft\Windows\CurrentVersion\Run"
    app_name = "Negm Lodaing"
    try:
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, key_path, 0, winreg.KEY_READ) as key:
            winreg.QueryValueEx(key, app_name)
            return True
    except Exception:
        return False


def t(key):
    return I18N.get(LANG, I18N["en"]).get(key, key)


def cur(token):
    """Returns the hex color code for the current theme from a (Light, Dark) pair."""
    pair = PALETTE.get(token, token)
    if isinstance(pair, tuple):
        return pair[1] if ctk.get_appearance_mode() == "Dark" else pair[0]
    return pair


def load_json(path, default):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return default


_SAVE_JSON_LOCK = threading.Lock()

def save_json(path, data):
    tmp = None
    with _SAVE_JSON_LOCK:
        try:
            dir_name = os.path.dirname(path)
            if dir_name:
                os.makedirs(dir_name, exist_ok=True)
            tmp = f"{path}.{os.getpid()}.{time.time_ns()}.tmp"
            with open(tmp, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            for attempt in range(8):
                try:
                    os.replace(tmp, path)
                    break
                except PermissionError:
                    if attempt == 7:
                        raise
                    time.sleep(0.015 * (attempt + 1))
        except Exception as e:
            print("Save JSON error:", e)
            if tmp and os.path.exists(tmp):
                try:
                    os.remove(tmp)
                except Exception:
                    pass


def fmt_size(num):
    num = float(num or 0)
    for unit in ("B", "KB", "MB", "GB", "TB"):
        if num < 1024 or unit == "TB":
            return f"{num:.0f} {unit}" if unit == "B" else f"{num:.2f} {unit}"
        num /= 1024


def fmt_speed(bps):
    return fmt_size(bps) + "/s"


def fmt_eta(seconds):
    if seconds is None or seconds < 0 or seconds > 86400 * 7:
        return "--"
    seconds = int(seconds)
    h, rem = divmod(seconds, 3600)
    m, s = divmod(rem, 60)
    if h > 0:
        return f"{h}h {m:02d}m"
    if m > 0:
        return f"{m}m {s:02d}s"
    return f"{s}s"


# Category mappings matching IDM
CATEGORIES = {
    "type_compressed": (".zip", ".rar", ".7z", ".tar", ".gz", ".bz2", ".xz", ".iso", ".tgz"),
    "type_programs": (".exe", ".msi", ".apk", ".dmg", ".deb", ".rpm", ".appx", ".bat", ".cmd"),
    "type_videos": (".mp4", ".mkv", ".avi", ".mov", ".webm", ".flv", ".wmv", ".m4v", ".ts", ".3gp"),
    "type_music": (".mp3", ".wav", ".flac", ".aac", ".ogg", ".m4a", ".wma", ".opus"),
    "type_docs": (".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt", ".epub", ".csv", ".rtf"),
}

CATEGORY_ICONS = {
    "type_compressed": "🗜",
    "type_programs": "⚙",
    "type_videos": "🎬",
    "type_music": "🎵",
    "type_docs": "📄",
    "type_other": "📦",
}


CATEGORY_FOLDERS = {
    "type_compressed": "Compressed", "type_programs": "Programs", "type_videos": "Videos",
    "type_music": "Music", "type_docs": "Documents", "type_other": "Other",
}


def detect_category(filename):
    ext = os.path.splitext(filename)[1].lower()
    for cat_key, extensions in CATEGORIES.items():
        if ext in extensions:
            return cat_key
    return "type_other"


def is_queue_time_active(start_str: str, stop_str: str) -> bool:
    """Checks if current wall-clock time falls between start_str and stop_str (format 'HH:MM').
    If both or either is empty, the queue is considered active at all times.
    Handles overnight spans gracefully (e.g. 23:00 to 07:00).
    """
    if not start_str or not stop_str:
        return True
    try:
        sh, sm = map(int, start_str.strip().split(":"))
        eh, em = map(int, stop_str.strip().split(":"))
        start_t = datetime.time(sh, sm)
        end_t = datetime.time(eh, em)
        now_t = datetime.datetime.now().time()
        if start_t <= end_t:
            return start_t <= now_t <= end_t
        else:
            return now_t >= start_t or now_t <= end_t
    except Exception:
        return True


def play_event_sound(event_name: str, custom_path: str = ""):
    """
    Plays non-blocking asynchronous audio for system events:
    - 'complete': Download finished successfully (default: tada.wav)
    - 'failed': Download failed (default: Windows Critical Stop.wav)
    - 'queue_done': All active queue downloads finished (default: chimes.wav)
    - 'notify': General notification chime
    """
    if sys.platform != "win32" or not winsound:
        return

    wav_path = custom_path if (custom_path and os.path.isfile(custom_path)) else None
    if not wav_path:
        win_media = os.path.join(os.environ.get("WINDIR", r"C:\Windows"), "Media")
        default_map = {
            "complete": os.path.join(win_media, "tada.wav"),
            "failed": os.path.join(win_media, "Windows Critical Stop.wav"),
            "queue_done": os.path.join(win_media, "chimes.wav"),
            "notify": os.path.join(win_media, "notify.wav"),
        }
        cand = default_map.get(event_name)
        if cand and os.path.isfile(cand):
            wav_path = cand

    try:
        if wav_path and os.path.isfile(wav_path):
            winsound.PlaySound(wav_path, winsound.SND_FILENAME | winsound.SND_ASYNC | winsound.SND_NODEFAULT)
        else:
            mb_map = {
                "complete": getattr(winsound, "MB_OK", 0),
                "failed": getattr(winsound, "MB_ICONHAND", 16),
                "queue_done": getattr(winsound, "MB_ICONASTERISK", 64),
            }
            winsound.MessageBeep(mb_map.get(event_name, getattr(winsound, "MB_OK", 0)))
    except Exception:
        try:
            winsound.MessageBeep(0)
        except Exception:
            pass


def sanitize_filename(name):
    clean = re.sub(r'[<>:"/\\|?*]', '_', name or "").strip()
    return clean or "download_file.bin"


def extract_filename_from_url(url, fallback="file.bin"):
    try:
        parsed = urllib.parse.urlparse(url)
        path = urllib.parse.unquote(parsed.path)
        base = os.path.basename(path.rstrip("/"))
        if base and "." in base:
            clean = sanitize_filename(base)
            if clean:
                return clean
    except Exception:
        pass
    return fallback


def unique_filepath(path):
    if not os.path.exists(path):
        return path
    folder, name = os.path.split(path)
    base, ext = os.path.splitext(name)
    counter = 1
    while os.path.exists(os.path.join(folder, f"{base} ({counter}){ext}")):
        counter += 1
    return os.path.join(folder, f"{base} ({counter}){ext}")


URL_REGEX = re.compile(r"https?://[^\s<>\"']+", re.IGNORECASE)

ARCHIVE_EXTENSIONS = (
    ".tar.gz", ".tar.bz2", ".tar.xz", ".tgz", ".tbz2", ".txz",
    ".zip", ".rar", ".7z", ".tar",
)


def is_extractable_archive(filename: str) -> bool:
    low = (filename or "").strip().lower()
    return any(low.endswith(ext) for ext in ARCHIVE_EXTENSIONS)


def archive_stem_name(filename: str) -> str:
    base = os.path.basename(filename or "")
    low = base.lower()
    for comp in (".tar.gz", ".tar.bz2", ".tar.xz"):
        if low.endswith(comp) and len(base) > len(comp):
            return sanitize_filename(base[:-len(comp)])
    stem, _ = os.path.splitext(base)
    return sanitize_filename(stem or "Extracted")


def find_av_scanner(custom_path: str = ""):
    """Locates custom antivirus CLI or built-in Windows Defender MpCmdRun.exe."""
    custom_path = (custom_path or "").strip().strip('"')
    if custom_path and os.path.isfile(custom_path):
        mode = "defender" if os.path.basename(custom_path).lower() == "mpcmdrun.exe" else "custom"
        return custom_path, mode

    if sys.platform == "win32":
        plat_root = r"C:\ProgramData\Microsoft\Windows Defender\Platform"
        if os.path.isdir(plat_root):
            try:
                for entry in sorted(os.listdir(plat_root), reverse=True):
                    cand = os.path.join(plat_root, entry, "MpCmdRun.exe")
                    if os.path.isfile(cand):
                        return cand, "defender"
            except Exception:
                pass
        for pf in (
            r"C:\Program Files\Windows Defender\MpCmdRun.exe",
            r"C:\Program Files (x86)\Windows Defender\MpCmdRun.exe",
        ):
            if os.path.isfile(pf):
                return pf, "defender"
    return None, ""


def scan_file_antivirus(file_path: str, custom_path: str = ""):
    """
    Runs a non-blocking subprocess antivirus scan on file_path.
    Returns (status, detail) where status in ('clean', 'threat', 'unavailable', 'error').
    """
    if not file_path or not os.path.isfile(file_path):
        return "error", "File not found on disk"

    scanner_exe, mode = find_av_scanner(custom_path)
    if not scanner_exe:
        return "unavailable", "Windows Defender / Antivirus CLI not found"

    abs_target = os.path.abspath(file_path)
    if mode == "defender":
        cmd = [scanner_exe, "-Scan", "-ScanType", "3", "-File", abs_target]
    else:
        cmd = [scanner_exe, abs_target]

    cflags = 0x08000000 if hasattr(subprocess, "CREATE_NO_WINDOW") else 0
    try:
        proc = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            errors="ignore",
            stdin=subprocess.DEVNULL,
            timeout=180,
            creationflags=cflags,
        )
        out = ((proc.stdout or "") + "\n" + (proc.stderr or "")).strip()
        low = out.lower()
        if mode == "defender":
            if proc.returncode == 0 or "found no threats" in low:
                return "clean", "Windows Defender"
            if proc.returncode == 2:
                if "threat" in low and "no threats" not in low:
                    last_line = [ln.strip() for ln in out.splitlines() if ln.strip()]
                    return "threat", (last_line[-1][:80] if last_line else "Threat detected")
                if "failed" in low or "0x" in low or "disabled" in low:
                    last_line = [ln.strip() for ln in out.splitlines() if ln.strip()]
                    return "unavailable", (last_line[-1][:80] if last_line else "Defender service inactive")
                return "threat", "Windows Defender reported threat (code 2)"
            return "error", f"Scanner code {proc.returncode}"
        else:
            if proc.returncode == 0:
                return "clean", os.path.basename(scanner_exe)
            return "threat", f"{os.path.basename(scanner_exe)} (code {proc.returncode})"
    except subprocess.TimeoutExpired:
        return "error", "Antivirus scan timed out"
    except Exception as e:
        return "error", str(e)[:60]


def _find_external_extractors():
    """Returns ordered list of available (kind, exe_path) external archive tools."""
    found = []
    candidates = [
        ("7z", shutil.which("7z")),
        ("7z", r"C:\Program Files\7-Zip\7z.exe"),
        ("7z", r"C:\Program Files (x86)\7-Zip\7z.exe"),
        ("unrar", shutil.which("unrar")),
        ("unrar", r"C:\Program Files\WinRAR\UnRAR.exe"),
        ("unrar", r"C:\Program Files (x86)\WinRAR\UnRAR.exe"),
        ("winrar", shutil.which("winrar")),
        ("winrar", r"C:\Program Files\WinRAR\WinRAR.exe"),
        ("winrar", r"C:\Program Files (x86)\WinRAR\WinRAR.exe"),
        ("bsdtar", r"C:\Windows\System32\tar.exe"),
    ]
    seen = set()
    for kind, path in candidates:
        if path and os.path.isfile(path):
            norm = os.path.normcase(os.path.abspath(path))
            if norm not in seen:
                seen.add(norm)
                found.append((kind, path))
    return found


def _validate_archive_members(dest_root: str, names):
    root_abs = os.path.abspath(dest_root)
    for name in names:
        target_abs = os.path.abspath(os.path.join(root_abs, name))
        if os.path.commonpath([root_abs, target_abs]) != root_abs:
            raise ValueError(f"Unsafe path in archive: {name}")


def extract_archive_file(file_path: str):
    """
    Extracts supported archive into a clean subfolder next to the archive.
    Returns (True, dest_dir) or (False, error_message).
    """
    if not file_path or not os.path.isfile(file_path):
        return False, "Archive file not found"

    abs_file = os.path.abspath(file_path)
    parent = os.path.dirname(abs_file)
    stem = archive_stem_name(os.path.basename(abs_file))
    dest_dir = os.path.join(parent, stem)
    if os.path.exists(dest_dir):
        if not os.path.isdir(dest_dir) or os.listdir(dest_dir):
            counter = 1
            while os.path.exists(os.path.join(parent, f"{stem} ({counter})")):
                counter += 1
            dest_dir = os.path.join(parent, f"{stem} ({counter})")

    os.makedirs(dest_dir, exist_ok=True)
    low = abs_file.lower()
    last_err = ""

    try:
        # 1. Native Python ZIP
        if low.endswith(".zip"):
            try:
                with zipfile.ZipFile(abs_file, "r") as zf:
                    _validate_archive_members(dest_dir, zf.namelist())
                    zf.extractall(dest_dir)
                return True, dest_dir
            except (NotImplementedError, RuntimeError) as z_err:
                last_err = str(z_err)[:60]  # Fall through to 7z/WinRAR if exotic compression

        # 2. Native Python TAR (.tar, .tar.gz, .tgz, .tar.bz2, .tar.xz)
        elif low.endswith((".tar", ".tar.gz", ".tgz", ".tar.bz2", ".tbz2", ".tar.xz", ".txz")):
            with tarfile.open(abs_file, "r:*") as tf:
                _validate_archive_members(dest_dir, [m.name for m in tf.getmembers()])
                try:
                    tf.extractall(dest_dir, filter="data")
                except TypeError:
                    tf.extractall(dest_dir)
            return True, dest_dir

        # 3. External tools (.7z, .rar, or fallback .zip)
        cflags = 0x08000000 if hasattr(subprocess, "CREATE_NO_WINDOW") else 0
        for kind, exe in _find_external_extractors():
            if low.endswith(".7z") and kind in ("unrar",):
                continue
            if kind == "7z":
                cmd = [exe, "x", abs_file, f"-o{dest_dir}", "-y", "-p"]
            elif kind == "unrar":
                cmd = [exe, "x", "-y", "-p-", abs_file, dest_dir + os.sep]
            elif kind == "winrar":
                cmd = [exe, "x", "-ibck", "-y", "-p-", abs_file, dest_dir + os.sep]
            else:  # bsdtar
                cmd = [exe, "-xf", abs_file, "-C", dest_dir]

            proc = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                errors="ignore",
                stdin=subprocess.DEVNULL,
                timeout=300,
                creationflags=cflags,
            )
            if proc.returncode == 0 and os.listdir(dest_dir):
                return True, dest_dir
            err_txt = ((proc.stderr or "") + " " + (proc.stdout or "")).strip()
            if err_txt:
                last_err = err_txt.splitlines()[-1][:65]

        if os.path.isdir(dest_dir) and not os.listdir(dest_dir):
            try:
                os.rmdir(dest_dir)
            except Exception:
                pass
        return False, last_err or "7-Zip / WinRAR required or password-protected"
    except Exception as e:
        if os.path.isdir(dest_dir) and not os.listdir(dest_dir):
            try:
                os.rmdir(dest_dir)
            except Exception:
                pass
        return False, str(e)[:65]


# ----------------------------------------------------------------------
# 1. High-Performance Multi-Part Download Engine (Ezoo/IDM Direct-Offset + Work-Stealing)
# ----------------------------------------------------------------------
class ChunkSegment:
    """Represents a discrete byte-range segment [start_byte, end_byte] with atomic bounds."""
    def __init__(self, chunk_id, start_byte, end_byte, temp_dir):
        self.chunk_id = int(chunk_id)
        self.start_byte = int(start_byte)
        self.end_byte = int(end_byte)
        self.downloaded_bytes = 0
        self.is_completed = False
        self.is_active = False
        self.temp_file = os.path.join(temp_dir, f"part_{chunk_id}.tmp")
        self.lock = threading.Lock()

    @property
    def remaining_bytes(self):
        with self.lock:
            if self.end_byte < self.start_byte:
                return 0
            curr = self.start_byte + self.downloaded_bytes
            return max(0, (self.end_byte - curr) + 1)

    @property
    def percent(self):
        with self.lock:
            if self.end_byte < self.start_byte:
                return 0.0
            total = (self.end_byte - self.start_byte) + 1
            if total <= 0:
                return 0.0
            return min(1.0, max(0.0, self.downloaded_bytes / total))


class DownloadTask:
    """
    High-efficiency multi-connection download task:
    - 1-byte Range probe (bytes=0-0) + disk space check + Content-Disposition filename resolution
    - Instant N-way initial range partitioning (up to 32 parallel connections at t=0)
    - True dynamic in-flight work-stealing (halves largest slow segment whenever a worker finishes early)
    - Zero-copy direct-offset file I/O (.negm.part + atomic O(1) os.replace on completion)
    - Crash-safe .negm.meta sidecar + full backward compatibility with legacy .negm_tmp_* folders
    - Smooth shared token-bucket speed limiter across all worker threads
    """
    MIN_SPLIT_BYTES = 256 * 1024       # 256 KB minimum segment size (steals any tail >= 512 KB)
    MAX_TOTAL_SPLITS = 128             # Dynamic work-steal cap across task lifetime

    BROWSER_HEADERS = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.9,ar;q=0.8",
        "Accept-Encoding": "identity",
        "Connection": "keep-alive",
    }

    def __init__(self, task_id, url, save_path, max_chunks=8, speed_limit_kb=0,
                 auto_sort=True, buffer_kb=256, proxy_url="", extra_headers=None, queue_id="main"):
        self.task_id = task_id
        self.url = url
        self.save_path = save_path
        self.max_chunks = max(1, min(32, int(max_chunks or 8)))
        self.speed_limit_kb = max(0, int(speed_limit_kb or 0))
        self.auto_sort = bool(auto_sort)
        self.buffer_bytes = max(32, int(buffer_kb or 256)) * 1024
        self.queue_id = str(queue_id or "main")

        self.filename = os.path.basename(save_path)
        self.base_folder = os.path.dirname(save_path)
        self.temp_dir = os.path.join(self.base_folder, f".negm_tmp_{self.task_id}")
        self.storage_mode = "direct"   # "direct" | "direct_stream" | "legacy_parts"

        self.total_size = 0
        self.current_speed_bps = 0
        self.status = "st_queued"
        self.status_detail = ""
        self.can_resume = False
        self.is_paused = False
        self.is_cancelled = False
        self.is_completed = False
        self.is_failed = False
        self.started = False
        self.added_time = time.time()

        self.chunks = []
        self.next_chunk_id = 1
        self.threads = []
        self.lock = threading.Lock()
        self._scheduler_running = False
        self.speed_history = collections.deque(maxlen=40)

        # Shared token-bucket rate limiter state
        self._tb_lock = threading.Lock()
        self._tb_tokens = 0.0
        self._tb_last = time.perf_counter()

        self.proxy_url = ""
        self.net_bytes_downloaded = 0
        self.extra_headers = {str(k): str(v) for k, v in (extra_headers or {}).items() if k and v}

        # High-performance connection pool session supporting up to 32 concurrent segments
        self.session = requests.Session()
        adapter = HTTPAdapter(pool_connections=32, pool_maxsize=64, max_retries=2)
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)
        if proxy_url:
            self.set_proxy(proxy_url)
        else:
            try:
                act_p = get_default_proxy_manager().get_active_proxy_url()
                if act_p:
                    self.set_proxy(act_p)
            except Exception:
                pass

    @property
    def part_file(self):
        return self.save_path + ".negm.part"

    @property
    def meta_file(self):
        return self.save_path + ".negm.meta"

    @property
    def state(self):
        if self.is_completed:
            return "completed"
        if self.is_failed:
            return "failed"
        if self.is_paused:
            return "paused"
        if not self.started:
            return "queued"
        return "active"

    def fail(self, message):
        self.is_failed = True
        self.current_speed_bps = 0
        self.status = "st_failed"
        self.status_detail = str(message or "")
        self._save_meta_sidecar()

    def _build_headers(self):
        h = dict(self.BROWSER_HEADERS)
        try:
            vault = get_default_credential_vault()
            if vault:
                auth_h = vault.get_headers_for_url(self.url)
                if auth_h:
                    h.update(auth_h)
        except Exception:
            pass
        if self.extra_headers:
            h.update(self.extra_headers)
        return h

    def set_speed_limit(self, limit_kb):
        with self.lock:
            self.speed_limit_kb = max(0, int(limit_kb or 0))
        with self._tb_lock:
            self._tb_tokens = 0.0
            self._tb_last = time.perf_counter()

    def _throttle(self, n_bytes: int):
        """Smooth shared token-bucket rate limiter across all concurrent chunk workers."""
        limit_kb = self.speed_limit_kb
        if limit_kb <= 0 or n_bytes <= 0:
            return
        rate_bps = float(limit_kb) * 1024.0
        wait_time = 0.0
        with self._tb_lock:
            now = time.perf_counter()
            elapsed = max(0.0, now - self._tb_last)
            self._tb_last = now
            # Cap burst accumulation to 0.25s of bandwidth for smooth pacing
            self._tb_tokens = min(rate_bps * 0.25, self._tb_tokens + elapsed * rate_bps)
            self._tb_tokens -= float(n_bytes)
            if self._tb_tokens < 0.0:
                wait_time = (-self._tb_tokens) / rate_bps
        if wait_time > 0.002:
            # Sleep in small interruptible slices so pause/cancel responds instantly
            end_t = time.perf_counter() + min(wait_time, 1.5)
            while time.perf_counter() < end_t:
                if self.is_paused or self.is_cancelled or self.is_failed:
                    break
                time.sleep(min(0.04, max(0.002, end_t - time.perf_counter())))

    def set_proxy(self, proxy_url: str):
        p = (proxy_url or "").strip()
        if p and "://" not in p:
            p = "http://" + p
        with self.lock:
            self.proxy_url = p
            if p:
                self.session.proxies = {"http": p, "https": p}
            else:
                self.session.proxies.clear()

    def pop_net_bytes(self) -> int:
        if self.net_bytes_downloaded <= 0:
            return 0
        with self.lock:
            val = self.net_bytes_downloaded
            self.net_bytes_downloaded = 0
            return val

    def get_progress(self):
        with self.lock:
            downloaded = sum(c.downloaded_bytes for c in self.chunks)
            if self.is_completed and self.total_size > 0:
                downloaded = self.total_size
            elif self.total_size > 0:
                downloaded = min(self.total_size, downloaded)
            pct = (downloaded / self.total_size) if self.total_size > 0 else 0.0
            active_workers = sum(1 for c in self.chunks if not c.is_completed and c.is_active)
            return {
                "downloaded": downloaded,
                "total": self.total_size,
                "percent": min(1.0, max(0.0, pct)),
                "speed_bps": self.current_speed_bps,
                "active_chunks": active_workers,
                "total_chunks": len(self.chunks),
                "can_resume": self.can_resume,
                "status": self.status,
                "status_detail": self.status_detail,
            }

    def _save_meta_sidecar(self):
        """Persists lightweight segment offsets alongside .negm.part for crash-safe recovery."""
        if self.storage_mode != "direct" or self.is_completed or self.is_cancelled or not self.chunks:
            return
        try:
            with self.lock:
                payload = {
                    "total_size": self.total_size,
                    "next_chunk_id": self.next_chunk_id,
                    "chunks": [
                        [c.chunk_id, c.start_byte, c.end_byte, c.downloaded_bytes, c.is_completed]
                        for c in self.chunks
                    ],
                }
            tmp_m = self.meta_file + ".tmp"
            with open(tmp_m, "w", encoding="utf-8") as mf:
                json.dump(payload, mf)
            os.replace(tmp_m, self.meta_file)
        except Exception:
            pass

    def _cleanup_sidecars(self):
        for p in (self.meta_file, self.meta_file + ".tmp"):
            try:
                if os.path.exists(p):
                    os.remove(p)
            except Exception:
                pass
        if os.path.isdir(self.temp_dir):
            shutil.rmtree(self.temp_dir, ignore_errors=True)

    def refresh_url(self, new_url, new_headers=None, verify_match=True):
        """
        Updates the download address (URL) for an expired link.
        Preserves all existing chunks and downloaded bytes.
        Validates Range support and file size match, then atomically saves meta sidecar.
        """
        new_url = str(new_url).strip()
        if not new_url or not URL_REGEX.fullmatch(new_url):
            return False, "Invalid URL format"

        old_size = self.total_size
        headers = self._build_headers()
        if new_headers:
            headers.update({str(k): str(v) for k, v in new_headers.items() if k and v})
        headers["Range"] = "bytes=0-0"
        headers["Cache-Control"] = "no-cache"

        if verify_match:
            try:
                res = self.session.get(new_url, headers=headers, stream=True, allow_redirects=True, timeout=(5.0, 10.0))
                if res.status_code >= 400:
                    res.close()
                    return False, f"HTTP Error {res.status_code}"

                is_range_supported = (res.status_code == 206) or ("content-range" in res.headers) or (res.headers.get("accept-ranges", "").lower() == "bytes")

                total = 0
                cr = res.headers.get("content-range", "")
                if cr and "/" in cr:
                    tot_str = cr.split("/")[1].strip()
                    if tot_str.isdigit():
                        total = int(tot_str)
                if total <= 0:
                    cl = res.headers.get("content-length")
                    if cl and cl.isdigit():
                        total = int(cl)
                res.close()

                if old_size > 0 and total > 0 and old_size != total:
                    return False, f"Size mismatch: expected {fmt_size(old_size)}, got {fmt_size(total)}"

                if old_size > 0 and not is_range_supported:
                    return False, "Server does not support Range requests / resume"

            except Exception as e:
                return False, f"Connection error: {str(e)[:50]}"

        with self.lock:
            self.url = new_url
            if new_headers:
                self.extra_headers.update({str(k): str(v) for k, v in new_headers.items() if k and v})
            if self.is_failed:
                self.is_failed = False
                self.status_detail = ""
            self.status = "st_paused"
            try:
                self._save_meta()
            except Exception:
                pass

        return True, "OK"

    # ---------------- 1-Byte Fast Server Probe ----------------
    def probe_server(self):
        """Single 1-byte range probe (bytes=0-0) to extract size, name, range support, and verify disk space."""
        headers = self._build_headers()
        headers["Range"] = "bytes=0-0"
        headers["Cache-Control"] = "no-cache"

        try:
            res = self.session.get(self.url, headers=headers, stream=True, allow_redirects=True, timeout=(5.0, 10.0))
        except Exception as e:
            self.fail(f"Connection error: {str(e)[:55]}")
            return False

        try:
            # Some servers reject Range headers with 416/400 on probe; retry once without Range
            if res.status_code in (400, 416, 501):
                res.close()
                h2 = self._build_headers()
                res = self.session.get(self.url, headers=h2, stream=True, allow_redirects=True, timeout=(5.0, 10.0))

            if res.status_code >= 400:
                self.fail(f"HTTP Error {res.status_code}")
                res.close()
                return False

            is_range_supported = (res.status_code == 206) or ("content-range" in res.headers)
            if not is_range_supported and res.headers.get("accept-ranges", "").lower() == "bytes":
                is_range_supported = True

            total = 0
            cr = res.headers.get("content-range", "")
            if cr and "/" in cr:
                tot_str = cr.split("/")[1].strip()
                if tot_str.isdigit():
                    total = int(tot_str)

            if total <= 0:
                cl = res.headers.get("content-length")
                if cl and cl.isdigit():
                    total = int(cl)

            self.total_size = total
            self.can_resume = bool(is_range_supported and total > 0)

            # Extract clean filename from Content-Disposition or final redirected URL
            detected_name = None
            cd = res.headers.get("content-disposition", "")
            if "filename*=" in cd:
                try:
                    p = cd.split("filename*=")[1].split(";")[0].strip('"\' ')
                    if "''" in p:
                        detected_name = urllib.parse.unquote(p.split("''")[1])
                except Exception:
                    pass
            elif "filename=" in cd:
                detected_name = cd.split("filename=")[1].split(";")[0].strip('"\' ')

            if not detected_name:
                final_path = urllib.parse.unquote(urllib.parse.urlparse(res.url).path)
                candidate = os.path.basename(final_path.rstrip("/"))
                if candidate and "." in candidate:
                    detected_name = candidate

            if detected_name:
                clean = sanitize_filename(detected_name)
                if clean:
                    self.filename = clean

            res.close()

            # Pre-flight disk free space verification
            if self.total_size > 0:
                try:
                    os.makedirs(self.base_folder, exist_ok=True)
                    free_b = shutil.disk_usage(self.base_folder).free
                    if free_b < self.total_size + (2 * 1024 * 1024):
                        self.fail(f"Insufficient disk space ({fmt_size(free_b)} free, need {fmt_size(self.total_size)})")
                        return False
                except Exception:
                    pass

            return True
        except Exception as e:
            self.fail(f"Probe error: {str(e)[:55]}")
            return False

    def finalize_save_destination(self):
        """Routes file into categorized subfolder if auto-sort is enabled."""
        dest_folder = self.base_folder
        if self.auto_sort:
            cat_key = detect_category(self.filename)
            cat_folder_name = CATEGORY_FOLDERS.get(cat_key, "Other")
            if os.path.basename(os.path.normpath(dest_folder)).lower() != cat_folder_name.lower():
                dest_folder = os.path.join(self.base_folder, cat_folder_name)

        try:
            os.makedirs(dest_folder, exist_ok=True)
        except Exception:
            dest_folder = self.base_folder

        self.save_path = unique_filepath(os.path.join(dest_folder, self.filename))
        self.filename = os.path.basename(self.save_path)

    # ---------------- Chunk Worker & Dynamic Work-Stealing ----------------
    def chunk_worker(self, chunk: ChunkSegment):
        """Worker thread to download a designated byte-range segment directly to its file offset."""
        with chunk.lock:
            if chunk.is_active or chunk.is_completed:
                return
            chunk.is_active = True

        try:
            attempts = 0
            while not (self.is_paused or self.is_cancelled or self.is_failed or chunk.is_completed):
                if self._download_chunk_stream(chunk):
                    break
                if self.is_paused or self.is_cancelled or self.is_failed:
                    break
                attempts += 1
                if attempts >= 8:
                    break
                time.sleep(min(1.0 * (1.5 ** min(attempts, 4)), 5.0))
        finally:
            with chunk.lock:
                chunk.is_active = False

    def _open_direct_handle(self):
        p = self.part_file
        os.makedirs(os.path.dirname(os.path.abspath(p)), exist_ok=True)
        if not os.path.exists(p):
            with open(p, "wb") as init_f:
                if self.total_size > 0 and self.storage_mode == "direct":
                    init_f.truncate(self.total_size)
        mode = "r+b" if self.storage_mode == "direct" else ("ab" if os.path.exists(p) else "wb")
        return open(p, mode)

    def _download_chunk_stream(self, chunk: ChunkSegment):
        has_bound = (self.total_size > 0 and chunk.end_byte >= chunk.start_byte)
        if not self.can_resume and chunk.downloaded_bytes > 0:
            with chunk.lock:
                chunk.downloaded_bytes = 0
            if self.storage_mode == "legacy_parts":
                try:
                    os.remove(chunk.temp_file)
                except Exception:
                    pass

        with chunk.lock:
            curr_start = chunk.start_byte + chunk.downloaded_bytes
            if has_bound and curr_start > chunk.end_byte:
                chunk.is_completed = True
                return True

        headers = self._build_headers()
        if self.can_resume:
            if has_bound:
                headers["Range"] = f"bytes={curr_start}-{chunk.end_byte}"
            elif curr_start > 0:
                headers["Range"] = f"bytes={curr_start}-"

        try:
            with self.session.get(self.url, headers=headers, stream=True, timeout=(5.0, 20.0)) as resp:
                if resp.status_code not in (200, 206):
                    if resp.status_code == 416 and has_bound and curr_start > chunk.end_byte:
                        with chunk.lock:
                            chunk.is_completed = True
                        return True
                    if resp.status_code in (401, 403, 404, 410):
                        self.fail(f"HTTP Error {resp.status_code}")
                        return True
                    return False

                # Guard against broken servers ignoring Range on non-zero offset
                if self.can_resume and curr_start > 0 and resp.status_code == 200:
                    if chunk.start_byte > 0:
                        with self.lock:
                            self.can_resume = False
                        with chunk.lock:
                            chunk.end_byte = chunk.start_byte - 1
                            chunk.downloaded_bytes = 0
                            chunk.is_completed = True
                        return True
                    else:
                        with self.lock:
                            self.can_resume = False
                        with chunk.lock:
                            chunk.downloaded_bytes = 0
                            chunk.end_byte = max(0, self.total_size - 1)
                        curr_start = 0

                use_direct = self.storage_mode in ("direct", "direct_stream")
                f_ctx = self._open_direct_handle() if use_direct else open(chunk.temp_file, "ab")
                with f_ctx as f:
                    if use_direct and self.storage_mode == "direct":
                        f.seek(curr_start)
                    read_sz = min(self.buffer_bytes, 32768) if self.speed_limit_kb > 0 else self.buffer_bytes
                    for block in resp.iter_content(chunk_size=read_sz):
                        if self.is_paused or self.is_cancelled or self.is_failed:
                            return True
                        if not block:
                            continue

                        reached = False
                        n_written = 0
                        with chunk.lock:
                            curr_pos = chunk.start_byte + chunk.downloaded_bytes
                            data = block
                            if self.total_size > 0 and chunk.end_byte >= chunk.start_byte:
                                allowed = (chunk.end_byte - curr_pos) + 1
                                if allowed <= 0:
                                    chunk.is_completed = True
                                    break
                                if len(data) > allowed:
                                    data = data[:allowed]

                            if use_direct and self.storage_mode == "direct":
                                f.seek(curr_pos)
                            f.write(data)
                            n_written = len(data)
                            chunk.downloaded_bytes += n_written
                            if self.total_size > 0 and chunk.end_byte >= chunk.start_byte:
                                if (chunk.start_byte + chunk.downloaded_bytes) > chunk.end_byte:
                                    chunk.is_completed = True
                                    reached = True

                        if n_written > 0:
                            with self.lock:
                                self.net_bytes_downloaded += n_written
                            self._throttle(n_written)

                        if reached:
                            break

            with chunk.lock:
                if self.total_size <= 0 or chunk.end_byte < chunk.start_byte or (chunk.start_byte + chunk.downloaded_bytes > chunk.end_byte):
                    chunk.is_completed = True
                    return True
            return False
        except Exception:
            return False

    def find_largest_active_chunk(self):
        """Finds the active/incomplete segment with the largest remaining byte span (>= 1 MB) for work-stealing."""
        min_rem = self.MIN_SPLIT_BYTES * 2
        with self.lock:
            eligible = [c for c in self.chunks if not c.is_completed and c.remaining_bytes >= min_rem]
            if not eligible:
                return None
            return max(eligible, key=lambda c: c.remaining_bytes)

    def _spawn_worker(self, chunk: ChunkSegment):
        t_worker = threading.Thread(target=self.chunk_worker, args=(chunk,), daemon=True)
        with self.lock:
            self.threads = [th for th in self.threads if th.is_alive()]
            self.threads.append(t_worker)
        t_worker.start()

    def _ensure_scheduler(self):
        with self.lock:
            if self._scheduler_running:
                return
            self._scheduler_running = True
        threading.Thread(target=self.scheduler_loop, daemon=True).start()

    def scheduler_loop(self):
        """Dynamic multi-segment work-stealing scheduler, EMA speed meter, and O(1) completion trigger."""
        try:
            last_dwnl = sum(c.downloaded_bytes for c in self.chunks)
            last_time = time.perf_counter()
            last_meta = last_time

            while not (self.is_cancelled or self.is_completed or self.is_failed):
                if self.is_paused:
                    self.status = "st_paused"
                    self.current_speed_bps = 0
                    time.sleep(0.25)
                    last_dwnl = sum(c.downloaded_bytes for c in self.chunks)
                    last_time = time.perf_counter()
                    continue

                now = time.perf_counter()
                elapsed = now - last_time
                if elapsed >= 0.45:
                    curr_dwnl = sum(c.downloaded_bytes for c in self.chunks)
                    inst_bps = max(0, int((curr_dwnl - last_dwnl) / elapsed))
                    if self.current_speed_bps > 0 and inst_bps > 0:
                        self.current_speed_bps = int(0.65 * inst_bps + 0.35 * self.current_speed_bps)
                    else:
                        self.current_speed_bps = inst_bps
                    last_dwnl = curr_dwnl
                    last_time = now
                    self.speed_history.append(self.current_speed_bps)
                    if self.status != "st_assembling":
                        self.status = "st_downloading"

                if now - last_meta >= 2.0:
                    self._save_meta_sidecar()
                    last_meta = now

                # 1. Respawn any stalled/inactive incomplete segments up to max_chunks
                with self.lock:
                    active_workers = sum(1 for c in self.chunks if not c.is_completed and c.is_active)
                    idle_incomplete = [c for c in self.chunks if not c.is_completed and not c.is_active]

                for c_idle in idle_incomplete:
                    if active_workers >= self.max_chunks or self.is_paused:
                        break
                    self._spawn_worker(c_idle)
                    active_workers += 1

                # 2. Dynamic in-flight work-stealing (Ezoo segments.rs work_steal pattern):
                # Whenever any worker finishes early (active_workers < max_chunks), split the largest
                # remaining segment in half so all max_chunks connections stay saturated to the end!
                while (
                    self.can_resume
                    and not self.is_paused
                    and active_workers < self.max_chunks
                    and len(self.chunks) < self.MAX_TOTAL_SPLITS
                ):
                    largest = self.find_largest_active_chunk()
                    if not largest:
                        break
                    new_chunk = None
                    with largest.lock:
                        curr_pos = largest.start_byte + largest.downloaded_bytes
                        rem = (largest.end_byte - curr_pos) + 1
                        if rem >= (self.MIN_SPLIT_BYTES * 2):
                            half = rem // 2
                            new_start = largest.end_byte - half + 1
                            old_end = largest.end_byte
                            largest.end_byte = new_start - 1
                            with self.lock:
                                new_chunk = ChunkSegment(self.next_chunk_id, new_start, old_end, self.temp_dir)
                                self.next_chunk_id += 1
                                self.chunks.append(new_chunk)
                    if new_chunk is None:
                        break
                    self._spawn_worker(new_chunk)
                    active_workers += 1

                # 3. Check if all segments are complete
                with self.lock:
                    all_done = bool(self.chunks) and all(c.is_completed for c in self.chunks)
                if all_done:
                    break

                time.sleep(0.15)

            if not (self.is_cancelled or self.is_paused or self.is_failed):
                self.assemble_file()
        finally:
            with self.lock:
                self._scheduler_running = False

    def assemble_file(self):
        """Finalizes the target file: O(1) atomic rename for direct-offset I/O, or stream merge for legacy parts."""
        self.status = "st_assembling"
        self.current_speed_bps = 0

        # Ensure all worker handles are closed before touching/renaming on Windows NTFS
        deadline = time.perf_counter() + 2.0
        while time.perf_counter() < deadline:
            if all(not c.is_active for c in self.chunks):
                break
            time.sleep(0.03)

        try:
            if self.storage_mode in ("direct", "direct_stream"):
                if not os.path.exists(self.part_file):
                    self.fail("Temporary part file missing on disk")
                    return
                actual_sz = os.path.getsize(self.part_file)
                if self.total_size > 0 and actual_sz != self.total_size:
                    # Single-stream compressed responses occasionally differ from header estimate only when non-range
                    if self.can_resume:
                        self.fail(f"Size verification failed ({actual_sz}/{self.total_size})")
                        return
                os.makedirs(os.path.dirname(os.path.abspath(self.save_path)), exist_ok=True)
                replaced = False
                for attempt in range(8):
                    try:
                        os.replace(self.part_file, self.save_path)
                        replaced = True
                        break
                    except (PermissionError, OSError):
                        time.sleep(0.12 * (attempt + 1))
                if not replaced:
                    try:
                        shutil.copyfile(self.part_file, self.save_path)
                        try:
                            os.remove(self.part_file)
                        except Exception:
                            pass
                        replaced = True
                    except Exception as e:
                        self.fail(f"Assembly error: {str(e)[:55]}")
                        return

                if self.total_size <= 0:
                    self.total_size = actual_sz
                self._cleanup_sidecars()
                self.status = "st_completed"
                self.is_completed = True
                return

            # Legacy fallback: concatenate part_*.tmp files
            sorted_chunks = sorted(self.chunks, key=lambda c: c.start_byte)
            written = 0
            with open(self.save_path, "wb") as out_f:
                for c in sorted_chunks:
                    if os.path.exists(c.temp_file):
                        with open(c.temp_file, "rb") as in_f:
                            while True:
                                block = in_f.read(1024 * 1024)
                                if not block:
                                    break
                                out_f.write(block)
                                written += len(block)

            if self.total_size > 0 and written != self.total_size:
                self.fail(f"Size verification failed ({written}/{self.total_size})")
                return

            for c in sorted_chunks:
                try:
                    os.remove(c.temp_file)
                except Exception:
                    pass
            self._cleanup_sidecars()

            if self.total_size <= 0:
                self.total_size = written

            self.status = "st_completed"
            self.is_completed = True
        except Exception as e:
            self.fail(f"Assembly error: {str(e)[:55]}")

    def start(self):
        """Probes server, pre-allocates direct-offset .negm.part, and launches parallel range workers."""
        self.started = True
        self.is_paused = False
        self.is_failed = False
        self.is_cancelled = False
        self.status_detail = ""
        self.status = "st_probing"

        def _run():
            if not self.probe_server():
                return
            self.finalize_save_destination()

            with self.lock:
                self.chunks.clear()
                self.next_chunk_id = 1
                if self.can_resume and self.total_size > 0:
                    self.storage_mode = "direct"
                    init_n = min(self.max_chunks, max(1, self.total_size // self.MIN_SPLIT_BYTES))
                    base = self.total_size // init_n
                    for idx in range(init_n):
                        s_b = idx * base
                        e_b = (self.total_size - 1) if idx == (init_n - 1) else ((idx + 1) * base - 1)
                        ch = ChunkSegment(self.next_chunk_id, s_b, e_b, self.temp_dir)
                        self.next_chunk_id += 1
                        self.chunks.append(ch)
                else:
                    self.storage_mode = "direct_stream"
                    ch = ChunkSegment(0, 0, max(0, self.total_size - 1), self.temp_dir)
                    self.chunks.append(ch)
                initial_chunks = list(self.chunks)

            # Pre-allocate target .negm.part file once before spawning parallel workers
            try:
                os.makedirs(os.path.dirname(os.path.abspath(self.part_file)), exist_ok=True)
                with open(self.part_file, "wb") as pf:
                    if self.storage_mode == "direct" and self.total_size > 0:
                        pf.truncate(self.total_size)
            except Exception as e:
                self.fail(f"Disk error: {str(e)[:50]}")
                return

            self._save_meta_sidecar()
            for ch in initial_chunks:
                self._spawn_worker(ch)
            self._ensure_scheduler()

        threading.Thread(target=_run, daemon=True).start()

    def pause(self):
        self.is_paused = True
        self.current_speed_bps = 0
        self.status = "st_paused"
        self._save_meta_sidecar()

    def resume(self):
        if self.storage_mode == "legacy_parts":
            os.makedirs(self.temp_dir, exist_ok=True)
        self.is_paused = False
        self.is_failed = False
        self.status_detail = ""

        if not self.chunks:
            self.started = False
            self.start()
            return

        self.started = True
        self.status = "st_downloading"
        for c in list(self.chunks):
            if not c.is_completed and not c.is_active:
                self._spawn_worker(c)
        self._ensure_scheduler()

    def retry(self):
        self.is_failed = False
        self.is_paused = False
        self.status_detail = ""
        self.current_speed_bps = 0
        has_valid_store = (
            ((self.storage_mode in ("direct", "direct_stream")) and os.path.exists(self.part_file))
            or (self.storage_mode == "legacy_parts" and os.path.isdir(self.temp_dir))
        )
        if self.chunks and self.can_resume and self.total_size > 0 and has_valid_store:
            self.resume()
        else:
            self._cleanup_all_temp()
            self.chunks.clear()
            self.next_chunk_id = 1
            self.started = False
            self.start()

    def _cleanup_all_temp(self):
        self._cleanup_sidecars()
        try:
            if os.path.exists(self.part_file):
                os.remove(self.part_file)
        except Exception:
            pass

    def cancel(self):
        self.is_cancelled = True
        self.status = "st_paused"
        self.current_speed_bps = 0
        threading.Timer(1.2, self._cleanup_all_temp).start()

    def to_dict(self):
        with self.lock:
            chunk_data = [
                [c.chunk_id, c.start_byte, c.end_byte, c.downloaded_bytes, c.is_completed]
                for c in self.chunks
            ]
        return {
            "task_id": self.task_id,
            "url": self.url,
            "save_path": self.save_path,
            "base_folder": self.base_folder,
            "filename": self.filename,
            "max_chunks": self.max_chunks,
            "speed_limit_kb": self.speed_limit_kb,
            "auto_sort": self.auto_sort,
            "total_size": self.total_size,
            "can_resume": self.can_resume,
            "storage_mode": self.storage_mode,
            "chunks": chunk_data,
            "next_chunk_id": self.next_chunk_id,
            "state": self.state,
            "status_detail": self.status_detail,
            "added_time": self.added_time,
            "extra_headers": self.extra_headers,
            "queue_id": getattr(self, "queue_id", "main"),
        }

    def reset_for_redownload(self):
        self.is_completed = False
        self.is_failed = False
        self.is_paused = False
        self.is_cancelled = False
        self.status_detail = ""
        self.chunks.clear()
        self.next_chunk_id = 1
        self._notified = False
        self.started = False
        self._cleanup_all_temp()

    @classmethod
    def from_dict(cls, d):
        if d.get("kind") == "media":
            return MediaDownloadTask.from_dict(d)
        task = cls(
            task_id=d["task_id"],
            url=d["url"],
            save_path=d["save_path"],
            max_chunks=d.get("max_chunks", 8),
            speed_limit_kb=d.get("speed_limit_kb", 0),
            auto_sort=d.get("auto_sort", True),
            extra_headers=d.get("extra_headers") or {},
        )
        task.filename = d.get("filename", task.filename)
        task.base_folder = d.get("base_folder", task.base_folder)
        task.total_size = int(d.get("total_size", 0) or 0)
        task.can_resume = bool(d.get("can_resume", False))
        task.queue_id = str(d.get("queue_id", "main") or "main")
        task.next_chunk_id = int(d.get("next_chunk_id", 1) or 1)
        task.added_time = d.get("added_time", time.time())
        task.queue_id = str(d.get("queue_id", "main") or "main")
        task.status_detail = d.get("status_detail", "")

        saved_mode = d.get("storage_mode")
        if saved_mode in ("direct", "direct_stream", "legacy_parts"):
            task.storage_mode = saved_mode
        elif os.path.isdir(task.temp_dir):
            task.storage_mode = "legacy_parts"
        else:
            task.storage_mode = "direct"

        state = d.get("state", "queued")
        if state == "completed":
            task.is_completed = True
            task.started = True
            task.status = "st_completed"
        elif state == "failed":
            task.is_failed = True
            task.started = True
            task.status = "st_failed"
            task._restore_chunks(d.get("chunks", []))
        else:
            task._restore_chunks(d.get("chunks", []))
            if task.chunks:
                task.is_paused = True
                task.status = "st_paused"
            else:
                task.status = "st_queued"

        return task

    def _restore_chunks(self, chunks_list):
        # Prefer fresher crash-recovery sidecar if present
        if self.storage_mode == "direct" and os.path.isfile(self.meta_file):
            try:
                with open(self.meta_file, "r", encoding="utf-8") as mf:
                    meta = json.load(mf)
                if meta.get("chunks"):
                    chunks_list = meta["chunks"]
                    self.next_chunk_id = max(self.next_chunk_id, int(meta.get("next_chunk_id", 1) or 1))
            except Exception:
                pass

        if self.storage_mode in ("direct", "direct_stream"):
            if not os.path.isfile(self.part_file):
                return
            part_sz = os.path.getsize(self.part_file)
            for cid, s_byte, e_byte, dwnl, done in chunks_list:
                c = ChunkSegment(cid, s_byte, e_byte, self.temp_dir)
                span = max(0, (e_byte - s_byte) + 1) if e_byte >= s_byte else max(0, part_sz - s_byte)
                max_avail = max(0, part_sz - s_byte)
                c.downloaded_bytes = max(0, min(int(dwnl or 0), span, max_avail))
                c.is_completed = bool(done) and (span > 0 and c.downloaded_bytes >= span)
                self.chunks.append(c)
            return

        # Legacy .negm_tmp_* part files
        for cid, s_byte, e_byte, dwnl, done in chunks_list:
            c = ChunkSegment(cid, s_byte, e_byte, self.temp_dir)
            try:
                real_sz = os.path.getsize(c.temp_file) if os.path.exists(c.temp_file) else 0
            except Exception:
                real_sz = 0
            c.downloaded_bytes = min(real_sz, max(0, e_byte - s_byte + 1)) if e_byte >= s_byte else real_sz
            c.is_completed = bool(done) and (c.downloaded_bytes >= (e_byte - s_byte + 1 if e_byte >= s_byte else 0))
            self.chunks.append(c)


# ----------------------------------------------------------------------
# 2. Phase 4: Smart Video/Media Engine (yt-dlp + FFmpeg + JS Runtime) & Spider
# ----------------------------------------------------------------------
YTDLP_RELEASE_URL = "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe"
FFMPEG_STATIC_GZ_URL = "https://github.com/eugeneware/ffmpeg-static/releases/latest/download/ffmpeg-win32-x64.gz"
_FFMPEG_INSTALL_LOCK = threading.Lock()

MEDIA_PLATFORM_HOSTS = (
    "youtube.com", "youtu.be", "music.youtube.com",
    "tiktok.com", "instagram.com", "facebook.com", "fb.watch",
    "twitter.com", "x.com", "vimeo.com", "dailymotion.com",
    "soundcloud.com", "twitch.tv", "bilibili.com", "rumble.com", "reddit.com",
)

IMAGE_EXTENSIONS = (".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".bmp", ".ico", ".avif", ".tiff")


def is_media_platform_url(url: str) -> bool:
    try:
        clean = (url or "").split("#")[0].split("?")[0].lower()
        if clean.endswith((".m3u8", ".mpd", ".m3u", ".ts")):
            return True
        host = (urllib.parse.urlparse(url.strip()).netloc or "").lower()
        if host.startswith("www."):
            host = host[4:]
        if host.startswith("m."):
            host = host[2:]
        return any(host == h or host.endswith("." + h) for h in MEDIA_PLATFORM_HOSTS)
    except Exception:
        return False


def find_ytdlp_executable():
    """Returns path to standalone yt-dlp executable if available, else None."""
    local_bin = os.path.join(BIN_DIR, "yt-dlp.exe" if sys.platform == "win32" else "yt-dlp")
    if os.path.isfile(local_bin):
        return local_bin
    bundled = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets", "bin", "yt-dlp.exe")
    if os.path.isfile(bundled):
        return bundled
    sys_bin = shutil.which("yt-dlp")
    if sys_bin and os.path.isfile(sys_bin):
        return sys_bin
    return None


def find_ffmpeg_executable():
    """Returns path to ffmpeg executable (checking BIN_DIR, bundled assets, PATH, and WinGet)."""
    exe_name = "ffmpeg.exe" if sys.platform == "win32" else "ffmpeg"
    local_ff = os.path.join(BIN_DIR, exe_name)
    if os.path.isfile(local_ff):
        return local_ff
    bundled_ff = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets", "bin", exe_name)
    if os.path.isfile(bundled_ff):
        return bundled_ff
    sys_ff = shutil.which("ffmpeg")
    if sys_ff and os.path.isfile(sys_ff):
        return sys_ff
    if sys.platform == "win32":
        try:
            wg_root = os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\WinGet\Packages")
            if os.path.isdir(wg_root):
                matches = glob.glob(os.path.join(wg_root, "**", "ffmpeg.exe"), recursive=True)
                if matches:
                    return matches[0]
        except Exception:
            pass
    return None


def has_ffmpeg() -> bool:
    return bool(find_ffmpeg_executable())


def find_js_runtime_args() -> list:
    """
    Detects an installed JavaScript runtime (deno, node, or bun) required by yt-dlp 2026+ EJS
    so YouTube unlocks all progressive and high-bitrate DASH streams without warnings.
    """
    candidates = [
        ("deno", shutil.which("deno")),
        ("deno", os.path.expandvars(r"%USERPROFILE%\.deno\bin\deno.exe")),
        ("node", shutil.which("node")),
        ("node", r"C:\Program Files\nodejs\node.exe"),
        ("node", os.path.expandvars(r"%LOCALAPPDATA%\Programs\nodejs\node.exe")),
        ("bun", shutil.which("bun")),
        ("bun", os.path.expandvars(r"%USERPROFILE%\.bun\bin\bun.exe")),
    ]
    for rt_name, rt_path in candidates:
        if rt_path and os.path.isfile(rt_path):
            return ["--js-runtimes", f"{rt_name}:{rt_path}"]
    return []


def install_ffmpeg_executable(progress_cb=None, proxy_url: str = ""):
    """
    Downloads and stream-decompresses standalone ffmpeg.exe (~28 MB gzip) into ~/.negm_stream/bin/ffmpeg.exe
    for lossless 1080p/4K MP4 muxing and MP3 extraction. Thread-safe with _FFMPEG_INSTALL_LOCK.
    """
    existing = find_ffmpeg_executable()
    if existing:
        return True, existing

    with _FFMPEG_INSTALL_LOCK:
        existing = find_ffmpeg_executable()
        if existing:
            return True, existing

        os.makedirs(BIN_DIR, exist_ok=True)
        target = os.path.join(BIN_DIR, "ffmpeg.exe" if sys.platform == "win32" else "ffmpeg")
        tmp_target = target + ".part"
        try:
            sess = requests.Session()
            if proxy_url:
                p = proxy_url if "://" in proxy_url else "http://" + proxy_url
                sess.proxies = {"http": p, "https": p}
            headers = {"User-Agent": DownloadTask.BROWSER_HEADERS["User-Agent"]}
            with sess.get(FFMPEG_STATIC_GZ_URL, headers=headers, stream=True, allow_redirects=True, timeout=(8.0, 40.0)) as resp:
                if resp.status_code >= 400:
                    return False, f"FFmpeg HTTP Error {resp.status_code}"
                total = int(resp.headers.get("content-length") or 0)
                downloaded = 0
                decomp = zlib.decompressobj(16 + zlib.MAX_WBITS)
                with open(tmp_target, "wb") as out_f:
                    for chunk in resp.iter_content(chunk_size=131072):
                        if not chunk:
                            continue
                        downloaded += len(chunk)
                        raw_bytes = decomp.decompress(chunk)
                        if raw_bytes:
                            out_f.write(raw_bytes)
                        if progress_cb:
                            progress_cb(downloaded, total)
                    tail = decomp.flush()
                    if tail:
                        out_f.write(tail)
            if os.path.getsize(tmp_target) < 5 * 1024 * 1024:
                return False, "Incomplete FFmpeg binary downloaded"
            os.replace(tmp_target, target)
            return True, target
        except Exception as e:
            try:
                if os.path.exists(tmp_target):
                    os.remove(tmp_target)
            except Exception:
                pass
            return False, str(e)[:70]


def install_or_update_ytdlp(progress_cb=None, proxy_url: str = ""):
    """
    Provisions or updates BOTH standalone yt-dlp.exe AND standalone ffmpeg.exe inside ~/.negm_stream/bin/
    so 1080p/2K/4K video+audio merging and MP3 extraction work 100% out of the box.
    """
    os.makedirs(BIN_DIR, exist_ok=True)
    existing = find_ytdlp_executable()
    need_ff = not has_ffmpeg()
    cflags = 0x08000000 if hasattr(subprocess, "CREATE_NO_WINDOW") else 0

    def _yt_prog(dl, tot):
        if progress_cb and tot > 0:
            scale = 0.55 if need_ff else 1.0
            progress_cb(int(dl * scale), tot)

    def _ff_prog(dl, tot):
        if progress_cb and tot > 0:
            # Map FFmpeg download onto 55%..100% (or 0%..100% if yt-dlp was already updated)
            progress_cb(int(tot * 0.55 + dl * 0.45), tot)

    yt_ok = False
    yt_path = existing
    if existing and os.path.normcase(os.path.dirname(existing)) == os.path.normcase(BIN_DIR):
        try:
            cmd = [existing, "-U"]
            if proxy_url:
                p = proxy_url if "://" in proxy_url else "http://" + proxy_url
                cmd.extend(["--proxy", p])
            proc = subprocess.run(
                cmd, capture_output=True, text=True, errors="ignore",
                stdin=subprocess.DEVNULL, timeout=60, creationflags=cflags,
            )
            if proc.returncode == 0:
                yt_ok = True
        except Exception:
            pass

    if not yt_ok:
        target = os.path.join(BIN_DIR, "yt-dlp.exe")
        tmp_target = target + ".part"
        try:
            sess = requests.Session()
            if proxy_url:
                p = proxy_url if "://" in proxy_url else "http://" + proxy_url
                sess.proxies = {"http": p, "https": p}
            headers = {"User-Agent": DownloadTask.BROWSER_HEADERS["User-Agent"]}
            with sess.get(YTDLP_RELEASE_URL, headers=headers, stream=True, allow_redirects=True, timeout=(6.0, 30.0)) as resp:
                if resp.status_code >= 400:
                    return False, f"HTTP Error {resp.status_code}"
                total = int(resp.headers.get("content-length") or 0)
                downloaded = 0
                with open(tmp_target, "wb") as f:
                    for chunk in resp.iter_content(chunk_size=131072):
                        if not chunk:
                            continue
                        f.write(chunk)
                        downloaded += len(chunk)
                        _yt_prog(downloaded, total)
            if os.path.getsize(tmp_target) < 1024 * 1024:
                return False, "Incomplete engine file downloaded"
            os.replace(tmp_target, target)
            yt_path = target
        except Exception as e:
            try:
                if os.path.exists(tmp_target):
                    os.remove(tmp_target)
            except Exception:
                pass
            return False, str(e)[:70]

    if need_ff:
        install_ffmpeg_executable(progress_cb=_ff_prog, proxy_url=proxy_url)

    return True, yt_path


def _upgrade_media_selector(selector: str, ff_available: bool, audio_only: bool = False) -> str:
    """
    Normalizes and upgrades format selectors so legacy or DASH-only videos (e.g. YouTube 1080p/4K)
    never fail with 'Requested format is not available'.
    """
    sel = (selector or "").strip()
    if audio_only:
        return "ba[ext=m4a]/ba/b"
    m_h = re.fullmatch(r"b\[height<=(\d+)\]/b", sel)
    if m_h:
        h = int(m_h.group(1))
        if ff_available:
            return f"bv*[height<={h}][ext=mp4]+ba[ext=m4a]/bv*[height<={h}]+ba/b[height<={h}][ext=mp4]/b[height<={h}]/b"
        return f"b[height<={h}][ext=mp4]/b[height<={h}]/b/bv*[height<={h}]"
    if sel in ("b[ext=mp4]/b", "b", ""):
        if ff_available:
            return "bv*[ext=mp4]+ba[ext=m4a]/bv*+ba/b[ext=mp4]/b"
        return "b[ext=mp4]/b/bv*"
    if not ff_available and "+" in sel:
        # Strip '+' merge branches if FFmpeg could not be provisioned offline
        m_any_h = re.search(r"height<=(\d+)", sel)
        if m_any_h:
            h = int(m_any_h.group(1))
            return f"b[height<={h}][ext=mp4]/b[height<={h}]/b/bv*[height<={h}]"
        return "b[ext=mp4]/b/bv*"
    return sel


def probe_media_info(url: str, proxy_url: str = ""):
    """
    Uses yt-dlp --dump-single-json (with automatic JS runtime discovery) to fetch video metadata
    and build reliable MP4-first quality presets from 240p up to 4K + Audio.
    """
    exe = find_ytdlp_executable()
    if not exe:
        return False, "NO_YTDLP"

    url = (url or "").strip()
    if not url:
        return False, "Empty URL"

    cmd = [
        exe,
        *find_js_runtime_args(),
        "--dump-single-json",
        "--no-warnings",
        "--no-playlist",
        "--compat-options", "no-youtube-prefer-utc-upload-date",
        "--no-check-certificates",
        "--extractor-args", "youtube:player_client=tv,mweb,web,android",
        "--socket-timeout", "20",
    ]
    if proxy_url:
        p = proxy_url if "://" in proxy_url else "http://" + proxy_url
        cmd.extend(["--proxy", p])
    cmd.append(url)

    cflags = 0x08000000 if hasattr(subprocess, "CREATE_NO_WINDOW") else 0
    try:
        proc = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            stdin=subprocess.DEVNULL,
            timeout=55,
            creationflags=cflags,
        )
        stdout = (proc.stdout or "").strip()
        data = None
        s_idx = stdout.find("{")
        e_idx = stdout.rfind("}")
        if s_idx != -1 and e_idx > s_idx:
            try:
                data = json.loads(stdout[s_idx:e_idx + 1])
            except Exception:
                data = None

        if data is None:
            for ln in reversed(stdout.splitlines()):
                ln_s = ln.strip()
                if ln_s.startswith("{") and ln_s.endswith("}"):
                    try:
                        data = json.loads(ln_s)
                        break
                    except Exception:
                        pass

        if not data:
            err = (proc.stderr or stdout or f"Exit code {proc.returncode}").strip()
            err_lines = [x.strip() for x in err.splitlines() if x.strip() and not x.strip().startswith("WARNING:")]
            if not err_lines:
                err_lines = [x.strip() for x in err.splitlines() if x.strip()]
            return False, (err_lines[-1][:120] if err_lines else "Could not extract media info")
        title = sanitize_filename(data.get("title") or "Video_Download")
        uploader = data.get("uploader") or data.get("channel") or data.get("extractor_key") or "Media"
        duration = int(data.get("duration") or 0)
        platform = data.get("extractor_key") or urllib.parse.urlparse(url).netloc
        formats = data.get("formats") or []
        ff_ok = has_ffmpeg()

        # Discover resolutions and prefer MP4/M4A sizes for accurate estimates
        heights_all = {}
        heights_mp4 = {}
        heights_prog = {}
        best_audio_sz = 0
        for f in formats:
            vcodec = f.get("vcodec")
            acodec = f.get("acodec")
            ext_f = (f.get("ext") or "").lower()
            proto = (f.get("protocol") or "").lower()
            h = f.get("height")
            sz = int(f.get("filesize") or f.get("filesize_approx") or 0)
            if vcodec and vcodec != "none" and isinstance(h, int) and h >= 144:
                heights_all[h] = max(heights_all.get(h, 0), sz)
                if ext_f == "mp4" and "m3u8" not in proto:
                    heights_mp4[h] = max(heights_mp4.get(h, 0), sz)
                if acodec and acodec != "none":
                    heights_prog[h] = max(heights_prog.get(h, 0), sz)
            elif (not vcodec or vcodec == "none") and acodec and acodec != "none":
                if ext_f == "m4a" or best_audio_sz == 0:
                    best_audio_sz = max(best_audio_sz, sz)

        qualities = []
        # 1. Best auto option (MediaDownloadTask auto-provisions FFmpeg if needed!)
        best_sel = "bv*[ext=mp4]+ba[ext=m4a]/bv*+ba/b[ext=mp4]/b"
        top_v = max(heights_mp4.values(), default=0) or max(heights_all.values(), default=0)
        max_est = (top_v + best_audio_sz) if top_v > 0 else max(heights_prog.values(), default=0)
        qualities.append({
            "id": "best_auto",
            "label": t("vid_q_best") + (f"  (~{fmt_size(max_est)})" if max_est > 0 else ""),
            "selector": best_sel,
            "audio_only": False,
            "ext": "mp4",
            "est_size": max_est,
        })

        # 2. All available resolution options (4K -> 240p)
        avail_heights = sorted(heights_all.keys(), reverse=True)
        std_tags = {2160: "4K UHD", 1440: "2K QHD", 1080: "Full HD", 720: "HD", 480: "SD", 360: "Data Saver", 240: "Low"}
        for h in avail_heights:
            if h < 240 and len(avail_heights) > 2:
                continue
            badge = std_tags.get(h, "")
            tag_txt = f"{h}p {badge}".strip()
            sel = f"bv*[height<={h}][ext=mp4]+ba[ext=m4a]/bv*[height<={h}]+ba/b[height<={h}][ext=mp4]/b[height<={h}]/b"
            v_sz = heights_mp4.get(h) or heights_all.get(h, 0)
            est = (v_sz + best_audio_sz) if (v_sz > 0 and h not in heights_prog) else (heights_prog.get(h) or v_sz)
            sz_str = f"  (~{fmt_size(est)})" if est > 0 else ""
            qualities.append({
                "id": f"res_{h}",
                "label": f"MP4 / Video  —  {tag_txt}{sz_str}",
                "selector": sel,
                "audio_only": False,
                "ext": "mp4",
                "est_size": est,
            })

        # 3. Audio-only option
        aud_ext = "mp3" if ff_ok else "m4a"
        aud_sz_str = f"  (~{fmt_size(best_audio_sz)})" if best_audio_sz > 0 else ""
        qualities.append({
            "id": "audio_only",
            "label": f"{t('vid_q_audio')}{aud_sz_str}",
            "selector": "ba[ext=m4a]/ba/b",
            "audio_only": True,
            "ext": aud_ext,
            "est_size": best_audio_sz,
        })

        is_live = bool(data.get("is_live") or data.get("live_status") == "is_live")
        is_stream = is_live or any((url or "").lower().split("?")[0].endswith(x) for x in (".m3u8", ".mpd", ".ts"))
        return True, {
            "title": title,
            "uploader": uploader,
            "duration": duration,
            "platform": platform,
            "webpage_url": data.get("webpage_url") or url,
            "qualities": qualities,
            "ffmpeg_available": ff_ok,
            "is_live": is_live,
            "is_stream": is_stream,
            "thumbnail": data.get("thumbnail") or "",
        }
    except subprocess.TimeoutExpired:
        return False, "Connection timed out while analyzing video"
    except Exception as e:
        return False, str(e)[:85]


class MediaDownloadTask:
    """
    DownloadTask-compatible wrapper around standalone yt-dlp + FFmpeg:
    - Auto-discovers Node/Deno/Bun JS runtime for YouTube 2026+ EJS extraction
    - Auto-provisions standalone FFmpeg on demand when HD/4K DASH muxing is needed
    - Multi-part fragment & 10 MB HTTP range acceleration (--concurrent-fragments 8 --http-chunk-size 10M)
    - Escapes '%' in output templates and tracks multi-stream (video + audio) progress smoothly
    """
    def __init__(self, task_id, url, save_path, format_selector="bv*[ext=mp4]+ba[ext=m4a]/bv*+ba/b[ext=mp4]/b",
                 audio_only=False, speed_limit_kb=0, auto_sort=True, proxy_url="", est_size=0, is_live=False, queue_id="main"):
        self.task_id = task_id
        self.url = url
        self.format_selector = format_selector
        self.audio_only = bool(audio_only)
        self.speed_limit_kb = max(0, int(speed_limit_kb or 0))
        self.auto_sort = bool(auto_sort)
        self.is_live = bool(is_live)
        self.queue_id = str(queue_id or "main")
        self.proxy_url = ""
        self.set_proxy(proxy_url)

        self.base_folder = os.path.dirname(os.path.abspath(save_path))
        raw_name = sanitize_filename(os.path.basename(save_path))
        stem, ext = os.path.splitext(raw_name)
        if not ext:
            ext = ".m4a" if self.audio_only else ".mp4"
        self.stem_name = stem or f"media_{task_id}"

        dest_folder = self.base_folder
        if self.auto_sort:
            cat_folder = "Music" if self.audio_only else "Videos"
            if os.path.basename(os.path.normpath(dest_folder)).lower() != cat_folder.lower():
                dest_folder = os.path.join(self.base_folder, cat_folder)
        try:
            os.makedirs(dest_folder, exist_ok=True)
        except Exception:
            dest_folder = self.base_folder
        self.dest_folder = dest_folder
        self.save_path = os.path.join(dest_folder, self.stem_name + ext)
        self.filename = os.path.basename(self.save_path)
        self.temp_dir = os.path.join(dest_folder, f".negm_media_{self.task_id}")

        self.total_size = max(0, int(est_size or 0))
        self.downloaded_bytes = 0
        self.net_bytes_downloaded = 0
        self.current_speed_bps = 0
        self.status = "st_queued"
        self.status_detail = ""
        self.can_resume = True
        self.is_paused = False
        self.is_cancelled = False
        self.is_completed = False
        self.is_failed = False
        self.started = False
        self.added_time = time.time()

        self.chunks = []
        self.next_chunk_id = 1
        self.lock = threading.Lock()
        self._proc = None

    @property
    def state(self):
        if self.is_completed:
            return "completed"
        if self.is_failed:
            return "failed"
        if self.is_paused:
            return "paused"
        if not self.started:
            return "queued"
        return "active"

    def fail(self, message):
        self.is_failed = True
        self.current_speed_bps = 0
        self.status = "st_failed"
        self.status_detail = str(message or "")

    def set_speed_limit(self, limit_kb):
        with self.lock:
            self.speed_limit_kb = max(0, int(limit_kb or 0))

    def set_proxy(self, proxy_url: str):
        p = (proxy_url or "").strip()
        if p and "://" not in p:
            p = "http://" + p
        self.proxy_url = p

    def pop_net_bytes(self) -> int:
        if self.net_bytes_downloaded <= 0:
            return 0
        with self.lock:
            val = self.net_bytes_downloaded
            self.net_bytes_downloaded = 0
            return val

    def get_progress(self):
        with self.lock:
            dl = self.total_size if (self.is_completed and self.total_size > 0) else self.downloaded_bytes
            pct = (dl / self.total_size) if self.total_size > 0 else 0.0
            act = 8 if self.state == "active" and self.status == "st_downloading" else (1 if self.state == "active" else 0)
            return {
                "downloaded": dl,
                "total": self.total_size,
                "percent": min(1.0, max(0.0, pct)),
                "speed_bps": self.current_speed_bps,
                "active_chunks": act,
                "total_chunks": 8,
                "can_resume": True,
                "status": self.status,
                "status_detail": self.status_detail,
            }

    def _kill_proc(self):
        proc = self._proc
        self._proc = None
        if proc is not None and proc.poll() is None:
            try:
                if sys.platform == "win32":
                    cflags = 0x08000000 if hasattr(subprocess, "CREATE_NO_WINDOW") else 0
                    subprocess.run(
                        ["taskkill", "/F", "/T", "/PID", str(proc.pid)],
                        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, creationflags=cflags,
                    )
                else:
                    proc.terminate()
            except Exception:
                pass

    def start(self):
        exe = find_ytdlp_executable()
        if not exe:
            self.started = True
            self.fail("yt-dlp engine missing — open Video Grabber to install")
            return

        self.started = True
        self.is_paused = False
        self.is_failed = False
        self.is_cancelled = False
        self.status_detail = ""
        self.status = "st_probing"

        def _worker():
            os.makedirs(self.dest_folder, exist_ok=True)
            ff_path = find_ffmpeg_executable()

            # Auto-provision FFmpeg seamlessly if HD/4K muxing is needed and FFmpeg isn't installed yet
            wants_ff = ("+" in (self.format_selector or "")) or bool(re.search(r"height<=(480|720|1080|1440|2160)", self.format_selector or "")) or (self.audio_only and self.save_path.lower().endswith(".mp3"))
            if wants_ff and not ff_path:
                self.status = "st_probing"
                ok_ff, res_ff = install_ffmpeg_executable(proxy_url=self.proxy_url)
                if ok_ff:
                    ff_path = res_ff
                if self.is_paused or self.is_cancelled:
                    return

            ff_ok = bool(ff_path and os.path.isfile(ff_path))
            eff_selector = _upgrade_media_selector(self.format_selector, ff_available=ff_ok, audio_only=self.audio_only)
            self.format_selector = eff_selector

            # Escape '%' in stem_name so yt-dlp output template parser never misinterprets literal '%'
            safe_stem = self.stem_name.replace("%", "%%")
            out_tmpl = os.path.join(self.dest_folder, f"{safe_stem}.%(ext)s")

            cmd = [
                exe,
                *find_js_runtime_args(),
                "--newline",
                "--no-warnings",
                "--no-playlist",
                "--continue",
                "--no-mtime",
                "--no-simulate",
                "--retries", "10",
                "--fragment-retries", "10",
                "--concurrent-fragments", "5",
                "--compat-options", "no-youtube-prefer-utc-upload-date",
                "--no-check-certificates",
                "--socket-timeout", "25",
                "--extractor-args", "youtube:player_client=tv,mweb,web,android",
                "-f", eff_selector,
                "--progress-template",
                "download:NEGM_PROG|%(progress.downloaded_bytes)s|%(progress.total_bytes)s|%(progress.total_bytes_estimate)s|%(progress.speed)s",
                "--print", "after_move:NEGM_DEST|%(filepath)s",
                "-o", out_tmpl,
            ]
            if getattr(self, "is_live", False) or "live" in self.url.lower():
                cmd.extend(["--no-live-from-start"])

            if self.audio_only:
                if ff_ok and self.save_path.lower().endswith(".mp3"):
                    cmd.extend(["-x", "--audio-format", "mp3"])
            elif ff_ok:
                cmd.extend(["--merge-output-format", "mp4"])

            if ff_ok:
                cmd.extend(["--ffmpeg-location", os.path.dirname(ff_path)])

            with self.lock:
                lim = self.speed_limit_kb
            if lim > 0:
                cmd.extend(["--limit-rate", f"{lim}K"])
            if self.proxy_url:
                cmd.extend(["--proxy", self.proxy_url])
            cmd.append(self.url)

            cflags = 0x08000000 if hasattr(subprocess, "CREATE_NO_WINDOW") else 0
            completed_streams_bytes = 0
            cur_stream_dl = 0
            cur_stream_tot = 0
            initial_est = self.total_size

            max_attempts = 3
            for attempt in range(1, max_attempts + 1):
                last_err = ""
                recent_lines = collections.deque(maxlen=25)
                try:
                    proc = subprocess.Popen(
                        cmd,
                        stdout=subprocess.PIPE,
                        stderr=subprocess.STDOUT,
                        text=True,
                        encoding="utf-8",
                        errors="replace",
                        stdin=subprocess.DEVNULL,
                        creationflags=cflags,
                    )
                    self._proc = proc
                    for raw_line in proc.stdout:
                        if self.is_paused or self.is_cancelled:
                            break
                        line = raw_line.strip()
                        if not line:
                            continue
                        recent_lines.append(line)
                        if line.startswith("NEGM_PROG|"):
                            self.status = "st_downloading"
                            parts = line.split("|")
                            if len(parts) >= 5:
                                try:
                                    dl_v = int(float(parts[1])) if parts[1] not in ("NA", "None", "") else cur_stream_dl
                                except Exception:
                                    dl_v = cur_stream_dl
                                tot_v = 0
                                for idx_p in (2, 3):
                                    if parts[idx_p] not in ("NA", "None", ""):
                                        try:
                                            tot_v = int(float(parts[idx_p]))
                                            if tot_v > 0:
                                                break
                                        except Exception:
                                            pass
                                try:
                                    spd_v = int(float(parts[4])) if parts[4] not in ("NA", "None", "") else 0
                                except Exception:
                                    spd_v = 0

                                # Detect transition from stream 1 (video) to stream 2 (audio)
                                if cur_stream_dl > 65536 and dl_v < (cur_stream_dl // 4):
                                    completed_streams_bytes += max(cur_stream_dl, cur_stream_tot)
                                    cur_stream_dl = 0
                                    cur_stream_tot = 0

                                delta_net = max(0, dl_v - cur_stream_dl)
                                cur_stream_dl = max(cur_stream_dl, dl_v)
                                if tot_v > 0:
                                    cur_stream_tot = tot_v
                                combined_dl = completed_streams_bytes + cur_stream_dl
                                combined_tot = max(initial_est, completed_streams_bytes + cur_stream_tot, combined_dl)

                                with self.lock:
                                    if delta_net > 0:
                                        self.net_bytes_downloaded += delta_net
                                    self.downloaded_bytes = combined_dl
                                    if combined_tot > 0:
                                        self.total_size = combined_tot
                                    self.current_speed_bps = max(0, spd_v)
                        elif line.startswith("NEGM_DEST|"):
                            final_p = line.split("NEGM_DEST|", 1)[1].strip()
                            if final_p:
                                self.save_path = final_p
                                self.filename = os.path.basename(final_p)
                        elif "[Merger]" in line or "[ExtractAudio]" in line or "[Fixup" in line:
                            self.status = "st_assembling"
                            self.current_speed_bps = 0
                        elif "Destination:" in line:
                            dest_cand = line.split("Destination:", 1)[1].strip()
                            if dest_cand and not dest_cand.endswith(".part"):
                                if not re.search(r"\.f[0-9a-zA-Z_-]+\.[a-z0-9]+$", dest_cand):
                                    self.save_path = dest_cand
                                    self.filename = os.path.basename(dest_cand)
                        elif "ERROR:" in line:
                            last_err = line.split("ERROR:", 1)[1].strip()[:120]
                        elif any(k in line.lower() for k in ("sign in", "bot detection", "private video", "copyright", "members-only", "georestricted", "403: forbidden", "429: too many", "video unavailable")):
                            last_err = line.strip()[:120]

                    if self.is_paused or self.is_cancelled:
                        self._kill_proc()
                        self.current_speed_bps = 0
                        return

                    proc.wait()
                    self._proc = None

                    if proc.returncode == 0:
                        if not os.path.isfile(self.save_path):
                            for fn in os.listdir(self.dest_folder):
                                if fn.startswith(self.stem_name + ".") and not fn.endswith((".part", ".ytdl", ".temp")):
                                    if not re.search(r"\.f[0-9a-zA-Z_-]+\.[a-z0-9]+$", fn):
                                        self.save_path = os.path.join(self.dest_folder, fn)
                                        self.filename = fn
                                        break
                        if os.path.isfile(self.save_path):
                            sz = os.path.getsize(self.save_path)
                            if sz > 0:
                                self.total_size = sz
                                self.downloaded_bytes = sz
                        self.current_speed_bps = 0
                        self.status_detail = ""
                        self.status = "st_completed"
                        self.is_completed = True
                        return

                    # Extract error description from recent output if last_err was not tagged
                    if not last_err:
                        for cand in reversed(recent_lines):
                            c_s = cand.strip()
                            if c_s and not c_s.startswith("NEGM_") and not c_s.startswith("WARNING:"):
                                last_err = c_s[:120]
                                break

                    is_transient = any(k in (last_err or "").lower() for k in ("timeout", "connection reset", "fragment", "503", "429", "network", "temporary", "dropped", "broken pipe"))
                    if is_transient and attempt < max_attempts and not (self.is_paused or self.is_cancelled):
                        self.status_detail = f"Network drop, retrying ({attempt}/{max_attempts})..."
                        time.sleep(2.0 * attempt)
                        continue

                    self.fail(last_err or f"Media download failed (code {proc.returncode})")
                    return
                except Exception as e:
                    if not (self.is_paused or self.is_cancelled):
                        self.fail(str(e)[:90])
                    return

        threading.Thread(target=_worker, daemon=True).start()

    def pause(self):
        self.is_paused = True
        self.current_speed_bps = 0
        self.status = "st_paused"
        self._kill_proc()

    def resume(self):
        self.is_paused = False
        self.is_failed = False
        self.status_detail = ""
        self.start()

    def retry(self):
        self._kill_proc()
        self.is_failed = False
        self.is_paused = False
        self.status_detail = ""
        self.current_speed_bps = 0
        self.started = False
        self.start()

    def reset_for_redownload(self):
        self._kill_proc()
        self.is_completed = False
        self.is_failed = False
        self.is_paused = False
        self.is_cancelled = False
        self.status_detail = ""
        self.downloaded_bytes = 0
        self._notified = False
        self.started = False
        try:
            for fn in os.listdir(self.dest_folder):
                if fn.startswith(self.stem_name + ".") and (fn.endswith(".part") or fn.endswith(".ytdl") or ".f" in fn):
                    os.remove(os.path.join(self.dest_folder, fn))
        except Exception:
            pass

    def cancel(self):
        self.is_cancelled = True
        self.status = "st_paused"
        self.current_speed_bps = 0
        self._kill_proc()
        try:
            for fn in os.listdir(self.dest_folder):
                if fn.startswith(self.stem_name + ".") and (fn.endswith(".part") or fn.endswith(".ytdl") or ".f" in fn):
                    os.remove(os.path.join(self.dest_folder, fn))
        except Exception:
            pass

    def refresh_url(self, new_url):
        new_url = str(new_url).strip()
        if not new_url or not URL_REGEX.fullmatch(new_url):
            return False, "Invalid URL"
        self.url = new_url
        if self.is_failed:
            self.is_failed = False
            self.status_detail = ""
            self.status = "st_paused"
        return True, "OK"

    def to_dict(self):
        return {
            "kind": "media",
            "task_id": self.task_id,
            "url": self.url,
            "save_path": self.save_path,
            "base_folder": self.base_folder,
            "filename": self.filename,
            "format_selector": self.format_selector,
            "audio_only": self.audio_only,
            "speed_limit_kb": self.speed_limit_kb,
            "auto_sort": self.auto_sort,
            "total_size": self.total_size,
            "downloaded_bytes": self.downloaded_bytes,
            "state": self.state,
            "status_detail": self.status_detail,
            "is_live": getattr(self, "is_live", False),
            "added_time": self.added_time,
            "queue_id": getattr(self, "queue_id", "main"),
        }

    @classmethod
    def from_dict(cls, d):
        task = cls(
            task_id=d["task_id"],
            url=d["url"],
            save_path=d["save_path"],
            format_selector=d.get("format_selector", "bv*[ext=mp4]+ba[ext=m4a]/bv*+ba/b[ext=mp4]/b"),
            audio_only=d.get("audio_only", False),
            speed_limit_kb=d.get("speed_limit_kb", 0),
            auto_sort=False,
            est_size=d.get("total_size", 0),
            is_live=d.get("is_live", False),
        )
        task.save_path = d["save_path"]
        task.dest_folder = os.path.dirname(os.path.abspath(task.save_path))
        task.base_folder = d.get("base_folder", task.dest_folder)
        task.filename = d.get("filename", os.path.basename(task.save_path))
        task.stem_name = os.path.splitext(task.filename)[0] or task.stem_name
        task.downloaded_bytes = int(d.get("downloaded_bytes", 0) or 0)
        task.added_time = d.get("added_time", time.time())
        task.status_detail = d.get("status_detail", "")
        state = d.get("state", "queued")
        if state == "completed":
            task.is_completed = True
            task.started = True
            task.status = "st_completed"
        elif state == "failed":
            task.is_failed = True
            task.started = True
            task.status = "st_failed"
        elif state in ("paused", "active"):
            task.is_paused = True
            task.started = True
            task.status = "st_paused"
        else:
            task.status = "st_queued"
        return task


import html.parser
import concurrent.futures

_DIRECT_MEDIA_RE = re.compile(
    r"https?://[^\s\x22\x27<>()\[\]{}|]+?\.(?:"
    r"mp4|mkv|webm|avi|mov|flv|m4v|ts|3gp|"
    r"mp3|m4a|wav|flac|aac|ogg|opus|wma|"
    r"zip|rar|7z|tar|gz|bz2|xz|iso|dmg|"
    r"exe|msi|apk|deb|rpm|bin|jar|"
    r"pdf|docx?|xlsx?|pptx?|epub|txt|csv|"
    r"jpe?g|png|gif|webp|svg|bmp|ico|avif"
    r")(?:[?#][^\s\x22\x27<>()\[\]{}|]*)?",
    re.IGNORECASE
)

class _WebpageLinkSpider(html.parser.HTMLParser):
    """High-speed native HTML stream tokenizer for link and asset extraction."""
    def __init__(self, base_url: str):
        super().__init__(convert_charrefs=True)
        self.base_url = base_url
        self.raw_items = []
        self._cur_tag = None
        self._cur_href = None
        self._cur_hint = ""
        self._cur_text = []

    def handle_starttag(self, tag, attrs):
        self._cur_tag = tag
        attrs_map = {k.lower(): (v or "").strip() for k, v in attrs}

        if tag == "base" and attrs_map.get("href"):
            new_base = attrs_map["href"]
            if new_base:
                self.base_url = urllib.parse.urljoin(self.base_url, new_base)
            return

        candidates = []
        if tag == "a":
            href = attrs_map.get("href")
            if href:
                candidates.append((href, "link"))
        elif tag in ("img", "script"):
            for attr in ("src", "data-src", "data-original", "data-url"):
                val = attrs_map.get(attr)
                if val:
                    candidates.append((val, "image" if tag == "img" else "script"))
                    break
        elif tag in ("video", "audio", "source", "track"):
            for attr in ("src", "data-src"):
                val = attrs_map.get(attr)
                if val:
                    candidates.append((val, "media"))
                    break
        elif tag == "link":
            href = attrs_map.get("href")
            if href:
                candidates.append((href, "link_tag"))
        elif tag in ("iframe", "embed", "object"):
            val = attrs_map.get("src") or attrs_map.get("data")
            if val:
                candidates.append((val, "embed"))

        if "download" in attrs_map and attrs_map.get("href"):
            candidates.append((attrs_map["href"], "download_attr"))

        if candidates:
            u_cand, hint = candidates[0]
            txt = attrs_map.get("alt") or attrs_map.get("title") or ""
            if tag in ("img", "source", "track", "embed", "link", "input", "meta"):
                self.raw_items.append((u_cand, hint, txt))
            else:
                self._cur_href = u_cand
                self._cur_hint = hint
                self._cur_text = [txt] if txt else []

    def handle_data(self, data):
        if self._cur_tag == "a" and self._cur_href:
            txt = data.strip()
            if txt:
                self._cur_text.append(txt)

    def handle_endtag(self, tag):
        if tag == self._cur_tag and self._cur_href:
            txt_combined = " ".join(t for t in self._cur_text if t).strip()
            self.raw_items.append((self._cur_href, getattr(self, "_cur_hint", tag), txt_combined))
            self._cur_href = None
            self._cur_text = []
        self._cur_tag = None


def classify_spider_link(url: str, tag_hint: str = "", txt_hint: str = "") -> dict:
    """Intelligently detects file category, extension, clean name, and directness."""
    url_clean = url.split("#")[0].strip()
    parsed = urllib.parse.urlparse(url_clean)
    path = urllib.parse.unquote(parsed.path)

    raw_fname = os.path.basename(path.rstrip("/"))
    if not raw_fname or "." not in raw_fname:
        qs = urllib.parse.parse_qs(parsed.query)
        for key in ("file", "filename", "name", "download", "attachment"):
            if key in qs and qs[key]:
                cand = qs[key][0]
                if "." in cand:
                    raw_fname = cand
                    break

    if not raw_fname and txt_hint:
        clean_txt = re.sub(r'[\s\/:*?"<>|]+', '_', txt_hint).strip("_")
        if clean_txt:
            raw_fname = clean_txt[:60]

    if not raw_fname:
        raw_fname = "index.html" if not path or path.endswith("/") else "resource"

    raw_fname = sanitize_filename(raw_fname)
    stem, ext = os.path.splitext(raw_fname)
    ext = ext.lstrip(".").lower()

    image_exts = {"jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico", "avif"}
    video_exts = {"mp4", "mkv", "webm", "avi", "mov", "flv", "m4v", "ts", "3gp"}
    audio_exts = {"mp3", "m4a", "wav", "flac", "aac", "ogg", "opus", "wma"}
    archive_exts = {"zip", "rar", "7z", "tar", "gz", "bz2", "xz", "iso", "dmg"}
    program_exts = {"exe", "msi", "apk", "deb", "rpm", "bin", "jar", "bat", "cmd", "ps1"}
    doc_exts = {"pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "epub", "txt", "csv", "rtf"}

    if ext in image_exts:
        cat = "type_images"
        is_file = True
    elif ext in video_exts or tag_hint == "media":
        cat = "type_videos"
        is_file = True
    elif ext in audio_exts:
        cat = "type_music"
        is_file = True
    elif ext in archive_exts:
        cat = "type_compressed"
        is_file = True
    elif ext in program_exts:
        cat = "type_programs"
        is_file = True
    elif ext in doc_exts:
        cat = "type_docs"
        is_file = True
    elif ext in ("html", "htm", "php", "asp", "aspx", "jsp") or not ext:
        cat = "type_other"
        is_file = False
    else:
        cat = "type_other"
        is_file = True

    return {
        "url": url_clean,
        "name": raw_fname,
        "ext": ext or "web",
        "category": cat,
        "is_file": is_file,
        "tag": tag_hint,
        "text": txt_hint,
        "size": 0,
        "size_str": "--",
    }


def scrape_webpage_links(page_url: str, max_depth: int = 1, same_domain_only: bool = True,
                         proxy_url: str = "", progress_callback=None):
    """
    Crawls page_url up to max_depth (1 = single page, 2 = deep multi-page crawl).
    Extracts all direct links, embedded media, and downloadable files.
    """
    url = (page_url or "").strip()
    if not url:
        return False, "Empty URL"
    if not re.match(r"^https?://", url, re.I):
        url = "https://" + url

    root_parsed = urllib.parse.urlparse(url)
    root_domain = root_parsed.netloc.lower()

    sess = requests.Session()
    adapter = HTTPAdapter(pool_connections=16, pool_maxsize=32, max_retries=1)
    sess.mount("http://", adapter)
    sess.mount("https://", adapter)
    if proxy_url:
        p = proxy_url if "://" in proxy_url else "http://" + proxy_url
        sess.proxies = {"http": p, "https": p}

    visited_pages = set()
    pages_to_crawl = [(url, 1)]
    found_urls = set()
    results = []

    while pages_to_crawl:
        curr_url, depth = pages_to_crawl.pop(0)
        curr_norm = curr_url.split("#")[0].strip()
        if curr_norm in visited_pages:
            continue
        visited_pages.add(curr_norm)

        if callable(progress_callback):
            progress_callback(f"Scanning ({depth}/{max_depth}): {curr_norm[:55]}... ({len(results)} found)")

        try:
            with sess.get(curr_norm, headers=DownloadTask.BROWSER_HEADERS, stream=True,
                          allow_redirects=True, timeout=(5.0, 12.0)) as resp:
                if resp.status_code >= 400:
                    continue
                final_url = resp.url
                ctype = (resp.headers.get("content-type") or "").lower()

                if ctype and not any(t in ctype for t in ("html", "xml", "text", "json", "javascript")):
                    item = classify_spider_link(final_url, "source", "")
                    item["is_file"] = True
                    cl = resp.headers.get("content-length")
                    if cl and cl.isdigit():
                        item["size"] = int(cl)
                        item["size_str"] = fmt_size(int(cl))
                    if final_url not in found_urls:
                        found_urls.add(final_url)
                        results.append(item)
                    continue

                chunks = []
                read_b = 0
                for blk in resp.iter_content(chunk_size=65536):
                    if not blk:
                        break
                    chunks.append(blk)
                    read_b += len(blk)
                    if read_b >= 4 * 1024 * 1024:
                        break
                raw_bytes = b"".join(chunks)
                enc = resp.encoding or "utf-8"
                try:
                    html_text = raw_bytes.decode(enc, errors="replace")
                except LookupError:
                    html_text = raw_bytes.decode("utf-8", errors="replace")
        except Exception:
            continue

        spider = _WebpageLinkSpider(final_url)
        try:
            spider.feed(html_text)
        except Exception:
            pass

        for m in _DIRECT_MEDIA_RE.finditer(html_text):
            spider.raw_items.append((m.group(0), "regex", ""))

        base_for_join = spider.base_url

        for raw_href, tag_hint, txt_hint in spider.raw_items:
            if not raw_href or raw_href.startswith(("javascript:", "mailto:", "tel:", "data:", "blob:", "#")):
                continue
            full = urllib.parse.urljoin(base_for_join, raw_href)
            full = full.split("#", 1)[0].strip()
            if not full.startswith(("http://", "https://")):
                continue
            if full in found_urls:
                continue
            found_urls.add(full)

            item = classify_spider_link(full, tag_hint, txt_hint)
            results.append(item)

            if depth < max_depth and not item["is_file"]:
                item_domain = urllib.parse.urlparse(full).netloc.lower()
                if not same_domain_only or (item_domain == root_domain or item_domain.endswith("." + root_domain)):
                    if full not in visited_pages and len(pages_to_crawl) < 40:
                        pages_to_crawl.append((full, depth + 1))

    results.sort(key=lambda x: (0 if x["is_file"] else 1, x["category"], x["name"].lower()))
    return True, results


def probe_spider_item_sizes(items, max_workers: int = 8, proxy_url: str = "",
                            callback=None, cancel_event=None):
    """
    Multithreaded 1-byte Range & HEAD prober to fetch exact file sizes for discovered items.
    """
    sess = requests.Session()
    adapter = HTTPAdapter(pool_connections=max_workers, pool_maxsize=max_workers * 2, max_retries=1)
    sess.mount("http://", adapter)
    sess.mount("https://", adapter)
    if proxy_url:
        p = proxy_url if "://" in proxy_url else "http://" + proxy_url
        sess.proxies = {"http": p, "https": p}

    def _worker(idx, it):
        if cancel_event and cancel_event.is_set():
            return
        if it.get("size", 0) > 0:
            return
        url = it["url"]
        sz = 0
        try:
            h = dict(DownloadTask.BROWSER_HEADERS)
            r = sess.head(url, headers=h, allow_redirects=True, timeout=(3.0, 5.0))
            if r.status_code < 400:
                cl = r.headers.get("content-length")
                if cl and cl.isdigit():
                    sz = int(cl)
            if sz <= 0:
                h["Range"] = "bytes=0-0"
                r = sess.get(url, headers=h, stream=True, allow_redirects=True, timeout=(3.0, 6.0))
                cr = r.headers.get("content-range", "")
                if cr and "/" in cr:
                    tot_s = cr.split("/")[1].strip()
                    if tot_s.isdigit():
                        sz = int(tot_s)
                elif r.headers.get("content-length", "").isdigit():
                    sz = int(r.headers.get("content-length"))
                r.close()
        except Exception:
            pass

        if sz > 0:
            it["size"] = sz
            it["size_str"] = fmt_size(sz)
            if callable(callback):
                callback(idx, it)

    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {executor.submit(_worker, i, item): i for i, item in enumerate(items) if item.get("is_file")}
        for future in concurrent.futures.as_completed(futures):
            if cancel_event and cancel_event.is_set():
                break
            try:
                future.result()
            except Exception:
                pass


# ----------------------------------------------------------------------
# 3. Phase 5: Export / Import (.txt, .ef2, .json) & Browser Bridge Server
# ----------------------------------------------------------------------
def export_tasks_to_file(tasks, file_path: str, fmt: str = "txt", settings: dict = None):
    """
    Exports tasks in .txt (URL list), .ef2 (IDM standard format with headers),
    or .json (full NEGM backup). Returns (True, count) or (False, error_msg).
    """
    try:
        fmt = (fmt or "txt").lower().lstrip(".")
        os.makedirs(os.path.dirname(os.path.abspath(file_path)), exist_ok=True)
        if fmt == "txt":
            lines = [t_obj.url for t_obj in tasks if getattr(t_obj, "url", "")]
            with open(file_path, "w", encoding="utf-8") as f:
                f.write("\n".join(lines) + ("\n" if lines else ""))
            return True, len(lines)

        elif fmt == "ef2":
            blocks = []
            for t_obj in tasks:
                u = getattr(t_obj, "url", "")
                if not u:
                    continue
                blk = ["<", u]
                xh = getattr(t_obj, "extra_headers", None) or {}
                if xh.get("Referer"):
                    blk.append(f"referer: {xh['Referer']}")
                if xh.get("Cookie"):
                    blk.append(f"cookie: {xh['Cookie']}")
                if xh.get("User-Agent"):
                    blk.append(f"user-agent: {xh['User-Agent']}")
                blk.append(">")
                blocks.append("\r\n".join(blk))
            with open(file_path, "w", encoding="utf-8", newline="") as f:
                f.write("\r\n".join(blocks) + ("\r\n" if blocks else ""))
            return True, len(blocks)

        elif fmt == "json":
            payload = {
                "app": "Negm Lodaing",
                "version": 5,
                "exported_at": datetime.datetime.now().isoformat(),
                "tasks": [t_obj.to_dict() for t_obj in tasks],
                "settings": dict(settings or {}),
            }
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(payload, f, ensure_ascii=False, indent=2)
            return True, len(tasks)

        return False, f"Unsupported format: {fmt}"
    except Exception as e:
        return False, str(e)[:80]


def parse_import_file(file_path: str):
    """
    Parses .json (NEGM backup), .ef2 (IDM export with Referer/Cookie/User-Agent),
    or .txt (URL list).
    Returns ("backup", dict) or ("links", list_of_link_dicts) or ("error", msg).
    """
    if not file_path or not os.path.isfile(file_path):
        return "error", "File not found"
    try:
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            content = f.read()
        low_ext = os.path.splitext(file_path)[1].lower()

        # 1. JSON Backup
        if low_ext == ".json" or content.lstrip().startswith("{"):
            data = json.loads(content)
            if isinstance(data, dict) and "tasks" in data:
                return "backup", data
            elif isinstance(data, list):
                return "backup", {"tasks": data, "settings": {}}

        # 2. IDM .ef2 Format (< ... > blocks)
        if low_ext == ".ef2" or ("<\nhttp" in content.replace("\r\n", "\n")):
            norm = content.replace("\r\n", "\n")
            items = []
            for m in re.finditer(r"<\s*\n(.*?)\n\s*>", norm, re.DOTALL):
                lines = [ln.strip() for ln in m.group(1).splitlines() if ln.strip()]
                if not lines:
                    continue
                url = lines[0]
                if not url.lower().startswith(("http://", "https://")):
                    continue
                hdrs = {}
                for ln in lines[1:]:
                    if ":" in ln:
                        k, v = ln.split(":", 1)
                        kl = k.strip().lower()
                        val = v.strip()
                        if kl == "referer" and val:
                            hdrs["Referer"] = val
                        elif kl == "cookie" and val:
                            hdrs["Cookie"] = val
                        elif kl == "user-agent" and val:
                            hdrs["User-Agent"] = val
                items.append({"url": url, "headers": hdrs, "filename": ""})
            if items:
                return "links", items

        # 3. Plain text URL list
        urls = list(dict.fromkeys(URL_REGEX.findall(content)))
        return "links", [{"url": u, "headers": {}, "filename": ""} for u in urls]
    except Exception as e:
        return "error", str(e)[:80]


class _SilentThreadingHTTPServer(ThreadingHTTPServer):
    allow_reuse_address = True
    daemon_threads = True


class BrowserBridgeServer:
    """
    Lightweight localhost HTTP bridge (127.0.0.1:45791) receiving downloads,
    cookies, referers, and video/spider triggers from Chrome / Edge / Brave.
    """
    def __init__(self, on_payload_callback, port: int = DEFAULT_BRIDGE_PORT):
        self.on_payload = on_payload_callback
        self.port = int(port or DEFAULT_BRIDGE_PORT)
        self._httpd = None
        self._thread = None
        self.is_running = False

    def start(self) -> bool:
        if self.is_running and self._httpd is not None:
            return True
        bridge = self

        class _BridgeHandler(BaseHTTPRequestHandler):
            def log_message(self, fmt, *args):
                pass

            def _send_cors_headers(self):
                self.send_header("Access-Control-Allow-Origin", "*")
                self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, HEAD")
                self.send_header("Access-Control-Allow-Headers", "*, Content-Type, Authorization, X-Requested-With, Range, Accept")
                self.send_header("Access-Control-Allow-Private-Network", "true")
                self.send_header("Access-Control-Max-Age", "86400")

            def _send_json(self, status_code: int, obj: dict):
                raw = json.dumps(obj, ensure_ascii=False).encode("utf-8")
                self.send_response(status_code)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(raw)))
                self._send_cors_headers()
                self.end_headers()
                self.wfile.write(raw)

            def do_OPTIONS(self):
                self.send_response(204)
                self.send_header("Content-Type", "text/plain")
                self.send_header("Content-Length", "0")
                self._send_cors_headers()
                self.end_headers()

            def do_GET(self):
                if self.path.startswith("/ping") or self.path == "/":
                    self._send_json(200, {
                        "ok": True,
                        "app": "Negm Lodaing",
                        "version": "1.0.0",
                        "status": "online",
                    })
                else:
                    self._send_json(404, {"ok": False, "error": "Not found"})

            def do_POST(self):
                if not self.path.startswith("/add"):
                    self._send_json(404, {"ok": False, "error": "Not found"})
                    return
                try:
                    length = min(262144, int(self.headers.get("Content-Length") or 0))
                    raw_body = self.rfile.read(length).decode("utf-8", errors="replace") if length > 0 else "{}"
                    payload = json.loads(raw_body)
                    url = str(payload.get("url") or "").strip()
                    if not url.startswith(("http://", "https://")):
                        self._send_json(400, {"ok": False, "error": "Invalid URL"})
                        return
                    if bridge.on_payload:
                        bridge.on_payload(payload)
                    self._send_json(200, {"ok": True, "queued": True})
                except Exception as e:
                    self._send_json(500, {"ok": False, "error": str(e)[:60]})

        try:
            self._httpd = _SilentThreadingHTTPServer(("127.0.0.1", self.port), _BridgeHandler)
            self.is_running = True
            self._thread = threading.Thread(target=self._httpd.serve_forever, daemon=True)
            self._thread.start()
            return True
        except Exception as e:
            print("BrowserBridgeServer start error:", e)
            self._httpd = None
            self.is_running = False
            return False

    def stop(self):
        self.is_running = False
        srv = self._httpd
        self._httpd = None
        if srv is not None:
            def _shut():
                try:
                    srv.shutdown()
                    srv.server_close()
                except Exception:
                    pass
            threading.Thread(target=_shut, daemon=True).start()


def extract_domain(url: str) -> str:
    """Extract clean domain/host from URL, stripping port and www prefix."""
    try:
        from urllib.parse import urlparse
        p = urlparse(url if "://" in url else "http://" + url)
        netloc = (p.netloc or "").lower()
        if ":" in netloc:
            netloc = netloc.split(":")[0]
        if netloc.startswith("www."):
            netloc = netloc[4:]
        return netloc or "direct"
    except Exception:
        return "unknown"


class DownloadHistoryManager:
    """
    High-performance thread-safe download history and analytics engine:
    - Persistent JSON storage with atomic writes and auto-rotation (capped at max_entries)
    - Detailed event logging (completed, failed, canceled) with full metadata
    - Dynamic multi-dimension queries: date range (today/week/month/all), status, category, search
    - Aggregated KPI analytics: lifetime, today, 7d, 30d, success rate %, category breakdown, top domains
    - Export engines: CSV (with UTF-8 BOM), JSON, HTML
    """
    def __init__(self, history_file: str = HISTORY_FILE, max_entries: int = 5000):
        self.history_file = history_file
        self.max_entries = max_entries
        self.lock = threading.Lock()
        self.records = self._load()

    def _load(self) -> list:
        try:
            if os.path.exists(self.history_file):
                with open(self.history_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if isinstance(data, list):
                        return data
        except Exception as e:
            print("DownloadHistoryManager load warning:", e)
        return []

    def _save(self):
        try:
            save_json(self.history_file, self.records)
        except Exception as e:
            print("DownloadHistoryManager save error:", e)

    def record_download(self, task, status: str = "completed", error_msg: str = "", duration_sec: float = 0.0) -> dict:
        with self.lock:
            rec_id = hex(int(time.time() * 1000))[2:]
            filename = getattr(task, "filename", "") or "unknown_file"
            url = getattr(task, "url", "") or ""
            save_path = getattr(task, "save_path", "") or ""
            total_size = int(getattr(task, "total_size", 0) or 0)
            down_bytes = int(getattr(task, "net_bytes_downloaded", 0) or total_size)
            if down_bytes <= 0 and status == "completed":
                down_bytes = total_size
            avg_speed = int(down_bytes / max(0.1, duration_sec)) if duration_sec > 0 else int(getattr(task, "current_speed_bps", 0) or 0)
            cat = detect_category(filename)
            queue_name = getattr(task, "queue_id", "main")

            rec = {
                "id": rec_id,
                "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "epoch": time.time(),
                "filename": filename,
                "url": url,
                "domain": extract_domain(url),
                "save_path": save_path,
                "size_bytes": total_size,
                "downloaded_bytes": down_bytes,
                "status": status,
                "category": cat,
                "avg_speed_bps": avg_speed,
                "duration_sec": round(duration_sec, 1),
                "queue_name": queue_name,
                "error_msg": str(error_msg or "")
            }
            self.records.insert(0, rec)
            if len(self.records) > self.max_entries:
                self.records = self.records[:self.max_entries]
            self._save()
            return rec

    def get_records(self, status_filter: str = "all", category_filter: str = "cat_all",
                    search_query: str = "", date_filter: str = "all", limit: int = 500) -> list:
        with self.lock:
            res = list(self.records)
        now = time.time()
        today_start = datetime.datetime.now().replace(hour=0, minute=0, second=0, microsecond=0).timestamp()

        if status_filter and status_filter != "all":
            res = [r for r in res if r.get("status") == status_filter]

        if category_filter and category_filter != "cat_all":
            res = [r for r in res if r.get("category") == category_filter]

        if date_filter == "today":
            res = [r for r in res if r.get("epoch", 0) >= today_start]
        elif date_filter == "week":
            res = [r for r in res if r.get("epoch", 0) >= now - 7 * 86400]
        elif date_filter == "month":
            res = [r for r in res if r.get("epoch", 0) >= now - 30 * 86400]

        if search_query:
            sq = search_query.strip().lower()
            res = [r for r in res if sq in str(r.get("filename", "")).lower()
                   or sq in str(r.get("domain", "")).lower()
                   or sq in str(r.get("url", "")).lower()
                   or sq in str(r.get("error_msg", "")).lower()]

        if limit and len(res) > limit:
            res = res[:limit]
        return res

    def get_summary(self) -> dict:
        with self.lock:
            records = list(self.records)
        total = len(records)
        completed = sum(1 for r in records if r.get("status") == "completed")
        failed = sum(1 for r in records if r.get("status") == "failed")
        canceled = sum(1 for r in records if r.get("status") == "canceled")
        success_rate = (completed / total * 100.0) if total > 0 else 100.0

        today_start = datetime.datetime.now().replace(hour=0, minute=0, second=0, microsecond=0).timestamp()
        now = time.time()

        lifetime_bytes = sum(int(r.get("size_bytes", 0) or r.get("downloaded_bytes", 0) or 0) for r in records if r.get("status") == "completed")
        today_bytes = sum(int(r.get("size_bytes", 0) or r.get("downloaded_bytes", 0) or 0) for r in records if r.get("status") == "completed" and r.get("epoch", 0) >= today_start)
        week_bytes = sum(int(r.get("size_bytes", 0) or r.get("downloaded_bytes", 0) or 0) for r in records if r.get("status") == "completed" and r.get("epoch", 0) >= now - 7 * 86400)
        month_bytes = sum(int(r.get("size_bytes", 0) or r.get("downloaded_bytes", 0) or 0) for r in records if r.get("status") == "completed" and r.get("epoch", 0) >= now - 30 * 86400)

        domains_map = {}
        cat_map = {}
        for r in records:
            d = r.get("domain") or "unknown"
            sz = int(r.get("size_bytes", 0) or r.get("downloaded_bytes", 0) or 0)
            if d not in domains_map:
                domains_map[d] = {"domain": d, "bytes": 0, "count": 0}
            domains_map[d]["bytes"] += sz
            domains_map[d]["count"] += 1

            c = r.get("category") or "type_other"
            if c not in cat_map:
                cat_map[c] = {"bytes": 0, "count": 0}
            cat_map[c]["bytes"] += sz
            cat_map[c]["count"] += 1

        top_domains = sorted(domains_map.values(), key=lambda x: x["bytes"], reverse=True)[:15]

        speeds = [r.get("avg_speed_bps", 0) for r in records if r.get("status") == "completed" and (r.get("avg_speed_bps") or 0) > 0]
        avg_speed = int(sum(speeds) / len(speeds)) if speeds else 0
        peak_speed = max(speeds) if speeds else 0

        return {
            "total_count": total,
            "completed_count": completed,
            "failed_count": failed,
            "canceled_count": canceled,
            "success_rate_pct": round(success_rate, 1),
            "lifetime_bytes": lifetime_bytes,
            "today_bytes": today_bytes,
            "week_bytes": week_bytes,
            "month_bytes": month_bytes,
            "avg_speed_bps": avg_speed,
            "peak_speed_bps": peak_speed,
            "top_domains": top_domains,
            "category_stats": cat_map
        }

    def delete_record(self, record_id: str) -> bool:
        with self.lock:
            orig_len = len(self.records)
            self.records = [r for r in self.records if r.get("id") != record_id]
            if len(self.records) != orig_len:
                self._save()
                return True
            return False

    def clear_history(self) -> bool:
        with self.lock:
            self.records.clear()
            self._save()
            return True

    def export_csv(self, filepath: str, records: list = None) -> bool:
        if records is None:
            records = self.get_records(limit=10000)
        try:
            with open(filepath, "w", encoding="utf-8-sig", newline="") as f:
                writer = csv.writer(f)
                writer.writerow([
                    "Timestamp", "Filename", "Category", "Size (Bytes)", "Formatted Size",
                    "Status", "Duration (s)", "Avg Speed (B/s)", "Formatted Speed",
                    "Domain", "URL", "Queue", "Error"
                ])
                for r in records:
                    sz = int(r.get("size_bytes", 0) or 0)
                    spd = int(r.get("avg_speed_bps", 0) or 0)
                    writer.writerow([
                        r.get("timestamp", ""),
                        r.get("filename", ""),
                        r.get("category", ""),
                        sz,
                        fmt_size(sz),
                        r.get("status", ""),
                        f"{r.get('duration_sec', 0.0):.1f}",
                        spd,
                        fmt_speed(spd),
                        r.get("domain", ""),
                        r.get("url", ""),
                        r.get("queue_name", ""),
                        r.get("error_msg", "")
                    ])
            return True
        except Exception as e:
            print("Export CSV error:", e)
            return False

    def export_json(self, filepath: str, records: list = None) -> bool:
        if records is None:
            records = self.get_records(limit=10000)
        try:
            payload = {
                "app": "Negm Lodaing",
                "version": "5.1.0",
                "exported_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "total_records": len(records),
                "summary": self.get_summary(),
                "records": records
            }
            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(payload, f, ensure_ascii=False, indent=2)
            return True
        except Exception as e:
            print("Export JSON error:", e)
            return False

    def export_html(self, filepath: str, records: list = None, title: str = "NegmLoading Analytics & History Report") -> bool:
        if records is None:
            records = self.get_records(limit=10000)
        summary = self.get_summary()
        try:
            rows_html = []
            for idx, r in enumerate(records, 1):
                st = r.get("status", "")
                badge_cls = "badge-ok" if st == "completed" else "badge-fail"
                sz = int(r.get("size_bytes", 0) or 0)
                spd = int(r.get("avg_speed_bps", 0) or 0)
                dur = f"{r.get('duration_sec', 0.0):.1f}s"
                fn = r.get("filename", "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                dm = r.get("domain", "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                rows_html.append(f"""
                <tr>
                    <td class="text-muted">{idx}</td>
                    <td>{r.get('timestamp', '')}</td>
                    <td class="fn font-bold">{fn}</td>
                    <td><span class="tag">{r.get('category', '')}</span></td>
                    <td>{fmt_size(sz)}</td>
                    <td><span class="badge {badge_cls}">{st}</span></td>
                    <td>{fmt_speed(spd)}</td>
                    <td>{dur}</td>
                    <td>{dm}</td>
                </tr>""")

            domain_rows = []
            tot_bytes = max(1, summary.get("lifetime_bytes", 0))
            for d in summary.get("top_domains", [])[:10]:
                pct = (d["bytes"] / tot_bytes) * 100.0
                dm_clean = d['domain'].replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                domain_rows.append(f"""
                <div class="domain-item">
                    <div class="domain-info">
                        <span class="domain-name font-bold">{dm_clean}</span>
                        <span class="text-muted">{d['count']} files &bull; {fmt_size(d['bytes'])}</span>
                    </div>
                    <div class="bar-wrap">
                        <div class="bar" style="width: {pct:.1f}%"></div>
                    </div>
                </div>""")

            html = f"""<!DOCTYPE html>
<html lang="ar" dir="auto">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<style>
:root {{
    --bg: #0b0e17; --card: #161b2e; --card-alt: #1c233b; --text: #f8fafc;
    --text-muted: #94a3b8; --border: #252f4d; --primary: #4f46e5;
    --accent: #22d3ee; --success: #34d399; --danger: #f87171; --warning: #fbbf24;
}}
@media (prefers-color-scheme: light) {{
    :root {{
        --bg: #f1f5f9; --card: #ffffff; --card-alt: #f8fafc; --text: #0f172a;
        --text-muted: #475569; --border: #d5deec; --primary: #3653d9;
        --accent: #0b5d7a; --success: #065f46; --danger: #b91c1c; --warning: #92400e;
    }}
}}
body {{
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    background: var(--bg); color: var(--text); margin: 0; padding: 24px;
    line-height: 1.5;
}}
.container {{ max-width: 1200px; margin: 0 auto; }}
.header {{ display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--border); padding-bottom: 16px; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }}
.header h1 {{ margin: 0; font-size: 24px; color: var(--accent); }}
.meta {{ font-size: 13px; color: var(--text-muted); }}
.kpi-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px; }}
.kpi-card {{ background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 16px 20px; }}
.kpi-title {{ font-size: 12px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; margin-bottom: 6px; }}
.kpi-val {{ font-size: 26px; font-weight: 700; color: var(--text); }}
.kpi-sub {{ font-size: 12px; color: var(--text-muted); margin-top: 4px; }}
.sec-card {{ background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 20px; margin-bottom: 24px; }}
.sec-title {{ font-size: 16px; font-weight: 700; color: var(--text); margin-top: 0; margin-bottom: 16px; border-bottom: 1px solid var(--border); padding-bottom: 8px; }}
.domain-item {{ margin-bottom: 12px; }}
.domain-info {{ display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px; }}
.bar-wrap {{ background: var(--card-alt); height: 8px; border-radius: 4px; overflow: hidden; }}
.bar {{ background: var(--accent); height: 100%; border-radius: 4px; }}
.table-wrap {{ overflow-x: auto; }}
table {{ width: 100%; border-collapse: collapse; text-align: start; font-size: 13px; }}
th {{ background: var(--card-alt); color: var(--text-muted); font-weight: 600; padding: 10px 12px; border-bottom: 1px solid var(--border); }}
td {{ padding: 10px 12px; border-bottom: 1px solid var(--border); }}
tr:hover {{ background: var(--card-alt); }}
.font-bold {{ font-weight: 600; }}
.text-muted {{ color: var(--text-muted); }}
.badge {{ display: inline-block; padding: 3px 8px; border-radius: 9999px; font-size: 11px; font-weight: 600; text-transform: uppercase; }}
.badge-ok {{ background: rgba(52, 211, 153, 0.15); color: var(--success); }}
.badge-fail {{ background: rgba(248, 113, 113, 0.15); color: var(--danger); }}
.tag {{ display: inline-block; padding: 2px 6px; border-radius: 4px; background: var(--card-alt); font-size: 11px; color: var(--text-muted); }}
.fn {{ max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }}
</style>
</head>
<body>
<div class="container">
    <div class="header">
        <div>
            <h1>Negm Lodaing &#9889; Analytics & History Report</h1>
            <div class="meta">Exported: {datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")} &bull; Records: {len(records)}</div>
        </div>
    </div>

    <div class="kpi-grid">
        <div class="kpi-card">
            <div class="kpi-title">Total Transferred</div>
            <div class="kpi-val">{fmt_size(summary.get('lifetime_bytes', 0))}</div>
            <div class="kpi-sub">Today: {fmt_size(summary.get('today_bytes', 0))}</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-title">Completed Tasks</div>
            <div class="kpi-val">{summary.get('completed_count', 0)} / {summary.get('total_count', 0)}</div>
            <div class="kpi-sub">Success Rate: {summary.get('success_rate_pct', 100.0)}%</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-title">Peak Speed</div>
            <div class="kpi-val">{fmt_speed(summary.get('peak_speed_bps', 0))}</div>
            <div class="kpi-sub">Avg: {fmt_speed(summary.get('avg_speed_bps', 0))}</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-title">Failed Tasks</div>
            <div class="kpi-val">{summary.get('failed_count', 0)}</div>
            <div class="kpi-sub">Canceled: {summary.get('canceled_count', 0)}</div>
        </div>
    </div>

    <div class="sec-card">
        <h2 class="sec-title">Top Downloaded Domains</h2>
        {''.join(domain_rows) if domain_rows else '<div class="text-muted">No domain data recorded yet</div>'}
    </div>

    <div class="sec-card">
        <h2 class="sec-title">Download Event Logs ({len(records)} entries)</h2>
        <div class="table-wrap">
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Date & Time</th>
                        <th>Filename</th>
                        <th>Category</th>
                        <th>Size</th>
                        <th>Status</th>
                        <th>Avg Speed</th>
                        <th>Duration</th>
                        <th>Domain</th>
                    </tr>
                </thead>
                <tbody>
                    {''.join(rows_html) if rows_html else '<tr><td colspan="9" class="text-muted" style="text-align:center;padding:24px;">No download records match the filter</td></tr>'}
                </tbody>
            </table>
        </div>
    </div>
</div>
</body>
</html>"""
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(html)
            return True
        except Exception as e:
            print("Export HTML error:", e)
            return False


class ChecksumCalculator:
    """
    High-performance multi-algorithm file integrity hasher:
    - Streaming block processing (1 MB buffers for fast NVMe/SSD throughput)
    - Computes MD5, SHA-1, SHA-256, SHA-512, and CRC32 concurrently in a single pass
    - Progress callback support (bytes_processed, total_bytes, percentage)
    - Abort / cancel token support for smooth UI cancellation
    """
    @staticmethod
    def compute_file_hashes(filepath: str, on_progress: Callable[[int, int, float], None] = None,
                            cancel_token: Callable[[], bool] = None) -> dict:
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"File not found: {filepath}")

        total_size = os.path.getsize(filepath)
        h_md5 = hashlib.md5()
        h_sha1 = hashlib.sha1()
        h_sha256 = hashlib.sha256()
        h_sha512 = hashlib.sha512()
        crc = 0

        read_bytes = 0
        buf_size = 1024 * 1024  # 1 MB chunk

        with open(filepath, "rb") as f:
            while True:
                if cancel_token and cancel_token():
                    return {}
                chunk = f.read(buf_size)
                if not chunk:
                    break
                h_md5.update(chunk)
                h_sha1.update(chunk)
                h_sha256.update(chunk)
                h_sha512.update(chunk)
                crc = zlib.crc32(chunk, crc)

                read_bytes += len(chunk)
                if on_progress and total_size > 0:
                    on_progress(read_bytes, total_size, min(100.0, (read_bytes / total_size) * 100.0))

        crc_hex = format(crc & 0xFFFFFFFF, "08x")

        return {
            "size": total_size,
            "MD5": h_md5.hexdigest().lower(),
            "SHA-1": h_sha1.hexdigest().lower(),
            "SHA-256": h_sha256.hexdigest().lower(),
            "SHA-512": h_sha512.hexdigest().lower(),
            "CRC32": crc_hex.lower()
        }


class ProxyManager:
    """
    Advanced Multi-Proxy Configuration & Latency Testing Manager:
    - Supports HTTP, HTTPS, SOCKS4, and SOCKS5 proxies
    - Stores multi-proxy presets (Work, Home, VPN, US/EU Datacenter)
    - Background latency/ping measurement to verify endpoint health
    - Global active proxy toggle with seamless fallback to direct connection
    """
    def __init__(self, storage_file: str = PROXIES_FILE):
        self.storage_file = storage_file
        self.lock = threading.Lock()
        self.proxies = self._load()

    def _load(self) -> list:
        try:
            if os.path.exists(self.storage_file):
                with open(self.storage_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if isinstance(data, list):
                        return data
        except Exception as e:
            print("ProxyManager load warning:", e)
        return []

    def _save(self):
        try:
            save_json(self.storage_file, self.proxies)
        except Exception as e:
            print("ProxyManager save error:", e)

    def get_all_proxies(self) -> list:
        with self.lock:
            return list(self.proxies)

    def add_proxy(self, name: str, protocol: str = "http", host: str = "",
                  port: int = 8080, username: str = "", password: str = "", is_active: bool = False) -> dict:
        with self.lock:
            p_id = hex(int(time.time() * 1000))[2:]
            if is_active:
                for p in self.proxies:
                    p["is_active"] = False
            rec = {
                "id": p_id,
                "name": name.strip() or f"{host}:{port}",
                "protocol": protocol.strip().lower(),
                "host": host.strip(),
                "port": int(port or 8080),
                "username": username.strip(),
                "password": password.strip(),
                "is_active": bool(is_active),
                "latency_ms": -1,
                "last_tested": "",
                "public_ip": ""
            }
            self.proxies.append(rec)
            self._save()
            return rec

    def update_proxy(self, proxy_id: str, **kwargs) -> bool:
        with self.lock:
            for p in self.proxies:
                if p.get("id") == proxy_id:
                    if kwargs.get("is_active"):
                        for other in self.proxies:
                            other["is_active"] = False
                    p.update(kwargs)
                    self._save()
                    return True
        return False

    def delete_proxy(self, proxy_id: str) -> bool:
        with self.lock:
            orig = len(self.proxies)
            self.proxies = [p for p in self.proxies if p.get("id") != proxy_id]
            if len(self.proxies) != orig:
                self._save()
                return True
        return False

    def set_active_proxy(self, proxy_id: Optional[str]) -> bool:
        with self.lock:
            for p in self.proxies:
                p["is_active"] = (p.get("id") == proxy_id) if proxy_id else False
            self._save()
            return True

    def get_active_proxy_url(self) -> str:
        with self.lock:
            for p in self.proxies:
                if p.get("is_active"):
                    proto = p.get("protocol", "http")
                    h = p.get("host", "")
                    pt = p.get("port", 8080)
                    u = p.get("username", "")
                    pwd = p.get("password", "")
                    if u and pwd:
                        from urllib.parse import quote
                        return f"{proto}://{quote(u)}:{quote(pwd)}@{h}:{pt}"
                    elif u:
                        from urllib.parse import quote
                        return f"{proto}://{quote(u)}@{h}:{pt}"
                    return f"{proto}://{h}:{pt}"
        return ""

    @staticmethod
    def test_proxy_connection(proxy_dict: dict, timeout: float = 6.0) -> tuple[bool, int, str]:
        """
        Measures proxy latency (round-trip ping in milliseconds) and queries public exit IP.
        Returns (is_ok: bool, latency_ms: int, exit_ip_or_err: str).
        """
        import requests
        proto = proxy_dict.get("protocol", "http")
        h = proxy_dict.get("host", "")
        pt = proxy_dict.get("port", 8080)
        u = proxy_dict.get("username", "")
        pwd = proxy_dict.get("password", "")
        if u and pwd:
            from urllib.parse import quote
            proxy_url = f"{proto}://{quote(u)}:{quote(pwd)}@{h}:{pt}"
        elif u:
            from urllib.parse import quote
            proxy_url = f"{proto}://{quote(u)}@{h}:{pt}"
        else:
            proxy_url = f"{proto}://{h}:{pt}"

        t0 = time.perf_counter()
        try:
            proxies = {"http": proxy_url, "https": proxy_url}
            resp = requests.get("https://httpbin.org/ip", proxies=proxies, timeout=timeout)
            elapsed = int((time.perf_counter() - t0) * 1000)
            if resp.status_code == 200:
                try:
                    ip = resp.json().get("origin", "Connected")
                except Exception:
                    ip = "Connected"
                return True, elapsed, ip
            return False, elapsed, f"HTTP {resp.status_code}"
        except Exception as e:
            elapsed = int((time.perf_counter() - t0) * 1000)
            return False, elapsed, str(e)[:55]


class SiteCredentialVault:
    """
    Site-Specific Authentication & Cookie Session Vault:
    - Automatic domain-matching for HTTP Basic, Bearer Tokens, and Cookies
    - Seamless header injection into DownloadTask for premium filehosters (Rapidgator, 1fichier, Mega, etc.)
    - Stores credentials securely in user data directory
    """
    def __init__(self, storage_file: str = CREDENTIALS_FILE):
        self.storage_file = storage_file
        self.lock = threading.Lock()
        self.credentials = self._load()

    def _load(self) -> list:
        try:
            if os.path.exists(self.storage_file):
                with open(self.storage_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if isinstance(data, list):
                        return data
        except Exception as e:
            print("SiteCredentialVault load warning:", e)
        return []

    def _save(self):
        try:
            save_json(self.storage_file, self.credentials)
        except Exception as e:
            print("SiteCredentialVault save error:", e)

    def get_all_credentials(self) -> list:
        with self.lock:
            return list(self.credentials)

    def add_credential(self, domain: str, auth_type: str = "basic",
                       username: str = "", password: str = "", token: str = "",
                       cookies: str = "", headers: dict = None, notes: str = "") -> dict:
        with self.lock:
            c_id = hex(int(time.time() * 1000))[2:]
            clean_dom = domain.strip().lower()
            if clean_dom.startswith("www."):
                clean_dom = clean_dom[4:]
            rec = {
                "id": c_id,
                "domain": clean_dom,
                "auth_type": auth_type.strip().lower(),
                "username": username.strip(),
                "password": password.strip(),
                "token": token.strip(),
                "cookies": cookies.strip(),
                "headers": headers or {},
                "notes": notes.strip()
            }
            self.credentials.append(rec)
            self._save()
            return rec

    def update_credential(self, cred_id: str, **kwargs) -> bool:
        with self.lock:
            for c in self.credentials:
                if c.get("id") == cred_id:
                    c.update(kwargs)
                    if "domain" in kwargs:
                        d = str(kwargs["domain"]).strip().lower()
                        if d.startswith("www."):
                            d = d[4:]
                        c["domain"] = d
                    self._save()
                    return True
        return False

    def delete_credential(self, cred_id: str) -> bool:
        with self.lock:
            orig = len(self.credentials)
            self.credentials = [c for c in self.credentials if c.get("id") != cred_id]
            if len(self.credentials) != orig:
                self._save()
                return True
        return False

    def get_headers_for_url(self, url: str) -> dict:
        d = extract_domain(url).lower()
        hdrs = {}
        with self.lock:
            creds = list(self.credentials)
        for c in creds:
            cd = c.get("domain", "").lower()
            if cd == "*" or cd == d or d.endswith("." + cd):
                at = c.get("auth_type", "basic")
                if at == "basic":
                    u = c.get("username", "")
                    p = c.get("password", "")
                    if u or p:
                        token = base64.b64encode(f"{u}:{p}".encode("utf-8")).decode("ascii")
                        hdrs["Authorization"] = f"Basic {token}"
                elif at == "bearer":
                    tok = c.get("token", "")
                    if tok:
                        hdrs["Authorization"] = f"Bearer {tok}"
                ck = c.get("cookies", "")
                if ck:
                    hdrs["Cookie"] = ck
                if c.get("headers"):
                    hdrs.update(c.get("headers"))
                break
        return hdrs


_GLOBAL_PROXY_MANAGER = None
_GLOBAL_CREDENTIAL_VAULT = None

def get_default_proxy_manager() -> ProxyManager:
    global _GLOBAL_PROXY_MANAGER
    if _GLOBAL_PROXY_MANAGER is None:
        _GLOBAL_PROXY_MANAGER = ProxyManager()
    return _GLOBAL_PROXY_MANAGER

def get_default_credential_vault() -> SiteCredentialVault:
    global _GLOBAL_CREDENTIAL_VAULT
    if _GLOBAL_CREDENTIAL_VAULT is None:
        _GLOBAL_CREDENTIAL_VAULT = SiteCredentialVault()
    return _GLOBAL_CREDENTIAL_VAULT


# ==============================================================================
# PHASE 12: WEB REMOTE DASHBOARD, LAN MOBILE CONTROL & POST-DOWNLOAD AUTOMATION
# ==============================================================================

def get_local_lan_ip() -> str:
    """
    Finds the active local IPv4 address (e.g. 192.168.1.X or 10.X.X.X)
    suitable for LAN mobile access.
    """
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.settimeout(0.5)
        # Connect to a public DNS IP (doesn't send UDP packet)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        if ip and not ip.startswith("127."):
            return ip
    except Exception:
        pass
    try:
        host = socket.gethostname()
        for ip in socket.gethostbyname_ex(host)[2]:
            if not ip.startswith("127.") and ":" not in ip:
                return ip
    except Exception:
        pass
    return "127.0.0.1"


def execute_power_action(action_type: str) -> bool:
    """
    Executes system power management action on Windows:
    - shutdown: shutdown /s /t 60
    - sleep: rundll32.exe powrprof.dll,SetSuspendState 0,1,0
    - hibernate: shutdown /h
    - lock: rundll32.exe user32.dll,LockWorkStation
    """
    cflags = 0x08000000 if hasattr(subprocess, "CREATE_NO_WINDOW") else 0
    act = str(action_type or "").strip().lower()
    try:
        if act == "shutdown":
            subprocess.run(["shutdown", "/s", "/t", "60"], check=False, creationflags=cflags)
            return True
        elif act == "sleep":
            subprocess.run(["rundll32.exe", "powrprof.dll,SetSuspendState", "0,1,0"], check=False, creationflags=cflags)
            return True
        elif act == "hibernate":
            subprocess.run(["shutdown", "/h"], check=False, creationflags=cflags)
            return True
        elif act == "lock":
            subprocess.run(["rundll32.exe", "user32.dll,LockWorkStation"], check=False, creationflags=cflags)
            return True
    except Exception as e:
        print("execute_power_action error:", e)
        return False
    return False


def cancel_pending_shutdown() -> bool:
    """Cancels any scheduled system shutdown (shutdown /a)."""
    cflags = 0x08000000 if hasattr(subprocess, "CREATE_NO_WINDOW") else 0
    try:
        subprocess.run(["shutdown", "/a"], check=False, creationflags=cflags)
        return True
    except Exception:
        return False


def execute_post_completion(task, settings: dict) -> None:
    """
    Executes custom external command and/or webhook upon task completion.
    """
    if not task or not getattr(task, "is_finished", False):
        return

    file_path = getattr(task, "save_path", "")
    filename = getattr(task, "filename", "")
    total_size = getattr(task, "total_size", 0)

    # 1. Custom Command Execution
    cmd_template = str(settings.get("post_command") or "").strip()
    if cmd_template and file_path and os.path.exists(file_path):
        def _run_cmd():
            try:
                cmd = cmd_template.replace("%1", file_path).replace("{file}", file_path)
                cmd = cmd.replace("{filename}", filename).replace("{size}", str(total_size))
                cflags = 0x08000000 if hasattr(subprocess, "CREATE_NO_WINDOW") else 0
                subprocess.run(cmd, shell=True, check=False, creationflags=cflags)
            except Exception as e:
                print("Post-download custom command error:", e)
        threading.Thread(target=_run_cmd, daemon=True).start()

    # 2. Webhook Notification
    webhook_url = str(settings.get("post_webhook") or "").strip()
    if webhook_url.startswith(("http://", "https://")):
        def _send_webhook():
            try:
                payload = {
                    "event": "download_completed",
                    "app": "Negm Lodaing",
                    "filename": filename,
                    "save_path": file_path,
                    "size_bytes": total_size,
                    "size_formatted": fmt_size(total_size),
                    "url": getattr(task, "url", ""),
                    "timestamp": datetime.datetime.now().isoformat()
                }
                if "discord.com" in webhook_url:
                    body = {"content": f"\u2705 **Download Completed:** `{filename}` ({fmt_size(total_size)})"}
                else:
                    body = payload
                requests.post(webhook_url, json=body, timeout=5)
            except Exception as e:
                print("Post-download webhook error:", e)
        threading.Thread(target=_send_webhook, daemon=True).start()


WEB_REMOTE_HTML = """<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>Negm Lodaing Web Remote</title>
<style>
:root {
  --bg: #090d16;
  --card: #131b2e;
  --card-hover: #17223b;
  --border: #1e293b;
  --text: #f8fafc;
  --text-muted: #94a3b8;
  --primary: #6366f1;
  --primary-hover: #4f46e5;
  --cyan: #06b6d4;
  --emerald: #10b981;
  --rose: #ef4444;
  --amber: #f59e0b;
}
* { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; -webkit-tap-highlight-color: transparent; }
body { background: var(--bg); color: var(--text); min-height: 100vh; padding: 16px; display: flex; justify-content: center; }
.container { width: 100%; max-width: 720px; }
.header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--border); }
.brand { display: flex; align-items: center; gap: 10px; font-size: 1.25rem; font-weight: 700; color: #fff; }
.brand-icon { width: 34px; height: 34px; border-radius: 8px; background: linear-gradient(135deg, var(--primary), var(--cyan)); display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; box-shadow: 0 4px 12px rgba(99,102,241,0.3); }
.live-pill { display: flex; align-items: center; gap: 6px; background: rgba(16, 185, 129, 0.12); color: var(--emerald); padding: 4px 10px; border-radius: 999px; font-size: 0.75rem; font-weight: 600; border: 1px solid rgba(16, 185, 129, 0.25); }
.pulse-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--emerald); animation: pulse 2s infinite; }
@keyframes pulse { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.8); } 100% { opacity: 1; transform: scale(1); } }
.lang-btn { background: var(--card); border: 1px solid var(--border); color: var(--text-muted); padding: 6px 12px; border-radius: 8px; font-size: 0.8rem; cursor: pointer; transition: 0.2s; font-weight: 600; }
.lang-btn:hover { color: #fff; border-color: var(--primary); }
.stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; }
.stat-card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 12px; text-align: center; }
.stat-val { font-size: 1.3rem; font-weight: 800; color: #fff; margin-top: 4px; }
.stat-lbl { font-size: 0.75rem; color: var(--text-muted); font-weight: 600; }
.actions-bar { display: flex; gap: 8px; margin-bottom: 16px; }
.btn { border: none; outline: none; border-radius: 10px; padding: 10px 14px; font-weight: 600; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: 0.2s; flex: 1; text-align: center; }
.btn-primary { background: linear-gradient(135deg, var(--primary), #4f46e5); color: #fff; box-shadow: 0 4px 12px rgba(99,102,241,0.25); }
.btn-primary:hover { opacity: 0.95; transform: translateY(-1px); }
.btn-subtle { background: var(--card); border: 1px solid var(--border); color: var(--text); }
.btn-subtle:hover { background: var(--card-hover); border-color: var(--text-muted); }
.btn-danger { background: rgba(239, 68, 68, 0.15); color: var(--rose); border: 1px solid rgba(239, 68, 68, 0.3); }
.btn-danger:hover { background: rgba(239, 68, 68, 0.25); }
.btn-sm { padding: 6px 10px; font-size: 0.75rem; border-radius: 6px; flex: initial; }
.tasks-container { display: flex; flex-direction: column; gap: 10px; }
.task-card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 12px 14px; transition: 0.2s; }
.task-card:hover { border-color: rgba(99, 102, 241, 0.3); }
.task-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; gap: 8px; }
.task-title { font-weight: 700; font-size: 0.9rem; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
.badge { font-size: 0.7rem; font-weight: 700; padding: 3px 8px; border-radius: 6px; text-transform: uppercase; }
.badge-active { background: rgba(6, 182, 212, 0.15); color: var(--cyan); border: 1px solid rgba(6, 182, 212, 0.3); }
.badge-completed { background: rgba(16, 185, 129, 0.15); color: var(--emerald); border: 1px solid rgba(16, 185, 129, 0.3); }
.badge-paused { background: rgba(245, 158, 11, 0.15); color: var(--amber); border: 1px solid rgba(245, 158, 11, 0.3); }
.badge-failed { background: rgba(239, 68, 68, 0.15); color: var(--rose); border: 1px solid rgba(239, 68, 68, 0.3); }
.prog-track { width: 100%; height: 7px; background: rgba(255, 255, 255, 0.08); border-radius: 999px; overflow: hidden; margin-bottom: 8px; }
.prog-fill { height: 100%; background: linear-gradient(90deg, var(--primary), var(--cyan)); border-radius: 999px; transition: width 0.3s ease; }
.prog-fill.completed { background: var(--emerald); }
.task-meta { display: flex; align-items: center; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 10px; }
.task-actions { display: flex; gap: 6px; justify-content: flex-end; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 8px; }
.empty-state { text-align: center; padding: 48px 16px; color: var(--text-muted); background: var(--card); border-radius: 12px; border: 1px dashed var(--border); }
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); display: none; align-items: center; justify-content: center; padding: 16px; z-index: 999; }
.modal-overlay.open { display: flex; }
.modal { background: var(--card); border: 1px solid var(--border); border-radius: 16px; width: 100%; max-width: 480px; padding: 20px; box-shadow: 0 16px 32px rgba(0,0,0,0.5); }
.modal-header { font-size: 1.1rem; font-weight: 800; color: #fff; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; }
.input-group { margin-bottom: 12px; }
.input-lbl { font-size: 0.75rem; font-weight: 600; color: var(--text-muted); margin-bottom: 6px; display: block; }
.input-txt { width: 100%; background: rgba(0,0,0,0.25); border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px; color: #fff; font-size: 0.85rem; outline: none; transition: 0.2s; }
.input-txt:focus { border-color: var(--primary); box-shadow: 0 0 0 2px rgba(99,102,241,0.25); }
.login-box { background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 32px 24px; text-align: center; max-width: 400px; margin: 40px auto; }
.toast-notice { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: #1e293b; color: #fff; padding: 10px 18px; border-radius: 8px; font-size: 0.85rem; box-shadow: 0 6px 16px rgba(0,0,0,0.4); display: none; z-index: 1000; font-weight: 600; border: 1px solid var(--primary); }
</style>
</head>
<body>
<div class="container" id="appRoot">
  <!-- Top Header -->
  <div class="header">
    <div class="brand">
      <div class="brand-icon">N</div>
      <span>Negm Lodaing</span>
    </div>
    <div style="display:flex; align-items:center; gap:8px;">
      <div class="live-pill"><span class="pulse-dot"></span><span id="txtLive">LIVE</span></div>
      <button class="lang-btn" id="btnLang" onclick="toggleLang()">EN / عربي</button>
    </div>
  </div>

  <!-- Auth Screen (if token required) -->
  <div id="authScreen" class="login-box" style="display:none;">
    <h2 style="margin-bottom:8px; font-weight:800;" id="tAuthTitle">رمز الحماية (PIN)</h2>
    <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:16px;" id="tAuthDesc">أدخل رمز الدخول المحدد في البرنامج للتحكم</p>
    <div class="input-group">
      <input type="password" id="inputPin" class="input-txt" style="text-align:center; font-size:1.2rem; letter-spacing:4px;" placeholder="••••" />
    </div>
    <button class="btn btn-primary" style="width:100%;" onclick="submitPin()" id="tBtnConnect">اتصال بالخادم</button>
  </div>

  <!-- Dashboard Main View -->
  <div id="dashView">
    <!-- Stats Row -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-lbl" id="tStatSpeed">سرعة التحميل</div>
        <div class="stat-val" id="valSpeed" style="color:var(--cyan);">0 B/s</div>
      </div>
      <div class="stat-card">
        <div class="stat-lbl" id="tStatActive">نشط حالياً</div>
        <div class="stat-val" id="valActive" style="color:var(--primary);">0</div>
      </div>
      <div class="stat-card">
        <div class="stat-lbl" id="tStatDone">مكتمل</div>
        <div class="stat-val" id="valDone" style="color:var(--emerald);">0</div>
      </div>
    </div>

    <!-- Quick Action Bar -->
    <div class="actions-bar">
      <button class="btn btn-primary" onclick="openAddModal()"><span style="font-size:1.1rem;">+</span> <span id="tBtnAdd">إضافة تحميل</span></button>
      <button class="btn btn-subtle" onclick="sendGlobalAction('pause_all')">⏸ <span id="tBtnPauseAll">إيقاف الكل</span></button>
      <button class="btn btn-subtle" onclick="sendGlobalAction('resume_all')">▶ <span id="tBtnResumeAll">استئناف الكل</span></button>
    </div>

    <!-- Downloads Tasks List -->
    <div class="tasks-container" id="tasksList">
      <div class="empty-state" id="tEmptyState">لا توجد تحميلات نشطة حالياً</div>
    </div>
  </div>
</div>

<!-- Add Download Modal -->
<div class="modal-overlay" id="addModal">
  <div class="modal">
    <div class="modal-header">
      <span id="tModalTitle">إضافة تحميل جديد</span>
      <span style="cursor:pointer; color:var(--text-muted);" onclick="closeAddModal()">✕</span>
    </div>
    <div class="input-group">
      <label class="input-lbl" id="tLblUrl">رابط الملف (URL)</label>
      <input type="text" id="addUrl" class="input-txt" placeholder="https://example.com/file.zip" />
    </div>
    <div class="input-group">
      <label class="input-lbl" id="tLblName">اسم الحفظ (اختياري)</label>
      <input type="text" id="addName" class="input-txt" placeholder="file.zip" />
    </div>
    <div class="input-group">
      <label class="input-lbl" id="tLblChunks">عدد المسارات (Connections)</label>
      <select id="addChunks" class="input-txt">
        <option value="1">1</option>
        <option value="4">4</option>
        <option value="8" selected>8</option>
        <option value="16">16</option>
        <option value="32">32</option>
      </select>
    </div>
    <div style="display:flex; gap:8px; margin-top:16px;">
      <button class="btn btn-primary" onclick="submitAddDownload()" id="tBtnStartDl">بدء التحميل</button>
      <button class="btn btn-subtle" onclick="closeAddModal()" id="tBtnCancelDl">إلغاء</button>
    </div>
  </div>
</div>

<div class="toast-notice" id="toastNotice"></div>

<script>
let currentLang = 'ar';
let token = new URLSearchParams(window.location.search).get('token') || localStorage.getItem('negm_token') || '';

const I18N = {
  ar: {
    live: 'نشط',
    authTitle: 'رمز الحماية (PIN)',
    authDesc: 'أدخل رمز الدخول المحدد في البرنامج للتحكم',
    btnConnect: 'اتصال بالخادم',
    statSpeed: 'سرعة التحميل',
    statActive: 'نشط حالياً',
    statDone: 'مكتمل',
    btnAdd: 'إضافة تحميل',
    btnPauseAll: 'إيقاف الكل',
    btnResumeAll: 'استئناف الكل',
    emptyState: 'لا توجد تحميلات نشطة حالياً',
    modalTitle: 'إضافة تحميل جديد',
    lblUrl: 'رابط الملف (URL)',
    lblName: 'اسم الحفظ (اختياري)',
    lblChunks: 'عدد المسارات (Connections)',
    btnStartDl: 'بدء التحميل',
    btnCancelDl: 'إلغاء',
    pause: 'إيقاف',
    resume: 'استئناف',
    cancel: 'حذف',
    stActive: 'جارٍ التحميل',
    stCompleted: 'مكتمل',
    stPaused: 'متوقف',
    stFailed: 'خطأ',
    addedSuccess: 'تمت إضافة التحميل بنجاح!'
  },
  en: {
    live: 'LIVE',
    authTitle: 'Security PIN',
    authDesc: 'Enter access token configured in NegmLoading',
    btnConnect: 'Connect',
    statSpeed: 'Download Speed',
    statActive: 'Active Tasks',
    statDone: 'Completed',
    btnAdd: 'Add Download',
    btnPauseAll: 'Pause All',
    btnResumeAll: 'Resume All',
    emptyState: 'No active downloads at the moment',
    modalTitle: 'Add New Download',
    lblUrl: 'Download URL',
    lblName: 'Filename (Optional)',
    lblChunks: 'Connections / Segments',
    btnStartDl: 'Start Download',
    btnCancelDl: 'Cancel',
    pause: 'Pause',
    resume: 'Resume',
    cancel: 'Cancel',
    stActive: 'Downloading',
    stCompleted: 'Completed',
    stPaused: 'Paused',
    stFailed: 'Failed',
    addedSuccess: 'Download added successfully!'
  }
};

function t(k) { return I18N[currentLang][k] || k; }

function applyLang() {
  document.documentElement.dir = (currentLang === 'ar') ? 'rtl' : 'ltr';
  document.documentElement.lang = currentLang;
  document.getElementById('txtLive').textContent = t('live');
  document.getElementById('tAuthTitle').textContent = t('authTitle');
  document.getElementById('tAuthDesc').textContent = t('authDesc');
  document.getElementById('tBtnConnect').textContent = t('btnConnect');
  document.getElementById('tStatSpeed').textContent = t('statSpeed');
  document.getElementById('tStatActive').textContent = t('statActive');
  document.getElementById('tStatDone').textContent = t('statDone');
  document.getElementById('tBtnAdd').textContent = t('btnAdd');
  document.getElementById('tBtnPauseAll').textContent = t('btnPauseAll');
  document.getElementById('tBtnResumeAll').textContent = t('btnResumeAll');
  document.getElementById('tEmptyState').textContent = t('emptyState');
  document.getElementById('tModalTitle').textContent = t('modalTitle');
  document.getElementById('tLblUrl').textContent = t('lblUrl');
  document.getElementById('tLblName').textContent = t('lblName');
  document.getElementById('tLblChunks').textContent = t('lblChunks');
  document.getElementById('tBtnStartDl').textContent = t('btnStartDl');
  document.getElementById('tBtnCancelDl').textContent = t('btnCancelDl');
  document.getElementById('btnLang').textContent = (currentLang === 'ar') ? 'EN' : 'عربي';
}

function toggleLang() {
  currentLang = (currentLang === 'ar') ? 'en' : 'ar';
  applyLang();
  poll();
}

function showToast(msg) {
  const el = document.getElementById('toastNotice');
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 2500);
}

function checkAuth(callback) {
  fetch('/api/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: token })
  })
  .then(res => res.json())
  .then(data => {
    if (data.ok) {
      document.getElementById('authScreen').style.display = 'none';
      document.getElementById('dashView').style.display = 'block';
      if (callback) callback();
    } else {
      document.getElementById('authScreen').style.display = 'block';
      document.getElementById('dashView').style.display = 'none';
    }
  })
  .catch(() => {
    document.getElementById('authScreen').style.display = 'block';
    document.getElementById('dashView').style.display = 'none';
  });
}

function submitPin() {
  const p = document.getElementById('inputPin').value.trim();
  token = p;
  localStorage.setItem('negm_token', p);
  checkAuth(() => poll());
}

function poll() {
  if (document.getElementById('authScreen').style.display === 'block') return;

  fetch(`/api/status?token=${encodeURIComponent(token)}`)
    .then(r => {
      if (r.status === 401) { checkAuth(); throw new Error('401'); }
      return r.json();
    })
    .then(st => {
      document.getElementById('valSpeed').textContent = st.speed_str || '0 B/s';
      document.getElementById('valActive').textContent = st.active_count || 0;
      document.getElementById('valDone').textContent = st.completed_count || 0;
    })
    .catch(() => {});

  fetch(`/api/tasks?token=${encodeURIComponent(token)}`)
    .then(r => r.json())
    .then(res => {
      if (!res.ok) return;
      renderTasks(res.tasks || []);
    })
    .catch(() => {});
}

function renderTasks(tasks) {
  const container = document.getElementById('tasksList');
  if (!tasks || tasks.length === 0) {
    container.innerHTML = `<div class="empty-state">${t('emptyState')}</div>`;
    return;
  }
  let html = '';
  tasks.forEach(tItem => {
    let badgeClass = 'badge-active';
    let statusTxt = t('stActive');
    if (tItem.status === 'completed') { badgeClass = 'badge-completed'; statusTxt = t('stCompleted'); }
    else if (tItem.status === 'paused') { badgeClass = 'badge-paused'; statusTxt = t('stPaused'); }
    else if (tItem.status === 'failed') { badgeClass = 'badge-failed'; statusTxt = t('stFailed'); }

    const isDone = (tItem.status === 'completed');
    const isPaused = (tItem.status === 'paused');
    const fillClass = isDone ? 'prog-fill completed' : 'prog-fill';

    html += `
      <div class="task-card">
        <div class="task-top">
          <div class="task-title" title="${tItem.name}">${tItem.name}</div>
          <span class="badge ${badgeClass}">${statusTxt}</span>
        </div>
        <div class="prog-track"><div class="${fillClass}" style="width:${tItem.progress}%;"></div></div>
        <div class="task-meta">
          <span>${tItem.downloaded} / ${tItem.size} (${tItem.progress}%)</span>
          <span>${tItem.speed} • ETA: ${tItem.eta}</span>
        </div>
        <div class="task-actions">
          ${!isDone ? `
            <button class="btn btn-subtle btn-sm" onclick="sendTaskAction('${isPaused ? 'resume' : 'pause'}', '${tItem.id}')">
              ${isPaused ? '▶ ' + t('resume') : '⏸ ' + t('pause')}
            </button>
          ` : ''}
          <button class="btn btn-danger btn-sm" onclick="sendTaskAction('cancel', '${tItem.id}')">✕ ${t('cancel')}</button>
        </div>
      </div>
    `;
  });
  container.innerHTML = html;
}

function sendGlobalAction(action) {
  fetch('/api/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: token, action: action })
  }).then(() => poll());
}

function sendTaskAction(action, taskId) {
  fetch('/api/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: token, action: action, task_id: taskId })
  }).then(() => poll());
}

function openAddModal() {
  document.getElementById('addModal').classList.add('open');
  document.getElementById('addUrl').focus();
}

function closeAddModal() {
  document.getElementById('addModal').classList.remove('open');
}

function submitAddDownload() {
  const url = document.getElementById('addUrl').value.trim();
  const name = document.getElementById('addName').value.trim();
  const chunks = parseInt(document.getElementById('addChunks').value || 8);
  if (!url) return;

  fetch('/api/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: token, url: url, filename: name, chunks: chunks })
  })
  .then(r => r.json())
  .then(res => {
    if (res.ok) {
      closeAddModal();
      document.getElementById('addUrl').value = '';
      document.getElementById('addName').value = '';
      showToast(t('addedSuccess'));
      poll();
    } else {
      alert(res.error || 'Failed to add download');
    }
  });
}

// Initial setup & polling loop
applyLang();
checkAuth(() => {
  poll();
  setInterval(poll, 1500);
});
</script>
</body>
</html>
"""


class WebRemoteServer:
    """
    Lightweight, high-performance HTTP Web Remote Control server (default port 45792).
    Allows controlling NegmLoading from mobile phones, tablets, or LAN browsers.
    Zero external dependencies, purely embedded responsive HTML5/CSS3/ES6 SPA.
    """
    def __init__(self, app_manager, port: int = 45792, token: str = "", allow_lan: bool = True):
        self.app = app_manager
        self.port = int(port or 45792)
        self.token = str(token or "").strip()
        self.allow_lan = bool(allow_lan)
        self._httpd = None
        self._thread = None
        self.is_running = False

    def get_lan_ip(self) -> str:
        return get_local_lan_ip()

    def get_access_url(self) -> str:
        ip = self.get_lan_ip() if self.allow_lan else "127.0.0.1"
        tok_param = f"?token={self.token}" if self.token else ""
        return f"http://{ip}:{self.port}/{tok_param}"

    def start(self) -> bool:
        if self.is_running and self._httpd is not None:
            return True
        server_instance = self
        bind_host = "0.0.0.0" if self.allow_lan else "127.0.0.1"

        class _RemoteHandler(BaseHTTPRequestHandler):
            def log_message(self, fmt, *args):
                pass

            def _send_json(self, status_code: int, obj: dict):
                raw = json.dumps(obj, ensure_ascii=False).encode("utf-8")
                self.send_response(status_code)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(raw)))
                self.send_header("Access-Control-Allow-Origin", "*")
                self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
                self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
                self.end_headers()
                self.wfile.write(raw)

            def _send_html(self, html_str: str):
                raw = html_str.encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Content-Length", str(len(raw)))
                self.end_headers()
                self.wfile.write(raw)

            def _is_authenticated(self, query_params: dict, body_dict: dict = None) -> bool:
                if not server_instance.token:
                    return True
                auth_hdr = self.headers.get("Authorization", "")
                if auth_hdr.startswith("Bearer "):
                    if auth_hdr[7:].strip() == server_instance.token:
                        return True
                if query_params.get("token", [""])[0] == server_instance.token:
                    return True
                if body_dict and body_dict.get("token") == server_instance.token:
                    return True
                return False

            def do_OPTIONS(self):
                self._send_json(200, {"ok": True})

            def do_GET(self):
                parsed = urllib.parse.urlparse(self.path)
                params = urllib.parse.parse_qs(parsed.query)

                if parsed.path in ("/", "/index.html"):
                    self._send_html(WEB_REMOTE_HTML)
                    return

                if not self._is_authenticated(params):
                    self._send_json(401, {"ok": False, "error": "Unauthorized: invalid or missing token"})
                    return

                if parsed.path == "/api/status":
                    speed_bps = 0
                    speed_str = "0 B/s"
                    active_cnt = 0
                    completed_cnt = 0
                    tot_cnt = 0
                    try:
                        tasks = getattr(server_instance.app, "tasks", [])
                        tot_cnt = len(tasks)
                        for it in tasks:
                            t = it.get("task")
                            if t:
                                if t.state in ("active", "running"):
                                    active_cnt += 1
                                    speed_bps += getattr(t, "speed_bps", 0)
                                elif t.is_finished:
                                    completed_cnt += 1
                        speed_str = fmt_speed(speed_bps)
                    except Exception:
                        pass
                    self._send_json(200, {
                        "ok": True,
                        "app": "Negm Lodaing",
                        "version": "5.0",
                        "speed_bps": speed_bps,
                        "speed_str": speed_str,
                        "active_count": active_cnt,
                        "completed_count": completed_cnt,
                        "total_count": tot_cnt,
                        "lan_ip": server_instance.get_lan_ip()
                    })

                elif parsed.path == "/api/tasks":
                    task_list = []
                    try:
                        tasks = getattr(server_instance.app, "tasks", [])
                        for it in tasks:
                            t = it.get("task")
                            if not t:
                                continue
                            prog = 0.0
                            if t.total_size > 0:
                                prog = round(min(100.0, (t.downloaded_bytes / t.total_size) * 100.0), 1)
                            elif t.is_finished:
                                prog = 100.0
                            eta_str = "--"
                            if t.state == "active" and getattr(t, "speed_bps", 0) > 0 and t.total_size > t.downloaded_bytes:
                                rem = (t.total_size - t.downloaded_bytes) / t.speed_bps
                                eta_str = fmt_eta(rem)
                            st_str = "active" if t.state in ("active", "running") else ("completed" if t.is_finished else ("failed" if t.is_failed else ("paused" if t.is_paused else t.state)))
                            task_list.append({
                                "id": getattr(t, "task_id", ""),
                                "name": getattr(t, "filename", ""),
                                "url": getattr(t, "url", ""),
                                "progress": prog,
                                "speed": fmt_speed(getattr(t, "speed_bps", 0)),
                                "speed_bps": getattr(t, "speed_bps", 0),
                                "size": fmt_size(getattr(t, "total_size", 0)),
                                "size_bytes": getattr(t, "total_size", 0),
                                "downloaded": fmt_size(getattr(t, "downloaded_bytes", 0)),
                                "eta": eta_str,
                                "status": st_str,
                                "category": getattr(t, "category", "type_other"),
                                "status_detail": getattr(t, "status_detail", "")
                            })
                    except Exception:
                        pass
                    self._send_json(200, {"ok": True, "tasks": task_list})
                else:
                    self._send_json(404, {"ok": False, "error": "Not found"})

            def do_POST(self):
                parsed = urllib.parse.urlparse(self.path)
                params = urllib.parse.parse_qs(parsed.query)
                length = min(262144, int(self.headers.get("Content-Length") or 0))
                body = {}
                if length > 0:
                    try:
                        raw = self.rfile.read(length).decode("utf-8", errors="replace")
                        body = json.loads(raw)
                    except Exception:
                        body = {}

                if parsed.path == "/api/verify":
                    tok = body.get("token", "").strip() or params.get("token", [""])[0]
                    valid = (tok == server_instance.token) if server_instance.token else True
                    self._send_json(200, {"ok": valid})
                    return

                if not self._is_authenticated(params, body):
                    self._send_json(401, {"ok": False, "error": "Unauthorized"})
                    return

                if parsed.path == "/api/action":
                    act = str(body.get("action", "")).strip().lower()
                    t_id = str(body.get("task_id", "")).strip()
                    app = server_instance.app

                    if act == "pause_all":
                        app.after(0, app.act_pause_all)
                    elif act == "resume_all":
                        app.after(0, app.act_resume_all)
                    elif act == "pause" and t_id:
                        app.after(0, lambda: app.pause_task_by_id(t_id))
                    elif act == "resume" and t_id:
                        app.after(0, lambda: app.resume_task_by_id(t_id))
                    elif act == "cancel" and t_id:
                        app.after(0, lambda: app.cancel_task_by_id(t_id))
                    else:
                        self._send_json(400, {"ok": False, "error": "Unknown action or missing task_id"})
                        return
                    self._send_json(200, {"ok": True, "action": act})

                elif parsed.path == "/api/add":
                    url = str(body.get("url", "")).strip()
                    filename = str(body.get("filename", "")).strip()
                    chunks = int(body.get("chunks", 8))
                    if not url.startswith(("http://", "https://")):
                        self._send_json(400, {"ok": False, "error": "Invalid URL"})
                        return
                    app = server_instance.app
                    app.after(0, lambda: app.add_download_direct(url, filename=filename, chunks=chunks))
                    self._send_json(200, {"ok": True, "added": True})
                else:
                    self._send_json(404, {"ok": False, "error": "Not found"})

        try:
            self._httpd = _SilentThreadingHTTPServer((bind_host, self.port), _RemoteHandler)
            self.is_running = True
            self._thread = threading.Thread(target=self._httpd.serve_forever, daemon=True)
            self._thread.start()
            return True
        except Exception as e:
            print("WebRemoteServer start error:", e)
            self._httpd = None
            self.is_running = False
            return False

    def stop(self):
        self.is_running = False
        srv = self._httpd
        self._httpd = None
        if srv:
            try:
                threading.Thread(target=srv.shutdown, daemon=True).start()
            except Exception:
                pass


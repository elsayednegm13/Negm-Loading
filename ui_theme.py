"""
================================================================================
  NegmLoading - UI Theme, Design Tokens, Typography & BiDi Engine
================================================================================
"""

import os
import re
import sys
import shutil
import ctypes
import datetime
import urllib.parse
import tkinter as tk
import tkinter.font as tkfont
import customtkinter as ctk
from PIL import Image

import nexus_engine as E
from nexus_engine import PALETTE

t = E.t

BUNDLE_DIR = getattr(sys, "_MEIPASS", os.path.dirname(os.path.abspath(__file__)))
APP_DIR = (
    os.path.dirname(os.path.abspath(sys.executable))
    if getattr(sys, "frozen", False)
    else os.path.dirname(os.path.abspath(__file__))
)


def _asset_path(*parts):
    p_bundle = os.path.join(BUNDLE_DIR, *parts)
    if os.path.exists(p_bundle):
        return p_bundle
    return os.path.join(APP_DIR, *parts)


FONT_PATH = _asset_path("assets", "fonts", "fa-solid-900.ttf")
ICON_ICO_PATH = _asset_path("assets", "negm.ico")
ICON_PNG_PATH = _asset_path("assets", "negm_logo.png")


def apply_window_icon(win):
    if sys.platform == "win32" and os.path.isfile(ICON_ICO_PATH):
        try:
            win.iconbitmap(ICON_ICO_PATH)
        except Exception:
            pass


def resolve_browser_extension_dir() -> str:
    """Returns a persistent unpacked extension folder (extracting from bundle if running as standalone .exe)."""
    beside_exe = os.path.join(APP_DIR, "browser_extension")
    if os.path.isfile(os.path.join(beside_exe, "manifest.json")):
        return beside_exe
    persistent_ext = os.path.join(E.DATA_DIR, "browser_extension")
    bundled_ext = os.path.join(BUNDLE_DIR, "browser_extension")
    if os.path.isdir(bundled_ext) and not os.path.isfile(os.path.join(persistent_ext, "manifest.json")):
        try:
            shutil.copytree(bundled_ext, persistent_ext, dirs_exist_ok=True)
        except Exception:
            pass
    if os.path.isdir(persistent_ext):
        return persistent_ext
    return beside_exe


# Extended Design Tokens
PALETTE.update({
    "pill_idle": ("#e2e8f0", "#222b45"),
    "pill_active": ("#d6f2f9", "#0d3040"),
    "pill_ok": ("#d5f5e6", "#0c3326"),
    "pill_warn": ("#fdeec8", "#3b2b0c"),
    "pill_bad": ("#fde0e0", "#351316"),
    "disabled": ("#8b98ae", "#4f5b7c"),
    "input": ("#ffffff", "#0e1325"),
    "bg_list": ("#f1f5f9", "#0d111f"),
    "card_row": ("#ffffff", "#171d32"),
})

E.I18N["en"].update({
    "u_add": "Add Link", "u_resume": "Resume", "u_pause": "Pause", "u_stop_all": "Stop All",
    "u_resume_all": "Start All", "u_delete": "Remove", "u_limiter": "Speed Limit",
    "u_scheduler": "Scheduler", "u_options": "Options",
    "u_search_ph": "Search downloads...", "u_shortcuts": "Shortcuts",
    "u_theme": "Toggle theme", "u_lang": "Switch language",
    "u_selected": "selected", "u_downloads": "downloads", "u_active_n": "active",
    "u_queue_at": "Queue starts at", "u_paste_hint": "or press Ctrl+V to paste a link",
    "u_download_now": "Download Now", "u_later": "Later", "u_cancel": "Cancel",
    "u_save": "Save", "u_close": "Close", "u_paste": "Paste", "u_browse": "Browse",
    "u_clear": "Clear", "u_category": "Category",
    "u_confirm_delete_file": "The selected files will be permanently deleted from disk. Continue?",
    "u_confirm_remove_active": "Some downloads are still running and will be cancelled. Continue?",
    "u_link_detected": "Download link in clipboard - click to add",
    "u_dup": "This link is already in the list",
    "u_bad_url": "Enter a valid http/https link",
    "u_bad_time": "Use HH:MM (24h) format",
    "u_sched_cleared": "Schedule cleared", "u_sched_set": "Queue scheduled for",
    "u_shutdown_msg": "The computer will shut down in 60 seconds",
    "u_shutdown_cancel": "Cancel shutdown", "u_lim_off": "Unlimited",
    "u_tab_general": "General", "u_tab_conn": "Connection", "u_tab_look": "Appearance",
    "u_added": "Added to list", "u_sc_title": "Keyboard & Mouse Shortcuts",
    "tip_add": "Add a new link", "tip_resume": "Resume selected", "tip_pause": "Pause selected",
    "tip_stop_all": "Pause every running download", "tip_resume_all": "Start / resume everything",
    "tip_delete": "Remove selected from the list", "tip_limiter": "Global speed limiter",
    "tip_scheduler": "Schedule the queue / auto shutdown", "tip_options": "Program options",
    "tip_search": "Search downloads", "tip_shortcuts": "Show shortcuts",
    "sc_add": "Add a link (clipboard link is pre-filled)", "sc_toggle": "Pause / resume selected",
    "sc_open": "Open file / show live details", "sc_remove": "Remove selected from the list",
    "sc_delfile": "Delete selected files from disk", "sc_all": "Select all visible",
    "sc_nav": "Move selection up / down", "sc_search": "Focus the search box",
    "sc_esc": "Clear search, then clear selection", "sc_folder": "Show file in folder",
    "sc_cats": "Switch category (All, Active, Done, Paused, Failed)",
    "sc_limit": "Speed limiter", "sc_sched": "Scheduler", "sc_opts": "Options",
    "sc_retry": "Redownload / retry", "sc_help": "This help",
    "sc_mouse1": "Click: select   |   Ctrl+Click: add   |   Shift+Click: range",
    "sc_mouse2": "Double-click: open file or live details   |   Right-click: menu",
    "st_assembling_short": "Assembling",
    "u_toggle_sidebar": "Toggle sidebar",
    "u_clear_search": "Clear search",
    "empty_filter_title": "No matching downloads",
    "empty_filter_sub": "Try another search keyword or reset the active category filter",
    "empty_filter_cta": "Reset Search & Filter",
    "cmd_palette_title": "Command Palette (Ctrl+K)",
    "cmd_palette_ph": "Type a command, search or paste a URL...",
    "cmd_quick_add_url": "Download this link now",
    "queue_all_done_title": "All Downloads Completed",
    "queue_all_done_desc": "All tasks in queue finished successfully",
    "opt_sound_test": "Test Sound",
    "cat_queues": "QUEUES",
    "queue_main": "Main Queue",
    "dlg_queue_manager_title": "Queue Manager",
    "dlg_new_queue": "New Queue",
    "dlg_edit_queue": "Edit Queue",
    "dlg_queue_name": "Queue Name",
    "dlg_queue_max_parallel": "Max Concurrent",
    "dlg_queue_folder": "Custom Folder (Optional)",
    "dlg_queue_sched_start": "Start Time (HH:MM)",
    "dlg_queue_sched_stop": "Stop Time (HH:MM)",
    "dlg_queue_delete_confirm": "Delete queue '{name}'? Its downloads will move to Main Queue.",
    "menu_move_to_queue": "Move to Queue",
    "tip_queue_manager": "Manage download queues and concurrency",
    "queue_badge_concurrent": "parallel",
    "queue_badge_default_folder": "Default folder",
    "queue_created": "Queue created successfully",
    "queue_updated": "Queue updated",
    "queue_deleted": "Queue deleted",
    "queue_target": "Target Queue:",
        "spd_depth": "Crawl Depth:",
    "spd_depth_1": "Single Page (1)",
    "spd_depth_2": "2 Levels (Deep)",
    "spd_same_domain": "Same domain only",
    "spd_probe_sizes": "Check Sizes",
    "spd_custom_ext": "Extensions (e.g. pdf, zip):",
    "spd_col_size": "Size",
    "spd_probing": "Checking file sizes...",
    "spd_target_queue": "Target Queue:",
    "spd_open_browser": "Open Link in Browser",
    "spd_invert_sel": "Invert Selection",
    "card_add_title": "Add Link",
    "card_add_sub": "Direct link or clipboard",
    "card_vid_title": "Video Grabber",
    "card_vid_sub": "YouTube & social media",
    "card_batch_title": "Batch Download",
    "card_batch_sub": "Multiple URLs list",
    "empty_tip_paste": "💡 Tip: Press Ctrl+V anytime to paste and download directly from clipboard",
    "vid_audio_only_switch": "Extract Audio Only (MP3)",
    "vid_stream_badge": "🔴 Live Stream / HLS",
    "sniff_btn_title": "Download Video",
    "sniff_sent_toast": "Video sent to NegmLoading",
    "st_tab_overview": "Overview & Monitor",
    "st_tab_history": "Download Logs & History",
    "st_tab_domains": "Domains & Sources",
    "st_col_time": "Date & Time",
    "st_col_name": "File Name",
    "st_col_cat": "Category",
    "st_col_size": "Size",
    "st_col_status": "Status",
    "st_col_speed": "Speed",
    "st_col_duration": "Duration",
    "st_col_domain": "Domain",
    "st_filter_status": "Status:",
    "st_filter_date": "Date Range:",
    "st_all": "All",
    "st_status_ok": "Completed",
    "st_status_fail": "Failed",
    "st_date_all": "All Time",
    "st_date_today": "Today",
    "st_date_week": "Last 7 Days",
    "st_date_month": "Last 30 Days",
    "st_export_report": "Export Report",
    "st_export_csv": "Export as CSV (Excel)",
    "st_export_json": "Export as JSON",
    "st_export_html": "Interactive HTML Report",
    "st_export_ok": "Report exported successfully",
    "st_clear_hist": "Clear History",
    "st_confirm_clear_hist": "Are you sure you want to clear the entire download history? This cannot be undone.",
    "st_hist_empty": "No download records match the current filter",
    "st_top_domains": "Top Downloaded Domains",
    "st_domain_traffic": "Data Transferred",
    "st_domain_files": "Files",
    "st_success_rate": "Success Rate",
    "st_now_speed": "Current Speed",
    "st_peak_line": "Peak Bandwidth",
    "st_ctx_open_file": "Open File",
    "st_ctx_open_dir": "Open Containing Folder",
    "st_ctx_copy_url": "Copy URL",
    "st_ctx_copy_name": "Copy File Name",
    "st_ctx_del_rec": "Delete from History",
    "ref_dialog_title": "Refresh Download Address & Resume",
    "ref_desc": "Update expired download link without losing downloaded data and resume immediately.",
    "ref_file_info": "Current Download Info",
    "ref_old_url": "Expired Original Link:",
    "ref_new_url": "New Direct Link:",
    "ref_url_ph": "https://... enter fresh download link here",
    "ref_open_browser": "Open in Browser",
    "ref_verify_chk": "Verify file size and Range support before applying",
    "ref_btn_apply": "Apply & Resume",
    "ref_success": "Link updated successfully and download resumed!",
    "ref_toast_act": "Refresh Link",
    "chk_dialog_title": "File Integrity & Checksum Verifier",
    "chk_copy_all": "Copy All Hashes",
    "chk_match_success": "Checksum MATCHED - File is 100% authentic and verified",
    "chk_match_failed": "Checksum MISMATCH - File may be corrupted or modified",
    "chk_copied_all": "All 5 hashes copied to clipboard",
    "pm_dialog_title": "Advanced Proxy Manager",
    "pm_add_btn": "Add Proxy",
    "pm_edit_btn": "Edit",
    "pm_del_btn": "Delete",
    "pm_test_btn": "Test Ping",
    "pm_set_active": "Set Active",
    "pm_disable_all": "Direct (No Proxy)",
    "pm_col_active": "Active",
    "pm_col_name": "Proxy Name",
    "pm_col_proto": "Protocol",
    "pm_col_endpoint": "Endpoint (Host:Port)",
    "pm_col_auth": "Auth",
    "pm_col_latency": "Latency",
    "pm_col_ip": "Public IP",
    "pm_test_ok": "Connection OK",
    "pm_test_err": "Proxy connection failed",
    "pm_direct_mode": "Direct Connection (No Proxy)",
    "vault_dialog_title": "Site Credentials & Auth Vault",
    "vault_add_btn": "Add Site Account",
    "vault_col_domain": "Target Domain",
    "vault_col_type": "Auth Type",
    "vault_col_identity": "Username / Token",
    "vault_col_cookies": "Cookies",
    "vault_domain_ph": "e.g. archive.org or rapidgator.net",
    "vault_cookies_ph": "session_id=...; auth_token=...",
    "vault_saved": "Site credentials saved successfully",
    "tip_proxy_vault": "Proxy Manager & Credentials Vault",
    "wr_title": "Web Remote & Mobile Control",
    "wr_server_status": "Server Status",
    "wr_status_running": "Server Online & Listening",
    "wr_status_stopped": "Server Stopped",
    "wr_enable": "Enable Web Remote Control",
    "wr_lan_access": "Allow LAN Access (Mobile phones, tablets & other PCs)",
    "wr_url_lbl": "Web Remote Access URL",
    "wr_pin_lbl": "Security PIN / Access Token",
    "wr_regen_pin": "Regenerate PIN",
    "wr_port_lbl": "Server Port",
    "wr_open_browser": "Open in Browser",
    "wr_copy_url": "Copy URL",
    "wr_url_copied": "Remote URL copied to clipboard!",
    "wr_hint": "Open this URL in your mobile browser while connected to the same Wi-Fi network to control downloads directly without installing any apps!",
    "wr_status_bar": "Web Remote",
    "post_title": "Post-Download Automation",
    "post_action_lbl": "Action when all downloads complete:",
    "post_act_none": "Do Nothing (Keep Running)",
    "post_act_shutdown": "Shut Down Computer",
    "post_act_sleep": "Sleep / Suspend",
    "post_act_hibernate": "Hibernate",
    "post_act_lock": "Lock Workstation",
    "post_act_exit": "Exit NegmLoading",
    "post_extract_lbl": "Auto-extract archives upon completion (ZIP / RAR / 7Z)",
    "post_custom_cmd": "Custom command on completion:",
    "post_custom_cmd_ph": "e.g. C:\\scripts\\done.bat \"%1\"",
    "post_webhook_lbl": "Notification Webhook URL (Discord / Slack / Custom):",
    "post_webhook_ph": "https://discord.com/api/webhooks/...",
    "post_action_toast": "Post-download action will execute in 60 seconds",
    "post_cancel_act": "Cancel Action",
    "post_toast_cancel_ok": "Scheduled power action canceled",
})
E.I18N["ar"].update({
    "u_add": "إضافة رابط", "u_resume": "استئناف", "u_pause": "إيقاف مؤقت", "u_stop_all": "إيقاف الكل",
    "u_resume_all": "بدء الكل", "u_delete": "إزالة", "u_limiter": "محدد السرعة",
    "u_scheduler": "الجدولة", "u_options": "الخيارات",
    "u_search_ph": "ابحث في التنزيلات...", "u_shortcuts": "الاختصارات",
    "u_theme": "تبديل المظهر", "u_lang": "تبديل اللغة",
    "u_selected": "محدد", "u_downloads": "تنزيل", "u_active_n": "نشط",
    "u_queue_at": "يبدأ الطابور عند", "u_paste_hint": "أو اضغط Ctrl+V للصق رابط مباشرة",
    "u_download_now": "تنزيل الآن", "u_later": "لاحقًا", "u_cancel": "إلغاء",
    "u_save": "حفظ", "u_close": "إغلاق", "u_paste": "لصق", "u_browse": "استعراض",
    "u_clear": "مسح", "u_category": "التصنيف",
    "u_confirm_delete_file": "سيتم حذف الملفات المحددة نهائيًا من القرص. هل تريد المتابعة؟",
    "u_confirm_remove_active": "بعض التنزيلات لا تزال جارية وسيتم إلغاؤها. هل تريد المتابعة؟",
    "u_link_detected": "يوجد رابط تنزيل في الحافظة - اضغط للإضافة",
    "u_dup": "هذا الرابط موجود بالفعل في القائمة",
    "u_bad_url": "أدخل رابط http/https صحيحًا",
    "u_bad_time": "استخدم صيغة HH:MM (24 ساعة)",
    "u_sched_cleared": "تم إلغاء الجدولة", "u_sched_set": "تمت جدولة الطابور عند",
    "u_shutdown_msg": "سيتم إيقاف تشغيل الجهاز خلال 60 ثانية",
    "u_shutdown_cancel": "إلغاء إيقاف التشغيل", "u_lim_off": "غير محدود",
    "u_tab_general": "عام", "u_tab_conn": "الاتصال", "u_tab_look": "المظهر",
    "u_added": "تمت الإضافة للقائمة", "u_sc_title": "اختصارات لوحة المفاتيح والماوس",
    "tip_add": "إضافة رابط جديد", "tip_resume": "استئناف المحدد", "tip_pause": "إيقاف المحدد مؤقتًا",
    "tip_stop_all": "إيقاف كل التنزيلات الجارية", "tip_resume_all": "بدء / استئناف الكل",
    "tip_delete": "إزالة المحدد من القائمة", "tip_limiter": "محدد السرعة العام",
    "tip_scheduler": "جدولة الطابور / الإطفاء التلقائي", "tip_options": "خيارات البرنامج",
    "tip_search": "بحث في التنزيلات", "tip_shortcuts": "عرض الاختصارات",
    "sc_add": "إضافة رابط (يُملأ تلقائيًا من الحافظة)", "sc_toggle": "إيقاف / استئناف المحدد",
    "sc_open": "فتح الملف / عرض التفاصيل الحية", "sc_remove": "إزالة المحدد من القائمة",
    "sc_delfile": "حذف الملفات المحددة من القرص", "sc_all": "تحديد كل الظاهر",
    "sc_nav": "تحريك التحديد لأعلى / لأسفل", "sc_search": "التركيز على مربع البحث",
    "sc_esc": "مسح البحث ثم مسح التحديد", "sc_folder": "إظهار الملف في المجلد",
    "sc_cats": "تبديل التصنيف (الكل، جارية، مكتملة، متوقفة، فاشلة)",
    "sc_limit": "محدد السرعة", "sc_sched": "الجدولة", "sc_opts": "الخيارات",
    "sc_retry": "إعادة التنزيل / المحاولة", "sc_help": "هذه المساعدة",
    "sc_mouse1": "نقرة: تحديد   |   Ctrl+نقرة: إضافة للتحديد   |   Shift+نقرة: نطاق",
    "sc_mouse2": "نقر مزدوج: فتح الملف أو التفاصيل الحية   |   نقرة يمين: القائمة",
    "st_assembling_short": "تجميع",
    "u_toggle_sidebar": "طي / توسيع الشريط الجانبي",
    "u_clear_search": "مسح البحث",
    "empty_filter_title": "لا توجد تنزيلات مطابقة",
    "empty_filter_sub": "جرّب كلمة بحث أخرى أو أعد ضبط التصفية الحالية لعرض كل العناصر",
    "empty_filter_cta": "إعادة ضبط البحث والتصفية",
    "cmd_palette_title": "لوحة الأوامر السريعة (Ctrl+K)",
    "cmd_palette_ph": "اكتب أمراً أو ابحث أو الصق رابطاً...",
    "cmd_quick_add_url": "تحميل هذا الرابط الآن",
    "queue_all_done_title": "اكتملت كافة التنزيلات",
    "queue_all_done_desc": "تم الانتهاء من تحميل كافة عناصر الطابور بنجاح",
    "opt_sound_test": "تجربة الصوت",
        "spd_depth": "عمق الاستكشاف:",
    "spd_depth_1": "صفحة واحدة (1)",
    "spd_depth_2": "مستويين (شامل)",
    "spd_same_domain": "نفس النطاق فقط",
    "spd_probe_sizes": "فحص الأحجام",
    "spd_custom_ext": "الامتدادات (مثال: pdf, zip):",
    "spd_col_size": "الحجم",
    "spd_probing": "جاري فحص الأحجام بالخلفية...",
    "spd_target_queue": "طابور التنزيل:",
    "spd_open_browser": "فتح الرابط في المتصفح",
    "spd_invert_sel": "عكس التحديد",
    "card_add_title": "إضافة رابط",
    "card_add_sub": "رابط مباشر أو من الحافظة",
    "card_vid_title": "التقاط فيديو",
    "card_vid_sub": "يوتيوب ومواقع التواصل",
    "card_batch_title": "تحميل مجمع",
    "card_batch_sub": "قائمة روابط متعددة",
    "empty_tip_paste": "💡 تلميح: اضغط Ctrl+V في أي وقت للصق والتنزيل مباشرة من الحافظة",
    "cat_queues": "الطوابير",
    "queue_main": "الطابور الرئيسي",
    "dlg_queue_manager_title": "إدارة طوابير التنزيل",
    "dlg_new_queue": "طابور جديد",
    "dlg_edit_queue": "تعديل الطابور",
    "dlg_queue_name": "اسم الطابور",
    "dlg_queue_max_parallel": "أقصى تنزيلات متزامنة",
    "dlg_queue_folder": "مجلد الحفظ المخصص (اختياري)",
    "dlg_queue_sched_start": "وقت البدء (HH:MM)",
    "dlg_queue_sched_stop": "وقت الإيقاف (HH:MM)",
    "dlg_queue_delete_confirm": "هل تريد حذف طابور '{name}'؟ سيتم نقل تنزيلاته إلى الطابور الرئيسي.",
    "menu_move_to_queue": "نقل إلى طابور",
    "tip_queue_manager": "إدارة طوابير التنزيل والجدولة المتزامنة",
    "queue_badge_concurrent": "متزامن",
    "queue_badge_default_folder": "المجلد الافتراضي",
    "queue_created": "تم إنشاء الطابور بنجاح",
    "queue_updated": "تم تحديث بيانات الطابور",
    "queue_deleted": "تم حذف الطابور ونقل التنزيلات",
    "queue_target": "طابور التنزيل:",
    "vid_audio_only_switch": "استخراج الصوت فقط كـ MP3",
    "vid_stream_badge": "🔴 تدفق مباشر / بث HLS",
    "sniff_btn_title": "تحميل الفيديو",
    "sniff_sent_toast": "تم إرسال الفيديو لـ NegmLoading",
    "st_tab_overview": "نظرة عامة ومراقبة الشبكة",
    "st_tab_history": "سجل التنزيلات التفصيلي",
    "st_tab_domains": "تحليل المواقع والمصادر",
    "st_col_time": "التاريخ والوقت",
    "st_col_name": "اسم الملف",
    "st_col_cat": "التصنيف",
    "st_col_size": "الحجم",
    "st_col_status": "الحالة",
    "st_col_speed": "السرعة",
    "st_col_duration": "المدة",
    "st_col_domain": "الموقع",
    "st_filter_status": "الحالة:",
    "st_filter_date": "الفترة:",
    "st_all": "الكل",
    "st_status_ok": "ناجح / مكتمل",
    "st_status_fail": "فشل",
    "st_date_all": "كل الأوقات",
    "st_date_today": "اليوم",
    "st_date_week": "آخر 7 أيام",
    "st_date_month": "آخر 30 يوم",
    "st_export_report": "تصدير التقرير",
    "st_export_csv": "تصدير كـ CSV (Excel)",
    "st_export_json": "تصدير كـ JSON",
    "st_export_html": "تقرير تفاعلي (HTML)",
    "st_export_ok": "تم تصدير التقرير بنجاح",
    "st_clear_hist": "مسح السجل",
    "st_confirm_clear_hist": "هل أنت متأكد من مسح كامل سجل التنزيلات؟ لا يمكن التراجع عن هذا الإجراء.",
    "st_hist_empty": "لا توجد سجلات تنزيل تطابق معايير البحث",
    "st_top_domains": "المواقع الأكثر تنزيلاً",
    "st_domain_traffic": "حجم البيانات",
    "st_domain_files": "الملفات",
    "st_success_rate": "معدل النجاح",
    "st_now_speed": "السرعة الحالية",
    "st_peak_line": "أعلى قمة",
    "st_ctx_open_file": "فتح الملف",
    "st_ctx_open_dir": "فتح المجلد المحتوي",
    "st_ctx_copy_url": "نسخ رابط التنزيل",
    "st_ctx_copy_name": "نسخ اسم الملف",
    "st_ctx_del_rec": "حذف من السجل",
    "ref_dialog_title": "تحديث عنوان التنزيل واستئناف الرابط",
    "ref_desc": "تحديث الرابط منتهي الصلاحية دون فقدان ما تم تنزيله واستئناف التنزيل فوراً.",
    "ref_file_info": "معلومات التنزيل الحالي",
    "ref_old_url": "الرابط القديم المنتهي:",
    "ref_new_url": "الرابط الجديد المباشر:",
    "ref_url_ph": "https://... أدخل الرابط الجديد هنا",
    "ref_open_browser": "فتح في المتصفح",
    "ref_verify_chk": "التحقق من مطابقة حجم الملف ودعم الاستئناف",
    "ref_btn_apply": "تحديث واستئناف",
    "ref_success": "تم تحديث الرابط بنجاح واستئناف التنزيل!",
    "ref_toast_act": "تحديث الرابط",
    "chk_dialog_title": "فحص سلامة وبصمة الملف",
    "chk_copy_all": "نسخ كافة البصمات",
    "chk_match_success": "البصمة متطابقة تماماً - الملف سليم وأصلي 100%",
    "chk_match_failed": "البصمة غير متطابقة - الملف قد يكون تالفاً أو تم التعديل عليه",
    "chk_copied_all": "تم نسخ كافة البصمات الـ 5 إلى الحافظة",
    "pm_dialog_title": "إدارة البروكسيات المتقدمة",
    "pm_add_btn": "إضافة بروكسي",
    "pm_edit_btn": "تعديل",
    "pm_del_btn": "حذف",
    "pm_test_btn": "اختبار الاتصال",
    "pm_set_active": "تعيين كافتراضي",
    "pm_disable_all": "تعطيل البروكسي (اتصال مباشر)",
    "pm_col_active": "الحالة",
    "pm_col_name": "اسم البروكسي",
    "pm_col_proto": "البروتوكول",
    "pm_col_endpoint": "العنوان والمَنفذ",
    "pm_col_auth": "المصادقة",
    "pm_col_latency": "سرعة الاستجابة",
    "pm_col_ip": "عنوان IP الخارجي",
    "pm_test_ok": "الاتصال سليم",
    "pm_test_err": "فشل الاتصال بالبروكسي",
    "pm_direct_mode": "الاتصال المباشر (بدون بروكسي)",
    "vault_dialog_title": "خزنة الحسابات وبيانات اعتماد المواقع",
    "vault_add_btn": "إضافة حساب موقع",
    "vault_col_domain": "الموقع / النطاق",
    "vault_col_type": "نوع المصادقة",
    "vault_col_identity": "اسم المستخدم / الرمز",
    "vault_col_cookies": "الكوكيز",
    "vault_domain_ph": "مثال: archive.org أو rapidgator.net",
    "vault_cookies_ph": "session_id=...; auth_token=...",
    "vault_saved": "تم حفظ بيانات الاعتماد بنجاح",
    "tip_proxy_vault": "مدير البروكسيات وخزنة الحسابات",
    "wr_title": "التحكم عن بُعد عبر الويب والهاتف",
    "wr_server_status": "حالة خادم التحكم",
    "wr_status_running": "الخادم قيد التشغيل ونشط",
    "wr_status_stopped": "الخادم متوقف",
    "wr_enable": "تفعيل التحكم عن بُعد عبر المتصفح",
    "wr_lan_access": "السماح بالوصول من الشبكة المحلية (الهواتف والأجهزة اللوحية)",
    "wr_url_lbl": "رابط الوصول للوحة التحكم",
    "wr_pin_lbl": "رمز الحماية (PIN / Access Token)",
    "wr_regen_pin": "توليد رمز جديد",
    "wr_port_lbl": "منفذ الخادم (Port)",
    "wr_open_browser": "فتح في المتصفح",
    "wr_copy_url": "نسخ الرابط",
    "wr_url_copied": "تم نسخ رابط التحكم إلى الحافظة بنجاح!",
    "wr_hint": "افتح هذا الرابط من متصفح هاتفك المحمول المتصل بنفس شبكة الـ Wi-Fi للتحكم بالتحميلات وإدارتها دون الحاجة لتثبيت أي تطبيق!",
    "wr_status_bar": "التحكم عن بُعد",
    "post_title": "أتمتة ما بعد اكتمال التحميل",
    "post_action_lbl": "الإجراء عند اكتمال جميع التحميلات:",
    "post_act_none": "لا شيء (الاستمرار في العمل)",
    "post_act_shutdown": "إيقاف تشغيل الكمبيوتر (Shut Down)",
    "post_act_sleep": "وضع السكون (Sleep)",
    "post_act_hibernate": "إسبات الكمبيوتر (Hibernate)",
    "post_act_lock": "قفل شاشة الكمبيوتر (Lock PC)",
    "post_act_exit": "إغلاق برنامج NegmLoading",
    "post_extract_lbl": "استخراج الملفات المضغوطة تلقائياً فور اكتمالها (ZIP / RAR / 7Z)",
    "post_custom_cmd": "أمر مخصص لتشغيله عند اكتمال التنزيل:",
    "post_custom_cmd_ph": "مثال: C:\\scripts\\done.bat \"%1\"",
    "post_webhook_lbl": "رابط Webhook للإشعارات (Discord / Slack / مخصص):",
    "post_webhook_ph": "https://discord.com/api/webhooks/...",
    "post_action_toast": "سيتم تنفيذ إجراء ما بعد التحميل خلال 60 ثانية",
    "post_cancel_act": "إلغاء الإجراء",
    "post_toast_cancel_ok": "تم إلغاء الإجراء المجدول بنجاح",
})



# Font Awesome 6 Free (Solid) Glyphs & Fallbacks
FA = {
    "plus": ("\u002b", "+"), "play": ("\uf04b", "▶"), "pause": ("\uf04c", "⏸"),
    "stop": ("\uf04d", "⏹"), "trash": ("\uf2ed", "🗑"), "gauge": ("\uf625", "⚡"),
    "clock": ("\uf017", "⏱"), "gear": ("\uf013", "⚙"), "folder-open": ("\uf07c", "📂"),
    "folder": ("\uf07b", "📁"), "download": ("\uf019", "⬇"), "check": ("\uf058", "✔"),
    "circle-pause": ("\uf28b", "⏸"), "circle-xmark": ("\uf057", "✖"),
    "list": ("\uf03a", "☰"), "zip": ("\uf1c6", "🗜"), "cube": ("\uf1b2", "⚙"),
    "film": ("\uf008", "🎬"), "music": ("\uf001", "🎵"), "doc": ("\uf15c", "📄"),
    "file": ("\uf15b", "📦"), "search": ("\uf002", "🔍"), "retry": ("\uf021", "↻"),
    "xmark": ("\uf00d", "✕"), "moon": ("\uf186", "☾"), "sun": ("\uf185", "☀"),
    "language": ("\uf1ab", "文"), "keyboard": ("\uf11c", "⌨"), "info": ("\uf05a", "ℹ"),
    "bolt": ("\uf0e7", "⚡"), "layers": ("\uf5fd", "▤"), "hourglass": ("\uf252", "⏳"),
    "cloud-down": ("\uf0ed", "☁"), "warning": ("\uf071", "⚠"), "clipboard": ("\uf328", "📋"),
    "power": ("\uf011", "⏻"), "eraser": ("\uf12d", "⌫"), "forward": ("\uf051", "⏭"),
    "redo": ("\uf2f9", "↻"), "shield": ("\uf3ed", "🛡"), "copy": ("\uf0c5", "📄"),
    "box-open": ("\uf49e", "📦"), "globe": ("\uf0ac", "🌐"), "chart-pie": ("\uf200", "📊"),
    "bug": ("\uf188", "🦠"), "image": ("\uf03e", "🖼"),
    "puzzle": ("\uf12e", "🧩"), "exchange": ("\uf362", "⇄"),
    "file-export": ("\uf56e", "📤"), "key": ("\uf084", "Key"), "server": ("\uf233", "Server"), "file-import": ("\uf56f", "📥"), "file-csv": ("\uf6dd", "CSV"), "chart-line": ("\uf201", "Graph"), "filter": ("\uf0b0", "Filter"), "table": ("\uf0ce", "Table"), "clock-rotate-left": ("\uf1da", "Hist"), "plug": ("\uf1e6", "🔌"), "layer-group": ("\uf5fd", "🗂"), "bars-staggered": ("\uf550", "☰"),
    "mobile": ("\uf3cd", "📱"), "wifi": ("\uf1eb", "📶"), "terminal": ("\uf120", ">_"), "bell": ("\uf0f3", "🔔"), "lock": ("\uf023", "🔒"),
}
ICON_FAMILY = None
UI_FONT = "Segoe UI"
MONO_FONT = "Consolas"

CAT_ICON = {
    "type_compressed": "zip", "type_programs": "cube", "type_videos": "film",
    "type_music": "music", "type_docs": "doc", "type_other": "file",
}
CAT_COLOR = {
    "type_compressed": "warning", "type_programs": "primary_text", "type_videos": "danger",
    "type_music": "success", "type_docs": "accent_cyan", "type_other": "text_muted",
}

_AR_CHAR_RE = re.compile(r"[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]")
_BIDI_CTRL_RE = re.compile(r"[\u202a\u202b\u202c\u202d\u202e\u200e\u200f]")
_PURE_TECH_RE = re.compile(r"^(?:https?://|chrome://|edge://|ftp://|\d{1,3}(?:\.\d{1,3}){3}|[A-Za-z]:\\|\\\\)", re.I)


def strip_bidi(text) -> str:
    if not text:
        return ""
    return _BIDI_CTRL_RE.sub("", str(text))


def bidi(text) -> str:
    """Applies Unicode Right-to-Left Embedding (RLE..PDF) to display lines containing Arabic script."""
    if text is None or not isinstance(text, str) or not text:
        return "" if text is None else str(text)
    cleaned = strip_bidi(text)
    if not _AR_CHAR_RE.search(cleaned):
        return cleaned
    out = []
    for line in cleaned.split("\n"):
        s = line.strip()
        if s and _AR_CHAR_RE.search(s) and not _PURE_TECH_RE.match(s):
            out.append(f"\u202b{line}\u202c")
        else:
            out.append(line)
    return "\n".join(out)


def is_rtl() -> bool:
    return E.LANG == "ar"


def s_start() -> str:
    return "right" if is_rtl() else "left"


def s_end() -> str:
    return "left" if is_rtl() else "right"


def a_start() -> str:
    return "e" if is_rtl() else "w"


def a_end() -> str:
    return "w" if is_rtl() else "e"


def j_start() -> str:
    return "right" if is_rtl() else "left"


def px_inline(start_px: int, end_px: int):
    return (end_px, start_px) if is_rtl() else (start_px, end_px)


# Font Memoization Cache for High Performance & Low Memory Overhead
_FONT_CACHE = {}

def uifont(size: int = 12, weight: str = "normal"):
    key = ("ui", size, weight)
    if key not in _FONT_CACHE:
        _FONT_CACHE[key] = ctk.CTkFont(family=UI_FONT, size=size, weight=weight)
    return _FONT_CACHE[key]


def monofont(size: int = 11, weight: str = "normal"):
    key = ("mono", size, weight)
    if key not in _FONT_CACHE:
        _FONT_CACHE[key] = ctk.CTkFont(family=MONO_FONT, size=size, weight=weight)
    return _FONT_CACHE[key]


def ifont(size=14):
    fam = ICON_FAMILY or UI_FONT
    key = ("icon", fam, size)
    if key not in _FONT_CACHE:
        _FONT_CACHE[key] = ctk.CTkFont(family=fam, size=size)
    return _FONT_CACHE[key]


def ico(name):
    glyph, fallback = FA.get(name, ("?", "?"))
    return glyph if ICON_FAMILY else fallback


def col(token):
    return PALETTE.get(token, token)


def cur(token):
    return E.cur(token)


def prefers_reduced_motion() -> bool:
    """Reads Windows Accessibility SPI_GETCLIENTAREAANIMATION (0x1042) to respect reduced motion."""
    if sys.platform != "win32":
        return False
    try:
        anim = ctypes.c_int(1)
        ok = ctypes.windll.user32.SystemParametersInfoW(0x1042, 0, ctypes.byref(anim), 0)
        if ok and anim.value == 0:
            return True
    except Exception:
        pass
    return False


def load_icon_font():
    """Registers the bundled Font Awesome TTF for this process only (no install)."""
    if sys.platform != "win32" or not os.path.exists(FONT_PATH):
        return
    try:
        ctypes.windll.gdi32.AddFontResourceExW(FONT_PATH, 0x10, 0)  # FR_PRIVATE
    except Exception:
        pass


def detect_icon_family(root):
    global ICON_FAMILY
    if ICON_FAMILY:
        return ICON_FAMILY
    try:
        test_font = tkfont.Font(root, family="Font Awesome 6 Free Solid")
        if test_font.actual("family").startswith("Font Awesome"):
            ICON_FAMILY = "Font Awesome 6 Free Solid"
            return ICON_FAMILY
    except Exception:
        pass
    try:
        names = [f for f in tkfont.families(root) if f.startswith("Font Awesome")]
        solid = [f for f in names if "Solid" in f]
        ICON_FAMILY = (solid or names or [None])[0]
    except Exception:
        ICON_FAMILY = None
    return ICON_FAMILY


def short_text(text, limit):
    raw = strip_bidi(text)
    return raw if len(raw) <= limit else raw[: max(4, limit - 1)] + "…"


def iter_ctk_tree(widget):
    yield widget
    for child in widget.winfo_children():
        if isinstance(child, ctk.CTkBaseClass):
            yield from iter_ctk_tree(child)


def pointer_inside(widget):
    try:
        px, py = widget.winfo_pointerxy()
        x, y = widget.winfo_rootx(), widget.winfo_rooty()
        return x <= px < x + widget.winfo_width() and y <= py < y + widget.winfo_height()
    except Exception:
        return False


def set_dark_titlebar(window):
    """Makes the native title bar follow the dark / light theme (Windows 10/11)."""
    try:
        hwnd = ctypes.windll.user32.GetParent(window.winfo_id())
        value = ctypes.c_int(1 if ctk.get_appearance_mode() == "Dark" else 0)
        ctypes.windll.dwmapi.DwmSetWindowAttribute(hwnd, 20, ctypes.byref(value), 4)
    except Exception:
        pass


def capture_window_client_image(widget):
    """
    Captures a pixel-perfect image of the client area of a Tkinter/CTk window
    using Win32 PrintWindow and GetDIBits. Returns a PIL Image in RGBA format, or None on failure.
    """
    if sys.platform != "win32":
        return None
    try:
        from ctypes import wintypes
        widget.update_idletasks()
        widget.update()
        user32 = ctypes.windll.user32
        gdi32 = ctypes.windll.gdi32

        hwnd_parent = user32.GetParent(widget.winfo_id()) or widget.winfo_id()
        rc = wintypes.RECT()
        user32.GetWindowRect(hwnd_parent, ctypes.byref(rc))
        w = max(1, rc.right - rc.left)
        h = max(1, rc.bottom - rc.top)

        hdc_win = user32.GetWindowDC(hwnd_parent)
        hdc_mem = gdi32.CreateCompatibleDC(hdc_win)
        hbmp = gdi32.CreateCompatibleBitmap(hdc_win, w, h)
        old_obj = gdi32.SelectObject(hdc_mem, hbmp)

        ok = user32.PrintWindow(hwnd_parent, hdc_mem, 2)
        if not ok:
            user32.PrintWindow(hwnd_parent, hdc_mem, 0)

        class BITMAPINFOHEADER(ctypes.Structure):
            _fields_ = [
                ("biSize", wintypes.DWORD),
                ("biWidth", wintypes.LONG),
                ("biHeight", wintypes.LONG),
                ("biPlanes", wintypes.WORD),
                ("biBitCount", wintypes.WORD),
                ("biCompression", wintypes.DWORD),
                ("biSizeImage", wintypes.DWORD),
                ("biXPelsPerMeter", wintypes.LONG),
                ("biYPelsPerMeter", wintypes.LONG),
                ("biClrUsed", wintypes.DWORD),
                ("biClrImportant", wintypes.DWORD),
            ]

        bmi = BITMAPINFOHEADER()
        bmi.biSize = ctypes.sizeof(BITMAPINFOHEADER)
        bmi.biWidth = w
        bmi.biHeight = -h
        bmi.biPlanes = 1
        bmi.biBitCount = 32
        bmi.biCompression = 0

        buf = ctypes.create_string_buffer(w * h * 4)
        gdi32.GetDIBits(hdc_mem, hbmp, 0, h, buf, ctypes.byref(bmi), 0)

        gdi32.SelectObject(hdc_mem, old_obj)
        gdi32.DeleteObject(hbmp)
        gdi32.DeleteDC(hdc_mem)
        user32.ReleaseDC(hwnd_parent, hdc_win)

        img = Image.frombuffer("RGBA", (w, h), buf, "raw", "BGRA", 0, 1)

        pt = wintypes.POINT(0, 0)
        user32.ClientToScreen(widget.winfo_id(), ctypes.byref(pt))
        client_x = max(0, pt.x - rc.left)
        client_y = max(0, pt.y - rc.top)

        rc_client = wintypes.RECT()
        user32.GetClientRect(widget.winfo_id(), ctypes.byref(rc_client))
        cw = max(1, rc_client.right - rc_client.left)
        ch = max(1, rc_client.bottom - rc_client.top)

        return img.crop((client_x, client_y, min(w, client_x + cw), min(h, client_y + ch)))
    except Exception:
        return None


def is_valid_url(url):
    try:
        p = urllib.parse.urlparse(url if re.match(r"^https?://", url, re.I) else "http://" + url)
        return bool(p.netloc) and " " not in url
    except Exception:
        return False


def parse_hhmm(text):
    hh, mm = text.strip().split(":")
    hh, mm = int(hh), int(mm)
    if not (0 <= hh < 24 and 0 <= mm < 60):
        raise ValueError
    now = datetime.datetime.now()
    target = now.replace(hour=hh, minute=mm, second=0, microsecond=0)
    return target if target > now else target + datetime.timedelta(days=1)


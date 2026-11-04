"""
NegmLoading Professional Windows Setup Wizard & Packaging Engine
"""
import os
import sys
import json
import subprocess
import threading
import tkinter as tk
from tkinter import filedialog as fd
import customtkinter as ctk
import installer_safety

APP_NAME = "Negm Lodaing"
# The on-disk executable is distinct from the historical display/registry name.
# Do not rename APP_NAME: existing HKCU anchors and shortcuts rely on it.
APP_EXE_FILENAME = "NegmLoading.exe"
APP_VERSION = "1.0.0"
APP_PUBLISHER = "Negm Lodaing Software"
DEFAULT_INSTALL_SUBDIR = "Negm Lodaing"

# Modern Color Palette
PALETTE = {
    "bg": ("#f1f5f9", "#0b0f19"),
    "card": ("#ffffff", "#111827"),
    "card_alt": ("#f8fafc", "#161f33"),
    "border": ("#cbd5e1", "#24324d"),
    "border_light": ("#e2e8f0", "#1e293b"),
    "text": ("#0f172a", "#f8fafc"),
    "text_muted": ("#64748b", "#94a3b8"),
    "primary": ("#3b82f6", "#2563eb"),
    "primary_hover": ("#2563eb", "#1d4ed8"),
    "success": ("#10b981", "#059669"),
}

def col(token):
    return PALETTE.get(token, token)

def get_default_install_dir():
    local_app_data = os.environ.get("LOCALAPPDATA")
    if local_app_data:
        return os.path.join(local_app_data, "Programs", DEFAULT_INSTALL_SUBDIR)
    prog_files = os.environ.get("ProgramFiles", r"C:\Program Files")
    return os.path.join(prog_files, DEFAULT_INSTALL_SUBDIR)

def installed_executable_path(install_dir):
    """Return the packaged executable filename; independent of display names."""
    return os.path.join(install_dir, APP_EXE_FILENAME)


def validate_setup_payload(payload_zip_path):
    """Reject a missing/wrongly named executable before any install write."""
    if not payload_zip_path or not os.path.isfile(payload_zip_path):
        raise installer_safety.InstallSafetyError("حزمة التثبيت غير موجودة.")
    planned, _dirs = installer_safety.list_zip_payload_paths(payload_zip_path)
    if APP_EXE_FILENAME not in planned:
        raise installer_safety.InstallSafetyError(
            "الحزمة لا تحتوي على الملف التنفيذي المطلوب: " + APP_EXE_FILENAME
        )


def require_installed_executable(plan):
    """Register or launch only an owned, ordinary file installed this round."""
    target = installed_executable_path(plan["dest"])
    if not any(
        isinstance(item, dict) and item.get("path") == APP_EXE_FILENAME
        for item in plan["owned_files"]
    ):
        raise installer_safety.InstallSafetyError("الملف التنفيذي غير مسجل ضمن الحمولة المثبتة.")
    if not os.path.isfile(target) or installer_safety.is_reparse_point(target):
        raise installer_safety.InstallSafetyError(
            "الملف التنفيذي المطلوب غير موجود أو ليس ملفًا عاديًا: " + APP_EXE_FILENAME
        )
    return target


def _shortcut_argument_safe(value):
    return isinstance(value, str) and value and not any(char in value for char in ('"', "\r", "\n"))


def create_windows_shortcut(target_exe, shortcut_path, description="NegmLoading", icon_path=""):
    """Create a shortcut only when the path is absent. Never overwrite an existing file."""
    try:
        if not _shortcut_argument_safe(target_exe) or not _shortcut_argument_safe(shortcut_path):
            return "failed"
        if description and not _shortcut_argument_safe(description):
            return "failed"
        if icon_path and not _shortcut_argument_safe(icon_path):
            return "failed"
        if os.path.lexists(shortcut_path):
            return "preserved"
        os.makedirs(os.path.dirname(shortcut_path), exist_ok=True)
        if os.path.lexists(shortcut_path):
            return "preserved"
        work_dir = os.path.dirname(target_exe)
        icon_arg = icon_path or target_exe
        vbs_content = f'''
Set ws = CreateObject("WScript.Shell")
Set lnk = ws.CreateShortcut("{shortcut_path}")
lnk.TargetPath = "{target_exe}"
lnk.WorkingDirectory = "{work_dir}"
lnk.Description = "{description}"
lnk.IconLocation = "{icon_arg},0"
lnk.Save
'''
        vbs_file = os.path.join(os.environ.get("TEMP", "."), f"mks_{os.getpid()}.vbs")
        with open(vbs_file, "w", encoding="utf-8") as f:
            f.write(vbs_content)
        subprocess.run(["cscript", "//nologo", vbs_file], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, creationflags=0x08000000 if sys.platform == "win32" else 0)
        try:
            os.remove(vbs_file)
        except Exception:
            pass
        if os.path.isfile(shortcut_path):
            return "created"
        return "failed"
    except Exception as e:
        print("Shortcut error:", e)
        return "failed"

def prepare_and_copy_payload(dest, payload_zip_path=None, *, startup=False, anchor_key=None, run_key=None):
    """Preflight every planned write, then copy the payload.

    A refusal happens before the copy. If the copy itself fails, files this
    function replaced are restored. This is not a cross-registry transaction.
    """
    dest = installer_safety.validate_install_root(dest)
    if payload_zip_path and os.path.exists(payload_zip_path):
        planned, _zip_dirs = installer_safety.list_zip_payload_paths(payload_zip_path)
    else:
        planned = []
        src_exe = os.path.join("dist", APP_EXE_FILENAME)
        if os.path.exists(src_exe):
            planned.append(APP_EXE_FILENAME)
        if os.path.exists("browser_extension"):
            planned.extend(installer_safety.list_tree_file_relpaths("browser_extension", "browser_extension"))
        if os.path.exists("assets"):
            planned.extend(installer_safety.list_tree_file_relpaths("assets", "assets"))
    dest, created_root, manifest = installer_safety.assess_destination(
        dest, planned, anchor_key=anchor_key
    )
    target_exe = installed_executable_path(dest)
    if sys.platform == "win32":
        installer_safety.assert_uninstall_key_available(
            anchor_key or installer_safety.DEFAULT_UNINSTALL_KEY, dest
        )
        if startup:
            installer_safety.assert_run_value_available(
                run_key or installer_safety.DEFAULT_RUN_KEY, APP_NAME, target_exe
            )
    snapshot_rels = installer_safety.install_write_relpaths(planned) + [installer_safety.MANIFEST_FILENAME]
    snapshot = installer_safety.capture_write_snapshot(dest, snapshot_rels)
    os.makedirs(dest, exist_ok=True)
    expected = installer_safety.owned_hash_map(manifest)
    try:
        owned_files = []
        owned_dirs = []
        if payload_zip_path and os.path.exists(payload_zip_path):
            owned_files, owned_dirs = installer_safety.safe_extract_zip(
                payload_zip_path, dest, expected_by_rel=expected
            )
        else:
            src_exe = os.path.join("dist", APP_EXE_FILENAME)
            if os.path.exists(src_exe):
                owned_files.append(installer_safety.safe_copy_file(
                    src_exe, dest, APP_EXE_FILENAME,
                    expected_sha=expected.get(os.path.normcase(APP_EXE_FILENAME)),
                ))
            if os.path.exists("browser_extension"):
                files, dirs = installer_safety.safe_copy_tree(
                    "browser_extension", dest, "browser_extension", expected_by_rel=expected
                )
                owned_files.extend(files)
                owned_dirs.extend(dirs)
            if os.path.exists("assets"):
                files, dirs = installer_safety.safe_copy_tree(
                    "assets", dest, "assets", expected_by_rel=expected
                )
                owned_files.extend(files)
                owned_dirs.extend(dirs)
    except Exception:
        installer_safety.restore_write_snapshot(snapshot)
        raise
    return {
        "dest": dest,
        "created_root": created_root,
        "owned_files": owned_files,
        "owned_dirs": owned_dirs,
        "snapshot": snapshot,
    }


def write_safe_uninstaller(install_dir, owned_files, owned_dirs, created_root=False, shortcut_paths=None):
    return installer_safety.write_uninstall_artifacts(
        install_dir,
        owned_files,
        owned_dirs,
        app_name=APP_NAME,
        app_version=APP_VERSION,
        created_root=created_root,
        shortcut_paths=shortcut_paths,
    )


def register_uninstall(install_dir, uninstaller_exe):
    if sys.platform != "win32":
        return
    import winreg
    installer_safety.assert_uninstall_key_available(
        installer_safety.DEFAULT_UNINSTALL_KEY, install_dir
    )
    try:
        key_path = rf"Software\Microsoft\Windows\CurrentVersion\Uninstall\{APP_NAME}"
        with winreg.CreateKey(winreg.HKEY_CURRENT_USER, key_path) as key:
            winreg.SetValueEx(key, "DisplayName", 0, winreg.REG_SZ, APP_NAME)
            winreg.SetValueEx(key, "DisplayVersion", 0, winreg.REG_SZ, APP_VERSION)
            winreg.SetValueEx(key, "Publisher", 0, winreg.REG_SZ, APP_PUBLISHER)
            winreg.SetValueEx(key, "InstallLocation", 0, winreg.REG_SZ, install_dir)
            target_exe = installed_executable_path(install_dir)
            if os.path.exists(target_exe):
                winreg.SetValueEx(key, "DisplayIcon", 0, winreg.REG_SZ, target_exe)
            winreg.SetValueEx(key, "UninstallString", 0, winreg.REG_SZ, f'"{uninstaller_exe}"')
            winreg.SetValueEx(key, "NoModify", 0, winreg.REG_DWORD, 1)
            winreg.SetValueEx(key, "NoRepair", 0, winreg.REG_DWORD, 1)
    except installer_safety.InstallSafetyError:
        raise
    except Exception as e:
        raise installer_safety.InstallSafetyError("تعذر تسجيل الإزالة: %s" % e)

class SetupWizard(ctk.CTk):
    def __init__(self, payload_zip_path=None):
        super().__init__()
        self.payload_zip_path = payload_zip_path or os.path.join(getattr(sys, "_MEIPASS", "."), "payload.zip")
        self.title(f"{APP_NAME} {APP_VERSION} - Setup Wizard")
        self.geometry("640x510")
        self.resizable(False, False)
        ctk.set_appearance_mode("Dark")
        self.configure(fg_color=col("bg"))

        self.install_dir = ctk.StringVar(value=get_default_install_dir())
        self.chk_desktop = ctk.BooleanVar(value=True)
        self.chk_startmenu = ctk.BooleanVar(value=True)
        self.chk_startup = ctk.BooleanVar(value=False)
        self.chk_launch = ctk.BooleanVar(value=True)

        self.step = 0
        self.build_ui()

    def build_ui(self):
        # Header Banner
        self.header = ctk.CTkFrame(self, height=72, corner_radius=0, fg_color=col("card"))
        self.header.pack(fill="x")
        self.header.pack_propagate(False)

        h_in = ctk.CTkFrame(self.header, fg_color="transparent")
        h_in.pack(fill="both", expand=True, padx=24, pady=12)

        self.lbl_head_title = ctk.CTkLabel(h_in, text=f"تثبيت برنامج {APP_NAME}", font=("Segoe UI", 16, "bold"), text_color=col("text"))
        self.lbl_head_title.pack(side="right")
        self.lbl_head_sub = ctk.CTkLabel(h_in, text=f"الإصدار {APP_VERSION}  •  معالج التثبيت السريع", font=("Segoe UI", 11), text_color=col("text_muted"))
        self.lbl_head_sub.pack(side="left")

        ctk.CTkFrame(self, height=1, fg_color=col("border_light")).pack(fill="x")

        # Container for Steps
        self.body = ctk.CTkFrame(self, fg_color="transparent")
        self.body.pack(fill="both", expand=True, padx=28, pady=20)

        # Footer Actions
        self.footer = ctk.CTkFrame(self, height=64, corner_radius=0, fg_color=col("card"))
        self.footer.pack(fill="x", side="bottom")
        self.footer.pack_propagate(False)
        ctk.CTkFrame(self.footer, height=1, fg_color=col("border_light")).pack(fill="x", side="top")

        f_in = ctk.CTkFrame(self.footer, fg_color="transparent")
        f_in.pack(fill="both", expand=True, padx=24, pady=12)

        self.btn_cancel = ctk.CTkButton(f_in, text="إلغاء", width=100, height=36, corner_radius=8, fg_color="transparent", border_width=1, border_color=col("border"), text_color=col("text"), command=self.destroy)
        self.btn_cancel.pack(side="left")

        self.btn_next = ctk.CTkButton(f_in, text="التالي  ◀", width=130, height=36, corner_radius=8, fg_color=col("primary"), hover_color=col("primary_hover"), font=("Segoe UI", 12, "bold"), command=self.go_next)
        self.btn_next.pack(side="right")

        self.show_step_1()

    def show_step_1(self):
        for w in self.body.winfo_children():
            w.destroy()

        card = ctk.CTkFrame(self.body, corner_radius=12, fg_color=col("card"), border_width=1, border_color=col("border_light"))
        card.pack(fill="both", expand=True, padx=4, pady=4)
        c_in = ctk.CTkFrame(card, fg_color="transparent")
        c_in.pack(fill="both", expand=True, padx=24, pady=20)

        ctk.CTkLabel(c_in, text=f"أهلاً بك في معالج تثبيت {APP_NAME}", font=("Segoe UI", 18, "bold"), text_color=col("text"), anchor="e").pack(fill="x", pady=(0, 8))
        desc = (
            f"سيقوم هذا المعالج بتثبيت أحدث إصدار من {APP_NAME} على جهاز الكمبيوتر الخاص بك.\n\n"
            "مميزات البرنامج:\n"
            "• محرك تنزيل متعدد الأجزاء فائق السرعة مع تجزئة ديناميكية ذكية (Multi-part Chunking).\n"
            "• ساحب وسائط وفيديوهات عالي الدقة (HD / 4K / MP3) مدمج.\n"
            "• تكامل فوري وسلس مع متصفحات Chrome و Edge و Brave.\n"
            "• استئناف آمن للملفات وواجهة عربية / إنجليزية سلسة بدون أي بطء أو تأخير.\n\n"
            "اضغط [التالي] للمتابعة واختيار مجلد التثبيت."
        )
        ctk.CTkLabel(c_in, text=desc, font=("Segoe UI", 12), text_color=col("text_muted"), justify="right", anchor="e").pack(fill="x")

    def show_step_2(self):
        for w in self.body.winfo_children():
            w.destroy()

        card = ctk.CTkFrame(self.body, corner_radius=12, fg_color=col("card"), border_width=1, border_color=col("border_light"))
        card.pack(fill="both", expand=True, padx=4, pady=4)
        c_in = ctk.CTkFrame(card, fg_color="transparent")
        c_in.pack(fill="both", expand=True, padx=24, pady=20)

        ctk.CTkLabel(c_in, text="مجلد التثبيت وخيارات التشغيل", font=("Segoe UI", 16, "bold"), text_color=col("text"), anchor="e").pack(fill="x", pady=(0, 6))

        # Folder Picker
        ctk.CTkLabel(c_in, text="اختر مجلد التثبيت:", font=("Segoe UI", 11, "bold"), text_color=col("text_muted"), anchor="e").pack(fill="x", pady=(6, 2))
        row = ctk.CTkFrame(c_in, fg_color="transparent")
        row.pack(fill="x", pady=(0, 14))
        btn_br = ctk.CTkButton(row, text="استعراض...", width=90, height=36, corner_radius=8, fg_color=col("card_alt"), border_width=1, border_color=col("border"), text_color=col("text"), command=self.browse_folder)
        btn_br.pack(side="left")
        self.ent_dir = ctk.CTkEntry(row, textvariable=self.install_dir, height=36, corner_radius=8, font=("Segoe UI", 11))
        self.ent_dir.pack(side="right", fill="x", expand=True, padx=(0, 8))

        # Options
        ctk.CTkLabel(c_in, text="خيارات إضافية:", font=("Segoe UI", 11, "bold"), text_color=col("text_muted"), anchor="e").pack(fill="x", pady=(8, 4))
        ctk.CTkCheckBox(c_in, text="إنشاء اختصار على سطح المكتب (Desktop Shortcut)", variable=self.chk_desktop, font=("Segoe UI", 12)).pack(fill="x", pady=4)
        ctk.CTkCheckBox(c_in, text="إنشاء اختصار في قائمة ابدأ (Start Menu)", variable=self.chk_startmenu, font=("Segoe UI", 12)).pack(fill="x", pady=4)
        ctk.CTkCheckBox(c_in, text="تشغيل البرنامج تلقائياً مع بدء تشغيل Windows", variable=self.chk_startup, font=("Segoe UI", 12)).pack(fill="x", pady=4)

    def browse_folder(self):
        sel = fd.askdirectory(initialdir=self.install_dir.get(), parent=self)
        if sel:
            self.install_dir.set(os.path.normpath(os.path.join(sel, DEFAULT_INSTALL_SUBDIR)))

    def show_step_3(self):
        for w in self.body.winfo_children():
            w.destroy()

        self.btn_next.configure(state="disabled", text="جاري التثبيت...")
        self.btn_cancel.configure(state="disabled")

        card = ctk.CTkFrame(self.body, corner_radius=12, fg_color=col("card"), border_width=1, border_color=col("border_light"))
        card.pack(fill="both", expand=True, padx=4, pady=4)
        c_in = ctk.CTkFrame(card, fg_color="transparent")
        c_in.pack(fill="both", expand=True, padx=24, pady=24)

        ctk.CTkLabel(c_in, text=f"جاري تثبيت ملفات {APP_NAME}...", font=("Segoe UI", 15, "bold"), text_color=col("text"), anchor="e").pack(fill="x", pady=(0, 10))
        self.lbl_progress = ctk.CTkLabel(c_in, text="بدء استخراج الحزمة...", font=("Segoe UI", 11), text_color=col("text_muted"), anchor="e")
        self.lbl_progress.pack(fill="x", pady=(0, 8))

        self.prog_bar = ctk.CTkProgressBar(c_in, height=10, corner_radius=5, progress_color=col("primary"))
        self.prog_bar.set(0.0)
        self.prog_bar.pack(fill="x", pady=10)

        threading.Thread(target=self._run_install_worker, daemon=True).start()

    def _run_install_worker(self):
        plan = None
        committed = False
        try:
            self._set_prog(0.1, "استخراج ملفات البرنامج...")
            # A malformed setup is refused before touching the user's directory.
            validate_setup_payload(self.payload_zip_path)
            plan = prepare_and_copy_payload(
                os.path.normpath(self.install_dir.get()),
                self.payload_zip_path,
                startup=bool(self.chk_startup.get()),
            )
            dest = plan["dest"]
            created_root = plan["created_root"]
            owned_files = plan["owned_files"]
            owned_dirs = plan["owned_dirs"]
            self._set_prog(0.7, "اكتمل استخراج الحزمة")

            self._set_prog(0.75, "إنشاء اختصارات سطح المكتب وقائمة ابدأ...")
            target_exe = require_installed_executable(plan)
            icon_ico = os.path.join(dest, "assets", "negm.ico")
            if not os.path.exists(icon_ico):
                icon_ico = target_exe

            created_shortcuts = []
            self.integration_notes = []
            shortcut_jobs = []
            if self.chk_desktop.get():
                shortcut_jobs.append(os.path.join(os.path.expanduser(r"~\Desktop"), f"{APP_NAME}.lnk"))
            if self.chk_startmenu.get():
                programs_menu = os.path.expandvars(r"%APPDATA%\Microsoft\Windows\Start Menu\Programs")
                shortcut_jobs.append(os.path.join(programs_menu, f"{APP_NAME}.lnk"))
            for shortcut_path in shortcut_jobs:
                outcome = create_windows_shortcut(
                    target_exe, shortcut_path, f"{APP_NAME} Download Manager", icon_ico
                )
                if outcome == "created":
                    created_shortcuts.append(os.path.abspath(shortcut_path))
                elif outcome == "preserved":
                    self.integration_notes.append(
                        "تُرك اختصار موجود دون تعديل: %s" % shortcut_path
                    )
                else:
                    raise installer_safety.InstallSafetyError(
                        "تعذر إنشاء الاختصار، ولم يتم استبدال ملف موجود."
                    )

            self._set_prog(0.88, "تسجيل برنامج إزالة التثبيت وإعدادات Windows...")
            uninstaller_path = write_safe_uninstaller(
                dest, owned_files, owned_dirs, created_root=created_root,
                shortcut_paths=created_shortcuts,
            )
            committed = True
            register_uninstall(dest, uninstaller_path)

            if self.chk_startup.get() and sys.platform == "win32":
                installer_safety.assert_run_value_available(
                    installer_safety.DEFAULT_RUN_KEY, APP_NAME, target_exe
                )
                import winreg
                with winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Software\Microsoft\Windows\CurrentVersion\Run", 0, winreg.KEY_SET_VALUE) as key:
                    winreg.SetValueEx(key, APP_NAME, 0, winreg.REG_SZ, f'"{target_exe}" --tray')

            self._set_prog(1.0, "اكتمل التثبيت بنجاح!")
            self.after(500, self.show_step_4)
        except Exception as e:
            if plan is not None and not committed:
                installer_safety.restore_write_snapshot(plan["snapshot"])
            self._set_prog(1.0, f"خطأ أثناء التثبيت: {str(e)[:70]}")
            self.after(1000, lambda: self.btn_next.configure(state="normal", text="إغلاق", command=self.destroy))

    def _set_prog(self, val, msg):
        def _u():
            self.prog_bar.set(val)
            self.lbl_progress.configure(text=msg)
        self.after(0, _u)

    def show_step_4(self):
        for w in self.body.winfo_children():
            w.destroy()

        self.btn_next.configure(state="normal", text="إنهاء  ✔", command=self.finish_install)
        self.btn_cancel.pack_forget()

        card = ctk.CTkFrame(self.body, corner_radius=12, fg_color=col("card"), border_width=1, border_color=col("border_light"))
        card.pack(fill="both", expand=True, padx=4, pady=4)
        c_in = ctk.CTkFrame(card, fg_color="transparent")
        c_in.pack(fill="both", expand=True, padx=24, pady=24)

        ctk.CTkLabel(c_in, text=f"تهانينا! تم تثبيت {APP_NAME} بنجاح", font=("Segoe UI", 18, "bold"), text_color=col("success"), anchor="e").pack(fill="x", pady=(0, 8))
        msg = (
            f"تم تثبيت {APP_NAME} بنجاح على جهازك وهو جاهز للاستخدام الفوري.\n\n"
            f"المسار: {self.install_dir.get()}\n\n"
            "• تم تفعيل كافة ميزات التنزيل متعدد الأجزاء.\n"
            "• إضافة المتصفح جاهزة في مجلد البرنامج للتفعيل المباشر.\n"
        )
        notes = getattr(self, "integration_notes", None) or []
        if notes:
            msg += "\n" + "\n".join(notes) + "\n"
        ctk.CTkLabel(c_in, text=msg, font=("Segoe UI", 12), text_color=col("text_muted"), justify="right", anchor="e").pack(fill="x", pady=(0, 16))
        ctk.CTkCheckBox(c_in, text=f"تشغيل {APP_NAME} الآن", variable=self.chk_launch, font=("Segoe UI", 13, "bold")).pack(fill="x", pady=6)

    def go_next(self):
        if self.step == 0:
            self.step = 1
            self.show_step_2()
            self.btn_next.configure(text="تثبيت الآن  ◀")
        elif self.step == 1:
            self.step = 2
            self.show_step_3()

    def finish_install(self):
        if self.chk_launch.get():
            target_exe = installed_executable_path(os.path.normpath(self.install_dir.get()))
            if os.path.exists(target_exe):
                try:
                    subprocess.Popen([target_exe], close_fds=True, creationflags=0x00000008 if sys.platform == "win32" else 0)
                except Exception:
                    pass
        self.destroy()

if __name__ == "__main__":
    app = SetupWizard()
    app.mainloop()


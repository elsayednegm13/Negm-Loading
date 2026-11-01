import os
import sys
import zipfile
import subprocess
import shutil

print("=== Starting NegmLoading Setup Packaging ===")

dist_dir = os.path.abspath("dist")
exe_path = os.path.join(dist_dir, "NegmLoading.exe")

if not os.path.exists(exe_path):
    print(f"Error: {exe_path} not found! Build NegmLoading.exe first.")
    sys.exit(1)

payload_zip = os.path.abspath("payload.zip")
if os.path.exists(payload_zip):
    try:
        os.remove(payload_zip)
    except Exception:
        pass

print("Creating payload.zip...")
with zipfile.ZipFile(payload_zip, "w", zipfile.ZIP_DEFLATED) as z:
    z.write(exe_path, "NegmLoading.exe")
    
    # Bundle browser extension
    ext_dir = os.path.abspath("browser_extension")
    if os.path.exists(ext_dir):
        for root, dirs, files in os.walk(ext_dir):
            for file in files:
                p = os.path.join(root, file)
                rel = os.path.relpath(p, os.path.dirname(ext_dir))
                z.write(p, rel)
                
    # Bundle assets
    assets_dir = os.path.abspath("assets")
    if os.path.exists(assets_dir):
        for root, dirs, files in os.walk(assets_dir):
            for file in files:
                p = os.path.join(root, file)
                rel = os.path.relpath(p, os.path.dirname(assets_dir))
                z.write(p, rel)

print(f"payload.zip created: {os.path.getsize(payload_zip) / (1024*1024):.2f} MB")

# Setup spec file
setup_spec_content = '''# -*- mode: python ; coding: utf-8 -*-
from PyInstaller.utils.hooks import collect_data_files

ctk_datas = collect_data_files('customtkinter')

datas = ctk_datas + [
    ('payload.zip', '.'),
    ('assets/negm.ico', 'assets'),
]

a = Analysis(
    ['installer_engine.py'],
    pathex=['.'],
    binaries=[],
    datas=datas,
    hiddenimports=['customtkinter'],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['matplotlib', 'numpy', 'pandas', 'scipy', 'pytest'],
    noarchive=False,
    optimize=0,
)

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='NegmLoading-Setup',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=['assets/negm.ico'],
)
'''

with open("NegmLoading-Setup.spec", "w", encoding="utf-8") as f:
    f.write(setup_spec_content)

print("NegmLoading-Setup.spec written.")
print("=== Ready to compile NegmLoading-Setup.exe ===")


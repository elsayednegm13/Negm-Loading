# -*- mode: python ; coding: utf-8 -*-
from PyInstaller.utils.hooks import collect_data_files, collect_all

ctk_datas = collect_data_files('customtkinter')
dnd_datas, dnd_binaries, dnd_hiddenimports = collect_all('tkinterdnd2')

datas = (
    ctk_datas
    + dnd_datas
    + [
        ('assets/fonts/fa-solid-900.ttf', 'assets/fonts'),
        ('assets/negm.ico', 'assets'),
        ('assets/negm_logo.png', 'assets'),
        ('browser_extension', 'browser_extension'),
    ]
)

hiddenimports = (
    dnd_hiddenimports
    + [
        'nexus_engine',
        'ui_theme',
        'ui_components',
        'ui_table',
        'ui_dialogs',
        'pystray._win32',
        'PIL._tkinter_finder',
    ]
)

a = Analysis(
    ['nexus_stream_manager.py'],
    pathex=['.'],
    binaries=dnd_binaries,
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['matplotlib', 'numpy', 'pandas', 'scipy', 'pytest', 'IPython'],
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
    name='NegmLoading',
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
    version='version_info.txt',
    icon=['assets/negm.ico'],
)

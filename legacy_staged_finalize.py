# -*- coding: utf-8 -*-
"""External, TEST-ONLY finalizer for an F01-sealed disposable staging folder.

Windows cmd.exe commonly keeps its currently executing uninstall.cmd open.
The F01 PowerShell helper can remove the payload, manifest, helper and HKCU
anchor, yet the batch launcher remains. A batch file deleting itself cannot
reliably return a success code. This wrapper solves that corner only when
running under the verified F01 *test* registry identity and temporary folder.

It never invokes the legacy uninstaller or touches the real product HKCU key,
shortcut, old application or downloaded data. It does not activate upgrades.
"""
from __future__ import annotations

import os
import subprocess
import tempfile
from pathlib import Path

import installer_safety as safety
import legacy_migration as legacy
from legacy_staged_seal import _require_test_anchor

CONSENT = "RUN_AND_FINALIZE_DISPOSABLE_STAGE_ONLY"


def run_and_finalize_test_stage(stage_root, anchor_key, *, consent=None):
    """Run its manifest-owned uninstaller, then delete only its own batch.

    The wrapper is intentionally not a production installation feature.
    It refuses any stage outside the OS temp tree, an existing foreign file,
    any unknown shortcut, an unverified anchor, or a changed launcher.
    """
    if os.name != "nt":
        raise legacy.MigrationBlocked("External test stage finalizer needs Windows")
    if consent != CONSENT:
        raise legacy.MigrationBlocked("Finalization requires explicit test consent")
    _require_test_anchor(anchor_key)
    stage = Path(safety.validate_install_root(str(stage_root)))
    temp_dir = Path(tempfile.gettempdir())
    legacy._no_reparse_ancestors(stage)
    if (not legacy._inside(temp_dir, stage)
            or legacy._canonical(stage) == legacy._canonical(temp_dir)
            or not stage.is_dir()):
        raise legacy.MigrationBlocked("Only disposable nested temp stages are allowed")

    manifest = safety.load_manifest(str(stage), expected_app_name=safety.DEFAULT_APP_NAME)
    safety.verify_install_anchor(str(stage), manifest, anchor_key)
    if not manifest["created_root"] or manifest["shortcuts"]:
        raise legacy.MigrationBlocked("Stage is not a self-contained test install")
    recorded = {item["path"].replace("\\", "/").casefold(): item
                for item in manifest["files"]}
    required = (safety.UNINSTALL_PS1_FILENAME, safety.UNINSTALL_CMD_FILENAME,
                safety.DEFAULT_APP_EXE_FILENAME)
    for name in required:
        entry = recorded.get(name.casefold())
        if not entry or not isinstance(entry.get("sha256"), str):
            raise legacy.MigrationBlocked("Required modern install artifact missing")
        path = stage / name
        legacy._no_reparse_ancestors(path)
        legacy._checked_file(path)
        if safety.sha256_file(str(path)) != entry["sha256"]:
            raise legacy.MigrationBlocked("Stage artifact changed since install")
    launcher = stage / safety.UNINSTALL_CMD_FILENAME
    launcher_sha = recorded[safety.UNINSTALL_CMD_FILENAME.casefold()]["sha256"]

    result = subprocess.run(
        'cmd.exe /s /c ""%s""' % launcher,
        cwd=str(stage.parent), capture_output=True, timeout=120,
        check=False,
    )
    if result.returncode != safety.EXIT_OK:
        # Do not expose program output/paths/credentials; do not force cleanup
        # when the safe uninstaller refused or left recovery data behind.
        raise legacy.MigrationBlocked("Safe stage uninstall did not complete")
    import winreg
    try:
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, anchor_key,
                            0, winreg.KEY_READ):
            raise legacy.MigrationBlocked("Stage anchor still exists after uninstall")
    except FileNotFoundError:
        pass
    if not stage.exists():
        return {"status": "TEST_STAGE_REMOVED",
                "production_activation": False}
    legacy._no_reparse_ancestors(stage)
    contents = list(stage.iterdir())
    if len(contents) != 1 or contents[0].name.casefold() != launcher.name.casefold():
        raise legacy.MigrationBlocked(
            "Uninstaller left files other than its owned launcher; keep all"
        )
    legacy._checked_file(launcher)
    if safety.sha256_file(str(launcher)) != launcher_sha:
        raise legacy.MigrationBlocked("Launcher modified since manifest inventory")

    # One known SHA-256-matching file, and then an EMPTY directory only.
    # No rmtree, recursive deletion, or foreign shortcut/registry operation.
    os.unlink(launcher)
    os.rmdir(stage)
    return {
        "status": "TEST_STAGE_REMOVED_WITH_EXTERNAL_OWNED_LAUNCHER_FINALIZER",
        "production_activation": False,
        "deleted_untracked_files": False,
    }

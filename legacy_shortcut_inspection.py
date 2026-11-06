# -*- coding: utf-8 -*-
"""Read-only Windows Shell Link preflight for legacy-upgrade candidates.

A link pointing to the old executable is NOT sufficient evidence that this
installer owns the link. This module deliberately never changes a .lnk and
never returns an "approved for replacement" decision. It only identifies
plausible candidates for a later consent + ownership + rollback review.

No shell command is taken from the link. The WScript.Shell COM shortcut
object is inspected via an invariant PowerShell command; targets are never
launched. Test fixtures are created only in disposable Windows temp folders.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import subprocess
from pathlib import Path

import installer_safety as safety
import legacy_migration as legacy

MAX_SHORTCUT_BYTES = 256 * 1024
EXPECTED_EXECUTABLES = ("Negm Lodaing.exe", "NegmLoading.exe")
CANDIDATE_STATUS = "TARGET_MATCH_ONLY_NOT_OWNERSHIP_PROOF"

# No path or user-provided value is interpolated as PowerShell source.
# The shortcut path travels in a process environment variable.
_READ_COM = r"""
$ErrorActionPreference = 'Stop'
try {
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $path = $env:NEGM_F03_SHORTCUT_READ_PATH
    if ([string]::IsNullOrWhiteSpace($path)) { exit 20 }
    $ws = New-Object -ComObject WScript.Shell
    $link = $ws.CreateShortcut($path)
    [ordered]@{
        target = [string]$link.TargetPath
        arguments = [string]$link.Arguments
        working_directory = [string]$link.WorkingDirectory
        icon_location = [string]$link.IconLocation
    } | ConvertTo-Json -Compress -Depth 2
} catch {
    exit 21
}
"""


def _read_link_metadata(path):
    if os.name != "nt":
        raise legacy.MigrationBlocked("Windows shortcut inspection requires Windows")
    env = os.environ.copy()
    env["NEGM_F03_SHORTCUT_READ_PATH"] = str(path)
    try:
        result = subprocess.run(
            ["powershell.exe", "-NoProfile", "-NonInteractive",
             "-Command", _READ_COM],
            env=env, capture_output=True, text=True, encoding="utf-8",
            errors="replace", timeout=20, check=False,
            creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
        )
    except (OSError, subprocess.TimeoutExpired) as exc:
        raise legacy.MigrationBlocked("Windows shortcut reader unavailable") from exc
    if result.returncode != 0:
        # Error output may include private shortcut targets; never expose it.
        raise legacy.MigrationBlocked("Unable to inspect Windows shortcut")
    if len(result.stdout) > 16 * 1024:
        raise legacy.MigrationBlocked("Shortcut metadata exceeds safe limit")
    try:
        record = json.loads(result.stdout)
    except (ValueError, TypeError) as exc:
        raise legacy.MigrationBlocked("Invalid shortcut metadata") from exc
    if not isinstance(record, dict) or set(record) != {
            "target", "arguments", "working_directory", "icon_location"}:
        raise legacy.MigrationBlocked("Unexpected shortcut metadata fields")
    if any(not isinstance(value, str) or "\x00" in value
           for value in record.values()):
        raise legacy.MigrationBlocked("Shortcut metadata contains invalid text")
    return record


def _icon_path(icon):
    if not icon:
        return ""
    # WScript.Shell writes "file path,0" for its IconLocation. A comma in
    # a folder is not a delimiter unless followed by a numeric icon index.
    candidate, comma, number = icon.rpartition(",")
    if comma and re.fullmatch(r"-?\d+", number.strip()):
        return candidate.strip('" ')
    return icon.strip('" ')


def inspect_legacy_shortcut(shortcut_path, legacy_install_root,
                            *, expected_sha256=None):
    """Return only an observed candidate, NEVER authority to change the link.

    Strictly require the same old exe filename and exact install directory,
    no launch arguments, working directory within the old root, and icon
    within the old root if specified. Missing/foreign links fail closed.
    """
    if os.name != "nt":
        raise legacy.MigrationBlocked("Windows shortcut inspection requires Windows")
    root = safety.validate_install_root(os.fspath(legacy_install_root))
    legacy._no_reparse_ancestors(root)
    if not Path(root).is_dir():
        raise legacy.MigrationBlocked("Legacy install directory missing")

    path = Path(os.path.abspath(shortcut_path))
    if path.suffix.lower() != ".lnk":
        raise legacy.MigrationBlocked("Shortcut must have .lnk extension")
    legacy._no_reparse_ancestors(path)
    info = legacy._checked_file(path)
    if not 0 < info.st_size <= MAX_SHORTCUT_BYTES:
        raise legacy.MigrationBlocked("Shortcut file size outside policy")
    first_hash = safety.sha256_file(str(path))
    if expected_sha256 is not None and expected_sha256 != first_hash:
        raise legacy.MigrationBlocked("Shortcut differs from inventoried bytes")

    record = _read_link_metadata(path)
    target = record["target"]
    working = record["working_directory"]
    if not os.path.isabs(target) or not os.path.isabs(working):
        raise legacy.MigrationBlocked("Shortcut target/directory is not absolute")
    legacy._no_reparse_ancestors(target)
    if not Path(target).is_file():
        raise legacy.MigrationBlocked("Legacy shortcut target is absent")
    if legacy._canonical(working) != legacy._canonical(root):
        raise legacy.MigrationBlocked("Legacy shortcut working directory mismatch")
    if record["arguments"].strip():
        raise legacy.MigrationBlocked("Legacy shortcut launch arguments are not expected")

    accepted = []
    for basename in EXPECTED_EXECUTABLES:
        candidate = Path(root) / basename
        if os.path.lexists(candidate):
            legacy._no_reparse_ancestors(candidate)
            legacy._checked_file(candidate)
            accepted.append(legacy._canonical(candidate))
    if legacy._canonical(target) not in accepted:
        raise legacy.MigrationBlocked("Shortcut does not target a known legacy executable")

    icon = _icon_path(record["icon_location"])
    if icon:
        if not os.path.isabs(icon) or not legacy._inside(root, icon):
            raise legacy.MigrationBlocked("Shortcut icon is outside legacy installation")
        legacy._no_reparse_ancestors(icon)
    if first_hash != safety.sha256_file(str(path)):
        raise legacy.MigrationBlocked("Shortcut changed while inspecting")
    if (info.st_size != os.lstat(path).st_size
            or info.st_mtime_ns != os.lstat(path).st_mtime_ns):
        raise legacy.MigrationBlocked("Shortcut metadata changed while inspecting")
    return {
        "status": CANDIDATE_STATUS,
        "sha256": first_hash,
        "safe_to_replace": False,
        "requires_explicit_consent": True,
    }

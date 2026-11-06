# -*- coding: utf-8 -*-
r"""Independent F01-safe uninstall coordinator — REVIEW CANDIDATE, NOT WIRED.

This is deliberately separate from the Windows setup wizard. It can drive
ONLY an existing, HKCU-anchored, manifest-owned modern installation. It does
not migrate an old version and never runs an old legacy uninstall.cmd.

Unlike the old batch entrypoint, this coordinator invokes the verified
PowerShell helper directly and THEN deletes the last verified batch launcher. The preflight is STRICT:
every on-disk file must match the HKCU-bound manifest and no unexpected
directory or link is accepted. Shortcut-owning installations are blocked;
shortcut ownership is verified against F01's HKCU-bound SHA256/target\nrecords; existing startup-value handling remains in its verified helper.

Security model: same-user HKCU authority (as in F01); a malicious same-user
process can race registry and filesystem writes. Lock is cooperative only.
This is not yet a packaged, user-facing production uninstall entrypoint.
"""
from __future__ import annotations

import contextlib
import hashlib
import os
import stat
import subprocess
import tempfile
from pathlib import Path

import installer_safety as safety
import legacy_migration as legacy

CONSENT = "REMOVE_THIS_VERIFIED_MODERN_INSTALL"
MAX_INVENTORY = 10000


def _normalized(path):
    return safety.validate_relative_path(path).replace("\\", "/").casefold()


def _safe_file(path):
    if safety.is_reparse_point(str(path)):
        raise safety.InstallSafetyError("Linked uninstall resource refused")
    info = os.lstat(path)
    if not stat.S_ISREG(info.st_mode):
        raise safety.InstallSafetyError("Nonregular uninstall resource refused")
    return info


def _safe_directory(path):
    if safety.is_reparse_point(str(path)) or not os.path.isdir(path):
        raise safety.InstallSafetyError("Linked or invalid uninstall directory")


def _lock_filename(root, anchor_key):
    """Normalize Windows 8.3/long names to the SAME cooperative lock key."""
    if not isinstance(anchor_key, str) or not safety._safe_registry_key(anchor_key):
        raise safety.InstallSafetyError("Invalid registry identity for lock")
    identity = (os.path.normcase(os.path.realpath(os.fspath(root))) + "\n"
                + anchor_key.casefold()).encode("utf-8")
    return "negm-owned-uninstall-" + hashlib.sha256(identity).hexdigest() + ".lock"


@contextlib.contextmanager
def _uninstall_lock(root, anchor_key):
    """Cooperative OS lock outside the install folder, kept across restarts."""
    import msvcrt

    lockfile = Path(tempfile.gettempdir()) / _lock_filename(root, anchor_key)
    _safe_directory(lockfile.parent)
    if os.path.lexists(lockfile):
        _safe_file(lockfile)
    flags = os.O_RDWR | os.O_CREAT | getattr(os, "O_BINARY", 0)
    descriptor = os.open(lockfile, flags, 0o600)
    with os.fdopen(descriptor, "r+b", buffering=0) as stream:
        metadata = os.fstat(stream.fileno())
        if not stat.S_ISREG(metadata.st_mode):
            raise safety.InstallSafetyError("Uninstall lock is not regular")
        if metadata.st_size == 0:
            stream.write(bytes([0]))
        stream.seek(0)
        try:
            msvcrt.locking(stream.fileno(), msvcrt.LK_NBLCK, 1)
        except OSError as exc:
            raise safety.InstallSafetyError(
                "Another uninstall owns the same lock"
            ) from exc
        try:
            yield
        finally:
            stream.seek(0)
            msvcrt.locking(stream.fileno(), msvcrt.LK_UNLCK, 1)


def _anchored_preflight(root, anchor_key):
    """Verify a closed on-disk inventory, not only the launcher hash."""
    if not isinstance(anchor_key, str) or not safety._safe_registry_key(anchor_key):
        raise safety.InstallSafetyError("Invalid uninstall registry identity")
    if (anchor_key != safety.DEFAULT_UNINSTALL_KEY
            and not anchor_key.startswith(safety.TEST_ANCHOR_PREFIX)):
        raise safety.InstallSafetyError("Unrecognized uninstall registry identity")
    _safe_directory(root)
    current = root
    while True:
        if safety.is_reparse_point(str(current)):
            raise safety.InstallSafetyError("Linked ancestor of install root")
        if current == current.parent:
            break
        current = current.parent
    manifest = safety.load_manifest(str(root), expected_app_name=safety.DEFAULT_APP_NAME)
    safety.verify_install_anchor(str(root), manifest, anchor_key)
    # Only shortcuts that F01 recorded with BOTH install-time bytes and
    # target can be considered owned. This is NOT legacy-shortcut adoption:
    # old pre-manifest shortcuts still have no ownership proof and are refused.
    owned_shortcuts = []
    known_shortcut_paths = set()
    for link in manifest["shortcuts"]:
        link_path = Path(safety.validate_shortcut_path(link["path"]))
        link_id = os.path.normcase(str(link_path))
        if link_id in known_shortcut_paths:
            raise safety.InstallSafetyError("Duplicate shortcut ownership record")
        known_shortcut_paths.add(link_id)
        original_hash = link.get("sha256")
        expected_target = link.get("target")
        if not original_hash or not expected_target:
            raise safety.InstallSafetyError(
                "Shortcut has no verified install-time ownership record"
            )
        if not os.path.lexists(link_path):
            # A user may already have removed an installer-owned shortcut.
            owned_shortcuts.append((str(link_path), False))
            continue
        _safe_file(link_path)
        if safety.sha256_file(str(link_path)) != original_hash:
            raise safety.InstallSafetyError("Installer-owned shortcut was modified")
        try:
            current_target = safety.read_shortcut_target(str(link_path))
        except OSError as exc:
            raise safety.InstallSafetyError(
                "Cannot verify shortcut target"
            ) from exc
        # COM commonly expands 8.3 Windows names (RUNNER~1 -> runneradmin).
        # Literal string comparison can reject identical existing files.
        # Resolve Windows aliases only AFTER refusing reparse/symlink ancestors.
        try:
            if not os.path.isabs(current_target) or not os.path.isabs(expected_target):
                raise safety.InstallSafetyError("Shortcut target must be absolute")
            legacy._no_reparse_ancestors(current_target)
            legacy._no_reparse_ancestors(expected_target)
            if (not os.path.samefile(current_target, expected_target)
                    or not legacy._inside(root, current_target)
                    or not legacy._inside(root, expected_target)):
                raise safety.InstallSafetyError(
                    "Shortcut does not target the owned installation"
                )
        except (OSError, legacy.MigrationBlocked) as exc:
            raise safety.InstallSafetyError(
                "Shortcut target cannot be safely resolved"
            ) from exc
        owned_shortcuts.append((str(link_path), True))
    if not manifest["created_root"]:
        raise safety.InstallSafetyError("Only dedicated created install roots supported")

    entries = {}
    for item in manifest["files"]:
        name = _normalized(item["path"])
        if name in entries or name == _normalized(safety.MANIFEST_FILENAME):
            raise safety.InstallSafetyError("Ambiguous owned-file inventory")
        entries[name] = item["sha256"]
    required = (safety.UNINSTALL_CMD_FILENAME,
                safety.UNINSTALL_PS1_FILENAME,
                safety.DEFAULT_APP_EXE_FILENAME)
    if any(_normalized(name) not in entries for name in required):
        raise safety.InstallSafetyError("Missing required owned uninstall files")
    dirs = set()
    for item in manifest["directories"]:
        value = _normalized(item["path"])
        if value in dirs:
            raise safety.InstallSafetyError("Duplicate owned directory")
        dirs.add(value)

    encountered = set()
    encountered_dirs = set()
    for folder, children, names in os.walk(root, topdown=True, followlinks=False):
        relative = Path(folder).relative_to(root)
        for child in children:
            path = Path(folder) / child
            _safe_directory(path)
            name = _normalized((relative / child).as_posix())
            if name not in dirs:
                raise safety.InstallSafetyError("Untracked directory blocks uninstall")
            encountered_dirs.add(name)
        for child in names:
            path = Path(folder) / child
            _safe_file(path)
            rel = _normalized((relative / child).as_posix())
            if rel in encountered:
                raise safety.InstallSafetyError("Duplicate on-disk file identity")
            encountered.add(rel)
            if rel == _normalized(safety.MANIFEST_FILENAME):
                continue
            if rel not in entries:
                raise safety.InstallSafetyError("Untracked file blocks uninstall")
            if safety.sha256_file(str(path)) != entries[rel]:
                raise safety.InstallSafetyError("Modified owned file blocks uninstall")
            if len(encountered) > MAX_INVENTORY:
                raise safety.InstallSafetyError("Uninstall file count exceeds limit")

    if encountered != set(entries) | {_normalized(safety.MANIFEST_FILENAME)}:
        raise safety.InstallSafetyError("Owned install file missing")
    if encountered_dirs != dirs:
        raise safety.InstallSafetyError("Owned install directory missing")
    return {"manifest": manifest, "launcher_sha": entries[
        _normalized(safety.UNINSTALL_CMD_FILENAME)],
        "owned_shortcuts": owned_shortcuts}


def _assert_anchor_retired(anchor_key):
    import winreg
    try:
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, anchor_key, 0,
                            winreg.KEY_READ):
            raise safety.InstallSafetyError("Install anchor still exists")
    except FileNotFoundError:
        pass


def complete_verified_uninstall(root, anchor_key, *, consent=None):
    """External process coordinates verified, nonrecursive uninstall.

    Refusal before invoking cmd preserves all payload files. Once the F01
    script started, a partial result is NOT rolled back; recovery may require
    a human. Postconditions must be proven before reporting full success.
    """
    if os.name != "nt":
        raise safety.InstallSafetyError("Windows-only uninstall coordinator")
    if consent != CONSENT:
        raise safety.InstallSafetyError("Explicit uninstall consent required")
    # Require an absolute explicit directory. Never infer it from HKCU alone.
    if not isinstance(root, (str, os.PathLike)) or not os.path.isabs(root):
        raise safety.InstallSafetyError("Absolute install root required")
    folder = Path(safety.validate_install_root(os.fspath(root)))
    if not isinstance(anchor_key, str) or not safety._safe_registry_key(anchor_key):
        raise safety.InstallSafetyError("Invalid registry identity")
    # There is no shell interpolation: PowerShell is called as an executable
    # with separate arguments. A literal path is never evaluated as script.
    with _uninstall_lock(folder, anchor_key):
        prepared = _anchored_preflight(folder, anchor_key)
        cmd = folder / safety.UNINSTALL_CMD_FILENAME
        helper = folder / safety.UNINSTALL_PS1_FILENAME
        # Never launch the batch file, whose self-removal is unreliable.
        # Execute the HKCU-manifest-verified PowerShell helper directly with
        # an argument vector; this avoids cmd.exe expansion/injection.
        try:
            result = subprocess.run(
                [safety._powershell_exe(), "-NoProfile", "-NonInteractive",
                 "-ExecutionPolicy", "Bypass", "-File", str(helper)],
                cwd=str(folder.parent), capture_output=True,
                timeout=120, check=False,
                creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
            )
        except (OSError, subprocess.TimeoutExpired) as exc:
            raise safety.InstallSafetyError(
                "Verified uninstall failed or timed out; manual recovery required"
            ) from exc
        if result.returncode != safety.EXIT_OK:
            # stdout/stderr may contain personal paths; never expose either.
            raise safety.InstallSafetyError(
                "Safe uninstall stopped; recovery resources may remain"
            )
        _assert_anchor_retired(anchor_key)
        # A successful helper must have retired every present, install-owned
        # shortcut. A new/foreign link appearing at an old pathname is never
        # touched by this coordinator and blocks the success verdict.
        for shortcut_path, _was_present in prepared["owned_shortcuts"]:
            if os.path.lexists(shortcut_path):
                raise safety.InstallSafetyError(
                    "Owned shortcut still exists after helper; manual inspection required"
                )
        if not folder.is_dir() or safety.is_reparse_point(str(folder)):
            raise safety.InstallSafetyError("Uninstall root changed unexpectedly")
        remaining = list(folder.iterdir())
        if len(remaining) != 1 or remaining[0].name.casefold() != cmd.name.casefold():
            raise safety.InstallSafetyError(
                "Uninstall left unexpected entries; no further deletion allowed"
            )
        _safe_file(cmd)
        if safety.sha256_file(str(cmd)) != prepared["launcher_sha"]:
            raise safety.InstallSafetyError("Uninstall launcher changed during cleanup")
        # Only delete this exact file, recorded in the HKCU-anchored manifest.
        # Directory removal is nonrecursive; an unrelated file always blocks.
        os.unlink(cmd)
        try:
            os.rmdir(folder)
        except OSError as exc:
            raise safety.InstallSafetyError(
                "Launcher removed, but install root is not empty; check manually"
            ) from exc
        if folder.exists():
            raise safety.InstallSafetyError("Install root remained after cleanup")
        return {"status": "COMPLETE_VERIFIED_UNINSTALL",
                "left_foreign_files": False, "production_wired": False}

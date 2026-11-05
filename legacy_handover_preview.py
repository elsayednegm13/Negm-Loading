# -*- coding: utf-8 -*-
"""F03 registry handover *simulation* limited to disposable HKCU test keys.

Not an application feature and not imported by the installer. A durable
encrypted write-ahead journal is created BEFORE registry changes. Recovery
touches only values that still equal the journal's recorded before/after
values. A key changing to a third value blocks recovery rather than risking
overwriting a user's edit.

IMPORTANT: Windows registry does not provide atomic compare-and-swap here.
This test harness is NOT a production transactional migration mechanism.
Production activation requires exclusive app/process coordination, ownership
verification, schema validation and a reviewed failure/restart protocol.
"""
from __future__ import annotations

import hashlib
import json
import os
import stat
from contextlib import contextmanager
from pathlib import Path

import installer_safety as safety
import legacy_migration as legacy

FORMAT = "negm-f03-test-handover-v1"
REG_SZ = 1
REG_EXPAND_SZ = 2
REG_DWORD = 4
KINDS = {REG_SZ, REG_EXPAND_SZ, REG_DWORD}


def _test_scope(root, key):
    prefix = safety.TEST_ANCHOR_PREFIX
    if (not isinstance(root, str) or not root.startswith(prefix)
            or not safety._safe_registry_key(root)):
        raise legacy.MigrationBlocked("Only disposable F03 test HKCU roots allowed")
    if not isinstance(key, str) or not safety._safe_registry_key(key):
        raise legacy.MigrationBlocked("Invalid HKCU test key")
    if key != root and not key.startswith(root + "\\"):
        raise legacy.MigrationBlocked("Registry operation escapes its test root")


def _value(item):
    if item is None:
        return None
    if not isinstance(item, dict) or set(item) != {"kind", "value"}:
        raise legacy.MigrationBlocked("Invalid typed registry value")
    kind, data = item["kind"], item["value"]
    if type(kind) is not int or kind not in KINDS:
        raise legacy.MigrationBlocked("Unexpected registry data type")
    if kind == REG_DWORD:
        if type(data) is not int or not 0 <= data < 2**32:
            raise legacy.MigrationBlocked("Invalid DWORD registry value")
    elif not isinstance(data, str) or "\x00" in data or len(data) > 8192:
        raise legacy.MigrationBlocked("Invalid registry string")
    return {"kind": kind, "value": data}


class FakeTestRegistry:
    """In-memory fault-injection backend; never connected to real Windows."""

    def __init__(self, root):
        _test_scope(root, root)
        self.root = root
        self.data = {}
        self.write_hook = None

    def get(self, key, name):
        _test_scope(self.root, key)
        return self.data.get((key, name))

    def set(self, key, name, item):
        _test_scope(self.root, key)
        if self.write_hook:
            self.write_hook(key, name, item)
        if item is None:
            self.data.pop((key, name), None)
        else:
            self.data[(key, name)] = _value(item)


class WindowsDisposableRegistry:
    """Adapter that refuses EVERY key outside its unique F01/F03 test root."""

    def __init__(self, root):
        if os.name != "nt":
            raise legacy.MigrationBlocked("Windows test registry required")
        _test_scope(root, root)
        self.root = root

    def get(self, key, name):
        _test_scope(self.root, key)
        import winreg
        try:
            with winreg.OpenKey(winreg.HKEY_CURRENT_USER, key,
                                0, winreg.KEY_QUERY_VALUE) as handle:
                data, kind = winreg.QueryValueEx(handle, name)
        except FileNotFoundError:
            # The test harness never creates a registry key.
            return None
        return _value({"kind": kind, "value": data})

    def set(self, key, name, item):
        _test_scope(self.root, key)
        import winreg
        # Open only existing test-created keys; cannot create or delete keys.
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, key, 0,
                            winreg.KEY_SET_VALUE) as handle:
            if item is None:
                try:
                    winreg.DeleteValue(handle, name)
                except FileNotFoundError:
                    pass
            else:
                item = _value(item)
                winreg.SetValueEx(handle, name, 0, item["kind"], item["value"])


def _check_name(name):
    if (not isinstance(name, str) or not name
            or any(char in name for char in ("\x00", "\r", "\n", "\\"))):
        raise legacy.MigrationBlocked("Invalid registry value name")



@contextmanager
def _exclusive_preview_lock(journal_file):
    """Nonblocking per-journal OS lock; automatically released after process exit.

    The lock file is deliberately retained so another process never mistakes
    deletion/re-creation for a released OS lock. The preview never uses a
    production uninstall key and does not claim inter-process ownership of
    the real application.
    """
    lock_path = Path(str(Path(journal_file)) + ".lock")
    legacy._no_reparse_ancestors(lock_path.parent)
    if os.path.lexists(lock_path):
        legacy._checked_file(lock_path)
    descriptor = os.open(
        lock_path, os.O_RDWR | os.O_CREAT | getattr(os, "O_BINARY", 0), 0o600
    )
    with os.fdopen(descriptor, "r+b", buffering=0) as handle:
        info = os.fstat(handle.fileno())
        if not stat.S_ISREG(info.st_mode):
            raise legacy.MigrationBlocked("Handover lock is not a regular file")
        # msvcrt.locking locks a byte region, including on a newly-created file.
        handle.seek(0)
        handle.write(b"\\x00")
        handle.seek(0)
        try:
            if os.name == "nt":
                import msvcrt
                msvcrt.locking(handle.fileno(), msvcrt.LK_NBLCK, 1)
            else:
                import fcntl
                fcntl.flock(handle.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
        except (OSError, BlockingIOError) as exc:
            raise legacy.MigrationBlocked(
                "Another handover holds the journal lock"
            ) from exc
        try:
            yield
        finally:
            if os.name == "nt":
                msvcrt.locking(handle.fileno(), msvcrt.LK_UNLCK, 1)
            else:
                fcntl.flock(handle.fileno(), fcntl.LOCK_UN)

def _journal(journal_file, crypto, store, backup_root):
    path = Path(journal_file)
    legacy._no_reparse_ancestors(path)
    legacy._checked_file(path)
    if path.stat().st_size > 1024 * 1024:
        raise legacy.MigrationBlocked("Test handover journal size exceeds limit")
    try:
        raw = crypto.decrypt(path.read_bytes())
        doc = json.loads(raw.decode("utf-8"))
    except (ValueError, UnicodeError) as exc:
        raise legacy.MigrationBlocked("Cannot read protected handover journal") from exc
    if doc.get("format") != FORMAT or doc.get("root") != store.root:
        raise legacy.MigrationBlocked("Wrong handover journal identity")
    if not isinstance(doc.get("operations"), list) or not doc["operations"]:
        raise legacy.MigrationBlocked("Invalid empty handover journal")
    if len(doc["operations"]) > 64:
        raise legacy.MigrationBlocked("Too many registry operations")
    seen = set()
    for op in doc["operations"]:
        if set(op) != {"key", "name", "before", "after"}:
            raise legacy.MigrationBlocked("Handover operation format is invalid")
        _test_scope(store.root, op["key"])
        _check_name(op["name"])
        if (op["key"].lower(), op["name"].lower()) in seen:
            raise legacy.MigrationBlocked("Duplicate registry operation")
        seen.add((op["key"].lower(), op["name"].lower()))
        _value(op["before"])
        if _value(op["after"]) is None or op["before"] == op["after"]:
            raise legacy.MigrationBlocked("Handover new value is absent or unchanged")
    verified = legacy.verify_backup(backup_root, crypto)
    backup_sha = safety.sha256_file(
        str(Path(backup_root) / legacy.INDEX_NAME))
    if doc.get("backup_sha256") != backup_sha or not verified["files"]:
        raise legacy.MigrationBlocked("Handover backup changed or contains no files")
    return doc


def prepare_test_journal(store, changes, journal_file, backup_root, crypto):
    """Write protected WAL to NEW location; reject any existing/invalid value."""
    if not changes or len(changes) > 64:
        raise legacy.MigrationBlocked("Invalid handover scope")
    legacy.verify_backup(backup_root, crypto)
    path = Path(os.path.abspath(journal_file))
    legacy._no_reparse_ancestors(path.parent)
    if os.path.lexists(path):
        raise legacy.MigrationBlocked("Journal must be a new file")
    for protected in (backup_root,):
        if legacy._inside(protected, path) or legacy._inside(path, protected):
            raise legacy.MigrationBlocked("Journal may not overlap backup")
    operations = []
    seen = set()
    for key, name, after in changes:
        _test_scope(store.root, key)
        _check_name(name)
        token = (key.lower(), name.lower())
        if token in seen:
            raise legacy.MigrationBlocked("Duplicate registry operation")
        seen.add(token)
        next_value = _value(after)
        if next_value is None:
            raise legacy.MigrationBlocked("Deletion is not allowed in preview")
        before = _value(store.get(key, name))
        if before == next_value:
            raise legacy.MigrationBlocked("No-op registry operation")
        operations.append({"key": key, "name": name,
                           "before": before, "after": next_value})
    doc = {
        "format": FORMAT, "root": store.root,
        "backup_sha256": safety.sha256_file(
            str(Path(backup_root) / legacy.INDEX_NAME)),
        "operations": operations,
    }
    cipher = crypto.encrypt(
        json.dumps(doc, sort_keys=True, ensure_ascii=False).encode("utf-8"))
    if len(cipher) > 1024 * 1024:
        raise legacy.MigrationBlocked("Encrypted journal exceeds limit")
    with _exclusive_preview_lock(path):
        # Recheck under the OS lock to prevent overlapping preparations.
        if os.path.lexists(path):
            raise legacy.MigrationBlocked("Journal already exists")
        with open(path, "xb") as output:
            output.write(cipher)
            output.flush()
            os.fsync(output.fileno())
        _journal(path, crypto, store, backup_root)
    return str(path)


def _states(doc, store, allowed):
    """Read all values before writing; a foreign edit blocks every change."""
    for op in doc["operations"]:
        current = _value(store.get(op["key"], op["name"]))
        if current not in allowed(op):
            raise legacy.MigrationBlocked(
                "Registry changed outside handover journal; refusing overwrite")


def _recover_test_handover_unlocked(store, journal_file, backup_root, crypto):
    doc = _journal(journal_file, crypto, store, backup_root)
    _states(doc, store, lambda op: (op["before"], op["after"]))
    for op in reversed(doc["operations"]):
        current = _value(store.get(op["key"], op["name"]))
        if current == op["after"]:
            store.set(op["key"], op["name"], op["before"])
    _states(doc, store, lambda op: (op["before"],))
    return "RESTORED_TEST_SCOPE"


def recover_test_handover(store, journal_file, backup_root, crypto):
    """Recover under the OS journal lock; a foreign edit blocks overwrite."""
    with _exclusive_preview_lock(journal_file):
        return _recover_test_handover_unlocked(
            store, journal_file, backup_root, crypto
        )


def apply_test_handover(store, journal_file, backup_root, crypto,
                        before_write=None):
    """Fault-injectable test only: no production key can pass the scope gate."""
    with _exclusive_preview_lock(journal_file):
        doc = _journal(journal_file, crypto, store, backup_root)
        _states(doc, store, lambda op: (op["before"], op["after"]))
        try:
            for index, op in enumerate(doc["operations"]):
                current = _value(store.get(op["key"], op["name"]))
                if current == op["before"]:
                    if before_write is not None:
                        before_write(index)
                    store.set(op["key"], op["name"], op["after"])
            _states(doc, store, lambda op: (op["after"],))
        except Exception:
            # If recovery also fails, the encrypted WAL survives for manual
            # retry after the lock is released.
            _recover_test_handover_unlocked(
                store, journal_file, backup_root, crypto
            )
            raise
    return "TEST_ONLY_APPLIED_NOT_PRODUCTION_ACTIVATION"

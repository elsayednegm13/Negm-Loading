# -*- coding: utf-8 -*-
"""F03 opaque-shortcut rollback PREVIEW; never used by the actual installer.

All writes are limited to a fresh, explicitly marked test folder named
f03-shortcuts-*. It does not create real Desktop/Start Menu shortcuts, parse
ownership from .lnk files, or claim a transaction across HKCU + shortcuts.
A production handover must verify shell-link targets and use one durable,
exclusive recovery protocol across ALL resources.
"""
import base64
import hashlib
import json
import os
import uuid
from pathlib import Path

import installer_safety as safety
import legacy_migration as legacy
from legacy_handover_preview import _exclusive_preview_lock

FORMAT = "negm-f03-test-shortcut-rollback-v1"
MAX_LINK = 256 * 1024
MAX_ITEMS = 20


def _scope_path(root, relative):
    root = Path(os.path.abspath(root))
    if not root.name.startswith("f03-shortcuts-") or not root.is_dir():
        raise legacy.MigrationBlocked("Only disposable shortcut test roots allowed")
    legacy._no_reparse_ancestors(root)
    safety.validate_relative_path(relative)
    if not relative.lower().endswith(".lnk"):
        raise legacy.MigrationBlocked("Only disposable .lnk test artifacts are allowed")
    path = root.joinpath(*relative.replace("\\", "/").split("/"))
    legacy._no_reparse_ancestors(path)
    if not legacy._inside(root, path):
        raise legacy.MigrationBlocked("Shortcut path escapes test root")
    return path


def _sha(data):
    return hashlib.sha256(data).hexdigest()


def _read_bytes(path):
    info = legacy._checked_file(path)
    if info.st_size > MAX_LINK:
        raise legacy.MigrationBlocked("Shortcut exceeds test safety limit")
    return path.read_bytes()


def _index_sha(backup):
    return safety.sha256_file(str(Path(backup) / legacy.INDEX_NAME))


def _read_journal(root, journal, backup, crypto):
    legacy.verify_backup(backup, crypto)
    file = Path(journal)
    legacy._no_reparse_ancestors(file)
    legacy._checked_file(file)
    if file.stat().st_size > 16 * 1024 * 1024:
        raise legacy.MigrationBlocked("Encrypted shortcut journal exceeds limit")
    try:
        doc = json.loads(crypto.decrypt(file.read_bytes()).decode("utf-8"))
    except (UnicodeError, ValueError) as exc:
        raise legacy.MigrationBlocked("Shortcut journal is not readable") from exc
    if (doc.get("format") != FORMAT
            or doc.get("scope") != str(Path(os.path.abspath(root)))
            or doc.get("backup_sha256") != _index_sha(backup)):
        raise legacy.MigrationBlocked("Shortcut journal identity mismatch")
    ops = doc.get("operations")
    if not isinstance(ops, list) or not 0 < len(ops) <= MAX_ITEMS:
        raise legacy.MigrationBlocked("Invalid shortcut operation count")
    validated = []
    seen = set()
    for op in ops:
        if not isinstance(op, dict) or set(op) != {
                "name", "old_sha", "new_sha", "old_blob", "new_blob"}:
            raise legacy.MigrationBlocked("Shortcut journal entry is invalid")
        name = op["name"]
        path = _scope_path(root, name)
        if name.casefold() in seen:
            raise legacy.MigrationBlocked("Duplicate shortcut path")
        seen.add(name.casefold())
        try:
            before = base64.b64decode(op["old_blob"], validate=True)
            after = base64.b64decode(op["new_blob"], validate=True)
        except (ValueError, Exception) as exc:
            raise legacy.MigrationBlocked("Shortcut bytes cannot be decoded") from exc
        if (not before or not after or len(before) > MAX_LINK or len(after) > MAX_LINK
                or _sha(before) != op["old_sha"]
                or _sha(after) != op["new_sha"]
                or before == after):
            raise legacy.MigrationBlocked("Shortcut journal digest mismatch")
        validated.append((path, before, after))
    return validated


def prepare_shortcut_test_journal(root, changes, journal, backup, crypto):
    """changes: (relative .lnk, expected OLD SHA256, new opaque bytes)."""
    if not isinstance(changes, list) or not 0 < len(changes) <= MAX_ITEMS:
        raise legacy.MigrationBlocked("Invalid shortcut test change list")
    legacy.verify_backup(backup, crypto)
    target = Path(os.path.abspath(journal))
    legacy._no_reparse_ancestors(target.parent)
    if os.path.lexists(target):
        raise legacy.MigrationBlocked("Shortcut journal already exists")
    for protected in (root, backup):
        if legacy._inside(protected, target) or legacy._inside(target, protected):
            raise legacy.MigrationBlocked("Shortcut journal overlaps protected data")
    entries = []
    names = set()
    for rel, expected, after in changes:
        path = _scope_path(root, rel)
        if rel.casefold() in names:
            raise legacy.MigrationBlocked("Duplicate shortcut changes")
        names.add(rel.casefold())
        before = _read_bytes(path)
        if (not isinstance(expected, str) or expected != _sha(before)
                or not isinstance(after, bytes) or not after
                or len(after) > MAX_LINK or before == after):
            raise legacy.MigrationBlocked("Unknown shortcut owner or invalid replacement")
        entries.append({
            "name": rel, "old_sha": _sha(before), "new_sha": _sha(after),
            "old_blob": base64.b64encode(before).decode("ascii"),
            "new_blob": base64.b64encode(after).decode("ascii"),
        })
    data = {
        "format": FORMAT,
        "scope": str(Path(os.path.abspath(root))),
        "backup_sha256": _index_sha(backup),
        "operations": entries,
    }
    encrypted = crypto.encrypt(
        json.dumps(data, sort_keys=True).encode("utf-8")
    )
    if len(encrypted) > 16 * 1024 * 1024:
        raise legacy.MigrationBlocked("Shortcut WAL is too large")
    with _exclusive_preview_lock(target):
        if os.path.lexists(target):
            raise legacy.MigrationBlocked("Shortcut journal already exists")
        with open(target, "xb") as output:
            output.write(encrypted)
            output.flush()
            os.fsync(output.fileno())
        _read_journal(root, target, backup, crypto)
    return str(target)


def _check_states(operations, acceptable):
    for path, before, after in operations:
        content = _read_bytes(path)
        if _sha(content) not in acceptable(before, after):
            raise legacy.MigrationBlocked("An unrelated shortcut change blocks handover")


def _replace_exact(path, expected, replacement):
    if _sha(_read_bytes(path)) != _sha(expected):
        raise legacy.MigrationBlocked("Shortcut changed immediately before write")
    temporary = path.with_name(path.name + ".f03-" + uuid.uuid4().hex + ".tmp")
    # Exclusive create, flush, then atomic replacement of this TEST file only.
    try:
        with open(temporary, "xb") as output:
            output.write(replacement)
            output.flush()
            os.fsync(output.fileno())
        if _sha(_read_bytes(path)) != _sha(expected):
            raise legacy.MigrationBlocked("Shortcut changed while preparing replacement")
        os.replace(temporary, path)
    finally:
        if os.path.lexists(temporary):
            os.unlink(temporary)


def _restore_unlocked(root, journal, backup, crypto):
    operations = _read_journal(root, journal, backup, crypto)
    _check_states(operations, lambda a, b: (_sha(a), _sha(b)))
    for path, before, after in reversed(operations):
        if _sha(_read_bytes(path)) == _sha(after):
            _replace_exact(path, after, before)
    _check_states(operations, lambda a, b: (_sha(a),))
    return "SHORTCUT_TEST_RESTORED"


def restore_shortcut_test_journal(root, journal, backup, crypto):
    with _exclusive_preview_lock(journal):
        return _restore_unlocked(root, journal, backup, crypto)


def apply_shortcut_test_journal(root, journal, backup, crypto,
                                before_write=None):
    with _exclusive_preview_lock(journal):
        operations = _read_journal(root, journal, backup, crypto)
        _check_states(operations, lambda a, b: (_sha(a), _sha(b)))
        try:
            for index, (path, before, after) in enumerate(operations):
                if _sha(_read_bytes(path)) == _sha(before):
                    if before_write:
                        before_write(index)
                    _replace_exact(path, before, after)
            _check_states(operations, lambda a, b: (_sha(b),))
        except Exception:
            _restore_unlocked(root, journal, backup, crypto)
            raise
    return "SHORTCUT_TEST_APPLIED_NO_ACTIVATION"

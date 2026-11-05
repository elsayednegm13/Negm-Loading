# -*- coding: utf-8 -*-
"""F03 test-only coordinated registry + opaque-shortcut recovery preview.

This module refuses production HKCU keys and real Desktop/Start Menu paths via
the adapters it uses. It holds BOTH OS journal locks during test mutations
and preflights BOTH resources before recovery, to avoid partially restoring
one resource when the other has an unrelated edit.

Not an installer feature: third-party writes do not honor these locks and
Windows registry has no atomic CAS. No production activation is authorized.
"""
from contextlib import contextmanager
from pathlib import Path

import legacy_migration as legacy
import legacy_handover_preview as reg
import legacy_shortcut_preview as links


@contextmanager
def _both_locks(registry_journal, shortcuts_journal):
    """Deterministic lock order; both journals must be independent files."""
    if legacy._canonical(registry_journal) == legacy._canonical(shortcuts_journal):
        raise legacy.MigrationBlocked("Registry and shortcut WAL must differ")
    with reg._exclusive_preview_lock(registry_journal):
        with reg._exclusive_preview_lock(shortcuts_journal):
            yield


def _preflight(store, registry_journal, scope, shortcuts_journal, backup, crypto):
    registry_doc = reg._journal(registry_journal, crypto, store, backup)
    shortcut_ops = links._read_journal(scope, shortcuts_journal, backup, crypto)
    reg._states(registry_doc, store, lambda op: (op["before"], op["after"]))
    links._check_states(shortcut_ops, lambda old, new:
                        (links._sha(old), links._sha(new)))
    return registry_doc, shortcut_ops


def _restore_unlocked(store, registry_journal, scope, shortcuts_journal,
                      backup, crypto):
    # Validate both resources before touching either. A foreign edit in either
    # resource causes a hard stop, preserving the journal and current bytes.
    _preflight(store, registry_journal, scope, shortcuts_journal, backup, crypto)
    links._restore_unlocked(scope, shortcuts_journal, backup, crypto)
    reg._recover_test_handover_unlocked(
        store, registry_journal, backup, crypto
    )
    return "BOTH_TEST_RESOURCES_RESTORED"


def restore_test_resources(store, registry_journal, scope, shortcuts_journal,
                           backup, crypto):
    with _both_locks(registry_journal, shortcuts_journal):
        return _restore_unlocked(
            store, registry_journal, scope, shortcuts_journal, backup, crypto
        )


def apply_test_resources(store, registry_journal, scope, shortcuts_journal,
                         backup, crypto, before_step=None):
    """Simulate a multi-resource update with fault injection, test scope only."""
    with _both_locks(registry_journal, shortcuts_journal):
        registry_doc, shortcut_ops = _preflight(
            store, registry_journal, scope, shortcuts_journal, backup, crypto
        )
        try:
            for index, operation in enumerate(registry_doc["operations"]):
                current = reg._value(store.get(operation["key"], operation["name"]))
                if current == operation["before"]:
                    if before_step:
                        before_step("registry", index)
                    # A fresh comparison is still not a registry-wide atomic
                    # compare-and-swap, so this is NOT production-safe.
                    if reg._value(store.get(operation["key"], operation["name"])) != current:
                        raise legacy.MigrationBlocked("Registry changed before write")
                    store.set(operation["key"], operation["name"], operation["after"])
            reg._states(registry_doc, store, lambda op: (op["after"],))
            for index, (path, before, after) in enumerate(shortcut_ops):
                if links._sha(links._read_bytes(path)) == links._sha(before):
                    if before_step:
                        before_step("shortcut", index)
                    links._replace_exact(path, before, after)
            links._check_states(shortcut_ops, lambda old, new:
                                (links._sha(new),))
        except Exception:
            # BaseException (forced termination) intentionally bypasses this
            # rollback; the two durable WALs remain for a fresh process.
            _restore_unlocked(
                store, registry_journal, scope, shortcuts_journal,
                backup, crypto
            )
            raise
    return "BOTH_TEST_RESOURCES_APPLIED_NOT_ACTIVATED"

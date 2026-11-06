# -*- coding: utf-8 -*-
"""Encrypted, read-only escrow of observed legacy Windows Shell Link candidates.

No ownership is inferred, no existing .lnk is changed, and restoration is
allowed ONLY into a NEW isolated folder. This protects original shortcut bytes
ahead of a future, separately approved upgrade transaction. The encrypted
record is bound to the existing verified legacy DPAPI backup.
"""
from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path

import installer_safety as safety
import legacy_migration as legacy
import legacy_shortcut_inspection as inspection

FORMAT = "negm-f03-shortcut-escrow-v1"
INDEX = "shortcuts.index.dpapi"
ALLOWED = frozenset({"desktop", "start_menu"})
MAX_ENCRYPTED = inspection.MAX_SHORTCUT_BYTES * 2 + 4096


def _sha(data):
    return hashlib.sha256(data).hexdigest()


def _read_escrow(vault, source_backup, crypto):
    root = Path(os.path.abspath(vault))
    legacy._no_reparse_ancestors(root)
    if not root.is_dir():
        raise legacy.MigrationBlocked("Shortcut escrow folder unavailable")
    index_path = root / INDEX
    legacy._checked_file(index_path)
    if index_path.stat().st_size > 32 * 1024:
        raise legacy.MigrationBlocked("Shortcut escrow index too large")
    try:
        doc = json.loads(crypto.decrypt(index_path.read_bytes()).decode("utf-8"))
    except (UnicodeError, ValueError, TypeError) as exc:
        raise legacy.MigrationBlocked("Shortcut escrow index cannot be read") from exc
    if not isinstance(doc, dict) or set(doc) != {
            "format", "source_backup_sha256", "legacy_root", "shortcuts"}:
        raise legacy.MigrationBlocked("Shortcut escrow index format invalid")
    if doc["format"] != FORMAT or doc["source_backup_sha256"] != safety.sha256_file(
            str(Path(source_backup) / legacy.INDEX_NAME)):
        raise legacy.MigrationBlocked("Shortcut escrow does not match its source backup")
    snapshot = legacy.verify_backup(source_backup, crypto)
    if legacy._canonical(snapshot["roots"]["app"]) != doc["legacy_root"]:
        raise legacy.MigrationBlocked("Shortcut escrow legacy installation changed")
    records = doc["shortcuts"]
    if not isinstance(records, list) or not 0 < len(records) <= len(ALLOWED):
        raise legacy.MigrationBlocked("Invalid shortcut escrow count")
    if set(doc["shortcuts"][0]) != {
            "label", "source", "sha256", "cipher_file"}:
        raise legacy.MigrationBlocked("Malformed shortcut escrow entry")
    names = set()
    recovered = {}
    for item in records:
        if not isinstance(item, dict) or set(item) != {
                "label", "source", "sha256", "cipher_file"}:
            raise legacy.MigrationBlocked("Malformed shortcut escrow entry")
        label = item["label"]
        if label not in ALLOWED or label in names or item["cipher_file"] != label + ".dpapi":
            raise legacy.MigrationBlocked("Unsafe shortcut escrow member")
        names.add(label)
        if not isinstance(item["source"], str) or not os.path.isabs(item["source"]):
            raise legacy.MigrationBlocked("Unsafe shortcut source identity")
        blob = root / (label + ".dpapi")
        legacy._checked_file(blob)
        if not 0 < blob.stat().st_size <= MAX_ENCRYPTED:
            raise legacy.MigrationBlocked("Encrypted shortcut blob invalid")
        content = crypto.decrypt(blob.read_bytes())
        if (not isinstance(content, bytes)
                or not 0 < len(content) <= inspection.MAX_SHORTCUT_BYTES
                or _sha(content) != item["sha256"]):
            raise legacy.MigrationBlocked("Shortcut escrow integrity failed")
        recovered[label] = {"source": item["source"], "data": content}
    if set(item.name for item in root.iterdir()) != {INDEX} | {
            label + ".dpapi" for label in names}:
        raise legacy.MigrationBlocked("Unexpected file in shortcut escrow")
    return recovered, snapshot


def create_shortcut_escrow(legacy_root, candidates, source_backup,
                          new_escrow_root, protector=None):
    """Snapshot only verified candidate links; no original-link writes.

    candidates is a mapping from "desktop"/"start_menu" to existing .lnk paths.
    The required source backup must already be verified and match legacy_root.
    This does NOT prove that the links are owned or safe to replace.
    """
    protector = protector or legacy.WindowsDPAPI()
    snapshot = legacy.verify_backup(source_backup, protector)
    if legacy._canonical(legacy_root) != legacy._canonical(snapshot["roots"]["app"]):
        raise legacy.MigrationBlocked("Legacy root and backup identity mismatch")
    if (not isinstance(candidates, dict) or not candidates
            or set(candidates) - ALLOWED):
        raise legacy.MigrationBlocked("Unknown shortcut escrow labels")
    destination = Path(os.path.abspath(new_escrow_root))
    legacy._no_reparse_ancestors(destination.parent)
    if os.path.lexists(destination):
        raise legacy.MigrationBlocked("Shortcut escrow destination already exists")
    for protected in list(snapshot["roots"].values()) + [source_backup]:
        if legacy._inside(protected, destination) or legacy._inside(destination, protected):
            raise legacy.MigrationBlocked("Shortcut escrow overlaps protected data")

    all_records = []
    encrypted = {}
    used_sources = set()
    for label, candidate in sorted(candidates.items()):
        if label not in ALLOWED:
            raise legacy.MigrationBlocked("Unknown shortcut category")
        source = Path(os.path.abspath(candidate))
        if legacy._canonical(source) in used_sources:
            raise legacy.MigrationBlocked("Same shortcut used for multiple categories")
        used_sources.add(legacy._canonical(source))
        observed = inspection.inspect_legacy_shortcut(source, legacy_root)
        if observed["status"] != inspection.CANDIDATE_STATUS or observed["safe_to_replace"]:
            raise legacy.MigrationBlocked("Shortcut inspection did not fail closed")
        contents = source.read_bytes()
        if _sha(contents) != observed["sha256"]:
            raise legacy.MigrationBlocked("Shortcut changed after COM inspection")
        ciphertext = protector.encrypt(contents)
        if not 0 < len(ciphertext) <= MAX_ENCRYPTED:
            raise legacy.MigrationBlocked("Encrypted shortcut exceeds allowed size")
        encrypted[label + ".dpapi"] = ciphertext
        all_records.append({
            "label": label, "source": str(source),
            "sha256": _sha(contents), "cipher_file": label + ".dpapi",
        })
    # Recheck all source files BEFORE creating the output folder.
    for item in all_records:
        if safety.sha256_file(item["source"]) != item["sha256"]:
            raise legacy.MigrationBlocked("Shortcut changed during escrow preflight")

    header = {
        "format": FORMAT,
        "source_backup_sha256": safety.sha256_file(
            str(Path(source_backup) / legacy.INDEX_NAME)),
        "legacy_root": legacy._canonical(legacy_root),
        "shortcuts": all_records,
    }
    index_cipher = protector.encrypt(
        json.dumps(header, sort_keys=True, ensure_ascii=False).encode("utf-8")
    )
    if len(index_cipher) > 32 * 1024:
        raise legacy.MigrationBlocked("Shortcut escrow index exceeds limit")

    destination.mkdir(mode=0o700)
    for name, blob in encrypted.items():
        with open(destination / name, "xb") as out:
            out.write(blob)
            out.flush()
            os.fsync(out.fileno())
    with open(destination / INDEX, "xb") as out:
        out.write(index_cipher)
        out.flush()
        os.fsync(out.fileno())
    verify_shortcut_escrow(destination, source_backup, protector)
    for item in all_records:
        if safety.sha256_file(item["source"]) != item["sha256"]:
            raise legacy.MigrationBlocked("Source changed during escrow creation")
    return {"status": "ENCRYPTED_CANDIDATES_NOT_OWNERSHIP_PROOF",
            "saved_candidates": len(all_records),
            "safe_to_replace": False}


def verify_shortcut_escrow(vault, source_backup, protector=None):
    """Verify decryptability of all original .lnk bytes, without touching them."""
    protector = protector or legacy.WindowsDPAPI()
    recovered, _ = _read_escrow(vault, source_backup, protector)
    return {"status": "VERIFIED_ESCROW_NOT_ACTIVATED",
            "saved_candidates": len(recovered), "safe_to_replace": False}


def restore_shortcuts_to_new_folder(vault, source_backup, new_directory,
                                    protector=None):
    """Restore encrypted shortcut bytes into a NEW folder, never onto originals."""
    protector = protector or legacy.WindowsDPAPI()
    recovered, snapshot = _read_escrow(vault, source_backup, protector)
    dest = Path(os.path.abspath(new_directory))
    legacy._no_reparse_ancestors(dest.parent)
    if os.path.lexists(dest):
        raise legacy.MigrationBlocked("Shortcut recovery requires a fresh folder")
    for old_root in list(snapshot["roots"].values()) + [vault, source_backup]:
        if legacy._inside(old_root, dest) or legacy._inside(dest, old_root):
            raise legacy.MigrationBlocked("Shortcut recovery overlaps protected data")
    for item in recovered.values():
        original_parent = str(Path(item["source"]).parent)
        if legacy._inside(original_parent, dest) or legacy._inside(dest, original_parent):
            raise legacy.MigrationBlocked("Shortcut recovery overlaps original folder")
    dest.mkdir(mode=0o700)
    for label, item in recovered.items():
        outfile = dest / (label + ".lnk")
        with open(outfile, "xb") as out:
            out.write(item["data"])
            out.flush()
            os.fsync(out.fileno())
        if safety.sha256_file(str(outfile)) != _sha(item["data"]):
            raise legacy.MigrationBlocked("Restored shortcut differs from escrow")
    return {"status": "RESTORED_TO_NEW_FOLDER_NOT_ACTIVATED",
            "restored_candidates": len(recovered), "safe_to_replace": False}

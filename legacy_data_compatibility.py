# -*- coding: utf-8 -*-
"""Read-only F03 persisted-state compatibility gate.

The app otherwise silently falls back to defaults for malformed JSON, risking
loss of user data on the first subsequent save. Never log data values, URLs,
domains, paths, passwords or credentials. This gate validates SHAPE only;
it neither runs downloads nor converts any user record.
"""
from __future__ import annotations

import json
from pathlib import Path

import installer_safety as safety
import legacy_migration as legacy

MAX_JSON_FILE = 24 * 1024 * 1024
FILES = {
    "settings.json": "settings",
    "downloads.json": "downloads",
    "history.json": "history",
    "proxies.json": "proxies",
    "site_credentials.json": "credentials",
}


def _block(code):
    raise legacy.MigrationBlocked("Legacy data compatibility block: " + code)


def _pairs(items):
    output = {}
    for key, value in items:
        if key in output:
            _block("duplicate-json-key")
        output[key] = value
    return output


def _invalid_constant(_token):
    _block("non-finite-json-value")


def _nonempty(value):
    return isinstance(value, str) and bool(value.strip()) and "\x00" not in value


def _records(items, category, required):
    if not isinstance(items, list):
        _block(category + "-not-list")
    identifiers = set()
    for item in items:
        if not isinstance(item, dict):
            _block(category + "-entry-not-object")
        for key in required:
            if not _nonempty(item.get(key)):
                _block(category + "-missing-required-field")
        identifier = item["id"] if category != "downloads" else item["task_id"]
        if identifier in identifiers:
            _block(category + "-duplicate-record-id")
        identifiers.add(identifier)
    return len(items)


def _validate(category, value):
    if category == "settings":
        if not isinstance(value, dict):
            _block("settings-not-object")
        if "lang" in value and value["lang"] not in ("ar", "en"):
            _block("settings-invalid-language")
        if "theme" in value and value["theme"] not in ("Dark", "Light"):
            _block("settings-invalid-theme")
        if "folder" in value and not _nonempty(value["folder"]):
            _block("settings-invalid-download-folder")
        if "max_concurrent" in value and (
                type(value["max_concurrent"]) is not int
                or not 1 <= value["max_concurrent"] <= 100):
            _block("settings-invalid-concurrency")
        return 1
    if category == "downloads":
        if not isinstance(value, list):
            _block("downloads-not-list")
        ids = set()
        for item in value:
            if not isinstance(item, dict):
                _block("downloads-entry-not-object")
            for name in ("task_id", "url", "save_path"):
                if not _nonempty(item.get(name)):
                    _block("downloads-missing-required-field")
            if item.get("kind") not in (None, "media"):
                _block("downloads-unknown-kind")
            if item["task_id"] in ids:
                _block("downloads-duplicate-record-id")
            ids.add(item["task_id"])
        return len(value)
    if category == "history":
        return _records(value, "history", ("id",))
    if category == "proxies":
        return _records(value, "proxies", ("id", "host"))
    if category == "credentials":
        return _records(value, "credentials", ("id", "domain"))
    _block("unexpected-collection")


def assess_user_data(plan):
    """Read source files only, validate expected JSON schema and SHA-256.

    Returns counters only. Unknown files stay in the encrypted backup; this
    function never removes or rewrites them.
    """
    roots = plan.get("roots", {})
    result = {"status": "COMPATIBLE_FOR_STAGING", "counts": {},
              "checked_files": 0}
    for entry in plan.get("files", []):
        area = entry["area"]
        if area not in ("user_data", "older_user_data"):
            continue
        rel = entry["relpath"]
        if "/" in rel or "\\" in rel or rel not in FILES:
            continue
        root = Path(roots[area])
        path = root / rel
        legacy._no_reparse_ancestors(path)
        info = legacy._checked_file(path)
        if info.st_size > MAX_JSON_FILE:
            _block("json-file-exceeds-limit")
        if safety.sha256_file(str(path)) != entry["sha256"]:
            _block("data-changed-since-inventory")
        try:
            with open(path, "r", encoding="utf-8") as source:
                doc = json.load(
                    source, object_pairs_hook=_pairs,
                    parse_constant=_invalid_constant,
                )
        except (OSError, UnicodeError, ValueError, RecursionError):
            _block("malformed-json")
        category = FILES[rel]
        count = _validate(category, doc)
        result["counts"][area + ":" + category] = count
        result["checked_files"] += 1
        # Prevent accepting data modified during JSON parsing.
        if safety.sha256_file(str(path)) != entry["sha256"]:
            _block("data-changed-while-checking")
    return result

# -*- coding: utf-8 -*-
"""F-03 read-only legacy-installation triage. NEVER run or adopt legacy uninstallers.

A filename, registry InstallLocation, shortcut, or old uninstall.cmd is NOT
evidence of ownership. This module intentionally offers NO migration/deletion
operation: it categorizes a destination before a human chooses a safe path.
"""
from __future__ import annotations

import argparse
import json
import os

import installer_safety as safety

MAX_SCRIPT_READ = 64 * 1024


def _registry_key_present(anchor_key: str):
    """Read HKCU only. None means the registry is unavailable (non-Windows)."""
    if os.name != "nt":
        return None
    import winreg
    if not safety._safe_registry_key(anchor_key):
        raise safety.InstallSafetyError("unsafe registry key")
    try:
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, anchor_key, 0, winreg.KEY_READ):
            return True
    except FileNotFoundError:
        return False


def inspect_legacy_destination(install_root: str, *, anchor_key=None) -> dict:
    """Return a privacy-limited, read-only assessment; never infer old ownership.

    No subprocess, no registry writes, no reading user documents, no backup
    creation. A positive executable/shortcut name alone cannot permit upgrade.
    """
    key = anchor_key or safety.DEFAULT_UNINSTALL_KEY
    report = {
        "status": "BLOCKED_UNASSESSED",
        "can_install_or_upgrade": False,
        "automatic_legacy_migration": False,
        "registry_key_present": None,
        "has_manifest": False,
        "has_legacy_executable_name": False,
        "has_new_executable_name": False,
        "legacy_uninstaller_present": False,
        "legacy_uninstaller_recursive_delete_detected": False,
        "legacy_uninstaller_content_checked": False,
    }
    try:
        root = safety.validate_install_root(install_root)
        report["registry_key_present"] = _registry_key_present(key)
        if not os.path.lexists(root):
            report["status"] = (
                "BLOCKED_EXISTING_REGISTRATION"
                if report["registry_key_present"] is not False
                else "FRESH_MISSING_DIRECTORY"
            )
            report["can_install_or_upgrade"] = report["status"] == "FRESH_MISSING_DIRECTORY"
            return report

        names = os.listdir(root)
        if not names:
            report["status"] = (
                "BLOCKED_EXISTING_REGISTRATION"
                if report["registry_key_present"] is not False
                else "FRESH_EMPTY_DIRECTORY"
            )
            report["can_install_or_upgrade"] = report["status"] == "FRESH_EMPTY_DIRECTORY"
            return report

        # Only check these known names. Never list arbitrary user filenames.
        report["has_legacy_executable_name"] = os.path.lexists(
            os.path.join(root, "Negm Lodaing.exe")
        )
        report["has_new_executable_name"] = os.path.lexists(
            os.path.join(root, "NegmLoading.exe")
        )

        cmd = os.path.join(root, safety.UNINSTALL_CMD_FILENAME)
        if os.path.lexists(cmd):
            report["legacy_uninstaller_present"] = True
            if safety.is_reparse_point(cmd) or not os.path.isfile(cmd):
                report["status"] = "BLOCKED_UNTRUSTED_UNINSTALLER_PATH"
                return report
            try:
                with open(cmd, "rb") as stream:
                    data = stream.read(MAX_SCRIPT_READ + 1)
                if len(data) <= MAX_SCRIPT_READ:
                    report["legacy_uninstaller_content_checked"] = True
                    report["legacy_uninstaller_recursive_delete_detected"] = (
                        safety.script_contains_forbidden_deletion(
                            data.decode("utf-8-sig", errors="replace")
                        )
                    )
            except OSError:
                # Unreadable/oversized is NOT treated as safe.
                pass

        manifest = os.path.join(root, safety.MANIFEST_FILENAME)
        if not os.path.lexists(manifest):
            report["status"] = "BLOCKED_NO_TRUSTED_MANIFEST"
            return report

        report["has_manifest"] = True
        if safety.is_reparse_point(manifest) or not os.path.isfile(manifest):
            report["status"] = "BLOCKED_UNTRUSTED_MANIFEST"
            return report

        try:
            loaded = safety.load_manifest(root, expected_app_name=safety.DEFAULT_APP_NAME)
            safety.verify_install_anchor(root, loaded, key)
        except (safety.InstallSafetyError, OSError, ValueError):
            report["status"] = "BLOCKED_UNTRUSTED_MANIFEST"
            return report

        # Explicitly flag a destructive or unreadable uninstaller first,
        # before generic owned-file hash checking.
        if report["legacy_uninstaller_present"] and (
            not report["legacy_uninstaller_content_checked"]
            or report["legacy_uninstaller_recursive_delete_detected"]
        ):
            report["status"] = "BLOCKED_UNTRUSTED_UNINSTALLER"
            return report

        # An anchor binds the manifest, but does not prove the current bytes
        # still match the file ownership recorded at install time. Only hash
        # paths named by the verified manifest, never unrelated user files.
        try:
            safety.assert_no_blocking_temps(root)
            for item in loaded["files"]:
                owned = safety.resolve_owned_path(root, item["path"])
                if not os.path.lexists(owned):
                    # A missing owned file may be safely reinstalled later;
                    # the normal payload-specific preflight remains mandatory.
                    continue
                if safety.is_reparse_point(owned) or not os.path.isfile(owned):
                    report["status"] = "BLOCKED_MODIFIED_OWNED_PAYLOAD"
                    return report
                if safety.sha256_file(owned).lower() != item["sha256"].lower():
                    report["status"] = "BLOCKED_MODIFIED_OWNED_PAYLOAD"
                    return report
        except (safety.InstallSafetyError, OSError, ValueError):
            report["status"] = "BLOCKED_MODIFIED_OWNED_PAYLOAD"
            return report

        report["status"] = "VERIFIED_MANAGED_INSTALL"
        report["can_install_or_upgrade"] = True
        return report
    except (safety.InstallSafetyError, OSError, ValueError):
        report["status"] = "BLOCKED_UNSAFE_OR_UNREADABLE"
        return report


def main(argv=None):
    parser = argparse.ArgumentParser(
        description="Read-only F-03 diagnosis; does not execute or migrate legacy installs."
    )
    parser.add_argument("directory", help="Existing or proposed installation folder")
    args = parser.parse_args(argv)
    result = inspect_legacy_destination(args.directory)
    print(json.dumps(result, ensure_ascii=False, sort_keys=True, indent=2))
    return 0 if result["can_install_or_upgrade"] else 2


if __name__ == "__main__":
    raise SystemExit(main())

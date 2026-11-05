# -*- coding: utf-8 -*-
"""F03 developer preview: opt-in, non-destructive migration preparation.

No legacy uninstaller, HKCU registry write, shortcut write, app launch or
activation happens here. This utility is deliberately not wired to Setup.exe
until the separately reviewed handover/recovery protocol passes Windows VM
fault-injection tests.
"""
import argparse
import json
import sys

import legacy_migration as legacy
import legacy_stage


CONSENT = "PREPARE_BACKUP_AND_STAGE_ONLY"


def prepare(legacy_root, profile_root, backup_root, stage_root, payload_zip,
            *, consent=None, registry=None, protector=None):
    """The only exposed mutating operation creates NEW backup/staging folders."""
    if consent != CONSENT:
        raise legacy.MigrationBlocked(
            "Migration preparation requires explicit BACKUP/STAGE-only consent"
        )
    plan = legacy.inspect_legacy(
        legacy_root, profile_root=profile_root, registry=registry
    )
    legacy.create_verified_backup(plan, backup_root, protector)
    try:
        result = legacy_stage.prepare_staging(
            plan, backup_root, payload_zip, stage_root,
            protector=protector, registry_snapshot=registry
        )
    except Exception:
        # Preserve the verified backup. Never remove or overwrite existing data.
        raise
    return result


def main(argv=None):
    parser = argparse.ArgumentParser(
        description="F03 legacy backup and staging preview (no activation)"
    )
    parser.add_argument("--legacy-root", required=True)
    parser.add_argument("--profile-root", default=None)
    parser.add_argument("--prepare-only", action="store_true")
    parser.add_argument("--backup-root")
    parser.add_argument("--stage-root")
    parser.add_argument("--payload")
    parser.add_argument("--confirm", default="")
    args = parser.parse_args(argv)
    try:
        if args.prepare_only:
            if not all((args.backup_root, args.stage_root, args.payload)):
                parser.error("Preparation needs --backup-root, --stage-root and --payload")
            result = prepare(
                args.legacy_root, args.profile_root, args.backup_root,
                args.stage_root, args.payload, consent=args.confirm
            )
            print(json.dumps(result, ensure_ascii=False))
            return 0
        plan = legacy.inspect_legacy(
            args.legacy_root, profile_root=args.profile_root
        )
        # Inventory reports totals, not sensitive filenames or credentials.
        print(json.dumps({
            "status": "READ_ONLY_INSPECTION",
            "file_count": len(plan["files"]),
            "source_bytes": plan["bytes"],
            "source_areas": sorted(plan["roots"]),
            "upgrade_activated": False,
        }, ensure_ascii=False))
        return 0
    except legacy.MigrationBlocked as exc:
        print("F03 SAFE STOP: " + str(exc), file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())

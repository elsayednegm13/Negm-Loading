# -*- coding: utf-8 -*-
"""F03 preparatory staging. No activation or changes to installed registry."""
from pathlib import Path
import os
import hashlib
import zipfile

import installer_safety as safety
import legacy_migration as legacy


def prepare_staging(plan, backup_dir, payload_zip, staging_dir,
                    *, protector=None, registry_snapshot=None):
    """Preflight all sources then unpack a modern payload to a new folder."""
    protector = protector or legacy.WindowsDPAPI()
    saved = legacy.verify_backup(backup_dir, protector)
    recorded = [{k: v for k, v in f.items() if k != "blob"}
                for f in saved["files"]]
    if (saved["roots"] != plan["roots"] or
            saved["registry"] != plan["registry"] or
            recorded != plan["files"]):
        raise legacy.MigrationBlocked("Snapshot does not match the selected installation")
    current = registry_snapshot
    if current is None:
        current = legacy.read_legacy_registry(
            plan["registry"]["uninstall_key"], plan["registry"]["run_key"]
        )
    if current != plan["registry"]:
        raise legacy.MigrationBlocked("Registry changed after the snapshot")
    all_files = []
    for area, folder in plan["roots"].items():
        all_files.extend(legacy._walk(folder, area))
    all_files.sort(key=lambda f: (f["area"], f["relpath"]))
    if all_files != plan["files"]:
        raise legacy.MigrationBlocked("Source files changed after the snapshot")

    destination = Path(os.path.abspath(staging_dir))
    legacy._no_reparse_ancestors(destination.parent)
    if os.path.lexists(destination):
        raise legacy.MigrationBlocked("Staging directory already exists")
    for root in list(plan["roots"].values()) + [backup_dir]:
        if legacy._inside(root, destination) or legacy._inside(destination, root):
            raise legacy.MigrationBlocked("Staging location overlaps protected data")
    payload = Path(os.path.abspath(payload_zip))
    legacy._no_reparse_ancestors(payload)
    legacy._checked_file(payload)
    paths, _ = safety.list_zip_payload_paths(str(payload))
    normalized = [os.path.normcase(p.replace("/", os.sep)) for p in paths]
    if len(set(normalized)) != len(paths):
        raise legacy.MigrationBlocked("Duplicate ZIP member names")
    if safety.DEFAULT_APP_EXE_FILENAME.lower() not in [
            p.lower() for p in paths]:
        raise legacy.MigrationBlocked("New application executable missing")
    excluded = {safety.MANIFEST_FILENAME.lower(),
                safety.UNINSTALL_CMD_FILENAME.lower(),
                safety.UNINSTALL_PS1_FILENAME.lower()}
    if any(p.lower() in excluded for p in paths):
        raise legacy.MigrationBlocked("Payload contains installer bookkeeping files")
    with zipfile.ZipFile(payload) as archive:
        payload_files = [info for info in archive.infolist() if not info.is_dir()]
        if len(payload_files) > legacy.MAX_FILES or sum(
                item.file_size for item in payload_files) > legacy.MAX_BYTES:
            raise legacy.MigrationBlocked("Payload outside size/count policy")
        executable_info = next(
            item for item in payload_files
            if item.filename.lower() == safety.DEFAULT_APP_EXE_FILENAME.lower())
        if not executable_info.file_size:
            raise legacy.MigrationBlocked("Empty packaged executable")
        expected = hashlib.sha256()
        with archive.open(executable_info) as source:
            for chunk in iter(lambda: source.read(1024 * 1024), b""):
                expected.update(chunk)
    destination.mkdir(mode=0o700)
    safety.safe_extract_zip(str(payload), str(destination))
    output = destination / safety.DEFAULT_APP_EXE_FILENAME
    legacy._checked_file(output)
    digest = safety.sha256_file(str(output))
    if digest != expected.hexdigest():
        raise legacy.MigrationBlocked("Staged executable failed package hash check")
    return {"status": "STAGED_ONLY", "path": str(destination),
            "exe_sha256": digest, "registry_changed": False}

# -*- coding: utf-8 -*-
"""F03 legacy upgrade: *non-destructive preparation*, never an in-place remover.

The first phase takes a verified read-only inventory and a per-user DPAPI-
encrypted, verifiable snapshot, and can restore it to a NEW empty folder.
It does not touch existing HKCU keys, shortcuts, installed bytes or startup.
Activation / old-key handover is intentionally a separate release gate.
"""
from __future__ import annotations

import ctypes
import hashlib
import json
import os
import stat
import struct
import tempfile
from pathlib import Path
from ctypes import wintypes

import installer_safety as safety

APP_NAME = "Negm Lodaing"
BACKUP_HEADER = "negm-f03-dpapi-v1"
INDEX_NAME = "snapshot.index.dpapi"
CHUNK_BYTES = 1024 * 1024
MAX_FILES = 25000
MAX_BYTES = 10 * 1024**3


class MigrationBlocked(safety.InstallSafetyError):
    """No legacy installation should be modified when any check is uncertain."""


class _Blob(ctypes.Structure):
    _fields_ = [("cbData", wintypes.DWORD),
                ("pbData", ctypes.POINTER(ctypes.c_ubyte))]


class WindowsDPAPI:
    """Windows same-user encryption for sensitive settings / credentials."""

    def __init__(self):
        if os.name != "nt":
            raise MigrationBlocked("DPAPI requires Windows")
        self.crypt = ctypes.WinDLL("crypt32", use_last_error=True)
        self.kernel = ctypes.WinDLL("kernel32", use_last_error=True)
        for name in ("CryptProtectData", "CryptUnprotectData"):
            fn = getattr(self.crypt, name)
            fn.argtypes = [ctypes.POINTER(_Blob), ctypes.c_void_p,
                           ctypes.c_void_p, ctypes.c_void_p,
                           ctypes.c_void_p, wintypes.DWORD,
                           ctypes.POINTER(_Blob)]
            fn.restype = wintypes.BOOL
        self.kernel.LocalFree.argtypes = [ctypes.c_void_p]
        self.kernel.LocalFree.restype = ctypes.c_void_p

    def _apply(self, data: bytes, encrypt: bool) -> bytes:
        if len(data) > CHUNK_BYTES + 4096:
            raise MigrationBlocked("DPAPI input chunk exceeds limit")
        buf = (ctypes.c_ubyte * max(1, len(data)))()
        if data:
            ctypes.memmove(buf, data, len(data))
        source = _Blob(len(data), ctypes.cast(buf, ctypes.POINTER(ctypes.c_ubyte)))
        result = _Blob()
        name = "CryptProtectData" if encrypt else "CryptUnprotectData"
        # CRYPTPROTECT_UI_FORBIDDEN: never open unexpected interactive prompts.
        try:
            ok = getattr(self.crypt, name)(
                ctypes.byref(source), None, None, None, None, 0x1,
                ctypes.byref(result)
            )
            if not ok:
                raise MigrationBlocked("Windows DPAPI operation failed: %s" %
                                       ctypes.get_last_error())
            return ctypes.string_at(result.pbData, result.cbData)
        finally:
            if result.pbData:
                self.kernel.LocalFree(ctypes.cast(result.pbData, ctypes.c_void_p))

    def encrypt(self, data: bytes) -> bytes:
        return self._apply(data, True)

    def decrypt(self, data: bytes) -> bytes:
        return self._apply(data, False)


def _canonical(path):
    return os.path.normcase(os.path.abspath(os.fspath(path)))


def _no_reparse_ancestors(path):
    current = Path(os.path.abspath(os.fspath(path)))
    for item in (current, *current.parents):
        if os.path.lexists(item) and safety.is_reparse_point(str(item)):
            raise MigrationBlocked("Reparse point in migration path: %s" % item)


def _inside(left, right):
    """Whether right is inside left (including the root itself)."""
    try:
        return os.path.commonpath([_canonical(left), _canonical(right)]) == _canonical(left)
    except (ValueError, OSError):
        return False


def _checked_file(path):
    if safety.is_reparse_point(str(path)):
        raise MigrationBlocked("Refusing linked file: %s" % path)
    info = os.lstat(path)
    if not stat.S_ISREG(info.st_mode):
        raise MigrationBlocked("Refusing nonregular file: %s" % path)
    return info


def _walk(root, label):
    """No symlinks/junctions, special files or path escape; do not follow links."""
    root = Path(root)
    _no_reparse_ancestors(root)
    if not root.is_dir():
        raise MigrationBlocked("Migration source directory missing: %s" % root)
    entries = []
    for base, dirs, files in os.walk(root, topdown=True, followlinks=False):
        for name in list(dirs):
            p = Path(base) / name
            _no_reparse_ancestors(p)
            if not p.is_dir() or not _inside(root, p):
                raise MigrationBlocked("Unsafe legacy subdirectory: %s" % p)
        for name in files:
            p = Path(base) / name
            if not _inside(root, p):
                raise MigrationBlocked("Legacy file escapes root")
            info = _checked_file(p)
            rel = p.relative_to(root).as_posix()
            # Existing safety path contract also catches ADS, device names,
            # dot components and trailing-dot/space ambiguity on Windows.
            safety.validate_relative_path(rel)
            entries.append({
                "area": label, "relpath": rel, "size": info.st_size,
                "sha256": safety.sha256_file(str(p))
            })
            if len(entries) > MAX_FILES:
                raise MigrationBlocked("Legacy snapshot file-count limit")
    return entries


def read_legacy_registry(uninstall_key=safety.DEFAULT_UNINSTALL_KEY,
                         run_key=safety.DEFAULT_RUN_KEY):
    """Read only. Return registry data with original value types for backup."""
    if os.name != "nt":
        raise MigrationBlocked("Windows HKCU is required for legacy migration")
    if not safety._safe_registry_key(uninstall_key):
        raise MigrationBlocked("Invalid legacy uninstall registry key")
    import winreg

    try:
        reg = winreg.OpenKey(winreg.HKEY_CURRENT_USER, uninstall_key,
                             0, winreg.KEY_READ)
    except FileNotFoundError as exc:
        raise MigrationBlocked("Legacy HKCU uninstall key not found") from exc

    uninstall = {}
    with reg:
        for idx in range(winreg.QueryInfoKey(reg)[1]):
            name, value, kind = winreg.EnumValue(reg, idx)
            if kind not in (winreg.REG_SZ, winreg.REG_EXPAND_SZ, winreg.REG_DWORD):
                raise MigrationBlocked("Unrecognized registry value type")
            uninstall[name] = {"kind": kind, "value": value}

    startup = None
    try:
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, run_key,
                            0, winreg.KEY_READ) as key:
            value, kind = winreg.QueryValueEx(key, APP_NAME)
            if kind not in (winreg.REG_SZ, winreg.REG_EXPAND_SZ):
                raise MigrationBlocked("Unexpected legacy startup type")
            startup = {"kind": kind, "value": value}
    except FileNotFoundError:
        pass
    return {"uninstall_key": uninstall_key, "uninstall": uninstall,
            "run_key": run_key, "run_value": startup}


def inspect_legacy(legacy_root, profile_root=None, registry=None):
    """Produce a read-only migration plan. A supplied registry is for tests.

    The plan is *not* an authorization to overwrite, retire or adopt old files.
    """
    root = safety.validate_install_root(str(legacy_root))
    _no_reparse_ancestors(root)
    script = Path(root) / "uninstall.cmd"
    _checked_file(script)
    if (Path(root) / safety.MANIFEST_FILENAME).exists():
        raise MigrationBlocked("Trusted new install must use the normal upgrade path")
    if not safety.script_contains_forbidden_deletion(
            script.read_text(encoding="utf-8-sig", errors="replace")):
        raise MigrationBlocked("Legacy script does not match known unsafe variant")
    if not (Path(root) / "NegmLoading.exe").is_file() and not (
            Path(root) / "Negm Lodaing.exe").is_file():
        raise MigrationBlocked("Legacy executable identity is missing")
    reg = registry if registry is not None else read_legacy_registry()
    old_values = reg.get("uninstall", {})
    location = old_values.get("InstallLocation", {}).get("value")
    if not isinstance(location, str) or _canonical(location) != _canonical(root):
        raise MigrationBlocked("HKCU InstallLocation mismatches legacy root")
    command = old_values.get("UninstallString", {}).get("value", "")
    if not isinstance(command, str) or _canonical(
            safety._exe_from_command(command)) != _canonical(script):
        raise MigrationBlocked("Legacy UninstallString is not its own script")
    old_name = old_values.get("DisplayName", {}).get("value", APP_NAME)
    if old_name != APP_NAME:
        raise MigrationBlocked("Unexpected legacy product identity")
    run = reg.get("run_value")
    if run is not None:
        exe = safety._exe_from_command(run.get("value", ""))
        if not exe or not _inside(root, exe) or _canonical(os.path.dirname(exe)) != _canonical(root):
            raise MigrationBlocked("Existing startup value is not owned by old root")
        if os.path.basename(exe).lower() not in ("negmloading.exe", "negm lodaing.exe"):
            raise MigrationBlocked("Existing startup value targets an unknown file")

    profile = Path(profile_root or os.path.expanduser("~")).resolve(strict=True)
    _no_reparse_ancestors(profile)
    roots = {"app": root}
    for area, name in (("user_data", ".negm_stream"),
                       ("older_user_data", ".nexus_stream")):
        folder = profile / name
        if os.path.lexists(folder):
            _no_reparse_ancestors(folder)
            if not folder.is_dir():
                raise MigrationBlocked("Legacy data root is not a directory")
            if _inside(root, folder) or _inside(folder, root):
                raise MigrationBlocked("User data and install roots overlap")
            roots[area] = str(folder)
    files = []
    total = 0
    for area, folder in roots.items():
        gathered = _walk(folder, area)
        files.extend(gathered)
        total += sum(item["size"] for item in gathered)
        if len(files) > MAX_FILES or total > MAX_BYTES:
            raise MigrationBlocked("Legacy snapshot exceeds configured limits")
    files.sort(key=lambda x: (x["area"], x["relpath"]))
    return {"format": BACKUP_HEADER, "roots": roots, "files": files,
            "registry": reg, "bytes": total}


def _write_encrypted_file(source, destination, protect):
    """Read source once per encrypted chunk; original data remains untouched."""
    before = _checked_file(source)
    original_sha = hashlib.sha256()
    descriptor = os.open(destination, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(descriptor, "wb") as out, open(source, "rb") as inp:
        while True:
            chunk = inp.read(CHUNK_BYTES)
            if not chunk:
                break
            original_sha.update(chunk)
            secret = protect.encrypt(chunk)
            if not secret or len(secret) > 2 * CHUNK_BYTES:
                raise MigrationBlocked("Invalid encrypted blob size")
            out.write(struct.pack("<I", len(secret)))
            out.write(secret)
        out.flush()
        os.fsync(out.fileno())
    after = _checked_file(source)
    if before.st_size != after.st_size or before.st_mtime_ns != after.st_mtime_ns:
        raise MigrationBlocked("Legacy source changed during snapshot")
    return original_sha.hexdigest()


def _read_encrypted_file(path, protect):
    with open(path, "rb") as src:
        while True:
            size_bytes = src.read(4)
            if not size_bytes:
                return
            if len(size_bytes) != 4:
                raise MigrationBlocked("Backup chunk header is incomplete")
            (size,) = struct.unpack("<I", size_bytes)
            if not (0 < size <= 2 * CHUNK_BYTES):
                raise MigrationBlocked("Backup chunk size is invalid")
            cipher = src.read(size)
            if len(cipher) != size:
                raise MigrationBlocked("Encrypted backup chunk is truncated")
            yield protect.decrypt(cipher)


def _index_from_backup(backup_root, protect):
    index_file = Path(backup_root) / INDEX_NAME
    _checked_file(index_file)
    raw = index_file.read_bytes()
    try:
        doc = json.loads(protect.decrypt(raw).decode("utf-8"))
    except (ValueError, UnicodeError) as exc:
        raise MigrationBlocked("Backup index cannot be decrypted") from exc
    if doc.get("format") != BACKUP_HEADER or not isinstance(doc.get("files"), list):
        raise MigrationBlocked("Unknown backup format")
    if len(doc["files"]) > MAX_FILES:
        raise MigrationBlocked("Backup index file count exceeded")
    return doc


def create_verified_backup(plan, backup_root, protect=None):
    """Create a fresh encrypted backup outside ALL sources; never overwrite."""
    protect = protect or WindowsDPAPI()
    target = Path(os.path.abspath(backup_root))
    _no_reparse_ancestors(target.parent)
    for folder in plan["roots"].values():
        if _inside(folder, target) or _inside(target, folder):
            raise MigrationBlocked("Backup destination overlaps a legacy source")
    if os.path.lexists(target):
        raise MigrationBlocked("Backup target already exists")
    target.mkdir(mode=0o700)
    records = []
    # Do not store cleartext credentials in the backup or plaintext index.
    for number, entry in enumerate(plan["files"]):
        area, relpath = entry["area"], entry["relpath"]
        if area not in plan["roots"]:
            raise MigrationBlocked("Snapshot area is invalid")
        safety.validate_relative_path(relpath)
        path = Path(plan["roots"][area]) / Path(*relpath.split("/"))
        if not _inside(plan["roots"][area], path):
            raise MigrationBlocked("Snapshot file escapes source")
        _no_reparse_ancestors(path)
        name = "%08d.dpapi" % number
        digest = _write_encrypted_file(path, target / name, protect)
        if digest != entry["sha256"]:
            raise MigrationBlocked("Source changed since inventory: %s" % relpath)
        records.append({**entry, "blob": name})
    index = {"format": BACKUP_HEADER, "files": records,
             "registry": plan["registry"], "roots": plan["roots"]}
    encrypted_index = protect.encrypt(
        json.dumps(index, ensure_ascii=False, sort_keys=True).encode("utf-8")
    )
    with open(target / INDEX_NAME, "xb") as stream:
        stream.write(encrypted_index)
        stream.flush()
        os.fsync(stream.fileno())
    verify_backup(target, protect)
    return str(target)


def verify_backup(backup_root, protect=None):
    """Decrypt all blobs and check the original SHA-256 and file lengths."""
    protect = protect or WindowsDPAPI()
    root = Path(backup_root)
    _no_reparse_ancestors(root)
    doc = _index_from_backup(root, protect)
    seen = set()
    for entry in doc["files"]:
        name = entry.get("blob")
        if not isinstance(name, str) or not name.endswith(".dpapi") or (
                "/" in name or "\\" in name or name in seen):
            raise MigrationBlocked("Backup index contains invalid blob name")
        seen.add(name)
        safety.validate_relative_path(entry["relpath"])
        digest = hashlib.sha256()
        count = 0
        blob = root / name
        _checked_file(blob)
        for data in _read_encrypted_file(blob, protect):
            count += len(data)
            digest.update(data)
        if digest.hexdigest() != entry["sha256"] or count != entry["size"]:
            raise MigrationBlocked("Backup integrity check failed: %s" % name)
    return doc


def restore_to_new_directory(backup_root, new_root, protect=None):
    """Restore into a NEW empty root only; never overwrite a legacy install."""
    protect = protect or WindowsDPAPI()
    doc = verify_backup(backup_root, protect)
    destination = Path(os.path.abspath(new_root))
    _no_reparse_ancestors(destination.parent)
    if os.path.lexists(destination):
        raise MigrationBlocked("Restore target already exists; no overwrites")
    for folder in doc["roots"].values():
        if _inside(folder, destination) or _inside(destination, folder):
            raise MigrationBlocked("Restore target overlaps a legacy source")
    if _inside(backup_root, destination) or _inside(destination, backup_root):
        raise MigrationBlocked("Restore target overlaps backup directory")
    destination.mkdir(mode=0o700)
    for entry in doc["files"]:
        area = entry["area"]
        if area not in ("app", "user_data", "older_user_data"):
            raise MigrationBlocked("Unexpected backup area")
        rel = entry["relpath"]
        safety.validate_relative_path(rel)
        target = destination / area / Path(*rel.split("/"))
        target.parent.mkdir(parents=True, exist_ok=True)
        digest = hashlib.sha256()
        with open(target, "xb") as stream:
            for chunk in _read_encrypted_file(
                    Path(backup_root) / entry["blob"], protect):
                stream.write(chunk)
                digest.update(chunk)
            stream.flush()
            os.fsync(stream.fileno())
        if digest.hexdigest() != entry["sha256"]:
            raise MigrationBlocked("Restored data did not match backup")
    return str(destination)

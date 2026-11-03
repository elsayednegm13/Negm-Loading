# -*- coding: utf-8 -*-
"""
Safe install inventory and uninstall helpers for Negm Loading.

Validates Windows paths, records an ownership manifest at install time, and
removes only files that still match that inventory. Generated uninstall
scripts never recursively delete the selected install root and do not require
a system Python interpreter.
"""
from __future__ import annotations

import datetime
import hashlib
import json
import os
import re
import stat
import subprocess
import tempfile
import uuid
import zipfile

MANIFEST_FILENAME = "negmloading-install-manifest.json"
UNINSTALL_CMD_FILENAME = "uninstall.cmd"
UNINSTALL_PS1_FILENAME = "negmloading-uninstall.ps1"
MANIFEST_VERSION = 1
DEFAULT_APP_NAME = "Negm Lodaing"
DEFAULT_UNINSTALL_KEY = r"Software\Microsoft\Windows\CurrentVersion\Uninstall\Negm Lodaing"
DEFAULT_RUN_KEY = r"Software\Microsoft\Windows\CurrentVersion\Run"
TEST_ANCHOR_PREFIX = "Software\\NegmLoadingF01Test\\"
ANCHOR_VALUE_NAME = "InstallAnchor"
EXIT_OK = 0
EXIT_VERIFY_FAILED = 2
EXIT_PARTIAL = 3
EXIT_FINAL = 4
RECOVERY_FILENAMES = frozenset({
    MANIFEST_FILENAME,
    UNINSTALL_CMD_FILENAME,
    UNINSTALL_PS1_FILENAME,
})

_SHA256_RE = re.compile(r"^[0-9a-f]{64}$")
_SAFE_APP_NAME_RE = re.compile(r"^[\w .+-]+$", re.UNICODE)
_UNSAFE_NAME_CHARS = set('<>:"|?*')
_RESERVED_DEVICE_NAMES = frozenset(
    ["CON", "PRN", "AUX", "NUL"]
    + ["COM%s" % n for n in range(10)]
    + ["LPT%s" % n for n in range(10)]
)
FORBIDDEN_UNINSTALL_PATTERNS = (
    re.compile(r"\brd\s+/s\b", re.IGNORECASE),
    re.compile(r"\brmdir\s+/s\b", re.IGNORECASE),
    re.compile(r"Remove-Item\b[^\n]*\b-Recurse\b", re.IGNORECASE),
    re.compile(r"\brmtree\b", re.IGNORECASE),
    re.compile(r"\brm\s+-rf\b", re.IGNORECASE),
    re.compile(r"\bRemove-Item\b[^\n]*\b-LiteralPath\b[^\n]*\$Root\b", re.IGNORECASE),
)


class InstallSafetyError(Exception):
    """Raised when install or uninstall cannot proceed without data-loss risk."""


class PathSafetyError(InstallSafetyError):
    """Raised when a path fails ownership or containment validation."""


def sha256_file(path, chunk_size=1024 * 1024):
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(chunk_size), b""):
            digest.update(chunk)
    return digest.hexdigest()


def is_reparse_point(path):
    if not os.path.lexists(path):
        return False
    if os.path.islink(path):
        return True
    try:
        attrs = os.lstat(path).st_file_attributes
    except (AttributeError, OSError):
        return False
    return bool(attrs & stat.FILE_ATTRIBUTE_REPARSE_POINT)


def _is_unc_path(path):
    return path.replace("/", "\\").startswith("\\\\")


def _is_drive_root(path):
    abs_path = os.path.abspath(path)
    drive, tail = os.path.splitdrive(abs_path)
    if _is_unc_path(abs_path):
        return False
    return bool(drive) and tail in ("", "\\", "/")


def is_within_root(root, path):
    try:
        root_n = os.path.normcase(os.path.abspath(root))
        path_n = os.path.normcase(os.path.abspath(path))
        common = os.path.normcase(os.path.commonpath([root_n, path_n]))
    except (ValueError, OSError):
        return False
    return common == root_n


def _reserved_device_name(part):
    stem = part.split(".", 1)[0].upper()
    return part.upper() in _RESERVED_DEVICE_NAMES or stem in _RESERVED_DEVICE_NAMES


def validate_relative_path(relpath):
    if not isinstance(relpath, str) or not relpath.strip():
        raise PathSafetyError("empty relative path")
    if "\x00" in relpath:
        raise PathSafetyError("nul in path")
    raw = relpath.replace("/", "\\").strip()
    if raw.startswith("\\") or raw.startswith("/"):
        raise PathSafetyError("absolute or UNC relative path")
    if ":" in raw:
        raise PathSafetyError("drive or ADS path")
    if raw.startswith("\\\\") or raw.startswith("//"):
        raise PathSafetyError("UNC path")
    parts = raw.split("\\")
    if any(part == "" for part in parts):
        raise PathSafetyError("empty path component")
    for part in parts:
        if part in (".", ".."):
            raise PathSafetyError("dot or parent component")
        if part.endswith(".") or part.endswith(" "):
            raise PathSafetyError("Windows trailing-dot/space name")
        if any(char in _UNSAFE_NAME_CHARS for char in part):
            raise PathSafetyError("illegal filename character")
        if _reserved_device_name(part):
            raise PathSafetyError("reserved Windows device name")
    return "\\".join(parts)


def validate_install_root(dest):
    if not isinstance(dest, str) or not dest.strip():
        raise PathSafetyError("install root is empty")
    if "\x00" in dest:
        raise PathSafetyError("nul in install root")
    expanded = os.path.abspath(os.path.expandvars(dest.strip()))
    if _is_unc_path(expanded):
        raise PathSafetyError("UNC install root is not allowed")
    if _is_drive_root(expanded):
        raise PathSafetyError("drive root cannot be an install directory")
    if os.path.lexists(expanded):
        if is_reparse_point(expanded):
            raise PathSafetyError("install root is a reparse point")
        if not os.path.isdir(expanded):
            raise PathSafetyError("install root exists and is not a directory")
    return expanded


def resolve_owned_path(root, relpath, must_exist=False):
    rel = validate_relative_path(relpath)
    root_abs = validate_install_root(root)
    current = root_abs
    for part in rel.split("\\"):
        current = os.path.join(current, part)
        exists = os.path.lexists(current)
        if exists and is_reparse_point(current):
            raise PathSafetyError("reparse point or junction in owned path")
        if must_exist and not exists:
            raise PathSafetyError("owned path is missing")
        if exists and not is_within_root(root_abs, current):
            raise PathSafetyError("path escapes install root")
    resolved = os.path.abspath(current)
    if not is_within_root(root_abs, resolved):
        raise PathSafetyError("path escapes install root")
    if os.path.normcase(resolved) == os.path.normcase(root_abs):
        raise PathSafetyError("path resolves to the install root")
    return resolved


def script_contains_forbidden_deletion(text):
    if not text:
        return False
    return any(pattern.search(text) for pattern in FORBIDDEN_UNINSTALL_PATTERNS)


def _require_safe_app_name(app_name):
    if not isinstance(app_name, str) or not _SAFE_APP_NAME_RE.match(app_name):
        raise InstallSafetyError("application name is not safe to embed")
    return app_name


def list_tree_file_relpaths(src_dir, dest_prefix):
    prefix = validate_relative_path(dest_prefix)
    files = []
    for current, _dirnames, filenames in os.walk(src_dir):
        rel_dir = os.path.relpath(current, src_dir)
        if rel_dir in (".", ""):
            dest_rel_dir = prefix
        else:
            dest_rel_dir = validate_relative_path(prefix + "\\" + rel_dir.replace("/", "\\"))
        for filename in filenames:
            files.append(validate_relative_path(dest_rel_dir + "\\" + filename))
    return files


def list_zip_payload_paths(zip_path):
    files = []
    directories = []
    with zipfile.ZipFile(zip_path, "r") as archive:
        for info in archive.infolist():
            name = info.filename.replace("\\", "/")
            if not name or name.endswith("/"):
                if name:
                    directories.append(validate_relative_path(name.rstrip("/")))
                continue
            files.append(validate_relative_path(name))
    return files, directories


BLOCKING_TEMP_NAMES = (
    MANIFEST_FILENAME + ".tmp",
    MANIFEST_FILENAME + ".retiring",
)
ARTIFACT_RELPATHS = (UNINSTALL_CMD_FILENAME, UNINSTALL_PS1_FILENAME)


def _binary_flag():
    return os.O_BINARY if hasattr(os, "O_BINARY") else 0


def owned_hash_map(manifest):
    mapping = {}
    if not manifest:
        return mapping
    for entry in manifest.get("files", []):
        mapping[os.path.normcase(entry["path"])] = entry["sha256"].lower()
    return mapping


def install_write_relpaths(payload_relpaths):
    ordered = []
    seen = set()
    for rel in list(payload_relpaths or []) + list(ARTIFACT_RELPATHS):
        rel_n = validate_relative_path(rel)
        key = os.path.normcase(rel_n)
        if key in seen:
            continue
        seen.add(key)
        ordered.append(rel_n)
    return ordered


def assert_no_blocking_temps(root):
    """A foreign temp or recovery name is never replaced or deleted."""
    for name in BLOCKING_TEMP_NAMES:
        path = os.path.join(root, name)
        if os.path.lexists(path):
            raise InstallSafetyError(
                "ملف مؤقت أو استرداد موجود ولن يُستبدل أو يُحذف: %s" % name
            )


def assert_existing_writes_are_owned(root, relpaths, manifest):
    owned = owned_hash_map(manifest)
    for rel in relpaths:
        try:
            target = resolve_owned_path(root, rel)
        except PathSafetyError as exc:
            raise InstallSafetyError("payload path is not safe to write") from exc
        if not os.path.lexists(target):
            continue
        if is_reparse_point(target) or not os.path.isfile(target):
            raise InstallSafetyError("لن يتم استبدال مسار ليس ملفًا عاديًا: %s" % rel)
        expected = owned.get(os.path.normcase(rel))
        if not expected:
            raise InstallSafetyError("ملف موجود وغير مملوك لهذا التثبيت. لن يتم استبداله: %s" % rel)
        try:
            current = sha256_file(target)
        except OSError as exc:
            raise InstallSafetyError("تعذر فحص الملف قبل الكتابة: %s" % rel) from exc
        if current.lower() != expected:
            raise InstallSafetyError("ملف مملوك تغيّر. لن يتم استبداله: %s" % rel)


def assess_destination(dest, payload_relpaths, anchor_key=None):
    """Refuse a nonempty destination before any install write.

    The checked set is the payload plus uninstall.cmd and the PowerShell helper.
    A fixed manifest temp or .retiring file blocks the install and is not deleted.
    """
    root = validate_install_root(dest)
    created_root = not os.path.isdir(root)
    if created_root:
        return root, True, None
    try:
        entries = [name for name in os.listdir(root) if name not in (".", "..")]
    except OSError as exc:
        raise InstallSafetyError("cannot read install directory") from exc
    if not entries:
        return root, False, None

    manifest_path = os.path.join(root, MANIFEST_FILENAME)
    if not os.path.isfile(manifest_path) or is_reparse_point(manifest_path):
        raise InstallSafetyError(
            "المجلد المحدد يحتوي ملفات ولا يوجد بيان تثبيت موثوق. لن يتم الكتابة فوقه."
        )

    manifest = load_manifest(root)
    try:
        verify_install_anchor(root, manifest, anchor_key or DEFAULT_UNINSTALL_KEY)
    except InstallSafetyError as exc:
        raise InstallSafetyError(
            "بيان التثبيت غير مربوط بمرساة التثبيت. لن يتم استبدال أي ملف."
        ) from exc
    assert_no_blocking_temps(root)
    assert_existing_writes_are_owned(root, install_write_relpaths(payload_relpaths), manifest)
    return root, False, manifest


def build_file_entry(root, relpath, role="payload"):
    rel = validate_relative_path(relpath)
    full = resolve_owned_path(root, rel, must_exist=True)
    if not os.path.isfile(full) or is_reparse_point(full):
        raise InstallSafetyError("owned path is not a regular file")
    return {
        "path": rel,
        "sha256": sha256_file(full),
        "size": os.path.getsize(full),
        "role": role,
    }


def _create_exclusive_bytes(dest_path, data):
    flags = os.O_CREAT | os.O_EXCL | os.O_WRONLY | _binary_flag()
    try:
        fd = os.open(dest_path, flags)
    except FileExistsError as exc:
        raise InstallSafetyError("الملف ظهر قبل إنشائه. لن يتم الاستبدال.") from exc
    try:
        with os.fdopen(fd, "wb") as handle:
            handle.write(data)
            handle.flush()
            os.fsync(handle.fileno())
    except Exception:
        try:
            os.remove(dest_path)
        except OSError:
            pass
        raise


def _replace_bytes_if_unchanged(dest_path, data, expected_sha):
    if is_reparse_point(dest_path) or not os.path.isfile(dest_path):
        raise InstallSafetyError("لن يتم استبدال مسار ليس ملفًا عاديًا.")
    if sha256_file(dest_path).lower() != expected_sha.lower():
        raise InstallSafetyError("تغير الملف قبل استبداله. لن يتم الاستبدال.")
    directory = os.path.dirname(dest_path) or "."
    fd, tmp = tempfile.mkstemp(prefix=".negm-write-", dir=directory)
    tmp_path = tmp
    try:
        with os.fdopen(fd, "wb") as handle:
            handle.write(data)
            handle.flush()
            os.fsync(handle.fileno())
        if sha256_file(dest_path).lower() != expected_sha.lower() or is_reparse_point(dest_path):
            raise InstallSafetyError("تغير الملف قبل استبداله. لن يتم الاستبدال.")
        os.replace(tmp, dest_path)
        tmp_path = None
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except OSError:
                pass


def write_bytes_owned(dest_path, data, expected_sha=None):
    """Create a new file exclusively, or replace one whose bytes still match."""
    if not os.path.lexists(dest_path):
        _create_exclusive_bytes(dest_path, data)
        return
    if not expected_sha:
        raise InstallSafetyError("ملف موجود وغير مملوك. لن يتم استبداله.")
    _replace_bytes_if_unchanged(dest_path, data, expected_sha)


def capture_write_snapshot(root, relpaths):
    """Bytes of write-set files before an install. None means the path was absent."""
    snapshot = {}
    for rel in relpaths:
        target = resolve_owned_path(root, rel)
        if not os.path.lexists(target):
            snapshot[target] = None
            continue
        if is_reparse_point(target) or not os.path.isfile(target):
            raise InstallSafetyError("لن يتم أخذ نسخة من مسار ليس ملفًا عاديًا: %s" % rel)
        with open(target, "rb") as handle:
            snapshot[target] = handle.read()
    return snapshot


def restore_write_snapshot(snapshot):
    """Put back only paths this install snapshotted. Never a recursive root delete."""
    if not snapshot:
        return
    for path, data in snapshot.items():
        if data is None:
            if os.path.isfile(path) and not is_reparse_point(path):
                try:
                    os.remove(path)
                except OSError:
                    pass
            continue
        directory = os.path.dirname(path) or "."
        fd, tmp = tempfile.mkstemp(prefix=".negm-restore-", dir=directory)
        tmp_path = tmp
        try:
            with os.fdopen(fd, "wb") as handle:
                handle.write(data)
                handle.flush()
                os.fsync(handle.fileno())
            os.replace(tmp, path)
            tmp_path = None
        finally:
            if tmp_path and os.path.exists(tmp_path):
                try:
                    os.remove(tmp_path)
                except OSError:
                    pass


def safe_copy_file(src, dest_root, relpath, role="payload", expected_sha=None):
    rel = validate_relative_path(relpath)
    dest_path = resolve_owned_path(dest_root, rel)
    parent = os.path.dirname(dest_path)
    if parent:
        os.makedirs(parent, exist_ok=True)
    with open(src, "rb") as handle:
        data = handle.read()
    write_bytes_owned(dest_path, data, expected_sha=expected_sha)
    return build_file_entry(dest_root, rel, role)


def safe_copy_tree(src_dir, dest_root, dest_prefix, role="payload", expected_by_rel=None):
    prefix = validate_relative_path(dest_prefix)
    files = []
    directories = [prefix]
    os.makedirs(os.path.join(dest_root, prefix), exist_ok=True)
    for current, _dirnames, filenames in os.walk(src_dir):
        rel_dir = os.path.relpath(current, src_dir)
        if rel_dir in (".", ""):
            dest_rel_dir = prefix
        else:
            dest_rel_dir = validate_relative_path(prefix + "\\" + rel_dir.replace("/", "\\"))
            directories.append(dest_rel_dir)
            os.makedirs(os.path.join(dest_root, dest_rel_dir), exist_ok=True)
        for filename in filenames:
            rel = validate_relative_path(dest_rel_dir + "\\" + filename)
            expected = (expected_by_rel or {}).get(os.path.normcase(rel))
            files.append(safe_copy_file(
                os.path.join(current, filename), dest_root, rel, role, expected_sha=expected
            ))
    return files, directories


def safe_extract_zip(zip_path, dest_root, role="payload", expected_by_rel=None):
    root = validate_install_root(dest_root)
    expected = {os.path.normcase(key): value for key, value in (expected_by_rel or {}).items()}
    files = []
    directories = []
    with zipfile.ZipFile(zip_path, "r") as archive:
        for info in archive.infolist():
            name = info.filename.replace("\\", "/")
            if not name:
                continue
            if name.endswith("/"):
                rel_dir = validate_relative_path(name.rstrip("/"))
                directories.append(rel_dir)
                os.makedirs(resolve_owned_path(root, rel_dir), exist_ok=True)
                continue
            rel = validate_relative_path(name)
            dest_path = resolve_owned_path(root, rel)
            parent = os.path.dirname(dest_path)
            if parent:
                os.makedirs(parent, exist_ok=True)
                parent_rel = os.path.relpath(parent, root)
                if parent_rel not in (".", ""):
                    directories.append(validate_relative_path(parent_rel.replace("/", "\\")))
            with archive.open(info, "r") as src:
                data = src.read()
            write_bytes_owned(dest_path, data, expected_sha=expected.get(os.path.normcase(rel)))
            files.append(build_file_entry(root, rel, role))
    return files, _unique_dirs(directories)


def _unique_dirs(directories):
    seen = set()
    ordered = []
    for item in directories:
        key = os.path.normcase(item)
        if key in seen:
            continue
        seen.add(key)
        ordered.append(item)
    return ordered


def _validate_manifest_entry(entry, field):
    if not isinstance(entry, dict):
        raise InstallSafetyError("manifest %s entry is not an object" % field)
    path = validate_relative_path(entry.get("path", ""))
    if field == "files":
        digest = entry.get("sha256", "")
        if not isinstance(digest, str) or not _SHA256_RE.match(digest.lower()):
            raise InstallSafetyError("manifest file hash is missing or invalid")
        size = entry.get("size", 0)
        if not isinstance(size, int) or isinstance(size, bool) or size < 0:
            raise InstallSafetyError("manifest file size is invalid")
        return {
            "path": path,
            "sha256": digest.lower(),
            "size": size,
            "role": entry.get("role") if isinstance(entry.get("role"), str) else "payload",
        }
    return {"path": path}


def validate_shortcut_path(path):
    if not isinstance(path, str) or not path.strip():
        raise InstallSafetyError("shortcut path is empty")
    if any(char in path for char in ("\x00", "\r", "\n")):
        raise InstallSafetyError("shortcut path is unsafe")
    absolute = os.path.abspath(path)
    if _is_unc_path(absolute) or not os.path.splitdrive(absolute)[0]:
        raise InstallSafetyError("shortcut path must be a local absolute path")
    if not absolute.lower().endswith(".lnk"):
        raise InstallSafetyError("shortcut path must be a .lnk file")
    return absolute


def _powershell_exe():
    system_root = os.environ.get("SystemRoot", r"C:\Windows")
    return os.path.join(system_root, "System32", "WindowsPowerShell", "v1.0", "powershell.exe")


def read_shortcut_target(path):
    """Return the shortcut TargetPath. The caller treats a failure as ambiguity."""
    if os.name != "nt":
        raise OSError("shortcut targets are only read on Windows")
    env = os.environ.copy()
    env["F01_LNK"] = path
    completed = subprocess.run(
        [_powershell_exe(), "-NoProfile", "-Command",
         "$s=New-Object -ComObject WScript.Shell; "
         "$l=$s.CreateShortcut($env:F01_LNK); "
         "Write-Output $l.TargetPath"],
        env=env,
        capture_output=True,
        text=True,
    )
    if completed.returncode != 0:
        raise OSError(completed.stderr or completed.stdout or "shortcut target unreadable")
    return (completed.stdout or "").strip()


def describe_shortcut(path):
    """Hash a .lnk that already exists. A missing file is recorded as path-only."""
    absolute = validate_shortcut_path(path)
    empty = {"path": absolute, "sha256": "", "target": ""}
    if os.name != "nt" or not os.path.isfile(absolute) or is_reparse_point(absolute):
        return empty
    try:
        digest = sha256_file(absolute)
        target = read_shortcut_target(absolute)
    except OSError:
        return empty
    if not target or any(char in target for char in ("\x00", "\r", "\n", "\t")):
        return empty
    return {"path": absolute, "sha256": digest, "target": target}


def _normalize_shortcut_entry(item):
    if isinstance(item, str):
        return {"path": validate_shortcut_path(item), "sha256": "", "target": ""}
    if not isinstance(item, dict):
        raise InstallSafetyError("install manifest shortcut is invalid")
    path = validate_shortcut_path(item.get("path"))
    digest = item.get("sha256") or ""
    target = item.get("target") or ""
    if digest:
        if not isinstance(digest, str) or not _SHA256_RE.match(digest.lower()):
            raise InstallSafetyError("install manifest shortcut hash is invalid")
        digest = digest.lower()
    else:
        digest = ""
    if not isinstance(target, str) or any(char in target for char in ("\x00", "\r", "\n", "\t")):
        raise InstallSafetyError("install manifest shortcut target is invalid")
    if not digest or not target:
        return {"path": path, "sha256": "", "target": ""}
    return {"path": path, "sha256": digest, "target": target}


def _public_shortcut(record):
    if record.get("sha256"):
        return {
            "path": record["path"],
            "sha256": record["sha256"],
            "target": record["target"],
        }
    return {"path": record["path"]}


def _manifest_shortcut_record(item):
    """Store a trusted record as-is. Hash a path only when it is newly supplied."""
    if isinstance(item, dict):
        return _public_shortcut(_normalize_shortcut_entry(item))
    return _public_shortcut(describe_shortcut(item))


def merge_previous_shortcuts(previous, new_paths):
    """Carry shortcut identities from a verified manifest without re-hashing them."""
    merged = []
    seen = set()
    for record in (previous or {}).get("shortcuts") or []:
        merged.append(record)
        seen.add(os.path.normcase(record["path"]))
    for path in new_paths or []:
        absolute = validate_shortcut_path(path if isinstance(path, str) else path.get("path"))
        key = os.path.normcase(absolute)
        if key in seen:
            continue
        merged.append(absolute)
        seen.add(key)
    return merged


def _shortcut_fingerprint_lines(shortcuts):
    lines = []
    for record in sorted(shortcuts, key=lambda item: item["path"]):
        if record.get("sha256"):
            lines.append("S\t%s\t%s\t%s" % (record["path"], record["sha256"], record["target"]))
        else:
            lines.append("S\t%s" % record["path"])
    return lines


def load_manifest(install_root, expected_app_name=None):
    root = validate_install_root(install_root)
    manifest_path = os.path.join(root, MANIFEST_FILENAME)
    if not os.path.isfile(manifest_path) or is_reparse_point(manifest_path):
        raise InstallSafetyError("install manifest is missing")
    try:
        with open(manifest_path, "r", encoding="utf-8") as handle:
            data = json.load(handle)
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        raise InstallSafetyError("install manifest is unreadable or not JSON") from exc
    if not isinstance(data, dict):
        raise InstallSafetyError("install manifest is not an object")
    if data.get("version") != MANIFEST_VERSION:
        raise InstallSafetyError("install manifest version is unsupported")
    app_name = data.get("app_name")
    if not isinstance(app_name, str) or not app_name:
        raise InstallSafetyError("install manifest app_name is invalid")
    if expected_app_name is not None and app_name != expected_app_name:
        raise InstallSafetyError("install manifest does not belong to this application")

    files = data.get("files")
    directories = data.get("directories", [])
    if not isinstance(files, list) or not isinstance(directories, list):
        raise InstallSafetyError("install manifest inventory is invalid")

    safe_files = [_validate_manifest_entry(item, "files") for item in files]
    safe_dirs = [_validate_manifest_entry(item, "directories") for item in directories]
    shortcuts = data.get("shortcuts", [])
    if not isinstance(shortcuts, list):
        raise InstallSafetyError("install manifest shortcuts are invalid")
    safe_shortcuts = [_normalize_shortcut_entry(item) for item in shortcuts]
    created_root = data.get("created_root") is True
    return {
        "version": MANIFEST_VERSION,
        "app_name": app_name,
        "app_version": data.get("app_version") if isinstance(data.get("app_version"), str) else "",
        "created_utc": data.get("created_utc") if isinstance(data.get("created_utc"), str) else "",
        "created_root": created_root,
        "files": safe_files,
        "directories": safe_dirs,
        "shortcuts": safe_shortcuts,
    }


def write_manifest(install_root, files, directories, app_name=DEFAULT_APP_NAME,
                   app_version="1.0.0", created_root=False, shortcuts=None):
    root = validate_install_root(install_root)
    payload = {
        "version": MANIFEST_VERSION,
        "app_name": _require_safe_app_name(app_name),
        "app_version": app_version if isinstance(app_version, str) else "",
        "created_utc": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "created_root": bool(created_root),
        "files": [build_file_entry(root, item["path"] if isinstance(item, dict) else item,
                                   item.get("role", "payload") if isinstance(item, dict) else "payload")
                  for item in files],
        "directories": [{"path": validate_relative_path(item["path"] if isinstance(item, dict) else item)}
                        for item in directories],
        "shortcuts": [_manifest_shortcut_record(item) for item in (shortcuts or [])],
    }
    dest = os.path.join(root, MANIFEST_FILENAME)
    raw = json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True).encode("utf-8")
    expected = None
    if os.path.lexists(dest):
        if is_reparse_point(dest) or not os.path.isfile(dest):
            raise InstallSafetyError("لن يتم استبدال بيان ليس ملفًا عاديًا.")
        expected = sha256_file(dest)
    write_bytes_owned(dest, raw, expected_sha=expected)
    return dest


def _dir_depth(relpath):
    return relpath.replace("/", "\\").count("\\")


def _safe_registry_key(key):
    if not isinstance(key, str) or not key.strip():
        return False
    if any(char in key for char in ("\x00", "\n", "\r", "'")):
        return False
    if key.startswith("\\") or ":" in key:
        return False
    parts = key.split("\\")
    return all(parts) and ".." not in parts


def _ps_single_quote(value):
    if not isinstance(value, str) or any(char in value for char in ("'", "\n", "\r", "\x00")):
        raise InstallSafetyError("value cannot be embedded in the uninstaller")
    return "'" + value + "'"


def manifest_fingerprint(manifest):
    """Canonical ownership digest shared by Python and the PowerShell uninstaller."""
    lines = [
        "v1",
        "app=" + manifest["app_name"],
        "created_root=" + ("1" if manifest.get("created_root") else "0"),
    ]
    for entry in sorted(manifest.get("files", []), key=lambda item: item["path"]):
        lines.append("F\t%s\t%s\t%d" % (entry["path"], entry["sha256"].lower(), int(entry["size"])))
    for entry in sorted(manifest.get("directories", []), key=lambda item: item["path"]):
        lines.append("D\t%s" % entry["path"])
    lines.extend(_shortcut_fingerprint_lines(manifest.get("shortcuts") or []))
    return hashlib.sha256("\n".join(lines).encode("utf-8")).hexdigest()


def make_test_anchor_key():
    return TEST_ANCHOR_PREFIX + uuid.uuid4().hex


def _require_windows_registry():
    if os.name != "nt":
        raise InstallSafetyError("Windows registry anchor is unavailable")


def _locations_match(left, right):
    return os.path.normcase(os.path.abspath(left)) == os.path.normcase(os.path.abspath(right))


def _exe_from_command(value):
    text = (value or "").strip()
    if not text:
        return ""
    if text.startswith('"'):
        end = text.find('"', 1)
        if end > 1:
            return text[1:end]
    return text.split(" ", 1)[0]


def assert_uninstall_key_available(anchor_key, install_root):
    """Refuse to replace an uninstall key that belongs to another location."""
    _require_windows_registry()
    import winreg
    root = validate_install_root(install_root)
    if not _safe_registry_key(anchor_key):
        raise InstallSafetyError("unsafe registry key")
    try:
        key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, anchor_key)
    except FileNotFoundError:
        return
    with key:
        try:
            location, _kind = winreg.QueryValueEx(key, "InstallLocation")
        except FileNotFoundError as exc:
            raise InstallSafetyError(
                "مفتاح الإزالة موجود بلا InstallLocation. لن يتم استبداله."
            ) from exc
    if not isinstance(location, str) or not location.strip():
        raise InstallSafetyError("مفتاح الإزالة موجود بلا مسار صالح. لن يتم استبداله.")
    if not _locations_match(location, root):
        raise InstallSafetyError("مفتاح الإزالة يشير إلى تثبيت آخر. لن يتم استبداله.")


def assert_run_value_available(run_key, value_name, expected_exe):
    """Refuse to replace a startup value that points somewhere else."""
    _require_windows_registry()
    import winreg
    if not _safe_registry_key(run_key):
        raise InstallSafetyError("unsafe registry key")
    if not isinstance(value_name, str) or not value_name or any(char in value_name for char in "\x00\\"):
        raise InstallSafetyError("unsafe startup value name")
    try:
        key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, run_key)
    except FileNotFoundError:
        return
    with key:
        try:
            current, _kind = winreg.QueryValueEx(key, value_name)
        except FileNotFoundError:
            return
    exe = _exe_from_command(current if isinstance(current, str) else "")
    if exe and _locations_match(exe, expected_exe):
        return
    raise InstallSafetyError("قيمة بدء التشغيل تخص برنامجًا آخر. لن يتم استبدالها.")


def write_install_anchor(install_root, anchor_key, manifest=None):
    """
    Bind the manifest to HKCU.

    The install directory is writable by the installing user, so a hash stored
    beside the manifest is not an independent proof. This record stops an edit
    that changes only the manifest. It does not stop a same-user process that
    rewrites the manifest and this registry value together.
    """
    _require_windows_registry()
    import winreg
    root = validate_install_root(install_root)
    if not _safe_registry_key(anchor_key):
        raise InstallSafetyError("unsafe registry key")
    assert_uninstall_key_available(anchor_key, root)
    manifest = manifest or load_manifest(root)
    payload = {
        "app_name": manifest["app_name"],
        "install_location": os.path.abspath(root),
        "manifest_sha256": manifest_fingerprint(manifest),
    }
    encoded = json.dumps(payload, ensure_ascii=False, sort_keys=True)
    with winreg.CreateKey(winreg.HKEY_CURRENT_USER, anchor_key) as key:
        winreg.SetValueEx(key, ANCHOR_VALUE_NAME, 0, winreg.REG_SZ, encoded)
        winreg.SetValueEx(key, "InstallLocation", 0, winreg.REG_SZ, os.path.abspath(root))
    return payload


def read_install_anchor(anchor_key):
    _require_windows_registry()
    import winreg
    if not _safe_registry_key(anchor_key):
        raise InstallSafetyError("unsafe registry key")
    try:
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, anchor_key) as key:
            raw, kind = winreg.QueryValueEx(key, ANCHOR_VALUE_NAME)
    except OSError as exc:
        raise InstallSafetyError("install anchor is missing") from exc
    if kind != winreg.REG_SZ or not isinstance(raw, str):
        raise InstallSafetyError("install anchor type is invalid")
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise InstallSafetyError("install anchor is not JSON") from exc
    if not isinstance(data, dict):
        raise InstallSafetyError("install anchor is not an object")
    digest = data.get("manifest_sha256", "")
    location = data.get("install_location", "")
    app_name = data.get("app_name", "")
    if not isinstance(digest, str) or not _SHA256_RE.match(digest.lower()):
        raise InstallSafetyError("install anchor hash is invalid")
    if not isinstance(location, str) or not location.strip():
        raise InstallSafetyError("install anchor location is invalid")
    if not isinstance(app_name, str) or not app_name:
        raise InstallSafetyError("install anchor app_name is invalid")
    return {
        "app_name": app_name,
        "install_location": location,
        "manifest_sha256": digest.lower(),
    }


def verify_install_anchor(install_root, manifest, anchor_key):
    anchor = read_install_anchor(anchor_key)
    root = os.path.abspath(install_root)
    if anchor["app_name"] != manifest["app_name"]:
        raise InstallSafetyError("install anchor does not belong to this application")
    if os.path.normcase(os.path.abspath(anchor["install_location"])) != os.path.normcase(root):
        raise InstallSafetyError("install anchor location does not match this folder")
    if anchor["manifest_sha256"] != manifest_fingerprint(manifest):
        raise InstallSafetyError("install manifest does not match the install-time anchor")
    return anchor


def delete_test_anchor_key(anchor_key):
    """Delete only keys created under the F-01 test prefix. Never the production key."""
    if os.name != "nt":
        return
    import winreg
    key = (anchor_key or "").replace("/", "\\")
    if not key.startswith(TEST_ANCHOR_PREFIX):
        raise InstallSafetyError("refusing to delete a non-test registry key")
    for path in (key + "\\Run", key):
        try:
            winreg.DeleteKey(winreg.HKEY_CURRENT_USER, path)
        except OSError:
            pass


def retire_matching_anchor(anchor_key, install_root):
    """Drop the anchor after full success only when it still names this folder."""
    if os.name != "nt":
        return False
    import winreg
    try:
        anchor = read_install_anchor(anchor_key)
    except InstallSafetyError:
        return True
    if os.path.normcase(os.path.abspath(anchor["install_location"])) != os.path.normcase(os.path.abspath(install_root)):
        return True
    for path in (anchor_key + "\\Run", anchor_key):
        try:
            winreg.DeleteKey(winreg.HKEY_CURRENT_USER, path)
        except OSError:
            pass
    try:
        winreg.OpenKey(winreg.HKEY_CURRENT_USER, anchor_key)
    except OSError:
        return True
    return False


def _new_result():
    return {
        "deleted": [],
        "preserved": [],
        "missing": [],
        "manual_cleanup": False,
        "root_removed": False,
        "message": "",
        "exit_code": EXIT_OK,
        "anchor_kept": True,
    }


def _stop_uninstall(result, exit_code, message):
    result["manual_cleanup"] = True
    result["exit_code"] = exit_code
    result["anchor_kept"] = True
    result["message"] = message
    return result


def _is_recovery_relpath(relpath):
    return os.path.normcase(relpath) in {os.path.normcase(name) for name in RECOVERY_FILENAMES}


def _non_recovery_entries(root):
    leftovers = []
    try:
        names = os.listdir(root)
    except OSError:
        return ["<unreadable>"]
    for name in names:
        full = os.path.join(root, name)
        if os.path.normcase(name) in {os.path.normcase(item) for item in RECOVERY_FILENAMES} and os.path.isfile(full):
            if not is_reparse_point(full):
                continue
        leftovers.append(name)
    return leftovers


def safe_uninstall(install_root, expected_app_name=DEFAULT_APP_NAME, anchor_key=None):
    """
    Remove unmodified, anchor-bound files under install_root.

    Exit 0: payload removed and no unrelated files remain.
    Exit 2: verification failed. Nothing is deleted.
    Exit 3: removal incomplete. Manifest and uninstall scripts stay for retry.
    The install root is never recursively deleted.
    """
    anchor_key = anchor_key or DEFAULT_UNINSTALL_KEY
    result = _new_result()
    try:
        root = validate_install_root(install_root)
    except InstallSafetyError as exc:
        return _stop_uninstall(result, EXIT_VERIFY_FAILED, "MANUAL CLEANUP REQUIRED: %s" % exc)
    if not os.path.isdir(root):
        result["message"] = "install root already absent"
        result["exit_code"] = EXIT_OK
        return result

    try:
        manifest = load_manifest(root, expected_app_name=expected_app_name)
    except InstallSafetyError as exc:
        return _stop_uninstall(result, EXIT_VERIFY_FAILED, "MANUAL CLEANUP REQUIRED: %s" % exc)
    try:
        verify_install_anchor(root, manifest, anchor_key)
    except InstallSafetyError as exc:
        return _stop_uninstall(result, EXIT_VERIFY_FAILED, "MANUAL CLEANUP REQUIRED: %s" % exc)

    payload_blocked = False
    for entry in manifest["files"]:
        rel = entry["path"]
        if _is_recovery_relpath(rel):
            continue
        try:
            full = resolve_owned_path(root, rel)
        except PathSafetyError:
            result["preserved"].append(rel)
            payload_blocked = True
            continue
        if not os.path.lexists(full):
            result["missing"].append(rel)
            continue
        if os.path.isdir(full) or is_reparse_point(full) or not os.path.isfile(full):
            result["preserved"].append(rel)
            payload_blocked = True
            continue
        try:
            current_hash = sha256_file(full)
        except OSError:
            result["preserved"].append(rel)
            payload_blocked = True
            continue
        if current_hash != entry["sha256"]:
            result["preserved"].append(rel)
            payload_blocked = True
            continue
        try:
            os.remove(full)
        except OSError:
            result["preserved"].append(rel)
            payload_blocked = True
            continue
        result["deleted"].append(rel)

    if payload_blocked:
        return _stop_uninstall(
            result,
            EXIT_PARTIAL,
            "MANUAL CLEANUP REQUIRED: owned files were preserved. Manifest and uninstall scripts were kept.",
        )

    dir_blocked = False
    for entry in sorted(manifest["directories"], key=lambda item: _dir_depth(item["path"]), reverse=True):
        rel = entry["path"]
        try:
            full = resolve_owned_path(root, rel)
        except PathSafetyError:
            result["preserved"].append(rel)
            dir_blocked = True
            continue
        if not os.path.isdir(full) or is_reparse_point(full):
            if os.path.lexists(full):
                result["preserved"].append(rel)
                dir_blocked = True
            continue
        try:
            if os.listdir(full):
                result["preserved"].append(rel)
                dir_blocked = True
                continue
            os.rmdir(full)
            result["deleted"].append(rel)
        except OSError:
            result["preserved"].append(rel)
            dir_blocked = True

    if dir_blocked or _non_recovery_entries(root):
        return _stop_uninstall(
            result,
            EXIT_PARTIAL,
            "MANUAL CLEANUP REQUIRED: unrelated or modified files were preserved. "
            "Manifest and uninstall scripts were kept.",
        )

    shortcut_state = _apply_recorded_shortcuts(root, manifest, result)
    if shortcut_state == "failed":
        return _stop_uninstall(
            result,
            EXIT_FINAL,
            "MANUAL CLEANUP REQUIRED: payload was removed but final cleanup failed for an owned shortcut. "
            "Manifest, anchor, and uninstall scripts were kept. Retry is possible. Exit code 4.",
        )
    if shortcut_state == "modified":
        return _stop_uninstall(
            result,
            EXIT_FINAL,
            "MANUAL CLEANUP REQUIRED: a recorded shortcut was modified after install and was kept. "
            "Full cleanup was not completed. Delete or restore that shortcut manually if you want it removed. "
            "Manifest, anchor, and uninstall scripts were kept. Exit code 4.",
        )

    if not retire_matching_anchor(anchor_key, root):
        return _stop_uninstall(
            result,
            EXIT_FINAL,
            "MANUAL CLEANUP REQUIRED: payload was removed but the install anchor remains. "
            "Manifest and uninstall scripts were kept. Retry is possible. Exit code 4.",
        )
    result["anchor_kept"] = False

    for name in (MANIFEST_FILENAME, UNINSTALL_PS1_FILENAME, UNINSTALL_CMD_FILENAME):
        path = os.path.join(root, name)
        if not os.path.lexists(path):
            continue
        if is_reparse_point(path) or not os.path.isfile(path):
            result["preserved"].append(name)
            continue
        try:
            os.remove(path)
            result["deleted"].append(name)
        except OSError:
            result["preserved"].append(name)
    if result["preserved"] or (os.path.isdir(root) and _non_recovery_entries(root)):
        return _stop_uninstall(
            result,
            EXIT_FINAL,
            "MANUAL CLEANUP REQUIRED: the install anchor was removed but recovery files remain. "
            "Automatic retry cannot verify ownership. Exit code 4.",
        )

    if manifest.get("created_root") is True and os.path.isdir(root) and not is_reparse_point(root):
        try:
            if not os.listdir(root):
                os.rmdir(root)
                result["root_removed"] = True
            if os.path.isdir(root):
                return _stop_uninstall(
                    result,
                    EXIT_FINAL,
                    "MANUAL CLEANUP REQUIRED: payload was removed but the install folder remains. Exit code 4.",
                )
        except OSError:
            return _stop_uninstall(
                result,
                EXIT_FINAL,
                "MANUAL CLEANUP REQUIRED: payload was removed but the install folder remains. Exit code 4.",
            )

    result["exit_code"] = EXIT_OK
    result["manual_cleanup"] = False
    if result.get("shortcut_notes"):
        result["message"] = "owned files removed; shortcuts without a verified fingerprint were kept"
    else:
        result["message"] = "owned files removed"
    return result


def _apply_recorded_shortcuts(root, manifest, result):
    """Delete a shortcut only when its recorded path, target, and bytes still match.

    A path-only manifest entry is not content ownership. A changed or unreadable
    shortcut is kept. The SHA-256 is bound to the install anchor; it is not a
    signature against the same user.
    """
    failed = False
    modified = False
    notes = []
    for record in manifest.get("shortcuts") or []:
        path = record["path"]
        if not os.path.lexists(path):
            continue
        if is_reparse_point(path) or not os.path.isfile(path):
            failed = True
            result["preserved"].append(path)
            continue
        if not record.get("sha256"):
            notes.append(path)
            continue
        try:
            current = sha256_file(path)
        except OSError:
            failed = True
            result["preserved"].append(path)
            continue
        if current != record["sha256"]:
            modified = True
            result["preserved"].append(path)
            continue
        try:
            target = read_shortcut_target(path)
        except OSError:
            target = ""
        if not target or os.path.normcase(target) != os.path.normcase(record.get("target") or ""):
            failed = True
            result["preserved"].append(path)
            continue
        if not is_within_root(root, target):
            notes.append(path)
            continue
        try:
            os.remove(path)
        except OSError:
            failed = True
            result["preserved"].append(path)
            continue
        if os.path.lexists(path):
            failed = True
            result["preserved"].append(path)
            continue
        result["deleted"].append(path)
    result["shortcut_notes"] = notes
    if failed:
        return "failed"
    if modified:
        return "modified"
    return "ok"


def default_shortcut_paths(app_name):
    app = _require_safe_app_name(app_name)
    desktop = os.path.join(os.path.expanduser("~"), "Desktop", app + ".lnk")
    appdata = os.environ.get("APPDATA") or os.path.expanduser(r"~\AppData\Roaming")
    start_menu = os.path.join(appdata, "Microsoft", "Windows", "Start Menu", "Programs", app + ".lnk")
    return [desktop, start_menu]


def _powershell_uninstaller(app_name, anchor_key=None, run_key=None, shortcut_paths=None):
    app = _require_safe_app_name(app_name)
    anchor_key = anchor_key or DEFAULT_UNINSTALL_KEY
    run_key = run_key or DEFAULT_RUN_KEY
    if not _safe_registry_key(anchor_key) or not _safe_registry_key(run_key):
        raise InstallSafetyError("unsafe registry key")
    if shortcut_paths is None:
        shortcut_paths = default_shortcut_paths(app)
    quoted = []
    for path in shortcut_paths:
        quoted.append(_ps_single_quote(os.path.abspath(path)))
    text = _POWERSHELL_TEMPLATE
    text = text.replace("__APP_NAME__", app)
    text = text.replace("__ANCHOR_KEY__", anchor_key)
    text = text.replace("__RUN_KEY__", run_key)
    text = text.replace("__SHORTCUTS__", ", ".join(quoted))
    if script_contains_forbidden_deletion(text):
        raise InstallSafetyError("generated uninstall helper failed self-check")
    return text


_CMD_TEMPLATE = """@echo off\r
setlocal EnableExtensions\r
title Removing __APP_NAME__...\r
rem Exit 0: payload removed and final cleanup verified by PowerShell.\r
rem Exit 2: verification failed. No files, shortcuts, or registry values were removed.\r
rem Exit 3: payload removal incomplete. Manifest, scripts, shortcuts, and the anchor were kept.\r
rem Exit 4: payload was removed but final cleanup could not be verified.\r
if not exist \"%~dp0__PS1__\" goto MissingHelper\r
\"%SystemRoot%\\System32\\WindowsPowerShell\\v1.0\\powershell.exe\" -NoProfile -NonInteractive -ExecutionPolicy Bypass -File \"%~dp0__PS1__\"\r
set \"EC=%ERRORLEVEL%\"\r
if \"%EC%\"==\"0\" goto Announce\r
if \"%EC%\"==\"4\" goto FinalReported\r
echo MANUAL CLEANUP REQUIRED: uninstall stopped before completion. Manifest and uninstall scripts were kept. Exit code %EC%.\r
exit /b %EC%\r
:MissingHelper\r
echo MANUAL CLEANUP REQUIRED: missing uninstall helper. Exit code 2.\r
exit /b 2\r
:Announce\r
echo __APP_NAME__ owned files were removed.\r
exit /b 0\r
:FinalReported\r
echo MANUAL CLEANUP REQUIRED: payload was removed but final cleanup is incomplete. Recovery scripts were kept. Exit code 4.\r
exit /b 4\r
"""


def generate_uninstall_cmd(app_name=DEFAULT_APP_NAME, created_root=False):
    app = _require_safe_app_name(app_name)
    cmd = _CMD_TEMPLATE.replace("__APP_NAME__", app).replace("__PS1__", UNINSTALL_PS1_FILENAME)
    cmd = cmd.replace("__CREATED_ROOT__", "1" if created_root else "0")
    if script_contains_forbidden_deletion(cmd):
        raise InstallSafetyError("generated uninstall.cmd failed self-check")
    if "reg delete" in cmd.lower() or "taskkill" in cmd.lower() or "%USERPROFILE%" in cmd:
        raise InstallSafetyError("generated uninstall.cmd touches integration before verification")
    return cmd


def write_uninstall_artifacts(install_root, owned_files, owned_dirs, app_name=DEFAULT_APP_NAME,
                              app_version="1.0.0", created_root=False, anchor_key=None,
                              run_key=None, shortcut_paths=None):
    root = validate_install_root(install_root)
    app = _require_safe_app_name(app_name)
    anchor_key = anchor_key or DEFAULT_UNINSTALL_KEY
    run_key = run_key or DEFAULT_RUN_KEY
    ps1_text = _powershell_uninstaller(
        app,
        anchor_key=anchor_key,
        run_key=run_key,
        shortcut_paths=shortcut_paths,
    )
    cmd_text = generate_uninstall_cmd(app, created_root=created_root)

    ps1_path = os.path.join(root, UNINSTALL_PS1_FILENAME)
    cmd_path = os.path.join(root, UNINSTALL_CMD_FILENAME)
    manifest_path = os.path.join(root, MANIFEST_FILENAME)
    assert_no_blocking_temps(root)
    previous = None
    if os.path.lexists(manifest_path):
        if is_reparse_point(manifest_path) or not os.path.isfile(manifest_path):
            raise InstallSafetyError("لن يتم استبدال بيان ليس ملفًا عاديًا.")
        previous = load_manifest(root)
        verify_install_anchor(root, previous, anchor_key)
        assert_existing_writes_are_owned(root, list(ARTIFACT_RELPATHS), previous)
    else:
        for name in ARTIFACT_RELPATHS:
            if os.path.lexists(os.path.join(root, name)):
                raise InstallSafetyError(
                    "ملف إزالة موجود بلا بيان موثوق. لن يتم استبداله: %s" % name
                )
    if previous is not None:
        # The original install recorded whether it created the folder. An upgrade
        # must not turn a shared folder into a removable root, or forget that it
        # created one.
        created_root = previous.get("created_root") is True
        cmd_text = generate_uninstall_cmd(app, created_root=created_root)
    shortcut_inputs = merge_previous_shortcuts(previous, shortcut_paths)
    owned_hashes = owned_hash_map(previous)
    backups = capture_write_snapshot(root, list(ARTIFACT_RELPATHS) + [MANIFEST_FILENAME])
    try:
        write_bytes_owned(
            ps1_path,
            ps1_text.encode("utf-8-sig"),
            expected_sha=owned_hashes.get(os.path.normcase(UNINSTALL_PS1_FILENAME)),
        )
        write_bytes_owned(
            cmd_path,
            cmd_text.encode("ascii"),
            expected_sha=owned_hashes.get(os.path.normcase(UNINSTALL_CMD_FILENAME)),
        )
        all_files = list(owned_files)
        for rel in (UNINSTALL_PS1_FILENAME, UNINSTALL_CMD_FILENAME):
            all_files.append({"path": rel, "role": "artifact"})
        # Hash shortcut files here, after they exist and before the manifest and anchor.
        write_manifest(
            root,
            all_files,
            owned_dirs,
            app_name=app,
            app_version=app_version,
            created_root=created_root,
            shortcuts=shortcut_inputs,
        )
        write_install_anchor(root, anchor_key, load_manifest(root))
    except Exception:
        restore_write_snapshot(backups)
        raise
    return cmd_path


_POWERSHELL_TEMPLATE = r"""# NegmLoading safe uninstaller. Do not recursively delete the install root.
# Exit 0: owned payload removed and no unrelated files remain.
# Exit 2: verification failed. Nothing was deleted. Recovery files kept.
# Exit 3: removal incomplete. Manifest and uninstall scripts kept. Shortcuts and registry anchor kept.
$ErrorActionPreference = 'Continue'
$Root = $PSScriptRoot
$ManifestName = 'negmloading-install-manifest.json'
$HelperName = 'negmloading-uninstall.ps1'
$CmdName = 'uninstall.cmd'
$ManifestPath = Join-Path $Root $ManifestName
$AppName = '__APP_NAME__'
$AnchorKey = '__ANCHOR_KEY__'
$RunKey = '__RUN_KEY__'
$ShortcutPaths = @(__SHORTCUTS__)
$Recovery = @($ManifestName, $HelperName, $CmdName)

function Test-SafeRelativePath([string]$Rel) {
    if ([string]::IsNullOrWhiteSpace($Rel)) { return $false }
    if ($Rel.Contains([char]0)) { return $false }
    $norm = $Rel.Replace('/', '\')
    if ($norm.StartsWith('\') -or $norm.Contains(':')) { return $false }
    $parts = $norm.Split('\')
    foreach ($p in $parts) {
        if ($p -eq '' -or $p -eq '.' -or $p -eq '..') { return $false }
        if ($p.EndsWith('.') -or $p.EndsWith(' ')) { return $false }
        if ($p -match '[<>:"|?*]') { return $false }
        $up = $p.ToUpperInvariant()
        $stem = ($up -split '\.', 2)[0]
        $reserved = @('CON','PRN','AUX','NUL')
        0..9 | ForEach-Object { $reserved += "COM$_"; $reserved += "LPT$_" }
        if ($reserved -contains $up -or $reserved -contains $stem) { return $false }
    }
    return $true
}

function Test-Reparse([string]$Path) {
    if (-not (Test-Path -LiteralPath $Path)) { return $false }
    $item = Get-Item -LiteralPath $Path -Force
    return [bool]($item.Attributes -band [IO.FileAttributes]::ReparsePoint)
}

function Test-WithinRoot([string]$Candidate) {
    if ([string]::IsNullOrWhiteSpace($Candidate)) { return $false }
    try {
        $rootFull = [IO.Path]::GetFullPath($Root).TrimEnd('\').ToLowerInvariant()
        $candFull = [IO.Path]::GetFullPath($Candidate).TrimEnd('\').ToLowerInvariant()
    } catch { return $false }
    return ($candFull -eq $rootFull) -or $candFull.StartsWith($rootFull + '\')
}

function Resolve-Owned([string]$Rel) {
    if (-not (Test-SafeRelativePath $Rel)) { throw 'unsafe relative path' }
    if (Test-Reparse $Root) { throw 'root reparse' }
    $cur = $Root
    foreach ($p in $Rel.Replace('/','\').Split('\')) {
        $cur = Join-Path $cur $p
        if ((Test-Path -LiteralPath $cur) -and (Test-Reparse $cur)) { throw 'reparse' }
    }
    $full = [IO.Path]::GetFullPath($cur)
    if (-not (Test-WithinRoot $full)) { throw 'escape' }
    $rootCmp = [IO.Path]::GetFullPath($Root).TrimEnd('\').ToLowerInvariant()
    $fullCmp = [IO.Path]::GetFullPath($full).TrimEnd('\').ToLowerInvariant()
    if ($fullCmp -eq $rootCmp) { throw 'root' }
    return $full
}

function Get-ShortcutIdentity($item) {
    if ($null -eq $item) { return $null }
    $path = ''
    $sha = ''
    $target = ''
    if ($item -is [string]) {
        $path = [string]$item
    } else {
        $path = [string]$item.path
        $shaProp = $item.PSObject.Properties['sha256']
        $targetProp = $item.PSObject.Properties['target']
        if ($shaProp -and -not [string]::IsNullOrWhiteSpace([string]$shaProp.Value)) {
            $sha = ([string]$shaProp.Value).ToLowerInvariant()
        }
        if ($targetProp -and -not [string]::IsNullOrWhiteSpace([string]$targetProp.Value)) {
            $target = [string]$targetProp.Value
        }
        if ([string]::IsNullOrWhiteSpace($sha) -or [string]::IsNullOrWhiteSpace($target)) {
            $sha = ''
            $target = ''
        }
    }
    if ([string]::IsNullOrWhiteSpace($path)) { return $null }
    return @{ path = $path; sha256 = $sha; target = $target }
}

function Get-ManifestFingerprint($manifest) {
    $lines = New-Object System.Collections.Generic.List[string]
    [void]$lines.Add('v1')
    [void]$lines.Add('app=' + [string]$manifest.app_name)
    if ($manifest.created_root -eq $true) { [void]$lines.Add('created_root=1') } else { [void]$lines.Add('created_root=0') }
    $files = @()
    if ($null -ne $manifest.files) { $files = @($manifest.files) }
    if ($files.Count -gt 1) {
        for ($i = 0; $i -lt $files.Count; $i++) {
            for ($j = $i + 1; $j -lt $files.Count; $j++) {
                if ([StringComparer]::Ordinal.Compare([string]$files[$j].path, [string]$files[$i].path) -lt 0) {
                    $swap = $files[$i]; $files[$i] = $files[$j]; $files[$j] = $swap
                }
            }
        }
    }
    foreach ($f in $files) {
        $size = [string]([int64]$f.size)
        [void]$lines.Add('F' + "`t" + [string]$f.path + "`t" + ([string]$f.sha256).ToLowerInvariant() + "`t" + $size)
    }
    $dirs = @()
    if ($null -ne $manifest.directories) { $dirs = @($manifest.directories) }
    if ($dirs.Count -gt 1) {
        for ($i = 0; $i -lt $dirs.Count; $i++) {
            for ($j = $i + 1; $j -lt $dirs.Count; $j++) {
                if ([StringComparer]::Ordinal.Compare([string]$dirs[$j].path, [string]$dirs[$i].path) -lt 0) {
                    $swap = $dirs[$i]; $dirs[$i] = $dirs[$j]; $dirs[$j] = $swap
                }
            }
        }
    }
    foreach ($d in $dirs) {
        [void]$lines.Add('D' + "`t" + [string]$d.path)
    }
    $shortcuts = @()
    if ($null -ne $manifest.shortcuts) { $shortcuts = @($manifest.shortcuts) }
    $shortcutRecords = New-Object System.Collections.Generic.List[object]
    foreach ($shortcut in $shortcuts) {
        $identity = Get-ShortcutIdentity $shortcut
        if ($null -ne $identity) { [void]$shortcutRecords.Add($identity) }
    }
    if ($shortcutRecords.Count -gt 1) {
        for ($i = 0; $i -lt $shortcutRecords.Count; $i++) {
            for ($j = $i + 1; $j -lt $shortcutRecords.Count; $j++) {
                if ([StringComparer]::Ordinal.Compare([string]$shortcutRecords[$j].path, [string]$shortcutRecords[$i].path) -lt 0) {
                    $swap = $shortcutRecords[$i]; $shortcutRecords[$i] = $shortcutRecords[$j]; $shortcutRecords[$j] = $swap
                }
            }
        }
    }
    foreach ($identity in $shortcutRecords) {
        if ($identity.sha256) {
            [void]$lines.Add('S' + "`t" + [string]$identity.path + "`t" + [string]$identity.sha256 + "`t" + [string]$identity.target)
        } else {
            [void]$lines.Add('S' + "`t" + [string]$identity.path)
        }
    }
    $text = [string]::Join("`n", $lines.ToArray())
    $sha = [Security.Cryptography.SHA256]::Create().ComputeHash([Text.Encoding]::UTF8.GetBytes($text))
    return ([BitConverter]::ToString($sha)).Replace('-', '').ToLowerInvariant()
}

function Test-Anchor($manifest) {
    try { $actual = Get-ManifestFingerprint $manifest } catch { return $false }
    if ([string]::IsNullOrWhiteSpace($actual)) { return $false }
    $base = [Microsoft.Win32.Registry]::CurrentUser.OpenSubKey($AnchorKey)
    if (-not $base) { return $false }
    try { $raw = [string]$base.GetValue('InstallAnchor') } finally { $base.Close() }
    if ([string]::IsNullOrWhiteSpace($raw)) { return $false }
    try { $anchor = $raw | ConvertFrom-Json } catch { return $false }
    if ([StringComparer]::Ordinal.Compare([string]$anchor.app_name, [string]$manifest.app_name) -ne 0) { return $false }
    try {
        $loc = [IO.Path]::GetFullPath([string]$anchor.install_location).TrimEnd('\').ToLowerInvariant()
        $rootCmp = [IO.Path]::GetFullPath($Root).TrimEnd('\').ToLowerInvariant()
    } catch { return $false }
    if ($loc -ne $rootCmp) { return $false }
    $expect = ([string]$anchor.manifest_sha256).ToLowerInvariant()
    return [StringComparer]::Ordinal.Compare($expect, $actual) -eq 0
}

if (-not (Test-Path -LiteralPath $ManifestPath -PathType Leaf) -or (Test-Reparse $ManifestPath)) {
    Write-Host 'MANUAL CLEANUP REQUIRED: missing or untrusted install manifest. Exit code 2.'
    exit 2
}
try {
    $manifest = Get-Content -LiteralPath $ManifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
} catch {
    Write-Host 'MANUAL CLEANUP REQUIRED: install manifest is not valid JSON. Exit code 2.'
    exit 2
}
if ($manifest.version -ne 1 -or [StringComparer]::Ordinal.Compare([string]$manifest.app_name, $AppName) -ne 0) {
    Write-Host 'MANUAL CLEANUP REQUIRED: install manifest is unrecognized. Exit code 2.'
    exit 2
}
if (-not (Test-Anchor $manifest)) {
    Write-Host 'MANUAL CLEANUP REQUIRED: install manifest is not bound to the install-time anchor. Exit code 2.'
    exit 2
}

try {
    $AppExeName = $AppName + '.exe'
    Get-CimInstance Win32_Process | ForEach-Object {
        $exe = [string]$_.ExecutablePath
        if ([string]::IsNullOrWhiteSpace($exe)) { return }
        $leaf = [IO.Path]::GetFileName($exe)
        if ([StringComparer]::OrdinalIgnoreCase.Compare($leaf, $AppExeName) -ne 0) { return }
        if (-not (Test-WithinRoot $exe)) { return }
        if (Test-Reparse $exe) { return }
        $parent = [IO.Path]::GetDirectoryName($exe)
        if ([string]::IsNullOrWhiteSpace($parent)) { return }
        $rootCmp = [IO.Path]::GetFullPath($Root).TrimEnd('\')
        if ([StringComparer]::OrdinalIgnoreCase.Compare($parent.TrimEnd('\'), $rootCmp) -ne 0) { return }
        $expected = $null
        foreach ($candidate in @($manifest.files)) {
            if ([StringComparer]::OrdinalIgnoreCase.Compare([string]$candidate.path, $AppExeName) -eq 0) {
                $expected = ([string]$candidate.sha256).ToLowerInvariant()
                break
            }
        }
        if ([string]::IsNullOrWhiteSpace($expected)) { return }
        try { $imageHash = (Get-FileHash -LiteralPath $exe -Algorithm SHA256).Hash.ToLowerInvariant() }
        catch { return }
        if ($imageHash -ne $expected) { return }
        Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
    }
} catch {}

$preserved = $false
$fileEntries = @()
if ($null -ne $manifest.files) { $fileEntries = @($manifest.files) }
foreach ($entry in $fileEntries) {
    $rel = [string]$entry.path
    if ($Recovery -contains $rel) { continue }
    $expect = ([string]$entry.sha256).ToLowerInvariant()
    try { $full = Resolve-Owned $rel } catch { $preserved = $true; continue }
    if (-not (Test-Path -LiteralPath $full)) { continue }
    if ((Test-Reparse $full) -or -not (Test-Path -LiteralPath $full -PathType Leaf)) { $preserved = $true; continue }
    try { $hash = (Get-FileHash -LiteralPath $full -Algorithm SHA256).Hash.ToLowerInvariant() }
    catch { $preserved = $true; continue }
    if ($hash -ne $expect) { $preserved = $true; continue }
    try { [IO.File]::Delete($full) } catch { $preserved = $true }
}
if ($preserved) {
    Write-Host 'MANUAL CLEANUP REQUIRED: owned files were preserved. Manifest and uninstall scripts were kept. Exit code 3.'
    exit 3
}

$dirEntries = @()
if ($null -ne $manifest.directories) { $dirEntries = @($manifest.directories) }
$dirs = @($dirEntries | Sort-Object { ([string]$_.path).Split('\').Count } -Descending)
foreach ($entry in $dirs) {
    if ($null -eq $entry) { continue }
    $rel = [string]$entry.path
    if ([string]::IsNullOrWhiteSpace($rel)) { continue }
    try { $full = Resolve-Owned $rel } catch { $preserved = $true; continue }
    if (-not (Test-Path -LiteralPath $full)) { continue }
    if ((Test-Reparse $full) -or -not (Test-Path -LiteralPath $full -PathType Container)) { $preserved = $true; continue }
    try {
        $children = @(Get-ChildItem -LiteralPath $full -Force)
        if ($children.Count -eq 0) { [IO.Directory]::Delete($full) } else { $preserved = $true }
    } catch { $preserved = $true }
}
$left = @()
if (Test-Path -LiteralPath $Root -PathType Container) {
    $left = @(Get-ChildItem -LiteralPath $Root -Force | Where-Object { $Recovery -notcontains $_.Name })
}
if ($preserved -or $left.Count -gt 0) {
    Write-Host 'MANUAL CLEANUP REQUIRED: unrelated or modified files were preserved. Manifest and uninstall scripts were kept. Exit code 3.'
    exit 3
}

$shell = $null
$finalFailed = $false
$keptModified = $false
$recordedShortcuts = @()
if ($null -ne $manifest.shortcuts) { $recordedShortcuts = @($manifest.shortcuts) }
foreach ($item in $recordedShortcuts) {
    $identity = Get-ShortcutIdentity $item
    if ($null -eq $identity) { continue }
    $lnkPath = [string]$identity.path
    if (-not (Test-Path -LiteralPath $lnkPath)) { continue }
    if ((Test-Reparse $lnkPath) -or -not (Test-Path -LiteralPath $lnkPath -PathType Leaf)) {
        $finalFailed = $true
        continue
    }
    if ([string]::IsNullOrWhiteSpace([string]$identity.sha256)) {
        Write-Host ('MANUAL CLEANUP REQUIRED: recorded shortcut has no install-time fingerprint and was kept: ' + $lnkPath)
        continue
    }
    $hash = ''
    try { $hash = (Get-FileHash -LiteralPath $lnkPath -Algorithm SHA256).Hash.ToLowerInvariant() }
    catch { $finalFailed = $true; continue }
    $target = ''
    try {
        if (-not $shell) { $shell = New-Object -ComObject WScript.Shell }
        $lnk = $shell.CreateShortcut($lnkPath)
        $target = ([string]$lnk.TargetPath).Trim()
    } catch { $target = '' }
    if ($hash -ne ([string]$identity.sha256)) {
        $keptModified = $true
        if ($target -and -not (Test-WithinRoot $target)) {
            Write-Host ('MANUAL CLEANUP REQUIRED: recorded shortcut no longer points at this installation and was kept: ' + $lnkPath)
        } else {
            Write-Host ('MANUAL CLEANUP REQUIRED: recorded shortcut was modified after install and was kept: ' + $lnkPath)
        }
        continue
    }
    if ((-not $target) -or ([StringComparer]::OrdinalIgnoreCase.Compare($target, [string]$identity.target) -ne 0)) {
        $finalFailed = $true
        continue
    }
    if (Test-WithinRoot $target) {
        try { [IO.File]::Delete($lnkPath) } catch { $finalFailed = $true; continue }
        if (Test-Path -LiteralPath $lnkPath) { $finalFailed = $true }
    } else {
        Write-Host ('MANUAL CLEANUP REQUIRED: recorded shortcut no longer points at this installation and was kept: ' + $lnkPath)
    }
}
if ($finalFailed) {
    Write-Host 'MANUAL CLEANUP REQUIRED: payload was removed but final cleanup failed for an owned shortcut. Manifest, anchor, and uninstall scripts were kept. Retry is possible. Exit code 4.'
    exit 4
}
if ($keptModified) {
    Write-Host 'MANUAL CLEANUP REQUIRED: a recorded shortcut was modified after install and was kept. Full cleanup was not completed. Delete or restore that shortcut manually if you want it removed. Manifest, anchor, and uninstall scripts were kept. Exit code 4.'
    exit 4
}

try {
    $run = [Microsoft.Win32.Registry]::CurrentUser.OpenSubKey($RunKey, $true)
    if ($run) {
        $val = [string]$run.GetValue($AppName)
        $targetsUs = $false
        $exePath = ''
        if (-not [string]::IsNullOrWhiteSpace($val)) {
            $exePath = $val.Trim()
            if ($exePath.StartsWith('"')) {
                $end = $exePath.IndexOf('"', 1)
                if ($end -gt 1) { $exePath = $exePath.Substring(1, $end - 1) }
            } else {
                $exePath = ($exePath -split ' ', 2)[0]
            }
            $targetsUs = $false
            if ($exePath -and (Test-WithinRoot $exePath)) {
                $leaf = [IO.Path]::GetFileName($exePath)
                $parent = [IO.Path]::GetDirectoryName($exePath)
                $rootCmp = [IO.Path]::GetFullPath($Root).TrimEnd('\')
                if ($parent -and
                    ([StringComparer]::OrdinalIgnoreCase.Compare($leaf, ($AppName + '.exe')) -eq 0) -and
                    ([StringComparer]::OrdinalIgnoreCase.Compare($parent.TrimEnd('\'), $rootCmp) -eq 0)) {
                    $targetsUs = $true
                }
            }
            if ($targetsUs) { $run.DeleteValue($AppName, $false) }
        }
        $run.Close()
        if ($targetsUs) {
            $checkRun = [Microsoft.Win32.Registry]::CurrentUser.OpenSubKey($RunKey, $false)
            if ($checkRun) {
                $still = [string]$checkRun.GetValue($AppName)
                $checkRun.Close()
                if (-not [string]::IsNullOrWhiteSpace($still)) { $finalFailed = $true }
            }
        }
    }
} catch {
    $finalFailed = $true
}
if ($finalFailed) {
    Write-Host 'MANUAL CLEANUP REQUIRED: payload was removed but final cleanup failed for the startup value. Manifest, anchor, and uninstall scripts were kept. Retry is possible. Exit code 4.'
    exit 4
}

if ((Test-Path -LiteralPath $ManifestPath -PathType Leaf) -and -not (Test-Reparse $ManifestPath)) {
    $manifestItem = Get-Item -LiteralPath $ManifestPath -Force
    if ($manifestItem.Attributes -band [IO.FileAttributes]::ReadOnly) {
        Write-Host 'MANUAL CLEANUP REQUIRED: payload was removed but the manifest is not deletable. Anchor and uninstall scripts were kept. Retry is possible. Exit code 4.'
        exit 4
    }
}
$retiring = $ManifestPath + '.retiring-' + [guid]::NewGuid().ToString('N')
$movedManifest = $false
if (Test-Path -LiteralPath $ManifestPath -PathType Leaf) {
    try {
        [IO.File]::Move($ManifestPath, $retiring)
        $movedManifest = $true
    } catch {
        Write-Host 'MANUAL CLEANUP REQUIRED: payload was removed but the manifest could not be moved aside. Anchor and uninstall scripts were kept. Retry is possible. Exit code 4.'
        exit 4
    }
}

$anchorMatched = $false
try {
    $check = [Microsoft.Win32.Registry]::CurrentUser.OpenSubKey($AnchorKey)
    if ($check) {
        $locVal = [string]$check.GetValue('InstallLocation')
        $check.Close()
        if ($locVal) {
            $anchorMatched = ([IO.Path]::GetFullPath($locVal).TrimEnd('\').ToLowerInvariant() -eq [IO.Path]::GetFullPath($Root).TrimEnd('\').ToLowerInvariant())
        }
    }
    if ($anchorMatched) { [Microsoft.Win32.Registry]::CurrentUser.DeleteSubKeyTree($AnchorKey, $false) }
} catch {
    if (-not $anchorMatched) {
        if ($movedManifest -and (Test-Path -LiteralPath $retiring)) {
            try { [IO.File]::Move($retiring, $ManifestPath) } catch {}
        }
        Write-Host 'MANUAL CLEANUP REQUIRED: payload was removed but the anchor could not be read. Manifest and uninstall scripts were kept. Retry is possible. Exit code 4.'
        exit 4
    }
}
if ($anchorMatched) {
    $stillAnchor = [Microsoft.Win32.Registry]::CurrentUser.OpenSubKey($AnchorKey)
    if ($stillAnchor) {
        $stillAnchor.Close()
        if ($movedManifest -and (Test-Path -LiteralPath $retiring)) {
            try { [IO.File]::Move($retiring, $ManifestPath) } catch {}
        }
        if (Test-Path -LiteralPath $ManifestPath -PathType Leaf) {
            Write-Host 'MANUAL CLEANUP REQUIRED: payload was removed but the anchor remains. Manifest and uninstall scripts were kept. Retry is possible. Exit code 4.'
        } else {
            Write-Host 'MANUAL CLEANUP REQUIRED: payload was removed, the anchor remains, and the manifest could not be restored. Automatic retry cannot verify ownership. Exit code 4.'
        }
        exit 4
    }
}

if ($movedManifest -and (Test-Path -LiteralPath $retiring)) {
    try { [IO.File]::Delete($retiring) } catch {
        Write-Host 'MANUAL CLEANUP REQUIRED: the anchor was removed but the manifest file remains. Automatic retry cannot verify ownership. Delete the leftover manifest and scripts manually. Exit code 4.'
        exit 4
    }
}

if ($manifest.created_root -eq $true) {
    $extra = @(Get-ChildItem -LiteralPath $Root -Force | Where-Object {
        $_.Name -ne $HelperName -and $_.Name -ne $CmdName
    })
    if ($extra.Count -gt 0) {
        Write-Host 'MANUAL CLEANUP REQUIRED: payload was removed but the install folder still holds files. Exit code 4.'
        exit 4
    }
}
$helperPath = Join-Path $Root $HelperName
try { if (Test-Path -LiteralPath $helperPath) { [IO.File]::Delete($helperPath) } } catch {}
if (Test-Path -LiteralPath $helperPath) {
    Write-Host 'MANUAL CLEANUP REQUIRED: payload was removed but the uninstall helper remains. Exit code 4.'
    exit 4
}

Write-Host ($AppName + ' owned files were removed. Exit code 0.')
exit 0
"""

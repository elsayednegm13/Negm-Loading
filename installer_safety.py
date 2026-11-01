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
import shutil
import stat
import zipfile

MANIFEST_FILENAME = "negmloading-install-manifest.json"
UNINSTALL_CMD_FILENAME = "uninstall.cmd"
UNINSTALL_PS1_FILENAME = "negmloading-uninstall.ps1"
MANIFEST_VERSION = 1
DEFAULT_APP_NAME = "Negm Lodaing"

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


def assess_destination(dest, payload_relpaths):
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
    owned_by_path = {}
    for entry in manifest.get("files", []):
        owned_by_path[os.path.normcase(entry["path"])] = entry

    for rel in payload_relpaths:
        rel_n = validate_relative_path(rel)
        try:
            target = resolve_owned_path(root, rel_n)
        except PathSafetyError as exc:
            raise InstallSafetyError("payload path is not safe to write") from exc
        if not os.path.lexists(target):
            continue
        if os.path.isdir(target) and not os.path.isfile(target):
            raise InstallSafetyError("payload file would replace a directory")
        key = os.path.normcase(rel_n)
        previous = owned_by_path.get(key)
        if previous is None:
            raise InstallSafetyError(
                "ملف موجود مسبقاً وغير مسجّل في بيان التثبيت. لن يتم استبداله."
            )
        if is_reparse_point(target):
            raise InstallSafetyError("existing payload target is a reparse point")
        current_hash = sha256_file(target)
        if current_hash.lower() != previous.get("sha256", ""):
            raise InstallSafetyError(
                "ملف تابع للتثبيت تم تعديله. لن يتم استبداله حفاظاً على بيانات المستخدم."
            )
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


def safe_copy_file(src, dest_root, relpath, role="payload"):
    rel = validate_relative_path(relpath)
    dest_path = resolve_owned_path(dest_root, rel)
    parent = os.path.dirname(dest_path)
    if parent:
        os.makedirs(parent, exist_ok=True)
    if os.path.lexists(dest_path) and (is_reparse_point(dest_path) or not os.path.isfile(dest_path)):
        raise InstallSafetyError("refusing to overwrite a non-regular existing path")
    shutil.copy2(src, dest_path)
    return build_file_entry(dest_root, rel, role)


def safe_copy_tree(src_dir, dest_root, dest_prefix, role="payload"):
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
            files.append(safe_copy_file(os.path.join(current, filename), dest_root, rel, role))
    return files, directories


def safe_extract_zip(zip_path, dest_root, role="payload"):
    root = validate_install_root(dest_root)
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
            if os.path.lexists(dest_path) and (is_reparse_point(dest_path) or not os.path.isfile(dest_path)):
                raise InstallSafetyError("refusing to overwrite a non-regular existing path")
            with archive.open(info, "r") as src, open(dest_path, "wb") as out:
                shutil.copyfileobj(src, out)
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
    created_root = data.get("created_root") is True
    return {
        "version": MANIFEST_VERSION,
        "app_name": app_name,
        "app_version": data.get("app_version") if isinstance(data.get("app_version"), str) else "",
        "created_utc": data.get("created_utc") if isinstance(data.get("created_utc"), str) else "",
        "created_root": created_root,
        "files": safe_files,
        "directories": safe_dirs,
    }


def write_manifest(install_root, files, directories, app_name=DEFAULT_APP_NAME,
                   app_version="1.0.0", created_root=False):
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
    }
    dest = os.path.join(root, MANIFEST_FILENAME)
    tmp = dest + ".tmp"
    with open(tmp, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=2, sort_keys=True)
    os.replace(tmp, dest)
    return dest


def _dir_depth(relpath):
    return relpath.replace("/", "\\").count("\\")


def safe_uninstall(install_root, expected_app_name=DEFAULT_APP_NAME):
    """
    Remove only unmodified, inventory-owned files under install_root.

    Missing inventory, invalid paths, modified files, and reparse points are
    preserved. The install root is never recursively deleted. Idempotent.
    """
    result = {
        "deleted": [],
        "preserved": [],
        "missing": [],
        "manual_cleanup": False,
        "root_removed": False,
        "message": "",
    }
    try:
        root = validate_install_root(install_root)
    except InstallSafetyError as exc:
        result["manual_cleanup"] = True
        result["message"] = str(exc)
        return result
    if not os.path.isdir(root):
        result["message"] = "install root already absent"
        return result

    try:
        manifest = load_manifest(root, expected_app_name=expected_app_name)
    except InstallSafetyError as exc:
        result["manual_cleanup"] = True
        result["message"] = "MANUAL CLEANUP REQUIRED: %s" % exc
        return result

    for entry in manifest["files"]:
        rel = entry["path"]
        try:
            full = resolve_owned_path(root, rel)
        except PathSafetyError:
            result["preserved"].append(rel)
            continue
        if not os.path.lexists(full):
            result["missing"].append(rel)
            continue
        if os.path.isdir(full) or is_reparse_point(full) or not os.path.isfile(full):
            result["preserved"].append(rel)
            continue
        current_hash = sha256_file(full)
        if current_hash != entry["sha256"]:
            result["preserved"].append(rel)
            continue
        try:
            os.remove(full)
        except OSError:
            result["preserved"].append(rel)
            continue
        result["deleted"].append(rel)

    for entry in sorted(manifest["directories"], key=lambda item: _dir_depth(item["path"]), reverse=True):
        rel = entry["path"]
        try:
            full = resolve_owned_path(root, rel)
        except PathSafetyError:
            result["preserved"].append(rel)
            continue
        if not os.path.isdir(full) or is_reparse_point(full):
            continue
        try:
            if os.listdir(full):
                result["preserved"].append(rel)
                continue
            os.rmdir(full)
            result["deleted"].append(rel)
        except OSError:
            result["preserved"].append(rel)

    manifest_path = os.path.join(root, MANIFEST_FILENAME)
    if os.path.isfile(manifest_path) and not is_reparse_point(manifest_path):
        try:
            os.remove(manifest_path)
            result["deleted"].append(MANIFEST_FILENAME)
        except OSError:
            result["preserved"].append(MANIFEST_FILENAME)

    if manifest.get("created_root") is True:
        try:
            if os.path.isdir(root) and not is_reparse_point(root) and not os.listdir(root):
                os.rmdir(root)
                result["root_removed"] = True
        except OSError:
            result["manual_cleanup"] = True

    leftover_user_files = False
    if os.path.isdir(root):
        try:
            leftover_user_files = bool(os.listdir(root))
        except OSError:
            leftover_user_files = True
    if result["preserved"] or leftover_user_files:
        result["manual_cleanup"] = True
        result["message"] = "MANUAL CLEANUP REQUIRED: unrelated or modified files were preserved"
    elif not result["message"]:
        result["message"] = "owned files removed"
    return result


def _powershell_uninstaller(app_name):
    app = _require_safe_app_name(app_name)
    # Use replace() so the helper body can contain percent characters later.
    return _POWERSHELL_TEMPLATE.replace("__APP_NAME__", app)


def generate_uninstall_cmd(app_name=DEFAULT_APP_NAME):
    app = _require_safe_app_name(app_name)
    cmd = (
        "@echo off\r\n"
        "setlocal EnableExtensions\r\n"
        "title Removing {app}...\r\n"
        "taskkill /F /IM \"{app}.exe\" >nul 2>&1\r\n"
        "timeout /t 1 /nobreak >nul\r\n"
        "del /f /q \"%USERPROFILE%\\Desktop\\{app}.lnk\" >nul 2>&1\r\n"
        "del /f /q \"%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\{app}.lnk\" >nul 2>&1\r\n"
        "reg delete \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\{app}\" /f >nul 2>&1\r\n"
        "reg delete \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\" /v \"{app}\" /f >nul 2>&1\r\n"
        "if not exist \"%~dp0{ps1}\" (\r\n"
        "  echo MANUAL CLEANUP REQUIRED: missing uninstall helper or install inventory.\r\n"
        "  timeout /t 3\r\n"
        "  exit /b 2\r\n"
        ")\r\n"
        "\"%SystemRoot%\\System32\\WindowsPowerShell\\v1.0\\powershell.exe\" -NoProfile -ExecutionPolicy Bypass -File \"%~dp0{ps1}\"\r\n"
        "set \"EC=%ERRORLEVEL%\"\r\n"
        "echo {app} uninstall finished.\r\n"
        "timeout /t 3\r\n"
        "if exist \"%~dp0{ps1}\" del /f /q \"%~dp0{ps1}\" >nul 2>&1\r\n"
        "if exist \"%~f0\" del /f /q \"%~f0\" >nul 2>&1\r\n"
        "exit /b %EC%\r\n"
    ).format(app=app, ps1=UNINSTALL_PS1_FILENAME)
    if script_contains_forbidden_deletion(cmd):
        raise InstallSafetyError("generated uninstall.cmd failed self-check")
    return cmd


def write_uninstall_artifacts(install_root, owned_files, owned_dirs, app_name=DEFAULT_APP_NAME,
                              app_version="1.0.0", created_root=False):
    root = validate_install_root(install_root)
    app = _require_safe_app_name(app_name)
    ps1_text = _powershell_uninstaller(app)
    if script_contains_forbidden_deletion(ps1_text):
        raise InstallSafetyError("generated uninstall helper failed self-check")
    cmd_text = generate_uninstall_cmd(app)

    ps1_path = os.path.join(root, UNINSTALL_PS1_FILENAME)
    cmd_path = os.path.join(root, UNINSTALL_CMD_FILENAME)
    with open(ps1_path, "w", encoding="utf-8-sig", newline="\n") as handle:
        handle.write(ps1_text)
    with open(cmd_path, "w", encoding="ascii", newline="") as handle:
        handle.write(cmd_text)

    all_files = list(owned_files)
    for rel in (UNINSTALL_PS1_FILENAME, UNINSTALL_CMD_FILENAME):
        all_files.append({"path": rel, "role": "artifact"})
    write_manifest(
        root,
        all_files,
        owned_dirs,
        app_name=app,
        app_version=app_version,
        created_root=created_root,
    )
    return cmd_path


_POWERSHELL_TEMPLATE = r"""# NegmLoading safe uninstaller. Do not recursively delete the install root.
$ErrorActionPreference = 'Continue'
$Root = $PSScriptRoot
$ManifestName = 'negmloading-install-manifest.json'
$ManifestPath = Join-Path $Root $ManifestName
$AppName = '__APP_NAME__'
$Manual = $false

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
    $rootFull = [IO.Path]::GetFullPath($Root).TrimEnd('\').ToLowerInvariant()
    $candFull = [IO.Path]::GetFullPath($Candidate).TrimEnd('\').ToLowerInvariant()
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

if (-not (Test-Path -LiteralPath $ManifestPath -PathType Leaf) -or (Test-Reparse $ManifestPath)) {
    Write-Host 'MANUAL CLEANUP REQUIRED: missing or untrusted install manifest.'
    exit 2
}

try {
    $manifest = Get-Content -LiteralPath $ManifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
} catch {
    Write-Host 'MANUAL CLEANUP REQUIRED: install manifest is not valid JSON.'
    exit 2
}

if ($manifest.version -ne 1 -or $manifest.app_name -ne $AppName) {
    Write-Host 'MANUAL CLEANUP REQUIRED: install manifest is unrecognized.'
    exit 2
}

foreach ($entry in @($manifest.files)) {
    $rel = [string]$entry.path
    $expect = ([string]$entry.sha256).ToLowerInvariant()
    try {
        $full = Resolve-Owned $rel
    } catch {
        $Manual = $true
        continue
    }
    if (-not (Test-Path -LiteralPath $full -PathType Leaf)) { continue }
    if (Test-Reparse $full) { $Manual = $true; continue }
    $hash = (Get-FileHash -LiteralPath $full -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($hash -ne $expect) { $Manual = $true; continue }
    try {
        [IO.File]::Delete($full)
    } catch {
        $Manual = $true
    }
}

$dirs = @($manifest.directories) | Sort-Object { ([string]$_.path).Split('\').Count } -Descending
foreach ($entry in $dirs) {
    $rel = [string]$entry.path
    try {
        $full = Resolve-Owned $rel
    } catch {
        continue
    }
    if (-not (Test-Path -LiteralPath $full -PathType Container)) { continue }
    if (Test-Reparse $full) { $Manual = $true; continue }
    try {
        $children = @(Get-ChildItem -LiteralPath $full -Force)
        if ($children.Count -eq 0) {
            [IO.Directory]::Delete($full)
        } else {
            $Manual = $true
        }
    } catch {
        $Manual = $true
    }
}

if ((Test-Path -LiteralPath $ManifestPath -PathType Leaf) -and -not (Test-Reparse $ManifestPath)) {
    try { [IO.File]::Delete($ManifestPath) } catch { $Manual = $true }
}

if ($manifest.created_root -eq $true -and (Test-Path -LiteralPath $Root -PathType Container) -and -not (Test-Reparse $Root)) {
    $left = @(Get-ChildItem -LiteralPath $Root -Force)
    if ($left.Count -eq 0) {
        try { [IO.Directory]::Delete($Root) } catch { $Manual = $true }
    }
}

if ($Manual -or ((Test-Path -LiteralPath $Root -PathType Container) -and (@(Get-ChildItem -LiteralPath $Root -Force).Count -gt 0))) {
    Write-Host 'MANUAL CLEANUP REQUIRED: unrelated or modified files were preserved.'
    exit 3
}
Write-Host ($AppName + ' owned files were removed.')
exit 0
"""

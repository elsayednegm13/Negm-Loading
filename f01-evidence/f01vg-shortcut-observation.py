# Observation only. Uses the installed test helpers and a private HKCU test key.
import hashlib
import os
import sys
import tempfile

sys.path.insert(0, r"C:\Users\NEGM\Documents\GitHub\Negm-Loading")
import installer_safety as safety
import test_installer_safety as t


def sha(path):
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        digest.update(handle.read())
    return digest.hexdigest()


def props(path):
    script = (
        "$s=New-Object -ComObject WScript.Shell; "
        "$l=$s.CreateShortcut($env:F01_LNK); "
        "Write-Output ('TARGET=' + $l.TargetPath); "
        "Write-Output ('DESC=' + $l.Description); "
        "Write-Output ('ARGS=' + $l.Arguments); "
        "Write-Output ('ICON=' + $l.IconLocation)"
    )
    env = os.environ.copy()
    env["F01_LNK"] = path
    completed = __import__("subprocess").run(
        [t._powershell_exe(), "-NoProfile", "-Command", script],
        env=env, capture_output=True, text=True,
    )
    return completed.stdout.strip()


def customize(path):
    script = (
        "$s=New-Object -ComObject WScript.Shell; "
        "$l=$s.CreateShortcut($env:F01_LNK); "
        "$l.Description='user-custom-description'; "
        "$l.Arguments='--user-flag'; "
        "$l.IconLocation='C:\\Windows\\System32\\notepad.exe,0'; "
        "$l.Save()"
    )
    env = os.environ.copy()
    env["F01_LNK"] = path
    completed = __import__("subprocess").run(
        [t._powershell_exe(), "-NoProfile", "-Command", script],
        env=env, capture_output=True, text=True,
    )
    if completed.returncode != 0:
        raise SystemExit(completed.stderr)


with tempfile.TemporaryDirectory() as tmp:
    root = os.path.join(tmp, "Negm Lodaing Install")
    os.makedirs(root)
    user = os.path.join(tmp, "user-note.txt")
    t._write(user, "do-not-touch")
    user_before = sha(user)
    link = os.path.join(tmp, "links", "owned.lnk")
    key = t._install_owned(root, {"owned.exe": b"payload"}, shortcut_paths=[link])
    try:
        t._make_shortcut(link, os.path.join(root, "owned.exe"))
        customize(link)
        before_hash = sha(link)
        before_props = props(link)
        proc = t._run_uninstall_cmd(root)
        exists = os.path.isfile(link)
        print("UNINSTALL_EXIT", proc.returncode)
        print("STDOUT", (proc.stdout or "").strip())
        print("LINK_EXISTS_AFTER", exists)
        print("USER_HASH_BEFORE", user_before)
        print("USER_HASH_AFTER", sha(user))
        print("LINK_HASH_BEFORE", before_hash)
        print("PROPS_BEFORE")
        print(before_props)
        if exists:
            print("LINK_HASH_AFTER", sha(link))
            print("PROPS_AFTER")
            print(props(link))
        print("OWNED_EXE_EXISTS", os.path.isfile(os.path.join(root, "owned.exe")))
    finally:
        safety.delete_test_anchor_key(key)

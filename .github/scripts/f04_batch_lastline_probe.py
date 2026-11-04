# -*- coding: utf-8 -*-
"""Disposable-Windows-only experiment for a one-line final batch self-cleanup.

No product installer or uninstaller executes here. All scripts, markers and
paths are uniquely created beneath RUNNER_TEMP by this test. A failure is
reported as failure; the code does NOT alter a user installation.
"""
from __future__ import annotations
import hashlib
import json
import os
from pathlib import Path
import subprocess
import tempfile
import traceback

RESULT = Path("f04-batch-lastline-experiment.json")
SINGLE_LINE = r'''if "__OWNS_ROOT__"=="1" (del /q "%~f0" >nul 2>&1 & rd "%~dp0." >nul 2>&1 & if exist "%~dp0." (exit /b 4) else (exit /b 0)) else (del /q "%~f0" >nul 2>&1 & if exist "%~f0" (exit /b 4) else (exit /b 0))'''


def run() -> int:
    out = {"scope": "CI_SCRATCH_BATCH_SELF_DELETE_PROBE", "cases": [], "result": "FAIL"}
    try:
        if not (os.name == "nt" and os.getenv("GITHUB_ACTIONS") == "true"
                and os.getenv("RUNNER_OS") == "Windows"
                and os.getenv("RUNNER_ENVIRONMENT") == "github-hosted"):
            raise RuntimeError("Only GitHub-hosted ephemeral Windows CI is allowed")
        runner = Path(os.environ["RUNNER_TEMP"]).resolve(strict=True)
        with tempfile.TemporaryDirectory(prefix="F04ScratchOnly_", dir=runner) as tmp:
            base = Path(tmp)
            outer = base / "outside-guard.txt"
            outer.write_bytes(b"F04 scratch never delete")
            digest = hashlib.sha256(outer.read_bytes()).hexdigest()
            for leaf, owns_root, extra in [
                ("Negm Spaces Only", True, False),
                ("Negm ! Install", True, False),
                ("Negm & (Install)", True, False),
                ("Negm % Install", True, False),
                ("Negm Shared", False, False),
                ("Negm Extra Guard", True, True),
            ]:
                root = base / leaf
                root.mkdir()
                script = root / "self-check.cmd"
                guard = root / "unrelated.txt"
                if extra:
                    guard.write_bytes(b"F04 preserve")
                body = "@echo off\r\nsetlocal DisableDelayedExpansion\r\n" + (
                    SINGLE_LINE.replace("__OWNS_ROOT__", "1" if owns_root else "0")
                ) + "\r\n"
                script.write_bytes(body.encode("ascii"))
                proc = subprocess.run(
                    ["cmd.exe", "/d", "/c", str(script)],
                    cwd=str(base), capture_output=True, text=True, timeout=25,
                    check=False,
                )
                should_remove = owns_root and not extra
                case = {
                    "leaf": leaf, "owns_root": owns_root, "has_foreign_file": extra,
                    "exit": proc.returncode, "root_exists": root.exists(),
                    "script_exists": script.exists(),
                    "guard_preserved": (not extra or (guard.is_file() and guard.read_bytes() == b"F04 preserve")),
                    "std_tail": (proc.stdout + proc.stderr)[-450:],
                }
                case["pass"] = (
                    proc.returncode == (4 if extra else 0)
                    and root.exists() == (not should_remove)
                    and not script.exists()
                    and case["guard_preserved"]
                )
                out["cases"].append(case)
                if hashlib.sha256(outer.read_bytes()).hexdigest() != digest:
                    raise RuntimeError("Outside guard changed")
        out["result"] = "PASS" if all(x["pass"] for x in out["cases"]) else "FAIL"
        return 0 if out["result"] == "PASS" else 1
    except Exception as exc:
        out["error"] = repr(exc)
        out["trace"] = traceback.format_exc(limit=5)
        return 2
    finally:
        RESULT.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(json.dumps(out, ensure_ascii=False, indent=2), flush=True)


if __name__ == "__main__":
    raise SystemExit(run())

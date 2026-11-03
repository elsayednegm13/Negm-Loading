#!/usr/bin/env python3
"""F-01 CI-only Windows test watchdog; never mutates project product code.

Runs subprocesses on an ephemeral GitHub hosted runner and records their
actual process exit statuses. No registry or install operations here.
"""
from __future__ import annotations

import os
from pathlib import Path
import subprocess
import sys
import time

MODE = sys.argv[1] if len(sys.argv) > 1 else ""
if MODE not in ("safety", "full"):
    raise SystemExit("Usage: python f01_ci_watchdog.py safety|full")

ROOT = Path.cwd()
LOG = ROOT / ("f01-safety-ci.log" if MODE == "safety" else "f01-full-ci.log")
META = ROOT / ("f01-safety-ci.meta.txt" if MODE == "safety" else "f01-full-ci.meta.txt")
TIMEOUT = 220 if MODE == "safety" else 260
if MODE == "safety":
    command = [sys.executable, "-u", "-m", "unittest", "-v", "test_installer_safety"]
else:
    # Dumps thread stacks if the test runner prints SUCCESS but does not exit.
    diagnostics = (
        "import faulthandler,runpy; "
        "faulthandler.dump_traceback_later(155, repeat=False); "
        "runpy.run_path('run_all_tests.py',run_name='__main__')"
    )
    command = [sys.executable, "-u", "-X", "faulthandler", "-c", diagnostics]

start = time.monotonic()
timed_out = False
with LOG.open("wb") as output:
    proc = subprocess.Popen(command, stdout=output, stderr=subprocess.STDOUT, cwd=str(ROOT))
    try:
        exit_code = proc.wait(timeout=TIMEOUT)
    except subprocess.TimeoutExpired:
        timed_out = True
        proc.kill()  # Only this exact spawned process on disposable runner.
        proc.wait(timeout=15)
        exit_code = 124
elapsed = round(time.monotonic() - start, 2)
META.write_text(
    f"MODE={MODE}\nEXIT={exit_code}\nTIMED_OUT={int(timed_out)}\n"
    f"ELAPSED_SEC={elapsed}\nSOURCE_SHA={os.environ.get('GITHUB_SHA','unknown')}\n",
    encoding="utf-8",
)
print(META.read_text(encoding="utf-8"), flush=True)
data = LOG.read_bytes().decode("utf-8", errors="replace")
print("--- CI LOG TAIL (last 180 lines) ---", flush=True)
print("\n".join(data.splitlines()[-180:]), flush=True)
print("--- END CI LOG TAIL ---", flush=True)
if timed_out:
    print(f"BLOCKED: {MODE} process did not exit within {TIMEOUT}s", flush=True)
raise SystemExit(0 if exit_code == 0 and not timed_out else 1)

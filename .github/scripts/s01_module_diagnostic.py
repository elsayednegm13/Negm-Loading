#!/usr/bin/env python3
"""S-01 Windows-only, ephemeral CI diagnosis. No product changes or test bypass."""
from __future__ import annotations

import faulthandler
import os
from pathlib import Path
import subprocess
import sys
import threading
import time
import traceback
import unittest

OUT = Path("s01-diagnostics")
TIMEOUT_SEC = 115
ALLOWED = {
    "test_regression", "test_media_grabber", "test_proxy_vault",
    "test_web_remote", "test_analytics", "test_queue_system",
}


def child(module: str) -> int:
    sys.stdout.reconfigure(line_buffering=True)
    sys.stderr.reconfigure(line_buffering=True)
    faulthandler.enable()
    faulthandler.dump_traceback_later(55, repeat=False)
    original_start = threading.Thread.start

    def observed_start(thread: threading.Thread):
        if not thread.daemon:
            print(f"S01_NONDAEMON_START name={thread.name!r} target={getattr(thread, '_target', None)!r}", flush=True)
            print("".join(traceback.format_stack(limit=7)), flush=True)
        return original_start(thread)

    threading.Thread.start = observed_start
    print(f"S01_MODULE={module} python={sys.version} pid={os.getpid()}", flush=True)
    suite = unittest.defaultTestLoader.loadTestsFromName(module)
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    print(f"S01_TEST_RESULT tests={result.testsRun} failures={len(result.failures)} "
          f"errors={len(result.errors)} skipped={len(result.skipped)}", flush=True)
    frames = sys._current_frames()
    for th in threading.enumerate():
        print(f"S01_THREAD name={th.name!r} ident={th.ident} daemon={th.daemon} "
              f"is_alive={th.is_alive()}", flush=True)
        frame = frames.get(th.ident)
        if frame is not None:
            print("".join(traceback.format_stack(frame, limit=10)), flush=True)
    print("S01_SUITE_RETURNED; now requesting natural Python process exit", flush=True)
    return 0 if result.wasSuccessful() else 1


def parent(module: str) -> int:
    OUT.mkdir(exist_ok=True)
    log_path = OUT / (module + ".log")
    meta_path = OUT / (module + ".meta.txt")
    started = time.monotonic()
    command = [sys.executable, "-u", "-X", "faulthandler", __file__, "child", module]
    timed_out = False
    with log_path.open("wb") as log:
        p = subprocess.Popen(command, stdout=log, stderr=subprocess.STDOUT,
                             cwd=str(Path.cwd()))
        try:
            code = p.wait(timeout=TIMEOUT_SEC)
        except subprocess.TimeoutExpired:
            timed_out = True
            p.kill()  # Kill ONLY this test runner child on disposable GitHub worker.
            p.wait(timeout=15)
            code = 124
    elapsed = round(time.monotonic() - started, 2)
    data = log_path.read_bytes().decode("utf-8", errors="replace")
    meta_path.write_text(
        f"MODULE={module}\nSOURCE_SHA={os.environ.get('GITHUB_SHA', 'unknown')}\n"
        f"EXIT={code}\nTIMED_OUT={int(timed_out)}\nELAPSED_SEC={elapsed}\n"
        f"SUITE_RETURNED={int('S01_SUITE_RETURNED' in data)}\n",
        encoding="utf-8")
    print(meta_path.read_text(encoding="utf-8"))
    print("----- S01 DIAGNOSTIC LOG TAIL -----")
    print("\n".join(data.splitlines()[-150:]))
    print("----- END DIAGNOSTIC LOG TAIL -----")
    return 0 if code == 0 and not timed_out else 1


def main() -> int:
    if len(sys.argv) == 2:
        module = sys.argv[1]
        mode = "parent"
    elif len(sys.argv) == 3 and sys.argv[1] == "child":
        module = sys.argv[2]
        mode = "child"
    else:
        print("Usage: python s01_module_diagnostic.py [child] MODULE", file=sys.stderr)
        return 2
    if module not in ALLOWED:
        print("Unrecognized module", file=sys.stderr)
        return 2
    return child(module) if mode == "child" else parent(module)


if __name__ == "__main__":
    sys.exit(main())

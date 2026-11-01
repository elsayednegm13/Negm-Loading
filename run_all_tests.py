# -*- coding: utf-8 -*-
"""
run_all_tests.py - Master Test Suite Runner for NegmLoading
Executes all regression, queue, grabber, analytics, recovery, and proxy/vault tests.
"""
import sys
import unittest
import time

test_modules = [
    "test_regression",
    "test_queue_system",
    "test_site_grabber",
    "test_media_grabber",
    "test_analytics",
    "test_link_recovery",
    "test_proxy_vault",
    "test_web_remote",
    "test_stress_profiling",
]

def main():
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    for modname in test_modules:
        try:
            mod = __import__(modname)
            tests = loader.loadTestsFromModule(mod)
            suite.addTests(tests)
        except Exception as e:
            print(f"[ERROR] Failed to load {modname}: {e}")
            sys.exit(1)

    print("=" * 70)
    print(f"Running NegmLoading Comprehensive Test Suite ({suite.countTestCases()} tests)...")
    print("=" * 70)
    
    start_t = time.time()
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    elapsed = time.time() - start_t
    
    print("\n" + "=" * 70)
    print(f"Executed {result.testsRun} tests in {elapsed:.2f} seconds.")
    if result.wasSuccessful():
        print("[SUCCESS] ALL TESTS PASSED WITH 100% SUCCESS RATE!")
        print("=" * 70)
        sys.exit(0)
    else:
        print(f"[FAIL] {len(result.failures)} failures, {len(result.errors)} errors.")
        print("=" * 70)
        sys.exit(1)

if __name__ == "__main__":
    main()

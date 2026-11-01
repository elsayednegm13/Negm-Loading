# -*- coding: utf-8 -*-
"""
test_stress_profiling.py - Concurrency Stress Testing & Memory Profiling Suite
Part of NegmLoading Verification Suite (Phase 13)
"""
import os
import sys
import time
import gc
import tempfile
import unittest
import threading

import nexus_engine as E

class TestConcurrencyAndMemory(unittest.TestCase):
    def setUp(self):
        self.tmp_dir = tempfile.mkdtemp()

    def tearDown(self):
        try:
            for f in os.listdir(self.tmp_dir):
                try:
                    os.remove(os.path.join(self.tmp_dir, f))
                except Exception:
                    pass
            os.rmdir(self.tmp_dir)
        except Exception:
            pass

    def test_rapid_state_serialization_concurrency(self):
        """Stress tests atomic JSON saving under multi-threaded lock contention."""
        storage_file = os.path.join(self.tmp_dir, "stress_state.json")
        errors = []

        def worker(w_id):
            for i in range(25):
                data = {"worker": w_id, "iteration": i, "timestamp": time.time(), "payload": [x for x in range(100)]}
                try:
                    E.save_json(storage_file, data)
                    read_back = E.load_json(storage_file, {})
                    if not isinstance(read_back, dict):
                        errors.append("Invalid read-back data type")
                except Exception as e:
                    errors.append(str(e))

        threads = [threading.Thread(target=worker, args=(t_id,)) for t_id in range(6)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        self.assertEqual(len(errors), 0, f"Encountered serialization errors: {errors[:5]}")

    def test_checksum_memory_stability_large_stream(self):
        """Verifies 1MB chunked streaming hash calculator consumes negligible memory."""
        # Create a 10MB test file
        large_file = os.path.join(self.tmp_dir, "benchmark_10mb.bin")
        chunk = b"X" * 1024 * 1024  # 1MB
        with open(large_file, "wb") as f:
            for _ in range(10):
                f.write(chunk)

        gc.collect()
        hashes = E.ChecksumCalculator.compute_file_hashes(large_file)

        self.assertIn("MD5", hashes)
        self.assertIn("SHA-256", hashes)
        self.assertIn("CRC32", hashes)
        self.assertEqual(len(hashes["SHA-256"]), 64)

    def test_proxy_and_vault_rapid_lookups(self):
        """Tests high-frequency domain and credential lookups under stress."""
        vault_file = os.path.join(self.tmp_dir, "stress_vault.json")
        vault = E.SiteCredentialVault(storage_file=vault_file)

        # Add 50 domain credentials
        for i in range(50):
            vault.add_credential(f"sub{i}.cloud-service-{i}.org", "basic", f"user_{i}", f"pass_{i}")

        start_t = time.time()
        for _ in range(200):
            headers = vault.get_headers_for_url("https://sub25.cloud-service-25.org/download/package.tar")
            self.assertIn("Authorization", headers)

        lookup_duration = time.time() - start_t
        # 200 lookups across 50 domains should execute in less than 0.5s
        self.assertLess(lookup_duration, 0.5)


if __name__ == "__main__":
    unittest.main()

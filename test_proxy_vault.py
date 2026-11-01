# -*- coding: utf-8 -*-
"""
test_proxy_vault.py - Automated Unit & Integration Tests for Proxy Manager & Site Credential Vault
Part of NegmLoading Verification Suite (Phase 11)
"""
import os
import sys
import time
import tempfile
import unittest
import base64

import nexus_engine as E
import ui_theme
import ui_dialogs
from nexus_stream_manager import NexusStreamManagerApp


class TestProxyManager(unittest.TestCase):
    def setUp(self):
        self.tmp_dir = tempfile.mkdtemp()
        self.storage = os.path.join(self.tmp_dir, "test_proxies.json")
        self.pm = E.ProxyManager(storage_file=self.storage)

    def tearDown(self):
        try:
            if os.path.exists(self.storage):
                os.remove(self.storage)
            os.rmdir(self.tmp_dir)
        except Exception:
            pass

    def test_proxy_crud_and_active_selection(self):
        # 1. Add Proxies
        p1 = self.pm.add_proxy("Office HTTP", "http", "10.0.0.1", 8080, username="user1", password="pass1")
        p2 = self.pm.add_proxy("US SOCKS5", "socks5", "127.0.0.1", 1080, is_active=True)

        self.assertEqual(len(self.pm.get_all_proxies()), 2)
        self.assertEqual(self.pm.get_active_proxy_url(), "socks5://127.0.0.1:1080")

        # 2. Switch Active Proxy
        self.pm.set_active_proxy(p1["id"])
        self.assertIn("http://user1:pass1@10.0.0.1:8080", self.pm.get_active_proxy_url())

        # 3. Disable Active Proxy
        self.pm.set_active_proxy(None)
        self.assertEqual(self.pm.get_active_proxy_url(), "")

        # 4. Update Proxy
        self.pm.update_proxy(p2["id"], port=1085, name="US SOCKS5 Updated")
        all_p = self.pm.get_all_proxies()
        p2_updated = next(x for x in all_p if x["id"] == p2["id"])
        self.assertEqual(p2_updated["port"], 1085)
        self.assertEqual(p2_updated["name"], "US SOCKS5 Updated")

        # 5. Delete Proxy
        self.pm.delete_proxy(p1["id"])
        self.assertEqual(len(self.pm.get_all_proxies()), 1)


class TestSiteCredentialVault(unittest.TestCase):
    def setUp(self):
        self.tmp_dir = tempfile.mkdtemp()
        self.storage = os.path.join(self.tmp_dir, "test_vault.json")
        self.vault = E.SiteCredentialVault(storage_file=self.storage)

    def tearDown(self):
        try:
            if os.path.exists(self.storage):
                os.remove(self.storage)
            os.rmdir(self.tmp_dir)
        except Exception:
            pass

    def test_credentials_matching_and_header_generation(self):
        # Add basic auth
        self.vault.add_credential("archive.org", "basic", username="archive_user", password="secret_pass")
        # Add cookie session
        self.vault.add_credential("rapidgator.net", "cookie", cookies="rg_session=xyz123; auth=vip")
        # Add bearer token
        self.vault.add_credential("github.com", "bearer", token="ghp_test_token_12345")

        # 1. Test Subdomain Matching on Basic Auth
        h_archive = self.vault.get_headers_for_url("https://ia800100.us.archive.org/download/test/book.pdf")
        self.assertIn("Authorization", h_archive)
        expected_token = base64.b64encode(b"archive_user:secret_pass").decode("ascii")
        self.assertEqual(h_archive["Authorization"], f"Basic {expected_token}")

        # 2. Test Cookie Injection
        h_rg = self.vault.get_headers_for_url("https://rapidgator.net/file/98765/movie.mp4")
        self.assertIn("Cookie", h_rg)
        self.assertEqual(h_rg["Cookie"], "rg_session=xyz123; auth=vip")

        # 3. Test Bearer Token Injection
        h_gh = self.vault.get_headers_for_url("https://api.github.com/user/repo/main/code.py")
        self.assertIn("Authorization", h_gh)
        self.assertEqual(h_gh["Authorization"], "Bearer ghp_test_token_12345")

        # 4. Test Unregistered Domain
        h_other = self.vault.get_headers_for_url("https://unregistered-domain.com/file.zip")
        self.assertEqual(h_other, {})

    def test_download_task_auto_injects_vault_credentials(self):
        # Register in global vault
        global_vault = E.get_default_credential_vault()
        cred = global_vault.add_credential("sample-vault-test.org", "basic", "demo_user", "demo_pass")

        try:
            task = E.DownloadTask(
                f"vault_task_{int(time.time()*1000)}",
                "https://cdn.sample-vault-test.org/assets/archive.tar.gz",
                os.path.join(self.tmp_dir, "archive.tar.gz")
            )
            headers = task._build_headers()
            self.assertIn("Authorization", headers)
            self.assertIn("Basic", headers["Authorization"])
        finally:
            global_vault.delete_credential(cred["id"])


class TestPhase11Dialogs(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        try:
            cls.app = NexusStreamManagerApp()
            cls.app.withdraw()
        except Exception:
            cls.app = None

    @classmethod
    def tearDownClass(cls):
        if cls.app is not None:
            try:
                cls.app.is_closing = True
                cls.app.destroy()
            except Exception:
                pass

    def setUp(self):
        if self.app is None:
            self.skipTest("Tkinter GUI not available in this environment")

    def test_proxy_manager_dialog_ui(self):
        dlg = ui_dialogs.ProxyManagerDialog(self.app)
        self.assertTrue(dlg.winfo_exists())
        self.assertTrue(hasattr(dlg, "tree"))
        self.assertTrue(hasattr(dlg, "lbl_active_status"))
        dlg.destroy()

    def test_site_credentials_dialog_ui(self):
        dlg = ui_dialogs.SiteCredentialsDialog(self.app)
        self.assertTrue(dlg.winfo_exists())
        self.assertTrue(hasattr(dlg, "tree"))
        dlg.destroy()


if __name__ == "__main__":
    unittest.main()

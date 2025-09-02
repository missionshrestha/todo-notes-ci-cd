from django.test import Client, TestCase
from rest_framework.test import APIClient


class HealthTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_public_health(self):
        resp = self.client.get("/api/health/")
        self.assertEqual(resp.status_code, 200, resp.content)
        self.assertEqual(resp.json().get("status"), "ok")

    def test_health_with_checks(self):
        resp = self.client.get("/api/health/?checks=1")
        self.assertEqual(resp.status_code, 200, resp.content)
        self.assertEqual(resp.json().get("status"), "ok")
        # presence of "db" key indicates deep checks ran
        self.assertIn("db", resp.json())


def test_health_ok():
    c = Client()
    resp = c.get("/api/health/")
    assert resp.status_code == 200
    assert b"ok" in resp.content.lower()

from django.test import TestCase
from rest_framework.test import APIClient
from .models import Note

class NoteModelTests(TestCase):

    def test_str(self):
        note = Note(title="Test Note", content="This is a test note.")
        self.assertIn("Test Note", str(note))
        self.assertIn(note.status, str(note))


class NoteAPITests(TestCase):

    def setUp(self):
        self.client = APIClient()

    def test_create_and_list(self):
        # create
        response = self.client.post("/api/notes/", {"title": "Test Note", "content": "This is a test note.", "status":"OPEN"}, format='json')
        self.assertEqual(response.status_code, 201, response.content)

        # list
        response = self.client.get("/api/notes/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("Test Note", [note["title"] for note in response.data])
        self.assertGreaterEqual(len(response.json()), 1)

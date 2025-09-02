from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from .models import Note

# class NoteModelTests(TestCase):

#     def test_str(self):
#         note = Note(title="Test Note", content="This is a test note.")
#         self.assertIn("Test Note", str(note))
#         self.assertIn(note.status, str(note))


# class NoteAPITests(TestCase):

#     def setUp(self):
#         self.client = APIClient()

#     def test_create_and_list(self):
#         # create
#         response = self.client.post("/api/notes/", {"title": "Test Note",  \
# "content": "This is a test note.", "status":"OPEN"}, format='json')
#         self.assertEqual(response.status_code, 201, response.content)

#         # list
#         response = self.client.get("/api/notes/")
#         self.assertEqual(response.status_code, 200)
#         self.assertIn("Test Note", [note["title"] for note in response.data])
#         self.assertGreaterEqual(len(response.json()), 1)


User = get_user_model()


class NoteAuthTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="u1", password="pass12345")
        self.client = APIClient()

    def _login_and_get_token(self):
        resp = self.client.post(
            "/api/auth/token/", {"username": "u1", "password": "pass12345"}, format="json"
        )
        self.assertEqual(resp.status_code, 200, resp.content)
        return resp.json()["access"]

    def test_requires_auth_and_scopes_to_owner(self):
        # No token → 401
        resp = self.client.get("/api/notes/")
        self.assertIn(resp.status_code, (401, 403))

        # With token → can create & list only own notes
        token = self._login_and_get_token()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        create = self.client.post("/api/notes/", {"title": "mine", "content": ""}, format="json")
        self.assertEqual(create.status_code, 201, create.content)

        # Another user creates a note
        u2 = User.objects.create_user(username="u2", password="pass12345")
        Note.objects.create(owner=u2, title="u2 note")

        # List should only show current user's notes
        resp = self.client.get("/api/notes/")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        titles = [n["title"] for n in data]
        self.assertIn("mine", titles)
        self.assertNotIn("u2 note", titles)

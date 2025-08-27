from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from notes.models import Note

User = get_user_model()


def auth_client_for(user: User) -> APIClient:
    """Return an APIClient with Bearer token for the given user."""
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
    return client


class NotesAPITests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.u1 = User.objects.create_user(username="u1", password="pass12345")
        cls.u2 = User.objects.create_user(username="u2", password="pass12345")
        # Seed a note for u2 so we can test scoping
        Note.objects.create(owner=cls.u2, title="u2 secret")

    def test_requires_auth(self):
        client = APIClient()
        resp = client.get("/api/notes/")
        self.assertIn(resp.status_code, (401, 403))

    def test_list_is_user_scoped(self):
        client = auth_client_for(self.u1)
        # u1 creates a note
        resp = client.post("/api/notes/", {"title": "mine", "content": ""}, format="json")
        self.assertEqual(resp.status_code, 201, resp.content)
        # list only shows user's notes
        resp = client.get("/api/notes/")
        self.assertEqual(resp.status_code, 200)
        titles = [n["title"] for n in resp.json()]
        self.assertIn("mine", titles)
        self.assertNotIn("u2 secret", titles)

    def test_crud_flow(self):
        client = auth_client_for(self.u1)
        # create
        create = client.post("/api/notes/", {"title": "CRUD A", "content": "x"}, format="json")
        self.assertEqual(create.status_code, 201, create.content)
        note_id = create.json()["id"]

        # retrieve
        show = client.get(f"/api/notes/{note_id}/")
        self.assertEqual(show.status_code, 200)
        self.assertEqual(show.json()["title"], "CRUD A")

        # patch
        patch = client.patch(f"/api/notes/{note_id}/", {"status": "DONE"}, format="json")
        self.assertEqual(patch.status_code, 200)
        self.assertEqual(patch.json()["status"], "DONE")

        # delete
        delete = client.delete(f"/api/notes/{note_id}/")
        self.assertIn(delete.status_code, (200, 204))
        # confirm gone
        not_found = client.get(f"/api/notes/{note_id}/")
        self.assertEqual(not_found.status_code, 404)

    def test_validation_title_required(self):
        client = auth_client_for(self.u1)
        resp = client.post("/api/notes/", {"content": "no title"}, format="json")
        self.assertEqual(resp.status_code, 400)
        self.assertIn("title", resp.json())

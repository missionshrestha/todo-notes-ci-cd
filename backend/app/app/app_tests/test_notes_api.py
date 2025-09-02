import json
from django.contrib.auth.models import User
from django.test import Client

def auth_client():
    # For now, use a superuser created in 3.3; later switch to JWT if you want.
    return Client()

def test_notes_list_requires_auth():
    c = Client()
    resp = c.get("/api/notes/")
    assert resp.status_code in (401, 403)  # depending on your view permission

def test_create_note_flow(db):
    # Sketch for later once endpoints exist
    assert True

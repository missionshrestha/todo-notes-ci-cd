from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from notes.models import Note

User = get_user_model()


class NoteModelTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(username="u1", password="pass12345")

    def test_str_and_defaults(self):
        n = Note.objects.create(owner=self.user, title="T", content="C")
        self.assertIn("T", str(n))
        # default status should be OPEN
        self.assertEqual(n.status, Note.Status.OPEN)

    def test_timestamps_and_ordering(self):
        # Create two notes and ensure ordering is by updated_at desc
        n1 = Note.objects.create(owner=self.user, title="A")
        n2 = Note.objects.create(owner=self.user, title="B")
        # Update n1 so it becomes the most recently updated
        n1.content = "upd"
        n1.updated_at = timezone.now()
        n1.save(update_fields=["content", "updated_at"])
        qs = list(Note.objects.filter(owner=self.user).order_by("-updated_at"))
        self.assertEqual(qs[0].id, n1.id)
        self.assertEqual(qs[1].id, n2.id)

    def test_status_choices_validation(self):
        n = Note(owner=self.user, title="Choice")
        n.status = "DONE"  # valid
        n.full_clean()     # should not raise
        # invalid status should raise
        n.status = "NOT_A_STATUS"
        with self.assertRaises(Exception):
            n.full_clean()

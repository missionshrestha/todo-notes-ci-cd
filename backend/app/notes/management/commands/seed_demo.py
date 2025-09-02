# backend/app/notes/management/commands/seed_demo.py
from __future__ import annotations
import random
from datetime import timedelta 
from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model
from django.conf import settings
from django.db import transaction
from django.utils import timezone

from notes import models as notes_models


class Command(BaseCommand):
    help = "Seed demo users & notes (idempotent). Refuses to run in PROD unless --allow-prod."

    def add_arguments(self, parser):
        parser.add_argument("--users", type=int, default=3, help="Number of demo users (default 3)")
        parser.add_argument("--notes", type=int, default=12, help="Notes per user (default 12)")
        parser.add_argument("--password", type=str, default="demo1234", help="Password for all demo users")
        parser.add_argument("--allow-prod", action="store_true", help="Allow when DEBUG=False")
        parser.add_argument("--clear", action="store_true", help="Delete demo users & their notes, then exit")

    @transaction.atomic
    def handle(self, *args, **opts):
        # ---- safety ---------------------------------------------------------
        if not settings.DEBUG and not opts["allow_prod"]:
            raise CommandError(
                "Refusing to run with DEBUG=False. Pass --allow-prod if you really mean it."
            )

        User = get_user_model()
        Note = notes_models.Note

        # ---- users to ensure ------------------------------------------------
        base_users = ["demo", "alice", "bob", "charlie", "dana", "eric", "frank"]
        n_users = max(1, int(opts["users"]))
        if n_users <= len(base_users):
            usernames = base_users[:n_users]
        else:
            usernames = base_users + [f"user{i}" for i in range(len(base_users) + 1, n_users + 1)]

        # ---- CLEAR mode -----------------------------------------------------
        if opts["clear"]:
            to_delete = list(User.objects.filter(username__in=usernames))
            notes_deleted = 0
            users_deleted = 0
            for u in to_delete:
                qs = Note.objects.filter(owner=u)
                notes_deleted += qs.count()
                qs.delete()
                u.delete()
                users_deleted += 1
            self.stdout.write(self.style.WARNING(
                f"Cleared {notes_deleted} notes and {users_deleted} users."
            ))
            return

        # ---- ensure users exist --------------------------------------------
        password = opts["password"]
        ensured_users = []
        for uname in usernames:
            user, created = User.objects.get_or_create(
                username=uname,
                defaults={
                    "email": f"{uname}@example.test",
                    "is_staff": uname == "demo",
                    "is_superuser": False,
                },
            )
            # keep password deterministic & re-runnable
            user.set_password(password)
            user.save()
            self.stdout.write(
                self.style.SUCCESS(f"{'Created' if created else 'Ensured'} user: {uname}")
            )
            ensured_users.append(user)

        # ---- note templates -------------------------------------------------
        titles = [
            "Buy groceries", "Plan sprint tasks", "Read DRF docs", "Refactor API",
            "Fix login bug", "Update CI pipeline", "Write tests", "Review PR #42",
            "Prepare demo", "Backup database", "Draft release notes", "Clean images",
        ]
        bodies = [
            "Remember to get milk, eggs, and bread.",
            "Break down tickets and estimate.",
            "Focus on permissions & throttling.",
            "Simplify serializers and views.",
            "Repro and add unit tests.",
            "Enable BuildKit caching.",
            "Cover the critical flows first.",
            "Leave comments and suggestions.",
            "Slides and live walkthrough.",
            "Rotate credentials & verify restores.",
            "Summarize features and fixes.",
            "Prune dangling images weekly.",
        ]

        # distribute statuses using *your* enum
        status_cycle = [
            Note.Status.OPEN,
            Note.Status.IN_PROGRESS,
            Note.Status.DONE,
            Note.Status.ARCHIVED,
        ]

        # ---- create notes idempotently -------------------------------------
        per_user = max(1, int(opts["notes"]))
        created_count = 0

        for u in ensured_users:
            chosen_titles = (titles * ((per_user // len(titles)) + 1))[:per_user]
            for i, title in enumerate(chosen_titles):
                defaults = {
                    "content": bodies[i % len(bodies)],
                    "status": status_cycle[i % len(status_cycle)],
                }
                obj, created = Note.objects.get_or_create(
                    owner=u,
                    title=title,
                    defaults=defaults,
                )
                if created:
                    # nudge timestamps for realism; your model has auto_now* so we override
                    try:
                        created_at = timezone.now() - timedelta(days=random.randint(0, 14))
                        if hasattr(obj, "created_at"):
                            obj.created_at = created_at
                        if hasattr(obj, "updated_at"):
                            obj.updated_at = created_at + timedelta(hours=random.randint(1, 48))
                        # update only the fields that exist
                        update_fields = [f for f in ["created_at", "updated_at"] if hasattr(obj, f)]
                        obj.save(update_fields=update_fields or None)
                    except Exception:
                        # If DB/field constraints block timestamp overrides, it's fine to skip.
                        pass
                    created_count += 1

        self.stdout.write(self.style.SUCCESS(
            f"Seed complete: {len(ensured_users)} users, {per_user} notes/user, {created_count} new notes."
        ))
        self.stdout.write(self.style.HTTP_INFO(
            f"Try login: username='demo'  password='{password}'"
        ))
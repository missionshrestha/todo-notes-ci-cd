from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.conf import settings
from django.db import connection
import socket
import os


class HealthView(APIView):
    """
    Public health endpoint for load balancers & CI/CD smoke tests.

    GET /api/health/           -> {"status": "ok"}
    GET /api/health/?checks=1  -> adds DB and metadata checks (optional)
    """
    permission_classes = [AllowAny]

    def get(self, request):
        payload = {"status": "ok"}
        if request.query_params.get("checks") in {"1", "true", "yes"}:
            # DB check (safe & lightweight)
            db_state = "ok"
            try:
                with connection.cursor() as cur:
                    cur.execute("SELECT 1;")
            except Exception as e:
                db_state = f"error: {type(e).__name__}"

            payload.update({
                "db": db_state,
                "debug": bool(getattr(settings, "DEBUG", False)),
                "hostname": socket.gethostname(),
                # Wire this from CI later (Section 9) if you want:
                "commit": os.getenv("GIT_COMMIT_SHA", ""),
                "app": "backend",
            })
        return Response(payload, status=200)

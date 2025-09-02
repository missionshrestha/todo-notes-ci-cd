# ---------- Base with deps (used by both runtime & Nuitka builds) ----------
FROM python:3.12-slim AS py-build
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1
# System deps for building wheels (psycopg etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
      build-essential curl \
    && rm -rf /var/lib/apt/lists/*
# Leverage layer caching: install deps first
COPY backend/requirements*.txt .
# Use a persistent pip cache (BuildKit) to speed rebuilds
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt

# ---------- RUNTIME: CPython + Gunicorn (recommended) ----------
FROM python:3.12-slim AS runtime
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    # Make /app the import root so "backend.app.wsgi" works
    PYTHONPATH=/app:/app/backend/app \
    DJANGO_SETTINGS_MODULE=backend.app.app.settings 

    # --- OCI labels (useful for inventory & pruning) ---
LABEL org.opencontainers.image.title="todo-notes-backend" \
      org.opencontainers.image.source="https://github.com/you/todo-notes-ci-cd" \
      org.opencontainers.image.description="DRF backend for Todo/Notes" \
      org.opencontainers.image.licenses="MIT"

# Create non-root user
RUN useradd -m -u 10001 appuser
# Copy only the installed Python (site-packages + scripts) from builder
COPY --from=py-build /usr/local /usr/local
# App source
COPY backend ./backend
# Gunicorn config
COPY backend/gunicorn.conf.py ./gunicorn.conf.py
# Drop privileges
USER appuser
EXPOSE 8000
# NOTE: WSGI module path matches repo layout: backend/app/wsgi.py
CMD ["gunicorn", "--config", "gunicorn.conf.py", "backend.app.app.wsgi:application"]










# ---------- OPTIONAL: Nuitka demo build (educational) ----------
# Compiles a tiny WSGI launcher to a single binary using Nuitka.
# This uses Python's wsgiref (simple) server — OK for learning, not production-grade.
FROM python:3.12-slim AS nuitka-build
WORKDIR /src
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PYTHONPATH=/src
RUN apt-get update && apt-get install -y --no-install-recommends \
     build-essential python3-dev gcc patchelf \
  && rm -rf /var/lib/apt/lists/*
RUN pip install --upgrade pip nuitka
# Bring app code
COPY backend ./backend
# Create a tiny launcher that serves Django WSGI app:
# It imports "backend.app.wsgi:application" and runs a basic WSGI server on 0.0.0.0:8000
RUN printf "%s\n" \
'import os' \
'from wsgiref.simple_server import make_server' \
'from backend.app.wsgi import application' \
'' \
'if __name__ == "__main__":' \
'    host = "0.0.0.0"' \
'    port = int(os.environ.get("PORT", "8000"))' \
'    httpd = make_server(host, port, application)' \
'    print(f"WSGI server (Nuitka demo) listening on {host}:{port}")' \
'    httpd.serve_forever()' > /src/server_entry.py
# Compile to a single binary
RUN python -m nuitka --onefile --follow-imports --output-dir=/src/build /src/server_entry.py

# Minimal runtime for the compiled binary
FROM debian:stable-slim AS nuitka-runtime
WORKDIR /app
RUN useradd -m -u 10001 appuser
COPY --from=nuitka-build /src/build/server_entry.bin /app/server
USER appuser
EXPOSE 8000
CMD ["/app/server"]

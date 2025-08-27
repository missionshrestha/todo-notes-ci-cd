"""
Gunicorn configuration for Django (DRF) production runtime.

Env-overridable knobs:
- GUNICORN_BIND (default "0.0.0.0:8000")
- GUNICORN_WORKERS (default 2*CPU+1)
- GUNICORN_THREADS (default 2 for gthread)
- GUNICORN_WORKER_CLASS (default "gthread")
- GUNICORN_TIMEOUT (default 30)
- GUNICORN_GRACEFUL_TIMEOUT (default 30)
- GUNICORN_KEEPALIVE (default 2)
- GUNICORN_PRELOAD (default "true")
- GUNICORN_ACCESSLOG (default "-")
- GUNICORN_ERRORLOG (default "-")
- GUNICORN_LOGLEVEL (default "info")
- GUNICORN_LIMIT_REQUEST_LINE (default 4094)
- GUNICORN_LIMIT_REQUEST_FIELDS (default 100)
- GUNICORN_LIMIT_REQUEST_FIELD_SIZE (default 8190)
"""

import multiprocessing as mp
import os


def _get(key, default, cast=str):
    val = os.getenv(key, default)
    if cast is int:
        try:
            return int(val)
        except Exception:
            return int(default)
    if cast is float:
        try:
            return float(val)
        except Exception:
            return float(default)
    if cast is bool:
        return str(val).lower() in {"1", "true", "yes", "y"}
    return val


# Network
bind = _get("GUNICORN_BIND", "0.0.0.0:8000")

# Concurrency
default_workers = max(2, mp.cpu_count() * 2 + 1)
workers = _get("GUNICORN_WORKERS", default_workers, int)

# Default to simple threaded workers for DRF
worker_class = _get("GUNICORN_WORKER_CLASS", "gthread")
threads = _get("GUNICORN_THREADS", 2, int)  # increase to 4 if requests are slow IO-bound

# Timeouts
timeout = _get("GUNICORN_TIMEOUT", 30, int)  # hard kill if worker hangs
graceful_timeout = _get("GUNICORN_GRACEFUL_TIMEOUT", 30, int)  # extra time to finish in-flight reqs
keepalive = _get("GUNICORN_KEEPALIVE", 2, int)

# Memory & startup
preload_app = _get("GUNICORN_PRELOAD", "true", bool)
# NOTE: avoid doing DB work at import-time when preload_app=True

# Logging
accesslog = _get("GUNICORN_ACCESSLOG", "-")  # "-" means stdout
errorlog = _get("GUNICORN_ERRORLOG", "-")
loglevel = _get("GUNICORN_LOGLEVEL", "info")

# Request limits (protect against header abuse)
limit_request_line = _get("GUNICORN_LIMIT_REQUEST_LINE", 4094, int)
limit_request_fields = _get("GUNICORN_LIMIT_REQUEST_FIELDS", 100, int)
limit_request_field_size = _get("GUNICORN_LIMIT_REQUEST_FIELD_SIZE", 8190, int)

# If behind a reverse proxy (Nginx) in PROD, Django should trust X-Forwarded headers.
# Add in settings later when enabling HTTPS:
# SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# Hooks (optional; helpful for diagnostics)
def on_starting(server):
    server.log.info("Gunicorn starting...")

def post_fork(server, worker):
    server.log.info("Worker spawned (pid: %s)", worker.pid)

def worker_int(worker):
    worker.log.info("Worker received INT or QUIT signal")

def worker_abort(worker):
    worker.log.info("Worker received SIGABRT signal")

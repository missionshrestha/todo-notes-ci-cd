#!/usr/bin/env bash
set -euo pipefail

# 1) Remove dangling images (no tags)
docker image prune -f

# 2) Remove BUILD CACHE older than 7 days
docker builder prune -af --filter "until=168h" || true

# 3) (Optional) Remove untagged images of this project older than 3 days
#    (keeps running containers safe)
docker image prune -af \
  --filter "label=org.opencontainers.image.title=todo-notes-backend" \
  --filter "until=72h" || true
docker image prune -af \
  --filter "label=org.opencontainers.image.title=todo-notes-frontend" \
  --filter "until=72h" || true

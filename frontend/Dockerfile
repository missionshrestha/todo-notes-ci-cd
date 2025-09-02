# ---------- Builder: Vite build ----------
FROM node:20 AS build
WORKDIR /app

LABEL org.opencontainers.image.title="todo-notes-frontend" \
      org.opencontainers.image.source="https://github.com/you/todo-notes-ci-cd" \
      org.opencontainers.image.description="React (Vite) frontend for Todo/Notes" \
      org.opencontainers.image.licenses="MIT"

# Install deps first (cache-friendly)
COPY frontend/package*.json ./

RUN --mount=type=cache,target=/usr/local/share/.npm \
    npm ci --prefer-offline --no-audit --fund=false

# Copy source and build
COPY frontend/ ./
# Use production env if present
# (Vite picks .env.production automatically for `npm run build`)
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# RUN npm run build
RUN --mount=type=cache,target=/root/.npm \
    npm run build

# ---------- Runtime: Nginx serving static ----------
FROM nginx:stable
# Nginx config for SPA (fallback to index.html)
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
# Copy the built files from builder
COPY --from=build /app/dist /usr/share/nginx/html

# (Optional) minimal healthcheck (requires curl in image)
# RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
# HEALTHCHECK --interval=10s --timeout=5s --retries=12 CMD curl -fsS http://127.0.0.1/ >/dev/null || exit 1

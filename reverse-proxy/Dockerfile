FROM nginx:stable
# drop in our server config
COPY reverse-proxy/nginx.conf /etc/nginx/conf.d/default.conf

# optional: add curl for a container-level healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends curl \
  && rm -rf /var/lib/apt/lists/*

# healthcheck hits /_health inside the proxy
HEALTHCHECK --interval=10s --timeout=5s --retries=12 \
  CMD curl -fsS http://127.0.0.1/_health >/dev/null || exit 1

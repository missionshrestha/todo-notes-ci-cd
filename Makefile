# ====== CONFIG ======
DC            := docker compose
DEV_FILE      := compose/docker-compose.dev.yml
PROD_FILE     := compose/docker-compose.prod.yml
WAIT          := ./compose/bin/wait-healthy
PRUNE_SAFE    := ./compose/bin/prune-safe.sh
DJANGO_MANAGE := python manage.py

# Allow overriding service on the CLI:  make dev-logs S=backend
S ?= backend
# Allow overriding DB service name if you ever rename it
DB ?= db

# ====== HELP ======
.PHONY: help
help:
	@echo "Common targets:"
	@echo "  dev-up            Start DEV stack (build if needed)"
	@echo "  dev-up-rebuild    Rebuild images & start DEV stack"
	@echo "  dev-down          Stop & remove DEV stack"
	@echo "  dev-ps            Show DEV containers"
	@echo "  dev-logs [S=svc]  Tail logs (default: backend)"
	@echo "  dev-restart [S=svc] Restart a dev service"
	@echo "  dev-wait          Wait for DB & backend healthy (DEV)"
	@echo "  dev-migrate       Apply migrations (DEV)"
	@echo "  dev-makemigrations [APP=app] Make migrations (DEV)"
	@echo "  dev-shell         Django shell (DEV)"
	@echo "  dev-superuser     Create Django superuser (interactive)"
	@echo "  dev-health        Curl health endpoint directly"
	@echo ""
	@echo "  prod-up           Start PROD stack (local or EC2 runner)"
	@echo "  prod-up-rebuild   Rebuild images & start PROD stack"
	@echo "  prod-down         Stop & remove PROD stack"
	@echo "  prod-ps           Show PROD containers"
	@echo "  prod-logs [S=svc] Tail logs (default: backend)"
	@echo "  prod-wait         Wait for DB & backend healthy (PROD)"
	@echo "  prod-migrate      Apply migrations (PROD)"
	@echo "  prod-health       Curl proxy health (http://localhost/)"
	@echo ""
	@echo "  prune-safe        Clean dangling images & old build cache"
	@echo "  fmt               Prettify (optional; add your linters here)"

# ====== DEV ======
.PHONY: dev-up dev-up-rebuild dev-down dev-ps dev-logs dev-restart dev-wait dev-migrate dev-makemigrations dev-shell dev-superuser dev-health
dev-up:
	$(DC) -f $(DEV_FILE) up -d
	@$(MAKE) dev-wait

dev-up-rebuild:
	$(DC) -f $(DEV_FILE) up -d --build
	@$(MAKE) dev-wait

dev-down:
	$(DC) -f $(DEV_FILE) down

dev-ps:
	$(DC) -f $(DEV_FILE) ps

dev-logs:
	$(DC) -f $(DEV_FILE) logs -f $(S)

dev-restart:
	$(DC) -f $(DEV_FILE) restart $(S)

dev-wait:
	$(WAIT) $(DEV_FILE) $(DB) 120
	$(WAIT) $(DEV_FILE) backend 180

dev-migrate:
	$(DC) -f $(DEV_FILE) exec -T backend $(DJANGO_MANAGE) migrate --noinput

# Use: make dev-makemigrations APP=notes
dev-makemigrations:
	$(DC) -f $(DEV_FILE) exec -T backend $(DJANGO_MANAGE) makemigrations $(APP)

dev-shell:
	$(DC) -f $(DEV_FILE) exec -T backend $(DJANGO_MANAGE) shell

dev-superuser:
	$(DC) -f $(DEV_FILE) exec -it backend $(DJANGO_MANAGE) createsuperuser

dev-health:
	@echo "Backend:" && curl -fsS http://localhost:8000/api/health/ || true
	@echo "Frontend (Vite):" && curl -I -sS http://localhost:5173 | head -n1 || true

# ====== PROD (local smoke or on EC2 runner) ======
.PHONY: prod-up prod-up-rebuild prod-down prod-ps prod-logs prod-wait prod-migrate prod-health
prod-up:
	$(DC) -f $(PROD_FILE) up -d
	@$(MAKE) prod-wait

prod-up-rebuild:
	$(DC) -f $(PROD_FILE) up -d --build
	@$(MAKE) prod-wait

prod-down:
	$(DC) -f $(PROD_FILE) down

prod-ps:
	$(DC) -f $(PROD_FILE) ps

prod-logs:
	$(DC) -f $(PROD_FILE) logs -f $(S)

prod-wait:
	$(WAIT) $(PROD_FILE) $(DB) 180
	$(WAIT) $(PROD_FILE) backend 240

prod-migrate:
	$(DC) -f $(PROD_FILE) exec -T backend $(DJANGO_MANAGE) migrate --noinput

prod-health:
	@echo "Proxy:" && curl -fsS http://localhost/_health || true
	@echo "API via proxy:" && curl -fsS http://localhost/api/health/ || true

# ====== UTIL ======
.PHONY: prune-safe fmt
prune-safe:
	$(PRUNE_SAFE)

fmt:
	@echo "(hook up black/isort/eslint here if you like)"

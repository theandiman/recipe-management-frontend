.PHONY: help bootstrap-env dev test-smoke test-smoke-dev test-smoke-local

help:
	@echo "Makefile targets:"
	@echo "  make bootstrap-env      Create .env.local from Firebase CLI config"
	@echo "  make dev                Bootstrap env then run 'npm run dev'"
	@echo "  make test-smoke         Run smoke tests against dev environment"
	@echo "  make test-smoke-dev     Alias for test-smoke"
	@echo "  make test-smoke-local   Run smoke tests against local dev server"

# Create .env.local using Firebase CLI to extract web app config
bootstrap-env:
	@echo "Bootstrapping environment (.env.local) using Firebase CLI..."
	@./scripts/bootstrap-env.sh

# Default dev target: ensure env exists then run dev server
dev: bootstrap-env
	npm run dev

# Run smoke tests against the dev environment
test-smoke:
	@echo "Running smoke tests against dev environment..."
	@./scripts/smoke-test.sh https://recipe-mgmt-dev.web.app

# Alias for test-smoke
test-smoke-dev: test-smoke

# Run smoke tests against local dev server
test-smoke-local:
	@echo "Running smoke tests against local dev server..."
	@./scripts/smoke-test.sh http://localhost:5173

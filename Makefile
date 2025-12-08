.PHONY: help bootstrap-env install dev test-smoke test-smoke-dev test-smoke-local

help:
	@echo "Makefile targets:"
	@echo "  make bootstrap-env      Create .env.local from Firebase CLI config"
	@echo "  make install            Run npm install with GitHub authentication"
	@echo "  make dev                Bootstrap env then run 'npm run dev'"
	@echo "  make test-smoke         Run smoke tests against dev environment"
	@echo "  make test-smoke-dev     Alias for test-smoke"
	@echo "  make test-smoke-local   Run smoke tests against local dev server"

# Create .env.local using Firebase CLI to extract web app config
bootstrap-env:
	@echo "Bootstrapping environment (.env.local) using Firebase CLI..."
	@./scripts/bootstrap-env.sh

# Install npm dependencies with GitHub authentication
install:
	@echo "Installing npm dependencies with GitHub authentication..."
	@if ! command -v gh &> /dev/null; then \
		echo "Error: GitHub CLI (gh) is not installed."; \
		echo "Install it with: brew install gh"; \
		exit 1; \
	fi
	@if ! gh auth status &> /dev/null; then \
		echo "Not authenticated with GitHub. Running 'gh auth login'..."; \
		gh auth login; \
	fi
	@echo "Ensuring GitHub token has read:packages scope..."
	gh auth refresh -s read:packages
	@echo "Setting GITHUB_TOKEN and running npm install..."
	@export GITHUB_TOKEN=$$(gh auth token) && npm install

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

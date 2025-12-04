.PHONY: help bootstrap-env dev

help:
	@echo "Makefile targets:"
	@echo "  make bootstrap-env   Create .env.local from Firebase CLI config"
	@echo "  make dev             Bootstrap env then run 'npm run dev'"

# Create .env.local using Firebase CLI to extract web app config
bootstrap-env:
	@echo "Bootstrapping environment (.env.local) using Firebase CLI..."
	@./scripts/bootstrap-env.sh

# Default dev target: ensure env exists then run dev server
dev: bootstrap-env
	npm run dev
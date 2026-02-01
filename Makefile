.PHONY: help check check-env install server-install client-install e2e-install server-dev server-test server-test-coverage client-dev client-test client-test-coverage e2e-test e2e-test-ui e2e-test-headed dev test test-coverage

help:
	@echo "Available targets:"
	@echo "  make check                  - Check if required tools are installed"
	@echo "  make check-env              - Check and setup environment variables"
	@echo "  make install                - Install all dependencies (server + client + e2e)"
	@echo "  make dev                    - Run both server and client in dev mode"
	@echo "  make test                   - Run all tests (server + client)"
	@echo "  make test-coverage          - Run all tests with coverage"
	@echo ""
	@echo "  make server-install         - Install server dependencies"
	@echo "  make server-dev             - Run server in dev mode"
	@echo "  make server-test            - Run server tests"
	@echo "  make server-test-coverage   - Run server tests with coverage"
	@echo ""
	@echo "  make client-install         - Install client dependencies"
	@echo "  make client-dev             - Run client in dev mode"
	@echo "  make client-test            - Run client tests"
	@echo "  make client-test-coverage   - Run client tests with coverage"
	@echo ""
	@echo "  make e2e-install            - Install E2E test dependencies"
	@echo "  make e2e-test               - Run E2E tests (headless)"
	@echo "  make e2e-test-ui            - Run E2E tests with UI"
	@echo "  make e2e-test-headed        - Run E2E tests with visible browser"

# Check prerequisites
check:
	@echo "Checking prerequisites..."
	@command -v uv >/dev/null 2>&1 || { echo "Error: uv is not installed. Install it from: https://docs.astral.sh/uv/getting-started/installation/"; exit 1; }
	@command -v node >/dev/null 2>&1 || { echo "Error: node is not installed. Install it from: https://nodejs.org/"; exit 1; }
	@command -v npm >/dev/null 2>&1 || { echo "Error: npm is not installed. Install it from: https://nodejs.org/"; exit 1; }
	@echo "All prerequisites are installed!"
	@echo "  - uv: $$(uv --version)"
	@echo "  - node: $$(node --version)"
	@echo "  - npm: $$(npm --version)"

# Check and setup environment variables
check-env:
	@echo "Checking environment configuration..."
	@if [ ! -f client/.env ]; then \
		echo ""; \
		echo "⚠️  No .env file found in client/"; \
		if [ -f client/.env.example ]; then \
			echo "✓ Copying client/.env.example to client/.env"; \
			cp client/.env.example client/.env; \
			echo ""; \
			echo "Environment file created with default values:"; \
			echo "  VITE_WS_URL=ws://localhost:8000/ws"; \
			echo "  VITE_API_URL=http://localhost:8000"; \
			echo ""; \
			echo "You can modify client/.env if you need different URLs."; \
		else \
			echo "✓ Creating client/.env with default values"; \
			echo "# WebSocket endpoint for real-time collaboration" > client/.env; \
			echo "VITE_WS_URL=ws://localhost:8000/ws" >> client/.env; \
			echo "" >> client/.env; \
			echo "# REST API endpoint for HTTP requests" >> client/.env; \
			echo "VITE_API_URL=http://localhost:8000" >> client/.env; \
			echo ""; \
			echo "Environment file created with default values:"; \
			echo "  VITE_WS_URL=ws://localhost:8000/ws"; \
			echo "  VITE_API_URL=http://localhost:8000"; \
			echo ""; \
			echo "You can modify client/.env if you need different URLs."; \
		fi; \
	else \
		echo "✓ Environment file exists: client/.env"; \
		echo ""; \
		echo "Current configuration:"; \
		@grep "^VITE_" client/.env | sed 's/^/  /' || echo "  (No VITE_* variables found)"; \
	fi
	@echo ""
	@echo "Environment check complete!"

# Installation targets
install: check check-env server-install client-install e2e-install
	@echo ""
	@echo "Installation complete!"
	@echo "Run 'make dev' to start the application"

server-install:
	@echo "Installing server dependencies..."
	cd server && uv sync

client-install:
	@echo "Installing client dependencies..."
	cd client && npm install

e2e-install:
	@echo "Installing E2E test dependencies..."
	cd e2e && npm install
	cd e2e && npx playwright install

# Server targets
server-dev:
	cd server && uv run uvicorn server.main:app --reload --host 127.0.0.1 --port 8000

server-test:
	cd server && uv run pytest ./tests/ -v

server-test-coverage:
	cd server && uv run pytest ./tests/ --cov=server --cov-report=html --cov-report=term

# Client targets
client-dev: check-env
	cd client && npm run dev

client-test:
	cd client && npm run test:run

client-test-coverage:
	cd client && npm run test:run -- --coverage

# E2E test targets
e2e-test:
	cd e2e && npm test

e2e-test-ui:
	cd e2e && npm run test:ui

e2e-test-headed:
	cd e2e && npm run test:headed

# Combined targets
dev: check-env
	@echo "Starting server and client in dev mode..."
	@trap 'kill 0' EXIT; \
	cd server && uv run uvicorn server.main:app --reload --host 127.0.0.1 --port 8000 & \
	cd client && npm run dev

test:
	@echo "Running server tests..."
	@cd server && uv run pytest ./tests/ -v
	@echo ""
	@echo "Running client tests..."
	@cd client && npm run test:run

test-coverage:
	@echo "Running server tests with coverage..."
	@cd server && uv run pytest ./tests/ --cov=server --cov-report=html --cov-report=term
	@echo ""
	@echo "Running client tests with coverage..."
	@cd client && npm run test:run -- --coverage
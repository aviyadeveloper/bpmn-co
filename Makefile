.PHONY: help check install server-install client-install server-dev server-test server-test-coverage client-dev client-test client-test-coverage dev test test-coverage

help:
	@echo "Available targets:"
	@echo "  make check                  - Check if required tools are installed"
	@echo "  make install                - Install all dependencies (server + client)"
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

# Installation targets
install: check server-install client-install
	@echo ""
	@echo "Installation complete!"
	@echo "Run 'make dev' to start the application"

server-install:
	@echo "Installing server dependencies..."
	cd server && uv sync

client-install:
	@echo "Installing client dependencies..."
	cd client && npm install

# Server targets
server-dev:
	cd server && uv run fastapi dev ./main.py --reload

server-test:
	cd server && uv run pytest ./tests/ -v

server-test-coverage:
	cd server && uv run pytest ./tests/ --cov=server --cov-report=html --cov-report=term

# Client targets
client-dev:
	cd client && npm run dev

client-test:
	cd client && npm run test:run

client-test-coverage:
	cd client && npm run test:run -- --coverage

# Combined targets
dev:
	@echo "Starting server and client in dev mode..."
	@trap 'kill 0' EXIT; \
	cd server && uv run fastapi dev ./main.py --reload & \
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
# BPMN Collaborative Editor

A real-time collaborative BPMN diagram editor. Multiple users can edit diagrams simultaneously with element-level locking, live synchronization, and user presence indicators.

## Quick Start

### Prerequisites

- [uv](https://docs.astral.sh/uv/getting-started/installation/) - Python package manager
- [Node.js](https://nodejs.org/) - JavaScript runtime (includes npm)

Verify prerequisites:

```bash
make check
```

### Installation

```bash
make install
```

This will:

- Check prerequisites (uv, Node.js, npm)
- Setup environment variables (creates `client/.env` if needed)
- Install server dependencies
- Install client dependencies
- Install E2E test dependencies

### Configuration

Environment variables are automatically configured during installation. The default configuration is:

```env
VITE_WS_URL=ws://localhost:8000/ws
VITE_API_URL=http://localhost:8000
```

To use different URLs, edit `client/.env` before running the application.

You can also check/setup environment variables separately:

```bash
make check-env
```

### Run Application

```bash
make dev
```

This starts:

- Server at `http://localhost:8000`
- Client at `http://localhost:5173`

### Other Commands

```bash
make test              # Run all tests
make test-coverage     # Run tests with coverage
make help              # Show all available commands
```

## Architecture

### Server (`/server`)

FastAPI-based WebSocket server with thread-safe state management, element locking, and real-time change broadcasting.

See [server/README.md](./server/README.md) for detailed documentation.

### Client (`/client`)

React + TypeScript SPA using bpmn-js for diagram rendering and Zustand for state management.

See [client/README.md](./client/README.md) for detailed documentation.

### E2E Tests (`/e2e`)

Playwright-based end-to-end tests covering single-user and multi-user collaboration scenarios.

See [e2e/README.md](./e2e/README.md) for detailed documentation.

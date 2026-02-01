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

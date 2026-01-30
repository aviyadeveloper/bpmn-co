# BPMN Collaborative Editing Server

A WebSocket server for real-time collaborative BPMN diagram editing. Built with FastAPI, featuring thread-safe state management, comprehensive error handling, and full test coverage.

## Features

- **Real-time Collaboration**: Multiple clients can edit BPMN diagrams simultaneously
- **Element Locking**: Prevents editing conflicts with granular element-level locks
- **State Synchronization**: Automatic broadcast of changes to all connected clients
- **Input Validation**: Pydantic-based message schema validation
- **Thread Safety**: asyncio.Lock protection for all shared state operations
- **Comprehensive Testing**: 73 tests with 100% coverage of critical paths

## Architecture

### Module Responsibilities

```
server/
├── main.py                          # Application setup, WebSocket endpoint, routing
├── event_handlers.py                # Business logic for handling events
├── models.py                        # Pydantic schemas for message validation
└── managers/
    ├── connections_manager.py       # WebSocket connection lifecycle & broadcasting
    ├── state_manager.py             # Centralized state management (XML, users, locks)
    └── util.py                      # Helper functions (XML validation, username generation)
```

### State Management

The `StateManager` maintains three pieces of shared state:

1. **BPMN XML**: The current diagram state
2. **Connected Users**: `{user_id: display_name}` mapping
3. **Locked Elements**: `{element_id: user_id}` mapping for edit locks

All state modifications are protected by `asyncio.Lock` to ensure thread safety in the async environment.

### WebSocket Protocol

#### Client → Server Messages

**XML Update**

```json
{
  "type": "xml_update",
  "xml": "<bpmn:definitions>...</bpmn:definitions>"
}
```

**User Name Update**

```json
{
  "type": "user_name_update",
  "name": "NewUsername"
}
```

**Element Selection** (locks elements)

```json
{
  "type": "element_select",
  "element_ids": ["element_1", "element_2"]
}
```

**Element Deselection** (unlocks element)

```json
{
  "type": "element_deselect",
  "element_id": "element_1"
}
```

#### Server → Client Messages

**Initial Connection**

```json
{
  "type": "init",
  "user_id": "uuid-here",
  "xml": "<bpmn:definitions>...</bpmn:definitions>",
  "users": { "user1": "Alice", "user2": "Bob" },
  "locked_elements": { "element_1": "user1" }
}
```

**XML Update Broadcast**

```json
{
  "type": "xml_update",
  "xml": "<bpmn:definitions>...</bpmn:definitions>"
}
```

**Users Update Broadcast**

```json
{
  "type": "users_update",
  "users": { "user1": "Alice", "user2": "Bob", "user3": "Charlie" }
}
```

**Locked Elements Update Broadcast**

```json
{
  "type": "locked_elements_update",
  "locked_elements": { "element_1": "user1", "element_2": "user2" }
}
```

**Error Response**

```json
{
  "type": "error",
  "message": "Invalid XML provided"
}
```

## Installation

### Prerequisites

- Python 3.12+
- uv (Python package manager)

### Setup

```bash
# Install dependencies
uv sync

# Run the server
uv run python -m server.main
```

The server will start on `http://localhost:8000` by default.

## Development

### Running Tests

```bash
# Run all tests
uv run pytest server/tests/ -v

# Run specific test file
uv run pytest server/tests/test_state_manager.py -v

# Run with coverage
uv run pytest server/tests/ --cov=server --cov-report=html
```

## Future Improvements

Potential enhancements for production deployment:

- [ ] Add structured logging (replace print statements)
- [ ] Implement message type enum for better type safety
- [ ] Add authentication/authorization
- [ ] Implement session persistence (Redis/database)
- [ ] Add metrics and monitoring
- [ ] Implement rate limiting
- [ ] Add WebSocket connection heartbeat/ping-pong
- [ ] Support diagram namespaces/rooms for multi-diagram editing

# BPMN Collaboration Server

A real-time collaborative BPMN editor server built with FastAPI and WebSockets.

## Features

- 🔄 Real-time BPMN diagram synchronization
- 👥 Multi-user collaboration with user management
- 🔒 Element locking to prevent concurrent editing conflicts
- 📡 WebSocket-based communication
- 🔍 HTTP endpoints for state inspection

## Getting Started

### Installation

```bash
# Install dependencies using uv
uv sync
```

### Running the Server

```bash
# Start the server
uv run fastapi dev main.py
```

The server will start on `http://localhost:8000`

## API Documentation

### HTTP Endpoints

#### `GET /`

Health check endpoint with server statistics.

**Response:**

```json
{
  "status": "running",
  "connected_clients": 2,
  "user_ids": ["abc12345", "def67890"],
  "xml_loaded": true,
  "xml_size": 1234,
  "users_count": 2,
  "locks_count": 1
}
```

#### `GET /xml`

Get the current BPMN XML state.

**Response:**

```json
{
  "xml": "<?xml version=\"1.0\" encoding=\"UTF-8\"?>...",
  "size": 1234
}
```

#### `GET /users`

Get the current list of connected users.

**Response:**

```json
{
  "users": {
    "abc-123-uuid": "Alice",
    "def-456-uuid": "Bob"
  },
  "count": 2
}
```

#### `GET /locks`

Get the current element locks with user information.

**Response:**

```json
{
  "locks": {
    "Task_1234": {
      "user_id": "abc-123-uuid",
      "user_name": "Alice"
    },
    "Gateway_5678": {
      "user_id": "def-456-uuid",
      "user_name": "Bob"
    }
  },
  "count": 2
}
```

### WebSocket Endpoint

#### `WS /ws`

WebSocket endpoint for real-time collaboration.

## WebSocket Message Protocol

### Client → Server Messages

#### `xml_update`

Update the BPMN diagram XML.

**Send:**

```json
{
  "type": "xml_update",
  "xml": "<?xml version=\"1.0\" encoding=\"UTF-8\"?>..."
}
```

**Response:** Server broadcasts the update to all other clients.

---

#### `user_name_update`

Change the current user's display name.

**Send:**

```json
{
  "type": "user_name_update",
  "name": "Alice"
}
```

**Response:** Server broadcasts updated user list to all clients.

**Validation:**

- Name cannot be empty (whitespace is trimmed)
- Users can only change their own name

---

#### `element_select`

Request to lock a BPMN element for editing.

**Send:**

```json
{
  "type": "element_select",
  "element_id": "Task_1234"
}
```

**Success Response:** Server broadcasts lock to all clients (see `element_locked` below).

**Failure Response:** Server sends error to requesting client only (see `element_lock_failed` below).

---

#### `element_deselect`

Release a locked BPMN element.

**Send:**

```json
{
  "type": "element_deselect",
  "element_id": "Task_1234"
}
```

**Response:** Server broadcasts unlock to all clients (see `element_unlocked` below).

**Note:** Only the user who locked the element can unlock it.

---

### Server → Client Messages

#### `init`

Sent immediately after connection. Contains the complete current state.

**Receive:**

```json
{
  "type": "init",
  "xml": "<?xml version=\"1.0\" encoding=\"UTF-8\"?>...",
  "users": {
    "abc-123-uuid": "User 1",
    "def-456-uuid": "User 2"
  },
  "element_locks": {
    "Task_1234": "abc-123-uuid"
  },
  "user_id": "your-client-id-uuid"
}
```

**Fields:**

- `xml`: Current BPMN diagram
- `users`: All connected users (id → name mapping)
- `element_locks`: Currently locked elements (element_id → user_id mapping)
- `user_id`: Your unique client identifier

---

#### `xml_update`

Broadcast when any user updates the BPMN diagram.

**Receive:**

```json
{
  "type": "xml_update",
  "xml": "<?xml version=\"1.0\" encoding=\"UTF-8\"?>..."
}
```

**Note:** You will NOT receive this for your own updates (excluded from broadcast).

---

#### `users_update`

Broadcast when the user list changes (name change, connect, or disconnect).

**Receive:**

```json
{
  "type": "users_update",
  "users": {
    "abc-123-uuid": "Alice",
    "def-456-uuid": "Bob"
  }
}
```

**Note:** Sent to ALL clients including the one who triggered the change.

---

#### `element_locked`

Broadcast when a user successfully locks an element.

**Receive:**

```json
{
  "type": "element_locked",
  "element_id": "Task_1234",
  "user_id": "abc-123-uuid",
  "user_name": "Alice"
}
```

**Note:** Sent to ALL clients including the one who locked it.

---

#### `element_unlocked`

Broadcast when a user unlocks an element (or disconnects while holding locks).

**Receive:**

```json
{
  "type": "element_unlocked",
  "element_id": "Task_1234",
  "user_id": "abc-123-uuid"
}
```

**Note:** Sent to ALL clients.

---

#### `element_lock_failed`

Sent only to the requesting client when they try to lock an already-locked element.

**Receive:**

```json
{
  "type": "element_lock_failed",
  "element_id": "Task_1234",
  "locked_by": "def-456-uuid",
  "locked_by_name": "Bob",
  "message": "Element is already being edited by Bob"
}
```

**Note:** Only sent to the requesting client, not broadcast.

---

#### `error`

Sent when an error occurs (e.g., invalid JSON, empty name).

**Receive:**

```json
{
  "type": "error",
  "message": "Name cannot be empty"
}
```

---

## Connection Lifecycle

### When a Client Connects:

1. Server generates a unique `user_id` (UUID)
2. Server creates a default user name ("User 1", "User 2", etc.)
3. Server sends `init` message with complete state
4. Other clients are NOT notified of the new connection

### When a Client Disconnects:

1. Server removes user from user list
2. Server releases all element locks held by that user
3. Server broadcasts `users_update` to remaining clients
4. Server broadcasts `element_unlocked` for each released lock

---

## State Management

The server maintains three pieces of shared state:

### XML State

```python
state["xml"]  # Current BPMN diagram XML string
```

### User State

```python
state["users"]  # Dict[user_id: str → user_name: str]
```

### Lock State

```python
state["element_locks"]  # Dict[element_id: str → user_id: str]
```

---

## Logging

The server provides detailed logging for all events:

```
[HH:MM:SS.mmm] [EVENT_TYPE] [Client: xxxxxxxx] Details
```

**Example:**

```
[14:23:45.123] [CONNECT] [Client: abc12345] Total clients: 2, Name: User 1
[14:23:45.234] [LOCK_ACQUIRED] [Client: abc12345] Element 'Task_1234' locked
[14:23:50.567] [USER_UPDATE] [Client: abc12345] Name changed: 'User 1' → 'Alice'
```

---

## Architecture

### ConnectionManager

Manages all WebSocket connections and provides:

- Connection/disconnection handling
- Message broadcasting
- User name management
- Element lock management

### Broadcast Behavior

- **XML updates**: Broadcast to all clients EXCEPT the sender
- **User updates**: Broadcast to ALL clients (including sender)
- **Lock/unlock**: Broadcast to ALL clients (including sender)
- **Lock failures**: Sent only to requesting client

---

## Development

### Project Structure

```
server/
├── main.py          # Main server application
├── empty.bpmn       # Initial BPMN template
├── pyproject.toml   # Project dependencies
└── README.md        # This file
```

### Dependencies

- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `websockets` - WebSocket support

---

## Security Notes

⚠️ **Current CORS Settings:** Allow all origins (`*`)

For production, update CORS settings in `main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-production-domain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## License

MIT

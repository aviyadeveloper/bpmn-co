from typing import Set, Dict
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import json
from pathlib import Path
import uuid
from datetime import datetime

app = FastAPI()

# Add CORS middleware to allow connections from the client
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Load initial XML from the empty.bpmn file
def load_initial_xml() -> str:
    """Load the initial BPMN XML from the assets folder."""
    xml_path = Path(__file__).parent / "empty.bpmn"
    if xml_path.exists():
        return xml_path.read_text()
    # Fallback default XML if file not found
    return """NOT LOADED"""


# Shared state
state = {
    "xml": load_initial_xml(),
}

# Connected clients
connected_clients: Set[WebSocket] = set()


def log_event(event_type: str, client_id: str, details: str = ""):
    """Centralized logging function with timestamps and formatting."""
    timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
    print(f"[{timestamp}] [{event_type}] [Client: {client_id[:8]}] {details}")


class ConnectionManager:
    """Manages WebSocket connections and broadcasts messages."""

    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        # Map websocket to client ID
        self.client_ids: Dict[WebSocket, str] = {}

    async def connect(self, websocket: WebSocket) -> str:
        """Accept a new WebSocket connection and add to active connections."""
        await websocket.accept()
        client_id = str(uuid.uuid4())
        self.active_connections.add(websocket)
        self.client_ids[websocket] = client_id

        log_event(
            "CONNECT", client_id, f"Total clients: {len(self.active_connections)}"
        )
        return client_id

    def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection from active connections."""
        client_id = self.client_ids.get(websocket, "UNKNOWN")
        self.active_connections.discard(websocket)
        if websocket in self.client_ids:
            del self.client_ids[websocket]

        log_event(
            "DISCONNECT", client_id, f"Total clients: {len(self.active_connections)}"
        )

    def get_client_id(self, websocket: WebSocket) -> str:
        """Get the client ID for a websocket."""
        return self.client_ids.get(websocket, "UNKNOWN")

    async def send_personal_message(self, message: str, websocket: WebSocket):
        """Send a message to a specific client."""
        client_id = self.get_client_id(websocket)
        try:
            await websocket.send_text(message)
            log_event("SEND", client_id, f"Message size: {len(message)} bytes")
        except Exception as e:
            log_event("SEND_ERROR", client_id, f"Error: {e}")
            raise

    async def broadcast(self, message: str, exclude: WebSocket = None):
        """Broadcast a message to all connected clients except the excluded one."""
        exclude_id = self.get_client_id(exclude) if exclude else "NONE"
        recipient_ids = []
        disconnected = set()

        for connection in self.active_connections:
            if connection != exclude:
                client_id = self.get_client_id(connection)
                recipient_ids.append(client_id[:8])
                try:
                    await connection.send_text(message)
                    log_event(
                        "BROADCAST",
                        client_id,
                        f"From: {exclude_id[:8]}, Size: {len(message)} bytes",
                    )
                except Exception as e:
                    log_event("BROADCAST_ERROR", client_id, f"Error: {e}")
                    disconnected.add(connection)

        # Clean up any disconnected clients
        for connection in disconnected:
            self.disconnect(connection)

        if recipient_ids:
            log_event(
                "BROADCAST_SUMMARY",
                exclude_id,
                f"Sent to {len(recipient_ids)} clients: {', '.join(recipient_ids)}",
            )
        else:
            log_event(
                "BROADCAST_SUMMARY", exclude_id, "No other clients to broadcast to"
            )


manager = ConnectionManager()


@app.on_event("startup")
async def startup_event():
    """Print startup information."""
    print("=" * 80)
    print("🚀 BPMN Collaboration Server Started")
    print("=" * 80)
    print(f"Initial XML loaded: {len(state['xml'])} characters")
    print(f"WebSocket endpoint: ws://localhost:8000/ws")
    print(f"Health check: http://localhost:8000/")
    print("=" * 80)
    print("\n📊 LOG FORMAT: [HH:MM:SS.mmm] [EVENT_TYPE] [Client: xxxxxxxx] Details\n")
    print("=" * 80)


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for handling BPMN XML synchronization.

    Flow:
    1. Client connects
    2. Server sends current XML to the new client
    3. Client sends XML updates
    4. Server saves XML and broadcasts to all other clients
    """
    client_id = await manager.connect(websocket)
    log_event("SESSION_START", client_id, "WebSocket session started")

    try:
        # Send the current XML to the newly connected client
        initial_message = json.dumps({"type": "init", "xml": state["xml"]})
        log_event(
            "INIT",
            client_id,
            f"Sending initial XML (size: {len(initial_message)} bytes, XML length: {len(state['xml'])} chars)",
        )

        try:
            await manager.send_personal_message(initial_message, websocket)
            log_event("INIT_SUCCESS", client_id, "Initial XML sent successfully")
        except Exception as e:
            log_event("INIT_ERROR", client_id, f"Failed to send initial XML: {e}")
            manager.disconnect(websocket)
            return

        # Listen for messages from this client
        message_count = 0
        while True:
            data = await websocket.receive_text()
            message_count += 1
            log_event(
                "RECEIVE",
                client_id,
                f"Message #{message_count} received (size: {len(data)} bytes)",
            )

            try:
                message = json.loads(data)
                message_type = message.get("type", "UNKNOWN")
                log_event("PARSE", client_id, f"Message type: {message_type}")

                # Handle XML update from client
                if message_type == "update" and "xml" in message:
                    xml_size = len(message["xml"])
                    old_xml_size = len(state["xml"])

                    # Save the updated XML
                    state["xml"] = message["xml"]
                    log_event(
                        "UPDATE",
                        client_id,
                        f"XML updated (old: {old_xml_size} chars, new: {xml_size} chars)",
                    )

                    # Broadcast to all other clients
                    broadcast_message = json.dumps(
                        {"type": "update", "xml": state["xml"]}
                    )

                    other_clients = len(manager.active_connections) - 1
                    log_event(
                        "BROADCAST_START",
                        client_id,
                        f"Broadcasting to {other_clients} other client(s)",
                    )

                    await manager.broadcast(broadcast_message, exclude=websocket)

                    log_event("BROADCAST_COMPLETE", client_id, "Broadcast finished")
                else:
                    log_event(
                        "MESSAGE_IGNORED",
                        client_id,
                        f"Message type '{message_type}' not handled or missing 'xml' field",
                    )

            except json.JSONDecodeError as e:
                log_event("JSON_ERROR", client_id, f"Invalid JSON: {e}")
                error_message = json.dumps(
                    {"type": "error", "message": "Invalid JSON format"}
                )
                await manager.send_personal_message(error_message, websocket)

    except WebSocketDisconnect:
        log_event("DISCONNECTED", client_id, "Client disconnected normally")
        manager.disconnect(websocket)
    except Exception as e:
        log_event("ERROR", client_id, f"WebSocket error: {e}")
        import traceback

        traceback.print_exc()
        manager.disconnect(websocket)


@app.get("/")
async def root():
    """Health check endpoint."""
    clients = [cid[:8] for cid in manager.client_ids.values()]
    return {
        "status": "running",
        "connected_clients": len(manager.active_connections),
        "client_ids": clients,
        "xml_loaded": len(state["xml"]) > 0,
        "xml_size": len(state["xml"]),
    }


@app.get("/xml")
async def get_xml():
    """HTTP endpoint to get the current XML state."""
    return {"xml": state["xml"], "size": len(state["xml"])}

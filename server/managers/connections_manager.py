import asyncio
import uuid
from typing import TypedDict
from fastapi import WebSocket


class ConnectionResponse(TypedDict):
    success: bool
    user_id: str | None
    error: str | None


class SimpleResponse(TypedDict):
    success: bool
    error: str | None


class ConnectionManager:
    """Manages WebSocket connections and broadcasts messages."""

    active_connections: set[WebSocket]
    ws_uid_map: dict[WebSocket, str]

    def __init__(self):
        self.active_connections = set()
        self.ws_uid_map = {}

    async def connect(self, websocket: WebSocket) -> ConnectionResponse:
        """
        Accept a new WebSocket connection and add to active connections.
        Produces a client ID, maps it to the connection and return it.
        """
        try:
            # Act
            await websocket.accept()

            user_id = str(uuid.uuid4())

            self.active_connections.add(websocket)
            self.ws_uid_map[websocket] = user_id

            # Response
            return {"success": True, "user_id": user_id, "error": None}
        except Exception as e:
            return {
                "success": False,
                "user_id": None,
                "error": f"Connection error: {e}",
            }

    async def disconnect(self, websocket: WebSocket) -> ConnectionResponse:
        """Remove a WebSocket connection from active connections."""
        try:
            user_id = self.ws_uid_map.get(websocket, None)

            self.active_connections.discard(websocket)

            self.ws_uid_map.pop(websocket, None)

            # State updates for users and locks - handled externally
            # Broadcast updates handled externally

            return {"success": True, "user_id": user_id, "error": None}
        except Exception as e:
            return {
                "success": False,
                "user_id": None,
                "error": f"Disconnection error: {e}",
            }

    def get_user_id_by_ws(self, websocket: WebSocket) -> str | None:
        """Get the user_id for a websocket."""
        return self.ws_uid_map.get(websocket)

    async def send_direct_message(
        self,
        websocket: WebSocket,
        message: str,
    ) -> SimpleResponse:
        """Send a message to a specific client."""
        try:
            await websocket.send_text(message)
            return {"success": True, "error": None}
        except Exception as e:
            return {"success": False, "error": f"Direct message error: {e}"}

    async def broadcast(self, message: str, exclude: WebSocket = None):
        """Broadcast a message to all connected clients except the excluded one."""
        tasks = []

        for connection in self.active_connections:
            if connection != exclude:
                tasks.append(self._safe_send(connection, message))

        await asyncio.gather(*tasks, return_exceptions=True)

    async def _safe_send(self, connection: WebSocket, message: str):
        """Send message and handle disconnection on failure."""
        try:
            await connection.send_text(message)
        except Exception:
            await self.disconnect(connection)


connection_manager = ConnectionManager()

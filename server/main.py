import enum
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from .managers import connection_manager
from .managers import state_manager
from server.managers.util import generate_random_username, is_valid_json

app = FastAPI()

# Add CORS middleware to allow connections from the client
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
    connection_response = await connection_manager.connect(websocket)
    if not connection_response["success"]:
        # Handle connection error
        return

    user_id = connection_response["user_id"]
    state_manager.add_user(user_id, generate_random_username())
    await connection_manager.broadcast(
        json.dumps({"type": "users_update", "users": state_manager.get_users()}),
        exclude=None,
    )
    try:

        # Initial connection and data send
        full_state = state_manager.get_full_state()
        initial_message = json.dumps({"type": "init", "user_id": user_id, **full_state})
        try:
            await connection_manager.send_direct_message(websocket, initial_message)
        except Exception as e:
            await connection_manager.disconnect(websocket)
            return

        # Ongoing communication
        while True:
            data = await websocket.receive_text()

            if not is_valid_json(data):
                error_message = json.dumps(
                    {"type": "error", "message": "Invalid JSON format"}
                )
                await connection_manager.send_direct_message(websocket, error_message)
                continue

            message = json.loads(data)
            message_type = message.get("type", "UNKNOWN")

            if message_type == IncomingMessageType.XML_UPDATE.value:
                update = state_manager.update_xml(message.get("xml", ""))
                if not update["success"]:
                    error_message = json.dumps(
                        {"type": "error", "message": update["error"]}
                    )
                    await connection_manager.send_direct_message(
                        websocket, error_message
                    )
                else:
                    # Broadcast updated XML to all other clients
                    broadcast_message = json.dumps(
                        {"type": "xml_update", "xml": update["xml"]}
                    )
                    await connection_manager.broadcast(
                        broadcast_message, exclude=websocket
                    )
            elif message_type == IncomingMessageType.USER_NAME_UPDATE.value:
                update = state_manager.update_user_name(user_id, message.get("name"))
                if not update:
                    error_message = json.dumps(
                        {"type": "error", "message": "Name update failed"}
                    )
                    await connection_manager.send_direct_message(
                        websocket, error_message
                    )
                else:
                    # Broadcast updated user list to all clients
                    broadcast_message = json.dumps(
                        {"type": "users_update", "users": state_manager.get_users()}
                    )
                    # Question: should we exclude the sender here?
                    await connection_manager.broadcast(broadcast_message, exclude=None)
            elif message_type == IncomingMessageType.ELEMENT_SELECT.value:
                print("Element select message received:", message)
                clear = state_manager.clear_locks_by_user(user_id)
                if clear["success"]:
                    for element_id in message.get("element_ids", []):
                        state_manager.locked_elements[element_id] = user_id
                        # Broadcast updated lock state to all clients
                    broadcast_message = json.dumps(
                        {
                            "type": "locked_elements_update",
                            "locked_elements": state_manager.get_locked_elements(),
                        }
                    )
                    await connection_manager.broadcast(broadcast_message, exclude=None)
            elif message_type == IncomingMessageType.ELEMENT_DESELECT.value:
                update = state_manager.unlock_element(
                    user_id, message.get("element_id", "")
                )
                if update["success"]:
                    # Broadcast updated lock state to all clients
                    broadcast_message = json.dumps(
                        {
                            "type": "locked_elements_update",
                            "locked_elements": state_manager.get_locked_elements(),
                        }
                    )
                    await connection_manager.broadcast(broadcast_message, exclude=None)
            else:
                print(f"Received unknown message type: {message_type}")

    except WebSocketDisconnect:
        print("====> WebSocket disconnected Error")
        await flush_user_data_and_broadcast(user_id)
        await connection_manager.disconnect(websocket)

    except Exception as e:
        print(f"====> WebSocket error: {e}")
        await flush_user_data_and_broadcast(user_id)
        await connection_manager.disconnect(websocket)


class OutgoingMessageType(enum.Enum):
    INIT = "init"
    XML_UPDATE = "xml_update"
    USERS_UPDATE = "users_update"
    LOCKED_ELEMENTS_UPDATE = "locked_elements_update"


class IncomingMessageType(enum.Enum):
    XML_UPDATE = "xml_update"
    USER_NAME_UPDATE = "user_name_update"
    ELEMENT_SELECT = "element_select"
    ELEMENT_DESELECT = "element_deselect"


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "running",
        **state_manager.get_full_state(),
    }


async def flush_user_data_and_broadcast(user_id: str):
    """Helper to remove user data on disconnect."""
    state_manager.remove_user(user_id)
    state_manager.clear_locks_by_user(user_id)

    # Broadcast updated state to all clients
    updates = [
        {"type": "users_update", "users": state_manager.get_users()},
        {
            "type": "locked_elements_update",
            "locked_elements": state_manager.get_locked_elements(),
        },
    ]

    for update in updates:
        await connection_manager.broadcast(json.dumps(update), exclude=None)

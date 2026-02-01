import json
from typing import Any, Union

from fastapi import WebSocket
from pydantic import ValidationError

from .managers.connections_manager import ConnectionResponse, connection_manager
from .managers.state_manager import state_manager
from .managers.util import generate_random_username, is_valid_json
from .models import (
    XmlUpdateMessage,
    UserNameUpdateMessage,
    ElementSelectMessage,
    ElementDeselectMessage,
)


async def handle_initial_connection_event(
    websocket: WebSocket, connection_response: ConnectionResponse, template: str
) -> None:
    """
    On new client connection:
    1. If first user, initialize diagram with chosen template
    2. Add new user and broadcast updated user list
    3. Send initial data to the new user
    """
    if not connection_response["success"]:
        # Handle connection error
        return

    user_id = connection_response["user_id"]
    await state_manager.add_user(user_id, generate_random_username())

    # Initialize diagram with template if this is the first user
    if not state_manager.is_initialized:
        try:
            await state_manager.initialize_diagram(template)
        except ValueError as e:
            # Diagram already initialized by another user (race condition)
            print(f"Diagram initialization skipped: {e}")

    full_state = state_manager.get_full_state()
    user_name = full_state["users"][user_id]

    # Update user
    await connection_manager.send_direct_message(
        websocket,
        json.dumps(
            {"type": "init", "user_id": user_id, "user_name": user_name, **full_state}
        ),
    )

    # Update others
    await connection_manager.broadcast(
        json.dumps({"type": "users_update", "users": full_state["users"]}),
        exclude=websocket,
    )


async def handle_xml_update_event(
    websocket: WebSocket, message: XmlUpdateMessage
) -> None:
    try:
        xml = await state_manager.update_xml(message.xml)

        # Broadcast updated XML to all other clients
        await connection_manager.broadcast(
            json.dumps({"type": "xml_update", "xml": xml}), exclude=websocket
        )
    except ValueError as e:
        error_message = json.dumps({"type": "error", "message": str(e)})
        await connection_manager.send_direct_message(websocket, error_message)


async def handle_user_name_update_event(
    websocket: WebSocket, user_id: str, message: UserNameUpdateMessage
) -> None:
    """
    Update user's name and broadcast updated user list to others.
    """
    try:
        users = await state_manager.update_user_name(user_id, message.name)
        await connection_manager.broadcast(
            json.dumps({"type": "users_update", "users": users}),
            exclude=None,
        )
    except ValueError as e:
        await connection_manager.send_direct_message(
            websocket, json.dumps({"type": "error", "message": str(e)})
        )


async def handle_element_select_event(
    user_id: str, message: ElementSelectMessage
) -> None:
    """
    Clear any previous locks and lock new elements for the user.
    broadcast updated lock state to all clients (including acting user).
    """
    try:
        await state_manager.clear_locks_by_user(user_id)

        # Lock new elements
        for element_id in message.element_ids:
            try:
                await state_manager.lock_element(user_id=user_id, element_id=element_id)
            except ValueError as e:
                # Element already locked, skip it
                print(f"Could not lock element {element_id}: {e}")

        # Broadcast updated lock state to all user including acting user
        await connection_manager.broadcast(
            json.dumps(
                {
                    "type": "locked_elements_update",
                    "locked_elements": state_manager.get_locked_elements(),
                }
            ),
            exclude=None,
        )
    except ValueError as e:
        print(f"Error in handle_element_select_event: {e}")


async def handle_element_deselect_event(
    user_id: str, message: ElementDeselectMessage
) -> None:
    try:
        locked_elements = await state_manager.unlock_element(
            user_id=user_id, element_id=message.element_id
        )
        # Broadcast updated lock state to all clients
        await connection_manager.broadcast(
            json.dumps(
                {
                    "type": "locked_elements_update",
                    "locked_elements": locked_elements,
                }
            ),
            exclude=None,
        )
    except ValueError as e:
        print(f"Error in handle_element_deselect_event: {e}")


async def handle_json_validation(websocket: WebSocket, data: Any) -> Union[
    XmlUpdateMessage,
    UserNameUpdateMessage,
    ElementSelectMessage,
    ElementDeselectMessage,
    None,
]:
    """
    Validate JSON and parse into appropriate Pydantic model.
    Returns None if validation fails (error message is sent to client).
    """
    if not is_valid_json(data):
        error_message = json.dumps({"type": "error", "message": "Invalid JSON format"})
        await connection_manager.send_direct_message(websocket, error_message)
        return None

    try:
        raw_message = json.loads(data)
        message_type = raw_message.get("type")

        # Parse into appropriate Pydantic model based on type
        if message_type == "xml_update":
            return XmlUpdateMessage(**raw_message)
        elif message_type == "user_name_update":
            return UserNameUpdateMessage(**raw_message)
        elif message_type == "element_select":
            return ElementSelectMessage(**raw_message)
        elif message_type == "element_deselect":
            return ElementDeselectMessage(**raw_message)
        else:
            error_message = json.dumps(
                {"type": "error", "message": f"Unknown message type: {message_type}"}
            )
            await connection_manager.send_direct_message(websocket, error_message)
            return None

    except ValidationError as e:
        error_message = json.dumps(
            {"type": "error", "message": f"Validation error: {str(e)}"}
        )
        await connection_manager.send_direct_message(websocket, error_message)
        return None


async def handle_flush_user_data(user_id: str):
    """Helper to remove user data on disconnect."""
    try:
        # Clear locks first (requires user to exist)
        await state_manager.clear_locks_by_user(user_id)
        # Then remove user
        await state_manager.remove_user(user_id)

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
    except Exception as e:
        print(f"Error flushing user data for user {user_id}: {e}")

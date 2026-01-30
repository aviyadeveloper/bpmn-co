"""
Unit tests for event handlers.
Tests event handling logic with mocked dependencies.
"""

import pytest
import json
from unittest.mock import AsyncMock, MagicMock, patch
from pydantic import ValidationError

from server.event_handlers import (
    handle_xml_update_event,
    handle_user_name_update_event,
    handle_element_select_event,
    handle_element_deselect_event,
    handle_json_validation,
    handle_flush_user_data,
    handle_initial_connection_event,
)
from server.models import (
    XmlUpdateMessage,
    UserNameUpdateMessage,
    ElementSelectMessage,
    ElementDeselectMessage,
)


# ==========================================
# handle_xml_update_event Tests
# ==========================================


@pytest.mark.asyncio
async def test_handle_xml_update_event_success(valid_xml):
    """Test successful XML update broadcasts to other clients."""
    # Arrange
    websocket = AsyncMock()
    message = XmlUpdateMessage(type="xml_update", xml=valid_xml)

    with (
        patch("server.event_handlers.state_manager") as mock_state,
        patch("server.event_handlers.connection_manager") as mock_conn,
    ):
        mock_state.update_xml = AsyncMock(return_value=valid_xml)
        mock_conn.broadcast = AsyncMock()

        # Act
        await handle_xml_update_event(websocket, message)

        # Assert
        mock_state.update_xml.assert_called_once_with(valid_xml)
        mock_conn.broadcast.assert_called_once()

        # Check broadcast was called with correct data
        broadcast_call = mock_conn.broadcast.call_args
        broadcast_data = json.loads(broadcast_call[0][0])
        assert broadcast_data["type"] == "xml_update"
        assert broadcast_data["xml"] == valid_xml
        assert broadcast_call[1]["exclude"] == websocket


@pytest.mark.asyncio
async def test_handle_xml_update_event_invalid_xml():
    """Test invalid XML sends error to client."""
    # Arrange
    websocket = AsyncMock()
    invalid_xml = "<invalid><unclosed>"
    message = XmlUpdateMessage(type="xml_update", xml=invalid_xml)

    with (
        patch("server.event_handlers.state_manager") as mock_state,
        patch("server.event_handlers.connection_manager") as mock_conn,
    ):
        mock_state.update_xml = AsyncMock(
            side_effect=ValueError("Invalid XML provided")
        )
        mock_conn.send_direct_message = AsyncMock()

        # Act
        await handle_xml_update_event(websocket, message)

        # Assert
        mock_conn.send_direct_message.assert_called_once()
        error_call = mock_conn.send_direct_message.call_args[0][1]
        error_data = json.loads(error_call)
        assert error_data["type"] == "error"
        assert "Invalid XML provided" in error_data["message"]


# ==========================================
# handle_user_name_update_event Tests
# ==========================================


@pytest.mark.asyncio
async def test_handle_user_name_update_event_success():
    """Test successful name update broadcasts to all clients."""
    # Arrange
    websocket = AsyncMock()
    user_id = "user123"
    new_name = "NewName"
    message = UserNameUpdateMessage(type="user_name_update", name=new_name)
    updated_users = {"user123": new_name}

    with (
        patch("server.event_handlers.state_manager") as mock_state,
        patch("server.event_handlers.connection_manager") as mock_conn,
    ):
        mock_state.update_user_name = AsyncMock(return_value=updated_users)
        mock_conn.broadcast = AsyncMock()

        # Act
        await handle_user_name_update_event(websocket, user_id, message)

        # Assert
        mock_state.update_user_name.assert_called_once_with(user_id, new_name)
        mock_conn.broadcast.assert_called_once()

        # Check broadcast data
        broadcast_call = mock_conn.broadcast.call_args
        broadcast_data = json.loads(broadcast_call[0][0])
        assert broadcast_data["type"] == "users_update"
        assert broadcast_data["users"] == updated_users
        assert broadcast_call[1]["exclude"] is None  # Broadcast to all


@pytest.mark.asyncio
async def test_handle_user_name_update_event_nonexistent_user():
    """Test name update for nonexistent user sends error."""
    # Arrange
    websocket = AsyncMock()
    user_id = "nonexistent"
    message = UserNameUpdateMessage(type="user_name_update", name="Name")

    with (
        patch("server.event_handlers.state_manager") as mock_state,
        patch("server.event_handlers.connection_manager") as mock_conn,
    ):
        mock_state.update_user_name = AsyncMock(
            side_effect=ValueError("User with this ID does not exist")
        )
        mock_conn.send_direct_message = AsyncMock()

        # Act
        await handle_user_name_update_event(websocket, user_id, message)

        # Assert
        mock_conn.send_direct_message.assert_called_once()
        error_call = mock_conn.send_direct_message.call_args[0][1]
        error_data = json.loads(error_call)
        assert error_data["type"] == "error"


# ==========================================
# handle_element_select_event Tests
# ==========================================


@pytest.mark.asyncio
async def test_handle_element_select_event_success():
    """Test successful element selection locks elements and broadcasts."""
    # Arrange
    user_id = "user123"
    element_ids = ["elem1", "elem2"]
    message = ElementSelectMessage(type="element_select", element_ids=element_ids)
    locked_elements = {"elem1": user_id, "elem2": user_id}

    with (
        patch("server.event_handlers.state_manager") as mock_state,
        patch("server.event_handlers.connection_manager") as mock_conn,
    ):
        mock_state.clear_locks_by_user = AsyncMock(return_value={})
        mock_state.lock_element = AsyncMock(return_value=locked_elements)
        mock_state.get_locked_elements = MagicMock(return_value=locked_elements)
        mock_conn.broadcast = AsyncMock()

        # Act
        await handle_element_select_event(user_id, message)

        # Assert
        mock_state.clear_locks_by_user.assert_called_once_with(user_id)
        assert mock_state.lock_element.call_count == 2
        mock_conn.broadcast.assert_called_once()

        # Check broadcast data
        broadcast_data = json.loads(mock_conn.broadcast.call_args[0][0])
        assert broadcast_data["type"] == "locked_elements_update"
        assert broadcast_data["locked_elements"] == locked_elements


@pytest.mark.asyncio
async def test_handle_element_select_event_empty_list():
    """Test element selection with empty list clears locks."""
    # Arrange
    user_id = "user123"
    message = ElementSelectMessage(type="element_select", element_ids=[])

    with (
        patch("server.event_handlers.state_manager") as mock_state,
        patch("server.event_handlers.connection_manager") as mock_conn,
    ):
        mock_state.clear_locks_by_user = AsyncMock(return_value={})
        mock_state.get_locked_elements = MagicMock(return_value={})
        mock_conn.broadcast = AsyncMock()

        # Act
        await handle_element_select_event(user_id, message)

        # Assert
        mock_state.clear_locks_by_user.assert_called_once()
        mock_state.lock_element.assert_not_called()  # No elements to lock
        mock_conn.broadcast.assert_called_once()


@pytest.mark.asyncio
async def test_handle_element_select_event_lock_conflict():
    """Test element selection continues when some elements already locked."""
    # Arrange
    user_id = "user123"
    element_ids = ["elem1", "elem2"]
    message = ElementSelectMessage(type="element_select", element_ids=element_ids)

    with (
        patch("server.event_handlers.state_manager") as mock_state,
        patch("server.event_handlers.connection_manager") as mock_conn,
    ):
        mock_state.clear_locks_by_user = AsyncMock(return_value={})
        # First lock succeeds, second fails
        mock_state.lock_element = AsyncMock(
            side_effect=[{"elem1": user_id}, ValueError("Element is already locked")]
        )
        mock_state.get_locked_elements = MagicMock(return_value={"elem1": user_id})
        mock_conn.broadcast = AsyncMock()

        # Act
        await handle_element_select_event(user_id, message)

        # Assert
        assert mock_state.lock_element.call_count == 2
        mock_conn.broadcast.assert_called_once()  # Still broadcasts


# ==========================================
# handle_element_deselect_event Tests
# ==========================================


@pytest.mark.asyncio
async def test_handle_element_deselect_event_success():
    """Test successful element deselection unlocks and broadcasts."""
    # Arrange
    user_id = "user123"
    element_id = "elem1"
    message = ElementDeselectMessage(type="element_deselect", element_id=element_id)
    updated_locks = {}

    with (
        patch("server.event_handlers.state_manager") as mock_state,
        patch("server.event_handlers.connection_manager") as mock_conn,
    ):
        mock_state.unlock_element = AsyncMock(return_value=updated_locks)
        mock_conn.broadcast = AsyncMock()

        # Act
        await handle_element_deselect_event(user_id, message)

        # Assert
        mock_state.unlock_element.assert_called_once_with(
            user_id=user_id, element_id=element_id
        )
        mock_conn.broadcast.assert_called_once()

        # Check broadcast data
        broadcast_data = json.loads(mock_conn.broadcast.call_args[0][0])
        assert broadcast_data["type"] == "locked_elements_update"
        assert broadcast_data["locked_elements"] == updated_locks


@pytest.mark.asyncio
async def test_handle_element_deselect_event_not_locked():
    """Test deselecting unlocked element handles error gracefully."""
    # Arrange
    user_id = "user123"
    element_id = "unlocked_elem"
    message = ElementDeselectMessage(type="element_deselect", element_id=element_id)

    with (
        patch("server.event_handlers.state_manager") as mock_state,
        patch("server.event_handlers.connection_manager") as mock_conn,
    ):
        mock_state.unlock_element = AsyncMock(
            side_effect=ValueError("Element is not locked by this user")
        )
        mock_conn.broadcast = AsyncMock()

        # Act
        await handle_element_deselect_event(user_id, message)

        # Assert
        mock_conn.broadcast.assert_not_called()  # No broadcast on error


# ==========================================
# handle_json_validation Tests
# ==========================================


@pytest.mark.asyncio
async def test_handle_json_validation_valid_xml_update():
    """Test JSON validation returns XmlUpdateMessage for valid data."""
    # Arrange
    websocket = AsyncMock()
    data = json.dumps({"type": "xml_update", "xml": "<valid>XML</valid>"})

    with patch("server.event_handlers.connection_manager"):
        # Act
        result = await handle_json_validation(websocket, data)

        # Assert
        assert isinstance(result, XmlUpdateMessage)
        assert result.type == "xml_update"
        assert result.xml == "<valid>XML</valid>"


@pytest.mark.asyncio
async def test_handle_json_validation_valid_user_name_update():
    """Test JSON validation returns UserNameUpdateMessage for valid data."""
    # Arrange
    websocket = AsyncMock()
    data = json.dumps({"type": "user_name_update", "name": "TestName"})

    with patch("server.event_handlers.connection_manager"):
        # Act
        result = await handle_json_validation(websocket, data)

        # Assert
        assert isinstance(result, UserNameUpdateMessage)
        assert result.name == "TestName"


@pytest.mark.asyncio
async def test_handle_json_validation_invalid_json():
    """Test invalid JSON sends error and returns None."""
    # Arrange
    websocket = AsyncMock()
    data = "not valid json{"

    with patch("server.event_handlers.connection_manager") as mock_conn:
        mock_conn.send_direct_message = AsyncMock()

        # Act
        result = await handle_json_validation(websocket, data)

        # Assert
        assert result is None
        mock_conn.send_direct_message.assert_called_once()
        error_call = mock_conn.send_direct_message.call_args[0][1]
        error_data = json.loads(error_call)
        assert error_data["type"] == "error"
        assert "Invalid JSON format" in error_data["message"]


@pytest.mark.asyncio
async def test_handle_json_validation_unknown_type():
    """Test unknown message type sends error and returns None."""
    # Arrange
    websocket = AsyncMock()
    data = json.dumps({"type": "unknown_type", "data": "something"})

    with patch("server.event_handlers.connection_manager") as mock_conn:
        mock_conn.send_direct_message = AsyncMock()

        # Act
        result = await handle_json_validation(websocket, data)

        # Assert
        assert result is None
        mock_conn.send_direct_message.assert_called_once()
        error_call = mock_conn.send_direct_message.call_args[0][1]
        error_data = json.loads(error_call)
        assert "Unknown message type" in error_data["message"]


@pytest.mark.asyncio
async def test_handle_json_validation_missing_required_field():
    """Test message with missing required field sends validation error."""
    # Arrange
    websocket = AsyncMock()
    data = json.dumps({"type": "xml_update"})  # Missing 'xml' field

    with patch("server.event_handlers.connection_manager") as mock_conn:
        mock_conn.send_direct_message = AsyncMock()

        # Act
        result = await handle_json_validation(websocket, data)

        # Assert
        assert result is None
        mock_conn.send_direct_message.assert_called_once()
        error_call = mock_conn.send_direct_message.call_args[0][1]
        error_data = json.loads(error_call)
        assert "Validation error" in error_data["message"]


# ==========================================
# handle_flush_user_data Tests
# ==========================================


@pytest.mark.asyncio
async def test_handle_flush_user_data_success():
    """Test flushing user data removes user and locks, broadcasts updates."""
    # Arrange
    user_id = "user123"

    with (
        patch("server.event_handlers.state_manager") as mock_state,
        patch("server.event_handlers.connection_manager") as mock_conn,
    ):
        mock_state.clear_locks_by_user = AsyncMock()  # Called first now
        mock_state.remove_user = AsyncMock()  # Called second
        mock_state.get_users = MagicMock(return_value={})
        mock_state.get_locked_elements = MagicMock(return_value={})
        mock_conn.broadcast = AsyncMock()

        # Act
        await handle_flush_user_data(user_id)

        # Assert - Order matters: clear_locks first, then remove_user
        mock_state.clear_locks_by_user.assert_called_once_with(user_id)
        mock_state.remove_user.assert_called_once_with(user_id)
        assert mock_conn.broadcast.call_count == 2  # Users and locks updates


@pytest.mark.asyncio
async def test_handle_flush_user_data_handles_error():
    """Test flush user data handles errors gracefully."""
    # Arrange
    user_id = "user123"

    with (
        patch("server.event_handlers.state_manager") as mock_state,
        patch("server.event_handlers.connection_manager") as mock_conn,
    ):
        # Mock clear_locks_by_user to raise error (happens first now)
        mock_state.clear_locks_by_user = AsyncMock(
            side_effect=ValueError("User does not exist")
        )
        mock_state.remove_user = AsyncMock()
        mock_conn.broadcast = AsyncMock()

        # Act - Should not raise exception
        await handle_flush_user_data(user_id)

        # Assert - Error is caught, clear_locks was attempted
        mock_state.clear_locks_by_user.assert_called_once_with(user_id)
        # remove_user should not be called because clear_locks raised error
        mock_state.remove_user.assert_not_called()


# ==========================================
# handle_initial_connection_event Tests
# ==========================================


@pytest.mark.asyncio
async def test_handle_initial_connection_event_success():
    """Test initial connection adds user and sends initial state."""
    # Arrange
    websocket = AsyncMock()
    user_id = "user123"
    connection_response = {"success": True, "user_id": user_id, "error": None}
    full_state = {
        "xml": "<xml/>",
        "users": {user_id: "RandomName"},
        "locked_elements": {},
    }

    with (
        patch("server.event_handlers.state_manager") as mock_state,
        patch("server.event_handlers.connection_manager") as mock_conn,
    ):
        mock_state.add_user = AsyncMock()
        mock_state.get_full_state = MagicMock(return_value=full_state)
        mock_conn.send_direct_message = AsyncMock()
        mock_conn.broadcast = AsyncMock()

        # Act
        await handle_initial_connection_event(websocket, connection_response)

        # Assert
        mock_state.add_user.assert_called_once()
        mock_conn.send_direct_message.assert_called_once()
        mock_conn.broadcast.assert_called_once()

        # Check init message sent to new user
        init_call = mock_conn.send_direct_message.call_args[0][1]
        init_data = json.loads(init_call)
        assert init_data["type"] == "init"
        assert init_data["user_id"] == user_id


@pytest.mark.asyncio
async def test_handle_initial_connection_event_connection_failed():
    """Test initial connection handles connection failure."""
    # Arrange
    websocket = AsyncMock()
    connection_response = {
        "success": False,
        "user_id": None,
        "error": "Connection failed",
    }

    with (
        patch("server.event_handlers.state_manager") as mock_state,
        patch("server.event_handlers.connection_manager") as mock_conn,
    ):
        mock_state.add_user = AsyncMock()
        mock_conn.send_direct_message = AsyncMock()

        # Act
        await handle_initial_connection_event(websocket, connection_response)

        # Assert
        mock_state.add_user.assert_not_called()
        mock_conn.send_direct_message.assert_not_called()

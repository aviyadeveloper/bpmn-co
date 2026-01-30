"""
Unit tests for Pydantic message models.
Tests validation logic for all incoming WebSocket message types.
"""

import pytest
from pydantic import ValidationError
from server.models import (
    XmlUpdateMessage,
    UserNameUpdateMessage,
    ElementSelectMessage,
    ElementDeselectMessage,
)


# ==========================================
# XmlUpdateMessage Tests
# ==========================================


def test_xml_update_message_valid():
    """Test XmlUpdateMessage with valid data."""
    # Arrange
    data = {"type": "xml_update", "xml": "<valid>XML</valid>"}

    # Act
    message = XmlUpdateMessage(**data)

    # Assert
    assert message.type == "xml_update"
    assert message.xml == "<valid>XML</valid>"


def test_xml_update_message_missing_xml():
    """Test XmlUpdateMessage fails when xml field is missing."""
    # Arrange
    data = {"type": "xml_update"}

    # Act & Assert
    with pytest.raises(ValidationError) as exc_info:
        XmlUpdateMessage(**data)

    assert "xml" in str(exc_info.value)


def test_xml_update_message_empty_xml():
    """Test XmlUpdateMessage fails when xml is empty string."""
    # Arrange
    data = {"type": "xml_update", "xml": ""}

    # Act & Assert
    with pytest.raises(ValidationError) as exc_info:
        XmlUpdateMessage(**data)

    assert "xml" in str(exc_info.value)


def test_xml_update_message_wrong_type_literal():
    """Test XmlUpdateMessage fails when type field is wrong."""
    # Arrange
    data = {"type": "wrong_type", "xml": "<valid>XML</valid>"}

    # Act & Assert
    with pytest.raises(ValidationError) as exc_info:
        XmlUpdateMessage(**data)

    assert "type" in str(exc_info.value)


# ==========================================
# UserNameUpdateMessage Tests
# ==========================================


def test_user_name_update_message_valid():
    """Test UserNameUpdateMessage with valid data."""
    # Arrange
    data = {"type": "user_name_update", "name": "TestUser"}

    # Act
    message = UserNameUpdateMessage(**data)

    # Assert
    assert message.type == "user_name_update"
    assert message.name == "TestUser"


def test_user_name_update_message_missing_name():
    """Test UserNameUpdateMessage fails when name field is missing."""
    # Arrange
    data = {"type": "user_name_update"}

    # Act & Assert
    with pytest.raises(ValidationError) as exc_info:
        UserNameUpdateMessage(**data)

    assert "name" in str(exc_info.value)


def test_user_name_update_message_empty_name():
    """Test UserNameUpdateMessage fails when name is empty (min_length=1)."""
    # Arrange
    data = {"type": "user_name_update", "name": ""}

    # Act & Assert
    with pytest.raises(ValidationError) as exc_info:
        UserNameUpdateMessage(**data)

    assert "name" in str(exc_info.value)


def test_user_name_update_message_name_too_long():
    """Test UserNameUpdateMessage fails when name exceeds max_length."""
    # Arrange
    data = {"type": "user_name_update", "name": "A" * 101}  # max_length=100

    # Act & Assert
    with pytest.raises(ValidationError) as exc_info:
        UserNameUpdateMessage(**data)

    assert "name" in str(exc_info.value)


def test_user_name_update_message_max_length_boundary():
    """Test UserNameUpdateMessage accepts exactly 100 characters."""
    # Arrange
    data = {"type": "user_name_update", "name": "A" * 100}

    # Act
    message = UserNameUpdateMessage(**data)

    # Assert
    assert len(message.name) == 100


# ==========================================
# ElementSelectMessage Tests
# ==========================================


def test_element_select_message_valid():
    """Test ElementSelectMessage with valid data."""
    # Arrange
    data = {"type": "element_select", "element_ids": ["elem1", "elem2", "elem3"]}

    # Act
    message = ElementSelectMessage(**data)

    # Assert
    assert message.type == "element_select"
    assert message.element_ids == ["elem1", "elem2", "elem3"]
    assert len(message.element_ids) == 3


def test_element_select_message_empty_list():
    """Test ElementSelectMessage accepts empty list (default)."""
    # Arrange
    data = {"type": "element_select", "element_ids": []}

    # Act
    message = ElementSelectMessage(**data)

    # Assert
    assert message.type == "element_select"
    assert message.element_ids == []


def test_element_select_message_missing_element_ids():
    """Test ElementSelectMessage uses default empty list when element_ids missing."""
    # Arrange
    data = {"type": "element_select"}

    # Act
    message = ElementSelectMessage(**data)

    # Assert
    assert message.type == "element_select"
    assert message.element_ids == []


def test_element_select_message_single_element():
    """Test ElementSelectMessage with single element."""
    # Arrange
    data = {"type": "element_select", "element_ids": ["single_elem"]}

    # Act
    message = ElementSelectMessage(**data)

    # Assert
    assert len(message.element_ids) == 1
    assert message.element_ids[0] == "single_elem"


# ==========================================
# ElementDeselectMessage Tests
# ==========================================


def test_element_deselect_message_valid():
    """Test ElementDeselectMessage with valid data."""
    # Arrange
    data = {"type": "element_deselect", "element_id": "element_123"}

    # Act
    message = ElementDeselectMessage(**data)

    # Assert
    assert message.type == "element_deselect"
    assert message.element_id == "element_123"


def test_element_deselect_message_missing_element_id():
    """Test ElementDeselectMessage fails when element_id is missing."""
    # Arrange
    data = {"type": "element_deselect"}

    # Act & Assert
    with pytest.raises(ValidationError) as exc_info:
        ElementDeselectMessage(**data)

    assert "element_id" in str(exc_info.value)


def test_element_deselect_message_empty_element_id():
    """Test ElementDeselectMessage fails when element_id is empty (min_length=1)."""
    # Arrange
    data = {"type": "element_deselect", "element_id": ""}

    # Act & Assert
    with pytest.raises(ValidationError) as exc_info:
        ElementDeselectMessage(**data)

    assert "element_id" in str(exc_info.value)


# ==========================================
# Edge Cases and Type Validation
# ==========================================


def test_xml_update_message_wrong_xml_type():
    """Test XmlUpdateMessage fails when xml is not a string."""
    # Arrange
    data = {"type": "xml_update", "xml": 123}  # Should be string

    # Act & Assert
    with pytest.raises(ValidationError) as exc_info:
        XmlUpdateMessage(**data)

    assert "xml" in str(exc_info.value)


def test_element_select_message_wrong_element_ids_type():
    """Test ElementSelectMessage fails when element_ids is not a list."""
    # Arrange
    data = {"type": "element_select", "element_ids": "not_a_list"}

    # Act & Assert
    with pytest.raises(ValidationError) as exc_info:
        ElementSelectMessage(**data)

    assert "element_ids" in str(exc_info.value)


def test_message_extra_fields_allowed():
    """Test that Pydantic allows extra fields (default behavior)."""
    # Arrange
    data = {
        "type": "xml_update",
        "xml": "<valid>XML</valid>",
        "extra_field": "should_be_ignored",
    }

    # Act
    message = XmlUpdateMessage(**data)

    # Assert
    assert message.type == "xml_update"
    assert message.xml == "<valid>XML</valid>"
    # Extra field is ignored, not accessible on message object

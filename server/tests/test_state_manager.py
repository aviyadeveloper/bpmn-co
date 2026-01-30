"""
Unit tests for StateManager.
Tests XML management, user management, element locking, and concurrency.
"""

import pytest
import asyncio
from server.managers.state_manager import StateManager


# ==========================================
# XML Management Tests
# ==========================================


@pytest.mark.asyncio
async def test_get_xml_returns_initial_xml(state_manager):
    """Test that get_xml returns the initial loaded XML."""
    # Arrange & Act
    xml = state_manager.get_xml()

    # Assert
    assert xml is not None
    assert isinstance(xml, str)
    assert len(xml) > 0


@pytest.mark.asyncio
async def test_update_xml_valid(state_manager, valid_xml):
    """Test updating XML with valid content succeeds."""
    # Arrange
    # (state_manager and valid_xml provided by fixtures)

    # Act
    result = await state_manager.update_xml(valid_xml)

    # Assert
    assert result == valid_xml
    assert state_manager.get_xml() == valid_xml


@pytest.mark.asyncio
async def test_update_xml_invalid_raises_error(state_manager, invalid_xml):
    """Test updating XML with invalid content raises ValueError."""
    # Arrange
    # (state_manager and invalid_xml provided by fixtures)

    # Act & Assert
    with pytest.raises(ValueError, match="Invalid XML provided"):
        await state_manager.update_xml(invalid_xml)


# ==========================================
# User Management Tests
# ==========================================


@pytest.mark.asyncio
async def test_add_user_success(state_manager):
    """Test adding a new user succeeds."""
    # Arrange
    user_id = "user_123"
    user_name = "TestUser"

    # Act
    result = await state_manager.add_user(user_id, user_name)

    # Assert
    assert user_id in result
    assert result[user_id] == user_name
    assert state_manager.get_users()[user_id] == user_name


@pytest.mark.asyncio
async def test_add_user_duplicate_raises_error(state_manager):
    """Test adding a user with duplicate ID raises ValueError."""
    # Arrange
    user_id = "user_123"
    await state_manager.add_user(user_id, "FirstName")

    # Act & Assert
    with pytest.raises(ValueError, match="User with this ID already exists"):
        await state_manager.add_user(user_id, "SecondName")


@pytest.mark.asyncio
async def test_remove_user_success(state_manager):
    """Test removing an existing user succeeds."""
    # Arrange
    user_id = "user_123"
    await state_manager.add_user(user_id, "TestUser")

    # Act
    result = await state_manager.remove_user(user_id)

    # Assert
    assert user_id not in result
    assert user_id not in state_manager.get_users()


@pytest.mark.asyncio
async def test_remove_user_nonexistent_raises_error(state_manager):
    """Test removing a non-existent user raises ValueError."""
    # Arrange
    user_id = "nonexistent_user"

    # Act & Assert
    with pytest.raises(ValueError, match="User with this ID does not exist"):
        await state_manager.remove_user(user_id)


@pytest.mark.asyncio
async def test_update_user_name_success(state_manager):
    """Test updating a user's name succeeds."""
    # Arrange
    user_id = "user_123"
    await state_manager.add_user(user_id, "OldName")
    new_name = "NewName"

    # Act
    result = await state_manager.update_user_name(user_id, new_name)

    # Assert
    assert result[user_id] == new_name
    assert state_manager.get_users()[user_id] == new_name


@pytest.mark.asyncio
async def test_update_user_name_nonexistent_raises_error(state_manager):
    """Test updating name for non-existent user raises ValueError."""
    # Arrange
    user_id = "nonexistent_user"

    # Act & Assert
    with pytest.raises(ValueError, match="User with this ID does not exist"):
        await state_manager.update_user_name(user_id, "NewName")


# ==========================================
# Lock Management Tests
# ==========================================


@pytest.mark.asyncio
async def test_lock_element_success(state_with_users):
    """Test locking an unlocked element succeeds."""
    # Arrange
    user_id = "user1"
    element_id = "element_123"

    # Act
    result = await state_with_users.lock_element(user_id, element_id)

    # Assert
    assert element_id in result
    assert result[element_id] == user_id
    assert state_with_users.get_locked_elements()[element_id] == user_id


@pytest.mark.asyncio
async def test_lock_element_already_locked_raises_error(state_with_users):
    """Test locking an already locked element raises ValueError."""
    # Arrange
    element_id = "element_123"
    await state_with_users.lock_element("user1", element_id)

    # Act & Assert
    with pytest.raises(ValueError, match="Element is already locked"):
        await state_with_users.lock_element("user2", element_id)


@pytest.mark.asyncio
async def test_unlock_element_success(state_with_users):
    """Test unlocking an owned element succeeds."""
    # Arrange
    user_id = "user1"
    element_id = "element_123"
    await state_with_users.lock_element(user_id, element_id)

    # Act
    result = await state_with_users.unlock_element(user_id, element_id)

    # Assert
    assert element_id not in result
    assert element_id not in state_with_users.get_locked_elements()


@pytest.mark.asyncio
async def test_unlock_element_not_owner_raises_error(state_with_users):
    """Test unlocking an element not owned by user raises ValueError."""
    # Arrange
    element_id = "element_123"
    await state_with_users.lock_element("user1", element_id)

    # Act & Assert
    with pytest.raises(ValueError, match="Element is not locked by this user"):
        await state_with_users.unlock_element("user2", element_id)


@pytest.mark.asyncio
async def test_unlock_element_not_locked_raises_error(state_with_users):
    """Test unlocking an unlocked element raises ValueError."""
    # Arrange
    element_id = "unlocked_element"
    user_id = "user1"

    # Act & Assert
    with pytest.raises(ValueError, match="Element is not locked by this user"):
        await state_with_users.unlock_element(user_id, element_id)


@pytest.mark.asyncio
async def test_clear_locks_by_user_success(state_with_users):
    """Test clearing all locks for a user succeeds."""
    # Arrange
    user_id = "user1"
    await state_with_users.lock_element(user_id, "element_1")
    await state_with_users.lock_element(user_id, "element_2")
    await state_with_users.lock_element("user2", "element_3")

    # Act
    result = await state_with_users.clear_locks_by_user(user_id)

    # Assert
    assert "element_1" not in result
    assert "element_2" not in result
    assert "element_3" in result  # user2's lock remains
    assert result["element_3"] == "user2"


@pytest.mark.asyncio
async def test_clear_locks_by_user_no_locks(state_with_users):
    """Test clearing locks for user with no locks succeeds."""
    # Arrange
    user_id = "user1"

    # Act
    result = await state_with_users.clear_locks_by_user(user_id)

    # Assert
    assert len(result) == 0


@pytest.mark.asyncio
async def test_clear_locks_by_nonexistent_user_raises_error(state_manager):
    """Test clearing locks for non-existent user raises ValueError."""
    # Arrange
    user_id = "nonexistent_user"

    # Act & Assert
    with pytest.raises(ValueError, match="User with this ID does not exist"):
        await state_manager.clear_locks_by_user(user_id)


# ==========================================
# Concurrency Tests (Critical!)
# ==========================================


@pytest.mark.asyncio
async def test_concurrent_lock_same_element_race_condition(state_with_users):
    """Test that only one of two concurrent lock attempts succeeds."""
    # Arrange
    element_id = "contested_element"

    # Act - Both try to lock simultaneously
    results = await asyncio.gather(
        state_with_users.lock_element("user1", element_id),
        state_with_users.lock_element("user2", element_id),
        return_exceptions=True,
    )

    # Assert
    # One should succeed, one should fail with ValueError
    success_count = sum(1 for r in results if isinstance(r, dict))
    error_count = sum(1 for r in results if isinstance(r, ValueError))

    assert success_count == 1, "Exactly one lock should succeed"
    assert error_count == 1, "Exactly one lock should fail"

    # Verify the element is locked by exactly one user
    locked_elements = state_with_users.get_locked_elements()
    assert element_id in locked_elements
    assert locked_elements[element_id] in ["user1", "user2"]


@pytest.mark.asyncio
async def test_concurrent_xml_updates_no_corruption(state_manager, valid_xml):
    """Test that concurrent XML updates don't corrupt state."""
    # Arrange
    xml_variants = [valid_xml.replace("Process_1", f"Process_{i}") for i in range(5)]

    # Act - Update XML concurrently
    results = await asyncio.gather(
        *[state_manager.update_xml(xml) for xml in xml_variants], return_exceptions=True
    )

    # Assert
    # All should succeed
    assert all(isinstance(r, str) for r in results), "All updates should succeed"

    # Final XML should be one of the variants (last one wins)
    final_xml = state_manager.get_xml()
    assert final_xml in xml_variants


@pytest.mark.asyncio
async def test_concurrent_user_operations(state_manager):
    """Test concurrent user add/remove/update operations."""
    # Arrange
    user_operations = [
        state_manager.add_user("user1", "User1"),
        state_manager.add_user("user2", "User2"),
        state_manager.add_user("user3", "User3"),
    ]

    # Act
    results = await asyncio.gather(*user_operations, return_exceptions=True)

    # Assert
    assert all(isinstance(r, dict) for r in results), "All adds should succeed"
    users = state_manager.get_users()
    assert len(users) == 3
    assert "user1" in users
    assert "user2" in users
    assert "user3" in users


# ==========================================
# State Snapshot Tests
# ==========================================


@pytest.mark.asyncio
async def test_get_full_state(state_with_locked_elements):
    """Test get_full_state returns complete state snapshot."""
    # Arrange
    # (state_with_locked_elements has users and locked elements)

    # Act
    full_state = state_with_locked_elements.get_full_state()

    # Assert
    assert "xml" in full_state
    assert "users" in full_state
    assert "locked_elements" in full_state
    assert isinstance(full_state["xml"], str)
    assert isinstance(full_state["users"], dict)
    assert isinstance(full_state["locked_elements"], dict)
    assert len(full_state["users"]) == 2
    assert len(full_state["locked_elements"]) == 2

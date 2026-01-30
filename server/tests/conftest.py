"""
Pytest configuration and shared fixtures for server tests.
"""

import pytest
import pytest_asyncio
from server.managers.state_manager import StateManager
from server.managers.connections_manager import ConnectionManager


@pytest.fixture
def state_manager():
    """
    Provide a fresh StateManager instance for each test.
    Ensures test isolation.
    """
    return StateManager()


@pytest.fixture
def connection_manager():
    """
    Provide a fresh ConnectionManager instance for each test.
    Ensures test isolation.
    """
    return ConnectionManager()


@pytest_asyncio.fixture
async def state_with_users(state_manager):
    """
    Provide a StateManager pre-loaded with test users.
    Useful for tests that need existing users.
    """
    await state_manager.add_user("user1", "Alice")
    await state_manager.add_user("user2", "Bob")
    return state_manager


@pytest_asyncio.fixture
async def state_with_locked_elements(state_with_users):
    """
    Provide a StateManager with users and locked elements.
    Useful for testing unlock and lock conflict scenarios.
    """
    await state_with_users.lock_element(user_id="user1", element_id="element_1")
    await state_with_users.lock_element(user_id="user2", element_id="element_2")
    return state_with_users


@pytest.fixture
def valid_xml():
    """
    Provide valid BPMN XML for testing.
    """
    return """<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL">
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1"/>
  </bpmn:process>
</bpmn:definitions>"""


@pytest.fixture
def invalid_xml():
    """
    Provide invalid XML for testing error handling.
    """
    return "<invalid><unclosed>"

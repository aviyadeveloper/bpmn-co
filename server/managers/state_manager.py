from typing import TypedDict
import asyncio

from server.managers.util import is_valid_xml, load_initial_xml


class User(TypedDict):
    id: str
    name: str


class UpdateXMLResponse(TypedDict):
    success: bool
    xml: str | None
    error: str | None


class AddUserResponse(TypedDict):
    success: bool
    users: list[User] | None
    error: str | None


class LockUnlockElementResponse(TypedDict):
    success: bool
    locked_elements: dict[str, str] | None
    error: str | None


class StateManager:
    """
    The state manager is reposnsible for managing the state of the collaborative server.
    It's state acts as a single source of truth for all connected clients.

    It contains:
    - BPMN xml diagram state
    - Connected users list (ids, names)
    - Locked elements list (element ids, user ids)

    It exposes to read and update the state in accordance with necessary synchronization mechanisms.
    """

    _lock: asyncio.Lock
    xml: str
    users: dict[str, str]
    locked_elements: dict[str, str]

    def __init__(self):
        self._lock = asyncio.Lock()
        self.xml = load_initial_xml()
        self.users = {}
        self.locked_elements = {}

    def get_full_state(self):
        return {
            "xml": self.xml,
            "users": self.users,
            "locked_elements": self.locked_elements,
        }

    # XML management

    def get_xml(self) -> str:
        return self.xml

    async def update_xml(self, new_xml: str) -> UpdateXMLResponse:
        async with self._lock:
            try:
                # Guards
                if not is_valid_xml(new_xml):
                    raise ValueError("Invalid XML provided")

                # Act
                self.xml = new_xml

                # Response
                return {
                    "success": True,
                    "xml": self.xml,
                    "error": None,
                }
            except Exception as e:
                return {"success": False, "xml": None, "error": str(e)}

    # Users management

    def get_users(self) -> list[User]:
        return self.users

    async def add_user(self, id: str, name: str) -> AddUserResponse:
        async with self._lock:
            try:
                # Guards
                if id in self.users:
                    raise ValueError("User with this ID already exists")

                # Act
                self.users[id] = name

                # Response
                return {
                    "success": True,
                    "users": self.users,
                    "error": None,
                }

            except Exception as e:
                return {"success": False, "users": None, "error": str(e)}

    async def remove_user(self, id: str) -> None:
        async with self._lock:
            try:
                # Guards
                if self.users.get(id) is None:
                    raise ValueError("User with this ID does not exist")

                # Act
                del self.users[id]

                # Response
                return {
                    "success": True,
                    "users": self.users,
                    "error": None,
                }

            except Exception as e:
                return {"success": False, "users": None, "error": str(e)}

    async def update_user_name(self, id: str, name: str) -> None:
        async with self._lock:
            try:
                # Guards
                if self.users.get(id) is None:
                    raise ValueError("User with this ID does not exist")

                # Act
                self.users[id] = name

                # Response
                return {
                    "success": True,
                    "users": self.users,
                    "error": None,
                }

            except Exception as e:
                return {"success": False, "users": None, "error": str(e)}

    # Locked elements management

    def get_locked_elements(self) -> dict[str, str]:
        return self.locked_elements

    async def lock_element(
        self,
        user_id: str,
        element_id: str,
    ) -> LockUnlockElementResponse:
        async with self._lock:
            try:
                # Guards
                if self.locked_elements.get(element_id) is not None:
                    raise ValueError("Element is already locked")

                # Act
                self.locked_elements[element_id] = user_id

                # Response
                return {
                    "success": True,
                    "locked_elements": self.locked_elements,
                    "error": None,
                }

            except Exception as e:
                return {"success": False, "locked_elements": None, "error": str(e)}

    async def unlock_element(
        self, user_id: str, element_id: str
    ) -> LockUnlockElementResponse:
        async with self._lock:
            try:
                # Guards
                if self.locked_elements.get(element_id) != user_id:
                    raise ValueError("Element is not locked by this user")

                # Act
                del self.locked_elements[element_id]

                # Response
                return {
                    "success": True,
                    "locked_elements": self.locked_elements,
                    "error": None,
                }

            except Exception as e:
                return {"success": False, "locked_elements": None, "error": str(e)}

    async def clear_locks_by_user(self, user_id: str) -> LockUnlockElementResponse:
        """Unlock all elements locked by the given user."""
        async with self._lock:
            try:
                # Guards
                if user_id not in self.users:
                    raise ValueError("User with this ID does not exist")

                # Act
                elements_to_unlock = [
                    element_id
                    for element_id, locker_id in self.locked_elements.items()
                    if locker_id == user_id
                ]

                for element_id in elements_to_unlock:
                    del self.locked_elements[element_id]

                # Response
                return {
                    "success": True,
                    "locked_elements": self.locked_elements,
                    "error": None,
                }

            except Exception as e:
                return {"success": False, "locked_elements": None, "error": str(e)}


state_manager = StateManager()

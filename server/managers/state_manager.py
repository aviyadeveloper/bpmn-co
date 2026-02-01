from typing import TypedDict
import asyncio
import uuid

from server.managers.util import is_valid_xml, load_initial_xml
from server.templates.loader import load_template


class User(TypedDict):
    id: str
    name: str


class StateManager:
    """
    The state manager is reposnsible for managing the state of the collaborative server.
    It's state acts as a single source of truth for all connected clients.

    It contains:
    - BPMN xml diagram state
    - Connected users list (ids, names)
    - Locked elements list (element ids, user ids)
    - Template used to initialize the diagram

    It exposes to read and update the state in accordance with necessary synchronization mechanisms.
    """

    _lock: asyncio.Lock
    diagram_id: str
    xml: str
    users: dict[str, str]
    locked_elements: dict[str, str]
    template: str | None
    is_initialized: bool

    def __init__(self):
        self._lock = asyncio.Lock()
        self.diagram_id = str(uuid.uuid4())
        self.xml = load_initial_xml()
        self.users = {}
        self.locked_elements = {}
        self.template = None
        self.is_initialized = False

    def get_full_state(self):
        return {
            "diagram_id": self.diagram_id,
            "xml": self.xml,
            "users": self.users,
            "locked_elements": self.locked_elements,
            "template": self.template,
            "is_initialized": self.is_initialized,
        }

    # XML management

    def get_xml(self) -> str:
        return self.xml

    async def update_xml(self, new_xml: str) -> str:
        async with self._lock:
            # Guards
            if not is_valid_xml(new_xml):
                raise ValueError("Invalid XML provided")

            # Act
            self.xml = new_xml

            # Response
            return self.xml

    # Users management

    def get_users(self) -> list[User]:
        return self.users

    async def add_user(self, id: str, name: str) -> dict[str, str]:
        async with self._lock:
            # Guards
            if id in self.users:
                raise ValueError("User with this ID already exists")

            # Act
            self.users[id] = name

            # Response
            return self.users

    async def remove_user(self, id: str) -> dict[str, str]:
        async with self._lock:
            # Guards
            if self.users.get(id) is None:
                raise ValueError("User with this ID does not exist")

            # Act
            del self.users[id]

            # Response
            return self.users

    async def update_user_name(self, id: str, name: str) -> dict[str, str]:
        async with self._lock:
            # Guards
            if self.users.get(id) is None:
                raise ValueError("User with this ID does not exist")

            # Act
            self.users[id] = name

            # Response
            return self.users

    # Locked elements management

    def get_locked_elements(self) -> dict[str, str]:
        return self.locked_elements

    async def lock_element(
        self,
        user_id: str,
        element_id: str,
    ) -> dict[str, str]:
        async with self._lock:
            # Guards
            if self.locked_elements.get(element_id) is not None:
                raise ValueError("Element is already locked")

            # Act
            self.locked_elements[element_id] = user_id

            # Response
            return self.locked_elements

    async def unlock_element(self, user_id: str, element_id: str) -> dict[str, str]:
        async with self._lock:
            # Guards
            if self.locked_elements.get(element_id) != user_id:
                raise ValueError("Element is not locked by this user")

            # Act
            del self.locked_elements[element_id]

            # Response
            return self.locked_elements

    async def clear_locks_by_user(self, user_id: str) -> dict[str, str]:
        """Unlock all elements locked by the given user."""
        async with self._lock:
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
            return self.locked_elements

    # Diagram initialization and reset

    async def initialize_diagram(self, template: str) -> dict:
        """Initialize diagram with a template. Only works if not already initialized."""
        async with self._lock:
            # Guards
            if self.is_initialized:
                raise ValueError("Diagram is already initialized")

            # Act
            try:
                template_xml = load_template(template)
                self.xml = template_xml
                self.template = template
                self.is_initialized = True
            except (FileNotFoundError, IOError) as e:
                raise ValueError(f"Failed to load template '{template}': {e}")

            # Response
            return {
                "template": self.template,
                "is_initialized": self.is_initialized,
            }

    async def reset_diagram(self) -> dict:
        """Reset diagram to initial state. Should be called when all users disconnect."""
        async with self._lock:
            # Act
            self.diagram_id = str(uuid.uuid4())
            self.xml = load_initial_xml()
            self.users = {}
            self.locked_elements = {}
            self.template = None
            self.is_initialized = False

            # Response
            return self.get_full_state()

    def should_reset(self) -> bool:
        """Check if diagram should be reset (no users connected)."""
        return len(self.users) == 0


state_manager = StateManager()

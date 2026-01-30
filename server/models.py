"""
Pydantic models for WebSocket message validation.
Defines the schema for all incoming message types from clients.
"""

from pydantic import BaseModel, Field
from typing import Literal


class XmlUpdateMessage(BaseModel):
    """Message for updating the BPMN XML diagram."""

    type: Literal["xml_update"]
    xml: str = Field(..., min_length=1, description="The BPMN XML content")


class UserNameUpdateMessage(BaseModel):
    """Message for updating a user's display name."""

    type: Literal["user_name_update"]
    name: str = Field(..., min_length=1, max_length=100, description="User's new name")


class ElementSelectMessage(BaseModel):
    """Message for selecting/locking diagram elements."""

    type: Literal["element_select"]
    element_ids: list[str] = Field(
        default_factory=list, description="List of element IDs to lock"
    )


class ElementDeselectMessage(BaseModel):
    """Message for deselecting/unlocking a diagram element."""

    type: Literal["element_deselect"]
    element_id: str = Field(..., min_length=1, description="Element ID to unlock")

from typing import TypedDict


class ErrorResponse(TypedDict):
    success: bool
    error: str | None


def is_valid_xml(xml: str) -> bool:
    try:
        import xml.etree.ElementTree as ET

        ET.fromstring(xml)
        return True
    except ET.ParseError:
        return False


def is_valid_json(json_str: str) -> bool:
    try:
        import json

        json.loads(json_str)
        return True
    except json.JSONDecodeError:
        return False


def load_initial_xml() -> str:
    from pathlib import Path

    empty_bpmn_path = Path(__file__).parent.parent / "empty.bpmn"
    try:
        return empty_bpmn_path.read_text()
    except Exception:
        return "ERROR READING FILE"


def generate_random_username() -> str:
    import random

    adjectives = [
        "Quick",
        "Lazy",
        "Happy",
        "Energetic",
        "Brave",
        "Clever",
        "Witty",
        "Calm",
        "Eager",
        "Gentle",
    ]
    nouns = [
        "Fox",
        "Dog",
        "Cat",
        "Mouse",
        "Lion",
        "Tiger",
        "Bear",
        "Wolf",
        "Eagle",
        "Shark",
    ]

    return f"{random.choice(adjectives)}{random.choice(nouns)}{random.randint(1, 100)}"

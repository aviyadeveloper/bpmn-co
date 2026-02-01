"""
Template loader utilities for BPMN templates.
Handles loading template XML files from disk.
"""

import os
from pathlib import Path


def get_template_path(template_name: str) -> Path:
    """Get the file path for a template by name."""
    current_dir = Path(__file__).parent
    return current_dir / f"{template_name}.bpmn"


def load_template(template_name: str) -> str:
    """
    Load a BPMN template XML by name.

    Args:
        template_name: Name of the template (e.g., 'blank', 'simple-process')

    Returns:
        The template XML content as a string

    Raises:
        FileNotFoundError: If the template file doesn't exist
        IOError: If there's an error reading the template file
    """
    template_path = get_template_path(template_name)

    if not template_path.exists():
        raise FileNotFoundError(
            f"Template '{template_name}' not found at {template_path}"
        )

    try:
        with open(template_path, "r", encoding="utf-8") as f:
            return f.read()
    except Exception as e:
        raise IOError(f"Error loading template '{template_name}': {e}")

"""
Template constants for BPMN diagram initialization.
Defines available template types that clients can choose from during connection.
"""

from typing import Literal

# Template type definition
TemplateType = Literal[
    "blank", "simple-process", "approval-workflow", "cross-functional"
]

# Available templates
TEMPLATES = {
    "blank": "blank",
    "simple-process": "simple-process",
    "approval-workflow": "approval-workflow",
    "cross-functional": "cross-functional",
}

# Default template if none specified or invalid
DEFAULT_TEMPLATE = "blank"


def is_valid_template(template: str) -> bool:
    """Check if a template name is valid."""
    return template in TEMPLATES


def get_template_or_default(template: str | None) -> str:
    """Get template if valid, otherwise return default."""
    if template and is_valid_template(template):
        return template
    return DEFAULT_TEMPLATE

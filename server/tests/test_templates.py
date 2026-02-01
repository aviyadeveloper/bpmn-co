"""
Unit tests for template constants and validation.
"""

import pytest
from server.templates.constants import (
    TEMPLATES,
    DEFAULT_TEMPLATE,
    is_valid_template,
    get_template_or_default,
)
from server.templates.loader import load_template, get_template_path


# ==========================================
# Template Constants Tests
# ==========================================


def test_templates_contains_all_expected_templates():
    """Test TEMPLATES dict contains all 4 expected templates."""
    # Assert
    assert "blank" in TEMPLATES
    assert "simple-process" in TEMPLATES
    assert "approval-workflow" in TEMPLATES
    assert "cross-functional" in TEMPLATES
    assert len(TEMPLATES) == 4


def test_default_template_is_blank():
    """Test default template is set to blank."""
    # Assert
    assert DEFAULT_TEMPLATE == "blank"


# ==========================================
# is_valid_template Tests
# ==========================================


def test_is_valid_template_returns_true_for_valid_templates():
    """Test is_valid_template returns True for all valid templates."""
    # Act & Assert
    assert is_valid_template("blank") is True
    assert is_valid_template("simple-process") is True
    assert is_valid_template("approval-workflow") is True
    assert is_valid_template("cross-functional") is True


def test_is_valid_template_returns_false_for_invalid_templates():
    """Test is_valid_template returns False for invalid templates."""
    # Act & Assert
    assert is_valid_template("invalid") is False
    assert is_valid_template("") is False
    assert is_valid_template("BLANK") is False  # Case sensitive
    assert is_valid_template("simple process") is False  # Space instead of dash


# ==========================================
# get_template_or_default Tests
# ==========================================


def test_get_template_or_default_returns_valid_template():
    """Test get_template_or_default returns template when valid."""
    # Act & Assert
    assert get_template_or_default("blank") == "blank"
    assert get_template_or_default("simple-process") == "simple-process"
    assert get_template_or_default("approval-workflow") == "approval-workflow"
    assert get_template_or_default("cross-functional") == "cross-functional"


def test_get_template_or_default_returns_default_for_invalid():
    """Test get_template_or_default returns default for invalid template."""
    # Act & Assert
    assert get_template_or_default("invalid") == DEFAULT_TEMPLATE
    assert get_template_or_default("") == DEFAULT_TEMPLATE
    assert get_template_or_default("random-template") == DEFAULT_TEMPLATE


def test_get_template_or_default_returns_default_for_none():
    """Test get_template_or_default returns default when None provided."""
    # Act
    result = get_template_or_default(None)

    # Assert
    assert result == DEFAULT_TEMPLATE


# ==========================================
# Template Loader Tests
# ==========================================


def test_get_template_path_returns_correct_path():
    """Test get_template_path returns correct file path."""
    # Act
    path = get_template_path("blank")

    # Assert
    assert path.name == "blank.bpmn"
    assert path.parent.name == "templates"
    assert path.exists()


def test_load_template_blank_succeeds():
    """Test loading blank template succeeds."""
    # Act
    xml = load_template("blank")

    # Assert
    assert xml is not None
    assert isinstance(xml, str)
    assert len(xml) > 0
    assert "<?xml" in xml
    assert "bpmn:definitions" in xml


def test_load_template_simple_process_succeeds():
    """Test loading simple-process template succeeds."""
    # Act
    xml = load_template("simple-process")

    # Assert
    assert xml is not None
    assert "StartEvent_1" in xml
    assert "Task_1" in xml
    assert "Task_2" in xml
    assert "EndEvent_1" in xml
    assert "Process_SimpleProcess" in xml


def test_load_template_approval_workflow_succeeds():
    """Test loading approval-workflow template succeeds."""
    # Act
    xml = load_template("approval-workflow")

    # Assert
    assert xml is not None
    assert "Task_Submit" in xml
    assert "Gateway_1" in xml
    assert "Task_Process" in xml
    assert "Task_Notify" in xml
    assert "Approved?" in xml


def test_load_template_cross_functional_succeeds():
    """Test loading cross-functional template succeeds."""
    # Act
    xml = load_template("cross-functional")

    # Assert
    assert xml is not None
    assert "Collaboration_1" in xml
    assert "Participant_Customer" in xml
    assert "Participant_Sales" in xml
    assert "Participant_Fulfillment" in xml
    assert "messageFlow" in xml


def test_load_template_nonexistent_raises_error():
    """Test loading nonexistent template raises FileNotFoundError."""
    # Act & Assert
    with pytest.raises(FileNotFoundError, match="Template 'nonexistent' not found"):
        load_template("nonexistent")


def test_all_templates_load_successfully():
    """Test all defined templates can be loaded."""
    # Act & Assert
    for template_name in TEMPLATES.keys():
        xml = load_template(template_name)
        assert xml is not None
        assert len(xml) > 0
        assert "<?xml" in xml
        assert "bpmn:" in xml

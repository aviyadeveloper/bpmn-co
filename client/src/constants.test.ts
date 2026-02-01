import { describe, it, expect } from "vitest";
import {
  buildWsUrl,
  WS_BASE_URL,
  API_BASE_URL,
  TEMPLATES,
  COLORS,
  BOX_SHADOW,
} from "./constants";
import type { TemplateId } from "./constants";

describe("constants", () => {
  describe("WS_BASE_URL", () => {
    it("should be defined and be a string", () => {
      // Arrange & Act & Assert
      expect(WS_BASE_URL).toBeDefined();
      expect(typeof WS_BASE_URL).toBe("string");
    });

    it("should be a valid WebSocket URL format", () => {
      // Arrange & Act & Assert
      expect(WS_BASE_URL).toMatch(/^wss?:\/\/.+/);
    });

    it("should use fallback value when env var is not set", () => {
      // Arrange & Act & Assert
      expect(WS_BASE_URL).toBe("ws://localhost:8000/ws");
    });
  });

  describe("buildWsUrl", () => {
    it("should return base URL when no template is provided", () => {
      // Arrange
      const template = undefined;

      // Act
      const result = buildWsUrl(template);

      // Assert
      expect(result).toBe("ws://localhost:8000/ws");
    });

    it("should return base URL when called without arguments", () => {
      // Arrange & Act
      const result = buildWsUrl();

      // Assert
      expect(result).toBe("ws://localhost:8000/ws");
    });

    it("should append template query parameter when template is provided", () => {
      // Arrange
      const template = "simple-process";

      // Act
      const result = buildWsUrl(template);

      // Assert
      expect(result).toBe("ws://localhost:8000/ws?template=simple-process");
    });

    it("should handle blank template", () => {
      // Arrange
      const template = "blank";

      // Act
      const result = buildWsUrl(template);

      // Assert
      expect(result).toBe("ws://localhost:8000/ws?template=blank");
    });

    it("should handle approval-workflow template", () => {
      // Arrange
      const template = "approval-workflow";

      // Act
      const result = buildWsUrl(template);

      // Assert
      expect(result).toBe("ws://localhost:8000/ws?template=approval-workflow");
    });

    it("should handle cross-functional template", () => {
      // Arrange
      const template = "cross-functional";

      // Act
      const result = buildWsUrl(template);

      // Assert
      expect(result).toBe("ws://localhost:8000/ws?template=cross-functional");
    });
  });

  describe("API_BASE_URL", () => {
    it("should be defined and be a string", () => {
      // Arrange & Act & Assert
      expect(API_BASE_URL).toBeDefined();
      expect(typeof API_BASE_URL).toBe("string");
    });

    it("should be a valid URL format", () => {
      // Arrange & Act & Assert
      expect(API_BASE_URL).toMatch(/^https?:\/\/.+/);
    });

    it("should use fallback value when env var is not set", () => {
      // Arrange & Act & Assert
      expect(API_BASE_URL).toBe("http://localhost:8000");
    });
  });

  describe("TEMPLATES", () => {
    it("should contain all expected templates", () => {
      // Arrange
      const expectedTemplates = [
        "blank",
        "simple-process",
        "approval-workflow",
        "cross-functional",
      ];

      // Act
      const actualTemplates = Object.keys(TEMPLATES);

      // Assert
      expect(actualTemplates).toEqual(expectedTemplates);
    });

    it("should have blank template with correct structure", () => {
      // Arrange & Act
      const blank = TEMPLATES.blank;

      // Assert
      expect(blank).toEqual({
        id: "blank",
        name: "Blank Canvas",
        description: "Start with an empty diagram",
      });
    });

    it("should have simple-process template with correct structure", () => {
      // Arrange & Act
      const simpleProcess = TEMPLATES["simple-process"];

      // Assert
      expect(simpleProcess).toEqual({
        id: "simple-process",
        name: "Simple Process",
        description: "Linear workflow with tasks",
      });
    });

    it("should have approval-workflow template with correct structure", () => {
      // Arrange & Act
      const approvalWorkflow = TEMPLATES["approval-workflow"];

      // Assert
      expect(approvalWorkflow).toEqual({
        id: "approval-workflow",
        name: "Approval Workflow",
        description: "Process with approval gateway",
      });
    });

    it("should have cross-functional template with correct structure", () => {
      // Arrange & Act
      const crossFunctional = TEMPLATES["cross-functional"];

      // Assert
      expect(crossFunctional).toEqual({
        id: "cross-functional",
        name: "Cross-Functional",
        description: "Multiple swim lanes",
      });
    });

    it("should have id matching the key for all templates", () => {
      // Arrange & Act & Assert
      Object.entries(TEMPLATES).forEach(([key, template]) => {
        expect(template.id).toBe(key);
      });
    });

    it("should have name and description for all templates", () => {
      // Arrange & Act & Assert
      Object.values(TEMPLATES).forEach((template) => {
        expect(template.name).toBeDefined();
        expect(template.name.length).toBeGreaterThan(0);
        expect(template.description).toBeDefined();
        expect(template.description.length).toBeGreaterThan(0);
      });
    });
  });

  describe("COLORS", () => {
    it("should contain all expected colors", () => {
      // Arrange
      const expectedColors = [
        "WHITE",
        "OFFWHITE",
        "GREY",
        "OFFBLACK",
        "BLACK",
        "RED",
        "ORANGE",
        "YELLOW",
        "GREEN",
        "BLUE",
        "PURPLE",
      ];

      // Act
      const actualColors = Object.keys(COLORS);

      // Assert
      expect(actualColors).toEqual(expectedColors);
    });

    it("should have all colors as valid hex codes", () => {
      // Arrange
      const hexColorRegex = /^#[0-9A-F]{6}$/i;

      // Act & Assert
      Object.values(COLORS).forEach((color) => {
        expect(color).toMatch(hexColorRegex);
      });
    });

    it("should have WHITE as #FFFFFF", () => {
      // Arrange & Act & Assert
      expect(COLORS.WHITE).toBe("#FFFFFF");
    });

    it("should have BLACK as #212529", () => {
      // Arrange & Act & Assert
      expect(COLORS.BLACK).toBe("#212529");
    });

    it("should have RED as #F94144", () => {
      // Arrange & Act & Assert
      expect(COLORS.RED).toBe("#F94144");
    });

    it("should have GREEN as #43AA8B", () => {
      // Arrange & Act & Assert
      expect(COLORS.GREEN).toBe("#43AA8B");
    });

    it("should have BLUE as #577590", () => {
      // Arrange & Act & Assert
      expect(COLORS.BLUE).toBe("#577590");
    });
  });

  describe("BOX_SHADOW", () => {
    it("should be defined and be a string", () => {
      // Arrange & Act & Assert
      expect(BOX_SHADOW).toBeDefined();
      expect(typeof BOX_SHADOW).toBe("string");
    });

    it("should be a valid CSS box-shadow value", () => {
      // Arrange & Act & Assert
      expect(BOX_SHADOW).toMatch(/^[\d\s\w(),.-]+$/);
    });

    it("should have correct box-shadow value", () => {
      // Arrange & Act & Assert
      expect(BOX_SHADOW).toBe("0 2px 4px rgba(0, 0, 0, 0.2)");
    });
  });

  describe("TemplateId type", () => {
    it("should allow valid template ids", () => {
      // Arrange
      const validIds: TemplateId[] = [
        "blank",
        "simple-process",
        "approval-workflow",
        "cross-functional",
      ];

      // Act & Assert
      validIds.forEach((id) => {
        expect(TEMPLATES[id]).toBeDefined();
      });
    });
  });
});

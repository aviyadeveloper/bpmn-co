import { describe, it, expect, beforeEach, vi } from "vitest";
import { modelerStore } from "./modelerStore";
import BpmnJS from "bpmn-js/lib/Modeler";

vi.mock("bpmn-js/lib/Modeler");

describe("modelerStore", () => {
  let mockModeler: BpmnJS;

  beforeEach(() => {
    modelerStore.set(null);
    mockModeler = new BpmnJS({ container: document.createElement("div") });
  });

  describe("set and get", () => {
    it("should initialize with null", () => {
      // Arrange & Act
      const result = modelerStore.get();

      // Assert
      expect(result).toBeNull();
    });

    it("should store modeler instance", () => {
      // Arrange & Act
      modelerStore.set(mockModeler);

      // Assert
      expect(modelerStore.get()).toBe(mockModeler);
    });

    it("should update stored modeler instance", () => {
      // Arrange
      const firstModeler = mockModeler;
      const secondModeler = new BpmnJS({
        container: document.createElement("div"),
      });

      // Act
      modelerStore.set(firstModeler);
      expect(modelerStore.get()).toBe(firstModeler);

      modelerStore.set(secondModeler);

      // Assert
      expect(modelerStore.get()).toBe(secondModeler);
      expect(modelerStore.get()).not.toBe(firstModeler);
    });

    it("should clear modeler instance when set to null", () => {
      // Arrange
      modelerStore.set(mockModeler);
      expect(modelerStore.get()).toBe(mockModeler);

      // Act
      modelerStore.set(null);

      // Assert
      expect(modelerStore.get()).toBeNull();
    });

    it("should handle multiple set operations", () => {
      // Arrange & Act
      modelerStore.set(mockModeler);
      modelerStore.set(null);
      modelerStore.set(mockModeler);

      // Assert
      expect(modelerStore.get()).toBe(mockModeler);
    });
  });

  describe("singleton behavior", () => {
    it("should maintain same instance across multiple get calls", () => {
      // Arrange
      modelerStore.set(mockModeler);

      // Act
      const firstGet = modelerStore.get();
      const secondGet = modelerStore.get();
      const thirdGet = modelerStore.get();

      // Assert
      expect(firstGet).toBe(secondGet);
      expect(secondGet).toBe(thirdGet);
      expect(firstGet).toBe(mockModeler);
    });
  });
});

/**
 * useBpmnModeler Hook Tests
 *
 * Tests the BPMN modeler initialization and collaboration features:
 * - Modeler initialization and lifecycle
 * - XML loading and synchronization
 * - Collaboration features (locked elements)
 * - Event handlers for element interaction
 * - Visual styling of locked elements
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useBpmnModeler } from "./useBpmnModeler";
import { modelerStore } from "./modelerStore";
import * as utils from "../../utils";

// Mock dependencies
vi.mock("../editor/useEditor");
vi.mock("../../utils");

// Mock BPMN modeler
const mockImportXML = vi.fn();
const mockSaveXML = vi.fn();
const mockDestroy = vi.fn();
const mockOn = vi.fn();
const mockOff = vi.fn();
const mockGet = vi.fn();

// Store event handlers for simulation
let eventHandlers: Record<string, Function> = {};

vi.mock("bpmn-js/lib/Modeler", () => {
  return {
    default: class MockBpmnJS {
      constructor(_config: any) {}

      importXML(xml: string) {
        return mockImportXML(xml);
      }

      saveXML(options: any) {
        return mockSaveXML(options);
      }

      destroy() {
        return mockDestroy();
      }

      on(event: string, priority: number | Function, handler?: Function) {
        const actualHandler =
          typeof priority === "function" ? priority : handler;
        eventHandlers[event] = actualHandler!;
        return mockOn(event, priority, handler);
      }

      off(event: string, handler: Function) {
        delete eventHandlers[event];
        return mockOff(event, handler);
      }

      get(service: string) {
        return mockGet(service);
      }
    },
  };
});

const SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL">
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1" />
  </bpmn:process>
</bpmn:definitions>`;

describe("useBpmnModeler", () => {
  let container: HTMLDivElement;
  let mockUseEditor: any;
  let consoleErrorSpy: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    eventHandlers = {};

    // Default mock implementations
    mockImportXML.mockResolvedValue({ warnings: [] });
    mockSaveXML.mockResolvedValue({ xml: "<test>saved</test>" });
    mockDestroy.mockReturnValue(undefined);
    mockOn.mockReturnValue(undefined);
    mockOff.mockReturnValue(undefined);

    // Default mockGet returns empty objects to prevent errors in visual styling
    mockGet.mockReturnValue({
      getAll: vi.fn().mockReturnValue([]),
      getGraphics: vi.fn().mockReturnValue(null),
    });

    // Mock useEditor hook
    mockUseEditor = {
      userId: "user1",
      lockedElements: {},
    };

    const { useEditor } = await import("../editor/useEditor");
    vi.mocked(useEditor).mockReturnValue(mockUseEditor);

    // Mock utils
    vi.mocked(utils.canEditElement).mockReturnValue(true);

    // Create container
    container = document.createElement("div");
    document.body.appendChild(container);

    // Reset modeler store
    modelerStore.set(null);

    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    if (container && container.parentNode) {
      document.body.removeChild(container);
    }
    consoleErrorSpy.mockRestore();
  });

  describe("Initialization", () => {
    it("should not initialize modeler when container is null", () => {
      // Arrange & Act
      const { result } = renderHook(() =>
        useBpmnModeler({
          container: null,
          initialXml: SAMPLE_XML,
        }),
      );

      // Assert
      expect(result.current.modeler.current).toBeNull();
      expect(mockImportXML).not.toHaveBeenCalled();
      expect(modelerStore.get()).toBeNull();
    });

    it("should initialize modeler when container is provided", async () => {
      // Arrange & Act
      const { result } = renderHook(() =>
        useBpmnModeler({
          container,
          initialXml: SAMPLE_XML,
        }),
      );

      // Assert
      await waitFor(() => {
        expect(result.current.modeler.current).not.toBeNull();
        expect(mockImportXML).toHaveBeenCalledWith(SAMPLE_XML);
        expect(modelerStore.get()).not.toBeNull();
      });
    });

    it("should register modeler in global store", async () => {
      // Arrange & Act
      const { result } = renderHook(() =>
        useBpmnModeler({
          container,
          initialXml: SAMPLE_XML,
        }),
      );

      // Assert
      await waitFor(() => {
        const storedModeler = modelerStore.get();
        expect(storedModeler).not.toBeNull();
        expect(storedModeler).toBe(result.current.modeler.current);
      });
    });

    it("should handle import XML errors gracefully", async () => {
      // Arrange
      mockImportXML.mockRejectedValueOnce(new Error("Invalid XML"));

      // Act
      renderHook(() =>
        useBpmnModeler({
          container,
          initialXml: "invalid xml",
        }),
      );

      // Assert
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Failed to load initial XML:",
          expect.any(Error),
        );
      });
    });

    it("should setup event handlers on initialization", async () => {
      // Arrange & Act
      renderHook(() =>
        useBpmnModeler({
          container,
          initialXml: SAMPLE_XML,
        }),
      );

      // Assert
      await waitFor(() => {
        // Check that event handlers were registered
        expect(eventHandlers["commandStack.changed"]).toBeDefined();
        expect(eventHandlers["selection.changed"]).toBeDefined();
        expect(eventHandlers["element.mousedown"]).toBeDefined();
        expect(eventHandlers["element.dblclick"]).toBeDefined();
        expect(eventHandlers["commandStack.preExecute"]).toBeDefined();
        expect(eventHandlers["import.done"]).toBeDefined();
      });
    });
  });

  describe("Cleanup", () => {
    it("should destroy modeler on unmount", async () => {
      // Arrange
      const { unmount } = renderHook(() =>
        useBpmnModeler({
          container,
          initialXml: SAMPLE_XML,
        }),
      );

      await waitFor(() => {
        expect(mockDestroy).not.toHaveBeenCalled();
      });

      // Act
      unmount();

      // Assert
      expect(mockDestroy).toHaveBeenCalledTimes(1);
      expect(modelerStore.get()).toBeNull();
    });

    it("should reinitialize modeler when container changes", async () => {
      // Arrange
      const container1 = document.createElement("div");
      const container2 = document.createElement("div");
      document.body.appendChild(container1);
      document.body.appendChild(container2);

      const { rerender } = renderHook(
        ({ container }) =>
          useBpmnModeler({
            container,
            initialXml: SAMPLE_XML,
          }),
        {
          initialProps: { container: container1 },
        },
      );

      await waitFor(() => {
        expect(mockImportXML).toHaveBeenCalledTimes(1);
      });

      // Act
      rerender({ container: container2 });

      // Assert
      await waitFor(() => {
        expect(mockDestroy).toHaveBeenCalledTimes(1);
        expect(mockImportXML).toHaveBeenCalledTimes(2);
      });

      document.body.removeChild(container1);
      document.body.removeChild(container2);
    });
  });

  describe("onChange Callback", () => {
    it("should call onChange when commandStack.changed fires", async () => {
      // Arrange
      const onChangeMock = vi.fn();

      renderHook(() =>
        useBpmnModeler({
          container,
          initialXml: SAMPLE_XML,
          onChange: onChangeMock,
        }),
      );

      await waitFor(() => {
        expect(eventHandlers["commandStack.changed"]).toBeDefined();
      });

      // Act
      await act(async () => {
        await eventHandlers["commandStack.changed"]();
      });

      // Assert
      await waitFor(() => {
        expect(mockSaveXML).toHaveBeenCalledWith({ format: true });
        expect(onChangeMock).toHaveBeenCalledWith("<test>saved</test>");
      });
    });

    it("should not call onChange if callback is not provided", async () => {
      // Arrange
      renderHook(() =>
        useBpmnModeler({
          container,
          initialXml: SAMPLE_XML,
        }),
      );

      await waitFor(() => {
        expect(eventHandlers["commandStack.changed"]).toBeDefined();
      });

      // Act
      await act(async () => {
        await eventHandlers["commandStack.changed"]();
      });

      // Assert
      expect(mockSaveXML).toHaveBeenCalled();
    });

    it("should update onChange callback when it changes", async () => {
      // Arrange
      const onChangeMock1 = vi.fn();
      const onChangeMock2 = vi.fn();

      const { rerender } = renderHook(
        ({ onChange }) =>
          useBpmnModeler({
            container,
            initialXml: SAMPLE_XML,
            onChange,
          }),
        {
          initialProps: { onChange: onChangeMock1 },
        },
      );

      await waitFor(() => {
        expect(eventHandlers["commandStack.changed"]).toBeDefined();
      });

      // Act - Trigger with first callback
      await act(async () => {
        await eventHandlers["commandStack.changed"]();
      });

      await waitFor(() => {
        expect(onChangeMock1).toHaveBeenCalled();
      });

      // Update to second callback
      rerender({ onChange: onChangeMock2 });

      // Trigger with second callback
      await act(async () => {
        await eventHandlers["commandStack.changed"]();
      });

      // Assert
      await waitFor(() => {
        expect(onChangeMock2).toHaveBeenCalled();
      });
    });

    it("should not call onChange during external updates", async () => {
      // Arrange
      const onChangeMock = vi.fn();

      const { result } = renderHook(() =>
        useBpmnModeler({
          container,
          initialXml: SAMPLE_XML,
          onChange: onChangeMock,
        }),
      );

      await waitFor(() => {
        expect(result.current.modeler.current).not.toBeNull();
      });

      onChangeMock.mockClear();

      // Act - Load external XML
      await act(async () => {
        await result.current.loadXml("<external>xml</external>");
      });

      // Simulate commandStack.changed during import
      await act(async () => {
        await eventHandlers["commandStack.changed"]();
      });

      // Assert - onChange should NOT be called (external update flag)
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(onChangeMock).not.toHaveBeenCalled();
    });
  });

  describe("loadXml Function", () => {
    it("should load XML successfully", async () => {
      // Arrange
      const newXml = "<bpmn:definitions><bpmn:task/></bpmn:definitions>";

      const { result } = renderHook(() =>
        useBpmnModeler({
          container,
          initialXml: SAMPLE_XML,
        }),
      );

      await waitFor(() => {
        expect(result.current.modeler.current).not.toBeNull();
      });

      mockImportXML.mockClear();

      // Act
      await act(async () => {
        await result.current.loadXml(newXml);
      });

      // Assert
      expect(mockImportXML).toHaveBeenCalledWith(newXml);
    });

    it("should handle loadXml errors gracefully", async () => {
      // Arrange
      const { result } = renderHook(() =>
        useBpmnModeler({
          container,
          initialXml: SAMPLE_XML,
        }),
      );

      await waitFor(() => {
        expect(result.current.modeler.current).not.toBeNull();
      });

      mockImportXML.mockRejectedValueOnce(new Error("Import failed"));

      // Act
      await act(async () => {
        await result.current.loadXml("invalid");
      });

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to load external XML:",
        expect.any(Error),
      );
    });

    it("should do nothing if modeler is not initialized", async () => {
      // Arrange
      const { result } = renderHook(() =>
        useBpmnModeler({
          container: null,
          initialXml: SAMPLE_XML,
        }),
      );

      // Act
      await act(async () => {
        await result.current.loadXml("<test/>");
      });

      // Assert
      expect(mockImportXML).not.toHaveBeenCalled();
    });

    it("should set and clear external update flag", async () => {
      // Arrange
      const onChangeMock = vi.fn();

      const { result } = renderHook(() =>
        useBpmnModeler({
          container,
          initialXml: SAMPLE_XML,
          onChange: onChangeMock,
        }),
      );

      await waitFor(() => {
        expect(result.current.modeler.current).not.toBeNull();
      });

      onChangeMock.mockClear();

      // Act - Load XML
      await act(async () => {
        await result.current.loadXml("<new>xml</new>");
      });

      // During import, onChange should be blocked
      await act(async () => {
        await eventHandlers["commandStack.changed"]();
      });
      expect(onChangeMock).not.toHaveBeenCalled();

      // Trigger import.done to clear flag
      await act(async () => {
        if (eventHandlers["import.done"]) {
          eventHandlers["import.done"]();
        }
      });

      // After import.done, onChange should work
      await act(async () => {
        await eventHandlers["commandStack.changed"]();
      });

      // Assert
      await waitFor(() => {
        expect(onChangeMock).toHaveBeenCalled();
      });
    });
  });

  describe("Collaboration Features", () => {
    it("should filter selection to only editable elements", async () => {
      // Arrange
      const mockSelection = {
        select: vi.fn(),
      };

      // Mock the get method to return appropriate services
      mockGet.mockImplementation((service: string) => {
        if (service === "selection") return mockSelection;
        if (service === "elementRegistry")
          return { getAll: vi.fn().mockReturnValue([]) };
        if (service === "canvas")
          return { getGraphics: vi.fn().mockReturnValue(null) };
        return null;
      });

      vi.mocked(utils.canEditElement).mockImplementation(
        (elementId: string) => {
          return elementId !== "LockedTask_1";
        },
      );

      renderHook(() =>
        useBpmnModeler({
          container,
          initialXml: SAMPLE_XML,
        }),
      );

      await waitFor(() => {
        expect(eventHandlers["selection.changed"]).toBeDefined();
      });

      // Act - Select both editable and locked elements
      const mockEvent = {
        newSelection: [
          { id: "Task_1", type: "bpmn:Task" },
          { id: "LockedTask_1", type: "bpmn:Task" },
        ],
      };

      act(() => {
        eventHandlers["selection.changed"](mockEvent);
      });

      // Assert - Only editable element should be selected
      await waitFor(() => {
        expect(mockSelection.select).toHaveBeenCalledWith([
          { id: "Task_1", type: "bpmn:Task" },
        ]);
      });
    });

    it("should not reselect if all elements are editable", async () => {
      // Arrange
      const mockSelection = {
        select: vi.fn(),
      };

      // Mock the get method to return appropriate services
      mockGet.mockImplementation((service: string) => {
        if (service === "selection") return mockSelection;
        if (service === "elementRegistry")
          return { getAll: vi.fn().mockReturnValue([]) };
        if (service === "canvas")
          return { getGraphics: vi.fn().mockReturnValue(null) };
        return null;
      });

      vi.mocked(utils.canEditElement).mockReturnValue(true);

      renderHook(() =>
        useBpmnModeler({
          container,
          initialXml: SAMPLE_XML,
        }),
      );

      await waitFor(() => {
        expect(eventHandlers["selection.changed"]).toBeDefined();
      });

      // Act
      const mockEvent = {
        newSelection: [
          { id: "Task_1", type: "bpmn:Task" },
          { id: "Task_2", type: "bpmn:Task" },
        ],
      };

      act(() => {
        eventHandlers["selection.changed"](mockEvent);
      });

      // Assert
      expect(mockSelection.select).not.toHaveBeenCalled();
    });

    it("should block interaction with locked elements", async () => {
      // Arrange
      // Mock the get method to return appropriate services
      mockGet.mockImplementation((service: string) => {
        if (service === "elementRegistry")
          return { getAll: vi.fn().mockReturnValue([]) };
        if (service === "canvas")
          return { getGraphics: vi.fn().mockReturnValue(null) };
        return null;
      });

      vi.mocked(utils.canEditElement).mockReturnValue(false);

      renderHook(() =>
        useBpmnModeler({
          container,
          initialXml: SAMPLE_XML,
        }),
      );

      await waitFor(() => {
        expect(eventHandlers["element.mousedown"]).toBeDefined();
      });

      // Act
      const mockEvent = {
        element: { id: "LockedTask_1" },
        stopPropagation: vi.fn(),
        preventDefault: vi.fn(),
      };

      const result = eventHandlers["element.mousedown"](mockEvent);

      // Assert
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it("should prevent commands on locked elements", async () => {
      // Arrange
      // Mock the get method to return appropriate services
      mockGet.mockImplementation((service: string) => {
        if (service === "elementRegistry")
          return { getAll: vi.fn().mockReturnValue([]) };
        if (service === "canvas")
          return { getGraphics: vi.fn().mockReturnValue(null) };
        return null;
      });

      vi.mocked(utils.canEditElement).mockReturnValue(false);

      renderHook(() =>
        useBpmnModeler({
          container,
          initialXml: SAMPLE_XML,
        }),
      );

      await waitFor(() => {
        expect(eventHandlers["commandStack.preExecute"]).toBeDefined();
      });

      // Act & Assert
      const mockEvent = {
        context: {
          shape: { id: "LockedTask_1" },
        },
      };

      expect(() => {
        eventHandlers["commandStack.preExecute"](mockEvent);
      }).toThrow("Element LockedTask_1 is locked");
    });

    it("should allow commands on editable elements", async () => {
      // Arrange
      // Mock the get method to return appropriate services
      mockGet.mockImplementation((service: string) => {
        if (service === "elementRegistry")
          return { getAll: vi.fn().mockReturnValue([]) };
        if (service === "canvas")
          return { getGraphics: vi.fn().mockReturnValue(null) };
        return null;
      });

      vi.mocked(utils.canEditElement).mockReturnValue(true);

      renderHook(() =>
        useBpmnModeler({
          container,
          initialXml: SAMPLE_XML,
        }),
      );

      await waitFor(() => {
        expect(eventHandlers["commandStack.preExecute"]).toBeDefined();
      });

      // Act & Assert
      const mockEvent = {
        context: {
          shape: { id: "Task_1" },
        },
      };

      expect(() => {
        eventHandlers["commandStack.preExecute"](mockEvent);
      }).not.toThrow();
    });
  });

  describe("Visual Styling", () => {
    it("should apply styling to locked and unlocked elements", async () => {
      // Arrange
      const mockElement1 = {
        id: "Task_1",
        style: { opacity: "", cursor: "", filter: "" },
        querySelectorAll: vi.fn().mockReturnValue([]),
      };
      const mockElement2 = {
        id: "LockedTask_1",
        style: { opacity: "", cursor: "", filter: "" },
        querySelectorAll: vi
          .fn()
          .mockReturnValue([
            { style: { cursor: "" } },
            { style: { cursor: "" } },
          ]),
      };

      const mockCanvas = {
        getGraphics: vi
          .fn()
          .mockReturnValueOnce(mockElement1)
          .mockReturnValueOnce(mockElement2),
      };

      const mockElementRegistry = {
        getAll: vi
          .fn()
          .mockReturnValue([{ id: "Task_1" }, { id: "LockedTask_1" }]),
      };

      mockGet.mockImplementation((service: string) => {
        if (service === "canvas") return mockCanvas;
        if (service === "elementRegistry") return mockElementRegistry;
        return null;
      });

      vi.mocked(utils.canEditElement).mockImplementation(
        (elementId: string) => elementId === "Task_1",
      );

      // Act
      renderHook(() =>
        useBpmnModeler({
          container,
          initialXml: SAMPLE_XML,
        }),
      );

      // Assert
      await waitFor(() => {
        // Editable element
        expect(mockElement1.style.opacity).toBe("1");
        expect(mockElement1.style.cursor).toBe("");

        // Locked element
        expect(mockElement2.style.opacity).toBe("0.4");
        expect(mockElement2.style.cursor).toBe("not-allowed");
      });
    });

    it("should reapply styling when lockedElements change", async () => {
      // Arrange
      const mockElement = {
        id: "Task_1",
        style: { opacity: "", cursor: "", filter: "" },
        querySelectorAll: vi.fn().mockReturnValue([]),
      };

      const mockCanvas = {
        getGraphics: vi.fn().mockReturnValue(mockElement),
      };

      const mockElementRegistry = {
        getAll: vi.fn().mockReturnValue([{ id: "Task_1" }]),
      };

      mockGet.mockImplementation((service: string) => {
        if (service === "canvas") return mockCanvas;
        if (service === "elementRegistry") return mockElementRegistry;
        return null;
      });

      // Initially editable
      vi.mocked(utils.canEditElement).mockReturnValue(true);

      const { rerender } = renderHook(() =>
        useBpmnModeler({
          container,
          initialXml: SAMPLE_XML,
        }),
      );

      await waitFor(() => {
        expect(mockElement.style.opacity).toBe("1");
      });

      // Act - Make element locked
      vi.mocked(utils.canEditElement).mockReturnValue(false);
      mockUseEditor.lockedElements = { Task_1: "user2" };

      rerender();

      // Assert
      await waitFor(() => {
        expect(mockElement.style.opacity).toBe("0.4");
      });
    });
  });
});

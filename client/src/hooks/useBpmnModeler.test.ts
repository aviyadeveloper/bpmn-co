/**
 * useBpmnModeler Hook Tests
 *
 * Tests the BPMN modeler initialization and XML synchronization:
 * - Modeler initialization with container
 * - Loading initial XML
 * - Handling user changes (onChange callback)
 * - Loading external XML updates without triggering onChange
 * - Cleanup on unmount
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useBpmnModeler } from "./useBpmnModeler";

// Initialize mock functions first
const mockImportXML = vi.fn();
const mockSaveXML = vi.fn();
const mockDestroy = vi.fn();
const mockOn = vi.fn();

// Store event handlers
let eventHandlers: Record<string, Function> = {};

// Mock the BPMN modeler module
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

      on(event: string, handler: Function) {
        eventHandlers[event] = handler;
        return mockOn(event, handler);
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

  beforeEach(() => {
    vi.clearAllMocks();

    // Set up default mock return values
    mockImportXML.mockResolvedValue({ warnings: [] });
    mockSaveXML.mockResolvedValue({ xml: "<test>saved</test>" });
    mockDestroy.mockReturnValue(undefined);
    mockOn.mockReturnValue(undefined);

    // Clear event handlers
    eventHandlers = {};

    // Create a mock container
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (container && container.parentNode) {
      document.body.removeChild(container);
    }
  });

  describe("Initialization", () => {
    it("should not initialize modeler when container is null", () => {
      const { result } = renderHook(() =>
        useBpmnModeler({
          container: null,
          initialXml: SAMPLE_XML,
        }),
      );

      expect(result.current.modeler.current).toBeNull();
      expect(mockImportXML).not.toHaveBeenCalled();
    });

    it("should initialize modeler when container is provided", async () => {
      const { result } = renderHook(() =>
        useBpmnModeler({
          container,
          initialXml: SAMPLE_XML,
        }),
      );

      await waitFor(() => {
        expect(result.current.modeler.current).not.toBeNull();
      });

      expect(mockImportXML).toHaveBeenCalledWith(SAMPLE_XML);
    });

    it("should register event listeners on initialization", async () => {
      renderHook(() =>
        useBpmnModeler({
          container,
          initialXml: SAMPLE_XML,
        }),
      );

      await waitFor(() => {
        expect(mockOn).toHaveBeenCalledWith(
          "selection.changed",
          expect.any(Function),
        );
        expect(mockOn).toHaveBeenCalledWith(
          "commandStack.postExecuted",
          expect.any(Function),
        );
        expect(mockOn).toHaveBeenCalledWith(
          "commandStack.changed",
          expect.any(Function),
        );
      });
    });

    it("should handle import XML errors gracefully", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      mockImportXML.mockRejectedValueOnce(new Error("Invalid XML"));

      renderHook(() =>
        useBpmnModeler({
          container,
          initialXml: "invalid xml",
        }),
      );

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe("onChange Callback", () => {
    it("should call onChange when commandStack.changed fires", async () => {
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

      // Simulate a command stack change
      await act(async () => {
        await eventHandlers["commandStack.changed"]();
      });

      await waitFor(() => {
        expect(mockSaveXML).toHaveBeenCalledWith({ format: true });
        expect(onChangeMock).toHaveBeenCalledWith("<test>saved</test>");
      });
    });

    it("should NOT call onChange if callback is not provided", async () => {
      renderHook(() =>
        useBpmnModeler({
          container,
          initialXml: SAMPLE_XML,
          // No onChange provided
        }),
      );

      await waitFor(() => {
        expect(eventHandlers["commandStack.changed"]).toBeDefined();
      });

      // Should not throw error when onChange is undefined
      await act(async () => {
        await eventHandlers["commandStack.changed"]();
      });

      expect(mockSaveXML).toHaveBeenCalled();
      // No error should be thrown
    });

    it("should update onChange callback when it changes", async () => {
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

      // Trigger with first callback
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

      await waitFor(() => {
        expect(onChangeMock2).toHaveBeenCalled();
      });
    });
  });

  describe("loadXml Function", () => {
    it("should load XML without triggering onChange", async () => {
      const onChangeMock = vi.fn();
      const newXml = "<bpmn:definitions><bpmn:task/></bpmn:definitions>";

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

      // Clear previous calls
      mockImportXML.mockClear();
      onChangeMock.mockClear();

      // Load external XML
      await act(async () => {
        await result.current.loadXml(newXml);
      });

      expect(mockImportXML).toHaveBeenCalledWith(newXml);

      // Simulate commandStack.changed firing during import
      await act(async () => {
        await eventHandlers["commandStack.changed"]();
      });

      // onChange should NOT be called (external update flag should be set)
      // Wait a bit to ensure it doesn't get called
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(onChangeMock).not.toHaveBeenCalled();
    });

    it("should re-enable onChange after loadXml completes", async () => {
      const onChangeMock = vi.fn();
      const newXml = "<bpmn:definitions><bpmn:task/></bpmn:definitions>";

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

      // Load external XML
      await act(async () => {
        await result.current.loadXml(newXml);
      });

      // Wait for the unlock timeout (300ms + buffer)
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 350));
      });

      // Now onChange should work again
      await act(async () => {
        await eventHandlers["commandStack.changed"]();
      });

      await waitFor(() => {
        expect(onChangeMock).toHaveBeenCalled();
      });
    });

    it("should handle loadXml errors gracefully", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const { result } = renderHook(() =>
        useBpmnModeler({
          container,
          initialXml: SAMPLE_XML,
        }),
      );

      await waitFor(() => {
        expect(result.current.modeler.current).not.toBeNull();
      });

      // Now set up the mock to fail on the NEXT call (which is loadXml)
      mockImportXML.mockRejectedValueOnce(new Error("Import failed"));

      // Load XML that will fail
      await act(async () => {
        await result.current.loadXml("invalid");
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to load XML:",
        expect.objectContaining({ message: "Import failed" }),
      );

      consoleErrorSpy.mockRestore();
    });

    it("should do nothing if modeler is not initialized", async () => {
      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      const { result } = renderHook(() =>
        useBpmnModeler({
          container: null, // No container = no modeler
          initialXml: SAMPLE_XML,
        }),
      );

      // Try to load XML
      await act(async () => {
        await result.current.loadXml("<test/>");
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "⚠️ Cannot load XML: modeler not initialized",
      );
      expect(mockImportXML).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });

  describe("Event Handlers", () => {
    it("should log selection changes", async () => {
      const consoleGroupSpy = vi
        .spyOn(console, "group")
        .mockImplementation(() => {});
      const consoleLogSpy = vi
        .spyOn(console, "log")
        .mockImplementation(() => {});
      const consoleGroupEndSpy = vi
        .spyOn(console, "groupEnd")
        .mockImplementation(() => {});

      renderHook(() =>
        useBpmnModeler({
          container,
          initialXml: SAMPLE_XML,
        }),
      );

      await waitFor(() => {
        expect(eventHandlers["selection.changed"]).toBeDefined();
      });

      // Simulate selection change with elements
      const mockEvent = {
        newSelection: [
          { id: "Task_1", type: "bpmn:Task" },
          { id: "StartEvent_1", type: "bpmn:StartEvent" },
        ],
      };

      act(() => {
        eventHandlers["selection.changed"](mockEvent);
      });

      // Check immediately (no need to wait)
      expect(consoleGroupSpy).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "✅ Selected:",
        expect.any(Array),
      );
      expect(consoleGroupEndSpy).toHaveBeenCalled();

      consoleGroupSpy.mockRestore();
      consoleLogSpy.mockRestore();
      consoleGroupEndSpy.mockRestore();
    });

    it("should handle deselection", async () => {
      const consoleLogSpy = vi
        .spyOn(console, "log")
        .mockImplementation(() => {});

      renderHook(() =>
        useBpmnModeler({
          container,
          initialXml: SAMPLE_XML,
        }),
      );

      await waitFor(() => {
        expect(eventHandlers["selection.changed"]).toBeDefined();
      });

      // Simulate deselection
      const mockEvent = {
        newSelection: [],
      };

      act(() => {
        eventHandlers["selection.changed"](mockEvent);
      });

      // Check immediately
      expect(consoleLogSpy).toHaveBeenCalledWith("❌ Deselected all");

      consoleLogSpy.mockRestore();
    });

    it("should log command execution", async () => {
      const consoleLogSpy = vi
        .spyOn(console, "log")
        .mockImplementation(() => {});

      renderHook(() =>
        useBpmnModeler({
          container,
          initialXml: SAMPLE_XML,
        }),
      );

      await waitFor(() => {
        expect(eventHandlers["commandStack.postExecuted"]).toBeDefined();
      });

      // Simulate command execution
      const mockEvent = {
        command: "shape.create",
      };

      act(() => {
        eventHandlers["commandStack.postExecuted"](mockEvent);
      });

      // Check immediately
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "🔄 Command executed:",
        "shape.create",
      );

      consoleLogSpy.mockRestore();
    });
  });

  describe("Cleanup", () => {
    it("should destroy modeler on unmount", async () => {
      const { unmount } = renderHook(() =>
        useBpmnModeler({
          container,
          initialXml: SAMPLE_XML,
        }),
      );

      await waitFor(() => {
        expect(mockDestroy).not.toHaveBeenCalled();
      });

      unmount();

      expect(mockDestroy).toHaveBeenCalled();
    });

    it("should reinitialize modeler when container changes", async () => {
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

      // Change container
      rerender({ container: container2 });

      await waitFor(() => {
        expect(mockDestroy).toHaveBeenCalled();
        expect(mockImportXML).toHaveBeenCalledTimes(2);
      });

      document.body.removeChild(container1);
      document.body.removeChild(container2);
    });
  });

  describe("External Update Flag", () => {
    it("should prevent onChange during external updates", async () => {
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

      // Start loading external XML
      await act(async () => {
        await result.current.loadXml("<new>xml</new>");
      });

      // Immediately trigger commandStack.changed (before the unlock timeout)
      await act(async () => {
        await eventHandlers["commandStack.changed"]();
      });

      // Should NOT call onChange (still locked)
      expect(onChangeMock).not.toHaveBeenCalled();

      // Wait for unlock timeout
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 350));
      });

      // Now trigger again - should work
      await act(async () => {
        await eventHandlers["commandStack.changed"]();
      });

      await waitFor(() => {
        expect(onChangeMock).toHaveBeenCalled();
      });
    });
  });
});

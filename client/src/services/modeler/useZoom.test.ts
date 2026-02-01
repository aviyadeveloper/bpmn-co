import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useZoom } from "./useZoom";
import { modelerStore } from "./modelerStore";
import BpmnJS from "bpmn-js/lib/Modeler";

vi.mock("bpmn-js/lib/Modeler");

describe("useZoom", () => {
  let mockModeler: any;
  let mockZoomScroll: any;
  let consoleWarnSpy: any;

  beforeEach(() => {
    mockZoomScroll = {
      stepZoom: vi.fn(),
    };

    mockModeler = {
      get: vi.fn((service: string) => {
        if (service === "zoomScroll") return mockZoomScroll;
        return null;
      }),
    };

    modelerStore.set(null);
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  describe("zoomIn", () => {
    it("should zoom in when modeler is initialized", () => {
      // Arrange
      modelerStore.set(mockModeler as BpmnJS);
      const { result } = renderHook(() => useZoom());

      // Act
      act(() => {
        result.current.zoomIn();
      });

      // Assert
      expect(mockModeler.get).toHaveBeenCalledWith("zoomScroll");
      expect(mockZoomScroll.stepZoom).toHaveBeenCalledWith(1);
    });

    it("should warn when modeler is not initialized", () => {
      // Arrange
      modelerStore.set(null);
      const { result } = renderHook(() => useZoom());

      // Act
      act(() => {
        result.current.zoomIn();
      });

      // Assert
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Cannot zoom in: modeler not initialized",
      );
      expect(mockZoomScroll.stepZoom).not.toHaveBeenCalled();
    });

    it("should not throw error when modeler is null", () => {
      // Arrange
      modelerStore.set(null);
      const { result } = renderHook(() => useZoom());

      // Act & Assert
      expect(() => {
        act(() => {
          result.current.zoomIn();
        });
      }).not.toThrow();
    });

    it("should be callable multiple times", () => {
      // Arrange
      modelerStore.set(mockModeler as BpmnJS);
      const { result } = renderHook(() => useZoom());

      // Act
      act(() => {
        result.current.zoomIn();
        result.current.zoomIn();
        result.current.zoomIn();
      });

      // Assert
      expect(mockZoomScroll.stepZoom).toHaveBeenCalledTimes(3);
      expect(mockZoomScroll.stepZoom).toHaveBeenCalledWith(1);
    });
  });

  describe("zoomOut", () => {
    it("should zoom out when modeler is initialized", () => {
      // Arrange
      modelerStore.set(mockModeler as BpmnJS);
      const { result } = renderHook(() => useZoom());

      // Act
      act(() => {
        result.current.zoomOut();
      });

      // Assert
      expect(mockModeler.get).toHaveBeenCalledWith("zoomScroll");
      expect(mockZoomScroll.stepZoom).toHaveBeenCalledWith(-1);
    });

    it("should warn when modeler is not initialized", () => {
      // Arrange
      modelerStore.set(null);
      const { result } = renderHook(() => useZoom());

      // Act
      act(() => {
        result.current.zoomOut();
      });

      // Assert
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Cannot zoom out: modeler not initialized",
      );
      expect(mockZoomScroll.stepZoom).not.toHaveBeenCalled();
    });

    it("should not throw error when modeler is null", () => {
      // Arrange
      modelerStore.set(null);
      const { result } = renderHook(() => useZoom());

      // Act & Assert
      expect(() => {
        act(() => {
          result.current.zoomOut();
        });
      }).not.toThrow();
    });

    it("should be callable multiple times", () => {
      // Arrange
      modelerStore.set(mockModeler as BpmnJS);
      const { result } = renderHook(() => useZoom());

      // Act
      act(() => {
        result.current.zoomOut();
        result.current.zoomOut();
        result.current.zoomOut();
      });

      // Assert
      expect(mockZoomScroll.stepZoom).toHaveBeenCalledTimes(3);
      expect(mockZoomScroll.stepZoom).toHaveBeenCalledWith(-1);
    });
  });

  describe("callback stability", () => {
    it("should maintain stable references across re-renders", () => {
      // Arrange
      modelerStore.set(mockModeler as BpmnJS);
      const { result, rerender } = renderHook(() => useZoom());

      // Act
      const firstZoomIn = result.current.zoomIn;
      const firstZoomOut = result.current.zoomOut;

      rerender();

      const secondZoomIn = result.current.zoomIn;
      const secondZoomOut = result.current.zoomOut;

      // Assert
      expect(firstZoomIn).toBe(secondZoomIn);
      expect(firstZoomOut).toBe(secondZoomOut);
    });
  });

  describe("integration", () => {
    it("should handle alternating zoom in and out", () => {
      // Arrange
      modelerStore.set(mockModeler as BpmnJS);
      const { result } = renderHook(() => useZoom());

      // Act
      act(() => {
        result.current.zoomIn();
        result.current.zoomOut();
        result.current.zoomIn();
        result.current.zoomOut();
      });

      // Assert
      expect(mockZoomScroll.stepZoom).toHaveBeenCalledTimes(4);
      expect(mockZoomScroll.stepZoom).toHaveBeenNthCalledWith(1, 1);
      expect(mockZoomScroll.stepZoom).toHaveBeenNthCalledWith(2, -1);
      expect(mockZoomScroll.stepZoom).toHaveBeenNthCalledWith(3, 1);
      expect(mockZoomScroll.stepZoom).toHaveBeenNthCalledWith(4, -1);
    });

    it("should work after modeler is set dynamically", () => {
      // Arrange
      modelerStore.set(null);
      const { result } = renderHook(() => useZoom());

      // Act - try zooming with no modeler
      act(() => {
        result.current.zoomIn();
      });
      expect(mockZoomScroll.stepZoom).not.toHaveBeenCalled();

      // Set modeler
      modelerStore.set(mockModeler as BpmnJS);

      // Act - try zooming with modeler
      act(() => {
        result.current.zoomIn();
      });

      // Assert
      expect(mockZoomScroll.stepZoom).toHaveBeenCalledTimes(1);
      expect(mockZoomScroll.stepZoom).toHaveBeenCalledWith(1);
    });
  });
});

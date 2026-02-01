import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useEditor } from "./useEditor";
import { useEditorStore } from "./editorStore";
import { useMainStore } from "../main/mainStore";
import type { ServerToClientMessage } from "../../types";
import { ReadyState } from "react-use-websocket";

// Mock dependencies
vi.mock("react-use-websocket");
vi.mock("../main/mainStore");

const mockSendMessage = vi.fn();
let mockOnMessage: ((event: MessageEvent) => void) | undefined;

// Mock WebSocket hook return value
const createMockWebSocketReturn = (readyState = ReadyState.OPEN) => ({
  sendMessage: mockSendMessage,
  readyState,
  lastMessage: null,
  lastJsonMessage: null,
  sendJsonMessage: vi.fn(),
  getWebSocket: vi.fn(() => null),
});

describe("useEditor", () => {
  beforeEach(async () => {
    useEditorStore.getState().reset();
    mockSendMessage.mockClear();
    mockOnMessage = undefined;

    // Mock useMainStore
    vi.mocked(useMainStore).mockReturnValue({
      selectedTemplate: null,
      editorOpened: true,
      setSelectedTemplate: vi.fn(),
      setEditorOpened: vi.fn(),
    } as any);

    // Dynamically import and mock useWebSocket
    const websocketModule = await import("react-use-websocket");
    vi.mocked(websocketModule.default).mockImplementation((_url, options) => {
      if (options) {
        mockOnMessage = options.onMessage;
      }
      return createMockWebSocketReturn();
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("initialization", () => {
    it("should return initial state values", () => {
      // Arrange & Act
      const { result } = renderHook(() => useEditor());

      // Assert
      expect(result.current.userId).toBe("");
      expect(result.current.userName).toBe("");
      expect(result.current.users).toEqual({});
      expect(result.current.lockedElements).toEqual({});
      expect(result.current.template).toBe("");
      expect(result.current.isInitialized).toBe(false);
    });

    it("should set connection status when WebSocket is open", async () => {
      // Arrange & Act
      const { result } = renderHook(() => useEditor());

      // Assert
      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });
    });

    it("should connect to WebSocket without template by default", async () => {
      // Arrange
      const websocketModule = await import("react-use-websocket");

      // Act
      renderHook(() => useEditor());

      // Assert
      expect(vi.mocked(websocketModule.default)).toHaveBeenCalledWith(
        "ws://localhost:8000/ws",
        expect.objectContaining({
          share: true,
          reconnectAttempts: 10,
          reconnectInterval: 1000,
        }),
        true,
      );
    });

    it("should connect to WebSocket with template when selected", async () => {
      // Arrange
      vi.mocked(useMainStore).mockReturnValue({
        selectedTemplate: "simple-process",
        editorOpened: true,
        setSelectedTemplate: vi.fn(),
        setEditorOpened: vi.fn(),
      } as any);
      const websocketModule = await import("react-use-websocket");

      // Act
      renderHook(() => useEditor());

      // Assert
      expect(vi.mocked(websocketModule.default)).toHaveBeenCalledWith(
        "ws://localhost:8000/ws?template=simple-process",
        expect.any(Object),
        true,
      );
    });

    it("should not connect when editor is not opened", async () => {
      // Arrange
      vi.mocked(useMainStore).mockReturnValue({
        selectedTemplate: null,
        editorOpened: false,
        setSelectedTemplate: vi.fn(),
        setEditorOpened: vi.fn(),
      } as any);
      const websocketModule = await import("react-use-websocket");

      // Act
      renderHook(() => useEditor());

      // Assert
      expect(vi.mocked(websocketModule.default)).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        false,
      );
    });
  });

  describe("message handling - init", () => {
    it("should handle init message", async () => {
      // Arrange
      const { result } = renderHook(() => useEditor());
      const initMessage: ServerToClientMessage = {
        type: "init",
        user_id: "user-123",
        user_name: "Test User",
        users: { "user-123": "Test User", "user-456": "Other User" },
        locked_elements: { "element-1": "user-456" },
        xml: "<bpmn>test</bpmn>",
        template: "simple-process",
        is_initialized: true,
      };

      // Act
      act(() => {
        mockOnMessage?.(
          new MessageEvent("message", { data: JSON.stringify(initMessage) }),
        );
      });

      // Assert
      await waitFor(() => {
        expect(result.current.userId).toBe("user-123");
        expect(result.current.userName).toBe("Test User");
        expect(result.current.users).toEqual({
          "user-123": "Test User",
          "user-456": "Other User",
        });
        expect(result.current.lockedElements).toEqual({
          "element-1": "user-456",
        });
        expect(result.current.xml).toBe("<bpmn>test</bpmn>");
        expect(result.current.template).toBe("simple-process");
        expect(result.current.isInitialized).toBe(true);
      });
    });
  });

  describe("message handling - xml_update", () => {
    it("should handle xml update message", async () => {
      // Arrange
      const { result } = renderHook(() => useEditor());
      const xmlUpdateMessage: ServerToClientMessage = {
        type: "xml_update",
        xml: "<bpmn>updated xml</bpmn>",
      };

      // Act
      act(() => {
        mockOnMessage?.(
          new MessageEvent("message", {
            data: JSON.stringify(xmlUpdateMessage),
          }),
        );
      });

      // Assert
      await waitFor(() => {
        expect(result.current.xml).toBe("<bpmn>updated xml</bpmn>");
      });
    });
  });

  describe("message handling - users_update", () => {
    it("should handle users update message", async () => {
      // Arrange
      const { result } = renderHook(() => useEditor());
      const usersUpdateMessage: ServerToClientMessage = {
        type: "users_update",
        users: { "user-1": "Alice", "user-2": "Bob" },
      };

      // Act
      act(() => {
        mockOnMessage?.(
          new MessageEvent("message", {
            data: JSON.stringify(usersUpdateMessage),
          }),
        );
      });

      // Assert
      await waitFor(() => {
        expect(result.current.users).toEqual({
          "user-1": "Alice",
          "user-2": "Bob",
        });
      });
    });

    it("should update current user name when users list changes", async () => {
      // Arrange
      const { result } = renderHook(() => useEditor());

      // Initialize with user
      const initMessage: ServerToClientMessage = {
        type: "init",
        user_id: "user-123",
        user_name: "Original Name",
        users: { "user-123": "Original Name" },
        locked_elements: {},
        xml: "",
        template: "",
        is_initialized: false,
      };

      act(() => {
        mockOnMessage?.(
          new MessageEvent("message", { data: JSON.stringify(initMessage) }),
        );
      });

      await waitFor(() => {
        expect(result.current.userId).toBe("user-123");
      });

      // Act - update users with new name for current user
      const usersUpdateMessage: ServerToClientMessage = {
        type: "users_update",
        users: { "user-123": "Updated Name" },
      };

      act(() => {
        mockOnMessage?.(
          new MessageEvent("message", {
            data: JSON.stringify(usersUpdateMessage),
          }),
        );
      });

      // Assert
      await waitFor(() => {
        expect(result.current.userName).toBe("Updated Name");
      });
    });
  });

  describe("message handling - locked_elements_update", () => {
    it("should handle locked elements update message", async () => {
      // Arrange
      const { result } = renderHook(() => useEditor());
      const lockedElementsMessage: ServerToClientMessage = {
        type: "locked_elements_update",
        locked_elements: { "element-1": "user-1", "element-2": "user-2" },
      };

      // Act
      act(() => {
        mockOnMessage?.(
          new MessageEvent("message", {
            data: JSON.stringify(lockedElementsMessage),
          }),
        );
      });

      // Assert
      await waitFor(() => {
        expect(result.current.lockedElements).toEqual({
          "element-1": "user-1",
          "element-2": "user-2",
        });
      });
    });
  });

  describe("message handling - error", () => {
    it("should log error message to console", () => {
      // Arrange
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      renderHook(() => useEditor());
      const errorMessage: ServerToClientMessage = {
        type: "error",
        message: "Test error message",
      };

      // Act
      act(() => {
        mockOnMessage?.(
          new MessageEvent("message", { data: JSON.stringify(errorMessage) }),
        );
      });

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[useEditor] Server error:",
        "Test error message",
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe("message handling - invalid messages", () => {
    it("should handle invalid JSON gracefully", () => {
      // Arrange
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      renderHook(() => useEditor());

      // Act
      act(() => {
        mockOnMessage?.(new MessageEvent("message", { data: "invalid json{" }));
      });

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[useEditor] Failed to parse message:",
        expect.any(Error),
        "Raw message:",
        "invalid json{",
      );

      consoleErrorSpy.mockRestore();
    });

    it("should handle unknown message type", () => {
      // Arrange
      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});
      renderHook(() => useEditor());
      const unknownMessage = { type: "unknown_type", data: "test" };

      // Act
      act(() => {
        mockOnMessage?.(
          new MessageEvent("message", { data: JSON.stringify(unknownMessage) }),
        );
      });

      // Assert
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "[useEditor] Unknown message type:",
        unknownMessage,
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe("sendXmlUpdate", () => {
    it("should send xml update message when connected", () => {
      // Arrange
      const { result } = renderHook(() => useEditor());
      const testXml = "<bpmn>test content</bpmn>";

      // Act
      act(() => {
        result.current.sendXmlUpdate(testXml);
      });

      // Assert
      expect(mockSendMessage).toHaveBeenCalledWith(
        JSON.stringify({ type: "xml_update", xml: testXml }),
      );
    });

    it("should not send when disconnected", async () => {
      // Arrange
      const websocketModule = await import("react-use-websocket");
      vi.mocked(websocketModule.default).mockReturnValue(
        createMockWebSocketReturn(ReadyState.CLOSED),
      );
      const { result } = renderHook(() => useEditor());

      // Act
      act(() => {
        result.current.sendXmlUpdate("<bpmn>test</bpmn>");
      });

      // Assert
      expect(mockSendMessage).not.toHaveBeenCalled();
    });
  });

  describe("sendUserNameUpdate", () => {
    it("should send user name update message", () => {
      // Arrange
      const { result } = renderHook(() => useEditor());
      const newName = "New User Name";

      // Act
      act(() => {
        result.current.sendUserNameUpdate(newName);
      });

      // Assert
      expect(mockSendMessage).toHaveBeenCalledWith(
        JSON.stringify({ type: "user_name_update", name: newName }),
      );
    });
  });

  describe("sendElementSelect", () => {
    it("should send element select message with single element", () => {
      // Arrange
      const { result } = renderHook(() => useEditor());
      const elementId = "element-123";

      // Act
      act(() => {
        result.current.sendElementSelect(elementId);
      });

      // Assert
      expect(mockSendMessage).toHaveBeenCalledWith(
        JSON.stringify({ type: "element_select", element_ids: [elementId] }),
      );
    });

    it("should send element select message with multiple elements", () => {
      // Arrange
      const { result } = renderHook(() => useEditor());
      const elementIds = ["element-1", "element-2", "element-3"];

      // Act
      act(() => {
        result.current.sendElementSelect(elementIds);
      });

      // Assert
      expect(mockSendMessage).toHaveBeenCalledWith(
        JSON.stringify({ type: "element_select", element_ids: elementIds }),
      );
    });

    it("should handle empty array", () => {
      // Arrange
      const { result } = renderHook(() => useEditor());

      // Act
      act(() => {
        result.current.sendElementSelect([]);
      });

      // Assert
      expect(mockSendMessage).toHaveBeenCalledWith(
        JSON.stringify({ type: "element_select", element_ids: [] }),
      );
    });
  });

  describe("sendElementDeselect", () => {
    it("should send element deselect message", () => {
      // Arrange
      const { result } = renderHook(() => useEditor());
      const elementId = "element-123";

      // Act
      act(() => {
        result.current.sendElementDeselect(elementId);
      });

      // Assert
      expect(mockSendMessage).toHaveBeenCalledWith(
        JSON.stringify({ type: "element_deselect", element_id: elementId }),
      );
    });
  });

  describe("connection states", () => {
    it("should handle CONNECTING state", async () => {
      // Arrange
      const websocketModule = await import("react-use-websocket");
      vi.mocked(websocketModule.default).mockReturnValue(
        createMockWebSocketReturn(ReadyState.CONNECTING),
      );

      // Act
      const { result } = renderHook(() => useEditor());

      // Assert
      expect(result.current.isConnected).toBe(false);
    });

    it("should handle CLOSING state", async () => {
      // Arrange
      const websocketModule = await import("react-use-websocket");
      vi.mocked(websocketModule.default).mockReturnValue(
        createMockWebSocketReturn(ReadyState.CLOSING),
      );

      // Act
      const { result } = renderHook(() => useEditor());

      // Assert
      expect(result.current.isConnected).toBe(false);
    });

    it("should handle CLOSED state", async () => {
      // Arrange
      const websocketModule = await import("react-use-websocket");
      vi.mocked(websocketModule.default).mockReturnValue(
        createMockWebSocketReturn(ReadyState.CLOSED),
      );

      // Act
      const { result } = renderHook(() => useEditor());

      // Assert
      expect(result.current.isConnected).toBe(false);
    });
  });

  describe("WebSocket configuration", () => {
    it("should configure reconnection properly", async () => {
      // Arrange
      const websocketModule = await import("react-use-websocket");

      // Act
      renderHook(() => useEditor());

      // Assert
      const config = vi.mocked(websocketModule.default).mock.calls[0][1];
      expect(config?.shouldReconnect).toBeDefined();
      if (config?.shouldReconnect) {
        expect(config.shouldReconnect({} as CloseEvent)).toBe(true);
      }
      expect(config?.reconnectAttempts).toBe(10);
      expect(config?.reconnectInterval).toBe(1000);
    });

    it("should share WebSocket connection", async () => {
      // Arrange
      const websocketModule = await import("react-use-websocket");

      // Act
      renderHook(() => useEditor());

      // Assert
      const config = vi.mocked(websocketModule.default).mock.calls[0][1];
      expect(config?.share).toBe(true);
    });

    it("should have onError handler", async () => {
      // Arrange
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const websocketModule = await import("react-use-websocket");
      renderHook(() => useEditor());

      // Act
      const config = vi.mocked(websocketModule.default).mock.calls[0][1];
      const mockErrorEvent = new Event("error");
      config?.onError?.(mockErrorEvent);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[useEditor] WebSocket error:",
        mockErrorEvent,
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe("integration scenarios", () => {
    it("should handle complete init and update flow", async () => {
      // Arrange
      const { result } = renderHook(() => useEditor());

      // Act - init
      const initMessage: ServerToClientMessage = {
        type: "init",
        user_id: "user-123",
        user_name: "Alice",
        users: { "user-123": "Alice" },
        locked_elements: {},
        xml: "<bpmn>initial</bpmn>",
        template: "blank",
        is_initialized: true,
      };

      act(() => {
        mockOnMessage?.(
          new MessageEvent("message", { data: JSON.stringify(initMessage) }),
        );
      });

      await waitFor(() => {
        expect(result.current.userId).toBe("user-123");
      });

      // Act - xml update
      const xmlUpdate: ServerToClientMessage = {
        type: "xml_update",
        xml: "<bpmn>updated</bpmn>",
      };

      act(() => {
        mockOnMessage?.(
          new MessageEvent("message", { data: JSON.stringify(xmlUpdate) }),
        );
      });

      // Assert
      await waitFor(() => {
        expect(result.current.xml).toBe("<bpmn>updated</bpmn>");
        expect(result.current.userId).toBe("user-123");
        expect(result.current.template).toBe("blank");
      });
    });

    it("should send multiple messages in sequence", () => {
      // Arrange
      const { result } = renderHook(() => useEditor());

      // Act
      act(() => {
        result.current.sendUserNameUpdate("Alice");
        result.current.sendElementSelect("element-1");
        result.current.sendXmlUpdate("<bpmn>test</bpmn>");
      });

      // Assert
      expect(mockSendMessage).toHaveBeenCalledTimes(3);
      expect(mockSendMessage).toHaveBeenNthCalledWith(
        1,
        JSON.stringify({ type: "user_name_update", name: "Alice" }),
      );
      expect(mockSendMessage).toHaveBeenNthCalledWith(
        2,
        JSON.stringify({ type: "element_select", element_ids: ["element-1"] }),
      );
      expect(mockSendMessage).toHaveBeenNthCalledWith(
        3,
        JSON.stringify({ type: "xml_update", xml: "<bpmn>test</bpmn>" }),
      );
    });
  });
});

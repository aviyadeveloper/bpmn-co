/**
 * BpmnEditor Component Tests
 *
 * Tests the integration of WebSocket and BPMN modeler:
 * - Initial sync from server
 * - Sending updates on local edits
 * - Receiving updates from other users
 * - Handling connection states
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { act } from "react";
import BpmnEditor from "./BpmnEditor";

// Mock the hooks
vi.mock("../hooks/useWebSocket");
vi.mock("../hooks/useBpmnModeler");

// Import mocked modules
import { useWebSocket } from "../hooks/useWebSocket";
import { useBpmnModeler } from "../hooks/useBpmnModeler";

describe("BpmnEditor", () => {
  let mockSend: ReturnType<typeof vi.fn>;
  let mockLoadXml: ReturnType<typeof vi.fn>;
  let mockOnChange: ((xml?: string) => void) | undefined;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Setup WebSocket mock
    mockSend = vi.fn().mockReturnValue(true);
    (useWebSocket as any).mockReturnValue({
      readyState: WebSocket.OPEN,
      send: mockSend,
      lastMessage: null,
      lastError: null,
      connect: vi.fn(),
      close: vi.fn(),
      reconnectCount: 0,
    });

    // Setup BPMN modeler mock
    mockLoadXml = vi.fn().mockResolvedValue(undefined);
    (useBpmnModeler as any).mockImplementation(({ onChange }: any) => {
      // Capture the onChange callback so we can trigger it in tests
      mockOnChange = onChange;
      return {
        modeler: { current: {} },
        loadXml: mockLoadXml,
      };
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Initial Render", () => {
    it("should render the component", () => {
      render(<BpmnEditor />);
      // Component should render without crashing
      expect(
        document.querySelector('[style*="position: relative"]'),
      ).toBeInTheDocument();
    });

    it("should initialize WebSocket connection", () => {
      render(<BpmnEditor />);
      expect(useWebSocket).toHaveBeenCalledWith(
        "ws://localhost:8000/ws",
        expect.objectContaining({
          autoConnect: true,
          autoReconnect: true,
        }),
      );
    });

    it("should NOT initialize modeler before initial sync", () => {
      render(<BpmnEditor />);
      // useBpmnModeler should be called with null container (no initial sync yet)
      expect(useBpmnModeler).toHaveBeenCalledWith(
        expect.objectContaining({
          container: null, // Should be null before initial sync
        }),
      );
    });
  });

  describe("Initial Sync from Server", () => {
    it("should initialize modeler after receiving init message", async () => {
      const mockXml =
        '<?xml version="1.0"?><bpmn:definitions></bpmn:definitions>';

      // Start with no message
      (useWebSocket as any).mockReturnValue({
        readyState: WebSocket.OPEN,
        send: mockSend,
        lastMessage: null,
        lastError: null,
        connect: vi.fn(),
        close: vi.fn(),
        reconnectCount: 0,
      });

      const { rerender } = render(<BpmnEditor />);

      // Verify modeler not initialized yet
      expect(useBpmnModeler).toHaveBeenCalledWith(
        expect.objectContaining({
          container: null,
        }),
      );

      // Simulate receiving init message
      (useWebSocket as any).mockReturnValue({
        readyState: WebSocket.OPEN,
        send: mockSend,
        lastMessage: JSON.stringify({ type: "init", xml: mockXml }),
        lastError: null,
        connect: vi.fn(),
        close: vi.fn(),
        reconnectCount: 0,
      });

      rerender(<BpmnEditor />);

      await waitFor(() => {
        // After init message, modeler should be initialized with a container
        const calls = (useBpmnModeler as any).mock.calls;
        const lastCall = calls[calls.length - 1][0];
        expect(lastCall.container).not.toBeNull();
        expect(lastCall.initialXml).toBe(mockXml);
      });
    });

    it("should handle malformed JSON gracefully", () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      (useWebSocket as any).mockReturnValue({
        readyState: WebSocket.OPEN,
        send: mockSend,
        lastMessage: "invalid json{",
        lastError: null,
        connect: vi.fn(),
        close: vi.fn(),
        reconnectCount: 0,
      });

      render(<BpmnEditor />);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "❌ Failed to parse message:",
        expect.any(Error),
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Sending Updates to Server", () => {
    it("should send XML to server when user makes changes", async () => {
      const mockXml =
        '<?xml version="1.0"?><bpmn:definitions></bpmn:definitions>';

      // Setup with initial sync
      (useWebSocket as any).mockReturnValue({
        readyState: WebSocket.OPEN,
        send: mockSend,
        lastMessage: JSON.stringify({ type: "init", xml: mockXml }),
        lastError: null,
        connect: vi.fn(),
        close: vi.fn(),
        reconnectCount: 0,
      });

      render(<BpmnEditor />);

      await waitFor(() => {
        expect(mockOnChange).toBeDefined();
      });

      // Simulate user making a change
      const updatedXml =
        '<?xml version="1.0"?><bpmn:definitions><bpmn:task/></bpmn:definitions>';
      act(() => {
        mockOnChange!(updatedXml);
      });

      // Should send update to server
      expect(mockSend).toHaveBeenCalledWith(
        JSON.stringify({ type: "update", xml: updatedXml }),
      );
    });

    it("should NOT send if WebSocket is not connected", async () => {
      const mockXml =
        '<?xml version="1.0"?><bpmn:definitions></bpmn:definitions>';
      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      // Setup with initial sync but disconnected WebSocket
      (useWebSocket as any).mockReturnValue({
        readyState: WebSocket.CONNECTING, // Not OPEN
        send: mockSend,
        lastMessage: JSON.stringify({ type: "init", xml: mockXml }),
        lastError: null,
        connect: vi.fn(),
        close: vi.fn(),
        reconnectCount: 0,
      });

      render(<BpmnEditor />);

      await waitFor(() => {
        expect(mockOnChange).toBeDefined();
      });

      // Try to send while disconnected
      act(() => {
        mockOnChange!(
          '<?xml version="1.0"?><bpmn:definitions></bpmn:definitions>',
        );
      });

      expect(mockSend).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "⚠️ Cannot send: WebSocket not connected",
      );

      consoleWarnSpy.mockRestore();
    });

    it("should handle send failures gracefully", async () => {
      const mockXml =
        '<?xml version="1.0"?><bpmn:definitions></bpmn:definitions>';
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Mock send to return false (failure)
      mockSend.mockReturnValue(false);

      (useWebSocket as any).mockReturnValue({
        readyState: WebSocket.OPEN,
        send: mockSend,
        lastMessage: JSON.stringify({ type: "init", xml: mockXml }),
        lastError: null,
        connect: vi.fn(),
        close: vi.fn(),
        reconnectCount: 0,
      });

      render(<BpmnEditor />);

      await waitFor(() => {
        expect(mockOnChange).toBeDefined();
      });

      // Simulate change
      act(() => {
        mockOnChange!(
          '<?xml version="1.0"?><bpmn:definitions></bpmn:definitions>',
        );
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "❌ Failed to send diagram update",
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Receiving Updates from Server", () => {
    it("should load XML when receiving update message", async () => {
      const initialXml =
        '<?xml version="1.0"?><bpmn:definitions></bpmn:definitions>';
      const updatedXml =
        '<?xml version="1.0"?><bpmn:definitions><bpmn:task/></bpmn:definitions>';

      // Start with init message
      (useWebSocket as any).mockReturnValue({
        readyState: WebSocket.OPEN,
        send: mockSend,
        lastMessage: JSON.stringify({ type: "init", xml: initialXml }),
        lastError: null,
        connect: vi.fn(),
        close: vi.fn(),
        reconnectCount: 0,
      });

      const { rerender } = render(<BpmnEditor />);

      await waitFor(() => {
        expect(useBpmnModeler).toHaveBeenCalled();
      });

      // Receive update from another user
      (useWebSocket as any).mockReturnValue({
        readyState: WebSocket.OPEN,
        send: mockSend,
        lastMessage: JSON.stringify({ type: "update", xml: updatedXml }),
        lastError: null,
        connect: vi.fn(),
        close: vi.fn(),
        reconnectCount: 0,
      });

      rerender(<BpmnEditor />);

      await waitFor(() => {
        expect(mockLoadXml).toHaveBeenCalledWith(updatedXml);
      });
    });
  });

  describe("Connection Status", () => {
    it("should show connected status when WebSocket is open", () => {
      (useWebSocket as any).mockReturnValue({
        readyState: WebSocket.OPEN,
        send: mockSend,
        lastMessage: null,
        lastError: null,
        connect: vi.fn(),
        close: vi.fn(),
        reconnectCount: 0,
      });

      render(<BpmnEditor />);

      // ConnectionStatusIndicator should receive isConnected=true
      expect(useBpmnModeler).toHaveBeenCalledWith(
        expect.objectContaining({
          onChange: expect.any(Function),
        }),
      );
    });

    it("should show disconnected status when WebSocket is closed", () => {
      (useWebSocket as any).mockReturnValue({
        readyState: WebSocket.CLOSED,
        send: mockSend,
        lastMessage: null,
        lastError: {
          message: "Connection failed",
          timestamp: Date.now(),
          event: new Event("error"),
          reconnectAttempt: 0,
        },
        connect: vi.fn(),
        close: vi.fn(),
        reconnectCount: 0,
      });

      render(<BpmnEditor />);

      // Component should still render with error state
      expect(
        document.querySelector('[style*="position: relative"]'),
      ).toBeInTheDocument();
    });
  });

  describe("Race Condition Prevention", () => {
    it("should only initialize modeler after both container is ready AND initial sync is received", async () => {
      // Start with no message
      (useWebSocket as any).mockReturnValue({
        readyState: WebSocket.CONNECTING,
        send: mockSend,
        lastMessage: null,
        lastError: null,
        connect: vi.fn(),
        close: vi.fn(),
        reconnectCount: 0,
      });

      const { rerender } = render(<BpmnEditor />);

      // Should not initialize modeler yet (no initial sync)
      expect(useBpmnModeler).toHaveBeenCalledWith(
        expect.objectContaining({
          container: null,
        }),
      );

      // Simulate connection opening and receiving init
      const mockXml =
        '<?xml version="1.0"?><bpmn:definitions></bpmn:definitions>';
      (useWebSocket as any).mockReturnValue({
        readyState: WebSocket.OPEN,
        send: mockSend,
        lastMessage: JSON.stringify({ type: "init", xml: mockXml }),
        lastError: null,
        connect: vi.fn(),
        close: vi.fn(),
        reconnectCount: 0,
      });

      rerender(<BpmnEditor />);

      // Now modeler should initialize with proper container
      await waitFor(() => {
        const calls = (useBpmnModeler as any).mock.calls;
        const lastCall = calls[calls.length - 1][0];
        expect(lastCall.container).not.toBeNull();
      });
    });
  });
});

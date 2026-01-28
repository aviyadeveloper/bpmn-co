import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useWebSocket } from "./useWebSocket";

/**
 * Step 1 Tests: Connection Maker
 *
 * Tests for basic WebSocket connection functionality:
 * - Initial state
 * - Connection establishment
 * - Manual close
 * - Cleanup on unmount
 */

// Mock WebSocket
class MockWebSocket {
  public readyState: number = WebSocket.CONNECTING;
  public onopen: ((event: Event) => void) | null = null;
  public onclose: ((event: CloseEvent) => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;
  public onmessage: ((event: MessageEvent) => void) | null = null;
  public url: string;
  public protocols?: string | string[];

  constructor(url: string, protocols?: string | string[]) {
    this.url = url;
    this.protocols = protocols;

    // Simulate async connection
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event("open"));
      }
    }, 0);
  }

  close(code?: number, reason?: string) {
    this.readyState = WebSocket.CLOSING;
    setTimeout(() => {
      this.readyState = WebSocket.CLOSED;
      if (this.onclose) {
        this.onclose(
          new CloseEvent("close", { code: code || 1000, reason: reason || "" }),
        );
      }
    }, 0);
  }

  send(_data: string | ArrayBufferLike | Blob | ArrayBufferView) {
    // Mock send - in real tests we might want to track what was sent
  }

  // Helper to simulate incoming message
  simulateMessage(data: string) {
    if (this.onmessage) {
      this.onmessage(new MessageEvent("message", { data }));
    }
  }

  // Helper to simulate unexpected disconnect
  simulateDisconnect() {
    this.readyState = WebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(
        new CloseEvent("close", { code: 1006, reason: "Abnormal closure" }),
      );
    }
  }
}

describe("useWebSocket - Step 1: Connection Maker", () => {
  beforeEach(() => {
    // Mock WebSocket globally
    globalThis.WebSocket = MockWebSocket as any;
  });

  it("should initialize with CLOSED state when autoConnect is false", () => {
    const { result } = renderHook(() =>
      useWebSocket("ws://localhost:8000", { autoConnect: false }),
    );

    expect(result.current.readyState).toBe(WebSocket.CLOSED);
  });

  it("should auto-connect on mount by default", async () => {
    const { result } = renderHook(() => useWebSocket("ws://localhost:8000"));

    // Initially CONNECTING
    expect(result.current.readyState).toBe(WebSocket.CONNECTING);

    // Wait for connection to open
    await vi.waitFor(() => {
      expect(result.current.readyState).toBe(WebSocket.OPEN);
    });
  });

  it("should connect manually when connect() is called", async () => {
    const { result } = renderHook(() =>
      useWebSocket("ws://localhost:8000", { autoConnect: false }),
    );

    expect(result.current.readyState).toBe(WebSocket.CLOSED);

    // Manually connect
    act(() => {
      result.current.connect();
    });

    expect(result.current.readyState).toBe(WebSocket.CONNECTING);

    // Wait for connection to open
    await vi.waitFor(() => {
      expect(result.current.readyState).toBe(WebSocket.OPEN);
    });
  });

  it("should close connection when close() is called", async () => {
    const { result } = renderHook(() => useWebSocket("ws://localhost:8000"));

    // Wait for connection to open
    await vi.waitFor(() => {
      expect(result.current.readyState).toBe(WebSocket.OPEN);
    });

    // Close connection
    act(() => {
      result.current.close();
    });

    expect(result.current.readyState).toBe(WebSocket.CLOSING);

    // Wait for connection to close
    await vi.waitFor(() => {
      expect(result.current.readyState).toBe(WebSocket.CLOSED);
    });
  });

  it("should clean up connection on unmount", async () => {
    const { result, unmount } = renderHook(() =>
      useWebSocket("ws://localhost:8000"),
    );

    // Wait for connection to open
    await vi.waitFor(() => {
      expect(result.current.readyState).toBe(WebSocket.OPEN);
    });

    // Unmount should trigger cleanup
    unmount();

    // Note: We can't easily verify the WebSocket is closed after unmount
    // since the component is gone, but the cleanup function runs
  });

  it("should accept WebSocket protocols", () => {
    const { result } = renderHook(() =>
      useWebSocket("ws://localhost:8000", {
        protocols: "my-protocol",
        autoConnect: false,
      }),
    );

    expect(result.current.readyState).toBe(WebSocket.CLOSED);
  });

  it("should not create multiple connections if connect() is called multiple times", async () => {
    const { result } = renderHook(() =>
      useWebSocket("ws://localhost:8000", { autoConnect: false }),
    );

    act(() => {
      result.current.connect();
      result.current.connect(); // Call again
      result.current.connect(); // And again
    });

    // Should only be connecting once
    expect(result.current.readyState).toBe(WebSocket.CONNECTING);
  });
});

describe("useWebSocket - Step 2: Reconnection Handler", () => {
  let mockWsInstance: MockWebSocket | null = null;

  beforeEach(() => {
    vi.useFakeTimers();

    // Mock WebSocket and capture instance - use class constructor directly
    const OriginalMockWebSocket = MockWebSocket;
    globalThis.WebSocket = class extends OriginalMockWebSocket {
      constructor(url: string, protocols?: string | string[]) {
        super(url, protocols);
        mockWsInstance = this;
      }
    } as any;
  });

  afterEach(() => {
    vi.useRealTimers();
    mockWsInstance = null;
  });

  it("should initialize with reconnectCount of 0", () => {
    const { result } = renderHook(() =>
      useWebSocket("ws://localhost:8000", { autoConnect: false }),
    );

    expect(result.current.reconnectCount).toBe(0);
  });

  it("should reset reconnectCount to 0 on successful connection", async () => {
    const { result } = renderHook(() =>
      useWebSocket("ws://localhost:8000", {
        autoConnect: false,
        reconnectInterval: 100,
      }),
    );

    // Manually connect
    act(() => {
      result.current.connect();
    });

    // Fast-forward to connection open
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10);
    });

    expect(result.current.reconnectCount).toBe(0);
    expect(result.current.readyState).toBe(WebSocket.OPEN);
  });

  it("should attempt to reconnect after unexpected disconnect", async () => {
    const { result } = renderHook(() =>
      useWebSocket("ws://localhost:8000", {
        reconnectInterval: 1000,
      }),
    );

    // Wait for initial connection
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10);
    });

    expect(result.current.readyState).toBe(WebSocket.OPEN);

    // Simulate unexpected disconnect
    act(() => {
      mockWsInstance?.simulateDisconnect();
    });

    expect(result.current.readyState).toBe(WebSocket.CLOSED);

    // Advance timer to trigger reconnect
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1200); // Base + jitter
    });

    expect(result.current.reconnectCount).toBe(1);

    // Wait for reconnection to complete
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10);
    });

    expect(result.current.readyState).toBe(WebSocket.OPEN);
  });

  it("should NOT reconnect after manual close", async () => {
    const { result } = renderHook(() =>
      useWebSocket("ws://localhost:8000", {
        reconnectInterval: 1000,
      }),
    );

    // Wait for initial connection
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10);
    });

    expect(result.current.readyState).toBe(WebSocket.OPEN);

    // Manually close
    act(() => {
      result.current.close();
    });

    // Advance timers
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10);
    });

    expect(result.current.readyState).toBe(WebSocket.CLOSING);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10);
    });

    expect(result.current.readyState).toBe(WebSocket.CLOSED);

    // Advance time - should NOT reconnect
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(result.current.reconnectCount).toBe(0);
    expect(result.current.readyState).toBe(WebSocket.CLOSED);
  });

  it("should respect maxReconnectAttempts", async () => {
    const { result } = renderHook(() =>
      useWebSocket("ws://localhost:8000", {
        reconnectInterval: 100,
        maxReconnectAttempts: 2,
        autoConnect: false,
      }),
    );

    // Connect
    act(() => {
      result.current.connect();
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10);
    });

    // Simulate 3 disconnects - should only reconnect twice
    for (let i = 0; i < 3; i++) {
      act(() => {
        mockWsInstance?.simulateDisconnect();
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(10);
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(200);
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(10);
      });
    }

    // Should have stopped at 2 attempts
    expect(result.current.reconnectCount).toBe(2);
  });

  it("should use exponential backoff for reconnect delays", async () => {
    const { result } = renderHook(() =>
      useWebSocket("ws://localhost:8000", {
        reconnectInterval: 1000,
        reconnectDecay: 2,
        autoConnect: false,
      }),
    );

    act(() => {
      result.current.connect();
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10);
    });

    // First disconnect - should wait ~1000ms (1000 * 2^0 = 1000)
    act(() => {
      mockWsInstance?.simulateDisconnect();
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1200);
    });

    expect(result.current.reconnectCount).toBe(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10);
    });

    // Second disconnect - should wait ~2000ms (1000 * 2^1 = 2000)
    act(() => {
      mockWsInstance?.simulateDisconnect();
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2400);
    });

    expect(result.current.reconnectCount).toBe(2);
  });

  it("should disable reconnection when autoReconnect is false", async () => {
    const { result } = renderHook(() =>
      useWebSocket("ws://localhost:8000", {
        autoReconnect: false,
      }),
    );

    // Wait for initial connection
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10);
    });

    expect(result.current.readyState).toBe(WebSocket.OPEN);

    // Simulate disconnect
    act(() => {
      mockWsInstance?.simulateDisconnect();
    });

    expect(result.current.readyState).toBe(WebSocket.CLOSED);

    // Advance timers - should NOT reconnect
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(result.current.reconnectCount).toBe(0);
    expect(result.current.readyState).toBe(WebSocket.CLOSED);
  });

  it("should clear reconnect timer on unmount", async () => {
    const { unmount } = renderHook(() =>
      useWebSocket("ws://localhost:8000", {
        reconnectInterval: 1000,
      }),
    );

    // Wait for initial connection
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10);
    });

    // Simulate disconnect
    act(() => {
      mockWsInstance?.simulateDisconnect();
    });

    // Unmount before reconnect timer fires
    unmount();

    // Advance timers - should NOT reconnect
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    // Can't check state after unmount, but this verifies no errors
  });
});

describe("useWebSocket - Step 3: Error Handler", () => {
  let mockWsInstance: MockWebSocket | null = null;

  beforeEach(() => {
    // Mock WebSocket and capture instance
    const OriginalMockWebSocket = MockWebSocket;
    globalThis.WebSocket = class extends OriginalMockWebSocket {
      constructor(url: string, protocols?: string | string[]) {
        super(url, protocols);
        mockWsInstance = this;
      }
    } as any;
  });

  afterEach(() => {
    mockWsInstance = null;
  });

  it("should initialize with null lastError", () => {
    const { result } = renderHook(() =>
      useWebSocket("ws://localhost:8000", { autoConnect: false }),
    );

    expect(result.current.lastError).toBeNull();
  });

  it("should update lastError when WebSocket error occurs", async () => {
    const { result } = renderHook(() =>
      useWebSocket("ws://localhost:8000", { autoConnect: false }),
    );

    // Connect
    act(() => {
      result.current.connect();
    });

    await vi.waitFor(() => {
      expect(result.current.readyState).toBe(WebSocket.OPEN);
    });

    // Simulate error
    act(() => {
      if (mockWsInstance?.onerror) {
        mockWsInstance.onerror(new Event("error"));
      }
    });

    expect(result.current.lastError).not.toBeNull();
    expect(result.current.lastError?.message).toBe(
      "WebSocket connection error",
    );
    expect(result.current.lastError?.timestamp).toBeGreaterThan(0);
  });

  it("should call onError callback when error occurs", async () => {
    const onErrorMock = vi.fn();
    const { result } = renderHook(() =>
      useWebSocket("ws://localhost:8000", {
        autoConnect: false,
        onError: onErrorMock,
      }),
    );

    // Connect
    act(() => {
      result.current.connect();
    });

    await vi.waitFor(() => {
      expect(result.current.readyState).toBe(WebSocket.OPEN);
    });

    // Simulate error
    const errorEvent = new Event("error");
    act(() => {
      if (mockWsInstance?.onerror) {
        mockWsInstance.onerror(errorEvent);
      }
    });

    expect(onErrorMock).toHaveBeenCalledTimes(1);
    expect(onErrorMock).toHaveBeenCalledWith(
      errorEvent,
      expect.objectContaining({
        message: "WebSocket connection error",
        timestamp: expect.any(Number),
        reconnectAttempt: expect.any(Number),
      }),
    );
  });

  it("should clear lastError on successful connection", async () => {
    const { result } = renderHook(() =>
      useWebSocket("ws://localhost:8000", { autoConnect: false }),
    );

    // Connect
    act(() => {
      result.current.connect();
    });

    await vi.waitFor(() => {
      expect(result.current.readyState).toBe(WebSocket.OPEN);
    });

    // Simulate error
    act(() => {
      if (mockWsInstance?.onerror) {
        mockWsInstance.onerror(new Event("error"));
      }
    });

    expect(result.current.lastError).not.toBeNull();

    // Close and reconnect
    act(() => {
      result.current.close();
    });

    await vi.waitFor(() => {
      expect(result.current.readyState).toBe(WebSocket.CLOSED);
    });

    act(() => {
      result.current.connect();
    });

    await vi.waitFor(() => {
      expect(result.current.readyState).toBe(WebSocket.OPEN);
    });

    // Wait an extra tick for state updates to propagate
    await vi.waitFor(() => {
      expect(result.current.lastError).toBeNull();
    });
  });

  it("should handle errors in onError callback gracefully", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const onErrorMock = vi.fn(() => {
      throw new Error("Handler error");
    });

    const { result } = renderHook(() =>
      useWebSocket("ws://localhost:8000", {
        autoConnect: false,
        onError: onErrorMock,
      }),
    );

    // Connect
    act(() => {
      result.current.connect();
    });

    await vi.waitFor(() => {
      expect(result.current.readyState).toBe(WebSocket.OPEN);
    });

    // Simulate error - should not throw
    act(() => {
      if (mockWsInstance?.onerror) {
        mockWsInstance.onerror(new Event("error"));
      }
    });

    expect(onErrorMock).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[useWebSocket] Error in onError handler:",
      expect.any(Error),
    );

    consoleErrorSpy.mockRestore();
  });

  it("should track reconnectAttempt in error info", async () => {
    vi.useFakeTimers();
    const onErrorMock = vi.fn();

    const { result } = renderHook(() =>
      useWebSocket("ws://localhost:8000", {
        reconnectInterval: 100,
        onError: onErrorMock,
        autoReconnect: false, // Disable auto-reconnect to control manually
      }),
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10);
    });

    // Should be connected
    expect(result.current.readyState).toBe(WebSocket.OPEN);
    expect(result.current.reconnectCount).toBe(0);

    // Simulate error
    act(() => {
      if (mockWsInstance?.onerror) {
        mockWsInstance.onerror(new Event("error"));
      }
    });

    expect(onErrorMock).toHaveBeenCalledWith(
      expect.any(Event),
      expect.objectContaining({
        reconnectAttempt: 0,
      }),
    );

    vi.useRealTimers();
  });

  it("should handle WebSocket constructor errors", () => {
    const onErrorMock = vi.fn();

    // Mock WebSocket constructor to throw
    globalThis.WebSocket = class {
      constructor() {
        throw new Error("Invalid URL");
      }
    } as any;

    const { result } = renderHook(() =>
      useWebSocket("ws://invalid", {
        autoConnect: false,
        onError: onErrorMock,
        autoReconnect: false,
      }),
    );

    // Try to connect
    act(() => {
      result.current.connect();
    });

    expect(result.current.lastError).not.toBeNull();
    expect(result.current.lastError?.message).toBe("Invalid URL");
    expect(onErrorMock).toHaveBeenCalledTimes(1);
  });
});

describe("useWebSocket - Step 4 & 5: Simple Messaging", () => {
  let mockWsInstance: MockWebSocket | null = null;

  beforeEach(() => {
    // Mock WebSocket and capture instance
    const OriginalMockWebSocket = MockWebSocket;
    globalThis.WebSocket = class extends OriginalMockWebSocket {
      constructor(url: string, protocols?: string | string[]) {
        super(url, protocols);
        mockWsInstance = this;
      }
    } as any;
  });

  afterEach(() => {
    mockWsInstance = null;
  });

  it("should initialize with null lastMessage", () => {
    const { result } = renderHook(() =>
      useWebSocket("ws://localhost:8000", { autoConnect: false }),
    );

    expect(result.current.lastMessage).toBeNull();
  });

  it("should update lastMessage when message is received", async () => {
    const { result } = renderHook(() =>
      useWebSocket("ws://localhost:8000", { autoConnect: false }),
    );

    // Connect
    act(() => {
      result.current.connect();
    });

    await vi.waitFor(() => {
      expect(result.current.readyState).toBe(WebSocket.OPEN);
    });

    // Simulate incoming message
    const testMessage = "<bpmn>test xml content</bpmn>";
    act(() => {
      mockWsInstance?.simulateMessage(testMessage);
    });

    expect(result.current.lastMessage).toBe(testMessage);
  });

  it("should call onMessage callback when message is received", async () => {
    const onMessageMock = vi.fn();
    const { result } = renderHook(() =>
      useWebSocket("ws://localhost:8000", {
        autoConnect: false,
        onMessage: onMessageMock,
      }),
    );

    // Connect
    act(() => {
      result.current.connect();
    });

    await vi.waitFor(() => {
      expect(result.current.readyState).toBe(WebSocket.OPEN);
    });

    // Simulate incoming message
    const testMessage = "<bpmn>test xml</bpmn>";
    act(() => {
      mockWsInstance?.simulateMessage(testMessage);
    });

    expect(onMessageMock).toHaveBeenCalledTimes(1);
    expect(onMessageMock).toHaveBeenCalledWith(testMessage);
  });

  it("should handle errors in onMessage callback gracefully", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const onMessageMock = vi.fn(() => {
      throw new Error("Handler error");
    });

    const { result } = renderHook(() =>
      useWebSocket("ws://localhost:8000", {
        autoConnect: false,
        onMessage: onMessageMock,
      }),
    );

    // Connect
    act(() => {
      result.current.connect();
    });

    await vi.waitFor(() => {
      expect(result.current.readyState).toBe(WebSocket.OPEN);
    });

    // Simulate message - should not throw
    act(() => {
      mockWsInstance?.simulateMessage("test");
    });

    expect(onMessageMock).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[useWebSocket] Error in onMessage handler:",
      expect.any(Error),
    );

    consoleErrorSpy.mockRestore();
  });

  it("should send message when connection is OPEN", async () => {
    const sendSpy = vi.fn();
    const { result } = renderHook(() =>
      useWebSocket("ws://localhost:8000", { autoConnect: false }),
    );

    // Connect
    act(() => {
      result.current.connect();
    });

    await vi.waitFor(() => {
      expect(result.current.readyState).toBe(WebSocket.OPEN);
    });

    // Mock the send method
    if (mockWsInstance) {
      mockWsInstance.send = sendSpy;
    }

    // Send message
    const testMessage = "<bpmn>outgoing xml</bpmn>";
    let sendResult: boolean = false;
    act(() => {
      sendResult = result.current.send(testMessage);
    });

    expect(sendResult).toBe(true);
    expect(sendSpy).toHaveBeenCalledTimes(1);
    expect(sendSpy).toHaveBeenCalledWith(testMessage);
  });

  it("should return false when sending and connection is not OPEN", () => {
    const { result } = renderHook(() =>
      useWebSocket("ws://localhost:8000", { autoConnect: false }),
    );

    // Try to send without connecting
    let sendResult: boolean = true;
    act(() => {
      sendResult = result.current.send("test message");
    });

    expect(sendResult).toBe(false);
  });

  it("should handle send errors gracefully", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const { result } = renderHook(() =>
      useWebSocket("ws://localhost:8000", { autoConnect: false }),
    );

    // Connect
    act(() => {
      result.current.connect();
    });

    await vi.waitFor(() => {
      expect(result.current.readyState).toBe(WebSocket.OPEN);
    });

    // Mock send to throw
    if (mockWsInstance) {
      mockWsInstance.send = () => {
        throw new Error("Send failed");
      };
    }

    // Try to send - should return false
    let sendResult: boolean = true;
    act(() => {
      sendResult = result.current.send("test");
    });

    expect(sendResult).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[useWebSocket] Error sending message:",
      expect.any(Error),
    );

    consoleErrorSpy.mockRestore();
  });

  it("should receive multiple messages in sequence", async () => {
    const messages: string[] = [];
    const { result } = renderHook(() =>
      useWebSocket("ws://localhost:8000", {
        autoConnect: false,
        onMessage: (msg) => messages.push(msg),
      }),
    );

    // Connect
    act(() => {
      result.current.connect();
    });

    await vi.waitFor(() => {
      expect(result.current.readyState).toBe(WebSocket.OPEN);
    });

    // Send multiple messages
    const msg1 = "<bpmn>message 1</bpmn>";
    const msg2 = "<bpmn>message 2</bpmn>";
    const msg3 = "<bpmn>message 3</bpmn>";

    act(() => {
      mockWsInstance?.simulateMessage(msg1);
      mockWsInstance?.simulateMessage(msg2);
      mockWsInstance?.simulateMessage(msg3);
    });

    expect(messages).toEqual([msg1, msg2, msg3]);
    expect(result.current.lastMessage).toBe(msg3); // Last one
  });
});

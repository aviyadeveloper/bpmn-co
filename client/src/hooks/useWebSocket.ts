import { useEffect, useRef, useState } from "react";

/**
 * useWebSocket - A production-ready WebSocket hook for React
 *
 * Current Features (Steps 1-5):
 * ✅ Connection management (connect/disconnect/auto-connect)
 * ✅ Smart reconnection (exponential backoff + jitter)
 * ✅ Error handling (callbacks + state tracking)
 * ✅ Send/receive text messages (strings, XML, JSON, etc.)
 *
 * Possible Future Improvements:
 * - forceClose() method: Permanent close without reconnection ability
 * - Generic message types: Type-safe message handling with TypeScript generics
 * - Message queue: Buffer messages when connection is down, send on reconnect
 * - Heartbeat/ping-pong: Keep-alive mechanism to detect stale connections
 * - Connection metrics: Track uptime, message count, latency, reconnection stats
 * - Debug mode: Verbose logging toggle for development
 * - React DevTools integration: Inspect WebSocket state in DevTools
 *
 * Usage Example:
 *   const { readyState, send, lastMessage, lastError } = useWebSocket('ws://localhost:8000', {
 *     autoReconnect: true,
 *     maxReconnectAttempts: 5,
 *     reconnectInterval: 1000,
 *     onMessage: (message) => {
 *       console.log('Received XML:', message);
 *     },
 *     onError: (error, errorInfo) => {
 *       console.error('WebSocket error:', errorInfo);
 *     }
 *   });
 *
 *   // Send data
 *   if (readyState === WebSocket.OPEN) {
 *     send('<bpmn>...</bpmn>');
 *   }
 */

export interface WebSocketError {
  /** Error event from WebSocket */
  event: Event;
  /** Error message */
  message: string;
  /** Timestamp when error occurred */
  timestamp: number;
  /** Current reconnect attempt count when error occurred */
  reconnectAttempt: number;
}

export interface UseWebSocketConfig {
  /** WebSocket subprotocol(s) */
  protocols?: string | string[];
  /** Auto-connect on mount (default: true) */
  autoConnect?: boolean;
  /** Enable automatic reconnection (default: true) */
  autoReconnect?: boolean;
  /** Maximum number of reconnection attempts (default: Infinity) */
  maxReconnectAttempts?: number;
  /** Base reconnection interval in ms (default: 1000) */
  reconnectInterval?: number;
  /** Exponential backoff multiplier (default: 1.5) */
  reconnectDecay?: number;
  /** Maximum reconnection interval in ms (default: 30000) */
  maxReconnectInterval?: number;
  /** Callback fired when an error occurs */
  onError?: (error: Event, errorInfo: WebSocketError) => void;
  /** Callback fired when a message is received */
  onMessage?: (message: string) => void;
}

export interface UseWebSocketReturn {
  /** Current WebSocket ready state: 0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED */
  readyState: number;
  /** Manually initiate connection */
  connect: () => void;
  /** Manually close connection */
  close: () => void;
  /** Number of reconnection attempts made */
  reconnectCount: number;
  /** Last error that occurred, or null */
  lastError: WebSocketError | null;
  /** Last message received, or null */
  lastMessage: string | null;
  /** Send a message through the WebSocket */
  send: (data: string) => boolean;
}

export function useWebSocket(
  url: string,
  config: UseWebSocketConfig = {},
): UseWebSocketReturn {
  const {
    protocols,
    autoConnect = true,
    autoReconnect = true,
    maxReconnectAttempts = Infinity,
    reconnectInterval = 1000,
    reconnectDecay = 1.5,
    maxReconnectInterval = 30000,
    onError,
    onMessage,
  } = config;

  const wsRef = useRef<WebSocket | null>(null);
  const [readyState, setReadyState] = useState<number>(WebSocket.CLOSED);
  const [reconnectCount, setReconnectCount] = useState<number>(0);
  const [lastError, setLastError] = useState<WebSocketError | null>(null);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const reconnectCountRef = useRef<number>(0);
  const reconnectTimerRef = useRef<number | null>(null);
  const intentionalCloseRef = useRef<boolean>(false);

  /**
   * Calculate reconnection delay with exponential backoff and jitter
   */
  const calculateReconnectDelay = (attempt: number): number => {
    // Exponential backoff: baseInterval * (decay ^ attempt)
    const exponentialDelay =
      reconnectInterval * Math.pow(reconnectDecay, attempt);

    // Cap at maximum interval
    const cappedDelay = Math.min(exponentialDelay, maxReconnectInterval);

    // Add jitter: ±20% randomness to prevent thundering herd
    const jitter = cappedDelay * 0.2 * (Math.random() * 2 - 1);

    return Math.max(0, cappedDelay + jitter);
  };

  /**
   * Clear any pending reconnection timer
   */
  const clearReconnectTimer = () => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  };

  /**
   * Attempt to reconnect with backoff
   */
  const scheduleReconnect = () => {
    if (intentionalCloseRef.current) {
      console.log("[useWebSocket] Skipping reconnect (intentional close)");
      return;
    }

    const nextAttempt = reconnectCountRef.current + 1;
    if (nextAttempt > maxReconnectAttempts) {
      console.log("[useWebSocket] Max reconnect attempts reached");
      return;
    }

    if (!autoReconnect) {
      console.log("[useWebSocket] Auto-reconnect is disabled");
      return;
    }

    const delay = calculateReconnectDelay(reconnectCountRef.current);
    console.log(
      `[useWebSocket] Reconnecting in ${Math.round(delay)}ms (attempt ${nextAttempt})`,
    );

    clearReconnectTimer();
    reconnectTimerRef.current = setTimeout(() => {
      reconnectCountRef.current += 1;
      setReconnectCount((prev) => prev + 1);
      connect();
    }, delay);
  };

  /**
   * Establish WebSocket connection
   */
  const connect = () => {
    // Don't create multiple instances
    if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
      console.warn("[useWebSocket] Connection already exists");
      return;
    }

    // Clear any pending reconnection timer
    clearReconnectTimer();

    try {
      // Create WebSocket instance
      const ws = new WebSocket(url, protocols);
      wsRef.current = ws;

      // Update state immediately to CONNECTING
      setReadyState(WebSocket.CONNECTING);

      // Handle connection open
      ws.onopen = () => {
        setReadyState(WebSocket.OPEN);
        // Clear any previous errors on successful connection
        setLastError(null);
        // Note: Don't reset reconnectCount here - let tests and UI see the count
        // It will be reset on manual close or when user wants a fresh start
      };

      // Handle connection close
      ws.onclose = (event) => {
        console.log("[useWebSocket] Connection closed", {
          code: event.code,
          reason: event.reason,
        });
        setReadyState(WebSocket.CLOSED);

        // Attempt to reconnect if not an intentional close
        scheduleReconnect();
      };

      // Handle errors
      ws.onerror = (event) => {
        console.error("[useWebSocket] Connection error", event);

        // Create error info object
        const errorInfo: WebSocketError = {
          event,
          message: "WebSocket connection error",
          timestamp: Date.now(),
          reconnectAttempt: reconnectCountRef.current,
        };

        // Update error state
        setLastError(errorInfo);

        // Call user-provided error handler (safely)
        if (onError) {
          try {
            onError(event, errorInfo);
          } catch (handlerError) {
            console.error(
              "[useWebSocket] Error in onError handler:",
              handlerError,
            );
          }
        }

        // Note: readyState will be updated via onclose which fires after onerror
      };

      // Handle incoming messages
      ws.onmessage = (event) => {
        const message = event.data;
        console.log(
          "[useWebSocket] Message received:",
          message.substring(0, 100),
        );

        // Update last message state
        setLastMessage(message);

        // Call user-provided message handler (safely)
        if (onMessage) {
          try {
            onMessage(message);
          } catch (handlerError) {
            console.error(
              "[useWebSocket] Error in onMessage handler:",
              handlerError,
            );
          }
        }
      };
    } catch (error) {
      console.error("[useWebSocket] Failed to create WebSocket", error);

      // Create error info for construction failure
      const errorInfo: WebSocketError = {
        event: new Event("error"),
        message:
          error instanceof Error ? error.message : "Failed to create WebSocket",
        timestamp: Date.now(),
        reconnectAttempt: reconnectCountRef.current,
      };

      setLastError(errorInfo);
      setReadyState(WebSocket.CLOSED);

      // Call user-provided error handler (safely)
      if (onError) {
        try {
          onError(errorInfo.event, errorInfo);
        } catch (handlerError) {
          console.error(
            "[useWebSocket] Error in onError handler:",
            handlerError,
          );
        }
      }

      // Attempt to reconnect after error
      scheduleReconnect();
    }
  };

  /**
   * Send a message through the WebSocket
   * Returns true if message was sent, false if connection is not open
   */
  const send = (data: string): boolean => {
    if (!wsRef.current) {
      console.warn("[useWebSocket] Cannot send: WebSocket not initialized");
      return false;
    }

    if (wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn(
        "[useWebSocket] Cannot send: WebSocket not in OPEN state",
        `(current state: ${wsRef.current.readyState})`,
      );
      return false;
    }

    try {
      wsRef.current.send(data);
      console.log("[useWebSocket] Message sent:", data.substring(0, 100));
      return true;
    } catch (error) {
      console.error("[useWebSocket] Error sending message:", error);
      return false;
    }
  };

  /**
   * Close WebSocket connection
   */
  const close = () => {
    // Mark this as an intentional close to prevent reconnection
    intentionalCloseRef.current = true;

    // Clear any pending reconnection timer
    clearReconnectTimer();

    if (wsRef.current) {
      // Update state immediately to CLOSING
      setReadyState(WebSocket.CLOSING);
      wsRef.current.close();
      wsRef.current = null;
    }

    // Reset reconnection count
    reconnectCountRef.current = 0;
    setReconnectCount(0);
  };

  /**
   * Auto-connect on mount if enabled
   */
  useEffect(() => {
    if (autoConnect) {
      // Reset intentional close flag on mount
      intentionalCloseRef.current = false;
      connect();
    }

    // Cleanup: close connection on unmount
    return () => {
      intentionalCloseRef.current = true;
      clearReconnectTimer();
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [url]); // Re-connect if URL changes

  return {
    readyState,
    connect,
    close,
    reconnectCount,
    lastError,
    lastMessage,
    send,
  };
}

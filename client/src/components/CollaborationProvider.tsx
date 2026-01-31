/**
 * CollaborationProvider - Manages WebSocket connection and initial sync
 *
 * This component:
 * - Establishes WebSocket connection
 * - Waits for initial sync from server
 * - Shows loading state during connection/sync
 * - Only renders children once initial data is available
 * - Provides collaboration context to child components
 *
 * This pattern simplifies child components by ensuring they only render
 * when all necessary data is available (no guards/flags needed).
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from "react";
import type { ReactNode } from "react";
import { useDiagramSync } from "../hooks/useDiagramSync";
import type { CollaborationState, ElementId } from "./types";

interface CollaborationContextValue {
  /** Initial XML received from server */
  initialXml: string;

  /** Current collaboration state (users, locks, userId) */
  collaborationState: CollaborationState;

  /** WebSocket connection state */
  isConnected: boolean;
  readyState: number;
  reconnectCount: number;

  /** Send functions */
  sendXmlUpdate: (xml: string) => boolean;
  sendUserNameUpdate: (name: string) => boolean;
  sendElementSelect: (elementIds: ElementId | ElementId[]) => boolean;
  sendElementDeselect: (elementId: ElementId) => boolean;

  /** Register callback for XML updates from other users */
  onXmlUpdate: (callback: (xml: string) => void) => void;
}
const CollaborationContext = createContext<CollaborationContextValue | null>(
  null,
);

/**
 * Hook to access collaboration context
 * Must be used within CollaborationProvider
 */
export function useCollaboration() {
  const context = useContext(CollaborationContext);
  if (!context) {
    throw new Error(
      "useCollaboration must be used within CollaborationProvider",
    );
  }
  return context;
}

interface CollaborationProviderProps {
  /** WebSocket server URL */
  url: string;

  /** Children to render once connected and synced */
  children: ReactNode;

  /** Optional custom loading component */
  loadingComponent?: ReactNode;
}

export function CollaborationProvider({
  url,
  children,
  loadingComponent,
}: CollaborationProviderProps) {
  // Track initial sync state
  const [initialSync, setInitialSync] = useState<{
    ready: boolean;
    xml: string;
  } | null>(null);

  // Track XML update callback
  const xmlUpdateCallbackRef = useRef<((xml: string) => void) | null>(null);

  // Handle initial connection and sync
  const handleInit = useCallback(
    ({
      xml,
      users,
      lockedElements,
      userId,
    }: {
      xml: string;
      users: any;
      lockedElements: any;
      userId: string;
    }) => {
      console.log("✅ Connected as:", userId);
      console.log("👥 Current users:", users);
      console.log("🔒 Locked elements:", lockedElements);

      // Mark as ready and store initial XML
      setInitialSync({ ready: true, xml });
      console.log("✅ Initial sync complete");
    },
    [],
  );

  // Handle XML updates from other users
  const handleXmlUpdate = useCallback((xml: string) => {
    console.log("📝 Diagram updated by another user");
    xmlUpdateCallbackRef.current?.(xml);
  }, []);

  // Allow components to register for XML updates
  const registerXmlUpdateCallback = useCallback(
    (callback: (xml: string) => void) => {
      xmlUpdateCallbackRef.current = callback;
    },
    [],
  );

  // Set up WebSocket collaboration
  const {
    readyState,
    isConnected,
    reconnectCount,
    collaborationState,
    sendXmlUpdate,
    sendUserNameUpdate,
    sendElementSelect,
    sendElementDeselect,
  } = useDiagramSync(url, {
    onInit: handleInit,

    onXmlUpdate: handleXmlUpdate,

    onUsersUpdate: (users) => {
      console.log("👥 User list updated:", users);
    },

    onLockedElementsUpdate: (lockedElements) => {
      console.log("🔒 Locked elements updated:", lockedElements);
    },

    onError: (message) => {
      console.error("❌ Server error:", message);
      alert(`Server error: ${message}`);
    },
  });

  // Show loading state until we have initial sync
  if (!initialSync?.ready) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }

    // Default loading UI
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          gap: "1rem",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            fontSize: "1.5rem",
            color: isConnected ? "#4caf50" : "#f44336",
          }}
        >
          {isConnected ? "🟢 Connected" : "🔴 Connecting..."}
        </div>
        <div style={{ fontSize: "1.2rem", color: "#666" }}>
          {isConnected ? "Loading diagram..." : "Connecting to server..."}
        </div>
        {reconnectCount > 0 && (
          <div style={{ fontSize: "0.9rem", color: "#999" }}>
            Reconnect attempt: {reconnectCount}
          </div>
        )}
      </div>
    );
  }

  // Once synced, provide context and render children
  const contextValue: CollaborationContextValue = {
    initialXml: initialSync.xml,
    collaborationState,
    isConnected,
    readyState,
    reconnectCount,
    sendXmlUpdate,
    sendUserNameUpdate,
    sendElementSelect,
    sendElementDeselect,
    onXmlUpdate: registerXmlUpdateCallback,
  };

  return (
    <CollaborationContext.Provider value={contextValue}>
      {children}
    </CollaborationContext.Provider>
  );
}

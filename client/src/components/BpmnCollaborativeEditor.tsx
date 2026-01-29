/**
 * BpmnCollaborativeEditor - Real-time collaborative BPMN editor
 *
 * This component combines:
 * - BPMN modeler (useBpmnModeler)
 * - WebSocket collaboration (useCollaborationWebSocket)
 * - User management and element locking
 */

import { useRef, useEffect, useState } from "react";
import { useCollaborationWebSocket } from "../hooks/useCollaborationWebSocket";
import { useBpmnModeler } from "../hooks/useBpmnModeler";
import { EMPTY_DIAGRAM } from "./constants";

export function BpmnCollaborativeEditor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [currentXml, setCurrentXml] = useState<string>(EMPTY_DIAGRAM);
  const [hasInitialSync, setHasInitialSync] = useState<boolean>(false);

  // Update container state when ref is set
  useEffect(() => {
    if (containerRef.current && !container) {
      setContainer(containerRef.current);
    }
  }, [container]);

  // Set up collaboration WebSocket
  const {
    readyState,
    isConnected,
    reconnectCount,
    collaborationState,
    sendXmlUpdate,
    sendUserNameUpdate,
    sendElementSelect,
    sendElementDeselect,
  } = useCollaborationWebSocket("ws://localhost:8000/ws", {
    // Called when connection is established and initial state is received
    onInit: ({ xml, users, lockedElements, userId }) => {
      console.log("✅ Connected as:", userId);
      console.log("👥 Current users:", users);
      console.log("🔒 Locked elements:", lockedElements);

      // Set initial XML which will trigger BPMN modeler initialization
      setCurrentXml(xml);
      setHasInitialSync(true);
      console.log("✅ Ready to initialize modeler");
    },

    // Called when another user updates the diagram
    onXmlUpdate: (xml) => {
      console.log("📝 Diagram updated by another user");
      setCurrentXml(xml);
      // Load XML into modeler (will prevent re-triggering onChange)
      loadXml(xml);
    },

    // Called when user list changes (name update, connect, disconnect)
    onUsersUpdate: (users) => {
      console.log("👥 User list updated:", users);
    },

    // Called when locked elements state is updated
    onLockedElementsUpdate: (lockedElements) => {
      console.log("� Locked elements updated:", lockedElements);
      // The collaborationState will be updated automatically by the hook
    },

    // Called when server sends an error
    onError: (message) => {
      console.error("❌ Server error:", message);
      alert(`Server error: ${message}`);
    },
  });

  // Set up BPMN modeler - ONLY after we have initial sync
  // This prevents race conditions
  const { modeler, loadXml } = useBpmnModeler({
    container: hasInitialSync ? container : null, // Only pass container after initial sync
    initialXml: currentXml,
    onChange: (xml) => {
      console.log("📤 Local diagram change, sending to server");
      if (isConnected && xml) {
        sendXmlUpdate(xml);
      }
    },
  });

  // Listen to modeler selection events for element locking
  useEffect(() => {
    if (!modeler.current || !hasInitialSync) return;

    const handleSelectionChange = (event: any) => {
      console.group("🎯 Selection Changed");

      if (event.newSelection && event.newSelection.length > 0) {
        // User selected element(s) - send all selected element IDs
        const elementIds = event.newSelection.map((el: any) => el.id);
        console.log(`✅ Selected ${elementIds.length} element(s):`, elementIds);

        if (isConnected) {
          sendElementSelect(elementIds);
        }
      } else if (event.oldSelection && event.oldSelection.length > 0) {
        // User deselected - server auto-unlocks on new selection
        // This handles the case of deselecting without selecting anything new
        console.log("❌ All elements deselected");
        // Send empty array to trigger auto-unlock of all user's elements
        if (isConnected) {
          sendElementSelect([]);
        }
      }

      console.groupEnd();
    };

    modeler.current.on("selection.changed", handleSelectionChange);

    return () => {
      modeler.current?.off("selection.changed", handleSelectionChange);
    };
  }, [
    modeler,
    isConnected,
    hasInitialSync,
    sendElementSelect,
    sendElementDeselect,
  ]);

  // Access collaboration state
  const { userId, users, lockedElements, currentUserName } = collaborationState;

  /**
   * Handle user name change
   */
  const handleNameChange = () => {
    const newName = prompt("Enter your name:", currentUserName || "");
    if (newName && newName.trim() && isConnected) {
      sendUserNameUpdate(newName.trim());
    }
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        flexDirection: "column",
        maxWidth: "80vw",
      }}
    >
      {/* Header with connection status and controls */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid #ddd",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#f5f5f5",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <h2 style={{ margin: 0, fontSize: "18px" }}>
            Collaborative BPMN Editor
          </h2>
          <ConnectionStatus
            readyState={readyState}
            reconnectCount={reconnectCount}
          />
        </div>

        {isConnected && (
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "14px" }}>
              Connected as:{" "}
              <strong>{currentUserName || userId?.slice(0, 8)}</strong>
            </span>
            <button
              onClick={handleNameChange}
              style={{
                padding: "6px 12px",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              Edit
            </button>
          </div>
        )}
      </div>

      {/* Main content area */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* BPMN Editor */}
        <div
          ref={containerRef}
          style={{
            flex: 1,
            backgroundColor: "#fffbe6ff",
            position: "relative",
          }}
        />

        {/* Right sidebar with collaboration info */}
        <div
          style={{
            width: "300px",
            borderLeft: "1px solid #ddd",
            backgroundColor: "#fafafa",
            padding: "16px",
            overflowY: "auto",
          }}
        >
          {/* User List */}
          <div style={{ marginBottom: "24px" }}>
            <h3 style={{ margin: "0 0 12px 0", fontSize: "16px" }}>
              Online Users ({Object.keys(users).length})
            </h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {Object.entries(users).map((user) => (
                <li
                  key={user[0]}
                  style={{
                    padding: "8px",
                    marginBottom: "4px",
                    backgroundColor: user[0] === userId ? "#e3f2fd" : "#fff",
                    borderRadius: "4px",
                    fontSize: "14px",
                  }}
                >
                  {user[1]}
                  {user[0] === userId && (
                    <span style={{ color: "#1976d2", fontWeight: "bold" }}>
                      {" "}
                      (You)
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Currently Locked Elements */}
          {Object.keys(lockedElements).length > 0 && (
            <div>
              <h3 style={{ margin: "0 0 12px 0", fontSize: "16px" }}>
                Currently Editing
              </h3>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {Object.entries(lockedElements).map((lockedElement) => {
                  const isMe = userId === lockedElement[1];
                  return (
                    <li
                      key={lockedElement[0]}
                      style={{
                        padding: "8px",
                        marginBottom: "4px",
                        backgroundColor: isMe ? "#e8f5e9" : "#fff3e0",
                        borderRadius: "4px",
                        fontSize: "13px",
                      }}
                    >
                      <div style={{ fontWeight: "bold", marginBottom: "2px" }}>
                        {lockedElement[0]}
                      </div>
                      <div style={{ color: "#555", fontSize: "12px" }}>
                        {isMe ? "You" : users[lockedElement[1]]}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {!isConnected && (
            <div
              style={{
                padding: "16px",
                backgroundColor: "#fff3cd",
                borderRadius: "4px",
                fontSize: "14px",
                textAlign: "center",
              }}
            >
              <strong>Offline Mode</strong>
              <br />
              <span style={{ fontSize: "12px", color: "#555" }}>
                {reconnectCount > 0
                  ? `Reconnecting... (attempt ${reconnectCount})`
                  : "Connecting to server..."}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Simple connection status component
 */
function ConnectionStatus({
  readyState,
  reconnectCount,
}: {
  readyState: number;
  reconnectCount: number;
}) {
  const getStatus = () => {
    switch (readyState) {
      case WebSocket.CONNECTING:
        return { label: "Connecting...", color: "#ff9800" };
      case WebSocket.OPEN:
        return {
          label: reconnectCount > 0 ? "Reconnected" : "Connected",
          color: "#4caf50",
        };
      case WebSocket.CLOSING:
        return { label: "Closing...", color: "#ff9800" };
      case WebSocket.CLOSED:
        return {
          label:
            reconnectCount > 0
              ? `Reconnecting (${reconnectCount})...`
              : "Disconnected",
          color: "#f44336",
        };
      default:
        return { label: "Unknown", color: "#9e9e9e" };
    }
  };

  const status = getStatus();

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div
        style={{
          width: "10px",
          height: "10px",
          borderRadius: "50%",
          backgroundColor: status.color,
        }}
      />
      <span style={{ fontSize: "14px" }}>{status.label}</span>
    </div>
  );
}

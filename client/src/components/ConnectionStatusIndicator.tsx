import React from "react";
import { useCollaboration } from "./CollaborationProvider";

export const ConnectionStatus: React.FC = () => {
  const { readyState } = useCollaboration();

  const getStatusColor = () => {
    switch (readyState) {
      case WebSocket.OPEN:
        return { color: "#4caf50" };
      case WebSocket.CONNECTING | WebSocket.CLOSING:
        return { color: "#ff9800" };
      case WebSocket.CLOSED:
        return { color: "#f44336" };
      default:
        return { color: "#9e9e9e" };
    }
  };

  const status = getStatusColor();

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div
        style={{
          width: "16px",
          height: "16px",
          borderRadius: "50%",
          backgroundColor: status.color,
        }}
      />
    </div>
  );
};

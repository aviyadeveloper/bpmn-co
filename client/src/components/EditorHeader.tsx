import React from "react";
import { ConnectionStatus } from "./ConnectionStatusIndicator";
import { NameControl } from "./NameControl";
import { useCollaboration } from "./CollaborationProvider";

export const EditorHeader: React.FC = () => {
  const { isConnected } = useCollaboration();

  return (
    <div
      style={{
        padding: "12px 16px",
        borderBottom: "1px solid #ddd",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#fff",
        position: "fixed",
        top: "1em",
        left: "1em",
        borderRadius: "8px",
        zIndex: 1000,
        color: "#000",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <h2 style={{ margin: 0, fontSize: "18px" }}>BPMN-CO</h2>
        <ConnectionStatus />
        {isConnected && <NameControl />}
      </div>
    </div>
  );
};

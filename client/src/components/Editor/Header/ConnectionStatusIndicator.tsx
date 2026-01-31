import React from "react";
import { useEditor } from "../../../services/editor/useEditor";

export const ConnectionStatus: React.FC = () => {
  const { isConnected } = useEditor();

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div
        style={{
          width: "16px",
          height: "16px",
          borderRadius: "50%",
          backgroundColor: isConnected ? "#4caf50" : "#f44336",
        }}
      />
    </div>
  );
};

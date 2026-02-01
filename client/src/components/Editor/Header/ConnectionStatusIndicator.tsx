import React from "react";
import { useEditor } from "../../../services/editor/useEditor";
import { COLORS } from "../../../constants";

export const ConnectionStatus: React.FC = () => {
  const { isConnected } = useEditor();

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div
        style={{
          width: "18px",
          height: "18px",
          borderRadius: "50%",
          backgroundColor: isConnected ? COLORS.GREEN : COLORS.RED,
        }}
      />
    </div>
  );
};

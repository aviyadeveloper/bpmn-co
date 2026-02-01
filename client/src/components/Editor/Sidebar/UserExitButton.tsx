import React from "react";
import { useMainStore } from "../../../services/main/mainStore";
import { COLORS } from "../../../constants";

export const UserExitButton: React.FC = () => {
  const { closeEditor } = useMainStore();

  return (
    <button
      onClick={closeEditor}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "4px",
        display: "flex",
        alignItems: "center",
        color: COLORS.RED,
        fontSize: "16px",
      }}
      title="Exit Diagram"
    >
      ✕
    </button>
  );
};

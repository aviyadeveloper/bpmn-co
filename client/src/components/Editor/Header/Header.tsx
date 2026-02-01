import React from "react";
import { ConnectionStatus } from "./ConnectionStatusIndicator";
import { NameControl } from "./NameControl";
import { useEditor } from "../../../services/editor/useEditor";
import { BOX_SHADOW, COLORS } from "../../../constants";

export const Header: React.FC = () => {
  const { isConnected } = useEditor();

  return (
    <div
      style={{
        padding: "12px 16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: `${COLORS.WHITE}`,
        position: "fixed",
        top: "1em",
        left: "1em",
        borderRadius: "8px",
        zIndex: 1000,
        color: `${COLORS.BLACK}`,
        boxShadow: BOX_SHADOW,
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

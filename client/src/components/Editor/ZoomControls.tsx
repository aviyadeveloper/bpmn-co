import React from "react";
import { BOX_SHADOW, COLORS } from "../../constants";
import { useZoom } from "../../services/modeler/useZoom";

export const ZoomControls: React.FC = () => {
  const { zoomIn, zoomOut } = useZoom();

  return (
    <div
      style={{
        position: "fixed",
        bottom: "1em",
        right: "1em",
        display: "flex",
        gap: "8px",
        backgroundColor: COLORS.WHITE,
        padding: "8px",
        borderRadius: "8px",
        boxShadow: BOX_SHADOW,
        zIndex: 1000,
      }}
    >
      <button
        onClick={zoomOut}
        style={{
          padding: "4px 14px",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          backgroundColor: COLORS.GREY,
          fontSize: "20px",
        }}
        title="Zoom Out"
      >
        −
      </button>
      <button
        onClick={zoomIn}
        style={{
          padding: "4px 14px",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          backgroundColor: COLORS.GREY,
          fontSize: "20px",
        }}
        title="Zoom In"
      >
        +
      </button>
    </div>
  );
};

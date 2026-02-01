import React from "react";
import { useEditor } from "../../services/editor/useEditor";
import { Header } from "./Header/Header";
import { SideBar } from "./Sidebar/SideBar";
import { OfflineAlert } from "./OfflineAlert";
import { Diagram } from "./Diagram";
import { ZoomControls } from "./ZoomControls";

export const Editor: React.FC = () => {
  const { isConnected } = useEditor();
  const { containerRef, zoomIn, zoomOut } = Diagram();

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        flexDirection: "column",
        maxWidth: "100vw",
      }}
    >
      <Header />
      <div
        ref={containerRef}
        style={{
          flex: 1,
          backgroundColor: "#f5f5f5",
          position: "absolute",
          width: "100%",
          height: "100%",
        }}
      />
      <SideBar />
      <ZoomControls onZoomIn={zoomIn} onZoomOut={zoomOut} />
      {!isConnected && <OfflineAlert />}
    </div>
  );
};

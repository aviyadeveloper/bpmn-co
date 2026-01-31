import React from "react";
import { useEditor } from "../../services/editor/useEditor";
import { Header } from "./Header/Header";
import { SideBar } from "./Sidebar/SideBar";
import { OfflineAlert } from "./OfflineAlert";
import { Diagram } from "./Diagram";

export const Editor: React.FC = () => {
  const { isConnected } = useEditor();

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
      <Diagram />
      <SideBar />
      {!isConnected && <OfflineAlert />}
    </div>
  );
};

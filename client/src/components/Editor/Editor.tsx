import React from "react";
import { Header } from "./Header/Header";
import { useCollaboration } from "../../contexts/CollaborationProvider";
import { SideBar } from "./Sidebar/SideBar";
import { OfflineAlert } from "./OfflineAlert";
import { Diagram } from "./Diagram";

export const Editor: React.FC = () => {
  const { isConnected, reconnectCount } = useCollaboration();

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
      {!isConnected && <OfflineAlert reconnectCount={reconnectCount} />}
    </div>
  );
};

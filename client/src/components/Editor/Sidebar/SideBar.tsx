import React from "react";
import { UserList } from "./UserList";
import { LockedElements } from "./LockedElements";

export const SideBar: React.FC = () => {
  return (
    <div
      style={{
        width: "300px",
        borderLeft: "1px solid #ddd",
        backgroundColor: "#fafafa",
        padding: "16px",
        overflowY: "auto",
        position: "absolute",
        right: "1em",
        top: "1em",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
      }}
    >
      <UserList />
      <LockedElements />
    </div>
  );
};

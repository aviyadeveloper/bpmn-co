import React from "react";
import { useCollaboration } from "../../../contexts/CollaborationProvider";

export const NameControl: React.FC = ({}) => {
  const { sendUserNameUpdate, collaborationState } = useCollaboration();
  const { userId, currentUserName } = collaborationState;

  const handleNameChange = () => {
    const newName = prompt("Enter your name:", currentUserName || "");
    if (newName && newName.trim()) {
      sendUserNameUpdate(newName.trim());
    }
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <span style={{ fontSize: "14px" }}>
        Connected as: <strong>{currentUserName || userId?.slice(0, 8)}</strong>
      </span>
      <button
        onClick={handleNameChange}
        style={{
          padding: "6px 12px",
          fontSize: "14px",
          cursor: "pointer",
        }}
      >
        Edit
      </button>
    </div>
  );
};

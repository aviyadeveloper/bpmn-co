import React from "react";
import { useEditor } from "../../../services/editor/useEditor";
export const NameControl: React.FC = ({}) => {
  // const { sendUserNameUpdate, collaborationState } = useCollaboration();
  // const { userId, currentUserName } = collaborationState;
  const { sendUserNameUpdate, userId, userName } = useEditor();

  const handleNameChange = () => {
    const newName = prompt("Enter your name:", userName || "");
    if (newName && newName.trim()) {
      sendUserNameUpdate(newName.trim());
    }
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <span style={{ fontSize: "14px" }}>
        Connected as: <strong>{userName || userId?.slice(0, 8)}</strong>
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

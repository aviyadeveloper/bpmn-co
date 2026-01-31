import React from "react";
import { useCollaboration } from "./CollaborationProvider";

export const UserList: React.FC = () => {
  const { collaborationState } = useCollaboration();
  const { userId, users } = collaborationState;

  return (
    <div style={{ marginBottom: "24px" }}>
      <h3 style={{ margin: "0 0 12px 0", fontSize: "16px" }}>
        Online Users ({Object.keys(users).length})
      </h3>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {Object.entries(users).map((user) => (
          <li
            key={user[0]}
            style={{
              padding: "8px",
              marginBottom: "4px",
              backgroundColor: user[0] === userId ? "#e3f2fd" : "#fff",
              borderRadius: "4px",
              fontSize: "14px",
            }}
          >
            {user[1]}
            {user[0] === userId && (
              <span style={{ color: "#1976d2", fontWeight: "bold" }}>
                {" "}
                (You)
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

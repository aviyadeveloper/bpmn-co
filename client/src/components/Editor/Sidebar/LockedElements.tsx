import React from "react";
import { useCollaboration } from "../../../contexts/CollaborationProvider";

export const LockedElements: React.FC = () => {
  const { collaborationState } = useCollaboration();
  const { userId, users, lockedElements } = collaborationState;

  return (
    <div style={{ marginBottom: "24px" }}>
      {Object.keys(lockedElements).length > 0 && (
        <div>
          <h3 style={{ margin: "0 0 12px 0", fontSize: "16px" }}>
            Currently Editing
          </h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {Object.entries(lockedElements).map((lockedElement) => {
              const isMe = userId === lockedElement[1];
              return (
                <li
                  key={lockedElement[0]}
                  style={{
                    padding: "8px",
                    marginBottom: "4px",
                    backgroundColor: isMe ? "#e8f5e9" : "#fff3e0",
                    borderRadius: "4px",
                    fontSize: "13px",
                  }}
                >
                  <div style={{ fontWeight: "bold", marginBottom: "2px" }}>
                    {lockedElement[0]}
                  </div>
                  <div style={{ color: "#555", fontSize: "12px" }}>
                    {isMe ? "You" : users[lockedElement[1]]}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

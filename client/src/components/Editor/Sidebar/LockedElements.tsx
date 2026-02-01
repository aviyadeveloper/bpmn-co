import React from "react";
import { useEditor } from "../../../services/editor/useEditor";
import { COLORS } from "../../../constants";
export const LockedElements: React.FC = () => {
  const { userId, users, lockedElements } = useEditor();

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
                    marginBottom: "8px",
                    backgroundColor: isMe
                      ? `${COLORS.GREEN}25`
                      : `${COLORS.YELLOW}25`,
                    borderRadius: "8px",
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

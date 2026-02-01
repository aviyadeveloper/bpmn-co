import React from "react";
import { useEditor } from "../../../services/editor/useEditor";
import { COLORS } from "../../../constants";

export const UserList: React.FC = () => {
  const { userId, users } = useEditor();

  return (
    <div style={{ marginBottom: "24px" }}>
      <h3 style={{ margin: "0 0 12px 0", fontSize: "16px" }}>
        Online Users ({Object.keys(users).length})
      </h3>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {Object.entries(users)
          .sort(([id]) => (id === userId ? -1 : 1))
          .map((user) => (
            <li
              key={user[0]}
              style={{
                padding: "8px",
                marginBottom: "4px",
                backgroundColor:
                  user[0] === userId ? `${COLORS.BLUE}25` : "none",
                borderRadius: "4px",
                fontSize: "14px",
              }}
            >
              {user[1]}
              {user[0] === userId && (
                <span style={{ color: COLORS.BLUE, fontWeight: "bold" }}>
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

import React from "react";
import { useEditor } from "../../../services/editor/useEditor";
import { UserItem } from "./UserItem";

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
          .map(([id, name]) => (
            <UserItem
              key={id}
              userId={id}
              userName={name}
              isCurrentUser={id === userId}
            />
          ))}
      </ul>
    </div>
  );
};

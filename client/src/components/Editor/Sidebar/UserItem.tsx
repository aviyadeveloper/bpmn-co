import React from "react";
import { COLORS } from "../../../constants";
import { UserExitButton } from "./UserExitButton";

type UserItemProps = {
  userId: string;
  userName: string;
  isCurrentUser: boolean;
};

export const UserItem: React.FC<UserItemProps> = ({
  userId,
  userName,
  isCurrentUser,
}) => {
  return (
    <li
      key={userId}
      style={{
        padding: "8px",
        marginBottom: "4px",
        backgroundColor: isCurrentUser ? `${COLORS.BLUE}25` : "none",
        borderRadius: "4px",
        fontSize: "14px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <span>
        {userName}
        {isCurrentUser && (
          <span style={{ color: COLORS.BLUE, fontWeight: "bold" }}> (You)</span>
        )}
      </span>
      {isCurrentUser && <UserExitButton />}
    </li>
  );
};

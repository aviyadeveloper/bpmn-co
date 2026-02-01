import React from "react";
import { UserList } from "./UserList";
import { LockedElements } from "./LockedElements";
import { BOX_SHADOW, COLORS } from "../../../constants";

export const SideBar: React.FC = () => {
  return (
    <div
      style={{
        width: "200px",
        backgroundColor: COLORS.WHITE,
        padding: "16px",
        overflowY: "auto",
        position: "absolute",
        right: "1em",
        top: "1em",
        borderRadius: "8px",
        boxShadow: BOX_SHADOW,
      }}
    >
      <UserList />
      {/* <LockedElements /> */}
    </div>
  );
};

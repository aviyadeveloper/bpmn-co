import type React from "react";
import { COLORS } from "../../constants";

type JoinButtonProps = {
  onJoin: () => void;
};

export const JoinButton: React.FC<JoinButtonProps> = ({ onJoin }) => {
  return (
    <button
      style={{
        padding: "12px 24px",
        fontSize: 24,
        backgroundColor: `${COLORS.BLUE}50`,
        cursor: "pointer",
        border: "none",
        borderRadius: "8px",
      }}
      onClick={onJoin}
    >
      Join Collaboration
    </button>
  );
};

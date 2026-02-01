import type React from "react";
import { COLORS } from "../../constants";

type JoinButtonProps = {
  onJoin: () => void;
};

export const JoinButton: React.FC<JoinButtonProps> = ({ onJoin }) => {
  return (
    <button
      style={{
        padding: "16px 48px",
        fontSize: "18px",
        fontWeight: "600",
        backgroundColor: COLORS.BLUE,
        color: COLORS.WHITE,
        cursor: "pointer",
        border: "none",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(87, 117, 144, 0.3)",
        transition: "all 0.3s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = COLORS.OFFBLACK;
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 6px 16px rgba(87, 117, 144, 0.4)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = COLORS.BLUE;
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(87, 117, 144, 0.3)";
      }}
      onClick={onJoin}
    >
      Join Collaboration
    </button>
  );
};

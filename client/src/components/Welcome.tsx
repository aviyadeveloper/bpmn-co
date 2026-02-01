import type React from "react";
import { useMainStore } from "../services/main/mainStore";
import { COLORS } from "../constants";

type WelcomeProps = {
  existingDiagram: boolean;
};

export const Welcome: React.FC<WelcomeProps> = ({ existingDiagram }) => {
  const { openEditor } = useMainStore();
  return (
    <div
      style={{
        position: "absolute",
        top: "25%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        textAlign: "center",
        color: COLORS.BLACK,
      }}
    >
      <h1>Welcome to BPMN-CO!</h1>
      <p>Collaborate on BPMN diagrams in real-time.</p>
      <button
        style={{
          marginTop: 20,
          padding: "12px 24px",
          fontSize: 24,
          backgroundColor: `${COLORS.BLUE}50`,
        }}
        onClick={openEditor}
      >
        {existingDiagram ? "Join Collaboration" : "Create new Diagram"}
      </button>
    </div>
  );
};

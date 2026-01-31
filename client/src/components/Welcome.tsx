import type React from "react";
import { useMainStore } from "../services/main/mainStore";

type WelcomeProps = {
  existingDiagram: boolean;
};

export const Welcome: React.FC<WelcomeProps> = ({ existingDiagram }) => {
  const { openEditor } = useMainStore();
  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        textAlign: "center",
        color: "#888",
      }}
    >
      <h1>Welcome to Diagramer!</h1>
      <p>Create a new diagram or join an existing collaboration.</p>
      <button onClick={openEditor}>
        {existingDiagram ? "Join Collaboration" : "Create new Diagram"}
      </button>
    </div>
  );
};

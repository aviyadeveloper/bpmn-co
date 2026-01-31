import type React from "react";

type WelcomeProps = {
  existingDiagram: boolean;
};

export const Welcome: React.FC<WelcomeProps> = ({ existingDiagram }) => {
  const handleStart = () => {
    console.log("Starting new diagram or joining collaboration...");
  };

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        textAlign: "center",
        color: "#888",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>Welcome to Diagramer!</h1>
      <p>
        Start by creating a new diagram or opening an existing one to begin
        collaborating.
      </p>
      {!existingDiagram ? (
        <button onClick={handleStart}>Create new Diagram</button>
      ) : (
        <button onClick={handleStart}>Join Collaboration</button>
      )}
    </div>
  );
};

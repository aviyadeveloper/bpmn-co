import type React from "react";
import { useEffect } from "react";
import { useMainStore } from "../../services/main/mainStore";
import { COLORS, type TemplateId } from "../../constants";
import { TemplateSelector } from "./TemplateSelector";
import { JoinButton } from "./JoinButton";

export const Welcome: React.FC = () => {
  const {
    openEditor,
    setSelectedTemplate,
    checkInitialization,
    diagramInitialized,
    isCheckingInitialization,
  } = useMainStore();

  // Check initialization status on mount
  useEffect(() => {
    checkInitialization();
  }, [checkInitialization]);

  const handleTemplateSelect = (templateId: TemplateId) => {
    setSelectedTemplate(templateId);
    openEditor();
  };

  const handleJoinDiagram = () => {
    openEditor();
  };

  // Show loading state while checking
  if (isCheckingInitialization) {
    return (
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
          color: COLORS.BLACK,
        }}
      >
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        textAlign: "center",
        color: COLORS.BLACK,
        width: "90%",
        maxWidth: "1000px",
      }}
    >
      <h1>Welcome to BPMN-CO!</h1>
      <p style={{ marginBottom: "40px", color: COLORS.OFFBLACK }}>
        Collaborate on BPMN diagrams in real-time.
      </p>

      {diagramInitialized ? (
        <>
          <p style={{ marginBottom: "20px", color: COLORS.OFFBLACK }}>
            A diagram is already in progress
          </p>
          <JoinButton onJoin={handleJoinDiagram} />
        </>
      ) : (
        <>
          <p style={{ marginBottom: "20px", color: COLORS.OFFBLACK }}>
            Choose a template to get started
          </p>
          <TemplateSelector onSelectTemplate={handleTemplateSelect} />
        </>
      )}
    </div>
  );
};

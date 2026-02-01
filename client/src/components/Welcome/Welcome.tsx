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
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `linear-gradient(135deg, ${COLORS.OFFWHITE} 0%, ${COLORS.WHITE} 50%, ${COLORS.BLUE}15 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "auto",
      }}
    >
      <div
        style={{
          textAlign: "center",
          color: COLORS.BLACK,
          width: "90%",
          maxWidth: "1000px",
          padding: "40px 20px",
        }}
      >
        <h1
          style={{
            fontSize: "48px",
            marginBottom: "16px",
            fontWeight: "700",
            color: COLORS.BLACK,
            letterSpacing: "-0.5px",
          }}
        >
          Welcome to BPMN-CO!
        </h1>
        <p
          style={{
            marginBottom: "50px",
            color: COLORS.OFFBLACK,
            fontSize: "18px",
            fontWeight: "400",
          }}
        >
          Collaborate on BPMN diagrams in real-time.
        </p>

        {diagramInitialized ? (
          <div
            style={{
              backgroundColor: COLORS.WHITE,
              borderRadius: "16px",
              padding: "40px",
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
              maxWidth: "500px",
              margin: "0 auto",
            }}
          >
            <div
              style={{
                fontSize: "48px",
                marginBottom: "20px",
              }}
            >
              🔗
            </div>
            <p
              style={{
                marginBottom: "24px",
                color: COLORS.OFFBLACK,
                fontSize: "16px",
              }}
            >
              A diagram is already in progress
            </p>
            <JoinButton onJoin={handleJoinDiagram} />
          </div>
        ) : (
          <>
            <p
              style={{
                marginBottom: "32px",
                color: COLORS.OFFBLACK,
                fontSize: "16px",
                fontWeight: "500",
              }}
            >
              Choose a template to get started
            </p>
            <TemplateSelector onSelectTemplate={handleTemplateSelect} />
          </>
        )}
      </div>
    </div>
  );
};

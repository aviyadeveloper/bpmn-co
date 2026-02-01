import type React from "react";
import { COLORS, type TemplateId } from "../../constants";

type TemplateButtonProps = {
  id: TemplateId;
  name: string;
  description: string;
  onSelect: (templateId: TemplateId) => void;
};

export const TemplateButton: React.FC<TemplateButtonProps> = ({
  id,
  name,
  description,
  onSelect,
}) => {
  return (
    <div
      onClick={() => onSelect(id)}
      style={{
        padding: "24px",
        backgroundColor: `${COLORS.BLUE}20`,
        border: `2px solid ${COLORS.BLUE}`,
        borderRadius: "8px",
        cursor: "pointer",
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = `${COLORS.BLUE}40`;
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = `${COLORS.BLUE}20`;
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <h3 style={{ marginBottom: "8px", color: COLORS.BLACK }}>{name}</h3>
      <p
        style={{
          fontSize: "14px",
          color: COLORS.OFFBLACK,
          margin: 0,
        }}
      >
        {description}
      </p>
    </div>
  );
};

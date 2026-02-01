import type React from "react";
import { COLORS, type TemplateId } from "../../constants";

type TemplateButtonProps = {
  id: TemplateId;
  name: string;
  description: string;
  onSelect: (templateId: TemplateId) => void;
};

const TEMPLATE_ICONS: Record<TemplateId, string> = {
  blank: "📄",
  "simple-process": "➡️",
  "approval-workflow": "✓",
  "cross-functional": "▦",
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
        padding: "32px 24px",
        backgroundColor: COLORS.WHITE,
        border: `2px solid ${COLORS.GREY}`,
        borderRadius: "12px",
        cursor: "pointer",
        transition: "all 0.3s ease",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = COLORS.OFFWHITE;
        e.currentTarget.style.borderColor = COLORS.BLUE;
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 8px 16px rgba(0, 0, 0, 0.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = COLORS.WHITE;
        e.currentTarget.style.borderColor = COLORS.GREY;
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.08)";
      }}
    >
      <div
        style={{
          fontSize: "48px",
          marginBottom: "16px",
          lineHeight: "1",
        }}
      >
        {TEMPLATE_ICONS[id]}
      </div>
      <h3
        style={{
          marginBottom: "8px",
          color: COLORS.BLACK,
          fontSize: "18px",
          fontWeight: "600",
        }}
      >
        {name}
      </h3>
      <p
        style={{
          fontSize: "14px",
          color: COLORS.OFFBLACK,
          margin: 0,
          lineHeight: "1.5",
        }}
      >
        {description}
      </p>
    </div>
  );
};

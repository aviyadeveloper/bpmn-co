import type React from "react";
import { TEMPLATES, type TemplateId } from "../../constants";
import { TemplateButton } from "./TemplateButton";

type TemplateSelectorProps = {
  onSelectTemplate: (templateId: TemplateId) => void;
};

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  onSelectTemplate,
}) => {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "20px",
        width: "100%",
      }}
    >
      {Object.values(TEMPLATES).map((template) => (
        <TemplateButton
          key={template.id}
          id={template.id as TemplateId}
          name={template.name}
          description={template.description}
          onSelect={onSelectTemplate}
        />
      ))}
    </div>
  );
};

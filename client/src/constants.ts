// Base URLs from environment variables
export const WS_BASE_URL =
  import.meta.env.VITE_WS_URL || "ws://localhost:8000/ws";
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

// Function to build WebSocket URL with optional template parameter
export const buildWsUrl = (template?: string) => {
  return template ? `${WS_BASE_URL}?template=${template}` : WS_BASE_URL;
};

export const TEMPLATES = {
  blank: {
    id: "blank",
    name: "Blank Canvas",
    description: "Start with an empty diagram",
  },
  "simple-process": {
    id: "simple-process",
    name: "Simple Process",
    description: "Linear workflow with tasks",
  },
  "approval-workflow": {
    id: "approval-workflow",
    name: "Approval Workflow",
    description: "Process with approval gateway",
  },
  "cross-functional": {
    id: "cross-functional",
    name: "Cross-Functional",
    description: "Multiple swim lanes",
  },
} as const;

export type TemplateId = keyof typeof TEMPLATES;

export const COLORS = {
  WHITE: "#FFFFFF",
  OFFWHITE: "#F8F9FA",
  GREY: "#E9ECEF",
  OFFBLACK: "#343A40",
  BLACK: "#212529",
  RED: "#F94144",
  ORANGE: "#F3722C",
  YELLOW: "#F9C74F",
  GREEN: "#43AA8B",
  BLUE: "#577590",
  PURPLE: "#7678ed",
};

export const BOX_SHADOW = "0 2px 4px rgba(0, 0, 0, 0.2)";

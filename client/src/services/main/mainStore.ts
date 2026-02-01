import { create } from "zustand";
import type { TemplateId } from "../../constants";

interface MainState {
  editorOpened: boolean;
  selectedTemplate: TemplateId | null;
  isCheckingInitialization: boolean;
  diagramInitialized: boolean | null;

  openEditor: () => void;
  closeEditor: () => void;
  toggleEditor: () => void;
  setSelectedTemplate: (template: TemplateId) => void;
  checkInitialization: () => Promise<void>;
}

const initialState = {
  editorOpened: false,
  selectedTemplate: null as TemplateId | null,
  isCheckingInitialization: false,
  diagramInitialized: null as boolean | null,
};

export const useMainStore = create<MainState>((set, get) => ({
  ...initialState,
  openEditor: () => set({ editorOpened: true }),
  closeEditor: () => set({ editorOpened: false }),
  toggleEditor: () => set((state) => ({ editorOpened: !state.editorOpened })),
  setSelectedTemplate: (template: TemplateId) =>
    set({ selectedTemplate: template }),

  checkInitialization: async () => {
    // Don't check if already checking
    if (get().isCheckingInitialization) return;

    set({ isCheckingInitialization: true });

    try {
      const response = await fetch("http://localhost:8000/");
      const data = await response.json();

      set({
        diagramInitialized: data.is_initialized || false,
        isCheckingInitialization: false,
      });
    } catch (error) {
      console.error("Failed to check initialization status:", error);
      set({
        diagramInitialized: false,
        isCheckingInitialization: false,
      });
    }
  },
}));

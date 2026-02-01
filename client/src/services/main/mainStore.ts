import { create } from "zustand";
import { API_BASE_URL } from "../../constants";
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
  selectedTemplate: null,
  isCheckingInitialization: false,
  diagramInitialized: null,
};

export const useMainStore = create<MainState>((set, get) => ({
  ...initialState,
  openEditor: () => set({ editorOpened: true }),
  closeEditor: () => set({ editorOpened: false }),
  toggleEditor: () => set((state) => ({ editorOpened: !state.editorOpened })),
  setSelectedTemplate: (template: TemplateId) =>
    set({ selectedTemplate: template }),

  checkInitialization: async () => {
    if (get().isCheckingInitialization) return;

    set({ isCheckingInitialization: true });

    const finishCheck = (diagramInitialized: boolean) =>
      set({ diagramInitialized, isCheckingInitialization: false });

    try {
      const response = await fetch(`${API_BASE_URL}/`);
      const data = await response.json();
      finishCheck(data.is_initialized || false);
    } catch (error) {
      console.error("Failed to check initialization status:", error);
      finishCheck(false);
    }
  },
}));

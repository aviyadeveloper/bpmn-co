import { create } from "zustand";

interface MainState {
  editorOpened: boolean;

  openEditor: () => void;
  closeEditor: () => void;
  toggleEditor: () => void;
}

const initialState = {
  editorOpened: false,
};

export const useMainStore = create<MainState>((set) => ({
  ...initialState,
  openEditor: () => set({ editorOpened: true }),
  closeEditor: () => set({ editorOpened: false }),
  toggleEditor: () => set((state) => ({ editorOpened: !state.editorOpened })),
}));

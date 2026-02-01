import { create } from "zustand";
import type { Users, lockedElements, UserId } from "../../types";
import { emptyBpmnXml } from "./emptyBpmnXml";

interface EditorState {
  isConnected: boolean;
  userId: UserId;
  userName: string;
  users: Users;
  lockedElements: lockedElements;
  xml: string;
  template: string;
  isInitialized: boolean;
  zoomIn: (() => void) | null;
  zoomOut: (() => void) | null;

  setConnected: (isConnected: boolean) => void;
  setFullState: (
    userId: UserId,
    userName: string,
    users: Users,
    lockedElements: lockedElements,
    xml: string,
    template: string,
    isInitialized: boolean,
  ) => void;
  updateUsers: (users: Users) => void;
  updateUserName: (userName: string) => void;
  updateLockedElements: (lockedElements: lockedElements) => void;
  setXml: (xml: string) => void;
  setZoomFunctions: (zoomIn: () => void, zoomOut: () => void) => void;
  reset: () => void;
}

const initialState = {
  isConnected: false,
  userId: "",
  userName: "",
  users: {},
  lockedElements: {},
  xml: emptyBpmnXml,
  template: "",
  isInitialized: false,
  zoomIn: null as (() => void) | null,
  zoomOut: null as (() => void) | null,
};

export const useEditorStore = create<EditorState>((set) => ({
  ...initialState,

  setConnected: (isConnected) => set({ isConnected }),
  setFullState: (
    userId,
    userName,
    users,
    lockedElements,
    xml,
    template,
    isInitialized,
  ) =>
    set({
      userId,
      userName,
      users,
      lockedElements,
      xml,
      template,
      isInitialized,
    }),
  updateUsers: (users) => set({ users }),
  updateUserName: (userName) => set({ userName }),
  updateLockedElements: (lockedElements) => set({ lockedElements }),
  setXml: (xml) => set({ xml }),
  setZoomFunctions: (zoomIn, zoomOut) => set({ zoomIn, zoomOut }),
  reset: () => set(initialState),
}));

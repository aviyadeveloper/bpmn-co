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

  setConnected: (isConnected: boolean) => void;
  setFullState: (
    userId: UserId,
    userName: string,
    users: Users,
    lockedElements: lockedElements,
    xml: string,
  ) => void;
  updateUsers: (users: Users) => void;
  updateUserName: (userName: string) => void;
  updateLockedElements: (lockedElements: lockedElements) => void;
  setXml: (xml: string) => void;
  reset: () => void;
}

const initialState = {
  isConnected: false,
  userId: "",
  userName: "",
  users: {},
  lockedElements: {},
  xml: emptyBpmnXml,
};

export const useEditorStore = create<EditorState>((set) => ({
  ...initialState,

  setConnected: (isConnected) => set({ isConnected }),
  setFullState: (userId, userName, users, lockedElements, xml) =>
    set({ userId, userName, users, lockedElements, xml }),
  updateUsers: (users) => set({ users }),
  updateUserName: (userName) => set({ userName }),
  updateLockedElements: (lockedElements) => set({ lockedElements }),
  setXml: (xml) => set({ xml }),
  reset: () => set(initialState),
}));

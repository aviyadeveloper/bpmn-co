import { useCallback, useEffect } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import type {
  ServerToClientMessage,
  ClientToServerMessage,
  ElementId,
  UserId,
  Users,
  lockedElements,
} from "../../types";
import { useEditorStore } from "./editorStore";
import { WS_URL } from "../../constants";

export interface UseEditorReturn {
  isConnected: boolean;
  userId: UserId;
  userName: string;
  users: Users;
  lockedElements: lockedElements;
  xml: string;

  sendXmlUpdate: (xml: string) => void;
  sendUserNameUpdate: (name: string) => void;
  sendElementSelect: (elementIds: ElementId | ElementId[]) => void;
  sendElementDeselect: (elementId: ElementId) => void;
}

export function useEditor(): UseEditorReturn {
  const {
    userId,
    userName,
    users,
    lockedElements,
    xml,
    setConnected,
    setFullState,
    updateUsers,
    updateUserName,
    setXml,
    updateLockedElements,
  } = useEditorStore();

  // Handle incoming WebSocket messages
  const handleMessage = (event: MessageEvent) => {
    try {
      const message = JSON.parse(event.data) as ServerToClientMessage;

      switch (message.type) {
        case "init":
          setFullState(
            message.user_id,
            message.users,
            message.locked_elements,
            message.xml,
          );
          break;

        case "xml_update":
          setXml(message.xml);
          break;

        case "users_update":
          updateUsers(message.users);
          const currentUserId = useEditorStore.getState().userId;
          if (message.users[currentUserId]) {
            updateUserName(message.users[currentUserId]);
          }
          break;

        case "locked_elements_update":
          updateLockedElements(message.locked_elements);
          break;

        case "error":
          console.error("[useEditor] Server error:", message.message);
          break;

        default:
          console.warn("[useEditor] Unknown message type:", message);
      }
    } catch (error) {
      console.error(
        "[useEditor] Failed to parse message:",
        error,
        "Raw message:",
        event.data,
      );
    }
  };

  // Use react-use-websocket with share: true to prevent multiple connections
  const { sendMessage, readyState } = useWebSocket(WS_URL, {
    share: true,
    shouldReconnect: () => true,
    reconnectAttempts: 10,
    reconnectInterval: 1000,
    onMessage: handleMessage,
    onError: (event) => {
      console.error("[useEditor] WebSocket error:", event);
    },
  });

  const isConnected = readyState === ReadyState.OPEN;

  useEffect(() => {
    setConnected(isConnected);
  }, [isConnected, setConnected]);

  // Generic send helper
  const send = (message: ClientToServerMessage) => {
    if (readyState === ReadyState.OPEN) {
      sendMessage(JSON.stringify(message));
    }
  };

  /**
   * Type-safe websocket message dispatchers
   */

  const sendXmlUpdate = useCallback(
    (xml: string) => send({ type: "xml_update", xml }),
    [send],
  );

  const sendUserNameUpdate = useCallback(
    (name: string) => send({ type: "user_name_update", name }),
    [send],
  );

  const sendElementSelect = useCallback(
    (elementIds: ElementId | ElementId[]) => {
      const ids = Array.isArray(elementIds) ? elementIds : [elementIds];
      send({ type: "element_select", element_ids: ids });
    },
    [send],
  );

  const sendElementDeselect = useCallback(
    (elementId: ElementId) =>
      send({ type: "element_deselect", element_id: elementId }),
    [send],
  );

  return {
    isConnected,
    userId,
    userName,
    users,
    lockedElements,
    xml,
    sendXmlUpdate,
    sendUserNameUpdate,
    sendElementSelect,
    sendElementDeselect,
  };
}

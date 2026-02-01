import { useEffect, useCallback, useRef } from "react";
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
import { buildWsUrl } from "../../constants";
import type { TemplateId } from "../../constants";

export interface UseEditorConnectionReturn {
  isConnected: boolean;
  userId: UserId;
  userName: string;
  users: Users;
  lockedElements: lockedElements;
  xml: string;
  template: string;
  isInitialized: boolean;

  sendXmlUpdate: (xml: string) => void;
  sendUserNameUpdate: (name: string) => void;
  sendElementSelect: (elementIds: ElementId | ElementId[]) => void;
  sendElementDeselect: (elementId: ElementId) => void;
  connect: (template?: TemplateId) => void;
  disconnect: () => void;
}

/**
 * Hook for managing WebSocket connection with template parameter support.
 * Allows connecting with a chosen template or without (for joining existing session).
 */
export function useEditorConnection(): UseEditorConnectionReturn {
  const {
    userId,
    userName,
    users,
    lockedElements,
    xml,
    template,
    isInitialized,
    setConnected,
    setFullState,
    updateUsers,
    updateUserName,
    setXml,
    updateLockedElements,
  } = useEditorStore();

  const wsUrlRef = useRef<string | null>(null);
  const shouldConnectRef = useRef(false);

  // Handle incoming WebSocket messages
  const handleMessage = (event: MessageEvent) => {
    try {
      const message = JSON.parse(event.data) as ServerToClientMessage;

      switch (message.type) {
        case "init":
          setFullState(
            message.user_id,
            message.user_name,
            message.users,
            message.locked_elements,
            message.xml,
            message.template,
            message.is_initialized,
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
          console.error("[useEditorConnection] Server error:", message.message);
          break;

        default:
          console.warn("[useEditorConnection] Unknown message type:", message);
      }
    } catch (error) {
      console.error(
        "[useEditorConnection] Failed to parse message:",
        error,
        "Raw message:",
        event.data,
      );
    }
  };

  // Use react-use-websocket with conditional URL
  const { sendMessage, readyState, getWebSocket } = useWebSocket(
    wsUrlRef.current,
    {
      share: false,
      shouldReconnect: () => shouldConnectRef.current,
      reconnectAttempts: 10,
      reconnectInterval: 1000,
      onMessage: handleMessage,
      onError: (event) => {
        console.error("[useEditorConnection] WebSocket error:", event);
      },
    },
    shouldConnectRef.current, // Only connect when explicitly requested
  );

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

  const connect = useCallback((template?: TemplateId) => {
    wsUrlRef.current = buildWsUrl(template);
    shouldConnectRef.current = true;
  }, []);

  const disconnect = useCallback(() => {
    shouldConnectRef.current = false;
    const ws = getWebSocket();
    if (ws) {
      ws.close();
    }
  }, [getWebSocket]);

  return {
    isConnected,
    userId,
    userName,
    users,
    lockedElements,
    xml,
    template,
    isInitialized,
    sendXmlUpdate,
    sendUserNameUpdate,
    sendElementSelect,
    sendElementDeselect,
    connect,
    disconnect,
  };
}

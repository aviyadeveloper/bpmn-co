/**
 * useDiagramSync - Type-safe WebSocket hook for BPMN diagram collaboration.
 *
 * This hook wraps a generic WebSocket hook to provide:
 * - Type-safe message parsing and handling for BPMN collaboration.
 * - Management of collaboration state (users, locked elements, client ID).
 * - Type-safe send methods for all relevant message types.
 * - Automatic state updates based on server messages.
 */

import { useCallback, useState } from "react";
import { useWebSocket } from "./useWebSocket";
import type {
  ServerToClientMessage,
  XmlUpdateMessage,
  UserNameUpdateMessage,
  ElementSelectMessage,
  ElementDeselectMessage,
  CollaborationState,
  Users,
  lockedElements,
  UserId,
  ElementId,
} from "../components/types";

/**
 * Collaboration-specific event handlers
 */
export interface CollaborationHandlers {
  /** Called when initial state is received after connection */
  onInit?: (data: {
    xml: string;
    users: Users;
    lockedElements: lockedElements;
    userId: UserId;
  }) => void;

  /** Called when XML is updated by another user */
  onXmlUpdate?: (xml: string) => void;

  /** Called when user list is updated (name change, connect, disconnect) */
  onUsersUpdate?: (users: Users) => void;

  /** Called when locked elements state is updated */
  onLockedElementsUpdate?: (lockedElements: lockedElements) => void;

  /** Called when server sends an error message */
  onError?: (message: string) => void;
}

export interface UseDiagramSyncReturn {
  /** Current WebSocket ready state: 0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED */
  readyState: number;

  /** Manually initiate connection */
  connect: () => void;

  /** Manually close connection */
  close: () => void;

  /** Number of reconnection attempts made */
  reconnectCount: number;

  /** Current collaboration state (users, locks, client ID) */
  collaborationState: CollaborationState;

  /** Send XML update to server */
  sendXmlUpdate: (xml: string) => boolean;

  /** Update current user's display name */
  sendUserNameUpdate: (name: string) => boolean;

  /** Request to lock element(s) for editing. Accepts single element ID or array */
  sendElementSelect: (elementIds: ElementId | ElementId[]) => boolean;

  /** Release lock on an element */
  sendElementDeselect: (elementId: ElementId) => boolean;

  /** Check if WebSocket is currently connected */
  isConnected: boolean;
}

/**
 * useDiagramSync - Type-safe WebSocket hook for diagram collaboration
 *
 * This hook wraps the generic useWebSocket hook and provides:
 * - Type-safe message parsing and handling
 * - Collaboration state management (users, locks, client ID)
 * - Type-safe send methods for all message types
 * - Automatic state updates based on server messages
 *
 * Server Messages Handled:
 * 1. init - Initial state when connecting (xml, users, locked_elements, user_id)
 * 2. xml_update - Broadcast when another user updates the XML
 * 3. users_update - Broadcast when user list changes (name update, connect, disconnect)
 * 4. locked_elements_update - Broadcast when element locks change (select, deselect, disconnect)
 *
 * Usage Example:
 *   const {
 *     readyState,
 *     collaborationState,
 *     sendXmlUpdate,
 *     sendElementSelect
 *   } = useDiagramSync('ws://localhost:8000/ws', {
 *     onInit: ({ xml, users, userId }) => {
 *       console.log('Connected as:', userId);
 *       loadXmlIntoEditor(xml);
 *     },
 *     onLockedElementsUpdate: (lockedElements) => {
 *       updateLockIndicators(lockedElements);
 *     }
 *   });
 */
export function useDiagramSync(
  url: string,
  handlers: CollaborationHandlers = {},
): UseDiagramSyncReturn {
  // Track collaboration-specific state
  const [collaborationState, setCollaborationState] =
    useState<CollaborationState>({
      userId: null,
      users: {},
      lockedElements: {},
      currentUserName: null,
    });

  /**
   * Handle incoming WebSocket messages with type-safe parsing
   */
  const handleMessage = useCallback(
    (messageStr: string) => {
      try {
        const message = JSON.parse(messageStr) as ServerToClientMessage;

        switch (message.type) {
          case "init": {
            console.log("[useDiagramSync] Received init message:", message);
            // Update collaboration state with initial data
            setCollaborationState({
              userId: message.user_id,
              users: message.users,
              lockedElements: message.locked_elements,
              currentUserName: message.users[message.user_id] || null,
            });

            // Call user handler
            handlers.onInit?.({
              xml: message.xml,
              users: message.users,
              lockedElements: message.locked_elements,
              userId: message.user_id,
            });
            break;
          }

          case "xml_update": {
            handlers.onXmlUpdate?.(message.xml);
            break;
          }

          case "users_update": {
            // Update user list and current user name
            setCollaborationState((prev) => ({
              ...prev,
              users: message.users,
              currentUserName: prev.userId
                ? message.users[prev.userId] || null
                : null,
            }));

            handlers.onUsersUpdate?.(message.users);
            break;
          }

          case "locked_elements_update": {
            // Server sends authoritative lock state - replace our state completely
            console.log(
              "[useDiagramSync] Received locked_elements_update:",
              message.locked_elements,
            );
            setCollaborationState((prev) => ({
              ...prev,
              lockedElements: message.locked_elements,
            }));

            handlers.onLockedElementsUpdate?.(message.locked_elements);
            break;
          }

          case "error": {
            handlers.onError?.(message.message);
            break;
          }

          default: {
            console.warn("[useDiagramSync] Unknown message type:", message);
          }
        }
      } catch (error) {
        console.error(
          "[useDiagramSync] Failed to parse message:",
          error,
          "Raw message:",
          messageStr,
        );
      }
    },
    [handlers],
  );

  // Use the generic WebSocket hook with our message handler
  const ws = useWebSocket(url, {
    autoConnect: true,
    autoReconnect: true,
    maxReconnectAttempts: 10,
    reconnectInterval: 1000,
    onMessage: handleMessage,
    onError: (_event, errorInfo) => {
      console.error("[useDiagramSync] WebSocket error:", errorInfo);
    },
  });

  /**
   * Type-safe send helpers
   */

  const sendXmlUpdate = useCallback(
    (xml: string): boolean => {
      const message: XmlUpdateMessage = { type: "xml_update", xml };
      return ws.send(JSON.stringify(message));
    },
    [ws],
  );

  const sendUserNameUpdate = useCallback(
    (name: string): boolean => {
      const message: UserNameUpdateMessage = { type: "user_name_update", name };
      return ws.send(JSON.stringify(message));
    },
    [ws],
  );

  const sendElementSelect = useCallback(
    (elementIds: ElementId | ElementId[]): boolean => {
      // Support both single element and array for convenience
      const ids = Array.isArray(elementIds) ? elementIds : [elementIds];
      const message: ElementSelectMessage = {
        type: "element_select",
        element_ids: ids,
      };
      return ws.send(JSON.stringify(message));
    },
    [ws],
  );

  const sendElementDeselect = useCallback(
    (elementId: ElementId): boolean => {
      const message: ElementDeselectMessage = {
        type: "element_deselect",
        element_id: elementId,
      };
      return ws.send(JSON.stringify(message));
    },
    [ws],
  );

  return {
    // WebSocket state
    readyState: ws.readyState,
    connect: ws.connect,
    close: ws.close,
    reconnectCount: ws.reconnectCount,
    isConnected: ws.readyState === WebSocket.OPEN,

    // Collaboration state
    collaborationState,

    // Type-safe send methods
    sendXmlUpdate,
    sendUserNameUpdate,
    sendElementSelect,
    sendElementDeselect,
  };
}

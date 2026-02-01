// WebSocket Message Types for BPMN Collaboration

// ============================================================================
// Base Types
// ============================================================================

export type UserId = string;
export type ElementId = string;
export type UserName = string;

export interface Users {
  [userId: UserId]: UserName;
}

export interface lockedElements {
  [elementId: ElementId]: UserId;
}

// ============================================================================
// Client → Server Messages
// ============================================================================

export interface XmlUpdateMessage {
  type: "xml_update";
  xml: string;
}

export interface UserNameUpdateMessage {
  type: "user_name_update";
  name: string;
}

export interface ElementSelectMessage {
  type: "element_select";
  element_ids: ElementId[]; // Changed to array to support multi-select
}

export interface ElementDeselectMessage {
  type: "element_deselect";
  element_id: ElementId;
}

export type ClientToServerMessage =
  | XmlUpdateMessage
  | UserNameUpdateMessage
  | ElementSelectMessage
  | ElementDeselectMessage;

// ============================================================================
// Server → Client Messages
// ============================================================================

export interface InitMessage {
  type: "init";
  xml: string;
  users: Users;
  locked_elements: lockedElements;
  user_id: UserId;
  user_name: string;
}

export interface XmlUpdateBroadcast {
  type: "xml_update";
  xml: string;
}

export interface UsersUpdateMessage {
  type: "users_update";
  users: Users;
}

export interface LockedElementsUpdateMessage {
  type: "locked_elements_update";
  locked_elements: lockedElements;
}

export interface ErrorMessage {
  type: "error";
  message: string;
}

export type ServerToClientMessage =
  | InitMessage
  | XmlUpdateBroadcast
  | UsersUpdateMessage
  | LockedElementsUpdateMessage
  | ErrorMessage;

// ============================================================================
// Helper Types and Type Guards
// ============================================================================

export type WebSocketMessage = ClientToServerMessage | ServerToClientMessage;

// Type guards for server messages
export function isInitMessage(msg: ServerToClientMessage): msg is InitMessage {
  return msg.type === "init";
}

export function isXmlUpdateBroadcast(
  msg: ServerToClientMessage,
): msg is XmlUpdateBroadcast {
  return msg.type === "xml_update";
}

export function isUsersUpdateMessage(
  msg: ServerToClientMessage,
): msg is UsersUpdateMessage {
  return msg.type === "users_update";
}

export function isLockedElementsUpdateMessage(
  msg: ServerToClientMessage,
): msg is LockedElementsUpdateMessage {
  return msg.type === "locked_elements_update";
}

export function isErrorMessage(
  msg: ServerToClientMessage,
): msg is ErrorMessage {
  return msg.type === "error";
}

// ============================================================================
// Application State Types
// ============================================================================

export interface CollaborationState {
  userId: UserId | null;
  users: Users;
  lockedElements: lockedElements;
  currentUserName: UserName | null;
}

export interface LockInfo {
  isLocked: boolean;
  userId?: UserId;
  userName?: UserName;
  isLockedByMe: boolean;
}

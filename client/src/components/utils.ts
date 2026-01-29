// ============================================================================
// Helper Functions
// ============================================================================

import type {
  ElementId,
  lockedElements,
  UserId,
  Users,
  LockInfo,
} from "./types";

/**
 * Get lock information for a specific element
 */
export function getElementLockInfo(
  elementId: ElementId,
  lockedElements: lockedElements,
  users: Users,
  userId: UserId | null,
): LockInfo {
  const lockingUserId = lockedElements[elementId];

  if (!lockingUserId) {
    return {
      isLocked: false,
      isLockedByMe: false,
    };
  }

  return {
    isLocked: true,
    userId: lockingUserId,
    userName: users[lockingUserId],
    isLockedByMe: lockingUserId === userId,
  };
}

/**
 * Check if current user can edit an element
 */
export function canEditElement(
  elementId: ElementId,
  lockedElements: lockedElements,
  userId: UserId | null,
): boolean {
  const lockingUserId = lockedElements[elementId];
  return !lockingUserId || lockingUserId === userId;
}

/**
 * Get all elements locked by a specific user
 */
export function getElementsLockedByUser(
  userId: UserId,
  lockedElements: lockedElements,
): ElementId[] {
  return Object.entries(lockedElements)
    .filter(([_, lockUserId]) => lockUserId === userId)
    .map(([elementId]) => elementId);
}

import { describe, it, expect } from "vitest";
import {
  getElementLockInfo,
  canEditElement,
  getElementsLockedByUser,
} from "./utils";
import type { lockedElements, Users, UserId, ElementId } from "./types";

describe("utils", () => {
  // Test data setup
  const mockUsers: Users = {
    user1: "Alice",
    user2: "Bob",
    user3: "Charlie",
  };

  const mockLockedElements: lockedElements = {
    element1: "user1",
    element2: "user2",
    element3: "user1",
  };

  describe("getElementLockInfo", () => {
    it("should return unlocked info when element is not locked", () => {
      // Arrange
      const elementId = "unlockedElement";
      const userId = "user1";

      // Act
      const result = getElementLockInfo(
        elementId,
        mockLockedElements,
        mockUsers,
        userId,
      );

      // Assert
      expect(result).toEqual({
        isLocked: false,
        isLockedByMe: false,
      });
    });

    it("should return locked info when element is locked by current user", () => {
      // Arrange
      const elementId = "element1";
      const userId = "user1";

      // Act
      const result = getElementLockInfo(
        elementId,
        mockLockedElements,
        mockUsers,
        userId,
      );

      // Assert
      expect(result).toEqual({
        isLocked: true,
        userId: "user1",
        userName: "Alice",
        isLockedByMe: true,
      });
    });

    it("should return locked info when element is locked by another user", () => {
      // Arrange
      const elementId = "element2";
      const userId = "user1";

      // Act
      const result = getElementLockInfo(
        elementId,
        mockLockedElements,
        mockUsers,
        userId,
      );

      // Assert
      expect(result).toEqual({
        isLocked: true,
        userId: "user2",
        userName: "Bob",
        isLockedByMe: false,
      });
    });

    it("should handle null userId correctly", () => {
      // Arrange
      const elementId = "element1";
      const userId = null;

      // Act
      const result = getElementLockInfo(
        elementId,
        mockLockedElements,
        mockUsers,
        userId,
      );

      // Assert
      expect(result).toEqual({
        isLocked: true,
        userId: "user1",
        userName: "Alice",
        isLockedByMe: false,
      });
    });

    it("should return unlocked when checking with null userId on unlocked element", () => {
      // Arrange
      const elementId = "unlockedElement";
      const userId = null;

      // Act
      const result = getElementLockInfo(
        elementId,
        mockLockedElements,
        mockUsers,
        userId,
      );

      // Assert
      expect(result).toEqual({
        isLocked: false,
        isLockedByMe: false,
      });
    });

    it("should handle empty lockedElements object", () => {
      // Arrange
      const elementId = "element1";
      const emptyLocks = {};
      const userId = "user1";

      // Act
      const result = getElementLockInfo(
        elementId,
        emptyLocks,
        mockUsers,
        userId,
      );

      // Assert
      expect(result).toEqual({
        isLocked: false,
        isLockedByMe: false,
      });
    });

    it("should handle user not in users map", () => {
      // Arrange
      const elementId = "element1";
      const locksWithUnknownUser = { element1: "unknownUser" };
      const userId = "user1";

      // Act
      const result = getElementLockInfo(
        elementId,
        locksWithUnknownUser,
        mockUsers,
        userId,
      );

      // Assert
      expect(result).toEqual({
        isLocked: true,
        userId: "unknownUser",
        userName: undefined,
        isLockedByMe: false,
      });
    });
  });

  describe("canEditElement", () => {
    it("should return true when element is not locked", () => {
      // Arrange
      const elementId = "unlockedElement";
      const userId = "user1";

      // Act
      const result = canEditElement(elementId, mockLockedElements, userId);

      // Assert
      expect(result).toBe(true);
    });

    it("should return true when element is locked by current user", () => {
      // Arrange
      const elementId = "element1";
      const userId = "user1";

      // Act
      const result = canEditElement(elementId, mockLockedElements, userId);

      // Assert
      expect(result).toBe(true);
    });

    it("should return false when element is locked by another user", () => {
      // Arrange
      const elementId = "element2";
      const userId = "user1";

      // Act
      const result = canEditElement(elementId, mockLockedElements, userId);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false when userId is null and element is locked", () => {
      // Arrange
      const elementId = "element1";
      const userId = null;

      // Act
      const result = canEditElement(elementId, mockLockedElements, userId);

      // Assert
      expect(result).toBe(false);
    });

    it("should return true when userId is null and element is not locked", () => {
      // Arrange
      const elementId = "unlockedElement";
      const userId = null;

      // Act
      const result = canEditElement(elementId, mockLockedElements, userId);

      // Assert
      expect(result).toBe(true);
    });

    it("should handle empty lockedElements object", () => {
      // Arrange
      const elementId = "element1";
      const emptyLocks = {};
      const userId = "user1";

      // Act
      const result = canEditElement(elementId, emptyLocks, userId);

      // Assert
      expect(result).toBe(true);
    });

    it("should return false for user who doesn't own the lock", () => {
      // Arrange
      const elementId = "element1";
      const userId = "user3";

      // Act
      const result = canEditElement(elementId, mockLockedElements, userId);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe("getElementsLockedByUser", () => {
    it("should return all elements locked by specified user", () => {
      // Arrange
      const userId = "user1";

      // Act
      const result = getElementsLockedByUser(userId, mockLockedElements);

      // Assert
      expect(result).toHaveLength(2);
      expect(result).toContain("element1");
      expect(result).toContain("element3");
      expect(result).not.toContain("element2");
    });

    it("should return empty array when user has no locked elements", () => {
      // Arrange
      const userId = "user3";

      // Act
      const result = getElementsLockedByUser(userId, mockLockedElements);

      // Assert
      expect(result).toEqual([]);
    });

    it("should return empty array when lockedElements is empty", () => {
      // Arrange
      const userId = "user1";
      const emptyLocks = {};

      // Act
      const result = getElementsLockedByUser(userId, emptyLocks);

      // Assert
      expect(result).toEqual([]);
    });

    it("should return only elements for specific user when multiple users have locks", () => {
      // Arrange
      const userId = "user2";

      // Act
      const result = getElementsLockedByUser(userId, mockLockedElements);

      // Assert
      expect(result).toEqual(["element2"]);
    });

    it("should handle user that doesn't exist", () => {
      // Arrange
      const userId = "nonexistentUser" as UserId;

      // Act
      const result = getElementsLockedByUser(userId, mockLockedElements);

      // Assert
      expect(result).toEqual([]);
    });

    it("should return all locked elements when single user has all locks", () => {
      // Arrange
      const userId = "user1";
      const singleUserLocks: lockedElements = {
        elem1: "user1",
        elem2: "user1",
        elem3: "user1",
      };

      // Act
      const result = getElementsLockedByUser(userId, singleUserLocks);

      // Assert
      expect(result).toHaveLength(3);
      expect(result).toEqual(["elem1", "elem2", "elem3"]);
    });
  });

  describe("Integration scenarios", () => {
    it("should correctly handle workflow: check lock, verify permission, get user locks", () => {
      // Arrange
      const elementId: ElementId = "element1";
      const userId: UserId = "user1";

      // Act
      const lockInfo = getElementLockInfo(
        elementId,
        mockLockedElements,
        mockUsers,
        userId,
      );
      const canEdit = canEditElement(elementId, mockLockedElements, userId);
      const userLocks = getElementsLockedByUser(userId, mockLockedElements);

      // Assert
      expect(lockInfo.isLockedByMe).toBe(true);
      expect(canEdit).toBe(true);
      expect(userLocks).toContain(elementId);
    });

    it("should handle scenario where user tries to edit element locked by another", () => {
      // Arrange
      const elementId: ElementId = "element2";
      const userId: UserId = "user1";

      // Act
      const lockInfo = getElementLockInfo(
        elementId,
        mockLockedElements,
        mockUsers,
        userId,
      );
      const canEdit = canEditElement(elementId, mockLockedElements, userId);

      // Assert
      expect(lockInfo.isLocked).toBe(true);
      expect(lockInfo.isLockedByMe).toBe(false);
      expect(lockInfo.userName).toBe("Bob");
      expect(canEdit).toBe(false);
    });

    it("should handle guest user (null userId) attempting to edit", () => {
      // Arrange
      const elementId: ElementId = "element1";
      const userId = null;

      // Act
      const lockInfo = getElementLockInfo(
        elementId,
        mockLockedElements,
        mockUsers,
        userId,
      );
      const canEdit = canEditElement(elementId, mockLockedElements, userId);

      // Assert
      expect(lockInfo.isLocked).toBe(true);
      expect(lockInfo.isLockedByMe).toBe(false);
      expect(canEdit).toBe(false);
    });

    it("should handle dynamic lock changes", () => {
      // Arrange
      const dynamicLocks: lockedElements = { element1: "user1" };
      const elementId = "element1";
      const userId = "user2";

      // Act
      const canEditBefore = canEditElement(elementId, dynamicLocks, userId);
      delete dynamicLocks.element1;
      const canEditAfter = canEditElement(elementId, dynamicLocks, userId);

      // Assert
      expect(canEditBefore).toBe(false);
      expect(canEditAfter).toBe(true);
    });
  });
});

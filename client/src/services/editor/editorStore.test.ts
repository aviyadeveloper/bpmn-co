import { describe, it, expect, beforeEach } from "vitest";
import { useEditorStore } from "./editorStore";
import { emptyBpmnXml } from "./emptyBpmnXml";
import type { Users, lockedElements } from "../../types";

describe("editorStore", () => {
  beforeEach(() => {
    useEditorStore.getState().reset();
  });

  describe("initial state", () => {
    it("should have correct initial values", () => {
      // Arrange & Act
      const state = useEditorStore.getState();

      // Assert
      expect(state.isConnected).toBe(false);
      expect(state.userId).toBe("");
      expect(state.userName).toBe("");
      expect(state.users).toEqual({});
      expect(state.lockedElements).toEqual({});
      expect(state.xml).toBe(emptyBpmnXml);
      expect(state.template).toBe("");
      expect(state.isInitialized).toBe(false);
      expect(state.zoomIn).toBeNull();
      expect(state.zoomOut).toBeNull();
    });
  });

  describe("setConnected", () => {
    it("should set connection status to true", () => {
      // Arrange
      const { setConnected } = useEditorStore.getState();

      // Act
      setConnected(true);

      // Assert
      expect(useEditorStore.getState().isConnected).toBe(true);
    });

    it("should set connection status to false", () => {
      // Arrange
      const { setConnected } = useEditorStore.getState();
      setConnected(true);

      // Act
      setConnected(false);

      // Assert
      expect(useEditorStore.getState().isConnected).toBe(false);
    });
  });

  describe("setFullState", () => {
    it("should update all state properties", () => {
      // Arrange
      const userId = "user-123";
      const userName = "Test User";
      const users: Users = {
        "user-123": "Test User",
        "user-456": "Other User",
      };
      const lockedElements: lockedElements = { "element-1": "user-123" };
      const xml = "<bpmn>test</bpmn>";
      const template = "simple-process";
      const isInitialized = true;
      const { setFullState } = useEditorStore.getState();

      // Act
      setFullState(
        userId,
        userName,
        users,
        lockedElements,
        xml,
        template,
        isInitialized,
      );

      // Assert
      const state = useEditorStore.getState();
      expect(state.userId).toBe(userId);
      expect(state.userName).toBe(userName);
      expect(state.users).toEqual(users);
      expect(state.lockedElements).toEqual(lockedElements);
      expect(state.xml).toBe(xml);
      expect(state.template).toBe(template);
      expect(state.isInitialized).toBe(isInitialized);
    });

    it("should handle empty users and locked elements", () => {
      // Arrange
      const userId = "user-123";
      const userName = "Test User";
      const users: Users = {};
      const lockedElements: lockedElements = {};
      const xml = emptyBpmnXml;
      const template = "";
      const isInitialized = false;
      const { setFullState } = useEditorStore.getState();

      // Act
      setFullState(
        userId,
        userName,
        users,
        lockedElements,
        xml,
        template,
        isInitialized,
      );

      // Assert
      const state = useEditorStore.getState();
      expect(state.users).toEqual({});
      expect(state.lockedElements).toEqual({});
    });
  });

  describe("updateUsers", () => {
    it("should update users object", () => {
      // Arrange
      const newUsers: Users = { "user-1": "Alice", "user-2": "Bob" };
      const { updateUsers } = useEditorStore.getState();

      // Act
      updateUsers(newUsers);

      // Assert
      expect(useEditorStore.getState().users).toEqual(newUsers);
    });

    it("should replace existing users", () => {
      // Arrange
      const initialUsers: Users = { "user-1": "Alice" };
      const updatedUsers: Users = { "user-2": "Bob", "user-3": "Charlie" };
      const { updateUsers } = useEditorStore.getState();

      // Act
      updateUsers(initialUsers);
      updateUsers(updatedUsers);

      // Assert
      expect(useEditorStore.getState().users).toEqual(updatedUsers);
    });
  });

  describe("updateUserName", () => {
    it("should update user name", () => {
      // Arrange
      const newName = "New User Name";
      const { updateUserName } = useEditorStore.getState();

      // Act
      updateUserName(newName);

      // Assert
      expect(useEditorStore.getState().userName).toBe(newName);
    });

    it("should handle empty string", () => {
      // Arrange
      const { updateUserName } = useEditorStore.getState();
      updateUserName("Initial Name");

      // Act
      updateUserName("");

      // Assert
      expect(useEditorStore.getState().userName).toBe("");
    });
  });

  describe("updateLockedElements", () => {
    it("should update locked elements", () => {
      // Arrange
      const newLockedElements: lockedElements = {
        "element-1": "user-1",
        "element-2": "user-2",
      };
      const { updateLockedElements } = useEditorStore.getState();

      // Act
      updateLockedElements(newLockedElements);

      // Assert
      expect(useEditorStore.getState().lockedElements).toEqual(
        newLockedElements,
      );
    });

    it("should replace existing locked elements", () => {
      // Arrange
      const initialLocked: lockedElements = { "element-1": "user-1" };
      const updatedLocked: lockedElements = { "element-2": "user-2" };
      const { updateLockedElements } = useEditorStore.getState();

      // Act
      updateLockedElements(initialLocked);
      updateLockedElements(updatedLocked);

      // Assert
      expect(useEditorStore.getState().lockedElements).toEqual(updatedLocked);
    });

    it("should handle empty locked elements", () => {
      // Arrange
      const { updateLockedElements } = useEditorStore.getState();
      updateLockedElements({ "element-1": "user-1" });

      // Act
      updateLockedElements({});

      // Assert
      expect(useEditorStore.getState().lockedElements).toEqual({});
    });
  });

  describe("setXml", () => {
    it("should update xml content", () => {
      // Arrange
      const newXml = "<bpmn>new content</bpmn>";
      const { setXml } = useEditorStore.getState();

      // Act
      setXml(newXml);

      // Assert
      expect(useEditorStore.getState().xml).toBe(newXml);
    });

    it("should replace existing xml", () => {
      // Arrange
      const firstXml = "<bpmn>first</bpmn>";
      const secondXml = "<bpmn>second</bpmn>";
      const { setXml } = useEditorStore.getState();

      // Act
      setXml(firstXml);
      setXml(secondXml);

      // Assert
      expect(useEditorStore.getState().xml).toBe(secondXml);
    });
  });

  describe("setZoomFunctions", () => {
    it("should store zoom functions", () => {
      // Arrange
      const zoomInFn = () => console.log("zoom in");
      const zoomOutFn = () => console.log("zoom out");
      const { setZoomFunctions } = useEditorStore.getState();

      // Act
      setZoomFunctions(zoomInFn, zoomOutFn);

      // Assert
      const state = useEditorStore.getState();
      expect(state.zoomIn).toBe(zoomInFn);
      expect(state.zoomOut).toBe(zoomOutFn);
    });

    it("should replace existing zoom functions", () => {
      // Arrange
      const firstZoomIn = () => console.log("first zoom in");
      const firstZoomOut = () => console.log("first zoom out");
      const secondZoomIn = () => console.log("second zoom in");
      const secondZoomOut = () => console.log("second zoom out");
      const { setZoomFunctions } = useEditorStore.getState();

      // Act
      setZoomFunctions(firstZoomIn, firstZoomOut);
      setZoomFunctions(secondZoomIn, secondZoomOut);

      // Assert
      const state = useEditorStore.getState();
      expect(state.zoomIn).toBe(secondZoomIn);
      expect(state.zoomOut).toBe(secondZoomOut);
    });
  });

  describe("reset", () => {
    it("should reset all state to initial values", () => {
      // Arrange
      const { setConnected, setFullState, setZoomFunctions, reset } =
        useEditorStore.getState();
      setConnected(true);
      setFullState(
        "user-123",
        "Test User",
        { "user-123": "Test User" },
        { "element-1": "user-123" },
        "<bpmn>test</bpmn>",
        "simple-process",
        true,
      );
      setZoomFunctions(
        () => console.log("zoom in"),
        () => console.log("zoom out"),
      );

      // Act
      reset();

      // Assert
      const state = useEditorStore.getState();
      expect(state.isConnected).toBe(false);
      expect(state.userId).toBe("");
      expect(state.userName).toBe("");
      expect(state.users).toEqual({});
      expect(state.lockedElements).toEqual({});
      expect(state.xml).toBe(emptyBpmnXml);
      expect(state.template).toBe("");
      expect(state.isInitialized).toBe(false);
      expect(state.zoomIn).toBeNull();
      expect(state.zoomOut).toBeNull();
    });

    it("should be idempotent", () => {
      // Arrange
      const { reset } = useEditorStore.getState();

      // Act
      reset();
      reset();
      reset();

      // Assert
      const state = useEditorStore.getState();
      expect(state.isConnected).toBe(false);
      expect(state.userId).toBe("");
    });
  });

  describe("complex state transitions", () => {
    it("should handle multiple state updates in sequence", () => {
      // Arrange
      const {
        setConnected,
        updateUsers,
        updateUserName,
        setXml,
        updateLockedElements,
      } = useEditorStore.getState();

      // Act
      setConnected(true);
      updateUsers({ "user-1": "Alice" });
      updateUserName("Alice");
      setXml("<bpmn>test</bpmn>");
      updateLockedElements({ "element-1": "user-1" });

      // Assert
      const state = useEditorStore.getState();
      expect(state.isConnected).toBe(true);
      expect(state.users).toEqual({ "user-1": "Alice" });
      expect(state.userName).toBe("Alice");
      expect(state.xml).toBe("<bpmn>test</bpmn>");
      expect(state.lockedElements).toEqual({ "element-1": "user-1" });
    });

    it("should maintain independent state for different properties", () => {
      // Arrange
      const { updateUsers, setXml } = useEditorStore.getState();

      // Act
      updateUsers({ "user-1": "Alice" });
      setXml("<bpmn>test</bpmn>");

      // Assert
      const state = useEditorStore.getState();
      expect(state.users).toEqual({ "user-1": "Alice" });
      expect(state.xml).toBe("<bpmn>test</bpmn>");
      expect(state.userId).toBe("");
      expect(state.template).toBe("");
    });
  });
});

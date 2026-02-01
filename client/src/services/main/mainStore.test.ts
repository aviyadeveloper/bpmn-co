import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { useMainStore } from "./mainStore";
import { API_BASE_URL } from "../../constants";

describe("mainStore", () => {
  beforeEach(() => {
    useMainStore.setState({
      editorOpened: false,
      selectedTemplate: null,
      isCheckingInitialization: false,
      diagramInitialized: null,
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("initial state", () => {
    it("should have correct initial values", () => {
      // Arrange & Act
      const state = useMainStore.getState();

      // Assert
      expect(state.editorOpened).toBe(false);
      expect(state.selectedTemplate).toBe(null);
      expect(state.isCheckingInitialization).toBe(false);
      expect(state.diagramInitialized).toBe(null);
    });
  });

  describe("openEditor", () => {
    it("should set editorOpened to true", () => {
      // Arrange
      const { openEditor } = useMainStore.getState();

      // Act
      openEditor();

      // Assert
      expect(useMainStore.getState().editorOpened).toBe(true);
    });
  });

  describe("closeEditor", () => {
    it("should set editorOpened to false", () => {
      // Arrange
      const { openEditor, closeEditor } = useMainStore.getState();
      openEditor();

      // Act
      closeEditor();

      // Assert
      expect(useMainStore.getState().editorOpened).toBe(false);
    });
  });

  describe("toggleEditor", () => {
    it("should toggle editorOpened from false to true", () => {
      // Arrange
      const { toggleEditor } = useMainStore.getState();

      // Act
      toggleEditor();

      // Assert
      expect(useMainStore.getState().editorOpened).toBe(true);
    });

    it("should toggle editorOpened from true to false", () => {
      // Arrange
      const { openEditor, toggleEditor } = useMainStore.getState();
      openEditor();

      // Act
      toggleEditor();

      // Assert
      expect(useMainStore.getState().editorOpened).toBe(false);
    });
  });

  describe("setSelectedTemplate", () => {
    it("should set selected template to blank", () => {
      // Arrange
      const { setSelectedTemplate } = useMainStore.getState();

      // Act
      setSelectedTemplate("blank");

      // Assert
      expect(useMainStore.getState().selectedTemplate).toBe("blank");
    });

    it("should set selected template to simple-process", () => {
      // Arrange
      const { setSelectedTemplate } = useMainStore.getState();

      // Act
      setSelectedTemplate("simple-process");

      // Assert
      expect(useMainStore.getState().selectedTemplate).toBe("simple-process");
    });

    it("should update template when called multiple times", () => {
      // Arrange
      const { setSelectedTemplate } = useMainStore.getState();
      setSelectedTemplate("blank");

      // Act
      setSelectedTemplate("approval-workflow");

      // Assert
      expect(useMainStore.getState().selectedTemplate).toBe(
        "approval-workflow",
      );
    });
  });

  describe("checkInitialization", () => {
    it("should successfully check initialization status when initialized", async () => {
      // Arrange
      const mockResponse = { is_initialized: true };
      globalThis.fetch = vi.fn().mockResolvedValue({
        json: async () => mockResponse,
      });
      const { checkInitialization } = useMainStore.getState();

      // Act
      await checkInitialization();

      // Assert
      expect(globalThis.fetch).toHaveBeenCalledWith(`${API_BASE_URL}/`);
      expect(useMainStore.getState().diagramInitialized).toBe(true);
      expect(useMainStore.getState().isCheckingInitialization).toBe(false);
    });

    it("should successfully check initialization status when not initialized", async () => {
      // Arrange
      const mockResponse = { is_initialized: false };
      globalThis.fetch = vi.fn().mockResolvedValue({
        json: async () => mockResponse,
      });
      const { checkInitialization } = useMainStore.getState();

      // Act
      await checkInitialization();

      // Assert
      expect(globalThis.fetch).toHaveBeenCalledWith(`${API_BASE_URL}/`);
      expect(useMainStore.getState().diagramInitialized).toBe(false);
      expect(useMainStore.getState().isCheckingInitialization).toBe(false);
    });

    it("should handle missing is_initialized field as false", async () => {
      // Arrange
      const mockResponse = {};
      globalThis.fetch = vi.fn().mockResolvedValue({
        json: async () => mockResponse,
      });
      const { checkInitialization } = useMainStore.getState();

      // Act
      await checkInitialization();

      // Assert
      expect(useMainStore.getState().diagramInitialized).toBe(false);
      expect(useMainStore.getState().isCheckingInitialization).toBe(false);
    });

    it("should set isCheckingInitialization to true during check", async () => {
      // Arrange
      let resolvePromise: (value: unknown) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      globalThis.fetch = vi.fn().mockReturnValue(pendingPromise);
      const { checkInitialization } = useMainStore.getState();

      // Act
      const checkPromise = checkInitialization();

      // Assert
      expect(useMainStore.getState().isCheckingInitialization).toBe(true);

      // Cleanup
      resolvePromise!({ json: async () => ({ is_initialized: true }) });
      await checkPromise;
    });

    it("should handle fetch errors gracefully", async () => {
      // Arrange
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const error = new Error("Network error");
      globalThis.fetch = vi.fn().mockRejectedValue(error);
      const { checkInitialization } = useMainStore.getState();

      // Act
      await checkInitialization();

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to check initialization status:",
        error,
      );
      expect(useMainStore.getState().diagramInitialized).toBe(false);
      expect(useMainStore.getState().isCheckingInitialization).toBe(false);
    });

    it("should not start new check if already checking", async () => {
      // Arrange
      let resolvePromise: (value: unknown) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      globalThis.fetch = vi.fn().mockReturnValue(pendingPromise);
      const { checkInitialization } = useMainStore.getState();

      // Act
      const firstCheck = checkInitialization();
      await checkInitialization(); // Second call should be ignored

      // Assert
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);

      // Cleanup
      resolvePromise!({ json: async () => ({ is_initialized: true }) });
      await firstCheck;
    });

    it("should allow new check after previous check completes", async () => {
      // Arrange
      globalThis.fetch = vi.fn().mockResolvedValue({
        json: async () => ({ is_initialized: true }),
      });
      const { checkInitialization } = useMainStore.getState();

      // Act
      await checkInitialization();
      await checkInitialization();

      // Assert
      expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    });
  });
});

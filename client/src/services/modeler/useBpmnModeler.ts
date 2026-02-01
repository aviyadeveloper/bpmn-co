import { useEffect, useRef, useCallback } from "react";
import BpmnJS from "bpmn-js/lib/Modeler";
import { useEditor } from "../editor/useEditor";
import { canEditElement } from "../../utils";

type UseBpmnOptions = {
  container: HTMLDivElement | null;
  initialXml: string;
  onChange?: (xml?: string) => void;
};

/**
 * Manages BPMN.js modeler instance lifecycle and collaboration features.
 *
 * Handles:
 * - Modeler initialization and XML loading
 * - Local change tracking (onChange callback)
 * - External XML updates without triggering onChange (loadXml)
 * - Element locking to prevent editing locked elements
 */
export function useBpmnModeler({
  container,
  initialXml,
  onChange,
}: UseBpmnOptions) {
  const modelerRef = useRef<BpmnJS | null>(null);
  const isExternalUpdateRef = useRef(false);

  const { userId, lockedElements } = useEditor();

  const onChangeRef = useRef(onChange);
  const userIdRef = useRef(userId);
  const lockedElementsRef = useRef(lockedElements);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    userIdRef.current = userId;
    lockedElementsRef.current = lockedElements;
  }, [userId, lockedElements]);

  // Helper: Check if element is editable by current user
  const isElementEditable = useCallback((elementId: string) => {
    return canEditElement(
      elementId,
      lockedElementsRef.current,
      userIdRef.current,
    );
  }, []);

  // Initialize modeler when container is available
  useEffect(() => {
    if (!container) return;

    const modeler = new BpmnJS({ container });
    modelerRef.current = modeler;

    // Import initial XML
    modeler.importXML(initialXml).catch((error) => {
      console.error("Failed to load initial XML:", error);
    });

    // Listen for diagram changes from user edits
    modeler.on("commandStack.changed", async () => {
      if (isExternalUpdateRef.current) return;

      const { xml } = await modeler.saveXML({ format: true });
      onChangeRef.current?.(xml);
    });

    // Prevent selection of locked elements
    modeler.on("selection.changed", (event: any) => {
      const allowedSelection = (event.newSelection || []).filter((el: any) =>
        isElementEditable(el.id),
      );

      if (allowedSelection.length !== (event.newSelection || []).length) {
        (modeler.get("selection") as any).select(allowedSelection);
      }
    });

    // Prevent dragging locked elements
    modeler.on("element.mousedown", 5000, (event: any) => {
      if (event.element?.id && !isElementEditable(event.element.id)) {
        event.stopPropagation();
        event.preventDefault();
        return false;
      }
    });

    // Fallback: Block any command affecting locked elements
    modeler.on("commandStack.preExecute", (event: any) => {
      const ctx = event.context;
      const elements =
        ctx.shapes ||
        ctx.elements ||
        [ctx.shape, ctx.element, ctx.connection].filter(Boolean);

      for (const el of elements) {
        if (el?.id && !isElementEditable(el.id)) {
          throw new Error(`Element ${el.id} is locked`);
        }
      }
    });

    return () => {
      modeler.destroy();
    };
  }, [container, initialXml]);

  const loadXml = useCallback(async (xml: string) => {
    if (!modelerRef.current) return;

    isExternalUpdateRef.current = true;

    const handleImportDone = () => {
      isExternalUpdateRef.current = false;
      modelerRef.current?.off("import.done", handleImportDone);
    };

    modelerRef.current.on("import.done", handleImportDone);

    try {
      await modelerRef.current.importXML(xml);
    } catch (error) {
      console.error("Failed to load external XML:", error);
      modelerRef.current?.off("import.done", handleImportDone);
      isExternalUpdateRef.current = false;
    }
  }, []);

  return {
    modeler: modelerRef,
    loadXml,
  };
}

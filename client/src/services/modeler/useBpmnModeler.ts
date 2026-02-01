import { useEffect, useRef, useCallback } from "react";
import BpmnJS from "bpmn-js/lib/Modeler";
import { useEditor } from "../editor/useEditor";
import { canEditElement } from "../../utils";
import { modelerStore } from "./modelerStore";

type UseBpmnOptions = {
  container: HTMLDivElement | null;
  initialXml: string;
  onChange?: (xml?: string) => void;
};

/**
 * Manages BPMN modeler lifecycle and collaboration features.
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

  const isElementEditable = useCallback((elementId: string) => {
    return canEditElement(
      elementId,
      lockedElementsRef.current,
      userIdRef.current,
    );
  }, []);

  // Block interaction with locked elements
  const blockLockedElementInteraction = useCallback(
    (event: any) => {
      if (event.element?.id && !isElementEditable(event.element.id)) {
        event.stopPropagation();
        event.preventDefault();
        return false;
      }
    },
    [isElementEditable],
  );

  // Setup event handlers for collaboration
  const setupEventHandlers = useCallback(
    (modeler: BpmnJS) => {
      // Save changes to XML
      modeler.on("commandStack.changed", async () => {
        if (isExternalUpdateRef.current) return;
        const { xml } = await modeler.saveXML({ format: true });
        onChangeRef.current?.(xml);
      });

      // Filter selection to only editable elements
      modeler.on("selection.changed", (event: any) => {
        const allowed = (event.newSelection || []).filter((el: any) =>
          isElementEditable(el.id),
        );
        if (allowed.length !== (event.newSelection || []).length) {
          (modeler.get("selection") as any).select(allowed);
        }
      });

      // Block mousedown and double-click on locked elements
      modeler.on("element.mousedown", 5000, blockLockedElementInteraction);
      modeler.on("element.dblclick", 5000, blockLockedElementInteraction);

      // Prevent commands on locked elements
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
    },
    [isElementEditable, blockLockedElementInteraction],
  );

  // Initialize modeler
  useEffect(() => {
    if (!container) return;

    const modeler = new BpmnJS({ container });
    modelerRef.current = modeler;
    modelerStore.set(modeler);

    modeler.importXML(initialXml).catch((error) => {
      console.error("Failed to load initial XML:", error);
    });

    setupEventHandlers(modeler);

    return () => {
      modeler.destroy();
      modelerStore.set(null);
    };
  }, [container, initialXml, setupEventHandlers]);

  // Apply visual styling to locked elements
  useEffect(() => {
    if (!modelerRef.current) return;

    const applyStyling = () => {
      const elementRegistry = modelerRef.current!.get("elementRegistry") as any;
      const canvas = modelerRef.current!.get("canvas") as any;
      if (!elementRegistry || !canvas) return;

      elementRegistry.getAll().forEach((element: any) => {
        const gfx = canvas.getGraphics(element);
        if (!gfx || !element.id) return;

        if (isElementEditable(element.id)) {
          gfx.style.opacity = "1";
          gfx.style.filter = "";
          gfx.style.cursor = "";
        } else {
          gfx.style.opacity = "0.4";
          gfx.style.cursor = "not-allowed";
          gfx.querySelectorAll("*").forEach((child: any) => {
            child.style.cursor = "not-allowed";
          });
        }
      });
    };

    applyStyling();
    modelerRef.current.on("import.done", applyStyling);
    return () => modelerRef.current?.off("import.done", applyStyling);
  }, [lockedElements, userId, isElementEditable]);

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

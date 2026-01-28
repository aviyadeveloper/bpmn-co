import { useEffect, useRef, useCallback } from "react";
import BpmnJS from "bpmn-js/lib/Modeler";

type UseBpmnOptions = {
  container: HTMLDivElement | null;
  initialXml: string;
  onChange?: (xml?: string) => void;
  onExternalUpdate?: boolean; // Flag to prevent onChange during external updates
};

export function useBpmnModeler({
  container,
  initialXml,
  onChange,
}: UseBpmnOptions) {
  const modelerRef = useRef<BpmnJS | null>(null);
  const isExternalUpdateRef = useRef(false); // Track if update is from external source
  const onChangeRef = useRef(onChange);

  // Keep onChange ref up to date
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!container) return;

    const modeler = new BpmnJS({ container });
    console.log("🚀 BPMN Modeler initialized");
    console.log(modeler);
    modelerRef.current = modeler;

    modeler.importXML(initialXml).catch(console.error);

    // Handle selection changes (for element locking)
    modeler.on("selection.changed", (event: any) => {
      console.group("� Selection Changed");

      if (event.newSelection && event.newSelection.length > 0) {
        const selected = event.newSelection.map((el: any) => ({
          id: el.id,
          type: el.type,
        }));
        console.log("✅ Selected:", selected);
        // TODO: Send to WebSocket - element.lock with elementId
      } else {
        console.log("❌ Deselected all");
        // TODO: Send to WebSocket - element.unlock
      }

      console.groupEnd();
    });

    // Handle diagram changes (for syncing element-specific updates)
    modeler.on("commandStack.postExecuted", (event: any) => {
      console.log("🔄 Command executed:", event.command);
      // The onChange handler below will handle sending via websocket
    });

    modeler.on("commandStack.changed", async () => {
      console.log("📝 commandStack.changed fired");
      console.log(
        "  isExternalUpdateRef.current:",
        isExternalUpdateRef.current,
      );
      console.log("  onChangeRef.current exists:", !!onChangeRef.current);

      // Only trigger onChange if this is not an external update
      if (!isExternalUpdateRef.current) {
        const { xml } = await modeler.saveXML({ format: true });
        console.log(
          "📤 Triggering onChange with updated XML (length:",
          xml?.length,
          ")",
        );
        if (onChangeRef.current) {
          onChangeRef.current(xml);
        }
      } else {
        console.log("⏭️  Skipping onChange (external update)");
      }
    });

    return () => {
      modeler.destroy();
    };
  }, [container]);

  const loadXml = useCallback(async (xml: string) => {
    if (!modelerRef.current) {
      console.warn("⚠️ Cannot load XML: modeler not initialized");
      return;
    }

    // Set flag to prevent onChange from firing
    isExternalUpdateRef.current = true;
    console.log("🔒 Locking onChange (external update)");

    try {
      await modelerRef.current.importXML(xml);
      console.log("📥 Loaded XML from external source");
    } catch (error) {
      console.error("Failed to load XML:", error);
    } finally {
      // Reset flag after import completes
      // Use a longer delay to ensure all commandStack events have processed
      setTimeout(() => {
        isExternalUpdateRef.current = false;
        console.log("🔓 Unlocking onChange (ready for user edits)");
      }, 300);
    }
  }, []);

  return {
    modeler: modelerRef,
    loadXml,
  };
}

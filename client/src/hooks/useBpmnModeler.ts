import { useEffect, useRef, useCallback } from "react";
import BpmnJS from "bpmn-js/lib/Modeler";

type UseBpmnOptions = {
  /** DOM container for the BPMN modeler. Should not be null when hook is used. */
  container: HTMLDivElement | null;
  /** Initial XML to load into the modeler */
  initialXml: string;
  /** Callback fired when user makes local changes to the diagram */
  onChange?: (xml?: string) => void;
};

/**
 * useBpmnModeler - Manages BPMN.js modeler instance lifecycle
 *
 * This hook handles:
 * - Initializing BPMN.js modeler
 * - Loading initial XML
 * - Tracking local changes and calling onChange
 * - Providing loadXml() for external updates (from other users)
 * - Preventing circular updates with isExternalUpdateRef guard
 *
 * The isExternalUpdateRef flag is NECESSARY to prevent this loop:
 *   1. Other user sends XML update
 *   2. We call loadXml(xml)
 *   3. BPMN.js triggers commandStack.changed
 *   4. Our onChange handler fires
 *   5. We send the XML back to server (unnecessary)
 *   6. Loop continues...
 *
 * The guard breaks this cycle by suppressing onChange during loadXml().
 */
export function useBpmnModeler({
  container,
  initialXml,
  onChange,
}: UseBpmnOptions) {
  const modelerRef = useRef<BpmnJS | null>(null);

  // Guard to prevent onChange from firing during external XML imports
  // This is critical for avoiding circular update loops
  const isExternalUpdateRef = useRef(false);

  // Keep onChange callback fresh without reinitializing modeler
  // Using a ref prevents the modeler useEffect from running on every onChange update
  const onChangeRef = useRef(onChange);

  // Keep onChange ref up to date
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Initialize modeler when container is available
  useEffect(() => {
    if (!container) {
      console.log("⏸️  Waiting for container...");
      return;
    }

    console.log("🚀 Initializing BPMN Modeler");
    const modeler = new BpmnJS({ container });
    modelerRef.current = modeler;

    // Import initial XML
    modeler.importXML(initialXml).catch((error) => {
      console.error("Failed to load initial XML:", error);
    });

    // Listen for diagram changes from user edits
    modeler.on("commandStack.changed", async () => {
      // Skip if this change is from an external update (other user)
      if (isExternalUpdateRef.current) {
        console.log("⏭️  Skipping onChange (external update)");
        return;
      }

      // User made a local change - export XML and notify
      console.log("📝 Local diagram change detected");
      const { xml } = await modeler.saveXML({ format: true });
      onChangeRef.current?.(xml);
    });

    return () => {
      console.log("🧹 Destroying BPMN Modeler");
      modeler.destroy();
    };
  }, [container, initialXml]);

  /**
   * Load XML from external source (e.g., another user's update)
   * Sets guard flag to prevent triggering onChange callback
   */
  const loadXml = useCallback(async (xml: string) => {
    if (!modelerRef.current) {
      console.warn("⚠️ Cannot load XML: modeler not initialized");
      return;
    }

    // Set guard to prevent onChange from firing
    isExternalUpdateRef.current = true;
    console.log("� Loading external XML update");

    try {
      await modelerRef.current.importXML(xml);
      console.log("✅ External XML loaded");
    } catch (error) {
      console.error("❌ Failed to load external XML:", error);
    } finally {
      // Reset guard after a delay to ensure all BPMN.js events have settled
      // BPMN.js fires commandStack events asynchronously during import
      // TODO: Find a better event-based approach instead of timeout
      setTimeout(() => {
        isExternalUpdateRef.current = false;
        console.log("🔓 Ready for local edits");
      }, 300);
    }
  }, []);

  return {
    modeler: modelerRef,
    loadXml,
  };
}

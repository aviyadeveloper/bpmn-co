import { useRef, useEffect, useState, useCallback } from "react";
import { useCollaboration } from "./CollaborationProvider";
import { useBpmnModeler } from "../hooks/useBpmnModeler";
import { OfflineAlert } from "./OfflineAlert";
import { EditorHeader } from "./EditorHeader";
import { EditorSideBar } from "./EditorSideBar";

export function BpmnCollaborativeEditor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  // Get collaboration state and functions from context
  const {
    initialXml,
    isConnected,
    reconnectCount,
    sendXmlUpdate,
    sendElementSelect,
    onXmlUpdate,
  } = useCollaboration();

  // Update container state when ref is set
  // This triggers useBpmnModeler initialization
  useEffect(() => {
    if (containerRef.current && !container) {
      setContainer(containerRef.current);
    }
  }, [container]);

  // Transmit local XML changes to server
  const handleXmlChange = useCallback(
    (xml?: string) => {
      if (isConnected && xml) {
        sendXmlUpdate(xml);
      }
    },
    [isConnected, sendXmlUpdate],
  );

  const { modeler, loadXml } = useBpmnModeler({
    container,
    initialXml,
    onChange: handleXmlChange,
  });

  // Register to receive XML updates from other users
  useEffect(() => {
    onXmlUpdate((xml) => {
      loadXml(xml);
    });
  }, [onXmlUpdate, loadXml]);

  // Listen to modeler selection events for element locking
  useEffect(() => {
    if (!modeler.current) return;

    const handleSelectionChange = (event: any) => {
      if (event.newSelection && event.newSelection.length > 0) {
        // New Elements Selected
        const elementIds = event.newSelection.map((el: any) => el.id);
        isConnected && sendElementSelect(elementIds);
      } else if (event.oldSelection && event.oldSelection.length > 0) {
        // Old Elements Deselected
        isConnected && sendElementSelect([]);
      }
    };

    modeler.current.on("selection.changed", handleSelectionChange);

    return () => {
      modeler.current?.off("selection.changed", handleSelectionChange);
    };
  }, [modeler, isConnected, sendElementSelect]);

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        flexDirection: "column",
        maxWidth: "100vw",
      }}
    >
      <EditorHeader />

      {/* Main content area */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* BPMN Editor */}
        <div
          ref={containerRef}
          style={{
            flex: 1,
            backgroundColor: "pink",
            position: "absolute",
            width: "100%",
            height: "100%",
          }}
        />

        <EditorSideBar />
        {!isConnected && <OfflineAlert reconnectCount={reconnectCount} />}
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { useBpmnModeler } from "../hooks/useBpmnModeler";
import { useWebSocket } from "../hooks/useWebSocket";
import { ConnectionStatusIndicator } from "./ConnectionStatusIndicator";

const WS_URL = "ws://localhost:8000/ws";

// Default empty BPMN diagram
const EMPTY_DIAGRAM = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  id="Definitions_1"
  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <dc:Bounds x="152" y="102" width="36" height="36" />
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

export default function BpmnEditor() {
  // Track last activity for connection status
  const [lastActivity, setLastActivity] = useState<number>(Date.now());

  // Track current XML (will be synced from server)
  const [currentXml, setCurrentXml] = useState<string>(EMPTY_DIAGRAM);

  // Track if we've received initial sync from server
  const [hasInitialSync, setHasInitialSync] = useState<boolean>(false);

  // Container ref for BPMN modeler
  const containerRef = useRef<HTMLDivElement>(null);

  // Container state to trigger modeler initialization when DOM is ready
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  // Update container state when ref is set
  useEffect(() => {
    if (containerRef.current && !container) {
      console.log("📦 Container ref is ready");
      setContainer(containerRef.current);
    }
  }, [container]);

  // Initialize WebSocket connection
  const { readyState, send, lastMessage, lastError } = useWebSocket(WS_URL, {
    autoConnect: true,
    autoReconnect: true,
    onMessage: (message) => {
      console.log("📥 Received message from server");
      setLastActivity(Date.now());
    },
    onError: (error, errorInfo) => {
      console.error("❌ WebSocket error:", errorInfo);
    },
  });

  // Derive connection state
  const isConnected = readyState === WebSocket.OPEN;
  const connectionError = lastError?.message || null;

  // Step 4: Handle outgoing changes to server
  const handleChange = (xml?: string) => {
    if (!xml) return;

    // Check if WebSocket is connected
    if (readyState !== WebSocket.OPEN) {
      console.warn("⚠️ Cannot send: WebSocket not connected");
      return;
    }

    // Send update to server
    const message = JSON.stringify({ type: "update", xml });
    const success = send(message);

    if (success) {
      console.log("📤 Sent diagram update to server");
      setLastActivity(Date.now());
    } else {
      console.error("❌ Failed to send diagram update");
    }
  };

  // Initialize BPMN modeler ONLY after we have initial sync
  // This prevents race conditions
  const { loadXml } = useBpmnModeler({
    container: hasInitialSync ? container : null, // Only pass container after initial sync
    initialXml: currentXml,
    onChange: handleChange,
  });

  // Step 3: Handle incoming messages from server
  useEffect(() => {
    if (!lastMessage) return;

    try {
      const message = JSON.parse(lastMessage);
      console.log("📦 Parsed message:", message.type);

      if (message.type === "init") {
        console.log("🔄 Initial sync - received XML from server");
        setCurrentXml(message.xml);
        setHasInitialSync(true); // Mark that we've received initial sync
        console.log("✅ Ready to initialize modeler");
      } else if (message.type === "update") {
        console.log("🔄 Update from another user - loading XML");
        setCurrentXml(message.xml);
        loadXml(message.xml);
      }
    } catch (error) {
      console.error("❌ Failed to parse message:", error);
    }
  }, [lastMessage, loadXml]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh" }}>
      <ConnectionStatusIndicator
        isConnected={isConnected}
        lastActivity={lastActivity.toString()}
        connectionError={connectionError}
      />
      <div
        ref={containerRef}
        style={{ width: "100%", height: "100vh", border: "1px solid red" }}
      >
        <style>
          {`
          [data-element-id="TextAnnotation_1"] text {
            font-size: 24px !important;
            font-weight: 500;
          }
        `}
        </style>
      </div>
    </div>
  );
}

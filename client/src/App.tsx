import "./App.css";
import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn.css";

import { CollaborationProvider } from "./components/CollaborationProvider";
import { BpmnCollaborativeEditor } from "./components/BpmnCollaborativeEditor";
import { Welcome } from "./components/Welcome";

function App() {
  return (
    <div style={{ height: "100vh", width: "100vw", margin: 0, padding: 0 }}>
      <CollaborationProvider url="ws://localhost:8000/ws">
        {/* <Welcome existingDiagram={true} /> */}
        <BpmnCollaborativeEditor />
      </CollaborationProvider>
    </div>
  );
}

export default App;

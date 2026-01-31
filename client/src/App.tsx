import "./App.css";
import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn.css";

import { CollaborationProvider } from "./contexts/CollaborationProvider";
import { Diagram } from "./components/Editor/Diagram";
import { Editor } from "./components/Editor/Editor";

function App() {
  return (
    <div style={{ height: "100vh", width: "100vw", margin: 0, padding: 0 }}>
      <CollaborationProvider url="ws://localhost:8000/ws">
        <Editor />
      </CollaborationProvider>
    </div>
  );
}

export default App;

import "./App.css";
import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn.css";

import { BpmnCollaborativeEditor } from "./components/BpmnCollaborativeEditor";

function App() {
  return (
    <div style={{ height: "100vh", width: "100vw", margin: 0, padding: 0 }}>
      <BpmnCollaborativeEditor />
    </div>
  );
}

export default App;

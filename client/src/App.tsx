import "./App.css";
import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn.css";

import BpmnEditor from "./components/BpmnEditor";

function App() {
  return (
    <div style={{ height: "80vh", width: "80vw" }}>
      <BpmnEditor />
    </div>
  );
}

export default App;

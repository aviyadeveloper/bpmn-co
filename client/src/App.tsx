import "./App.css";
import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn.css";

import { Editor } from "./components/Editor/Editor";
import { useMainStore } from "./services/main/mainStore";
import { Welcome } from "./components/Welcome";

function App() {
  const { editorOpened } = useMainStore();

  return (
    <div style={{ height: "100vh", width: "100vw", margin: 0, padding: 0 }}>
      {editorOpened ? <Editor /> : <Welcome existingDiagram={false} />}
    </div>
  );
}

export default App;

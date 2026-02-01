import BpmnJS from "bpmn-js/lib/Modeler";

let globalModeler: BpmnJS | null = null;

export const modelerStore = {
  set: (modeler: BpmnJS | null) => {
    globalModeler = modeler;
  },
  get: () => globalModeler,
};

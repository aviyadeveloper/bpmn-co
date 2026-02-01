import BpmnJS from "bpmn-js/lib/Modeler";

/**
 * Global singleton store for the BPMN modeler instance.
 *
 * Used to share the modeler instance between sibling components
 * (Diagram and ZoomControls) without prop drilling through parent.
 *
 * Only one modeler instance should exist at a time.
 */
let modelerInstance: BpmnJS | null = null;

export const modelerStore = {
  set: (modeler: BpmnJS | null) => {
    modelerInstance = modeler;
  },
  get: () => modelerInstance,
};

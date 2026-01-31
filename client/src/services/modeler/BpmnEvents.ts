// All available BPMN events (for reference)
const ALL_BPMN_EVENTS = [
  // Shape events
  "shape.added",
  "shape.changed",
  "shape.removed",
  "shape.move.start",
  "shape.move.move",
  "shape.move.end",

  // Connection events
  "connection.added",
  "connection.changed",
  "connection.removed",
  "connection.move.start",
  "connection.move.move",
  "connection.move.end",

  // Element events
  "element.changed",
  "element.click",
  "element.dblclick",
  "element.hover",
  "element.out",
  "element.mousedown",
  "element.mouseup",

  // Selection events
  "selection.changed",

  // Command stack events
  "commandStack.changed",
  "commandStack.preExecute",
  "commandStack.postExecuted",
  "commandStack.reverted",

  // Canvas events
  "canvas.viewbox.changed",

  // Direct editing events
  "directEditing.activate",
  "directEditing.deactivate",
  "directEditing.complete",
  "directEditing.cancel",
];

// Events we actually need for collaboration
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const COLLABORATION_EVENTS = [
  "commandStack.changed", // Captures all diagram modifications (add/remove/move/edit)
  "selection.changed", // For element locking feature (bonus)
];

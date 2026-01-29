# Digramer

A collaborative diagramming tool for BPMN diagrams, allowing live collaboration from multiple users.

## Server

FastAPI server handling websocket connection pool, receiving and broadcasting updates from connected clients.

## Client

Vite based React SPA. Uses BPMN-JS to render and edit diagram. Connected to the the server with a websocket which allows updates in and out.

### Main Components:

#### useWebSocket

A hook handling everything to do with the connection to the server. connect, disconnect, reconnect, send, and receive operations.

#### useBpmnModeler

A hook handling the loading, setup, updating, and event listening on the BpmnModeler provided by `bpmn-js`.

#### App

React app for GUI and diagram display and interaction. Very simple, it's core being the BpmnEditor Component which uses the hooks to provide the core functionality.

## Testing

Client test are done with `vitest`.

```
npm run test:client
```

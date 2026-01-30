# Digramer

A collaborative diagramming tool for BPMN diagrams, allowing live collaboration from multiple users.

## Server

FastAPI server handling websocket connection pool, receiving and broadcasting updates from connected clients.

## Client

Vite based React SPA. Uses BPMN-JS to render and edit diagram. Connected to the the server with a websocket which allows updates in and out.

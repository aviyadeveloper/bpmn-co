# Architecture

## Server-Side

Fast API acting as the single source of truth for the BPMN diagram. Using websockets it handles updates, saves the new diagram xml to memory, and broacasts the new version to all connected clients.

## Client-Side

Each client maintains a local instance of the BPMN modeler. When a user makes changes, the client sends the updated XML to the server via websocket. The server then broadcasts the updated XML to all connected clients, which update their local modelers accordingly. This ensures that all users see the same diagram in real-time.

# BPMN Collaborative Editing Client

A React-based web client for real-time collaborative BPMN diagram editing. Built with TypeScript, Vite, and bpmn-js, featuring state management with Zustand and WebSocket-based synchronization.

## Features

- **Real-time Collaboration**: Edit BPMN diagrams with multiple users simultaneously
- **Template Selection**: Start from pre-configured BPMN templates
- **Element Locking**: Visual indicators for elements locked by other users
- **User Presence**: See who's currently editing the diagram
- **Offline Detection**: Automatic reconnection handling
- **Zoom Controls**: Intuitive zoom and fit-to-viewport controls

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **bpmn-js** - BPMN diagram rendering and editing
- **Zustand** - State management
- **react-use-websocket** - WebSocket connection management
- **Vitest** - Testing framework

## Architecture

### Module Organization

```
src/
├── App.tsx                          # Main app component and routing
├── components/
│   ├── Editor/                      # Diagram editing interface
│   │   ├── Editor.tsx               # Main editor container
│   │   ├── Diagram.tsx              # BPMN diagram canvas
│   │   ├── ZoomControls.tsx         # Zoom controls
│   │   ├── OfflineAlert.tsx         # Connection status alert
│   │   ├── Header/                  # Top bar components
│   │   └── Sidebar/                 # User list and element locks
│   └── Welcome/                     # Landing page and template selection
└── services/
    ├── editor/                      # Editor state and WebSocket logic
    ├── modeler/                     # bpmn-js modeler integration
    └── main/                        # App-level state (navigation)
```

### State Management

The application uses Zustand stores for state management:

- **mainStore**: Navigation state (welcome vs editor view)
- **editorStore**: WebSocket connection, user data, locked elements, XML state
- **modelerStore**: bpmn-js modeler instance and zoom controls

### WebSocket Integration

The client communicates with the server using the following message types:

**Outgoing**:

- `xml_update` - Send diagram changes
- `user_name_update` - Update display name
- `element_select` - Lock elements for editing
- `element_deselect` - Release element locks

**Incoming**:

- `init` - Initial connection with full state
- `xml_update` - Receive diagram changes from others
- `user_joined` - New user connected
- `user_left` - User disconnected
- `user_name_update` - User changed their name
- `elements_locked` - Elements locked by another user
- `element_unlocked` - Element lock released

## Development

### Setup

```bash
npm install
```

### Run Dev Server

```bash
npm run dev
```

### Run Tests

```bash
npm test              # Watch mode
npm run test:run      # Single run
npm run test:ui       # UI mode
```

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
```

## Environment

The client expects the WebSocket server to be available at `ws://localhost:8000/ws` by default. Update `WS_URL` in `src/constants.ts` to point to your server.

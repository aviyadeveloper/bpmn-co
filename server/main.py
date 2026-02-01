"""
Main server file for the BPMN XML synchronization application.
Defines the FastAPI application, WebSocket endpoint, and health check endpoint.

Server expect the following websocket message types:

Incoming:
 - xml_update
 - user_name_update
 - element_select
 - element_deselect
 -

Outgoing:
 - init
 - xml_update
 - users_update
 - locked_elements_update

Modules Responsblities:
- main.py: Application setup, WebSocket endpoint, health check, routing.
- managers/connections_manager.py: Manage WebSocket connections and messaging functionality.
- managers/state_manager.py: Manage application state (XML, users, locks).
- event_handlers.py: Handle specific events and their required operations.
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from .event_handlers import (
    handle_element_deselect_event,
    handle_element_select_event,
    handle_flush_user_data,
    handle_initial_connection_event,
    handle_json_validation,
    handle_user_name_update_event,
    handle_xml_update_event,
)

from .managers import connection_manager
from .managers import state_manager
from .templates.constants import get_template_or_default

app = FastAPI()

# Add CORS middleware to allow connections from the client
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for handling BPMN XML synchronization.
    Handles initial connection, incoming messages, and disconnections.
    Accepts optional 'template' query parameter for diagram initialization.
    """

    try:

        # Extract and validate template parameter from query string
        template_param = websocket.query_params.get("template")
        template = get_template_or_default(template_param)

        # Initial Connection
        connection_response = await connection_manager.connect(websocket)
        user_id = connection_response.get("user_id", None)
        await handle_initial_connection_event(websocket, connection_response, template)

        # Ongoing Communication
        while True:

            data = await websocket.receive_text()

            message = await handle_json_validation(websocket, data)

            if not message:
                continue

            # Route to appropriate handler based on message type
            if message.type == "xml_update":
                await handle_xml_update_event(websocket, message)
            elif message.type == "user_name_update":
                await handle_user_name_update_event(websocket, user_id, message)
            elif message.type == "element_select":
                await handle_element_select_event(user_id, message)
            elif message.type == "element_deselect":
                await handle_element_deselect_event(user_id, message)

    except WebSocketDisconnect:
        print("====> WebSocket disconnected Error")
        await handle_flush_user_data(user_id)
        await connection_manager.disconnect(websocket)

        # Reset diagram if all users disconnected
        if state_manager.should_reset():
            await state_manager.reset_diagram()

    except Exception as e:
        print(f"====> WebSocket error: {e}")
        await handle_flush_user_data(user_id)
        await connection_manager.disconnect(websocket)

        # Reset diagram if all users disconnected
        if state_manager.should_reset():
            await state_manager.reset_diagram()


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "running",
        **state_manager.get_full_state(),
    }

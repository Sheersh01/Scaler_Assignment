from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from typing import Dict, List
import json

router = APIRouter(tags=["websockets"])

class ConnectionManager:
    def __init__(self):
        # Maps user_id to a list of active websocket connections
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        # Optionally broadcast user online status here

    def disconnect(self, websocket: WebSocket, user_id: int):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        # Optionally broadcast user offline status here

    async def send_personal_message(self, message: dict, user_id: int):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                await connection.send_json(message)

    async def broadcast(self, message: dict):
        for user_connections in self.active_connections.values():
            for connection in user_connections:
                await connection.send_json(message)

manager = ConnectionManager()

# A very basic token verification for websockets could be added,
# but for simplicity in this assignment, we might accept user_id in query
@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Extract receiver_ids from the message payload
            receiver_ids = message.get("receiver_ids", [])
            for rid in receiver_ids:
                await manager.send_personal_message(message, rid)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)

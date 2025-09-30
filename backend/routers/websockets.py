from fastapi import WebSocket, WebSocketDisconnect, Depends
from typing import Dict, List
import json
from ..database.db import get_db
from ..database.models import User, Room
from .auth import get_current_user
from sqlalchemy.orm import Session
from fastapi import APIRouter, HTTPException

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}  # room_id -> list of websockets

    async def connect(self, websocket: WebSocket, room_id: int):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)

    def disconnect(self, websocket: WebSocket, room_id: int):
        if room_id in self.active_connections:
            self.active_connections[room_id].remove(websocket)
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]

    async def broadcast(self, message: str, room_id: int):
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                try:
                    await connection.send_text(message)
                except:
                    # Remove dead connections
                    self.disconnect(connection, room_id)

manager = ConnectionManager()

# Note: WebSockets don't use the JWT auth directly; perhaps use query param or cookie for token
# For simplicity, assume token in query

@router.websocket("/ws/{room_id}")
async def websocket_endpoint(room_id: int, websocket: WebSocket, token: str = None):
    # Validate token (simple decode)
    from ..auth import decode_token
    if not token:
        await websocket.close(code=1008)
        return
    try:
        username = decode_token(token)
    except:
        await websocket.close(code=1008)
        return

    # Get user and check membership
    db: Session = next(get_db())
    user = db.query(User).filter(User.username == username).first()
    if not user:
        await websocket.close(code=1008)
        return

    room = db.query(Room).filter(Room.id == room_id).first()
    if not room or user not in room.members:
        await websocket.close(code=1008)
        return

    await manager.connect(websocket, room_id)
    try:
        while True:
            data = await websocket.receive_text()
            # For now, just echo or broadcast; but since messaging is through API, perhaps just notify new messages
            # Actually, for real-time, perhaps the API send_message also broadcasts
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)

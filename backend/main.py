from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware as FastAPICORS
from sqlalchemy.orm import Session
from .database.db import engine, get_db
from .database.models import Base
from .routers import auth, rooms, messages
from .connection_manager import manager
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    yield
    # Shutdown: (optional cleanup here)

app = FastAPI(title="QuantumChat API", version="1.0.0", lifespan=lifespan)

# CORS middleware - use specific origins to avoid issues
app.add_middleware(
    FastAPICORS,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(rooms.router, prefix="/rooms", tags=["Rooms"])
app.include_router(messages.router, prefix="/messages", tags=["Messages"])

# WebSocket endpoint for real-time chat
@app.websocket("/ws/{room_id}")
async def websocket_endpoint(room_id: int, websocket: WebSocket, token: str = None):
    from .auth import decode_token
    from .database.models import User, Room
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
            # For now, no handling of messages from client; just keep alive
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)

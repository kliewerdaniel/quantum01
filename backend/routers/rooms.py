from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from ..database.db import get_db
from ..database.models import User, Room, KeyDistribution, user_room_association
from .auth import get_current_user
# from ..quantum.encryption import generate_kyber_keypair, encapsulate_key  # Commented out for testing
import base64

router = APIRouter()

class CreateRoomRequest(BaseModel):
    name: str

class RoomResponse(BaseModel):
    id: int
    name: str

@router.post("/", response_model=RoomResponse)
async def create_room(request: CreateRoomRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Generate symmetric key for the room
    import os
    symmetric_key = os.urandom(32)  # For AES-256

    # Store symmetric key as base64 (insecure, should be encrypted per user later)
    symmetric_key_b64 = base64.b64encode(symmetric_key).decode()

    # Create room
    new_room = Room(name=request.name, symmetric_key_encrypted=symmetric_key_b64)
    db.add(new_room)
    db.commit()
    db.refresh(new_room)

    # Add creator to room
    stmt = user_room_association.insert().values(user_id=current_user.id, room_id=new_room.id)
    db.execute(stmt)
    db.commit()

    return RoomResponse(id=new_room.id, name=new_room.name)

@router.get("/", response_model=list[RoomResponse])
async def get_rooms(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rooms = current_user.rooms
    return [RoomResponse(id=r.id, name=r.name) for r in rooms]

@router.get("/{room_id}/key")
async def get_room_key(room_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room or current_user not in room.members:
        raise HTTPException(status_code=403, detail="Not authorized")

    return {"symmetric_key": room.symmetric_key_encrypted}

@router.post("/{room_id}/join")
async def join_room(room_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    # Check if already member
    if current_user in room.members:
        raise HTTPException(status_code=400, detail="Already a member")

    # Add to room
    stmt = user_room_association.insert().values(user_id=current_user.id, room_id=room_id)
    db.execute(stmt)
    db.commit()

    # Now, distribute the room key to this user if exists
    # TODO: Implement key distribution when room key exists

    return {"message": "Joined room"}

@router.post("/{room_id}/leave")
async def leave_room(room_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room or current_user not in room.members:
        raise HTTPException(status_code=404, detail="Not a member")

    # Remove from room
    stmt = user_room_association.delete().where(
        (user_room_association.c.user_id == current_user.id) & (user_room_association.c.room_id == room_id)
    )
    db.execute(stmt)
    db.commit()

    return {"message": "Left room"}

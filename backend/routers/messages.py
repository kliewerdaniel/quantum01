from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database.db import get_db
from database.models import User, Room, Message
from routers.auth import get_current_user
from connection_manager import manager
import json

router = APIRouter()

class SendMessageRequest(BaseModel):
    encrypted_data: str  # Base64 encoded encrypted message

class MessageResponse(BaseModel):
    id: int
    room_id: int
    sender_id: int
    encrypted_data: str
    sent_at: str

@router.post("/{room_id}/send", response_model=MessageResponse)
async def send_message(room_id: int, request: SendMessageRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Check if user is member of room
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room or current_user not in room.members:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Create message (assuming encrypted_data is already encrypted by frontend)
    new_message = Message(
        room_id=room_id,
        sender_id=current_user.id,
        encrypted_data=request.encrypted_data
    )
    db.add(new_message)
    db.commit()
    db.refresh(new_message)

    # Broadcast the new message to all users in the room
    message_data = {
        "id": new_message.id,
        "room_id": new_message.room_id,
        "sender_id": new_message.sender_id,
        "encrypted_data": new_message.encrypted_data,
        "sent_at": new_message.sent_at.isoformat()
    }
    await manager.broadcast(json.dumps({"type": "new_message", "data": message_data}), room_id)

    return MessageResponse(
        id=new_message.id,
        room_id=new_message.room_id,
        sender_id=new_message.sender_id,
        encrypted_data=new_message.encrypted_data,
        sent_at=new_message.sent_at.isoformat()
    )

@router.get("/{room_id}", response_model=list[MessageResponse])
async def get_messages(room_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Check if user is member
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room or current_user not in room.members:
        raise HTTPException(status_code=403, detail="Not authorized")

    messages = db.query(Message).filter(Message.room_id == room_id).order_by(Message.sent_at).all()
    return [
        MessageResponse(
            id=m.id,
            room_id=m.room_id,
            sender_id=m.sender_id,
            encrypted_data=m.encrypted_data,
            sent_at=m.sent_at.isoformat()
        ) for m in messages
    ]

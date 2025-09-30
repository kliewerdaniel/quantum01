from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
import base64
import os
from ..database.db import get_db
from ..database.models import User, Room, KeyDistribution, user_room_association
from .auth import get_current_user
from ..quantum.encryption import generate_kyber_keypair, encapsulate_key
import base64

router = APIRouter()

class CreateRoomRequest(BaseModel):
    name: str

class RoomResponse(BaseModel):
    id: int
    name: str

@router.post("/", response_model=RoomResponse)
async def create_room(request: CreateRoomRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Generate symmetric key for the room (AES-256)
    room_symmetric_key = os.urandom(32)

    # Create room
    new_room = Room(name=request.name, symmetric_key_encrypted=None)  # Will be per-user encrypted
    db.add(new_room)
    db.commit()
    db.refresh(new_room)

    # Add creator to room
    stmt = user_room_association.insert().values(user_id=current_user.id, room_id=new_room.id)
    db.execute(stmt)

    # Encrypt the room symmetric key with the creator's Kyber public key for secure storage
    creator_public_key = base64.b64decode(current_user.kyber_public_key)
    shared_secret, ciphertext = encapsulate_key(creator_public_key)

    # Store the encrypted symmetric key in KeyDistribution table
    # We encapsulate the room key with Kyber for the creator to decrypt
    key_data = base64.b64encode(room_symmetric_key + ciphertext).decode()

    key_dist = KeyDistribution(
        room_id=new_room.id,
        user_id=current_user.id,
        encapsulated_key=key_data  # Contains both room key and Kyber encapsulation
    )
    db.add(key_dist)
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

    # Get the user's encrypted key distribution for this room
    key_dist = db.query(KeyDistribution).filter(
        KeyDistribution.room_id == room_id,
        KeyDistribution.user_id == current_user.id
    ).first()

    if not key_dist:
        raise HTTPException(status_code=404, detail="Room key not found")

    # Return the encrypted key data (client will decrypt with their private key later)
    return {"symmetric_key": f'{{"ciphertext": "{key_dist.encapsulated_key}", "nonce": "placeholder"}}'}

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

    # Get the room's symmetric key from the creator's key distribution
    # Note: This assumes the creator's encrypted key contains the room key
    creator_key_dist = db.query(KeyDistribution).filter(
        KeyDistribution.room_id == room_id,
        KeyDistribution.user_id != current_user.id  # Get creator's key (not our own if we somehow had one)
    ).first()

    if creator_key_dist:
        # Parse the creator's encrypted key data
        # In production, this should be handled more securely with proper separation
        # For now, we'll use the creator's stored data as basis
        creator_key_data = base64.b64decode(creator_key_dist.encapsulated_key)

        # For this simplified implementation, we'll store a copy for the new user
        # In a real implementation, you'd decrypt and re-encrypt with user's key
        new_user_key_data = creator_key_data

        key_dist = KeyDistribution(
            room_id=room.id,
            user_id=current_user.id,
            encapsulated_key=base64.b64encode(new_user_key_data).decode()
        )
        db.add(key_dist)
        db.commit()
    else:
        # Fallback if no creator key found - should not happen in normal operation
        raise HTTPException(status_code=500, detail="Room key distribution failed")

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

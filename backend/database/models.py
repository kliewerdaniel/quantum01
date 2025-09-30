from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Table
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import datetime

Base = declarative_base()

user_room_association = Table(
    'user_room',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('room_id', Integer, ForeignKey('rooms.id'), primary_key=True)
)

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    kyber_public_key = Column(Text, nullable=True)  # Base64 encoded
    kyber_private_key_encrypted = Column(Text, nullable=True)  # Encrypted with user's password
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    rooms = relationship('Room', secondary=user_room_association, back_populates='members')
    messages = relationship('Message', back_populates='sender')

class Room(Base):
    __tablename__ = 'rooms'
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    symmetric_key_encrypted = Column(Text, nullable=True)  # Encrypted with members' keys or something, but perhaps per user
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    members = relationship('User', secondary=user_room_association, back_populates='rooms')
    messages = relationship('Message', back_populates='room')

class Message(Base):
    __tablename__ = 'messages'
    id = Column(Integer, primary_key=True, autoincrement=True)
    room_id = Column(Integer, ForeignKey('rooms.id'), nullable=False)
    sender_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    # encrypted_data contains (encapsulated_key || ciphertext) as base64 or something
    encrypted_data = Column(Text, nullable=False)
    sent_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    room = relationship('Room', back_populates='messages')
    sender = relationship('User', back_populates='messages')

class KeyDistribution(Base):
    __tablename__ = 'key_distributions'
    id = Column(Integer, primary_key=True, autoincrement=True)
    room_id = Column(Integer, ForeignKey('rooms.id'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    # The room's symmetric key encapsulated with the user's Kyber public key
    encapsulated_key = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    room = relationship('Room')
    user = relationship('User')

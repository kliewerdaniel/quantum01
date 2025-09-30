from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel
import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend
import os
from database.db import get_db
from database.models import User
from auth import verify_password, get_password_hash, create_access_token
from quantum.encryption import generate_kyber_keypair

router = APIRouter()
security = HTTPBearer()

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

@router.post("/register", response_model=TokenResponse)
async def register(request: RegisterRequest, db: Session = Depends(get_db)):
    # Check if user exists
    existing_user_username = db.query(User).filter(User.username == request.username).first()
    if existing_user_username:
        raise HTTPException(status_code=400, detail="Username already registered")

    existing_user_email = db.query(User).filter(User.email == request.email).first()
    if existing_user_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Generate Kyber keys
    public_key, private_key = generate_kyber_keypair()

    # Generate salt and derive encryption key from password using PBKDF2 + Fernet
    salt = os.urandom(16)
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=200000,  # Increased iterations for better security
        backend=default_backend()
    )
    key = base64.urlsafe_b64encode(kdf.derive(request.password.encode()))
    f = Fernet(key)
    private_key_encrypted = f.encrypt(private_key)

    # Base64 encode for database storage
    kyber_public_key_b64 = base64.b64encode(public_key).decode()
    kyber_private_key_b64 = base64.b64encode(salt + private_key_encrypted).decode()

    # Hash password for authentication
    password_hash = get_password_hash(request.password)

    # Create user
    new_user = User(
        username=request.username,
        email=request.email,
        password_hash=password_hash,
        kyber_public_key=kyber_public_key_b64,
        kyber_private_key_encrypted=kyber_private_key_b64
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create token
    token = create_access_token({"sub": request.username})

    return TokenResponse(access_token=token)

@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == request.username).first()
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect username or password")

    # Create token
    token = create_access_token({"sub": request.username})

    return TokenResponse(access_token=token)

# Dependency to get current user from token
def get_current_user(token: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    decoded_username = decode_token(token.credentials)  # Need to import decode_token
    user = db.query(User).filter(User.username == decoded_username).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid user")
    return user

def decrypt_private_key(password: str, encrypted_data: str) -> bytes:
    """
    Decrypts the Kyber private key using the user's password.

    Args:
        password: User's plaintext password
        encrypted_data: Base64 encoded encrypted private key from database

    Returns:
        Decrypted private key bytes
    """
    try:
        encrypted_bytes = base64.b64decode(encrypted_data)
        salt = encrypted_bytes[:16]
        encrypted_key = encrypted_bytes[16:]

        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=200000,
            backend=default_backend()
        )
        key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
        f = Fernet(key)

        return f.decrypt(encrypted_key)
    except Exception as e:
        raise HTTPException(status_code=400, detail="Failed to decrypt private key - invalid password or corrupted data")

from auth import decode_token

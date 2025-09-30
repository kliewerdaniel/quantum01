# QuantumChat Architecture Overview

## Project Overview
QuantumChat is a secure, real-time messaging platform that leverages post-quantum cryptography to provide end-to-end encrypted communication. The application aims to be resistant to both classical and quantum cryptographic attacks, making it future-proof for secure communications.

## System Architecture

### High-Level Components
1. **Frontend Layer**: React-based web application providing user interface for authentication, room management, and messaging.
2. **Backend API Layer**: FastAPI-powered REST API server handling authentication, room management, and message routing.
3. **Real-Time Communication Layer**: WebSocket-based server for instant message delivery.
4. **Database Layer**: SQLAlchemy ORM with SQLite/PostgreSQL for data persistence.
5. **Quantum Cryptography Layer**: Integration of quantum-resistant cryptographic primitives for key generation and encryption.
6. **Security Infrastructure**: JWT-based authentication, key management, and encryption at rest.

### Data Flow
1. User registers/logs in via REST API.
2. Quantum-safe keys are generated during registration.
3. Client connects to WebSocket for real-time communication.
4. Messages are encrypted on client-side using quantum-derived session keys.
5. Encrypted messages are sent through API and broadcast to room members via WebSocket.
6. Recipients decrypt messages using their session keys.

### Key Technologies
- **Backend**: Python 3.9+, FastAPI, SQLAlchemy, WebSockets
- **Quantum Computing**: Qiskit (IBM Quantum), PyQrypt (CRYSTALS-Kyber)
- **Frontend**: React, TypeScript, WebSocket client
- **Database**: SQLite for development, PostgreSQL for production
- **Security**: Post-quantum cryptography, JWT, AES-GCM

## Component Details

### Backend Structure
```
backend/
├── main.py                 # FastAPI application setup and WebSocket endpoints
├── auth.py                 # Password hashing, JWT handling
├── connection_manager.py   # WebSocket connection management
├── database/
│   ├── models.py           # SQLAlchemy models (User, Room, Message, KeyDistribution)
│   └── db.py               # Database session management
├── quantum/
│   ├── encryption.py       # Kyber KEM + AES-GCM encryption functions
│   └── key_generator.py    # Quantum key generation via Qiskit
└── routers/
    ├── auth.py             # Registration, login endpoints
    ├── rooms.py            # Room creation, membership management
    ├── messages.py         # Message sending, retrieval, encryption handling
    └── websockets.py       # WebSocket connection handling
```

### Database Schema
- **Users**: Authentication data, quantum public keys
- **Rooms**: Chat rooms with associated symmetric keys
- **Messages**: Encrypted messages with room and sender references
- **KeyDistribution**: Encrypted room keys for each member (for ACL)

### Quantum Cryptography Implementation
1. **Key Generation**: Qiskit for quantum random bit generation
2. **Public-Key Encryption**: CRYSTALS-Kyber for key encapsulation
3. **Symmetric Encryption**: AES-GCM for message encryption
4. **Key Management**: Secure storage and distribution of quantum-resistant keys

### Security Considerations
- Post-quantum cryptographic primitives for resistance to quantum attacks
- End-to-end encryption with perfect forward secrecy
- Secure key storage and distribution
- Authentication and authorization controls
- Input validation and rate limiting

## Current State and Gaps
The backend API is partially implemented with basic authentication, room management, and WebSocket connections. The quantum cryptography layer has key generation and encryption primitives. However:
- Frontend is unimplemented (default React template)
- Key distribution for room encryption is incomplete
- Security hardening is needed for production use
- Testing infrastructure is missing
- Deployment and monitoring are not set up
- Documentation and user guides are absent
- Performance optimization and caching are not implemented
- Error handling and logging need improvement

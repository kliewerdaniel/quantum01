# QuantumChat

A secure, real-time messaging platform leveraging post-quantum cryptography for end-to-end encrypted communication.

## Overview

QuantumChat provides a chat application where users can exchange messages securely using quantum-resistant encryption algorithms. The platform is designed to withstand attacks from both classical and quantum computers, ensuring future-proof security for your communications.

## Features

- **Post-Quantum Encryption**: Uses CRYSTALS-Kyber for key encapsulation and AES-GCM for symmetric encryption
- **Quantum Key Generation**: Integrates with Qiskit for quantum random key generation
- **Real-Time Messaging**: WebSocket-based instant message delivery
- **Secure Authentication**: JWT tokens with bcrypt password hashing
- **Key Management**: Automatic key distribution and rotation
- **Room-Based Chats**: Create and join encrypted chat rooms

## Technology Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: SQLAlchemy with SQLite/PostgreSQL
- **Quantum Computing**: Qiskit, PyQrypt (CRYSTALS-Kyber)
- **Authentication**: JWT with passphrase encryption for private keys
- **Real-Time**: WebSocket support for live messaging

### Frontend
- **Framework**: React with TypeScript
- **UI Library**: Material-UI (MUI)
- **Routing**: React Router
- **HTTP Client**: Axios

## Getting Started

### Prerequisites
- Python 3.9+
- Node.js 18+
- SQLite (for development) or PostgreSQL (for production)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/kliewerdaniel/quantum01.git
   cd quantum01
   ```

2. **Backend Setup**
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm start
   ```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### First Use

1. Register a new account at the frontend
2. Login to access the rooms page
3. Create a new chat room
4. Start exchanging encrypted messages

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user with quantum keys
- `POST /auth/login` - Login and receive JWT token

### Rooms
- `GET /rooms/` - Get user's rooms
- `POST /rooms/` - Create new room
- `GET /rooms/{room_id}/key` - Get room encryption key
- `POST /rooms/{room_id}/join` - Join an existing room
- `POST /rooms/{room_id}/leave` - Leave a room

### Messages
- `GET /messages/{room_id}` - Get room messages
- `POST /messages/{room_id}/send` - Send message to room

## Security Architecture

- **Key Generation**: Quantum random keys using Qiskit
- **Public-Key Encryption**: CRYSTALS-Kyber KEM
- **Symmetric Encryption**: AES-GCM for message content
- **Key Storage**: Private keys encrypted with user passwords
- **Key Distribution**: Encapsulated keys for room members

## Project Structure

```
quantumchat/
├── backend/
│   ├── main.py                 # FastAPI application
│   ├── auth.py                 # Authentication utilities
│   ├── database/
│   │   ├── models.py           # SQLAlchemy models
│   │   └── db.py              # Database session management
│   ├── quantum/
│   │   ├── encryption.py      # Kyber + AES-GCM implementation
│   │   └── key_generator.py   # Quantum key generation
│   ├── routers/               # API route handlers
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── components/        # React components
    │   ├── pages/            # Page components
    │   └── App.tsx           # Main application
    └── package.json
```

## Development Guidelines

### Security Best Practices
- Never store sensitive data in plain text
- Use secure random number generation
- Implement proper error handling without leaking information
- Conduct thorough testing of encryption workflows

### Quantum Implementation
- Verify algorithms against NIST Post-Quantum standards
- Include fallback mechanisms for quantum hardware unavailability
- Optimize quantum circuits for minimal gate depth

### Code Quality
- Follow PEP 8 for Python, Airbnb style for TypeScript
- Maintain comprehensive test coverage
- Document API endpoints and functions

## Testing

Run backend tests:
```bash
cd backend
pytest
```

Run frontend tests:
```bash
cd frontend
npm test
```

## Deployment

### Docker Development
```bash
docker-compose up --build
```

### Production Deployment
- Use Kubernetes for orchestration
- Configure PostgreSQL for data persistence
- Set up SSL/TLS certificates
- Implement monitoring with Prometheus/Grafana

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes following the guidelines above
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Future Enhancements

- Client-side encryption implementation
- End-to-end encrypted file sharing
- Voice and video calling with quantum keys
- Mobile application development
- Integration with IBM Quantum production systems
- Quantum-secure digital signatures for message integrity
- Advanced key rotation and perfect forward secrecy
- Admin dashboard for system management
- Multi-factor authentication

## Documentation

- [Architecture Overview](architecture.md)
- [Production Checklist](checklist.md)
- [Detailed Implementation Guide](masterprompt2.md)
- [API Documentation](http://localhost:8000/docs) (when running)

## Contact

For questions or issues, please open a GitHub issue or contact the maintainers.

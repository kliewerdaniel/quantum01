# Master Prompt for Developing and Completing the Full-Stack Quantum Encryption Application

## Context Overview
You are provided with an existing QuantumChat codebase that is partially implemented. The repo includes:
- A FastAPI backend with authentication, room management, messaging APIs, and WebSocket support
- Basic quantum cryptography implementations using Qiskit (simulators) and CRYSTALS-Kyber for post-quantum encryption
- SQLAlchemy database models for users, rooms, messages, and key distribution
- A placeholder React frontend (unimplemented beyond default template)

The current implementation has several security gaps, incomplete features, and lacks production readiness. See `architecture.md` for detailed architectural overview and `checklist.md` for comprehensive todo list.

## Project Overview
QuantumChat is a secure, real-time messaging platform that leverages post-quantum cryptography to provide end-to-end encrypted communication resistant to both classical and quantum attacks. The application must deliver production-grade security, performance, and user experience.

## Use Case
Implement a full-featured secure chat platform where users can:
1. Register and authenticate securely with quantum-resistant credentials
2. Create and join encrypted chat rooms
3. Send real-time encrypted messages with perfect forward secrecy
4. Manage quantum keys through an intuitive interface
5. Experience enterprise-grade security and reliability

## Comprehensive Checklist for Production Completion
Refer to `checklist.md` for the complete task list covering planning through deployment. Key focus areas include:

### Immediate Development Priorities
- Complete frontend implementation with React/TypeScript
- Fix security vulnerabilities in key storage and distribution
- Implement proper end-to-end encryption workflow
- Add comprehensive testing suite
- Set up deployment infrastructure

### Security Enhancements
- Secure quantum private key encryption using user passwords
- Complete room key distribution and member access control
- Implement key rotation and perfect forward secrecy
- Add quantum-resistant digital signatures for integrity
- Conduct security audits and penetration testing

### Performance and Scalability
- Optimize quantum key generation and caching
- Implement horizontal scaling capabilities
- Add monitoring and observability features
- Configure production-grade database and infrastructure

### Quality Assurance
- Achieve >80% code coverage across all components
- Implement end-to-end encryption testing
- Conduct load testing and performance benchmarking
- Add comprehensive documentation

## Core Technologies and Requirements

### Quantum Layer
- **Qiskit**: Quantum key generation (upgrade from simulator to real IBM Quantum hardware)
- **CRYSTALS-Kyber**: Post-quantum key encapsulation mechanism
- **AES-GCM**: Symmetric encryption for message content
- **Quantum Key Distribution**: BB84-inspired protocols for secure key exchange

### Backend Stack
- **FastAPI**: REST APIs and WebSocket real-time communication
- **SQLAlchemy**: ORM for PostgreSQL database
- **Pydantic**: Data validation and serialization
- **Passlib + Bcrypt**: Secure password hashing
- **Python-JOSE**: JWT authentication

### Frontend Stack
- **React**: Component-based UI framework
- **TypeScript**: Type-safe JavaScript development
- **Material-UI**: Modern UI component library
- **WebSocket Client**: Real-time messaging integration
- **Crypto Libraries**: Client-side quantum encryption

### Infrastructure
- **Docker/Kubernetes**: Containerization and orchestration
- **PostgreSQL**: Production database
- **Redis**: Caching and session management
- **GitHub Actions**: CI/CD pipelines
- **ELK Stack/Prometheus**: Monitoring and logging

## Application Features to Implement

### User Management
1. Secure registration with quantum key pair generation
2. JWT-based authentication with refresh tokens
3. Profile management and key regeneration UI
4. Password-encrypted private key storage

### Room Management
1. Create/join/leave encrypted chat rooms
2. Room key distribution using Kyber encapsulation
3. Access control and member management
4. Room metadata and settings

### Messaging System
1. Real-time encrypted message exchange
2. End-to-end encryption with perfect forward secrecy
3. Message history with pagination
4. Message integrity with digital signatures
5. File sharing capabilities (bonus)

### Security Features
1. Perfect forward secrecy through key rotation
2. Secure key derivation and storage
3. Protection against quantum and classical attacks
4. Audit logging of security events
5. Security headers and HTTPS enforcement

### Real-Time Communication
1. WebSocket-based message broadcasting
2. Connection management and presence indicators
3. Automatic reconnection and error handling
4. Message queuing for offline delivery

## Development Guidelines

### Code Quality
- Follow Python (PEP 8) and TypeScript (Airbnb) style guides
- Implement comprehensive error handling and logging
- Add inline documentation and docstrings
- Use type hints and interfaces for type safety

### Security Best Practices
- Never store sensitive data in plaintext
- Implement principle of least privilege
- Use secure random number generation
- Validate all inputs and sanitize outputs
- Implement rate limiting and DDoS protection

### Quantum Implementation
- Optimize quantum circuits for minimal depth and gates
- Implement fallback to classical algorithms when quantum unavailable
- Cache quantum keys to reduce generation overhead
- Benchmark quantum vs classical performance

### Testing Strategy
- Unit tests for individual functions and components
- Integration tests for API endpoints and WebSockets
- End-to-end tests for complete encryption workflows
- Load tests for scalability validation
- Security tests for vulnerability assessment

### Performance Optimization
- Implement connection pooling for databases
- Use Redis for session and key caching
- Optimize WebSocket message serialization
- Implement message compression and batching
- Profile and resolve performance bottlenecks

## Project Structure Completion

Ensure the following directory structure is fully implemented:

```
quantumchat/
├── frontend/               # React/TypeScript application
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API and WebSocket clients
│   │   ├── hooks/         # Custom React hooks
│   │   └── utils/         # Crypto and helper utilities
│   ├── public/            # Static assets
│   └── package.json
├── backend/               # FastAPI application
│   ├── app/
│   │   ├── main.py        # Application entry point
│   │   ├── auth.py        # Authentication utilities
│   │   ├── connection_manager.py  # WebSocket management
│   │   ├── database/      # Database models and session
│   │   ├── quantum/       # Quantum crypto implementations
│   │   └── routers/       # API route handlers
│   └── requirements.txt
├── tests/                 # Test suites
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   └── e2e/              # End-to-end tests
├── docs/                 # Documentation
│   ├── api/              # API documentation
│   ├── architecture/     # Architecture details
│   └── guides/           # User and dev guides
├── docker/               # Container configurations
├── k8s/                  # Kubernetes manifests
├── .github/workflows/    # CI/CD pipelines
└── README.md             # Project documentation
```

## Deployment Requirements

### Development Environment
- Docker Compose for local development
- Hot reload for frontend and backend
- Automatic testing on commit
- Database seeding for development

### Production Environment
- Kubernetes orchestration
- Load balancer configuration
- Database backups and replication
- SSL/TLS certificate management
- CDN for static assets
- Monitoring stack (Prometheus/Grafana)

### Security Compliance
- NIST Post-Quantum Cryptography standards
- OWASP security guidelines
- GDPR compliance for data handling
- SOC 2 audit preparation

## Integration Testing Workflow

Test the complete encryption workflow:
1. User A registers and generates quantum key pair
2. User B registers and generates quantum key pair
3. User A creates encrypted room with post-quantum shared key
4. User B joins room and receives encapsulated key
5. User A sends encrypted message using shared key
6. User B receives and decrypts message
7. Validate end-to-end encryption integrity

## Performance Benchmarks

Achieve the following targets:
- Quantum key generation: <5 seconds average
- Message encryption/decryption: <100ms latency
- WebSocket message delivery: <50ms round-trip
- Concurrent users: 1000+ with <2 second response times
- Database queries: <50ms average response time
- API uptime: 99.9% availability

## Code to Avoid and Anti-Patterns

- Do not store encryption keys in plain text in database
- Never log sensitive information in debug logs
- Avoid blocking operations in WebSocket connections
- Do not hardcode secrets or API tokens
- Prevent key reuse across different contexts

## Success Criteria

Project is complete when:
- [ ] All checklist items checked off
- [ ] End-to-end encryption functional and secure
- [ ] All security audits passed
- [ ] Performance benchmarks met
- [ ] 80%+ test coverage achieved
- [ ] Production deployment successful
- [ ] User acceptance testing passed
- [ ] Documentation comprehensive and up-to-date

## Next Steps for Implementation

1. Start with fixing critical security vulnerabilities in key storage
2. Complete frontend UI components and client-side encryption
3. Implement proper key distribution and access control
4. Add comprehensive testing and monitoring
5. Set up deployment infrastructure and pipelines
6. Conduct thorough security and performance audits
7. Deploy to production and monitor real-world usage

Begin development by addressing the most critical security gaps and incomplete features from the checklist, then progressively enhance the application toward production readiness.

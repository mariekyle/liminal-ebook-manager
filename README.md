# Liminal Ebook Manager

A modern, self-hosted ebook management system built with FastAPI and React.

## Features
- Multi-user support with role-based access control
- Automatic metadata extraction and cover generation
- OPDS feed support for e-readers
- Collection management
- Reading progress tracking
- Beautiful, responsive UI

## Tech Stack
- **Backend**: FastAPI, PostgreSQL, Redis
- **Frontend**: React, TypeScript, Vite
- **Infrastructure**: Docker, Docker Compose

## Quick Start (Docker Development)

### Prerequisites
- Docker and Docker Compose
- Git

### Development Setup
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd liminal_ebook_manager
   ```

2. Start the development environment:
   ```bash
   ./dev.sh start
   ```

3. Access the application:
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:8000
   - **API Documentation**: http://localhost:8000/docs
   - **Database**: localhost:5432
   - **Redis**: localhost:6379

### Development Commands
```bash
# Start development environment
./dev.sh start

# Stop development environment
./dev.sh stop

# Restart development environment
./dev.sh restart

# View logs
./dev.sh logs
./dev.sh logs backend
./dev.sh logs frontend

# Run tests
./dev.sh test

# Check status
./dev.sh status

# Clean up everything
./dev.sh cleanup

# Show help
./dev.sh help
```

## Production Deployment

### Using Docker Compose
1. Copy environment files:
   ```bash
   cp env.dev.example .env
   # Edit .env with production values
   ```

2. Deploy:
   ```bash
   docker-compose up -d
   ```

### Using Portainer
1. Upload the `docker-compose.yml` file to Portainer
2. Configure environment variables in Portainer
3. Deploy the stack

## Development

### Local Development (without Docker)
If you prefer to run services locally:

1. **Backend Setup**:
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Frontend Setup**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Database**: Run PostgreSQL and Redis locally or use Docker

### Project Structure
```
liminal_ebook_manager/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API endpoints
│   │   ├── core/           # Configuration, security, logging
│   │   ├── crud/           # Database operations
│   │   ├── db/             # Database setup
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   └── services/       # Business logic
│   ├── tests/              # Backend tests
│   └── requirements.txt
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── types/          # TypeScript types
│   └── package.json
├── docker-compose.yml      # Production Docker setup
├── docker-compose.dev.yml  # Development Docker setup
└── dev.sh                  # Development helper script
```

## Contributing
See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## License
[Your chosen license]

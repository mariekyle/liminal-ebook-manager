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

## Getting Started

### Prerequisites
- Docker and Docker Compose
- Git

### Installation
1. Clone the repository
2. Copy environment files: `cp backend/.env.example backend/.env` and `cp frontend/.env.example frontend/.env`
3. Configure environment variables
4. Run `docker-compose up -d`
5. Access the application at http://localhost:3000

## Development
See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## License
[Your chosen license]

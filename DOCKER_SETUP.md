# Docker Setup Guide - Liminal Ebook Manager

This guide explains how to use Docker for development and deployment of the Liminal Ebook Manager.

## Overview

We've set up multiple Docker configurations to support different use cases:

1. **Development Environment** (`docker-compose.dev.yml`) - For local development with hot reloading
2. **Production Environment** (`docker-compose.yml`) - For production deployment
3. **Portainer Stack** (`portainer-stack.yml`) - For easy deployment in Portainer

## Quick Start

### For Development (Recommended)

1. **Start Docker Desktop** on your machine
2. **Run the test script** to verify setup:
   ```bash
   ./test-docker-setup.sh
   ```
3. **Start development environment**:
   ```bash
   ./dev.sh start
   ```
4. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### For Production (Docker Compose)

1. **Copy environment template**:
   ```bash
   cp env.dev.example .env
   # Edit .env with production values
   ```
2. **Deploy**:
   ```bash
   docker-compose up -d
   ```

### For Portainer

1. **Upload the stack file** to Portainer
2. **Configure environment variables** in Portainer
3. **Deploy the stack**

## Development Commands

The `dev.sh` script provides easy commands for development:

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

## Environment Variables

Key environment variables you can configure:

### Database
- `POSTGRES_USER` - PostgreSQL username (default: liminal)
- `POSTGRES_PASSWORD` - PostgreSQL password (default: changeme)
- `POSTGRES_DB` - PostgreSQL database name (default: liminal_db)

### Security
- `SECRET_KEY` - JWT secret key (change in production!)
- `ALGORITHM` - JWT algorithm (default: HS256)
- `ACCESS_TOKEN_EXPIRE_MINUTES` - Token expiration time (default: 30)

### API Configuration
- `API_V1_STR` - API version prefix (default: /api/v1)
- `CORS_ORIGINS` - Allowed CORS origins (default: ["http://localhost:3000"])

### Frontend
- `VITE_API_URL` - Backend API URL for frontend (default: http://localhost:8000)

## File Structure

```
liminal_ebook_manager/
├── docker-compose.yml          # Production Docker setup
├── docker-compose.dev.yml      # Development Docker setup
├── portainer-stack.yml         # Portainer stack file
├── dev.sh                      # Development helper script
├── test-docker-setup.sh        # Setup verification script
├── env.dev.example             # Environment template
├── backend/
│   ├── Dockerfile              # Production backend image
│   └── Dockerfile.dev          # Development backend image
└── frontend/
    ├── Dockerfile              # Production frontend image
    └── Dockerfile.dev          # Development frontend image
```

## Services

### Backend (FastAPI)
- **Port**: 8000
- **Features**: Hot reloading in development
- **Database**: PostgreSQL
- **Cache**: Redis
- **Health Check**: `/health` endpoint

### Frontend (React)
- **Port**: 3000
- **Features**: Hot reloading in development
- **Build Tool**: Vite
- **UI Framework**: Material-UI

### Database (PostgreSQL)
- **Port**: 5432 (exposed in development)
- **Version**: 15-alpine
- **Persistence**: Docker volume

### Cache (Redis)
- **Port**: 6379 (exposed in development)
- **Version**: 7-alpine
- **Persistence**: Docker volume with AOF

## Troubleshooting

### Common Issues

1. **Port already in use**:
   ```bash
   # Check what's using the port
   lsof -i :8000
   # Kill the process
   kill -9 <PID>
   ```

2. **Docker not running**:
   - Start Docker Desktop
   - Run `docker info` to verify

3. **Build failures**:
   ```bash
   # Clean up and rebuild
   ./dev.sh cleanup
   ./dev.sh start
   ```

4. **Database connection issues**:
   - Check if PostgreSQL container is healthy
   - Verify environment variables
   - Check logs: `./dev.sh logs postgres`

### Useful Commands

```bash
# View all container logs
docker-compose -f docker-compose.dev.yml logs -f

# Execute commands in running containers
docker-compose -f docker-compose.dev.yml exec backend python -c "print('Hello from backend')"
docker-compose -f docker-compose.dev.yml exec frontend npm run build

# Check container status
docker-compose -f docker-compose.dev.yml ps

# View resource usage
docker stats
```

## Switching Between Machines

Since everything runs in Docker, you can easily switch between machines:

1. **Clone the repository** on the new machine
2. **Install Docker** if not already installed
3. **Run the setup**:
   ```bash
   ./test-docker-setup.sh
   ./dev.sh start
   ```

No need to install Python, Node.js, PostgreSQL, or Redis locally!

## Next Steps

1. **Test the API** using the interactive docs at http://localhost:8000/docs
2. **Start building features** - the backend and frontend are ready for development
3. **Add your first book** through the API
4. **Customize the UI** in the frontend

## Support

If you encounter issues:
1. Check the logs: `./dev.sh logs`
2. Verify Docker is running: `docker info`
3. Check the troubleshooting section above
4. Review the main README.md for additional information 
# Liminal Ebook Manager - Development Prompt & Architecture Guide

## Project Overview

Build a production-ready ebook management system similar to Plex but for books. The system should be containerized, scalable, and maintainable with a focus on proper architecture from the start.

## Step 0: Repository Setup (Start Here First!)

### Archive the Old Repository
1. Go to your MVP repository on GitHub
2. Navigate to Settings → General → Danger Zone
3. Click "Archive this repository" to make it read-only
4. Update the old repo's README to point to the new version

### Create Fresh Repository
1. Create a new repository on GitHub named `liminal-ebook-manager`
2. Do NOT initialize with README, .gitignore, or license (we'll create these)
3. Clone the empty repository locally:

```bash
git clone https://github.com/yourusername/liminal-ebook-manager.git
cd liminal-ebook-manager
```

### Initialize Project Structure
Run these commands to create the initial structure:

```bash
# Create directory structure
mkdir -p backend/app/{api/v1/endpoints,core,crud,db,models,schemas,services}
mkdir -p backend/{alembic/versions,tests/{unit,integration,e2e}}
mkdir -p frontend/src/{components/{common,auth,library,book,settings},pages,services,hooks,utils,types}
mkdir -p frontend/public
mkdir -p .github/workflows

# Create essential files
touch README.md
touch docker-compose.yml docker-compose.prod.yml
touch backend/{Dockerfile,requirements.txt,.env.example,alembic.ini}
touch frontend/{Dockerfile,package.json,tsconfig.json,vite.config.ts,.env.example}
touch .github/workflows/ci.yml

# Create comprehensive .gitignore
cat > .gitignore << 'EOF'
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
ENV/
.env
.venv
pip-log.txt
pip-delete-this-directory.txt
.pytest_cache/
.coverage
htmlcov/
.tox/
.mypy_cache/
.dmypy.json
dmypy.json
.pyre/
*.egg-info/
dist/
build/

# Node
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*
dist/
build/
.env.local
.env.development.local
.env.test.local
.env.production.local
*.tsbuildinfo

# IDE
.vscode/
.idea/
*.swp
*.swo
*.swn
.project
.classpath
.settings/

# OS
.DS_Store
Thumbs.db
Desktop.ini

# Docker
*.log
docker-compose.override.yml

# Project specific
storage/
uploads/
*.epub
*.pdf
*.mobi
*.azw3
coverage/
EOF

# Create initial README
cat > README.md << 'EOF'
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
EOF

# Create backend .env.example
cat > backend/.env.example << 'EOF'
# Application
APP_NAME="Liminal Ebook Manager"
DEBUG=false
API_V1_STR="/api/v1"

# Database
POSTGRES_USER=liminal
POSTGRES_PASSWORD=changeme
POSTGRES_DB=liminal_db
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}

# Redis
REDIS_URL=redis://redis:6379

# Security
SECRET_KEY=changeme-generate-a-secure-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# File Storage
UPLOAD_PATH=/app/storage/uploads
LIBRARY_PATH=/app/storage/library
MAX_UPLOAD_SIZE=104857600  # 100MB

# OPDS
OPDS_TITLE="Liminal Library"
OPDS_AUTHOR="Liminal"
EOF

# Create frontend .env.example
cat > frontend/.env.example << 'EOF'
VITE_API_URL=http://localhost:8000
VITE_APP_NAME="Liminal Ebook Manager"
EOF

# Initial commit
git add .
git commit -m "Initial commit: Project structure for Liminal ebook manager

- Set up directory structure for backend (FastAPI) and frontend (React)
- Added Docker configuration files
- Created environment variable templates
- Added comprehensive .gitignore
- Initialized README with project overview"

git push origin main

echo "✅ Repository initialized successfully!"
echo "📁 Project structure created"
echo "🚀 Ready to start development with Cursor AI"
```

## Core Technology Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL with proper indexing
- **Cache**: Redis for caching and rate limiting
- **Authentication**: JWT-based authentication
- **API Documentation**: Automatic OpenAPI/Swagger documentation

### Frontend
- **Framework**: React with TypeScript
- **State Management**: Context API or Zustand (lightweight alternative to Redux)
- **UI Library**: Material-UI or Tailwind CSS with Headless UI
- **Build Tool**: Vite for fast development and optimized production builds

### Infrastructure
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Docker Compose for local development
- **Deployment**: Portainer management on TrueNAS
- **Monitoring**: Health checks, structured logging, and metrics

## Project Structure

```
liminal-ebook-manager/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── v1/
│   │   │   │   ├── endpoints/
│   │   │   │   │   ├── auth.py
│   │   │   │   │   ├── books.py
│   │   │   │   │   ├── users.py
│   │   │   │   │   └── collections.py
│   │   │   │   └── api.py
│   │   │   └── deps.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   └── logging.py
│   │   ├── crud/
│   │   │   ├── base.py
│   │   │   ├── book.py
│   │   │   ├── user.py
│   │   │   └── collection.py
│   │   ├── db/
│   │   │   ├── base.py
│   │   │   ├── session.py
│   │   │   └── init_db.py
│   │   ├── models/
│   │   │   ├── book.py
│   │   │   ├── user.py
│   │   │   └── collection.py
│   │   ├── schemas/
│   │   │   ├── book.py
│   │   │   ├── user.py
│   │   │   └── collection.py
│   │   ├── services/
│   │   │   ├── book_processor.py
│   │   │   ├── cover_generator.py
│   │   │   ├── opds_generator.py
│   │   │   └── file_scanner.py
│   │   └── main.py
│   ├── alembic/
│   │   └── versions/
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── e2e/
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   ├── auth/
│   │   │   ├── library/
│   │   │   ├── book/
│   │   │   └── settings/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── types/
│   │   └── App.tsx
│   ├── public/
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
├── docker-compose.yml
├── docker-compose.prod.yml
├── .github/
│   └── workflows/
│       └── ci.yml
└── README.md
```

## Core Features Implementation

### Phase 1: Foundation
1. **Authentication System**
   - JWT-based authentication with refresh tokens
   - User roles: Admin and Basic user
   - Secure password hashing with bcrypt
   - Session management with Redis

2. **Database Schema**
   ```sql
   -- Users table
   CREATE TABLE users (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       email VARCHAR(255) UNIQUE NOT NULL,
       username VARCHAR(255) UNIQUE NOT NULL,
       password_hash VARCHAR(255) NOT NULL,
       role VARCHAR(50) NOT NULL DEFAULT 'basic',
       is_active BOOLEAN DEFAULT true,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

   -- Books table
   CREATE TABLE books (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       file_path VARCHAR(500) NOT NULL,
       file_hash VARCHAR(64) UNIQUE NOT NULL,
       title VARCHAR(500) NOT NULL,
       word_count INTEGER,
       publish_date DATE,
       series VARCHAR(255),
       publisher VARCHAR(255),
       isbn VARCHAR(20),
       cover_path VARCHAR(500),
       estimated_read_time INTEGER, -- in minutes
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

   -- Authors table (many-to-many with books)
   CREATE TABLE authors (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       name VARCHAR(255) NOT NULL UNIQUE
   );

   -- Book authors junction table
   CREATE TABLE book_authors (
       book_id UUID REFERENCES books(id) ON DELETE CASCADE,
       author_id UUID REFERENCES authors(id) ON DELETE CASCADE,
       PRIMARY KEY (book_id, author_id)
   );

   -- Tags table
   CREATE TABLE tags (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       name VARCHAR(100) NOT NULL UNIQUE
   );

   -- Book tags junction table
   CREATE TABLE book_tags (
       book_id UUID REFERENCES books(id) ON DELETE CASCADE,
       tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
       PRIMARY KEY (book_id, tag_id)
   );

   -- User book status
   CREATE TABLE user_book_status (
       user_id UUID REFERENCES users(id) ON DELETE CASCADE,
       book_id UUID REFERENCES books(id) ON DELETE CASCADE,
       status VARCHAR(50) NOT NULL, -- read, unread, dnf, in_progress
       read_date DATE,
       PRIMARY KEY (user_id, book_id)
   );

   -- Collections
   CREATE TABLE collections (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       user_id UUID REFERENCES users(id) ON DELETE CASCADE,
       name VARCHAR(255) NOT NULL,
       type VARCHAR(50) NOT NULL, -- manual, filtered
       filter_query JSONB, -- for filtered collections
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

   -- Collection books (for manual collections)
   CREATE TABLE collection_books (
       collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
       book_id UUID REFERENCES books(id) ON DELETE CASCADE,
       PRIMARY KEY (collection_id, book_id)
   );
   ```

3. **API Structure**
   ```python
   # Example endpoint structure
   @router.post("/books/upload")
   async def upload_book(
       file: UploadFile = File(...),
       current_user: User = Depends(get_current_admin_user),
       db: Session = Depends(get_db)
   ):
       # Input validation
       # File processing
       # Metadata extraction
       # Database storage
       # Return response
   ```

### Phase 2: Core Functionality

1. **Book Management**
   - Single file upload with progress tracking
   - Bulk import from storage folder (Plex-like scanning)
   - Metadata extraction from ebook files
   - Cover generation for books without covers
   - File streaming for large uploads

2. **Library Features**
   - Grid/list view toggle
   - Sorting: title, recently added, author, series
   - Filtering by tags, authors, read status
   - Search functionality with debouncing
   - Pagination with infinite scroll

3. **OPDS Support**
   - Generate OPDS feed URL per user
   - Support for OPDS readers
   - Authentication for OPDS access

## Development Guidelines

### Backend Best Practices

1. **Configuration Management**
   ```python
   # core/config.py
   from pydantic import BaseSettings
   
   class Settings(BaseSettings):
       app_name: str = "Liminal Ebook Manager"
       database_url: str
       redis_url: str
       secret_key: str
       algorithm: str = "HS256"
       access_token_expire_minutes: int = 30
       
       class Config:
           env_file = ".env"
   ```

2. **Error Handling**
   ```python
   # Custom exception classes
   class BookNotFoundError(Exception):
       pass
   
   # Global exception handler
   @app.exception_handler(BookNotFoundError)
   async def book_not_found_handler(request, exc):
       return JSONResponse(
           status_code=404,
           content={"detail": "Book not found"}
       )
   ```

3. **Logging Structure**
   ```python
   import structlog
   
   logger = structlog.get_logger()
   
   # Usage
   logger.info("book_uploaded", user_id=user.id, book_title=book.title)
   ```

### Frontend Best Practices

1. **Component Structure**
   ```typescript
   // components/book/BookCard.tsx
   interface BookCardProps {
       book: Book;
       onEdit?: (book: Book) => void;
       onDelete?: (bookId: string) => void;
   }
   
   export const BookCard: React.FC<BookCardProps> = ({ book, onEdit, onDelete }) => {
       // Component implementation
   };
   ```

2. **API Service Layer**
   ```typescript
   // services/api.ts
   class ApiService {
       private baseUrl: string;
       private token: string | null;
       
       async uploadBook(file: File): Promise<Book> {
           // Implementation with proper error handling
       }
   }
   ```

3. **State Management**
   ```typescript
   // hooks/useAuth.ts
   export const useAuth = () => {
       const [user, setUser] = useState<User | null>(null);
       const [loading, setLoading] = useState(true);
       
       // Authentication logic
       
       return { user, loading, login, logout };
   };
   ```

## Docker Configuration

### Multi-stage Dockerfile (Backend)
```dockerfile
# Build stage
FROM python:3.11-slim as builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --user -r requirements.txt

# Runtime stage
FROM python:3.11-slim
WORKDIR /app
COPY --from=builder /root/.local /root/.local
COPY . .
ENV PATH=/root/.local/bin:$PATH

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD python -c "import requests; requests.get('http://localhost:8000/health')"

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Docker Compose Configuration
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build: ./backend
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      REDIS_URL: redis://redis:6379
    volumes:
      - ./storage:/app/storage
    ports:
      - "8000:8000"

  frontend:
    build: ./frontend
    depends_on:
      - backend
    ports:
      - "3000:3000"

volumes:
  postgres_data:
  redis_data:
```

## Testing Strategy

### Backend Testing
```python
# tests/test_books.py
import pytest
from fastapi.testclient import TestClient

def test_upload_book(client: TestClient, admin_token: str):
    response = client.post(
        "/api/v1/books/upload",
        files={"file": ("test.epub", b"content", "application/epub+zip")},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 201
    assert "id" in response.json()
```

### Frontend Testing
```typescript
// tests/BookCard.test.tsx
import { render, screen } from '@testing-library/react';
import { BookCard } from '../components/book/BookCard';

test('renders book title', () => {
    const book = { id: '1', title: 'Test Book', authors: [] };
    render(<BookCard book={book} />);
    expect(screen.getByText('Test Book')).toBeInTheDocument();
});
```

## Security Considerations

1. **Input Validation**
   - File type validation for uploads
   - Size limits for uploads
   - SQL injection prevention via ORM
   - XSS prevention in frontend

2. **Authentication & Authorization**
   - JWT tokens with expiration
   - Role-based access control
   - Rate limiting per user
   - Secure cookie handling

3. **File Security**
   - Virus scanning for uploads
   - Secure file storage outside web root
   - File access through authenticated API only

## Monitoring & Observability

1. **Health Checks**
   ```python
   @app.get("/health")
   async def health_check(db: Session = Depends(get_db)):
       # Check database connection
       # Check Redis connection
       # Return status
   ```

2. **Metrics Collection**
   - Request duration
   - Error rates
   - Database query performance
   - File upload statistics

3. **Logging Standards**
   - Structured JSON logs
   - Request ID tracking
   - User action audit logs
   - Error stack traces

## Deployment Instructions

1. **Environment Setup**
   ```bash
   # Copy environment files
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   
   # Edit configuration values
   ```

2. **Database Migrations**
   ```bash
   # Run migrations
   docker-compose exec backend alembic upgrade head
   ```

3. **Portainer Deployment**
   - Import docker-compose.prod.yml
   - Configure environment variables
   - Set up volumes for persistent storage
   - Configure health check alerts

## Performance Optimization

1. **Backend**
   - Connection pooling for PostgreSQL
   - Redis caching for book metadata
   - Lazy loading for related data
   - Background tasks for file processing

2. **Frontend**
   - Code splitting by route
   - Lazy loading for images
   - Virtual scrolling for large lists
   - Service worker for offline support

## Future Enhancements

- OCR for scanned PDFs
- Reading progress sync
- Social features (reviews, recommendations)
- Integration with Goodreads/other services
- Mobile app development
- E-reader device support
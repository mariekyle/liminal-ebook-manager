# 📚 Liminal Ebook Manager

A simple, elegant personal ebook library manager. Upload EPUB files, automatically extract metadata, and organize your digital book collection.

## 🎯 Core Concept

**Simple but powerful**: Upload an EPUB file and get a beautifully organized library with automatic metadata extraction, search, and management tools.

## ✨ Core Features

### MVP (What We're Building)
- **📤 EPUB Upload**: Drag & drop or click to upload EPUB files
- **🔍 Auto Metadata**: Automatically extract title, author, description from EPUB
- **📚 Library View**: Clean grid/list view of all your books
- **🔎 Search**: Find books by title or author
- **✏️ Edit Metadata**: Update book information
- **📥 Download**: Download your books
- **🗑️ Delete**: Remove books from library

### Future Features (Easy to Add)
- **📸 Cover Extraction**: Auto-extract book covers
- **📊 Reading Status**: Track read/unread/in-progress
- **🎨 Custom Covers**: Upload your own cover images
- **📈 Analytics**: Reading statistics and insights
- **🏷️ Tags/Categories**: Organize books by genre, topic, etc.
- **📱 Mobile App**: Native mobile experience

## 🏗️ Architecture

### Simple & Scalable
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend │    │   FastAPI Backend │    │  PostgreSQL DB  │
│   (Port 3000)   │◄──►│   (Port 8000)   │◄──►│   (Port 5432)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Tech Stack
- **Frontend**: React 18 + Vite (fast, modern)
- **Backend**: FastAPI (auto-docs, type-safe)
- **Database**: PostgreSQL (reliable, powerful)
- **File Storage**: Local filesystem (simple, portable)
- **Containerization**: Docker Compose (easy deployment)

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- 2GB RAM, 5GB storage

### Run the App
```bash
# Clone and start
git clone <your-repo>
cd liminal-ebook-manager
docker-compose up -d

# Access the app
# Frontend: http://localhost:3000
# API Docs: http://localhost:8000/docs
```

### Upload Your First Book
1. Open http://localhost:3000
2. Click "Upload EPUB" or drag & drop a file
3. Watch as metadata is automatically extracted
4. Your book appears in the library!

## 📁 Project Structure

```
liminal-ebook-manager/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API calls
│   │   └── utils/           # Helper functions
│   └── tests/               # Frontend tests
├── backend/                  # FastAPI application
│   ├── app/
│   │   ├── api/             # API endpoints
│   │   ├── models/          # Database models
│   │   ├── services/        # Business logic
│   │   └── utils/           # Helper functions
│   └── tests/               # Backend tests
├── docker-compose.yml       # Service orchestration
└── README.md               # This file
```

## 🧪 Testing Strategy

### Comprehensive Testing from Day One
- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test API endpoints and database operations
- **E2E Tests**: Test complete user workflows
- **Test Coverage**: Aim for 80%+ coverage

### Testing Tools
- **Backend**: pytest, pytest-asyncio, httpx
- **Frontend**: Vitest, React Testing Library
- **E2E**: Playwright
- **Coverage**: Coverage.py, c8

## 🔧 Development

### Local Development
```bash
# Backend development
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend development
cd frontend
npm install
npm run dev
```

### Running Tests
```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test

# E2E tests
npm run test:e2e
```

## 📈 Future Roadmap

### Phase 1: Core MVP ✅
- [x] Basic upload and metadata extraction
- [x] Library view and search
- [x] Basic CRUD operations

### Phase 2: Enhanced UX 🚧
- [ ] Cover image extraction and display
- [ ] Better search and filtering
- [ ] Reading status tracking
- [ ] Mobile-responsive improvements

### Phase 3: Advanced Features 📋
- [ ] User authentication
- [ ] Book collections/tags
- [ ] Reading analytics
- [ ] Export/import functionality

### Phase 4: Scale & Polish 🎯
- [ ] Performance optimizations
- [ ] Advanced storage options
- [ ] API for third-party integrations
- [ ] Mobile app

## 🤝 Contributing

This is a personal project, but contributions are welcome! The codebase is designed to be:
- **Simple**: Easy to understand and modify
- **Well-tested**: Comprehensive test coverage
- **Well-documented**: Clear documentation and comments
- **Modular**: Easy to add new features

## 📄 License

MIT License - feel free to use this for your own projects! 
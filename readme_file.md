# 📚 Liminal Ebook Manager

A modern, full-stack ebook management system built with FastAPI and React. Organize, manage, and enjoy your digital book collection with an intuitive interface and powerful features.

## ✨ Features

### Current Features
- **EPUB File Management**: Upload, store, and organize EPUB ebooks
- **Automatic Metadata Extraction**: Automatically extracts title, author, and description from EPUB files
- **Search Functionality**: Search books by title or author
- **Book Management**: Edit book metadata, download files, and delete books
- **Responsive Design**: Modern, mobile-friendly interface
- **Real-time Notifications**: Success/error feedback for all operations

### Planned Enhancements
- **📸 Cover Image Extraction**: Automatic cover extraction from EPUB files during upload
- **🖼️ Dual View Modes**: Toggle between thumbnail grid and detailed list views
- **🎨 Enhanced Visuals**: Full cover display in detail view with gradient fallbacks
- **📊 Reading Analytics**: Word count extraction and reading time estimates
- **📖 Reading Status Tracking**: Track books as read, in-progress, DNF, or unread
- **🔍 Advanced Filtering**: Sort by title, date added, publication date, or word count
- **🖼️ Custom Covers**: Upload custom cover images for books
- **📥 Enhanced Downloads**: Download books with custom covers embedded
- **🗄️ TrueNAS Dataset Storage**: Professional-grade ZFS storage with snapshots and data integrity
- **📊 Storage Analytics**: Detailed storage usage and library statistics

## 🏗️ Architecture

### Backend (FastAPI)
- **Framework**: FastAPI with automatic API documentation
- **Database**: PostgreSQL with SQLAlchemy ORM
- **File Processing**: EbookLib for EPUB metadata extraction
- **Authentication**: Ready for JWT implementation
- **Storage**: File-based storage with database metadata

### Frontend (React)
- **Framework**: React 18 with modern hooks
- **Styling**: Custom CSS with responsive design
- **State Management**: React useState for local state
- **API Communication**: Fetch API for backend integration
- **User Experience**: Smooth animations and transitions

### Infrastructure
- **Containerization**: Docker Compose for easy deployment
- **Database**: PostgreSQL 15 for reliability and performance
- **Networking**: Custom Docker network for service isolation
- **Volumes**: Persistent storage for database and uploaded files

## 📋 Prerequisites

### System Requirements
- **Docker**: Version 20.10+ with Docker Compose v2
- **Hardware**: 
  - RAM: 2GB minimum, 4GB recommended
  - CPU: 2+ cores recommended
  - Storage: 10GB+ free space for books and database
- **Network**: Internet connection for initial setup and package downloads
- **OS**: Linux, macOS, or Windows with WSL2

### Port Requirements
Ensure these ports are available:
- `3000` - Frontend web interface
- `8000` - Backend API
- `5432` - PostgreSQL (internal only)

### Development Requirements (Optional)
- **Node.js**: 18.0+ for frontend development
- **Python**: 3.11+ for backend development  
- **Git**: For version control
- **Code Editor**: VS Code, Cursor, or similar with Docker extensions

## 🚀 Quick Start

1. **Clone and Setup**
   ```bash
   git clone <repository-url>
   cd ebook-manager
   ```

2. **Start Services**
   ```bash
   docker-compose up -d
   ```

3. **Verify Services are Running**
   ```bash
   docker-compose ps
   # Should show all services as "Up"
   ```

4. **Access Application**
   - **Frontend**: http://localhost:3000
   - **API Documentation**: http://localhost:8000/docs
   - **Database**: localhost:5432 (internal access only)

5. **Upload Your First Book**
   - Click "📤 Upload EPUB" on the main interface
   - Select an EPUB file from your computer
   - Wait for automatic metadata extraction
   - Your book will appear in the library!

## 🌐 Application Access

| Service | URL | Description |
|---------|-----|-------------|
| **Web Interface** | http://localhost:3000 | Main application interface |
| **API Documentation** | http://localhost:8000/docs | Interactive API documentation |
| **API Base** | http://localhost:8000 | REST API endpoint |
| **Health Check** | http://localhost:8000/ | API status endpoint |

## 🔌 API Endpoints

### Books Management
| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| `GET` | `/books` | List all books | - |
| `GET` | `/books/{id}` | Get specific book details | - |
| `POST` | `/books/upload` | Upload new EPUB file | `multipart/form-data` |
| `PUT` | `/books/{id}` | Update book metadata | `{"title": "...", "author": "...", "description": "..."}` |
| `DELETE` | `/books/{id}` | Delete book and file | - |
| `GET` | `/books/search/{query}` | Search books by title/author | - |

### File Access
| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| `GET` | `/uploads/books/{filename}` | Download book files | EPUB file |
| `GET` | `/uploads/covers/{filename}` | Access cover images | Image file |

### Response Examples

**GET /books**
```json
[
  {
    "id": 1,
    "title": "Sample Book",
    "author": "John Doe",
    "description": "A sample book description",
    "file_path": "uploads/books/uuid.epub",
    "file_size": 1024000,
    "added_date": "2024-01-15T10:30:00Z"
  }
]
```

**POST /books/upload**
```json
{
  "id": 1,
  "title": "Extracted Title",
  "author": "Extracted Author", 
  "description": "Extracted description",
  "file_path": "uploads/books/new-uuid.epub",
  "file_size": 2048000,
  "added_date": "2024-01-15T10:35:00Z"
}
```

### Planned Endpoints
- `POST /books/{id}/cover` - Upload custom cover
- `GET /books/{id}/download-with-cover` - Download with embedded cover
- `GET /books/stats` - Library statistics
- `PUT /books/{id}/status` - Update reading status
- `GET /books?sort=title&order=asc` - Advanced sorting

## 🎨 Frontend Features

### Current Interface
- **Modern Design**: Clean, gradient-based UI with smooth animations
- **Responsive Layout**: Works on desktop, tablet, and mobile devices
- **Real-time Search**: Instant filtering as you type
- **Drag & Drop Upload**: Easy file uploading interface
- **Detailed Views**: Comprehensive book information display
- **Edit Mode**: In-place metadata editing

### Planned Enhancements
- **View Toggles**: Switch between grid and list layouts
- **Cover Galleries**: Beautiful cover image displays
- **Advanced Filters**: Multi-criteria sorting and filtering
- **Reading Progress**: Visual progress indicators
- **Statistics Dashboard**: Reading analytics and insights
- **Bulk Operations**: Select and manage multiple books

## 📁 File Structure

```
ebook-manager/
├── docker-compose.yml          # Service orchestration
├── requirements.txt            # Python dependencies
├── README.md                   # This file
├── data/                       # Persistent data (created on first run)
│   ├── db/                     # PostgreSQL data
│   └── storage/                # TrueNAS ZFS dataset (planned)
│       ├── books/              # Original EPUB files
│       ├── covers/             # Extracted cover images  
│       ├── thumbnails/         # Generated thumbnails
│       ├── processed/          # Modified EPUBs with custom covers
│       ├── metadata/           # Cached metadata files
│       └── exports/            # Temporary download files
└── logs/                       # Application logs (optional)
```

### Development Structure (Planned)
```
ebook-manager/
├── backend/
│   ├── app/
│   │   ├── models/             # Database models
│   │   ├── api/                # API routes
│   │   ├── services/           # Business logic
│   │   └── utils/              # Helper functions
│   ├── requirements.txt
│   └── main.py
├── frontend/
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── pages/              # Page components
│   │   ├── hooks/              # Custom hooks
│   │   └── utils/              # Utilities
│   ├── package.json
│   └── public/
└── docker-compose.yml
```

## 🔧 Environment Variables

### Required Configuration
```env
# Database Configuration
POSTGRES_DB=ebooks
POSTGRES_USER=ebook_user
POSTGRES_PASSWORD=verse9booker3flashes8gods9digs8DECODE
DATABASE_URL=postgresql://ebook_user:password@postgres/ebooks

# Application Configuration
REACT_APP_API_URL=http://localhost:8000

# Storage Paths
UPLOAD_PATH=/app/uploads
BOOKS_PATH=/app/uploads/books
COVERS_PATH=/app/uploads/covers
```

### Optional Configuration
```env
# Development
DEBUG=true
LOG_LEVEL=info

# Security
JWT_SECRET=your-secret-key
CORS_ORIGINS=http://localhost:3000

# Performance
MAX_UPLOAD_SIZE=50MB
THUMBNAIL_SIZE=300x400
```

## 🔒 Security Considerations

### Current Security
- **CORS Configuration**: Allows all origins (development only)
- **File Type Validation**: Only EPUB files accepted
- **Path Security**: UUID-based filenames prevent path traversal
- **Container Isolation**: Services run in isolated Docker network

### Production Security (Recommendations)
- **Environment Variables**: Use Docker secrets for sensitive data
- **CORS Restriction**: Limit to specific domains
- **HTTPS**: Use reverse proxy with SSL certificates
- **File Validation**: Enhanced file type and content validation
- **Rate Limiting**: Implement API rate limiting
- **Authentication**: Add user authentication and authorization
- **Database Security**: Use connection pooling and prepared statements
- **Input Sanitization**: Validate all user inputs
- **Security Headers**: Implement security headers in reverse proxy

### Planned Security Features
- **User Authentication**: JWT-based user system
- **Role-Based Access**: Admin and user roles
- **File Encryption**: Optional file encryption at rest
- **Audit Logging**: Track all user actions
- **API Keys**: Optional API key authentication

## 🚀 Production Deployment

### Docker Compose Production
```yaml
# Update docker-compose.yml for production
version: '3.8'
services:
  postgres:
    restart: always
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    secrets:
      - db_password
    
  backend:
    restart: always
    environment:
      - DEBUG=false
      - LOG_LEVEL=warning
    
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
```

### Recommended Production Stack
- **Reverse Proxy**: Nginx or Traefik with SSL termination
- **Container Orchestration**: Docker Swarm or Kubernetes
- **Database**: Managed PostgreSQL (AWS RDS, Google Cloud SQL)
- **File Storage**: Object storage (AWS S3, Google Cloud Storage)
- **Monitoring**: Prometheus + Grafana or similar
- **Logging**: ELK Stack or centralized logging
- **Backup**: Automated database and file backups

## 🗄️ TrueNAS Dataset Storage (Planned)

### Overview
Migration to dedicated TrueNAS ZFS dataset for enterprise-grade storage management with advanced data protection, backup capabilities, and performance optimization.

### Benefits of ZFS Dataset Storage

#### **Data Integrity & Protection**
- **Built-in Checksums**: ZFS detects and corrects data corruption automatically
- **Snapshots**: Point-in-time backups of entire library with minimal space usage
- **RAID Protection**: Protection against drive failures with configurable redundancy
- **Copy-on-Write**: Ensures data consistency during updates

#### **Storage Efficiency**
- **Compression**: LZ4 compression reduces storage usage (excellent for text-heavy EPUBs)
- **Deduplication**: Automatic elimination of duplicate books at filesystem level
- **Thin Provisioning**: Allocate storage space as needed
- **Quotas**: Set limits on library growth to prevent runaway usage

#### **Backup & Disaster Recovery**
- **ZFS Send/Receive**: Efficient incremental backups to remote locations
- **Snapshot Scheduling**: Automated daily/weekly snapshots
- **Replication**: Easy sync to secondary TrueNAS systems
- **Cloud Integration**: Backup snapshots to cloud storage providers

#### **Performance Optimization**
- **SSD Cache (L2ARC)**: Use SSDs for read caching of frequently accessed books
- **Write Cache (SLOG)**: Faster write operations with dedicated SSD
- **Optimized I/O**: ZFS optimized for large file operations typical of ebook files
- **Network Sharing**: Expose dataset via SMB/NFS for direct network access

### Proposed Directory Structure
```
/mnt/apps_pool/ebook-manager/storage/    # TrueNAS ZFS Dataset
├── books/                               # Original EPUB files
│   ├── originals/                       # Unmodified uploaded files
│   └── processed/                       # Books with embedded custom covers
├── covers/                              # Cover image management
│   ├── extracted/                       # Covers extracted from EPUBs
│   ├── custom/                          # User-uploaded custom covers
│   └── thumbnails/                      # Generated thumbnail cache
├── metadata/                            # Cached processing results
│   ├── wordcounts/                      # Pre-calculated word counts
│   ├── toc/                             # Table of contents cache
│   └── search_index/                    # Search optimization data
├── exports/                             # Temporary files
│   ├── downloads/                       # Custom EPUB generation
│   └── backups/                         # Export packages
└── system/                              # Application data
    ├── logs/                            # Detailed operation logs
    └── config/                          # User preferences and settings
```

### Dataset Configuration Recommendations

#### **ZFS Properties**
```bash
# Create dataset with optimal settings
zfs create -o compression=lz4 \
           -o atime=off \
           -o recordsize=1M \
           -o redundant_metadata=most \
           apps_pool/ebook-manager/storage

# Set quotas (example: 500GB limit)
zfs set quota=500G apps_pool/ebook-manager/storage

# Enable deduplication (if desired)
zfs set dedup=on apps_pool/ebook-manager/storage
```

#### **Snapshot Schedule**
```bash
# Automated snapshot retention
Daily snapshots: Keep 30 days
Weekly snapshots: Keep 12 weeks  
Monthly snapshots: Keep 12 months
Yearly snapshots: Keep 5 years
```

### Migration Plan

#### **Phase 1: Dataset Creation**
1. Create new ZFS dataset at `/mnt/apps_pool/ebook-manager/storage`
2. Configure optimal ZFS properties for ebook storage
3. Set up automated snapshot scheduling
4. Test dataset performance and accessibility

#### **Phase 2: Data Migration**
1. Create migration script to move existing uploads
2. Preserve all metadata and file relationships
3. Update database paths to new storage locations
4. Verify data integrity post-migration

#### **Phase 3: Application Integration**
1. Update Docker Compose volume mounts
2. Modify backend to use new storage structure
3. Implement storage monitoring and analytics
4. Add snapshot management to admin interface

### Operational Benefits

#### **For Administrators**
- **Monitoring**: TrueNAS web interface for storage health
- **Maintenance**: Can rebuild containers without affecting library
- **Scaling**: Easy expansion by adding drives to pool
- **Migration**: Move dataset between systems seamlessly

#### **For Users**
- **Reliability**: Better protection against data loss
- **Performance**: Faster access through SSD caching
- **Features**: Enhanced backup and recovery options
- **Growth**: No worries about storage limitations

#### **For Developers**
- **Separation**: Clear distinction between app and data
- **Testing**: Use snapshots for safe development
- **Deployment**: Simplified backup and restore procedures
- **Monitoring**: Rich metrics for storage optimization

## ⚡ Performance & Scaling

### Current Performance
- **File Upload**: Handles files up to 50MB efficiently
- **Search**: Real-time search with client-side filtering
- **Database**: Optimized for small to medium libraries (1000+ books)
- **Memory Usage**: ~200MB for full stack

### Scaling Recommendations
- **Database**: Add indexes on `title`, `author`, `added_date` columns
- **File Storage**: Consider object storage (S3, MinIO) for large collections
- **Caching**: Implement Redis for metadata and search results
- **Load Balancing**: Use multiple backend instances with shared storage
- **CDN**: Serve static assets through CloudFlare or similar

### Monitoring
```bash
# Check container resource usage
docker stats

# Monitor disk space
df -h /mnt/apps_pool/ebook-manager/

# Database performance
docker exec ebook-postgres pg_stat_activity
```

## 🛠️ Development Setup

### Local Development
```bash
# Backend development
cd backend/
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Frontend development
cd frontend/
npm install
npm start
```

### Database Management
```bash
# Access PostgreSQL
docker exec -it ebook-postgres psql -U ebook_user -d ebooks

# Backup database
docker exec ebook-postgres pg_dump -U ebook_user ebooks > backup.sql

# Restore database
docker exec -i ebook-postgres psql -U ebook_user ebooks < backup.sql
```

## 🔧 Troubleshooting

### Common Issues

**Port Already in Use**
```bash
# Check what's using the ports
lsof -i :3000  # Frontend
lsof -i :8000  # Backend
lsof -i :5432  # Database

# Kill processes or change ports in docker-compose.yml
```

**Docker Permission Issues**
```bash
# On Linux, add user to docker group
sudo usermod -aG docker $USER
# Log out and back in
```

**Database Connection Failed**
```bash
# Check if containers are running
docker-compose ps

# View logs for issues
docker-compose logs postgres
docker-compose logs backend
```

**Upload Failures**
- Ensure file is valid EPUB format
- Check file size (default limit in place)
- Verify upload directory permissions

**Frontend Won't Load**
```bash
# Check if API_URL is correctly set
echo $REACT_APP_API_URL

# Clear browser cache and try again
# Check browser console for errors
```

### Getting Help
- Check container logs: `docker-compose logs [service-name]`
- Verify all services are healthy: `docker-compose ps`
- Test API directly: Visit http://localhost:8000/docs
- Check network connectivity between containers

## 📞 Support & Community

### Getting Help
- **Issues**: Report bugs and request features via GitHub Issues
- **Discussions**: Join community discussions for questions and ideas
- **Documentation**: Check the `/docs` endpoint for API reference
- **Wiki**: Additional guides and tutorials (coming soon)

### Before Reporting Issues
1. Check existing issues for duplicates
2. Test with the latest version
3. Provide clear reproduction steps
4. Include relevant logs and system information

### Response Times
- **Bug Reports**: 24-48 hours for acknowledgment
- **Feature Requests**: Weekly review cycle
- **Security Issues**: Immediate attention (email for critical issues)

## 🤝 Contributing

### Ways to Contribute
- 🐛 Report bugs and issues
- 💡 Suggest new features
- 📖 Improve documentation
- 🧪 Write tests
- 💻 Submit code improvements
- 🎨 Design UI/UX improvements

### Development Workflow
1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code Standards
- **Python**: Follow PEP 8, use type hints, docstrings for functions
- **JavaScript**: Use ESLint and Prettier, functional components preferred
- **Git**: Conventional commit messages (`feat:`, `fix:`, `docs:`, etc.)
- **Testing**: Write unit tests for new features
- **Documentation**: Update README and API docs for changes

### Pull Request Guidelines
- Provide clear description of changes
- Include screenshots for UI changes
- Add tests for new functionality
- Ensure all tests pass
- Update documentation as needed

## 🔄 Planned Updates

### Phase 1: Enhanced Visuals
- [ ] Cover image extraction and display
- [ ] Thumbnail vs list view toggle
- [ ] Gradient fallbacks for missing covers
- [ ] Improved book detail layouts

### Phase 2: Reading Analytics
- [ ] Word count extraction
- [ ] Reading time estimates
- [ ] Reading progress tracking
- [ ] Statistics dashboard

### Phase 3: Advanced Management
- [ ] Reading status tracking
- [ ] Advanced sorting and filtering
- [ ] Bulk operations
- [ ] Custom cover uploads

### Phase 4: Enterprise Storage & Infrastructure
- [ ] **TrueNAS Dataset Integration**: Migrate library storage to dedicated ZFS dataset
- [ ] **Advanced Backup System**: Automated snapshots and replication
- [ ] **Storage Optimization**: Compression, deduplication, and quota management
- [ ] **Data Integrity**: ZFS checksums and corruption detection
- [ ] **Performance Caching**: SSD cache layers for faster access

### Phase 5: Enhanced Features
- [ ] User authentication
- [ ] Multi-format support (PDF, MOBI)
- [ ] Reading notes and highlights
- [ ] Social features and recommendations

## 📞 Support

For issues, feature requests, or questions:
- Create an issue in the repository
- Check existing documentation
- Review API documentation at `/docs`

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Built with ❤️ using FastAPI, React, and Docker**
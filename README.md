# Liminal

A self-hosted ebook library manager with notes and linking.

## Features

- 📚 Scan your book folders and extract metadata from EPUB/PDF files
- 🎨 Auto-generated gradient covers based on author
- 📝 Rich notes with `[[linking]]` between books
- 📱 Mobile-friendly web interface
- 🔄 Auto-deploy on git push

## Quick Start

### Prerequisites

- Synology NAS (or any machine with Docker)
- Your ebook library organized in folders
- Tailscale (optional, for remote access)

### Installation

1. Clone this repo to your NAS
2. Update `docker-compose.yml` with your books path
3. Run `docker-compose up -d`
4. Access at `http://your-nas:3000`

See `docs/` for detailed setup guides.

## Project Structure

```
liminal/
├── backend/          # Python FastAPI
├── frontend/         # React + Tailwind
├── webhook/          # Auto-deploy service
├── docs/             # Documentation
└── docker-compose.yml
```

## Documentation

- [Architecture Guide](docs/ARCHITECTURE.md)
- [Git Workflow](docs/GIT_WORKFLOW.md)
- [Auto-Deploy Setup](docs/AUTO_DEPLOY.md)

## License

MIT

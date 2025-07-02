# Contributing to Liminal Ebook Manager

Thank you for your interest in contributing to Liminal! This document provides guidelines and instructions for contributing to the project.

## Table of Contents
- [Development Setup](#development-setup)
- [Code Standards](#code-standards)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Reporting Issues](#reporting-issues)

## Development Setup

### Prerequisites
- Docker Desktop or Docker Engine with Docker Compose
- Python 3.11+ (for local backend development)
- Node.js 18+ and npm 9+ (for local frontend development)
- Git
- A code editor (VS Code recommended with the extensions below)

### Recommended VS Code Extensions
- Python (ms-python.python)
- Pylance (ms-python.vscode-pylance)
- ESLint (dbaeumer.vscode-eslint)
- Prettier (esbenp.prettier-vscode)
- Docker (ms-azuretools.vscode-docker)
- GitLens (eamodio.gitlens)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/liminal-ebook-manager.git
   cd liminal-ebook-manager
   ```

2. **Set up environment variables**
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   # Edit the .env files with your local configuration
   ```

3. **Start the development environment**
   ```bash
   # Start all services
   docker-compose up -d
   
   # View logs
   docker-compose logs -f
   
   # Stop all services
   docker-compose down
   ```

4. **Run database migrations**
   ```bash
   docker-compose exec backend alembic upgrade head
   ```

### Development Without Docker (Optional)

#### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
pip install -r requirements-dev.txt

# Run the backend
uvicorn app.main:app --reload --port 8000
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Code Standards

### Python (Backend)
- Follow [PEP 8](https://www.python.org/dev/peps/pep-0008/) style guide
- Use type hints for all function parameters and return values
- Maximum line length: 88 characters (Black formatter default)
- Use meaningful variable names, avoid single letters except for indices
- Docstrings required for all public functions and classes

Example:
```python
from typing import List, Optional
from sqlalchemy.orm import Session

async def get_books_by_author(
    db: Session,
    author_name: str,
    limit: int = 100,
    offset: int = 0
) -> List[Book]:
    """
    Retrieve books by a specific author.
    
    Args:
        db: Database session
        author_name: Name of the author to search for
        limit: Maximum number of results to return
        offset: Number of results to skip
        
    Returns:
        List of Book objects matching the author
    """
    # Implementation here
```

### TypeScript/React (Frontend)
- Use TypeScript for all new code
- Follow [Airbnb React Style Guide](https://github.com/airbnb/javascript/tree/master/react)
- Use functional components with hooks
- Props interfaces should be exported and properly typed
- Use meaningful component and variable names

Example:
```typescript
export interface BookCardProps {
  book: Book;
  onEdit?: (book: Book) => void;
  onDelete?: (bookId: string) => void;
  isAdmin: boolean;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  onEdit,
  onDelete,
  isAdmin
}) => {
  // Component implementation
};
```

### Git Commit Messages
Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, missing semicolons, etc.)
- `refactor:` Code refactoring without changing functionality
- `test:` Adding or modifying tests
- `chore:` Maintenance tasks, dependency updates

Examples:
```
feat: add OPDS feed generation for user libraries
fix: correct book cover aspect ratio on mobile devices
docs: update API documentation for authentication endpoints
test: add unit tests for book metadata extraction
```

## Development Workflow

1. **Create a new branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/issue-description
   ```

2. **Make your changes**
   - Write code following the style guides
   - Add/update tests as needed
   - Update documentation if necessary

3. **Run tests locally**
   ```bash
   # Backend tests
   docker-compose exec backend pytest
   
   # Frontend tests
   docker-compose exec frontend npm test
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add book series management"
   ```

5. **Push to your branch**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Use a clear, descriptive title
   - Reference any related issues
   - Describe what changes were made and why
   - Include screenshots for UI changes

## Testing

### Backend Testing
```bash
# Run all tests
docker-compose exec backend pytest

# Run with coverage
docker-compose exec backend pytest --cov=app --cov-report=html

# Run specific test file
docker-compose exec backend pytest tests/test_books.py

# Run tests with verbose output
docker-compose exec backend pytest -v
```

### Frontend Testing
```bash
# Run all tests
docker-compose exec frontend npm test

# Run with coverage
docker-compose exec frontend npm run test:coverage

# Run in watch mode
docker-compose exec frontend npm test -- --watch
```

### Writing Tests
- Aim for at least 80% code coverage
- Write unit tests for all utility functions
- Write integration tests for API endpoints
- Write component tests for all UI components
- Use meaningful test descriptions

Example backend test:
```python
def test_create_book(client: TestClient, admin_token: str):
    """Test creating a new book with valid data."""
    response = client.post(
        "/api/v1/books",
        json={
            "title": "Test Book",
            "authors": ["Test Author"],
            "isbn": "1234567890"
        },
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Test Book"
    assert "id" in data
```

## Submitting Changes

### Pull Request Checklist
- [ ] Code follows the project's style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated (if needed)
- [ ] Tests added/updated and passing
- [ ] No new warnings introduced
- [ ] Commit messages follow conventions
- [ ] PR title is clear and descriptive
- [ ] Related issues are linked

### Code Review Process
1. All PRs require at least one approval
2. CI checks must pass
3. No merge conflicts
4. Address all review comments
5. Keep PRs focused and reasonably sized

## Reporting Issues

### Bug Reports
When reporting bugs, please include:
- Clear, descriptive title
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Environment details (OS, browser, etc.)
- Error messages or logs

### Feature Requests
For feature requests, please include:
- Clear description of the feature
- Use case / problem it solves
- Possible implementation approach (optional)
- Mockups or examples (if applicable)

## Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [Docker Documentation](https://docs.docker.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## Questions?

If you have questions about contributing, feel free to:
- Open a discussion in the GitHub Discussions tab
- Ask in the issue you're working on
- Reach out to the maintainers

Thank you for contributing to Liminal! 🚀
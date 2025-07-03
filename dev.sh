#!/bin/bash

# Liminal Ebook Manager - Development Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Function to create .env file if it doesn't exist
setup_env() {
    if [ ! -f .env ]; then
        print_status "Creating .env file from template..."
        cp env.dev.example .env
        print_success "Created .env file. Please review and modify as needed."
    else
        print_status ".env file already exists."
    fi
}

# Function to start development environment
start_dev() {
    print_status "Starting development environment..."
    docker-compose -f docker-compose.dev.yml up --build -d
    print_success "Development environment started!"
    print_status "Backend API: http://localhost:8000"
    print_status "Frontend: http://localhost:3000"
    print_status "API Docs: http://localhost:8000/docs"
    print_status "Database: localhost:5432"
    print_status "Redis: localhost:6379"
}

# Function to stop development environment
stop_dev() {
    print_status "Stopping development environment..."
    docker-compose -f docker-compose.dev.yml down
    print_success "Development environment stopped!"
}

# Function to restart development environment
restart_dev() {
    print_status "Restarting development environment..."
    docker-compose -f docker-compose.dev.yml down
    docker-compose -f docker-compose.dev.yml up --build -d
    print_success "Development environment restarted!"
}

# Function to show logs
show_logs() {
    if [ -z "$1" ]; then
        print_status "Showing logs for all services..."
        docker-compose -f docker-compose.dev.yml logs -f
    else
        print_status "Showing logs for service: $1"
        docker-compose -f docker-compose.dev.yml logs -f "$1"
    fi
}

# Function to run tests
run_tests() {
    print_status "Running backend tests..."
    docker-compose -f docker-compose.dev.yml exec backend python -m pytest
}

# Function to show status
show_status() {
    print_status "Development environment status:"
    docker-compose -f docker-compose.dev.yml ps
}

# Function to clean up
cleanup() {
    print_warning "This will remove all containers, volumes, and images. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        print_status "Cleaning up development environment..."
        docker-compose -f docker-compose.dev.yml down -v --rmi all
        print_success "Cleanup complete!"
    else
        print_status "Cleanup cancelled."
    fi
}

# Main script logic
case "${1:-start}" in
    "start")
        check_docker
        setup_env
        start_dev
        ;;
    "stop")
        check_docker
        stop_dev
        ;;
    "restart")
        check_docker
        restart_dev
        ;;
    "logs")
        check_docker
        show_logs "$2"
        ;;
    "test")
        check_docker
        run_tests
        ;;
    "status")
        check_docker
        show_status
        ;;
    "cleanup")
        check_docker
        cleanup
        ;;
    "help"|"-h"|"--help")
        echo "Liminal Ebook Manager - Development Script"
        echo ""
        echo "Usage: ./dev.sh [command]"
        echo ""
        echo "Commands:"
        echo "  start     Start the development environment (default)"
        echo "  stop      Stop the development environment"
        echo "  restart   Restart the development environment"
        echo "  logs      Show logs (optionally specify service name)"
        echo "  test      Run backend tests"
        echo "  status    Show status of all services"
        echo "  cleanup   Remove all containers, volumes, and images"
        echo "  help      Show this help message"
        echo ""
        echo "Examples:"
        echo "  ./dev.sh start"
        echo "  ./dev.sh logs backend"
        echo "  ./dev.sh restart"
        ;;
    *)
        print_error "Unknown command: $1"
        echo "Use './dev.sh help' for usage information."
        exit 1
        ;;
esac 
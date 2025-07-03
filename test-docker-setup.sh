#!/bin/bash

# Test script for Docker setup
echo "Testing Docker setup for Liminal Ebook Manager..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "✅ Docker is running"

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed"
    exit 1
fi

echo "✅ docker-compose is available"

# Check if required files exist
required_files=(
    "docker-compose.dev.yml"
    "backend/Dockerfile.dev"
    "frontend/Dockerfile.dev"
    "backend/requirements.txt"
    "frontend/package.json"
    "env.dev.example"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Missing required file: $file"
        exit 1
    fi
    echo "✅ Found $file"
done

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.dev.example .env
    echo "✅ Created .env file"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "🎉 Docker setup is ready!"
echo ""
echo "To start the development environment:"
echo "  ./dev.sh start"
echo ""
echo "To view logs:"
echo "  ./dev.sh logs"
echo ""
echo "To stop the environment:"
echo "  ./dev.sh stop" 
#!/bin/bash
# deploy-internal.sh - Runs inside the webhook container
# Pulls latest code and rebuilds the main Liminal app

set -e

PROJECT_DIR="/project"
COMPOSE_FILE="docker-compose.yml"

echo "=========================================="
echo "Auto-Deploy triggered at $(date)"
echo "=========================================="

cd "$PROJECT_DIR"

echo "📥 Pulling latest changes..."
git fetch origin main
git reset --hard origin/main

echo "🏗️  Rebuilding Liminal app..."
# Only rebuild the app service, not the webhook service
docker-compose -f "$COMPOSE_FILE" up -d --build app

echo "✅ Deploy complete!"
echo "=========================================="

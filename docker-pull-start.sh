#!/bin/bash

# Script to pull and start Docker images from Docker Hub
# Usage: ./docker-pull-start.sh

# Configuration - Replace with your Docker Hub username
DOCKERHUB_USERNAME="manafeng"

echo "========================================"
echo " Newsworthy Editor - Pull from Docker Hub"
echo "========================================"
echo ""
echo "Docker Hub Username: $DOCKERHUB_USERNAME"
echo ""

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "[ERROR] Docker not found"
    echo "Please install Docker from https://www.docker.com/products/docker-desktop"
    exit 1
fi
echo "[OK] Docker found"
echo ""

# Check Docker Compose
if ! docker compose version &> /dev/null; then
    echo "[ERROR] Docker Compose not found"
    exit 1
fi
echo "[OK] Docker Compose found"
echo ""

# Check if docker-compose.hub.yml exists
if [ ! -f "docker-compose.hub.yml" ]; then
    echo "[ERROR] docker-compose.hub.yml not found"
    echo "Please ensure you have the docker-compose.hub.yml file in the current directory"
    exit 1
fi

# Update docker-compose.hub.yml with username if needed
echo "Checking docker-compose.hub.yml configuration..."
if ! grep -q "$DOCKERHUB_USERNAME" docker-compose.hub.yml; then
    echo "Updating docker-compose.hub.yml with username: $DOCKERHUB_USERNAME"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/manafeng/$DOCKERHUB_USERNAME/g" docker-compose.hub.yml
    else
        # Linux
        sed -i "s/manafeng/$DOCKERHUB_USERNAME/g" docker-compose.hub.yml
    fi
    if [ $? -eq 0 ]; then
        echo "[OK] docker-compose.hub.yml updated"
    else
        echo "[WARNING] Failed to auto-update docker-compose.hub.yml"
        echo "Please manually update docker-compose.hub.yml with username: $DOCKERHUB_USERNAME"
    fi
    echo ""
fi

# Create data directory if it doesn't exist
if [ ! -d "Newsworthy Editor/backend/data" ]; then
    echo "Creating data directory..."
    mkdir -p "Newsworthy Editor/backend/data"
fi

# Pull and start services
echo "========================================"
echo "Pulling images from Docker Hub..."
echo "========================================"
echo ""

docker compose -f docker-compose.hub.yml pull

if [ $? -ne 0 ]; then
    echo ""
    echo "[ERROR] Failed to pull images"
    echo ""
    echo "Possible causes:"
    echo "1. Not logged in to Docker Hub - Run: docker login"
    echo "2. Images do not exist - Check https://hub.docker.com/r/$DOCKERHUB_USERNAME/newsworthy-backend"
    echo "3. Wrong username - Verify your Docker Hub username is correct"
    echo "4. Network issues - Check your internet connection"
    echo ""
    exit 1
fi

echo ""
echo "========================================"
echo "Starting services..."
echo "========================================"
echo ""

docker compose -f docker-compose.hub.yml up -d

if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to start services"
    exit 1
fi

echo ""
echo "========================================"
echo " Services Started!"
echo "========================================"
echo ""
echo "Backend:  http://localhost:3001"
echo "Frontend: http://localhost"
echo ""
echo "To view logs: docker compose -f docker-compose.hub.yml logs -f"
echo "To stop:      docker compose -f docker-compose.hub.yml down"
echo "To update:    docker compose -f docker-compose.hub.yml pull && docker compose -f docker-compose.hub.yml up -d"
echo ""

# Try to open browser (if on Mac)
if [[ "$OSTYPE" == "darwin"* ]]; then
    sleep 2
    open http://localhost
fi


#!/bin/bash

echo "========================================"
echo " Newsworthy Editor - Docker Start"
echo "========================================"
echo

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "[ERROR] Docker not found"
    echo "Please install Docker from https://www.docker.com/get-started"
    exit 1
fi
echo "[OK] Docker found"
echo

# Check Docker Compose
if ! docker compose version &> /dev/null; then
    echo "[ERROR] Docker Compose not found"
    exit 1
fi
echo "[OK] Docker Compose found"
echo

# Create data directory if it doesn't exist
if [ ! -d "Newsworthy Editor/backend/data" ]; then
    echo "Creating data directory..."
    mkdir -p "Newsworthy Editor/backend/data"
fi

# Build and start services
echo "Building and starting services..."
docker compose up -d --build

if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to start services"
    exit 1
fi

echo
echo "========================================"
echo " Services Started!"
echo "========================================"
echo "Backend:  http://localhost:3001"
echo "Frontend: http://localhost:5173"
echo
echo "To view logs: docker compose logs -f"
echo "To stop:      docker compose down"
echo

# Open browser (Linux/Mac)
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:5173 &
elif command -v open &> /dev/null; then
    open http://localhost:5173 &
fi


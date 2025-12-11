#!/bin/bash

# Script to stop Docker services (supports dev, prod, and hub modes)
# Usage: ./docker-stop.sh [mode]
#   mode: dev (default), prod, or hub

MODE=${1:-dev}

echo "========================================"
echo " Stopping Docker Services"
echo "========================================"
echo ""

case "$MODE" in
    dev)
        echo "Stopping development services..."
        docker compose down
        ;;
    prod)
        echo "Stopping production services..."
        docker compose -f docker-compose.prod.yml down
        ;;
    hub)
        echo "Stopping Docker Hub services..."
        docker compose -f docker-compose.hub.yml down
        ;;
    *)
        echo "[ERROR] Invalid mode: $MODE"
        echo "Usage: ./docker-stop.sh [dev|prod|hub]"
        exit 1
        ;;
esac

if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to stop services"
    exit 1
fi

echo ""
echo "Services stopped successfully."
echo ""


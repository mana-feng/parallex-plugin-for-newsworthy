#!/bin/bash

# Build and push script for Docker Hub
# Usage: ./build-and-push.sh [version]
# Example: ./build-and-push.sh v1.0.0

# Configuration - Replace with your Docker Hub username
DOCKERHUB_USERNAME="your-username"

# Get version from argument or use 'latest'
VERSION=${1:-latest}

echo "========================================"
echo "Building and Pushing Docker Images"
echo "========================================"
echo "Docker Hub Username: $DOCKERHUB_USERNAME"
echo "Version: $VERSION"
echo ""

# Check if username is still placeholder
if [ "$DOCKERHUB_USERNAME" = "your-username" ]; then
    echo "[ERROR] Please set your Docker Hub username in this script!"
    echo "Edit build-and-push.sh and replace 'your-username' with your actual Docker Hub username."
    echo ""
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "[ERROR] Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if logged in to Docker Hub
if ! docker info | grep -q "Username"; then
    echo "[WARNING] Not logged in to Docker Hub. Attempting to login..."
    docker login
    if [ $? -ne 0 ]; then
        echo "[ERROR] Failed to login to Docker Hub"
        exit 1
    fi
fi

echo "[1/4] Building backend image..."
docker build -t ${DOCKERHUB_USERNAME}/newsworthy-backend:${VERSION} ./Newsworthy\ Editor/backend
if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to build backend image"
    exit 1
fi

# Also tag as latest if not already latest
if [ "$VERSION" != "latest" ]; then
    docker tag ${DOCKERHUB_USERNAME}/newsworthy-backend:${VERSION} ${DOCKERHUB_USERNAME}/newsworthy-backend:latest
fi

echo "[2/4] Building frontend image (production)..."
docker build --target production -t ${DOCKERHUB_USERNAME}/newsworthy-frontend:${VERSION} ./Newsworthy\ Editor
if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to build frontend image"
    exit 1
fi

# Also tag as latest if not already latest
if [ "$VERSION" != "latest" ]; then
    docker tag ${DOCKERHUB_USERNAME}/newsworthy-frontend:${VERSION} ${DOCKERHUB_USERNAME}/newsworthy-frontend:latest
fi

echo "[3/4] Pushing backend image..."
echo "Pushing to: ${DOCKERHUB_USERNAME}/newsworthy-backend:${VERSION}"
docker push ${DOCKERHUB_USERNAME}/newsworthy-backend:${VERSION}
if [ $? -ne 0 ]; then
    echo ""
    echo "[ERROR] Failed to push backend image"
    echo ""
    echo "Possible causes:"
    echo "1. Not logged in to Docker Hub - Run: docker login"
    echo "2. Repository does not exist - Create it at https://hub.docker.com/repositories"
    echo "3. Insufficient permissions - Check your Docker Hub account"
    echo "4. Wrong username - Verify your Docker Hub username is correct"
    echo ""
    exit 1
fi

if [ "$VERSION" != "latest" ]; then
    docker push ${DOCKERHUB_USERNAME}/newsworthy-backend:latest
fi

echo "[4/4] Pushing frontend image..."
docker push ${DOCKERHUB_USERNAME}/newsworthy-frontend:${VERSION}
if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to push frontend image"
    exit 1
fi

if [ "$VERSION" != "latest" ]; then
    docker push ${DOCKERHUB_USERNAME}/newsworthy-frontend:latest
fi

echo ""
echo "========================================"
echo "Success! Images pushed to Docker Hub"
echo "========================================"
echo "Backend:  ${DOCKERHUB_USERNAME}/newsworthy-backend:${VERSION}"
echo "Frontend: ${DOCKERHUB_USERNAME}/newsworthy-frontend:${VERSION}"
echo ""
echo "To use these images, update docker-compose.hub.yml with your username"
echo "and run: docker-compose -f docker-compose.hub.yml up -d"


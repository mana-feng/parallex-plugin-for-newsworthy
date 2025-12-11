# Docker Deployment Guide

This guide provides complete instructions for deploying the Newsworthy Editor project using Docker.

## Table of Contents

- [Quick Start](#quick-start)
- [Development Environment](#development-environment)
- [Production Environment](#production-environment)
- [Docker Hub Deployment](#docker-hub-deployment)
- [Common Commands](#common-commands)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

### Prerequisites

- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Docker Compose v2.0+

**Verify installation:**
```bash
docker --version
docker compose version
```

### One-Click Start

**Development Mode (Recommended for development):**
```bash
# Windows
./docker-start.bat

# Linux/Mac
chmod +x docker-start.sh
./docker-start.sh

# Or use directly
./docker compose up -d
```

**Production Mode:**
```bash
./docker compose -f docker-compose.prod.yml up -d
```

**Access URLs:**
- Development mode: Frontend http://localhost:5173 | Backend http://localhost:3001
- Production mode: Frontend http://localhost | Backend http://localhost:3001

---

PS: If there are some network issues when starting Docker, such as failure in pulling the image, you can refer to the old script guide [README-OLD.md](README-OLD.md) for startup.

## Development Environment

### Features

- ✅ Hot Reload: Code changes automatically refresh
- ✅ Source Mount: Edit local files directly
- ✅ Development Tools: Complete development dependencies

### Startup Steps

```bash
# 1. Start services
docker compose up -d

# 2. View logs
docker compose logs -f

# 3. Stop services
docker compose down
```

### Development Workflow

```bash
# Start development environment
docker compose up -d

# Edit code (in ./Newsworthy Editor/src/)
# Frontend will automatically hot reload, no restart needed

# Install new dependencies
cd "Newsworthy Editor"
npm install <package-name>
docker compose restart frontend

# View logs
docker compose logs -f frontend
docker compose logs -f backend

# Stop environment
docker compose down
```

### Debugging Tips

```bash
# Enter container
docker compose exec frontend sh
docker compose exec backend sh

# View resource usage
docker stats

# View container status
docker compose ps
```

---

## Production Environment

### Features

- ✅ Optimized Build: Production optimizations
- ✅ Nginx Server: High-performance static file server
- ✅ Minimal Image: Only includes runtime dependencies

### Startup Steps

```bash
# 1. Build production images
docker compose -f docker-compose.prod.yml build

# 2. Start services
docker compose -f docker-compose.prod.yml up -d

# 3. View logs
docker compose -f docker-compose.prod.yml logs -f
```

### Configuration

**Port Mapping:**
- Frontend: 80 (HTTP)
- Backend: 3001

**Data Persistence:**
- Database files are saved in `Newsworthy Editor/backend/data/` directory

---

## Docker Hub Deployment

### Upload Images to Docker Hub

#### Step 1: Configure Username

**Important:** Before running the script, you must configure your Docker Hub username!

Edit `build-and-push.bat` (Windows) or `build-and-push.sh` (Linux/Mac):
```bash
# Find and replace this line
set DOCKERHUB_USERNAME=your-username  # Windows
DOCKERHUB_USERNAME="your-username"    # Linux/Mac

# Replace with your actual username, for example:
set DOCKERHUB_USERNAME=myusername     # Windows
DOCKERHUB_USERNAME="myusername"       # Linux/Mac
```

#### Step 2: Login to Docker Hub

```bash
docker login
# Enter your Docker Hub username and password (or access token)
```

**Tip:** If using an access token (recommended), generate a Personal Access Token in Docker Hub settings.

#### Step 3: Build Images

```bash
# Build Backend
docker build -t <your-username>/newsworthy-backend:latest "Newsworthy Editor/backend"

# Build Frontend (production version)
docker build --target production -t <your-username>/newsworthy-frontend:latest "Newsworthy Editor"
```

#### Step 4: Push Images

**Note:** If the repository doesn't exist, Docker Hub will automatically create it on first push (requires verified account).

```bash
docker push <your-username>/newsworthy-backend:latest
docker push <your-username>/newsworthy-frontend:latest
```

#### Automation Script

**Using the provided script:**
```bash
# Edit build-and-push.sh or build-and-push.bat, replace username
# Linux/Mac
./build-and-push.sh v1.0.0

# Windows
build-and-push.bat v1.0.0
```

### Pull and Use from Docker Hub

**📖 Detailed Guide:** See [DOCKER-HUB-PULL.md](./DOCKER-HUB-PULL.md) for complete instructions.

#### Method 1: Using Convenience Script (Simplest, Recommended)

**Windows:**
```bash
# 1. Edit docker-pull-start.bat, configure Docker Hub username (if needed)
# 2. Run
docker-pull-start.bat
```

**Linux/Mac:**
```bash
# 1. Edit docker-pull-start.sh, configure Docker Hub username (if needed)
# 2. Run
chmod +x docker-pull-start.sh
./docker-pull-start.sh
```

#### Method 2: Using docker-compose.hub.yml

```bash
# 1. Edit docker-compose.hub.yml, replace username (if needed)
# 2. Pull and start
docker compose -f docker-compose.hub.yml pull
docker compose -f docker-compose.hub.yml up -d

# View logs
docker compose -f docker-compose.hub.yml logs -f

# Stop services
docker compose -f docker-compose.hub.yml down
```

#### Method 3: Manual Pull

```bash
# Pull images
docker pull manafeng/newsworthy-backend:latest
docker pull manafeng/newsworthy-frontend:latest

# View images
docker images | grep newsworthy

# Run containers (refer to docker-compose.hub.yml configuration)
```

**Access URLs:**
- Frontend: http://localhost
- Backend: http://localhost:3001

### Version Management

**Tagging Strategy:**
- `latest` - Latest stable version
- `v1.0.0` - Specific version number
- `dev` - Development version (frontend only)

**Building Multiple Versions:**
```bash
docker build -t myusername/newsworthy-backend:v1.0.0 "Newsworthy Editor/backend"
docker build -t myusername/newsworthy-backend:latest "Newsworthy Editor/backend"
docker push myusername/newsworthy-backend:v1.0.0
docker push myusername/newsworthy-backend:latest
```

---

## Common Commands

### Service Management

```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# Restart services
docker compose restart

# Restart specific service
docker compose restart frontend
docker compose restart backend

# View service status
docker compose ps
```

### Build Management

```bash
# Build images
docker compose build

# Force rebuild (no cache)
docker compose build --no-cache

# Build and start
docker compose up -d --build
```

### Log Management

```bash
# View all logs
docker compose logs

# Real-time log tracking
docker compose logs -f

# View specific service logs
docker compose logs -f frontend
docker compose logs -f backend

# View last 100 lines
docker compose logs --tail=100
```

### Container Operations

```bash
# Enter container
docker compose exec frontend sh
docker compose exec backend sh

# Execute commands
docker compose exec backend node -v
docker compose exec frontend npm list

# View resource usage
docker stats
```

### Cleanup Operations

```bash
# Stop and remove containers, networks
docker compose down

# Stop and remove containers, networks, volumes (⚠️ will delete data)
docker compose down -v

# Clean unused resources
docker system prune

# Clean build cache
docker builder prune
```

---

## Configuration

### Environment Variables

**Backend Environment Variables:**
```yaml
environment:
  - PORT=3001                    # Backend port
  - DB_PATH=/app/data/database.sqlite  # Database path
  - NODE_ENV=production          # Runtime environment
```

**Frontend Environment Variables:**
```yaml
environment:
  - VITE_API_URL=http://localhost:3001  # Backend API URL
```

**Using .env file:**
```env
# .env
BACKEND_PORT=3001
VITE_API_URL=http://localhost:3001
NODE_ENV=production
```

### Data Persistence

**Data Directory:**
```
Newsworthy Editor/backend/data/
└── database.sqlite
```

**Permission Settings (Linux/Mac):**
```bash
chmod -R 755 "Newsworthy Editor/backend/data"
```

### Port Configuration

**Modify Port Mapping:**
```yaml
ports:
  - "3002:3001"  # Change host port to 3002
```

### Network Configuration

Services communicate through Docker network `newsworthy-network`, containers can access each other using service names:
- Frontend accessing backend: `http://backend:3001`
- Host access: Use `localhost` and mapped ports

---

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

**Error:** `bind: address already in use`

**Solution:**
```bash
# Windows: Find process using port
netstat -ano | findstr :3001

# Linux/Mac: Find process using port
lsof -i :3001

# Modify port mapping in docker-compose.yml
ports:
  - "3002:3001"  # Use different port
```

#### 2. Database Permission Issues

**Error:** `EACCES: permission denied`

**Solution:**
```bash
# Linux/Mac
chmod -R 755 "Newsworthy Editor/backend/data"
# or
chmod -R 777 "Newsworthy Editor/backend/data"
```

#### 3. Container Won't Start

**Check Steps:**
```bash
# 1. View detailed logs
docker compose logs backend

# 2. Check if image exists
docker images | grep newsworthy

# 3. Verify configuration
docker compose config

# 4. Try running manually
docker run -it --rm <image-name> sh
```

#### 4. Health Check Failed

**Solution:**
```bash
# Check health check endpoint
docker compose exec backend curl http://localhost:3001/api/health

# View service logs
docker compose logs backend

# Temporarily disable health check (for debugging)
# Comment out healthcheck section in docker-compose.yml
```

#### 5. Frontend Cannot Connect to Backend

**Check Steps:**
```bash
# 1. Check if backend is running
docker compose ps backend

# 2. Check network connection
docker compose exec frontend ping backend

# 3. Check environment variables
docker compose exec frontend env | grep VITE_API_URL

# 4. View backend logs
docker compose logs backend
```

#### 6. Hot Reload Not Working

**Solution:**
```bash
# 1. Check volume mount
docker compose exec frontend ls -la /app/src

# 2. Restart frontend service
docker compose restart frontend

# 3. View Vite logs
docker compose logs frontend | grep -i vite
```

#### 7. Image Build Failed

**Solution:**
```bash
# 1. Clean build cache
docker builder prune

# 2. Force rebuild
docker compose build --no-cache

# 3. View detailed build logs
docker compose build --progress=plain
```

#### 8. Insufficient Disk Space

**Solution:**
```bash
# View Docker disk usage
docker system df

# Clean unused resources
docker system prune -a

# Clean unused volumes
docker volume prune
```

#### 9. Docker Hub Push Failed

**Error:** `push access denied, repository does not exist or may require authorization`

**Solution Steps:**

1. **Check Username Configuration**
   ```bash
   # Make sure in build-and-push.bat or build-and-push.sh
   # Replace 'your-username' with your actual Docker Hub username
   ```

2. **Login to Docker Hub**
   ```bash
   docker login
   # Enter your Docker Hub username and password
   ```

3. **Verify Login Status**
   ```bash
   docker info | grep Username
   # Should display your username
   ```

4. **Create Repository (if needed)**
   - Visit https://hub.docker.com/repositories
   - Create `newsworthy-backend` and `newsworthy-frontend` repositories
   - Or use private repositories

5. **Check Permissions**
   - Ensure you have push permissions
   - If it's an organization repository, ensure you're a member with push permissions

6. **Manual Test Push**
   ```bash
   # First build image
   docker build -t your-username/newsworthy-backend:test "Newsworthy Editor/backend"
   
   # Try pushing
   docker push your-username/newsworthy-backend:test
   ```

**Common Errors and Fixes:**

1. **`push access denied, repository does not exist or may require authorization`**
   - **Cause:** Not logged in or username configuration error
   - **Fix:**
     ```bash
     # 1. Check username configuration in script
     # Edit build-and-push.bat or build-and-push.sh, ensure username is correct
     
     # 2. Re-login
     docker logout
     docker login
     
     # 3. Verify login
     docker info | grep Username  # Linux/Mac
     docker info | findstr Username  # Windows
     ```

2. **`insufficient_scope: authorization failed`**
   - **Cause:** Authentication token expired or insufficient permissions
   - **Fix:**
     ```bash
     # Use Personal Access Token (recommended)
     # 1. Visit https://hub.docker.com/settings/security
     # 2. Create new Access Token
     # 3. Use token as password to login
     docker login
     ```

3. **`repository does not exist`**
   - **Cause:** Repository doesn't exist
   - **Fix:**
     - Docker Hub will automatically create repository on first push (requires verified account)
     - Or manually create: Visit https://hub.docker.com/repositories to create repository

4. **`unauthorized: authentication required`**
   - **Cause:** Incorrect username or password
   - **Fix:**
     ```bash
     docker logout
     docker login
     # Enter correct username and password (or access token)
     ```

5. **How to Check if Image Tags are Correct**
   ```bash
   # View local images
   docker images | grep newsworthy
   
   # Should display something like:
   # your-username/newsworthy-backend    latest    abc123def456    ...
   ```

### Debugging Tips

```bash
# Verify configuration
docker compose config

# View container details
docker inspect newsworthy-backend

# Enter container for debugging
docker compose exec backend sh
cd /app
node server.js  # Manually run to see errors

# Check environment variables
docker compose exec backend env
```

---

## Quick Reference

### Mode Comparison

| Feature | Development Mode | Production Mode |
|---------|-----------------|-----------------|
| Frontend Service | Vite Dev Server | Nginx |
| Frontend Port | 5173 | 80 |
| Source Mount | ✅ Yes | ❌ No |
| Hot Reload | ✅ Supported | ❌ Not Supported |
| Build Optimization | ❌ No | ✅ Yes |

### Port Mapping

| Service | Container Port | Host Port (Dev) | Host Port (Prod) |
|---------|---------------|-----------------|------------------|
| Frontend | 5173 / 80 | 5173 | 80 |
| Backend | 3001 | 3001 | 3001 |

### File Structure

```
.
├── docker-compose.yml              # Development environment config
├── docker-compose.prod.yml         # Production environment config
├── docker-compose.hub.yml          # Docker Hub pull config
├── docker-start.bat / .sh          # Start development environment script
├── docker-stop.bat / .sh           # Stop services script (supports dev/prod/hub)
├── docker-pull-start.bat / .sh     # Pull from Docker Hub and start script
├── build-and-push.sh / .bat        # Docker Hub build and push script
│
└── Newsworthy Editor/
    ├── Dockerfile                  # Frontend Dockerfile
    └── backend/
        ├── Dockerfile              # Backend Dockerfile
        └── data/                   # Data directory (persistent)
            └── database.sqlite
```

---

## Best Practices

### Development Environment

1. Use development mode for daily development
2. Frontend automatically hot reloads after code changes
3. Backend code changes require container restart
4. Regularly check logs to ensure services are running properly

### Production Environment

1. Use production mode for deployment
2. Configure HTTPS (using reverse proxy)
3. Set resource limits
4. Regularly backup database
5. Monitor service health status

### Docker Hub

1. Use semantic versioning
2. Push both `latest` and version tags
3. Regularly update base images
4. Use automation scripts to simplify workflow

### Security Recommendations

1. Don't hardcode sensitive information in code
2. Use environment variables or Docker Secrets
3. Regularly update base images
4. Limit resource usage
5. Configure firewall rules

---

## Related Resources

- [Docker Official Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Dockerfile Best Practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)

---

**Last Updated:** January 2025

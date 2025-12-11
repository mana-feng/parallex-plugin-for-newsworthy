# Guide to Pulling and Using Images from Docker Hub

This guide explains how to pull and use images that have been pushed to Docker Hub on other computers.

## 📋 Prerequisites

### 1. Install Docker

**Windows/Mac:**
- Download and install [Docker Desktop](https://www.docker.com/products/docker-desktop)

**Linux:**
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt-get update
sudo apt-get install docker-compose-plugin
```

### 2. Verify Installation

```bash
docker --version
docker compose version
```

### 3. Start Docker

Ensure Docker Desktop (Windows/Mac) or Docker service (Linux) is running.

---

## 🚀 Quick Start (Recommended Method)

### Method 1: Using Convenience Script (Simplest)

#### Windows

1. **Download Project Files**
   - Download `docker-compose.hub.yml` and `docker-pull-start.bat` to your computer

2. **Configure Username**
   - Edit `docker-pull-start.bat`, find this line:
     ```batch
     set DOCKERHUB_USERNAME=manafeng
     ```
   - If the username is different, replace with the actual Docker Hub username

3. **Run Script**
   ```bash
   docker-pull-start.bat
   ```

#### Linux/Mac

1. **Download Project Files**
   ```bash
   # Download docker-compose.hub.yml and docker-pull-start.sh
   ```

2. **Configure Username**
   - Edit `docker-pull-start.sh`, find this line:
     ```bash
     DOCKERHUB_USERNAME="manafeng"
     ```
   - If the username is different, replace with the actual Docker Hub username

3. **Run Script**
   ```bash
   chmod +x docker-pull-start.sh
   ./docker-pull-start.sh
   ```

### Method 2: Using Docker Compose (Manual)

#### Step 1: Configure docker-compose.hub.yml

Edit `docker-compose.hub.yml`, replace all `<your-dockerhub-username>` with the actual Docker Hub username:

```yaml
services:
  backend:
    image: manafeng/newsworthy-backend:latest  # Replace here
    # ...
  frontend:
    image: manafeng/newsworthy-frontend:latest  # Replace here
    # ...
```

#### Step 2: Pull and Start

```bash
# Pull images and start services
docker compose -f docker-compose.hub.yml up -d

# View logs
docker compose -f docker-compose.hub.yml logs -f

# Stop services
docker compose -f docker-compose.hub.yml down
```

---

## 📥 Manual Image Pull

If you only need to pull images without immediately running them:

```bash
# Pull backend image
docker pull manafeng/newsworthy-backend:latest

# Pull frontend image
docker pull manafeng/newsworthy-frontend:latest

# View pulled images
docker images | grep newsworthy
```

---

## 🖥️ Running Containers

### Using Docker Compose (Recommended)

```bash
# Start all services
docker compose -f docker-compose.hub.yml up -d

# View running status
docker compose -f docker-compose.hub.yml ps

# View logs
docker compose -f docker-compose.hub.yml logs -f

# Stop services
docker compose -f docker-compose.hub.yml down
```

### Manual Container Run

#### Run Backend

```bash
docker run -d \
  --name newsworthy-backend \
  -p 3001:3001 \
  -e PORT=3001 \
  -e DB_PATH=/app/data/database.sqlite \
  -e NODE_ENV=production \
  -v "$(pwd)/data:/app/data" \
  manafeng/newsworthy-backend:latest
```

#### Run Frontend

```bash
docker run -d \
  --name newsworthy-frontend \
  -p 80:80 \
  --link newsworthy-backend:backend \
  manafeng/newsworthy-frontend:latest
```

---

## 🌐 Access Application

After successful startup, access:

- **Frontend**: http://localhost (production mode) or http://localhost:5173 (development mode)
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health

---

## 📦 Using Specific Versions

If you want to use a specific version instead of `latest`:

### Method 1: Modify docker-compose.hub.yml

```yaml
services:
  backend:
    image: manafeng/newsworthy-backend:v1.0.0  # Specify version
    # ...
  frontend:
    image: manafeng/newsworthy-frontend:v1.0.0  # Specify version
    # ...
```

### Method 2: Using Environment Variables

```bash
# Set version
export VERSION=v1.0.0

# Pull specific version
docker pull manafeng/newsworthy-backend:$VERSION
docker pull manafeng/newsworthy-frontend:$VERSION
```

---

## 🔐 Private Repositories

If your images are private, you need to login first:

```bash
# Login to Docker Hub
docker login

# Enter username and password (or access token)
```

Then follow the steps above to pull and run.

---

## 📁 Data Persistence

The default configuration saves database files in:

```
./Newsworthy Editor/backend/data
```

**Important:** Ensure this directory exists, otherwise the container may not start.

```bash
# Create data directory
mkdir -p "Newsworthy Editor/backend/data"
```

---

## 🔄 Updating Images

When new versions are pushed:

```bash
# Stop current services
docker compose -f docker-compose.hub.yml down

# Pull latest images
docker pull manafeng/newsworthy-backend:latest
docker pull manafeng/newsworthy-frontend:latest

# Or directly restart (will automatically pull latest version)
docker compose -f docker-compose.hub.yml pull
docker compose -f docker-compose.hub.yml up -d
```

---

## 🛠️ Common Commands

### View Images

```bash
# View all Newsworthy images
docker images | grep newsworthy

# View image details
docker inspect manafeng/newsworthy-backend:latest
```

### View Containers

```bash
# View running containers
docker ps

# View all containers (including stopped)
docker ps -a

# View container logs
docker logs newsworthy-backend
docker logs newsworthy-frontend
```

### Container Management

```bash
# Restart container
docker restart newsworthy-backend

# Stop container
docker stop newsworthy-backend

# Delete container
docker rm newsworthy-backend

# Enter container (for debugging)
docker exec -it newsworthy-backend sh
```

### Cleanup

```bash
# Delete unused images
docker image prune -a

# Delete all Newsworthy related images
docker images | grep newsworthy | awk '{print $3}' | xargs docker rmi
```

---

## ❓ Troubleshooting

### Issue 1: Pull Failed - Image Does Not Exist

**Error Message:**
```
Error response from daemon: pull access denied, repository does not exist
```

**Solution:**
1. Check if Docker Hub username is correct
2. Confirm images have been successfully pushed to Docker Hub
3. Visit https://hub.docker.com/r/your-username/newsworthy-backend to verify image exists

### Issue 2: Pull Failed - Authentication Required

**Error Message:**
```
Error response from daemon: unauthorized: authentication required
```

**Solution:**
```bash
docker login
# Enter Docker Hub username and password
```

### Issue 3: Port Already in Use

**Error Message:**
```
Error: bind: address already in use
```

**Solution:**
```bash
# Check port usage
# Windows
netstat -ano | findstr :3001
netstat -ano | findstr :80

# Linux/Mac
lsof -i :3001
lsof -i :80

# Modify port mapping in docker-compose.hub.yml
ports:
  - "3002:3001"  # Change to different port
```

### Issue 4: Container Won't Start

**Check:**
```bash
# View container logs
docker logs newsworthy-backend
docker logs newsworthy-frontend

# Check container status
docker ps -a

# Check data directory permissions
ls -la "Newsworthy Editor/backend/data"
```

### Issue 5: Network Connection Issues

**Check:**
```bash
# Test backend health check
curl http://localhost:3001/api/health

# Check container network
docker network ls
docker network inspect newsworthy-network
```

---

## 📚 Related Documentation

- [DOCKER.md](./DOCKER.md) - Complete Docker deployment guide

---

## 💡 Tips

1. **First pull may be slow**: Image files are large, please be patient
2. **Use domestic mirror sources**: If pull speed is slow, you can configure Docker mirror accelerator
3. **Regular updates**: Use `docker compose pull` to get latest version
4. **Backup data**: Regularly backup `backend/data` directory

---

**Need help?** Check logs or contact project maintainer.

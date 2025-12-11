# Project Files Overview

This document explains the purpose and usage of all files in the project root directory.

## 📁 File Categories

### 🐳 Docker Related Files

#### Docker Compose Configuration Files

| File | Purpose | Description |
|------|---------|-------------|
| `docker-compose.yml` | Development environment config | For local development, supports hot reload |
| `docker-compose.prod.yml` | Production environment config | For production deployment, optimized build |
| `docker-compose.hub.yml` | Docker Hub config | For pulling images from Docker Hub to run |

#### Docker Script Files

| File | Platform | Purpose |
|------|----------|---------|
| `docker-start.bat` | Windows | Start development environment (build and run) |
| `docker-start.sh` | Linux/Mac | Start development environment (build and run) |
| `docker-stop.bat` | Windows | Stop Docker services (supports dev/prod/hub modes) |
| `docker-stop.sh` | Linux/Mac | Stop Docker services (supports dev/prod/hub modes) |
| `docker-pull-start.bat` | Windows | Pull images from Docker Hub and start |
| `docker-pull-start.sh` | Linux/Mac | Pull images from Docker Hub and start |
| `build-and-push.bat` | Windows | Build images and push to Docker Hub |
| `build-and-push.sh` | Linux/Mac | Build images and push to Docker Hub |

**Usage Examples:**
```bash
# Development environment
docker-start.bat          # Windows
./docker-start.sh         # Linux/Mac
docker-stop.bat           # Stop

# Production environment
docker compose -f docker-compose.prod.yml up -d
docker-stop.bat prod      # Stop production environment

# Docker Hub
docker-pull-start.bat     # Pull and start
docker-stop.bat hub       # Stop
```

### 📚 Documentation Files

| File | Content |
|------|---------|
| `README.md` | Main project documentation (English), includes quick start, feature descriptions, etc. |
| `README-CN.md` | Main project documentation (Chinese), complete usage guide |
| `PROJECT_DOCUMENTATION.md` | Project technical documentation, includes API endpoints (with detailed request/response examples), architecture, and other detailed information |
| `DOCKER.md` | Complete Docker deployment guide, includes development, production, Docker Hub deployment |
| `DOCKER-HUB-PULL.md` | Detailed guide for pulling and using images from Docker Hub |
| `FILES-OVERVIEW.md` | This file, project files overview |

### 🚀 Non-Docker Startup Scripts

| File | Platform | Purpose |
|------|----------|---------|
| `start-servers.bat` | Windows | Without Docker, directly start Node.js services (for development) |
| `start-servers.sh` | Linux/Mac | Without Docker, directly start Node.js services (for development) |
| `stop-servers.bat` | Windows | Stop non-Docker mode services |
| `stop-servers.sh` | Linux/Mac | Stop non-Docker mode services |

**Use Cases:**
- Need quick development and debugging
- Don't want to use Docker
- Need direct access to source code

---

## 🎯 Quick Selection Guide

### I want to...

#### Develop Locally
- **Recommended**: `docker-start.bat` / `docker-start.sh` (Docker development mode)
- **Alternative**: `start-servers.bat` / `start-servers.sh` (Directly run Node.js)

#### Deploy to Production
- **Recommended**: `docker compose -f docker-compose.prod.yml up -d`
- Or use `docker-compose.prod.yml` configuration

#### Use on Other Computers (images already pushed)
- **Recommended**: `docker-pull-start.bat` / `docker-pull-start.sh`
- Need to download `docker-compose.hub.yml` and script files first

#### Build and Push Images to Docker Hub
- **Use**: `build-and-push.bat` / `build-and-push.sh`
- Need to configure Docker Hub username first

#### Stop Services
- **Docker mode**: `docker-stop.bat [dev|prod|hub]`
- **Non-Docker mode**: `stop-servers.bat`

---

## 📋 File Inventory

### Required Files (Core Functionality)

```
✅ docker-compose.yml              # Docker development environment
✅ docker-compose.prod.yml         # Docker production environment
✅ docker-compose.hub.yml          # Docker Hub pull
✅ Newsworthy Editor/              # Project source code
```

### Recommended Files (Convenience Scripts)

```
✅ docker-start.bat / .sh          # Quick start development environment
✅ docker-stop.bat / .sh           # Stop services
✅ docker-pull-start.bat / .sh     # Pull from Hub
✅ build-and-push.bat / .sh        # Build and push
```

### Optional Files (Non-Docker Mode)

```
📦 start-servers.bat / .sh         # Directly run Node.js
📦 stop-servers.bat / .sh          # Stop Node.js services
```

### Documentation Files

```
📚 README.md                       # Project documentation (English)
📚 README-CN.md                    # Project documentation (Chinese)
📚 PROJECT_DOCUMENTATION.md         # Technical documentation (includes API endpoints)
📚 DOCKER.md                       # Complete Docker guide
📚 DOCKER-HUB-PULL.md              # Hub pull guide
📚 FILES-OVERVIEW.md               # This file
```

---

## 🔧 Script Function Comparison

### Startup Scripts

| Script | Docker | Hot Reload | Build | Purpose |
|--------|--------|------------|-------|---------|
| `docker-start.*` | ✅ | ✅ | ✅ | Development environment (recommended) |
| `docker-pull-start.*` | ✅ | ❌ | ❌ | Pull from Hub and run |
| `start-servers.*` | ❌ | ✅ | ❌ | Directly run Node.js |

### Stop Scripts

| Script | Supported Modes | Purpose |
|--------|-----------------|---------|
| `docker-stop.*` | dev/prod/hub | Stop Docker services |
| `stop-servers.*` | - | Stop Node.js processes |

---

## 📝 Notes

1. **First Time Use**:
   - Ensure Docker Desktop (Windows/Mac) or Docker Engine (Linux) is installed
   - Ensure Node.js is installed (if using non-Docker mode)

2. **Docker Hub Usage**:
   - Need to configure username first (in `build-and-push.*` and `docker-pull-start.*`)
   - Need to login: `docker login`

3. **File Paths**:
   - Windows uses backslash `\`
   - Linux/Mac uses forward slash `/`
   - Scripts automatically handle path differences

4. **Data Persistence**:
   - Database files are saved in `Newsworthy Editor/backend/data/`
   - Ensure this directory exists and has write permissions

---

## 🔗 Related Documentation

- [DOCKER.md](./DOCKER.md) - Complete Docker guide
- [DOCKER-HUB-PULL.md](./DOCKER-HUB-PULL.md) - Guide for pulling from Hub
- [README.md](./README.md) - Main project documentation
- [README-CN.md](./README-CN.md) - Main project documentation (Chinese)

---

**Last Updated:** 2025

@echo off
REM Script to pull and start Docker images from Docker Hub (Windows)
REM Usage: docker-pull-start.bat

REM Configuration - Replace with your Docker Hub username
set DOCKERHUB_USERNAME=manafeng

cls
echo ========================================
echo  Newsworthy Editor - Pull from Docker Hub
echo ========================================
echo.
echo Docker Hub Username: %DOCKERHUB_USERNAME%
echo.

REM Check Docker
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker not found
    echo Please install Docker Desktop from https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)
echo [OK] Docker found
echo.

REM Check Docker Compose
docker compose version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker Compose not found
    pause
    exit /b 1
)
echo [OK] Docker Compose found
echo.

REM Check if docker-compose.hub.yml exists
if not exist "docker-compose.hub.yml" (
    echo [ERROR] docker-compose.hub.yml not found
    echo Please ensure you have the docker-compose.hub.yml file in the current directory
    pause
    exit /b 1
)

REM Update docker-compose.hub.yml with username if needed
echo Checking docker-compose.hub.yml configuration...
findstr /C:"%DOCKERHUB_USERNAME%" docker-compose.hub.yml >nul 2>&1
if errorlevel 1 (
    echo Updating docker-compose.hub.yml with username: %DOCKERHUB_USERNAME%
    powershell -Command "(Get-Content docker-compose.hub.yml) -replace 'manafeng', '%DOCKERHUB_USERNAME%' | Set-Content docker-compose.hub.yml"
    if errorlevel 1 (
        echo [WARNING] Failed to auto-update docker-compose.hub.yml
        echo Please manually update docker-compose.hub.yml with username: %DOCKERHUB_USERNAME%
        echo.
    ) else (
        echo [OK] docker-compose.hub.yml updated
        echo.
    )
)

REM Create data directory if it doesn't exist
if not exist "Newsworthy Editor\backend\data" (
    echo Creating data directory...
    mkdir "Newsworthy Editor\backend\data"
)

REM Pull and start services
echo ========================================
echo Pulling images from Docker Hub...
echo ========================================
echo.

docker compose -f docker-compose.hub.yml pull

if errorlevel 1 (
    echo.
    echo [ERROR] Failed to pull images
    echo.
    echo Possible causes:
    echo 1. Not logged in to Docker Hub - Run: docker login
    echo 2. Images do not exist - Check https://hub.docker.com/r/%DOCKERHUB_USERNAME%/newsworthy-backend
    echo 3. Wrong username - Verify your Docker Hub username is correct
    echo 4. Network issues - Check your internet connection
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Starting services...
echo ========================================
echo.

docker compose -f docker-compose.hub.yml up -d

if errorlevel 1 (
    echo [ERROR] Failed to start services
    pause
    exit /b 1
)

echo.
echo ========================================
echo  Services Started!
echo ========================================
echo.
echo Backend:  http://localhost:3001
echo Frontend: http://localhost
echo.
echo To view logs: docker compose -f docker-compose.hub.yml logs -f
echo To stop:      docker compose -f docker-compose.hub.yml down
echo To update:    docker compose -f docker-compose.hub.yml pull && docker compose -f docker-compose.hub.yml up -d
echo.
timeout /t 3 /nobreak >nul
start http://localhost
pause


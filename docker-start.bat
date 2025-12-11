@echo off
cls
echo ========================================
echo  Newsworthy Editor - Docker Start
echo ========================================
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

REM Create data directory if it doesn't exist
if not exist "Newsworthy Editor\backend\data" (
    echo Creating data directory...
    mkdir "Newsworthy Editor\backend\data"
)

REM Build and start services
echo Building and starting services...
docker compose up -d --build

if errorlevel 1 (
    echo [ERROR] Failed to start services
    pause
    exit /b 1
)

echo.
echo ========================================
echo  Services Started!
echo ========================================
echo Backend:  http://localhost:3001
echo Frontend: http://localhost:5173
echo.
echo To view logs: docker compose logs -f
echo To stop:      docker compose down
echo.
timeout /t 3 /nobreak >nul
start http://localhost:5173
pause


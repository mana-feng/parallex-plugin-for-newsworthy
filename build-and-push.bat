@echo off
REM Build and push script for Docker Hub (Windows)
REM Usage: build-and-push.bat [version]
REM Example: build-and-push.bat v1.0.0

REM Configuration - Replace with your Docker Hub username
set DOCKERHUB_USERNAME=manafeng

REM Get version from argument or use 'latest'
set VERSION=%1
if "%VERSION%"=="" set VERSION=latest

echo ========================================
echo Building and Pushing Docker Images
echo ========================================
echo Docker Hub Username: %DOCKERHUB_USERNAME%
echo Version: %VERSION%
echo.

REM Check if username is still placeholder
if "%DOCKERHUB_USERNAME%"=="your-username" (
    echo [ERROR] Please set your Docker Hub username in this script!
    echo Edit build-and-push.bat and replace 'your-username' with your actual Docker Hub username.
    echo.
    pause
    exit /b 1
)

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running. Please start Docker and try again.
    pause
    exit /b 1
)

REM Check if logged in to Docker Hub
docker info | findstr /C:"Username" >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Not logged in to Docker Hub. Please login first.
    echo.
    docker login
    if errorlevel 1 (
        echo [ERROR] Failed to login to Docker Hub
        pause
        exit /b 1
    )
)

echo [1/4] Building backend image...
docker build -t %DOCKERHUB_USERNAME%/newsworthy-backend:%VERSION% "Newsworthy Editor\backend"
if errorlevel 1 (
    echo [ERROR] Failed to build backend image
    pause
    exit /b 1
)

REM Also tag as latest if not already latest
if not "%VERSION%"=="latest" (
    docker tag %DOCKERHUB_USERNAME%/newsworthy-backend:%VERSION% %DOCKERHUB_USERNAME%/newsworthy-backend:latest
)

echo [2/4] Building frontend image (production)...
docker build --target production -t %DOCKERHUB_USERNAME%/newsworthy-frontend:%VERSION% "Newsworthy Editor"
if errorlevel 1 (
    echo [ERROR] Failed to build frontend image
    pause
    exit /b 1
)

REM Also tag as latest if not already latest
if not "%VERSION%"=="latest" (
    docker tag %DOCKERHUB_USERNAME%/newsworthy-frontend:%VERSION% %DOCKERHUB_USERNAME%/newsworthy-frontend:latest
)

echo [3/4] Pushing backend image...
echo Pushing to: %DOCKERHUB_USERNAME%/newsworthy-backend:%VERSION%
docker push %DOCKERHUB_USERNAME%/newsworthy-backend:%VERSION%
if errorlevel 1 (
    echo.
    echo [ERROR] Failed to push backend image
    echo.
    echo Possible causes:
    echo 1. Not logged in to Docker Hub - Run: docker login
    echo 2. Repository does not exist - Create it at https://hub.docker.com/repositories
    echo 3. Insufficient permissions - Check your Docker Hub account
    echo 4. Wrong username - Verify your Docker Hub username is correct
    echo.
    pause
    exit /b 1
)

if not "%VERSION%"=="latest" (
    docker push %DOCKERHUB_USERNAME%/newsworthy-backend:latest
)

echo [4/4] Pushing frontend image...
docker push %DOCKERHUB_USERNAME%/newsworthy-frontend:%VERSION%
if errorlevel 1 (
    echo [ERROR] Failed to push frontend image
    pause
    exit /b 1
)

if not "%VERSION%"=="latest" (
    docker push %DOCKERHUB_USERNAME%/newsworthy-frontend:latest
)

echo.
echo ========================================
echo Success! Images pushed to Docker Hub
echo ========================================
echo Backend:  %DOCKERHUB_USERNAME%/newsworthy-backend:%VERSION%
echo Frontend: %DOCKERHUB_USERNAME%/newsworthy-frontend:%VERSION%
echo.
echo To use these images, update docker-compose.hub.yml with your username
echo and run: docker-compose -f docker-compose.hub.yml up -d
echo.
pause


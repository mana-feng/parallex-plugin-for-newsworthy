@echo off
REM Script to stop Docker services (supports dev, prod, and hub modes)
REM Usage: docker-stop.bat [mode]
REM   mode: dev (default), prod, or hub

set MODE=%1
if "%MODE%"=="" set MODE=dev

echo ========================================
echo  Stopping Docker Services
echo ========================================
echo.

if "%MODE%"=="dev" (
    echo Stopping development services...
    docker compose down
) else if "%MODE%"=="prod" (
    echo Stopping production services...
    docker compose -f docker-compose.prod.yml down
) else if "%MODE%"=="hub" (
    echo Stopping Docker Hub services...
    docker compose -f docker-compose.hub.yml down
) else (
    echo [ERROR] Invalid mode: %MODE%
    echo Usage: docker-stop.bat [dev^|prod^|hub]
    pause
    exit /b 1
)

if errorlevel 1 (
    echo [ERROR] Failed to stop services
    pause
    exit /b 1
)

echo.
echo Services stopped successfully.
echo.
pause


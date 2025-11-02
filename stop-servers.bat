@echo off
REM ================================================================
REM Stop Servers Script - Windows Batch Version
REM Automatically finds and kills processes using ports 5173, 5174, and 3001
REM ================================================================

echo.
echo ====================================
echo   Stop Newsworthy Editor Servers
echo ====================================
echo.

REM Function to kill process on a specific port
REM %1 = port number

:KILL_PORT_5173
echo [1/3] Checking port 5173 (Frontend Vite Dev Server)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173" ^| findstr "LISTENING"') do (
    if not "%%a"=="0" (
        echo   ^> Found process PID: %%a
        taskkill /PID %%a /F >nul 2>&1
        if errorlevel 1 (
            echo   ^> Process %%a already terminated or not found
        ) else (
            echo   ^> Successfully killed PID: %%a
        )
    )
)
echo   ^> Port 5173 cleared

:KILL_PORT_5174
echo.
echo [2/3] Checking port 5174 (Frontend HMR)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5174" ^| findstr "LISTENING"') do (
    if not "%%a"=="0" (
        echo   ^> Found process PID: %%a
        taskkill /PID %%a /F >nul 2>&1
        if errorlevel 1 (
            echo   ^> Process %%a already terminated or not found
        ) else (
            echo   ^> Successfully killed PID: %%a
        )
    )
)
echo   ^> Port 5174 cleared

:KILL_PORT_3001
echo.
echo [3/3] Checking port 3001 (Backend API Server)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001" ^| findstr "LISTENING"') do (
    if not "%%a"=="0" (
        echo   ^> Found process PID: %%a
        taskkill /PID %%a /F >nul 2>&1
        if errorlevel 1 (
            echo   ^> Process %%a already terminated or not found
        ) else (
            echo   ^> Successfully killed PID: %%a
        )
    )
)
echo   ^> Port 3001 cleared

REM ===========================================
REM Extra: Kill Node.js processes by command line
REM (Finds processes started from this project directory)
REM ===========================================

echo.
echo [Extra] Checking for orphaned Node.js processes...

REM Get current directory
set "PROJECT_DIR=%~dp0"
set "PROJECT_DIR=%PROJECT_DIR:~0,-1%"

REM Find Node.js processes with command line containing our project path
for /f "tokens=2" %%a in ('wmic process where "name='node.exe' and commandline like '%%%PROJECT_DIR%%%'" get processid /format:csv 2^>nul ^| findstr /r "[0-9]"') do (
    echo   ^> Found Node.js process in project: %%a
    taskkill /PID %%a /F /T >nul 2>&1
    if not errorlevel 1 (
        echo   ^> Successfully killed PID: %%a
    )
)

echo   ^> Orphaned processes cleaned

REM ===========================================
REM Verification: Double-check ports are free
REM ===========================================

echo.
echo [Verification] Double-checking ports...

set "PORTS_CLEAR=1"

netstat -ano | findstr ":5173" | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 (
    echo   ^> WARNING: Port 5173 still in use!
    set "PORTS_CLEAR=0"
) else (
    echo   ^> Port 5173: FREE
)

netstat -ano | findstr ":5174" | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 (
    echo   ^> WARNING: Port 5174 still in use!
    set "PORTS_CLEAR=0"
) else (
    echo   ^> Port 5174: FREE
)

netstat -ano | findstr ":3001" | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 (
    echo   ^> WARNING: Port 3001 still in use!
    set "PORTS_CLEAR=0"
) else (
    echo   ^> Port 3001: FREE
)

echo.
if "%PORTS_CLEAR%"=="1" (
    echo ====================================
    echo   All servers stopped successfully!
    echo ====================================
    echo.
    echo All ports are free. You can now start fresh servers.
) else (
    echo ====================================
    echo   WARNING: Some ports still in use
    echo ====================================
    echo.
    echo Some ports are still occupied. You may need to:
    echo 1. Close browser tabs connected to localhost:5173
    echo 2. Manually kill processes using Task Manager
    echo 3. Restart your computer as a last resort
)

echo.
echo You can start fresh servers with start-servers.bat
echo.

pause


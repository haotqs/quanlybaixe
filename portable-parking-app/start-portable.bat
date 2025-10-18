@echo off
echo Starting Vehicle Parking Management System...
echo.
echo Checking Node.js...

REM Check if Node.js exists
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed on this machine!
    echo Please install Node.js from https://nodejs.org/
    echo Press any key to open download page...
    pause >nul
    start https://nodejs.org/
    exit /b 1
)

echo Node.js found: 
node --version

REM Check if we're in the right directory
if not exist "server.js" (
    echo ERROR: server.js not found!
    echo Please make sure you're running this from the correct directory.
    pause
    exit /b 1
)

echo.
echo Starting server on port 8088...
echo Open your browser and go to: http://localhost:8088
echo Press Ctrl+C to stop the server
echo.

node server.js

pause

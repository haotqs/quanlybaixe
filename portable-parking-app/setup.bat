@echo off
echo Vehicle Parking Management - Setup Dependencies
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js not found. Installing dependencies...
    npm install
) else (
    echo Node.js found. Checking dependencies...
    if not exist "node_modules" (
        echo Installing npm dependencies...
        npm install
    ) else (
        echo Dependencies already installed.
    )
)

echo.
echo Setup complete! You can now run start-portable.bat
pause

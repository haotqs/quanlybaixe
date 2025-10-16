@echo off
echo ========================================
echo    QUAN LY BAI XE - PARKING MANAGEMENT
echo ========================================
echo.
echo Dang khoi dong ung dung...
echo Starting application...
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js chua duoc cai dat tren may tinh nay!
    echo Please install Node.js from https://nodejs.org
    echo.
    pause
    exit /b 1
)

REM Start the application
echo Khoi dong server...
echo Server dang chay tai: http://localhost:8088
echo.
echo De dung ung dung, mo trinh duyet web va truy cap:
echo http://localhost:8088
echo.
echo Nhan Ctrl+C de dung ung dung
echo ========================================
echo.

node server.js

pause

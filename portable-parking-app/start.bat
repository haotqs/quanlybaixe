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

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ========================================
    echo   CAN CAI DAT NODE.JS
    echo ========================================
    echo.
    echo Node.js chua duoc cai dat tren may tinh nay!
    echo Vui long tai va cai dat Node.js tu: https://nodejs.org
    echo.
    echo Sau khi cai dat xong, chay lai file nay.
    echo.
    pause
    exit /b 1
)

REM Check if required files exist
if not exist "server.js" (
    echo ERROR: Thieu file server.js
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo.
    echo Thu muc node_modules khong ton tai!
    echo Dang tu dong cai dat dependencies...
    echo.
    echo ========================================
    echo   INSTALLING DEPENDENCIES
    echo ========================================
    echo.
    echo Vui long cho doi, qua trinh nay co the mat vai phut...
    
    npm install
    
    if errorlevel 1 (
        echo.
        echo ERROR: Khong the cai dat dependencies!
        echo Vui long kiem tra:
        echo 1. Ket noi internet
        echo 2. Node.js da duoc cai dat dung cach
        echo.
        pause
        exit /b 1
    )
    
    echo.
    echo ✅ Dependencies da duoc cai dat thanh cong!
    echo.
)

REM Start the application
cls
echo ========================================
echo   QUAN LY BAI XE - PARKING MANAGEMENT
echo ========================================
echo.
echo Dang khoi dong server...
echo.

REM Start server in background
echo Starting server at http://localhost:8088
start /b node server.js

REM Wait for server to fully start
echo Waiting for server to start...
timeout /t 4 /nobreak >nul

REM Auto-open browser
echo Opening browser automatically...
start http://localhost:8088

REM Show status and keep running
echo.
echo ========================================
echo   SERVER IS RUNNING
echo ========================================
echo.
echo ✅ Server: http://localhost:8088
echo ✅ Browser opened automatically
echo.
echo If browser didn't open, please visit: http://localhost:8088 manually
echo.
echo Press any key to STOP the server and close this application...
pause >nul

REM Clean shutdown
echo.
echo Stopping server...
taskkill /f /im node.exe >nul 2>&1
echo Server stopped. Thank you for using Parking Management System!
timeout /t 2 >nul

REM Start server in background and auto-open browser after delay
start /b node server.js

REM Wait for server to start (3 seconds)
timeout /t 3 /nobreak >nul

REM Auto-open browser
echo Mo trinh duyet tu dong...
start http://localhost:8088

REM Keep the window open and show server status
echo.
echo ========================================
echo SERVER DANG CHAY
echo ========================================
echo Browser da duoc mo tu dong
echo Neu browser khong mo, vui long mo thu cong: http://localhost:8088
echo.
echo Nhan bat ki phim nao de dong server...
pause >nul

REM Kill node process when user closes
taskkill /f /im node.exe >nul 2>&1

pause

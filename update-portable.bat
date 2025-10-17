@echo off
echo ========================================
echo    UPDATING PORTABLE APP
echo ========================================
echo.

REM Check if we're in the right directory
if not exist "server.js" (
    echo ERROR: Phai chay script nay o thu muc goc chua file server.js
    echo Please run this script in the root directory containing server.js
    pause
    exit /b 1
)

echo Dang update portable app...
echo.

REM Copy main files
echo Copying server.js...
copy /Y server.js portable-parking-app\ >nul

echo Copying package.json...
copy /Y package.json portable-parking-app\ >nul

REM Copy public files
echo Copying public files...
copy /Y public\*.* portable-parking-app\public\ >nul

REM Copy template if exists
if exist "public\template.xlsx" (
    echo Copying Excel template...
    copy /Y public\template.xlsx portable-parking-app\public\ >nul
)

REM Copy documentation files
echo Copying documentation...
if exist "portable-parking-app\HUONG-DAN.md" (
    echo User guide already exists
) else (
    echo Creating user guide...
)

REM Copy node_modules if exists (optional for faster startup)
echo Checking for node_modules...
if exist node_modules (
    echo Copying node_modules... (This may take a while)
    rmdir /s /q portable-parking-app\node_modules 2>nul
    xcopy /E /I /Q node_modules portable-parking-app\node_modules >nul
    echo ✅ Dependencies copied - app will start faster!
) else (
    echo ⚠️  node_modules not found - will auto-install on first run
    echo This is OK, start.bat will handle npm install automatically
)

echo.
echo ========================================
echo Update completed successfully!
echo ========================================
echo.
echo Ban co the chay portable app bang cach:
echo 1. Vao thu muc portable-parking-app
echo 2. Double-click start.bat
echo.
echo Test app ngay bay gio...
echo.
cd portable-parking-app
start "" "start.bat"
cd ..

pause

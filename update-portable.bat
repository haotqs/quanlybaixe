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

REM Check if package.json was modified (simple check)
echo.
set /p updateDeps="Co can update dependencies khong? (y/N): "
if /i "%updateDeps%"=="y" (
    echo Copying node_modules... (This may take a while)
    if exist node_modules (
        rmdir /s /q portable-parking-app\node_modules 2>nul
        xcopy /E /I /Q node_modules portable-parking-app\node_modules >nul
        echo Dependencies updated!
    ) else (
        echo node_modules not found, please run 'npm install' first
    )
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
echo Hoac test ngay bay gio?
set /p testNow="Test app ngay bay gio? (Y/n): "
if /i not "%testNow%"=="n" (
    cd portable-parking-app
    start "" cmd /c "start.bat"
    cd ..
)

pause

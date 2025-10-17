#!/bin/bash
echo "========================================"
echo "    UPDATING PORTABLE APP"
echo "========================================"
echo

# Check if we're in the right directory
if [ ! -f "server.js" ]; then
    echo "ERROR: Phải chạy script này ở thư mục gốc chứa file server.js"
    echo "Please run this script in the root directory containing server.js"
    exit 1
fi

echo "Đang update portable app..."
echo

# Copy main files
echo "Copying server.js..."
cp server.js portable-parking-app/

echo "Copying package.json..."
cp package.json portable-parking-app/

# Copy public files
echo "Copying public files..."
cp public/* portable-parking-app/public/ 2>/dev/null || true

# Copy template if exists
if [ -f "public/template.xlsx" ]; then
    echo "Copying Excel template..."
    cp public/template.xlsx portable-parking-app/public/
fi

# Ask about dependencies
echo
read -p "Có cần update dependencies không? (y/N): " updateDeps
if [[ $updateDeps =~ ^[Yy]$ ]]; then
    echo "Copying node_modules... (This may take a while)"
    if [ -d "node_modules" ]; then
        rm -rf portable-parking-app/node_modules 2>/dev/null
        cp -r node_modules portable-parking-app/
        echo "Dependencies updated!"
    else
        echo "node_modules not found, please run 'npm install' first"
    fi
fi

echo
echo "========================================"
echo "Update completed successfully!"
echo "========================================"
echo
echo "Bạn có thể chạy portable app bằng cách:"
echo "1. Vào thư mục portable-parking-app"
echo "2. Chạy ./start.sh (macOS/Linux) hoặc double-click start.bat (Windows)"
echo

read -p "Test app ngay bây giờ? (Y/n): " testNow
if [[ ! $testNow =~ ^[Nn]$ ]]; then
    cd portable-parking-app
    if [[ "$OSTYPE" == "darwin"* ]] || [[ "$OSTYPE" == "linux-gnu"* ]]; then
        ./start.sh &
    else
        cmd.exe /c start.bat &
    fi
    cd ..
fi

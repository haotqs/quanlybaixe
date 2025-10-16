#!/bin/bash

echo "========================================"
echo "   QUẢN LÝ BÃI XE - PARKING MANAGEMENT"
echo "========================================"
echo ""
echo "Đang khởi động ứng dụng..."
echo "Starting application..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js chưa được cài đặt trên máy tính này!"
    echo "Please install Node.js from https://nodejs.org"
    echo ""
    exit 1
fi

# Start the application
echo "Khởi động server..."
echo "Server đang chạy tại: http://localhost:8088"
echo ""
echo "Để dùng ứng dụng, mở trình duyệt web và truy cập:"
echo "http://localhost:8088"
echo ""
echo "Nhấn Ctrl+C để dừng ứng dụng"
echo "========================================"
echo ""

node server.js


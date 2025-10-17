# HƯỚNG DẪN UPDATE CODE CHO PORTABLE APP

## 1. UPDATE CODE THÔNG THƯỜNG (JavaScript, HTML, CSS)

### Cách 1: Sửa trực tiếp trong portable-parking-app
- Mở file cần sửa trong thư mục `portable-parking-app/`
- Thực hiện thay đổi
- Chạy lại `start.bat` để test

### Cách 2: Sửa ở source code chính rồi copy
```bash
# Sửa code ở thư mục gốc, sau đó copy files đã thay đổi
cp server.js portable-parking-app/
cp public/script.js portable-parking-app/public/
cp public/index.html portable-parking-app/public/
cp public/styles.css portable-parking-app/public/
```

## 2. UPDATE KHI THÊM PACKAGE MỚI

### Bước 1: Cài package ở thư mục gốc
```bash
npm install package-name
```

### Bước 2: Copy toàn bộ dependencies
```bash
cp package.json portable-parking-app/
cp -r node_modules portable-parking-app/
```

### Bước 3: Test lại
```bash
cd portable-parking-app
./start.bat  # Windows
./start.sh   # macOS/Linux
```

## 3. SCRIPT TỰ ĐỘNG UPDATE

Tạo file `update-portable.bat` để tự động update:

```bat
@echo off
echo Updating portable app...

REM Copy main files
copy /Y server.js portable-parking-app\
copy /Y package.json portable-parking-app\

REM Copy public files
copy /Y public\*.* portable-parking-app\public\

REM Copy node_modules if package.json changed
if exist node_modules (
    echo Copying node_modules...
    xcopy /E /Y node_modules portable-parking-app\node_modules\
)

echo Update completed!
pause
```

## 4. LƯU Ý QUAN TRỌNG

- ✅ **Chỉ sửa code**: Chạy lại `start.bat` là đủ
- ⚠️ **Thêm package mới**: Phải copy `node_modules` và `package.json`
- 🔄 **Database**: File `parking_management.db` sẽ được tạo tự động nếu chưa có
- 📁 **Template**: Nếu sửa template Excel, copy file `template.xlsx` vào `portable-parking-app/public/`

## 5. CHECKLIST UPDATE

- [ ] Code đã được sửa đổi
- [ ] Files đã được copy vào portable-parking-app (nếu cần)
- [ ] Dependencies đã được update (nếu có package mới)
- [ ] Test chạy `start.bat` thành công
- [ ] Kiểm tra chức năng trên browser http://localhost:8088

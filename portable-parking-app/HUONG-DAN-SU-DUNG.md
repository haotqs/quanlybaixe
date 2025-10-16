# 🚗 Ứng Dụng Quản Lý Bãi Xe Portable

## 📋 Hướng Dẫn Sử Dụng

### 🖥️ **Windows:**
1. Double-click vào file `start.bat`
2. Ứng dụng sẽ khởi động và mở trình duyệt
3. Truy cập: http://localhost:8088

### 🍎 **macOS/Linux:**
1. Double-click vào file `start.sh` hoặc mở Terminal và chạy:
   ```bash
   ./start.sh
   ```
2. Truy cập: http://localhost:8088

## ⚙️ **Yêu Cầu Hệ Thống:**
- Node.js phiên bản 14 hoặc cao hơn
- Trình duyệt web (Chrome, Firefox, Safari, Edge)

## 📁 **Cấu Trúc Thư Mục:**
- `server.js` - File chính của ứng dụng
- `public/` - Giao diện web và template Excel
- `node_modules/` - Thư viện phụ thuộc
- `start.bat` - Script khởi chạy cho Windows
- `start.sh` - Script khởi chạy cho macOS/Linux

## 🔧 **Tính Năng:**
- ➕ Thêm xe vào bãi (theo giờ/theo tháng)
- 📝 Quản lý thông tin xe
- 🚪 Xe ra bãi và tính tiền
- 📊 Xuất báo cáo Excel
- 📥 Import dữ liệu từ Excel
- 💰 Theo dõi thanh toán hàng tháng

## 🚫 **Dừng Ứng Dụng:**
Nhấn `Ctrl + C` trong cửa sổ console để dừng server.

## 📞 **Hỗ Trợ:**
Nếu gặp vấn đề, hãy đảm bảo:
1. Node.js đã được cài đặt: https://nodejs.org
2. Port 8088 chưa được sử dụng bởi ứng dụng khác
3. Chạy ứng dụng với quyền administrator nếu cần thiết

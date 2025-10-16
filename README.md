# 🚗 Vehicle Parking Management System

A comprehensive parking management system built with Node.js, Express, and SQLite for managing both monthly and hourly vehicle parking.

## ✨ Tính năng

- ➕ **Thêm xe vào bãi**: Ghi nhận thông tin xe khi vào bãi (biển số, loại xe, chủ xe, SDT)
- 📝 **Quản lý thông tin**: Sửa đổi thông tin xe đã đăng ký
- 🚪 **Xe ra bãi**: Ghi nhận thời gian ra và tính tiền
- 🔍 **Tìm kiếm & lọc**: Tìm kiếm theo biển số, tên chủ xe và lọc theo trạng thái
- 📊 **Theo dõi trạng thái**: Phân biệt xe đang trong bãi và đã ra
- 💰 **Quản lý giá tiền**: Tính toán và thu phí đỗ xe
- 📅 **Gửi xe theo tháng**: Đánh dấu xe gửi theo tháng với checkbox
- 🔄 **Xe giờ vào ra nhiều lần**: Xe gửi theo giờ có thể vào ra không giới hạn
- 📜 **Lưu lịch sử**: Tất cả lần vào ra đều được lưu vào database
- 📤 **Export Excel**: Xuất danh sách xe gửi tháng ra file Excel
- 📥 **Import Excel**: Nhập dữ liệu xe gửi tháng từ file Excel

## 🛠️ Công nghệ sử dụng

- **Backend**: Node.js + Express.js
- **Database**: SQLite (cơ sở dữ liệu local)
- **Frontend**: HTML5 + CSS3 + Vanilla JavaScript
- **UI**: Responsive design, thân thiện với mobile

## 📋 Yêu cầu hệ thống

- Node.js (version 14 trở lên)
- npm hoặc yarn

## 🚀 Cài đặt và chạy

1. **Clone/Download project** và di chuyển vào thư mục:
   ```bash
   cd vehicle-parking-management
   ```

2. **Cài đặt dependencies**:
   ```bash
   npm install
   ```

3. **Chạy ứng dụng**:
   ```bash
   npm start
   ```

4. **Mở trình duyệt** tại địa chỉ: `http://localhost:3000`

## 📊 Cấu trúc Database

### Bảng `vehicles` (Records hiện tại)
| Cột | Kiểu dữ liệu | Mô tả |
|-----|-------------|-------|
| id | INTEGER | Khóa chính (auto increment) |
| license_plate | TEXT | Biển số xe (unique chỉ với xe tháng) |
| vehicle_type | TEXT | Loại xe (xe máy, ô tô, xe đạp, xe tải) |
| owner_name | TEXT | Tên chủ xe |
| phone | TEXT | Số điện thoại |
| entry_date | DATETIME | Thời gian vào bãi |
| exit_date | DATETIME | Thời gian ra bãi (null nếu chưa ra) |
| price | DECIMAL | Số tiền (VNĐ) |
| status | TEXT | Trạng thái: 'IN' (trong bãi) / 'OUT' (đã ra) |
| monthly_parking | BOOLEAN | Gửi xe theo tháng: 1 (có) / 0 (không) |

### Bảng `vehicle_history` (Lịch sử tất cả lần vào ra)
| Cột | Kiểu dữ liệu | Mô tả |
|-----|-------------|-------|
| id | INTEGER | Khóa chính (auto increment) |
| license_plate | TEXT | Biển số xe |
| vehicle_type | TEXT | Loại xe |
| owner_name | TEXT | Tên chủ xe |
| phone | TEXT | Số điện thoại |
| entry_date | DATETIME | Thời gian vào bãi |
| exit_date | DATETIME | Thời gian ra bãi |
| price | DECIMAL | Số tiền đã thu |
| monthly_parking | BOOLEAN | Loại gửi xe |
| created_at | DATETIME | Thời gian tạo record |

## 🔌 API Endpoints

### Lấy danh sách xe
```
GET /api/vehicles
```

### Lấy thông tin một xe
```
GET /api/vehicles/:id
```

### Thêm xe mới
```
POST /api/vehicles
Content-Type: application/json

{
  "license_plate": "29A-12345",
  "vehicle_type": "Xe máy", 
  "owner_name": "Nguyễn Văn A",
  "phone": "0901234567",
  "price": 5000,
  "monthly_parking": true
}
```

### Cập nhật thông tin xe
```
PUT /api/vehicles/:id
Content-Type: application/json

{
  "exit_date": "2024-01-01T10:30:00.000Z",
  "price": 10000,
  "status": "OUT"
}
```

### Lấy lịch sử tất cả xe
```
GET /api/history
```

### Lấy lịch sử theo biển số
```
GET /api/history/:license_plate
```

### Xuất Excel xe gửi tháng
```
GET /api/export/monthly
```

## 📱 Giao diện người dùng

- **Form thêm xe**: Nhập thông tin xe vào bãi
- **Bảng danh sách**: Hiển thị tất cả xe với đầy đủ thông tin
- **Tìm kiếm**: Tìm theo biển số hoặc tên chủ xe
- **Lọc trạng thái**: Chỉ hiển thị xe trong bãi hoặc đã ra
- **Thao tác**: Sửa, xe ra bãi, vào lại, xóa

## 🎯 Hướng dẫn sử dụng

1. **Thêm xe vào bãi**: Điền form và click "Thêm Xe"
2. **Xe ra bãi**: Click nút "Xe ra" → nhập số tiền → xác nhận
3. **Sửa thông tin**: Click nút "Sửa" → chỉnh sửa → click "Cập nhật"
4. **Tìm kiếm**: Gõ vào ô tìm kiếm để lọc kết quả
5. **Export Excel**: Click "📤 Export Excel" để tải file danh sách xe gửi tháng
6. **Import Excel**: Click "📥 Import Excel" để nhập dữ liệu từ file Excel

## 🔧 Tùy chỉnh

- **Port**: Thay đổi port trong file `server.js` (mặc định: 3000)
- **Database**: File database được tạo tự động: `parking_management.db`
- **Giao diện**: Chỉnh sửa CSS trong `public/styles.css`

## 📝 Lưu ý

- Database SQLite được tạo tự động khi chạy lần đầu
- Dữ liệu được lưu trữ local trong file `.db`
- Ứng dụng hỗ trợ responsive cho mobile
- Biển số xe không được trùng lặp

## 🤝 Đóng góp

Mọi đóng góp đều được chào đón! Hãy tạo issue hoặc pull request.

## 📄 License

ISC License

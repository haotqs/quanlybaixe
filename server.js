const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const xlsx = require('xlsx');
const fileUpload = require('express-fileupload');

const app = express();
const PORT = process.env.PORT || 8088;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload());
app.use(express.static(path.join(__dirname, 'public')));

// Database setup
const dbPath = path.join(__dirname, 'parking_management.db');
const db = new sqlite3.Database(dbPath);

// Initialize database
db.serialize(() => {
    // Main vehicles table (current active records)
    db.run(`CREATE TABLE IF NOT EXISTS vehicles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        license_plate TEXT NOT NULL,
        vehicle_type TEXT NOT NULL,
        owner_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        entry_date DATETIME NOT NULL,
        exit_date DATETIME,
        price DECIMAL(10,2) DEFAULT 0,
        isParking BOOLEAN DEFAULT 1,
        monthly_parking BOOLEAN DEFAULT 0,
        monthly_payments TEXT,
        monthly_paid BOOLEAN DEFAULT 0,
        payment_date DATETIME
    )`);
    
    // Vehicle history table (all entry/exit records)
    db.run(`CREATE TABLE IF NOT EXISTS vehicle_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        license_plate TEXT NOT NULL,
        vehicle_type TEXT NOT NULL,
        owner_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        entry_date DATETIME NOT NULL,
        exit_date DATETIME,
        price DECIMAL(10,2) DEFAULT 0,
        monthly_parking BOOLEAN DEFAULT 0,
        monthly_payments TEXT,
        monthly_paid BOOLEAN DEFAULT 0,
        payment_date DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    // Database tables are now created with all necessary columns from the start
    
    // Add isParking column if it doesn't exist (migration)
    db.run(`ALTER TABLE vehicles ADD COLUMN isParking BOOLEAN DEFAULT 1`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
            console.error('Error adding isParking column to vehicles:', err.message);
        } else {
            console.log('isParking column added or already exists in vehicles table');
        }
    });
    
    // Add isParking column to vehicle_history if it doesn't exist (migration)
    db.run(`ALTER TABLE vehicle_history ADD COLUMN isParking BOOLEAN DEFAULT 1`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
            console.error('Error adding isParking column to vehicle_history:', err.message);
        } else {
            console.log('isParking column added or already exists in vehicle_history table');
        }
    });
    
    // Migrate existing status data to isParking boolean
    db.run(`UPDATE vehicles SET isParking = CASE 
                WHEN status IN ('IN', 'Đang gửi') THEN 1 
                WHEN status IN ('OUT', 'Đã ra') THEN 0 
                ELSE 1 
            END 
            WHERE status IS NOT NULL`, (err) => {
        if (err) {
            console.error('Error migrating status to isParking:', err.message);
        } else {
            console.log('Successfully migrated status data to isParking');
            
            // After migration, drop the status column
            db.run(`ALTER TABLE vehicles DROP COLUMN status`, (dropErr) => {
                if (dropErr && !dropErr.message.includes('no such column')) {
                    console.error('Error dropping status column:', dropErr.message);
                } else {
                    console.log('Status column dropped successfully');
                }
            });
        }
    });
    
    // Create unique index for monthly parking vehicles only
    db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_monthly_license_plate 
            ON vehicles(license_plate) WHERE monthly_parking = 1`, (err) => {
        if (err && !err.message.includes('already exists')) {
            console.error('Error creating unique index:', err.message);
        }
    });
});

// API Routes

// Get all vehicles
app.get('/api/vehicles', (req, res) => {
    db.all('SELECT * FROM vehicles ORDER BY entry_date DESC', (err, rows) => {
        if (err) {
            console.error('Error getting vehicles:', err.message);
            res.status(500).json({ error: err.message });
            return;
        }
        console.log(`API /api/vehicles returning ${rows.length} vehicles`);
        res.json(rows);
    });
});

// Get vehicle by ID
app.get('/api/vehicles/:id', (req, res) => {
    const { id } = req.params;
    db.get('SELECT * FROM vehicles WHERE id = ?', [id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ error: 'Vehicle not found' });
            return;
        }
        res.json(row);
    });
});

// Get vehicle history (for admin/debug purposes)
app.get('/api/history', (req, res) => {
    db.all('SELECT * FROM vehicle_history ORDER BY created_at DESC', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Get history for specific license plate
app.get('/api/history/:license_plate', (req, res) => {
    const { license_plate } = req.params;
    db.all('SELECT * FROM vehicle_history WHERE license_plate = ? ORDER BY created_at DESC', [license_plate], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Export all vehicles to Excel using template
app.get('/api/export/all', (req, res) => {
    // Get monthly vehicles
    db.all('SELECT * FROM vehicles WHERE monthly_parking = 1 ORDER BY entry_date', (err, monthlyVehicles) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        // Get hourly vehicles
        db.all('SELECT * FROM vehicles WHERE monthly_parking = 0 ORDER BY entry_date', (err2, hourlyVehicles) => {
            if (err2) {
                res.status(500).json({ error: err2.message });
                return;
            }
            
            try {
                // Load template file
                const templatePath = path.join(__dirname, 'public', 'template.xlsx');
                let wb;
                
                if (require('fs').existsSync(templatePath)) {
                    console.log('Using template file:', templatePath);
                    wb = xlsx.readFile(templatePath);
                } else {
                    console.log('Template file not found, creating new workbook');
                    wb = xlsx.utils.book_new();
                }
                
                // Process monthly vehicles to match template format
                if (monthlyVehicles.length > 0) {
                    // Get or create monthly sheet
                    let monthlySheet;
                    if (wb.Sheets['Xe gửi tháng']) {
                        monthlySheet = wb.Sheets['Xe gửi tháng'];
                        console.log('Using existing monthly sheet from template');
                    } else {
                        monthlySheet = xlsx.utils.aoa_to_sheet([]);
                        xlsx.utils.book_append_sheet(wb, monthlySheet, 'Xe gửi tháng');
                        console.log('Created new monthly sheet');
                    }
                    
                    // Fill data starting from row 5 (index 4) to match template
                    monthlyVehicles.forEach((vehicle, index) => {
                        const rowIndex = 4 + index; // Start from row 5 (0-based index 4)
                        
                        // Parse payments
                        const payments = vehicle.monthly_payments ? JSON.parse(vehicle.monthly_payments) : {};
                        
                        // Basic vehicle info (columns A-E)
                        const cellData = [
                            index + 1, // STT (A)
                            vehicle.license_plate, // Biển số (B)  
                            `${vehicle.owner_name}\n${vehicle.phone}`, // Tên + SĐT (C)
                            `${vehicle.vehicle_type}\n${vehicle.price?.toLocaleString('vi-VN')}`, // Loại xe + Giá (D)
                            vehicle.entry_date ? new Date(vehicle.entry_date).toLocaleDateString('vi-VN') : '' // Ngày gửi (E)
                        ];
                        
                        // Set basic info
                        cellData.forEach((value, colIndex) => {
                            const cellRef = xlsx.utils.encode_cell({ r: rowIndex, c: colIndex });
                            if (!monthlySheet[cellRef]) monthlySheet[cellRef] = {};
                            monthlySheet[cellRef].v = value;
                            monthlySheet[cellRef].t = typeof value === 'number' ? 'n' : 's';
                        });
                        
                        // Set payment status in column F (index 5) - "THANH TOÁN" 
                        const paymentStatusRef = xlsx.utils.encode_cell({ r: rowIndex, c: 5 });
                        if (!monthlySheet[paymentStatusRef]) monthlySheet[paymentStatusRef] = {};
                        monthlySheet[paymentStatusRef].v = 'X'; // Default payment status
                        
                        // Fill monthly payments data (columns 5-28 for months 1-12) - updated mapping
                        const monthMappings = [
                            { month: 1, moneyCol: 5, dateCol: 6 },   // THÁNG 1: F, G
                            { month: 2, moneyCol: 7, dateCol: 8 },   // THÁNG 2: H, I
                            { month: 3, moneyCol: 9, dateCol: 10 },  // THÁNG 3: J, K
                            { month: 4, moneyCol: 11, dateCol: 12 }, // THÁNG 4: L, M
                            { month: 5, moneyCol: 13, dateCol: 14 }, // THÁNG 5: N, O
                            { month: 6, moneyCol: 15, dateCol: 16 }, // THÁNG 6: P, Q
                            { month: 7, moneyCol: 17, dateCol: 18 }, // THÁNG 7: R, S
                            { month: 8, moneyCol: 19, dateCol: 20 }, // THÁNG 8: T, U
                            { month: 9, moneyCol: 21, dateCol: 22 }, // THÁNG 9: V, W
                            { month: 10, moneyCol: 23, dateCol: 24 }, // THÁNG 10: X, Y
                            { month: 11, moneyCol: 25, dateCol: 26 }, // THÁNG 11: Z, AA
                            { month: 12, moneyCol: 27, dateCol: 28 }  // THÁNG 12: AB, AC
                        ];
                        
                        monthMappings.forEach(mapping => {
                            const monthData = payments[mapping.month];
                            if (monthData && monthData.paid) {
                                // Set payment amount
                                const moneyRef = xlsx.utils.encode_cell({ r: rowIndex, c: mapping.moneyCol });
                                if (!monthlySheet[moneyRef]) monthlySheet[moneyRef] = {};
                                monthlySheet[moneyRef].v = monthData.amount || 0;
                                monthlySheet[moneyRef].t = 'n';
                                
                                // Set payment date (format as dd/mm/yyyy text)
                                if (monthData.date) {
                                    const dateRef = xlsx.utils.encode_cell({ r: rowIndex, c: mapping.dateCol });
                                    if (!monthlySheet[dateRef]) monthlySheet[dateRef] = {};
                                    const jsDate = new Date(monthData.date);
                                    const formattedDate = jsDate.toLocaleDateString('vi-VN');
                                    monthlySheet[dateRef].v = formattedDate;
                                    monthlySheet[dateRef].t = 's'; // Set as string, not number
                                }
                            }
                        });
                    });
                    
                    // Update sheet range
                    const lastRow = 4 + monthlyVehicles.length - 1;
                    monthlySheet['!ref'] = `A1:AJ${lastRow + 1}`;
                }
                
                // Process hourly vehicles to match template format (columns A-H)
                if (hourlyVehicles.length > 0) {
                    // Get or create hourly sheet
                    let hourlySheet;
                    if (wb.Sheets['Xe gửi theo giờ']) {
                        hourlySheet = wb.Sheets['Xe gửi theo giờ'];
                        console.log('Using existing hourly sheet from template');
                        
                        // Clear existing data but preserve template structure (keep rows 1-5, clear from row 6 onwards)  
                        const range = xlsx.utils.decode_range(hourlySheet['!ref'] || 'A1:H6');
                        const maxRow = range.e.r;
                        
                        // Clear data rows (starting from row 6, index 5) but keep template headers/structure
                        for (let r = 5; r <= maxRow; r++) {
                            for (let c = 0; c <= 7; c++) { // columns A-H
                                const cellRef = xlsx.utils.encode_cell({ r: r, c: c });
                                if (hourlySheet[cellRef]) {
                                    delete hourlySheet[cellRef];
                                }
                            }
                        }
                    } else {
                        // Create new sheet with basic headers if template not found
                        hourlySheet = xlsx.utils.aoa_to_sheet([
                            ['STT', 'BIỂN SỐ XE', 'TÊN/SĐT', 'LOẠI XE/GIÁ', 'GIỜ VÀO', 'GIỜ RA', 'TIỀN', 'GHI CHÚ']
                        ]);
                        xlsx.utils.book_append_sheet(wb, hourlySheet, 'Xe gửi theo giờ');
                        console.log('Created new hourly sheet with basic headers');
                    }
                    
                    // Fill data starting from row 6 (index 5) to preserve template structure
                    hourlyVehicles.forEach((vehicle, index) => {
                        const rowIndex = 5 + index; // Start from row 6 (0-based index 5) to preserve template
                        
                        // Prepare data for each column according to template structure
                        const cellData = [
                            index + 1, // STT (A)
                            vehicle.license_plate || '', // BIỂN SỐ XE (B)
                            `${vehicle.owner_name || ''}${vehicle.phone ? '/' + vehicle.phone : ''}`, // TÊN/SĐT (C) 
                            `${vehicle.vehicle_type || ''}${vehicle.price ? '/' + vehicle.price + 'k' : ''}`, // LOẠI XE/GIÁ (D)
                            vehicle.entry_date ? new Date(vehicle.entry_date).toLocaleDateString('vi-VN') : '', // NGÀY VÀO (E)
                            (vehicle.exit_date && !vehicle.isParking) ? new Date(vehicle.exit_date).toLocaleString('vi-VN') : '', // GIỜ RA (F)
                            vehicle.price || 0, // TIỀN (G)
                            '' // GHI CHÚ (H) - empty for now
                        ];
                        
                        // Set data for each column
                        cellData.forEach((value, colIndex) => {
                            const cellRef = xlsx.utils.encode_cell({ r: rowIndex, c: colIndex });
                            if (!hourlySheet[cellRef]) hourlySheet[cellRef] = {};
                            hourlySheet[cellRef].v = value;
                            hourlySheet[cellRef].t = typeof value === 'number' ? 'n' : 's';
                        });
                    });
                    
                    // Update sheet range to include template structure + data rows
                    const lastRow = Math.max(5, 5 + hourlyVehicles.length); // At least row 6, or more if there's data
                    hourlySheet['!ref'] = `A1:H${lastRow + 1}`;
                }
                
                // Generate Excel file
                const excelBuffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
                
                // Set response headers
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', `attachment; filename=quan-ly-bai-xe-${new Date().toISOString().split('T')[0]}.xlsx`);
                
                res.send(excelBuffer);
                
            } catch (error) {
                console.error('Export template error:', error);
                res.status(500).json({ error: 'Lỗi xuất file Excel với template: ' + error.message });
            }
        });
    });
});

// Add a new vehicle
app.post('/api/vehicles', (req, res) => {
    const { license_plate, vehicle_type, owner_name, phone, entry_date, exit_date, price, is_monthly } = req.body;
    
    console.log('API POST /api/vehicles - Attempting to add vehicle:', { license_plate, vehicle_type, owner_name, phone, entry_date, exit_date, price, is_monthly });
    
    if (!license_plate) {
        console.log('API POST /api/vehicles - Missing license plate');
        return res.status(400).json({ error: 'Biển số xe không được để trống' });
    }
    
    // Set default values for optional fields
    const finalVehicleType = vehicle_type || 'Xe máy';
    const finalOwnerName = owner_name || '';
    const finalPhone = phone || '';
    const finalPrice = price || 0;
    const finalEntryDate = entry_date || new Date().toISOString();
    const finalIsParking = true; // New vehicles are always in parking

    // Check if vehicle already exists for non-monthly parking
    if (!is_monthly) {
        db.get('SELECT * FROM vehicles WHERE license_plate = ? AND isParking = 1', [license_plate], (err, row) => {
            if (err) {
                console.error('API POST /api/vehicles - Error checking existing vehicle:', err.message);
                return res.status(500).json({ error: err.message });
            }
            if (row) {
                console.log('API POST /api/vehicles - Vehicle already exists:', license_plate);
                return res.status(400).json({ error: 'Xe này đang được gửi trong bãi' });
            }
            
            // Insert the vehicle
            insertVehicle();
        });
    } else {
        // For monthly parking, allow duplicate license plates
        insertVehicle();
    }

    function insertVehicle() {
        db.run(`INSERT INTO vehicles (license_plate, vehicle_type, owner_name, phone, entry_date, exit_date, price, isParking, monthly_parking) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [license_plate, finalVehicleType, finalOwnerName, finalPhone, finalEntryDate, exit_date, finalPrice, finalIsParking, is_monthly ? 1 : 0],
            function(err) {
                if (err) {
                    console.error('API POST /api/vehicles - Error inserting vehicle:', err.message);
                    res.status(500).json({ error: err.message });
                    return;
                }

                // Add to history
                db.run(`INSERT INTO vehicle_history (license_plate, vehicle_type, owner_name, phone, entry_date, exit_date, price, isParking, monthly_parking) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [license_plate, finalVehicleType, finalOwnerName, finalPhone, finalEntryDate, exit_date, finalPrice, finalIsParking ? 1 : 0, is_monthly ? 1 : 0],
                    function(historyErr) {
                        if (historyErr) {
                            console.error('API POST /api/vehicles - Error adding to history:', historyErr.message);
                        }
                        
                        console.log('API POST /api/vehicles - Vehicle inserted successfully with ID:', this.lastID);
                        res.json({ id: this.lastID, message: 'Thêm xe thành công' });
                    }
                );
            }
        );
    }
});

// Removed - Import sample Excel functionality

// Removed - Test import functionality

// Removed - Import sample Excel functionality

// Import Excel with monthly payment data
app.post('/api/import-excel', (req, res) => {
    try {
        if (!req.files || !req.files.file) {
            return res.status(400).json({ error: 'Không có file được upload' });
        }

        const file = req.files.file;

        // Clear existing data before import to ensure a clean import
        db.serialize(() => {
            db.run('DELETE FROM vehicles', (err) => {
                if (err) {
                    console.error('Error clearing vehicles before import:', err.message);
                    return res.status(500).json({ error: 'Lỗi xóa dữ liệu vehicles: ' + err.message });
                }
            });

            db.run('DELETE FROM vehicle_history', (err) => {
                if (err) {
                    console.error('Error clearing vehicle_history before import:', err.message);
                    return res.status(500).json({ error: 'Lỗi xóa dữ liệu vehicle_history: ' + err.message });
                }
            });

            // Reset auto-increment counters
            db.run('DELETE FROM sqlite_sequence WHERE name IN ("vehicles", "vehicle_history")', (seqErr) => {
                if (seqErr) {
                    console.error('Error resetting sqlite_sequence before import:', seqErr.message);
                    return res.status(500).json({ error: 'Lỗi reset sqlite_sequence: ' + seqErr.message });
                }

                console.log('Existing data cleared successfully before import. Starting import...');

                // Proceed with import after clearing is done
                try {
                    const workbook = xlsx.read(file.data, { type: 'buffer' });
                    
                    let importedCount = 0;
                    let errors = [];

                    // Process each sheet
                    workbook.SheetNames.forEach(sheetName => {
                        const worksheet = workbook.Sheets[sheetName];
                        
                        // Thử đọc với nhiều options khác nhau
                        const data = xlsx.utils.sheet_to_json(worksheet);
                        const dataWithHeaders = xlsx.utils.sheet_to_json(worksheet, { header: 1 }); // Đọc thành array
                        const range = xlsx.utils.decode_range(worksheet['!ref']);
                        
                        console.log(`\n=== Sheet: ${sheetName} ===`);
                        console.log('Sheet range:', worksheet['!ref']);
                        console.log('Total data rows found:', data.length);
                        console.log('Available columns (object format):', Object.keys(data[0] || {}));
                        console.log('First row data (object format):', data[0]);
                        
                        if (data.length > 1) {
                            console.log('Sample actual data row (object format):', data[1]);
                        } else {
                            console.log('NO DATA ROWS FOUND - only header row exists!');
                        }
                        
                        console.log('\n--- Array format (first 5 rows) ---');
                        console.log('Total array rows:', dataWithHeaders.length);
                        for (let i = 0; i < Math.min(5, dataWithHeaders.length); i++) {
                            console.log(`Array Row ${i}:`, dataWithHeaders[i]);
                        }
                        
                        console.log(`\n--- Raw cell data (first 5 columns of first 3 rows) ---`);
                        for (let R = 0; R <= Math.min(2, range.e.r); R++) {
                            let rowData = [];
                            for (let C = 0; C <= Math.min(25, range.e.c); C++) { // Check up to column Z
                                const cellRef = xlsx.utils.encode_cell({ r: R, c: C });
                                const cell = worksheet[cellRef];
                                rowData.push(cell ? cell.v : null);
                            }
                            console.log(`Row ${R}:`, rowData);
                        }
                        
                        // Debug: Show all data before filtering
                        console.log('\n--- ALL DATA ROWS (first 5) ---');
                        for (let i = 0; i < Math.min(5, data.length); i++) {
                            console.log(`Data Row ${i}:`, data[i]);
                        }
                        
                        // Filter out header rows and empty rows
                        const validData = data.filter((row, index) => {
                            // Kiểm tra cột __EMPTY (SỐ XE) thay vì 'SỐ XE'
                            const licensePlate = String(row['__EMPTY'] || row['SỐ XE'] || row['Biển số'] || '').trim();
                            const isValid = licensePlate && 
                                   !licensePlate.toLowerCase().includes('biển số') &&
                                   !licensePlate.toLowerCase().includes('license') &&
                                   !licensePlate.toLowerCase().includes('số xe') &&
                                   licensePlate !== 'SỐ XE';
                            
                            console.log(`Row ${index} - License: "${licensePlate}" - Valid: ${isValid}`);
                            return isValid;
                        });

                        console.log(`\n*** Found ${validData.length} valid data rows in sheet ${sheetName} ***`);

                        validData.forEach((row, index) => {
                            try {
                                // Sử dụng đúng tên cột từ Excel
                                let licensePlate = String(row['__EMPTY'] || row['SỐ XE'] || '').trim();
                                const ownerNamePhone = String(row['__EMPTY_1'] || row['TÊN\nSỐ ĐT'] || '').trim();
                                const vehicleTypePrice = String(row['__EMPTY_2'] || row['LOẠI XE\nGIÁ GỬI'] || '').trim();
                                // Debug: Show all possible date columns
                                console.log(`Row ${index + 1} - All date-related columns:`, {
                                    '__EMPTY_3': row['__EMPTY_3'],
                                    '__EMPTY_4': row['__EMPTY_4'], 
                                    'NGÀY GỬI': row['NGÀY GỬI'],
                                    'NGÀY VÀO': row['NGÀY VÀO'],
                                    allKeys: Object.keys(row).filter(key => key.includes('EMPTY') || key.includes('NGÀY'))
                                });
                                
                                const entryDate = row['__EMPTY_4'] !== undefined ? row['__EMPTY_4'] : 
                                                 row['__EMPTY_3'] !== undefined ? row['__EMPTY_3'] : 
                                                 (row['NGÀY GỬI'] !== undefined ? row['NGÀY GỬI'] : 
                                                 (row['NGÀY VÀO'] !== undefined ? row['NGÀY VÀO'] : null));
                                const paymentInfo = String(row['__EMPTY_5'] || row['THANH TOÁN'] || '').trim();
                                const notes = String(row['__EMPTY_20'] || row['GHI CHÚ'] || '').trim();
                                
                                console.log(`Processing row ${index + 1}:`, {
                                    licensePlate,
                                    ownerNamePhone,
                                    vehicleTypePrice,
                                    entryDate,
                                    entryDateType: typeof entryDate,
                                    entryDateValue: entryDate,
                                    paymentInfo
                                });
                                
                                // Tách thông tin từ cột "TÊN\nSỐ ĐT"
                                let ownerName = '';
                                let phone = '';
                                if (ownerNamePhone.includes('\n')) {
                                    const parts = ownerNamePhone.split('\n');
                                    ownerName = parts[0].trim();
                                    phone = parts[1] ? parts[1].trim() : '';
                                } else {
                                    ownerName = ownerNamePhone;
                                }
                                
                                // Tách thông tin từ cột "LOẠI XE\nGIÁ GỬI"  
                                let vehicleType = 'Xe máy';
                                let price = 0;
                                if (vehicleTypePrice.includes('\n')) {
                                    const parts = vehicleTypePrice.split('\n');
                                    vehicleType = parts[0].trim() || 'Xe máy';
                                    if (parts[1]) {
                                        // Chuẩn hóa định dạng tiền: xử lý cả dấu . và , làm separator
                                        const priceStr = parts[1].trim()
                                            .replace(/[^\d.,]/g, '') // Giữ lại chỉ số, dấu . và ,
                                            .replace(/[.,]/g, ''); // Bỏ tất cả dấu . và ,
                                        price = parseInt(priceStr) || 0;
                                    }
                                } else if (vehicleTypePrice) {
                                    vehicleType = vehicleTypePrice;
                                }
                                
                                // Detect if this is monthly or hourly vehicle based on sheet name
                                const hourlyKeywords = ['giờ', 'hour', 'theo giờ', 'gui theo gio'];
                                const monthlyKeywords = ['tháng', 'month', 'gui thang', 'gửi tháng'];
                                
                                let sheetType = null;
                                const sheetNameLower = sheetName.toLowerCase();
                                
                                if (hourlyKeywords.some(keyword => sheetNameLower.includes(keyword))) {
                                    sheetType = 'hourly';
                                } else if (monthlyKeywords.some(keyword => sheetNameLower.includes(keyword))) {
                                    sheetType = 'monthly';
                                } else {
                                    // Fallback: analyze data structure to determine type
                                    // If sheet has many monthly payment columns, it's monthly
                                    const hasMonthlyColumns = Object.keys(row).some(key => 
                                        key.includes('EMPTY_6') || key.includes('EMPTY_8') || key.includes('EMPTY_10')
                                    );
                                    sheetType = hasMonthlyColumns ? 'monthly' : 'hourly';
                                }
                                
                                const isMonthly = sheetType === 'monthly';
                                console.log(`Sheet "${sheetName}" detected as: ${sheetType} (isMonthly: ${isMonthly})`)
                                
                                // Handle license plate formatting
                                if (licensePlate.includes('\n')) {
                                    licensePlate = licensePlate.replace(/\n/g, '-');
                                }

                                // Process monthly payments - xử lý thanh toán theo tháng từ Excel
                                let monthlyPayments = {};
                                if (isMonthly) {
                                    console.log('All keys in row:', Object.keys(row));
                                    console.log('Full row data:', row);
                                    
                                    // Mapping cố định dựa trên cấu trúc Excel thực tế
                                    const monthMappings = [
                                        { month: 6, moneyCol: '__EMPTY_6', dateCol: '__EMPTY_7' },   // THÁNG 6: H, I
                                        { month: 7, moneyCol: '__EMPTY_8', dateCol: '__EMPTY_9' },   // THÁNG 7: J, K
                                        { month: 8, moneyCol: '__EMPTY_10', dateCol: '__EMPTY_11' }, // THÁNG 8: L, M
                                        { month: 9, moneyCol: '__EMPTY_12', dateCol: '__EMPTY_13' }, // THÁNG 9: N, O
                                        { month: 10, moneyCol: '__EMPTY_14', dateCol: '__EMPTY_15' }, // THÁNG 10: P, Q
                                        { month: 11, moneyCol: '__EMPTY_16', dateCol: '__EMPTY_17' }, // THÁNG 11: R, S
                                        { month: 12, moneyCol: '__EMPTY_18', dateCol: '__EMPTY_19' }  // THÁNG 12: T, U
                                    ];
                                    
                                    monthMappings.forEach(mapping => {
                                        const moneyValue = row[mapping.moneyCol];
                                        const dateValue = row[mapping.dateCol];
                                        
                                        console.log(`Month ${mapping.month}: money=${moneyValue}, date=${dateValue}`);
                                        
                                        // Check if there's payment data (not X and has numeric value)
                                        if (moneyValue && typeof moneyValue === 'number' && moneyValue > 0) {
                                            monthlyPayments[mapping.month] = {
                                                paid: true,
                                                amount: moneyValue,
                                                date: dateValue && typeof dateValue === 'number' ? 
                                                      new Date((dateValue - 25569) * 86400 * 1000).toISOString().split('T')[0] : // Convert Excel date to YYYY-MM-DD
                                                      new Date().toISOString().split('T')[0]
                                            };
                                            console.log(`✓ Month ${mapping.month} PAID: ${moneyValue} on ${monthlyPayments[mapping.month].date}`);
                                        }
                                    });
                                    
                                    console.log('Processed monthly payments:', monthlyPayments);
                                }

                                // Process entry date from Excel
                                let processedEntryDate;
                                if (entryDate !== null && entryDate !== undefined && typeof entryDate === 'number') {
                                    // Excel date format - convert Excel serial number to JavaScript date
                                    console.log(`Original Excel date value: ${entryDate} (type: ${typeof entryDate})`);
                                    
                                    // FIXED: Direct calculation to avoid timezone issues completely
                                    // Excel serial date: days since December 31, 1899 (Excel day 1 = January 1, 1900)
                                    // Formula: Add days to base date and extract components directly
                                    const baseYear = 1900;
                                    const baseMonth = 1; // January
                                    const baseDay = 1;
                                    
                                    // Create base date in UTC to avoid timezone shifts
                                    let baseDate = new Date(Date.UTC(baseYear, baseMonth - 1, baseDay));
                                    
                                    // Add the Excel serial days (subtract 1 because Excel day 1 is our base date)
                                    let targetTimestamp = baseDate.getTime() + (entryDate - 1) * 24 * 60 * 60 * 1000;
                                    let targetDate = new Date(targetTimestamp);
                                    
                                    // Extract date components using UTC methods to avoid local timezone
                                    const year = targetDate.getUTCFullYear();
                                    const month = String(targetDate.getUTCMonth() + 1).padStart(2, '0');
                                    const day = String(targetDate.getUTCDate()).padStart(2, '0');
                                    processedEntryDate = `${year}-${month}-${day} 07:00:00`;
                                    
                                    console.log(`Excel date conversion (UTC): ${entryDate} -> ${day}/${month}/${year} -> ${processedEntryDate}`);
                                    console.log(`Debug: baseDate=${baseDate.toISOString()}, targetDate=${targetDate.toISOString()}`);
                                } else if (entryDate !== null && entryDate !== undefined && typeof entryDate === 'string' && entryDate.trim() !== '') {
                                    // String date format - could be DD/MM/YYYY or other formats
                                    let jsDate;
                                    const dateStr = entryDate.trim();
                                    console.log(`Processing string date: "${dateStr}"`);
                                    
                                    // Check if it's in DD/MM/YYYY format
                                    if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
                                        const [day, month, year] = dateStr.split('/');
                                        jsDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                                        console.log(`Parsed DD/MM/YYYY format: ${dateStr} -> ${jsDate.toLocaleDateString('vi-VN')}`);
                                    } else {
                                        // Try standard JavaScript date parsing
                                        jsDate = new Date(dateStr);
                                        console.log(`Standard parsing: ${dateStr} -> ${jsDate.toLocaleDateString('vi-VN')}`);
                                    }
                                    
                                    if (isNaN(jsDate.getTime())) {
                                        // Invalid date, use current date
                                        jsDate = new Date();
                                        console.log(`Invalid date, using current date: ${jsDate.toLocaleDateString('vi-VN')}`);
                                    }
                                    
                                    processedEntryDate = jsDate.toISOString().split('T')[0] + ' 07:00:00';
                                    console.log(`String date final result: ${dateStr} -> ${processedEntryDate}`);
                                } else {
                                    // Fallback to current date
                                    processedEntryDate = new Date().toISOString().split('T')[0] + ' 07:00:00';
                                    console.log(`Using current date as fallback (entryDate was: ${entryDate}): ${processedEntryDate}`);
                                }

                                // Insert vehicle - Import vehicles are always "exited" (isParking = false)
                                db.run(`INSERT OR REPLACE INTO vehicles 
                                        (license_plate, vehicle_type, owner_name, phone, entry_date, exit_date, price, isParking, monthly_parking, monthly_payments, monthly_paid, payment_date) 
                                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                                    [
                                        licensePlate,
                                        vehicleType,
                                        ownerName,
                                        phone,
                                        processedEntryDate,
                                        new Date().toISOString(), // Set exit_date since isParking = false
                                        price,
                                        0, // isParking = false for imported vehicles
                                        isMonthly ? 1 : 0,
                                        isMonthly ? JSON.stringify(monthlyPayments) : null,
                                        isMonthly ? (Object.keys(monthlyPayments).length > 0 ? 1 : 0) : 0,
                                        isMonthly ? new Date().toISOString() : null
                                    ],
                                    function(err) {
                                        if (err) {
                                            errors.push(`Lỗi import dòng ${index + 1}: ${err.message}`);
                                        } else {
                                            importedCount++;
                                        }
                                    }
                                );

                            } catch (error) {
                                errors.push(`Lỗi xử lý dòng ${index + 1}: ${error.message}`);
                            }
                        });
                    });

                    setTimeout(() => {
                        res.json({
                            message: `Import thành công ${importedCount} xe`,
                            imported: importedCount,
                            errors: errors
                        });
                    }, 1000);

                } catch (error) {
                    console.error('Import Excel error after clearing:', error);
                    res.status(500).json({ error: 'Lỗi import file Excel: ' + error.message });
                }
            });
        });

    } catch (error) {
        console.error('Import Excel error:', error);
        res.status(500).json({ error: 'Lỗi import file Excel: ' + error.message });
    }
});

// Check template structure
app.get('/api/check-template', (req, res) => {
    try {
        const templatePath = path.join(__dirname, 'public', 'template.xlsx');
        
        if (!require('fs').existsSync(templatePath)) {
            return res.status(404).json({ error: 'Template file not found' });
        }
        
        const workbook = xlsx.readFile(templatePath);
        const results = {};
        
        console.log('\n=== ANALYZING TEMPLATE STRUCTURE ===');
        console.log('Sheet names:', workbook.SheetNames);
        
        workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const range = xlsx.utils.decode_range(worksheet['!ref']);
            
            console.log(`\n--- Sheet: ${sheetName} ---`);
            console.log('Range:', worksheet['!ref']);
            
            // Read header rows to understand structure
            const headerRows = [];
            for (let R = 0; R <= Math.min(4, range.e.r); R++) {
                let rowData = [];
                for (let C = 0; C <= range.e.c; C++) {
                    const cellRef = xlsx.utils.encode_cell({ r: R, c: C });
                    const cell = worksheet[cellRef];
                    rowData.push(cell ? cell.v : null);
                }
                headerRows.push(rowData);
                console.log(`Row ${R + 1}:`, rowData.slice(0, 10)); // Show first 10 columns
            }
            
            results[sheetName] = {
                range: worksheet['!ref'],
                headerRows: headerRows,
                totalColumns: range.e.c + 1,
                totalRows: range.e.r + 1
            };
        });
        
        res.json({
            message: 'Template structure analyzed',
            sheets: results
        });
        
    } catch (error) {
        console.error('Error analyzing template:', error);
        res.status(500).json({ error: 'Error analyzing template: ' + error.message });
    }
});

// Clear all data for testing (DELETE endpoint)
app.delete('/api/clear-all-data', (req, res) => {
    db.serialize(() => {
        db.run('DELETE FROM vehicles', (err) => {
            if (err) {
                console.error('Error clearing vehicles table:', err.message);
                return res.status(500).json({ error: 'Lỗi xóa dữ liệu vehicles: ' + err.message });
            }
        });
        
        db.run('DELETE FROM vehicle_history', (err) => {
            if (err) {
                console.error('Error clearing vehicle_history table:', err.message);
                return res.status(500).json({ error: 'Lỗi xóa dữ liệu vehicle_history: ' + err.message });
            }
        });
        
        // Reset auto-increment counters
        db.run('DELETE FROM sqlite_sequence WHERE name IN ("vehicles", "vehicle_history")', (err) => {
            if (err) {
                console.error('Error resetting auto-increment:', err.message);
            }
            
            console.log('All data cleared successfully');
            res.json({ 
                message: 'Đã xóa trắng toàn bộ dữ liệu thành công!',
                cleared: {
                    vehicles: 'OK',
                    vehicle_history: 'OK',
                    auto_increment_reset: 'OK'
                }
            });
        });
    });
});

// Delete a specific vehicle
app.delete('/api/vehicles/:id', (req, res) => {
    const { id } = req.params;
    
    // First get vehicle info for logging
    db.get('SELECT * FROM vehicles WHERE id = ?', [id], (err, vehicle) => {
        if (err) {
            console.error('Error getting vehicle for deletion:', err.message);
            return res.status(500).json({ error: err.message });
        }
        
        if (!vehicle) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }
        
        // Delete from vehicles table
        db.run('DELETE FROM vehicles WHERE id = ?', [id], function(err) {
            if (err) {
                console.error('Error deleting vehicle:', err.message);
                return res.status(500).json({ error: err.message });
            }
            
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Vehicle not found' });
            }
            
            // Also delete from vehicle_history table for complete removal
            db.run('DELETE FROM vehicle_history WHERE license_plate = ?', [vehicle.license_plate], (historyErr) => {
                if (historyErr) {
                    console.error('Error deleting from history:', historyErr.message);
                    // Don't fail the main operation if history deletion fails
                }
                
                console.log(`Vehicle deleted successfully: ${vehicle.license_plate} (ID: ${id})`);
                res.json({ 
                    message: `Đã xóa xe ${vehicle.license_plate} thành công!`,
                    deletedVehicle: {
                        id: vehicle.id,
                        license_plate: vehicle.license_plate,
                        owner_name: vehicle.owner_name
                    }
                });
            });
        });
    });
});

// Update vehicle (mainly for exit)
app.put('/api/vehicles/:id', (req, res) => {
    const { id } = req.params;
    const { exit_date, price, isParking, monthly_parking, license_plate, vehicle_type, owner_name, phone, monthly_paid, payment_date, monthly_payments, entry_date } = req.body;
    
    // First, get vehicle info to check current status and type
    db.get('SELECT isParking, monthly_parking FROM vehicles WHERE id = ?', [id], (err, vehicle) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (!vehicle) {
            res.status(404).json({ error: 'Vehicle not found' });
            return;
        }
        
        console.log('PUT request body:', req.body);
        
        let updateQuery = 'UPDATE vehicles SET ';
        let updateParams = [];
        let updateFields = [];
        
        if (exit_date !== undefined) {
            updateFields.push('exit_date = ?');
            updateParams.push(exit_date);
        }
        
        // Allow price updates for monthly parking vehicles always, restrict for hourly vehicles that have exited
        if (price !== undefined) {
            updateFields.push('price = ?');
            updateParams.push(price);
        }
        
        if (isParking !== undefined) {
            updateFields.push('isParking = ?');
            updateParams.push(isParking ? 1 : 0);
        }
        
        if (monthly_parking !== undefined) {
            updateFields.push('monthly_parking = ?');
            updateParams.push(monthly_parking ? 1 : 0);
        }
        
        if (license_plate !== undefined) {
            updateFields.push('license_plate = ?');
            updateParams.push(license_plate);
        }
        
        if (vehicle_type !== undefined) {
            updateFields.push('vehicle_type = ?');
            updateParams.push(vehicle_type);
        }
        
        if (owner_name !== undefined) {
            updateFields.push('owner_name = ?');
            updateParams.push(owner_name);
        }
        
        if (phone !== undefined) {
            updateFields.push('phone = ?');
            updateParams.push(phone);
        }
        
        if (monthly_paid !== undefined) {
            updateFields.push('monthly_paid = ?');
            updateParams.push(monthly_paid ? 1 : 0);
        }
        
        if (payment_date !== undefined) {
            updateFields.push('payment_date = ?');
            updateParams.push(payment_date);
        }
        
        if (monthly_payments !== undefined) {
            updateFields.push('monthly_payments = ?');
            updateParams.push(monthly_payments);
        }
        
        if (entry_date !== undefined) {
            updateFields.push('entry_date = ?');
            // Only store the date part (YYYY-MM-DD) with default time 07:00:00
            const dateOnly = new Date(entry_date).toISOString().split('T')[0] + ' 07:00:00';
            updateParams.push(dateOnly);
        }
        
        if (updateFields.length === 0) {
            res.status(400).json({ error: 'No fields to update' });
            return;
        }
        
        updateQuery += updateFields.join(', ') + ' WHERE id = ?';
        updateParams.push(id);
        
        db.run(updateQuery, updateParams, function(err) {
            if (err) {
                console.error('SQL Error in vehicle update:', err.message);
                console.error('Update query:', updateQuery);
                console.error('Update params:', updateParams);
                
                // Check for specific constraint violations
                if (err.message.includes('UNIQUE constraint failed')) {
                    res.status(400).json({ error: 'Biển số xe này đã tồn tại cho xe gửi tháng khác!' });
                } else {
                    res.status(500).json({ error: 'Lỗi cập nhật dữ liệu: ' + err.message });
                }
                return;
            }
            if (this.changes === 0) {
                res.status(404).json({ error: 'Vehicle not found' });
                return;
            }
            
            // If vehicle is exiting (isParking = false/0), save to history and handle accordingly
            if ((isParking === false || isParking === 0) && exit_date) {
                // Get the updated vehicle data
                db.get('SELECT * FROM vehicles WHERE id = ?', [id], (err, vehicleData) => {
                    if (err) {
                        console.error('Error getting vehicle data:', err.message);
                        res.json({ message: 'Vehicle updated successfully' });
                        return;
                    }
                    
                    if (vehicleData) {
                        // Update history record with exit information
                        db.run(`UPDATE vehicle_history 
                               SET exit_date = ?, price = ? 
                               WHERE license_plate = ? AND exit_date IS NULL 
                               ORDER BY created_at DESC LIMIT 1`, 
                               [exit_date, vehicleData.price, vehicleData.license_plate], 
                               (err) => {
                                   if (err) {
                                       console.error('Error updating history:', err.message);
                                   }
                               });
                        
                        // Keep vehicle in main table with isParking = false for history and re-entry
                    }
                    
                    res.json({ message: 'Vehicle updated successfully' });
                });
            } else {
                res.json({ message: 'Vehicle updated successfully' });
            }
        });
    });
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('Vehicle Parking Management System started successfully!');
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Database connection closed.');
        process.exit(0);
    });
});

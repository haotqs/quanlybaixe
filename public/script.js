// Global variables
let currentEditId = null;
let allVehicles = [];

// Pagination variables
let currentMonthlyPage = 1;
let currentHourlyPage = 1;
const itemsPerPage = 10;

// Filtered data cache
let filteredMonthlyVehicles = [];
let filteredHourlyVehicles = [];

// DOM elements
const vehicleForm = document.getElementById('vehicleForm');
const monthlyVehicleTableBody = document.getElementById('monthlyVehicleTableBody');
const hourlyVehicleTableBody = document.getElementById('hourlyVehicleTableBody');
const searchMonthlyInput = document.getElementById('searchMonthlyInput');
const searchHourlyInput = document.getElementById('searchHourlyInput');
const statusMonthlyFilter = document.getElementById('statusMonthlyFilter');
const statusHourlyFilter = document.getElementById('statusHourlyFilter');
const cancelBtn = document.getElementById('cancelBtn');

// Modal elements
const confirmModal = document.getElementById('confirmModal');
const confirmMessage = document.getElementById('confirmMessage');
const confirmYes = document.getElementById('confirmYes');
const confirmNo = document.getElementById('confirmNo');

const exitModal = document.getElementById('exitModal');
const exitPrice = document.getElementById('exitPrice');
const exitConfirm = document.getElementById('exitConfirm');
const exitCancel = document.getElementById('exitCancel');

const paymentModal = document.getElementById('paymentModal');
const paymentConfirm = document.getElementById('paymentConfirm');
const paymentCancel = document.getElementById('paymentCancel');

const viewPaymentModal = document.getElementById('viewPaymentModal');
const paymentDetails = document.getElementById('paymentDetails');
const viewPaymentClose = document.getElementById('viewPaymentClose');

// Edit vehicle modal elements
const editVehicleModal = document.getElementById('editVehicleModal');
const editVehicleForm = document.getElementById('editVehicleForm');
const editVehicleSave = document.getElementById('editVehicleSave');
const editVehicleCancel = document.getElementById('editVehicleCancel');

// Removed - Import sample Excel functionality

// Removed - Test import functionality

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    loadVehicles();
    setupEventListeners();
});

// Event listeners
function setupEventListeners() {
    vehicleForm.addEventListener('submit', handleFormSubmit);
    cancelBtn.addEventListener('click', cancelEdit);
    
    // Monthly vehicles filters
    searchMonthlyInput.addEventListener('input', filterMonthlyVehicles);
    statusMonthlyFilter.addEventListener('change', filterMonthlyVehicles);
    
    // Hourly vehicles filters
    searchHourlyInput.addEventListener('input', filterHourlyVehicles);
    statusHourlyFilter.addEventListener('change', filterHourlyVehicles);
    
    // Modal events
    confirmYes.addEventListener('click', handleConfirmYes);
    confirmNo.addEventListener('click', hideConfirmModal);
    exitConfirm.addEventListener('click', handleExitConfirm);
    exitCancel.addEventListener('click', hideExitModal);
    paymentConfirm.addEventListener('click', handlePaymentConfirm);
    paymentCancel.addEventListener('click', hidePaymentModal);
    viewPaymentClose.addEventListener('click', hideViewPaymentModal);
    
    // Edit modal events
    editVehicleSave.addEventListener('click', handleEditVehicleSave);
    editVehicleCancel.addEventListener('click', hideEditVehicleModal);
    
    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === confirmModal) {
            hideConfirmModal();
        }
        if (event.target === exitModal) {
            hideExitModal();
        }
        if (event.target === paymentModal) {
            hidePaymentModal();
        }
        if (event.target === viewPaymentModal) {
            hideViewPaymentModal();
        }
        if (event.target === editVehicleModal) {
            hideEditVehicleModal();
        }
    });
}

// API functions
async function apiCall(url, method = 'GET', data = null) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }
        
        const response = await fetch(url, options);
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Something went wrong');
        }
        
        return result;
    } catch (error) {
        console.error('API Error:', error);
        showMessage(error.message, 'error');
        throw error;
    }
}

// Load vehicles from server
async function loadVehicles() {
    try {
        console.log('Loading vehicles from server...');
        allVehicles = await apiCall('/api/vehicles');
        console.log('Loaded vehicles:', allVehicles.length, 'total vehicles');
        console.log('Monthly vehicles:', allVehicles.filter(v => v.monthly_parking === 1).length);
        console.log('Hourly vehicles:', allVehicles.filter(v => v.monthly_parking !== 1).length);
        renderAllVehicles();
    } catch (error) {
        console.error('Failed to load vehicles:', error);
    }
}

// Render both tables
function renderAllVehicles() {
    console.log('Rendering all vehicles...');
    const monthlyVehicles = allVehicles.filter(vehicle => vehicle.monthly_parking === 1);
    const hourlyVehicles = allVehicles.filter(vehicle => vehicle.monthly_parking !== 1);
    
    console.log('Rendering monthly vehicles:', monthlyVehicles.length);
    console.log('Rendering hourly vehicles:', hourlyVehicles.length);
    
    renderMonthlyVehicles(monthlyVehicles);
    renderHourlyVehicles(hourlyVehicles);
}

// Render monthly vehicles table with pagination
function renderMonthlyVehicles(vehicles) {
    console.log('renderMonthlyVehicles called with', vehicles.length, 'vehicles');
    monthlyVehicleTableBody.innerHTML = '';
    
    // Sort vehicles: isParking first, then not parking
    const sortedVehicles = [...vehicles].sort((a, b) => {
        // Priority: isParking = 0, not parking = 1 (lower number = higher priority)
        const aPriority = a.isParking ? 0 : 1;
        const bPriority = b.isParking ? 0 : 1;
        
        if (aPriority !== bPriority) {
            return aPriority - bPriority;
        }
        
        // If same parking status, sort by entry date (newest first)
        return new Date(b.entry_date) - new Date(a.entry_date);
    });
    
    if (sortedVehicles.length === 0) {
        console.log('No monthly vehicles to display');
        monthlyVehicleTableBody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 40px; color: #666;">
                    Chưa có xe gửi tháng nào
                </td>
            </tr>
        `;
        updateMonthlyPagination(0);
        return;
    }
    
    // Calculate pagination using sorted vehicles
    const totalPages = Math.ceil(sortedVehicles.length / itemsPerPage);
    const startIndex = (currentMonthlyPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedVehicles = sortedVehicles.slice(startIndex, endIndex);
    
    paginatedVehicles.forEach((vehicle, index) => {
        const row = document.createElement('tr');
        const globalIndex = startIndex + index + 1; // Global index across all pages
        row.innerHTML = `
            <td>${globalIndex}</td>
            <td><strong>${formatLicensePlate(vehicle.license_plate)}</strong></td>
            <td>${vehicle.vehicle_type}</td>
            <td>${vehicle.owner_name}</td>
            <td>${vehicle.phone}</td>
            <td>${formatDate(vehicle.entry_date)}</td>
            <td>${formatCurrency(vehicle.price)}</td>
            <td>
                <span class="payment-detail-link" onclick="viewPaymentDetails(${vehicle.id})">
                    📋 Click để xem chi tiết
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-primary" onclick="editVehicle(${vehicle.id})">Sửa</button>
                    <button class="btn btn-success" onclick="showPaymentModal(${vehicle.id})" title="Thanh toán">💰</button>
                    <button class="btn btn-danger" onclick="deleteVehicle(${vehicle.id})" title="Xóa xe">🗑️</button>
                </div>
            </td>
        `;
        monthlyVehicleTableBody.appendChild(row);
    });
    
    updateMonthlyPagination(sortedVehicles.length);
}

// Render hourly vehicles table with pagination
function renderHourlyVehicles(vehicles) {
    hourlyVehicleTableBody.innerHTML = '';
    
    // Sort vehicles: isParking first, then not parking
    const sortedVehicles = [...vehicles].sort((a, b) => {
        // Priority: isParking = 0, not parking = 1 (lower number = higher priority)
        const aPriority = a.isParking ? 0 : 1;
        const bPriority = b.isParking ? 0 : 1;
        
        if (aPriority !== bPriority) {
            return aPriority - bPriority;
        }
        
        // If same parking status, sort by entry date (newest first)
        return new Date(b.entry_date) - new Date(a.entry_date);
    });
    
    if (sortedVehicles.length === 0) {
        hourlyVehicleTableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: #666;">
                    Chưa có xe gửi theo giờ nào
                </td>
            </tr>
        `;
        updateHourlyPagination(0);
        return;
    }
    
    // Calculate pagination using sorted vehicles
    const totalPages = Math.ceil(sortedVehicles.length / itemsPerPage);
    const startIndex = (currentHourlyPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedVehicles = sortedVehicles.slice(startIndex, endIndex);
    
    paginatedVehicles.forEach((vehicle, index) => {
        const row = document.createElement('tr');
        const globalIndex = startIndex + index + 1; // Global index across all pages
        row.innerHTML = `
            <td>${globalIndex}</td>
            <td><strong>${formatLicensePlate(vehicle.license_plate)}</strong></td>
            <td>${vehicle.vehicle_type}</td>
            <td>${vehicle.owner_name}</td>
            <td>${vehicle.phone}</td>
            <td>${formatDate(vehicle.entry_date)}</td>
            <td>${formatCurrency(vehicle.price)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-primary" onclick="editVehicle(${vehicle.id})">Sửa</button>
                    <button class="btn btn-danger" onclick="deleteVehicle(${vehicle.id})" title="Xóa xe">🗑️</button>
                </div>
            </td>
        `;
        hourlyVehicleTableBody.appendChild(row);
    });
    
    updateHourlyPagination(sortedVehicles.length);
}

// Filter monthly vehicles
function filterMonthlyVehicles(resetPage = true) {
    const searchTerm = searchMonthlyInput.value.toLowerCase();
    const statusFilterValue = statusMonthlyFilter.value;
    
    filteredMonthlyVehicles = allVehicles.filter(vehicle => {
        const isMonthly = vehicle.monthly_parking === 1;
        const matchesSearch = vehicle.license_plate.toLowerCase().includes(searchTerm) ||
                            vehicle.owner_name.toLowerCase().includes(searchTerm);
        
        // Handle status filtering with boolean isParking
        let matchesStatus = !statusFilterValue;
        if (statusFilterValue) {
            if (statusFilterValue === 'IN') {
                matchesStatus = !!vehicle.isParking; // Convert to boolean - true if 1 or true
            } else if (statusFilterValue === 'OUT') {
                matchesStatus = !vehicle.isParking; // Convert to boolean - true if 0, false, null
            }
        }
        
        return isMonthly && matchesSearch && matchesStatus;
    });
    
    // Reset to first page only when filtering, not when navigating pages
    if (resetPage) {
        currentMonthlyPage = 1;
    }
    
    console.log('Monthly vehicles filtered:', filteredMonthlyVehicles.length, 'vehicles');
    renderMonthlyVehicles(filteredMonthlyVehicles);
}

// Filter hourly vehicles
function filterHourlyVehicles(resetPage = true) {
    const searchTerm = searchHourlyInput.value.toLowerCase();
    const statusFilterValue = statusHourlyFilter.value;
    
    filteredHourlyVehicles = allVehicles.filter(vehicle => {
        const isHourly = vehicle.monthly_parking !== 1;
        const matchesSearch = vehicle.license_plate.toLowerCase().includes(searchTerm) ||
                            vehicle.owner_name.toLowerCase().includes(searchTerm);
        
        // Handle status filtering with boolean isParking
        let matchesStatus = !statusFilterValue;
        if (statusFilterValue) {
            if (statusFilterValue === 'IN') {
                matchesStatus = !!vehicle.isParking; // Convert to boolean - true if 1 or true
            } else if (statusFilterValue === 'OUT') {
                matchesStatus = !vehicle.isParking; // Convert to boolean - true if 0, false, null
            }
        }
        
        return isHourly && matchesSearch && matchesStatus;
    });
    
    // Reset to first page only when filtering, not when navigating pages
    if (resetPage) {
        currentHourlyPage = 1;
    }
    
    console.log('Hourly vehicles filtered:', filteredHourlyVehicles.length, 'vehicles');
    renderHourlyVehicles(filteredHourlyVehicles);
}

// Form submission
async function handleFormSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(vehicleForm);
    const vehicleData = {
        license_plate: formData.get('license_plate').toUpperCase(),
        vehicle_type: formData.get('vehicle_type'),
        owner_name: formData.get('owner_name'),
        phone: formData.get('phone'),
        is_monthly: document.getElementById('monthlyParking').checked
    };
    
    // Only include price if the field is not disabled
    const priceField = document.getElementById('price');
    if (!priceField.disabled) {
        vehicleData.price = parseFloat(formData.get('price')) || 0;
    }
    
    try {
        if (currentEditId) {
            // Update existing vehicle
            await apiCall(`/api/vehicles/${currentEditId}`, 'PUT', vehicleData);
            showMessage('Cập nhật thông tin xe thành công!', 'success');
            cancelEdit();
        } else {
            // Add new vehicle (always include price for new vehicles)
            vehicleData.price = parseFloat(formData.get('price')) || 0;
            await apiCall('/api/vehicles', 'POST', vehicleData);
            showMessage('Thêm xe vào bãi thành công!', 'success');
            vehicleForm.reset();
        }
        
        loadVehicles();
    } catch (error) {
        // Error already handled in apiCall
    }
}

// Edit vehicle
async function editVehicle(id) {
    console.log('editVehicle called with ID:', id);
    
    if (!editVehicleModal) {
        console.error('editVehicleModal not found!');
        showMessage('Lỗi: Không tìm thấy modal sửa xe!', 'error');
        return;
    }
    
    try {
        console.log('Fetching vehicle data...');
        const vehicle = await apiCall(`/api/vehicles/${id}`);
        console.log('Vehicle data loaded:', vehicle);
        
        // Fill modal form with vehicle data
        const licensePlateField = document.getElementById('editLicensePlate');
        const vehicleTypeField = document.getElementById('editVehicleType');
        const ownerNameField = document.getElementById('editOwnerName');
        const phoneField = document.getElementById('editPhone');
        const priceField = document.getElementById('editPrice');
        const monthlyParkingField = document.getElementById('editMonthlyParking');
        
        if (!licensePlateField || !vehicleTypeField || !ownerNameField || !phoneField || !priceField || !monthlyParkingField) {
            console.error('Some edit form fields not found!');
            showMessage('Lỗi: Không tìm thấy các trường dữ liệu!', 'error');
            return;
        }
        
        licensePlateField.value = vehicle.license_plate || '';
        vehicleTypeField.value = vehicle.vehicle_type || '';
        ownerNameField.value = vehicle.owner_name || '';
        phoneField.value = vehicle.phone || '';
        priceField.value = vehicle.price || 0;
        monthlyParkingField.checked = vehicle.monthly_parking === 1;
        
        // Fill entry date field (date only)
        const entryDateField = document.getElementById('editEntryDate');
        if (entryDateField && vehicle.entry_date) {
            // Convert to YYYY-MM-DD format for input[type="date"]
            const date = new Date(vehicle.entry_date);
            // Ensure we get the correct date without timezone issues
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;
            entryDateField.value = dateStr;
            console.log(`Filling edit date field: ${vehicle.entry_date} -> ${dateStr}`);
        }
        
        // Disable price field only for hourly vehicles that have exited
        if (!vehicle.isParking && vehicle.monthly_parking !== 1) {
            priceField.disabled = true;
            priceField.title = 'Không thể sửa giá tiền cho xe gửi giờ đã ra bãi';
        } else {
            priceField.disabled = false;
            priceField.title = '';
        }
        
        // Update modal title with vehicle info
        const modalTitle = document.querySelector('#editVehicleModal h3');
        if (modalTitle) {
            modalTitle.innerHTML = `
                ✏️ Sửa thông tin xe<br>
                <small style="font-weight: normal; color: #666; font-size: 14px;">
                    🚗 ${formatLicensePlate(vehicle.license_plate).replace('<br>', ' ')} | 
                    📊 ${vehicle.isParking ? 'Trong bãi' : 'Đã ra bãi'}
                </small>
            `;
        }
        
        currentEditId = id;
        console.log('Showing edit modal...');
        editVehicleModal.style.display = 'block';
        console.log('Edit modal displayed');
    } catch (error) {
        console.error('Failed to load vehicle for editing:', error);
        showMessage('Không thể tải thông tin xe để sửa!', 'error');
    }
}

// Cancel edit
function cancelEdit() {
    currentEditId = null;
    vehicleForm.reset();
    document.getElementById('monthlyParking').checked = false;
    cancelBtn.style.display = 'none';
    
    // Reset form title and button text
    document.querySelector('.form-section h2').textContent = 'Thêm Xe Vào Bãi';
    document.getElementById('submitBtn').textContent = 'Thêm Xe';
    
    // Re-enable price field
    const priceField = document.getElementById('price');
    const priceHelp = document.getElementById('priceHelp');
    
    priceField.disabled = false;
    priceField.title = '';
    priceHelp.style.display = 'none';
}

// Exit vehicle
function exitVehicle(id) {
    const vehicle = allVehicles.find(v => v.id === id);
    if (!vehicle) return;
    
    // For monthly parking vehicles, simply update status to OUT without price calculation
    if (vehicle.monthly_parking) {
        if (confirm('Xác nhận cho xe này ra bãi?')) {
            updateVehicleStatus(id, false);
        }
    } else {
        // Show regular hourly modal for price calculation
        exitPrice.value = vehicle.price;
        exitModal.style.display = 'block';
        exitModal.setAttribute('data-vehicle-id', id);
    }
}

// Helper function to update vehicle status
async function updateVehicleStatus(vehicleId, isParking) {
    try {
        await apiCall(`/api/vehicles/${vehicleId}`, 'PUT', {
            exit_date: !isParking ? new Date().toISOString() : null,
            isParking: isParking
        });
        showMessage('Cập nhật trạng thái xe thành công!', 'success');
        loadVehicles();
    } catch (error) {
        console.error('Failed to update vehicle status:', error);
        showMessage('Có lỗi xảy ra khi cập nhật trạng thái xe!', 'error');
    }
}

// Handle exit confirmation
async function handleExitConfirm() {
    const vehicleId = exitModal.getAttribute('data-vehicle-id');
    const price = parseFloat(exitPrice.value) || 0;
    
    if (price < 0) {
        showMessage('Giá tiền không hợp lệ!', 'error');
        return;
    }
    
    try {
        await apiCall(`/api/vehicles/${vehicleId}`, 'PUT', {
            exit_date: new Date().toISOString(),
            price: price,
            isParking: false
        });
        
        showMessage('Xe đã ra bãi thành công!', 'success');
        hideExitModal();
        loadVehicles();
    } catch (error) {
        console.error('Failed to exit vehicle:', error);
    }
}

// Re-enter vehicle
async function reenterVehicle(id) {
    try {
        const vehicle = allVehicles.find(v => v.id === id);
        if (!vehicle) {
            showMessage('Không tìm thấy thông tin xe!', 'error');
            return;
        }
        
        if (vehicle.monthly_parking === 1) {
            // Monthly vehicle: just update parking status
            await apiCall(`/api/vehicles/${id}`, 'PUT', {
                exit_date: null,
                isParking: true
            });
        } else {
            // Hourly vehicle: update parking status back to true
            await apiCall(`/api/vehicles/${id}`, 'PUT', {
                exit_date: null,
                isParking: true,
                price: 0
            });
        }
        
        showMessage('Xe đã vào lại bãi!', 'success');
        loadVehicles();
    } catch (error) {
        console.error('Failed to re-enter vehicle:', error);
    }
}

// Handle confirmation (simplified - no delete functionality)
async function handleConfirmYes() {
    // Future confirmations can be handled here
    hideConfirmModal();
}

// Modal functions
function hideConfirmModal() {
    confirmModal.style.display = 'none';
}

function hideExitModal() {
    exitModal.style.display = 'none';
    exitPrice.value = '';
}

// Edit vehicle modal functions
async function handleEditVehicleSave() {
    if (!currentEditId) return;
    
    try {
        const vehicleData = {
            license_plate: document.getElementById('editLicensePlate').value.trim(),
            vehicle_type: document.getElementById('editVehicleType').value,
            owner_name: document.getElementById('editOwnerName').value.trim(),
            phone: document.getElementById('editPhone').value.trim(),
            price: parseFloat(document.getElementById('editPrice').value) || 0,
            monthly_parking: document.getElementById('editMonthlyParking').checked ? 1 : 0
        };
        
        // Include entry date if it has been changed (keep current time)
        const entryDateField = document.getElementById('editEntryDate');
        if (entryDateField && entryDateField.value) {
            // Only send the date (YYYY-MM-DD), backend will handle time formatting
            vehicleData.entry_date = entryDateField.value;
        }
        
        // Validate required fields (phone is optional)
        if (!vehicleData.license_plate || !vehicleData.owner_name) {
            showMessage('Vui lòng điền đầy đủ thông tin bắt buộc!', 'error');
            return;
        }
        
        // Validate phone number (if provided)
        if (vehicleData.phone && !/^[0-9+\-\s()]+$/.test(vehicleData.phone)) {
            showMessage('Số điện thoại không hợp lệ!', 'error');
            return;
        }
        
        // Update vehicle
        await apiCall(`/api/vehicles/${currentEditId}`, 'PUT', vehicleData);
        
        showMessage('Cập nhật thông tin xe thành công!', 'success');
        hideEditVehicleModal();
        loadVehicles();
    } catch (error) {
        console.error('Failed to update vehicle:', error);
        showMessage('Có lỗi xảy ra khi cập nhật thông tin xe!', 'error');
    }
}

function hideEditVehicleModal() {
    editVehicleModal.style.display = 'none';
    currentEditId = null;
    
    // Reset form
    document.getElementById('editVehicleForm').reset();
}

// Handle monthly exit confirmation
async function handleExitMonthlyConfirm() {
    const vehicleId = exitMonthlyModal.getAttribute('data-vehicle-id');
    const isPaid = monthlyPaid.checked;
    
    try {
        const updateData = {
            exit_date: new Date().toISOString(),
            isParking: false,
            monthly_paid: isPaid
        };
        
        // Add payment date if paid
        if (isPaid) {
            updateData.payment_date = new Date().toISOString();
        }
        
        await apiCall(`/api/vehicles/${vehicleId}`, 'PUT', updateData);
        showMessage('Xe ra bãi thành công!', 'success');
        hideExitMonthlyModal();
        loadVehicles();
    } catch (error) {
        console.error('Failed to exit monthly vehicle:', error);
        showMessage('Có lỗi xảy ra khi cho xe ra bãi!', 'error');
    }
}

// Show payment modal for monthly vehicles
function showPaymentModal(vehicleId) {
    const vehicle = allVehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;
    
    // Parse existing payment data
    let payments = {};
    try {
        payments = vehicle.monthly_payments ? JSON.parse(vehicle.monthly_payments) : {};
    } catch (e) {
        payments = {};
    }
    
    // Update modal title with vehicle info
    const modalTitle = document.querySelector('#paymentModal h3');
    if (modalTitle) {
        modalTitle.innerHTML = `
            💰 Cập nhật thanh toán tháng<br>
            <small style="font-weight: normal; color: #666; font-size: 14px;">
                🚗 ${formatLicensePlate(vehicle.license_plate).replace('<br>', ' ')} | 
                👤 ${vehicle.owner_name || 'N/A'} | 
                📞 ${vehicle.phone || 'N/A'} | 
                🚙 ${vehicle.vehicle_type || 'N/A'}
            </small>
        `;
    }
    
    // Load existing payment status, dates and amounts
    for (let i = 1; i <= 12; i++) {
        const checkbox = document.getElementById(`month${i}`);
        const dateInput = document.getElementById(`date${i}`);
        const amountInput = document.getElementById(`amount${i}`);
        const monthItem = checkbox.closest('.month-payment-item');
        
        if (checkbox && dateInput && amountInput) {
            const monthData = payments[i] || {};
            checkbox.checked = monthData.paid || false;
            dateInput.value = monthData.date || '';
            amountInput.value = monthData.amount || '';
            dateInput.disabled = !checkbox.checked;
            amountInput.disabled = !checkbox.checked;
            
            // Update visual style
            if (checkbox.checked) {
                monthItem.classList.add('paid');
            } else {
                monthItem.classList.remove('paid');
            }
            
            // Set default date for unpaid months when opened
            if (!checkbox.checked) {
                dateInput.value = new Date().toISOString().split('T')[0];
            }
            
            // Add event listener for checkbox change
            checkbox.addEventListener('change', function() {
                dateInput.disabled = !this.checked;
                amountInput.disabled = !this.checked;
                if (this.checked) {
                    monthItem.classList.add('paid');
                    // Always set to current date when checking
                    dateInput.value = new Date().toISOString().split('T')[0];
                } else {
                    monthItem.classList.remove('paid');
                    dateInput.value = '';
                }
            });
        }
    }
    
    paymentModal.style.display = 'block';
    paymentModal.setAttribute('data-vehicle-id', vehicleId);
}

// Handle payment confirmation
async function handlePaymentConfirm() {
    const vehicleId = paymentModal.getAttribute('data-vehicle-id');
    
    // Collect payment data with dates and amounts
    const payments = {};
    for (let i = 1; i <= 12; i++) {
        const checkbox = document.getElementById(`month${i}`);
        const dateInput = document.getElementById(`date${i}`);
        const amountInput = document.getElementById(`amount${i}`);
        if (checkbox && dateInput && amountInput) {
            payments[i] = {
                paid: checkbox.checked,
                date: checkbox.checked ? (dateInput.value || new Date().toISOString().split('T')[0]) : null,
                amount: checkbox.checked ? (parseFloat(amountInput.value) || 0) : 0
            };
        }
    }
    
    console.log('Sending payment data:', {
        monthly_payments: JSON.stringify(payments),
        payment_date: new Date().toISOString()
    });
    
    try {
        await apiCall(`/api/vehicles/${vehicleId}`, 'PUT', {
            monthly_payments: JSON.stringify(payments),
            payment_date: new Date().toISOString()
        });
        
        showMessage('Cập nhật thanh toán thành công!', 'success');
        hidePaymentModal();
        loadVehicles();
    } catch (error) {
        console.error('Failed to update payment:', error);
        showMessage('Có lỗi xảy ra khi cập nhật thanh toán!', 'error');
    }
}

// View payment details (read-only)
function viewPaymentDetails(vehicleId) {
    const vehicle = allVehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;
    
    let payments = {};
    try {
        payments = vehicle.monthly_payments ? JSON.parse(vehicle.monthly_payments) : {};
    } catch (e) {
        payments = {};
    }
    
    // Update modal title with vehicle info
    const viewModalTitle = document.querySelector('#viewPaymentModal h3');
    if (viewModalTitle) {
        viewModalTitle.innerHTML = `
            📋 Chi tiết thanh toán<br>
            <small style="font-weight: normal; color: #666; font-size: 14px;">
                🚗 ${formatLicensePlate(vehicle.license_plate).replace('<br>', ' ')} | 
                👤 ${vehicle.owner_name || 'N/A'} | 
                📞 ${vehicle.phone || 'N/A'} | 
                🚙 ${vehicle.vehicle_type || 'N/A'}
            </small>
        `;
    }
    
    // Generate read-only payment details (without card)
    let detailsHTML = '';
    for (let i = 1; i <= 12; i++) {
        const monthData = payments[i] || {};
        const isPaid = monthData.paid || false;
        const paymentDate = monthData.date || '';
        const paymentAmount = monthData.amount || 0;
        const statusClass = isPaid ? 'status-in' : 'status-out';
        const statusText = isPaid ? '✓ Đã thanh toán' : '✗ Chưa thanh toán';
        
        detailsHTML += `
            <div class="month-payment-item ${isPaid ? 'paid' : ''}">
                <h4>Tháng ${i}</h4>
                <span class="status-badge ${statusClass}">
                    ${statusText}
                </span>
                ${isPaid && paymentAmount > 0 ? `<br><small>Số tiền: ${formatCurrency(paymentAmount)}</small>` : ''}
                ${isPaid && paymentDate ? `<br><small>Ngày: ${formatDate(paymentDate)}</small>` : ''}
            </div>
        `;
    }
    
    paymentDetails.innerHTML = detailsHTML;
    viewPaymentModal.style.display = 'block';
}

// Helper function to format date only (dd/mm/yyyy)
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric'
    });
}

// Helper function to format date and time
function formatDateTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Helper function to format currency
function formatCurrency(amount) {
    if (!amount) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { 
        style: 'currency', 
        currency: 'VND',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// Format license plate - replace spaces with line breaks
function formatLicensePlate(licensePlate) {
    if (!licensePlate) return '';
    return licensePlate.toString().replace(/\s+/g, '<br>');
}

function showMessage(message, type) {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    // Insert at the top of the container
    const container = document.querySelector('.container');
    container.insertBefore(messageDiv, container.firstChild.nextSibling);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

// Export all vehicles to Excel (2 sheets)
async function exportMonthlyToExcel() {
    try {
        showMessage('Đang xuất file Excel (2 sheets)...', 'success');
        
        const response = await fetch('/api/export/all');
        
        if (!response.ok) {
            throw new Error('Lỗi khi xuất file Excel');
        }
        
        // Create blob from response
        const blob = await response.blob();
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `quan-ly-bai-xe-${new Date().toISOString().split('T')[0]}.xlsx`;
        
        // Trigger download
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showMessage('Xuất file Excel thành công (2 sheets: Xe gửi tháng & Xe gửi theo giờ)!', 'success');
        
    } catch (error) {
        console.error('Export error:', error);
        showMessage('Lỗi khi xuất file Excel: ' + error.message, 'error');
    }
}

// Import vehicles from Excel
function importFromExcel() {
    const fileInput = document.getElementById('excelFileInput');
    fileInput.click();
    
    fileInput.onchange = async function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const formData = new FormData();
        formData.append('file', file);
        
        try {
            const response = await fetch('/api/import-excel', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (response.ok) {
                showMessage(`${result.message}. Đã import ${result.imported} xe.`, 'success');
                if (result.errors && result.errors.length > 0) {
                    console.warn('Import errors:', result.errors);
                    showMessage(`Có ${result.errors.length} lỗi khi import. Kiểm tra console để xem chi tiết.`, 'warning');
                }
                loadVehicles(); // Reload the vehicle list
            } else {
                throw new Error(result.error || 'Có lỗi xảy ra khi import');
            }
        } catch (error) {
            console.error('Import error:', error);
            showMessage('Lỗi import Excel: ' + error.message, 'error');
        }
        
        // Reset file input
        fileInput.value = '';
    };
}

// Clear all data for testing
async function clearAllData() {
     if (!confirm('⚠️ CẢNH BÁO: Bạn có chắc chắn muốn xóa TOÀN BỘ dữ liệu không?\n\nHành động này không thể hoàn tác!')) {
        return;
    }
    
    if (!confirm('🚨 XÁC NHẬN LẦN 2: Tính năng chỉ có ở server test')) {
        return;
    }
    
    // try {
    //     const response = await fetch('/api/clear-all-data', {
    //         method: 'DELETE'
    //     });
        
    //     const result = await response.json();
        
    //     if (response.ok) {
    //         showMessage('✅ ' + result.message, 'success');
    //         // Reload the page to refresh all tables
    //         setTimeout(() => {
    //             loadVehicles();
    //         }, 1000);
    //     } else {
    //         throw new Error(result.error || 'Có lỗi xảy ra khi xóa dữ liệu');
    //     }
    // } catch (error) {
    //     console.error('Clear data error:', error);
    //     showMessage('❌ Lỗi xóa dữ liệu: ' + error.message, 'error');
    // }
}

// Delete individual vehicle
async function deleteVehicle(vehicleId) {
    // Find vehicle info for confirmation message
    const vehicle = allVehicles.find(v => v.id === vehicleId);
    if (!vehicle) {
        showMessage('Không tìm thấy thông tin xe', 'error');
        return;
    }
    
    const confirmMessage = `Bạn có chắc chắn muốn xóa xe "${vehicle.license_plate}" của ${vehicle.owner_name}?\n\nHành động này không thể hoàn tác!`;
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/vehicles/${vehicleId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showMessage(result.message, 'success');
            loadVehicles(); // Reload the vehicle list
        } else {
            throw new Error(result.error || 'Có lỗi xảy ra khi xóa xe');
        }
    } catch (error) {
        console.error('Delete vehicle error:', error);
        showMessage('Lỗi xóa xe: ' + error.message, 'error');
    }
}

// Modal hide functions
function hidePaymentModal() {
    paymentModal.style.display = 'none';
    
    // Reset modal title to default
    const modalTitle = document.querySelector('#paymentModal h3');
    if (modalTitle) {
        modalTitle.innerHTML = '💰 Thanh Toán Xe Gửi Tháng';
    }
    
    // Reset checkboxes, date inputs, and amount inputs
    for (let i = 1; i <= 12; i++) {
        const checkbox = document.getElementById(`month${i}`);
        const dateInput = document.getElementById(`date${i}`);
        const amountInput = document.getElementById(`amount${i}`);
        if (checkbox) checkbox.checked = false;
        if (dateInput) dateInput.value = '';
        if (amountInput) amountInput.value = '';
    }
}

function hideViewPaymentModal() {
    viewPaymentModal.style.display = 'none';
    
    // Reset modal title to default
    const viewModalTitle = document.querySelector('#viewPaymentModal h3');
    if (viewModalTitle) {
        viewModalTitle.innerHTML = '📋 Chi Tiết Thanh Toán';
    }
}

// Pagination functions
function updateMonthlyPagination(totalItems) {
    console.log('updateMonthlyPagination called with totalItems:', totalItems);
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    console.log('totalPages:', totalPages, 'currentPage:', currentMonthlyPage);
    
    let paginationContainer = document.getElementById('monthlyPagination');
    
    if (!paginationContainer) {
        console.log('Creating new pagination container for monthly');
        // Create pagination container after the monthly table
        const monthlyTable = document.getElementById('monthlyVehicleTable');
        if (monthlyTable) {
            const tableContainer = monthlyTable.parentElement;
            const paginationDiv = document.createElement('div');
            paginationDiv.id = 'monthlyPagination';
            paginationDiv.className = 'pagination-container';
            // Insert after the table container
            tableContainer.parentNode.insertBefore(paginationDiv, tableContainer.nextSibling);
            paginationContainer = paginationDiv;
            console.log('Monthly pagination container created');
        } else {
            console.error('Monthly table not found!');
            return;
        }
    }
    
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    let paginationHTML = '<div class="pagination">';
    
    // Always show Previous button (disabled if on first page)
    if (currentMonthlyPage > 1) {
        paginationHTML += `<button class="pagination-btn" onclick="goToMonthlyPage(${currentMonthlyPage - 1})">‹ Trước</button>`;
    } else {
        paginationHTML += `<button class="pagination-btn" disabled>‹ Trước</button>`;
    }
    
    // Smart page number display
    const { startPage, endPage, showStartEllipsis, showEndEllipsis } = getPageRange(currentMonthlyPage, totalPages);
    
    // First page
    if (showStartEllipsis) {
        paginationHTML += `<button class="pagination-btn" onclick="goToMonthlyPage(1)">1</button>`;
        if (startPage > 2) {
            paginationHTML += `<span class="pagination-ellipsis">...</span>`;
        }
    }
    
    // Page numbers in range
    for (let i = startPage; i <= endPage; i++) {
        if (i === currentMonthlyPage) {
            paginationHTML += `<button class="pagination-btn active">${i}</button>`;
        } else {
            paginationHTML += `<button class="pagination-btn" onclick="goToMonthlyPage(${i})">${i}</button>`;
        }
    }
    
    // Last page
    if (showEndEllipsis) {
        if (endPage < totalPages - 1) {
            paginationHTML += `<span class="pagination-ellipsis">...</span>`;
        }
        paginationHTML += `<button class="pagination-btn" onclick="goToMonthlyPage(${totalPages})">${totalPages}</button>`;
    }
    
    // Always show Next button (disabled if on last page)
    if (currentMonthlyPage < totalPages) {
        paginationHTML += `<button class="pagination-btn" onclick="goToMonthlyPage(${currentMonthlyPage + 1})">Sau ›</button>`;
    } else {
        paginationHTML += `<button class="pagination-btn" disabled>Sau ›</button>`;
    }
    
    paginationHTML += '</div>';
    paginationHTML += `<div class="pagination-info">Trang ${currentMonthlyPage} / ${totalPages} (${totalItems} xe)</div>`;
    
    paginationContainer.innerHTML = paginationHTML;
    console.log('Monthly pagination HTML updated');
}

function updateHourlyPagination(totalItems) {
    console.log('updateHourlyPagination called with totalItems:', totalItems);
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    console.log('totalPages:', totalPages, 'currentPage:', currentHourlyPage);
    
    let paginationContainer = document.getElementById('hourlyPagination');
    
    if (!paginationContainer) {
        console.log('Creating new pagination container for hourly');
        // Create pagination container after the hourly table
        const hourlyTable = document.getElementById('hourlyVehicleTable');
        if (hourlyTable) {
            const tableContainer = hourlyTable.parentElement;
            const paginationDiv = document.createElement('div');
            paginationDiv.id = 'hourlyPagination';
            paginationDiv.className = 'pagination-container';
            // Insert after the table container
            tableContainer.parentNode.insertBefore(paginationDiv, tableContainer.nextSibling);
            paginationContainer = paginationDiv;
            console.log('Hourly pagination container created');
        } else {
            console.error('Hourly table not found!');
            return;
        }
    }
    
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    let paginationHTML = '<div class="pagination">';
    
    // Always show Previous button (disabled if on first page)
    if (currentHourlyPage > 1) {
        paginationHTML += `<button class="pagination-btn" onclick="goToHourlyPage(${currentHourlyPage - 1})">‹ Trước</button>`;
    } else {
        paginationHTML += `<button class="pagination-btn" disabled>‹ Trước</button>`;
    }
    
    // Smart page number display
    const { startPage, endPage, showStartEllipsis, showEndEllipsis } = getPageRange(currentHourlyPage, totalPages);
    
    // First page
    if (showStartEllipsis) {
        paginationHTML += `<button class="pagination-btn" onclick="goToHourlyPage(1)">1</button>`;
        if (startPage > 2) {
            paginationHTML += `<span class="pagination-ellipsis">...</span>`;
        }
    }
    
    // Page numbers in range
    for (let i = startPage; i <= endPage; i++) {
        if (i === currentHourlyPage) {
            paginationHTML += `<button class="pagination-btn active">${i}</button>`;
        } else {
            paginationHTML += `<button class="pagination-btn" onclick="goToHourlyPage(${i})">${i}</button>`;
        }
    }
    
    // Last page
    if (showEndEllipsis) {
        if (endPage < totalPages - 1) {
            paginationHTML += `<span class="pagination-ellipsis">...</span>`;
        }
        paginationHTML += `<button class="pagination-btn" onclick="goToHourlyPage(${totalPages})">${totalPages}</button>`;
    }
    
    // Always show Next button (disabled if on last page)
    if (currentHourlyPage < totalPages) {
        paginationHTML += `<button class="pagination-btn" onclick="goToHourlyPage(${currentHourlyPage + 1})">Sau ›</button>`;
    } else {
        paginationHTML += `<button class="pagination-btn" disabled>Sau ›</button>`;
    }
    
    paginationHTML += '</div>';
    paginationHTML += `<div class="pagination-info">Trang ${currentHourlyPage} / ${totalPages} (${totalItems} xe)</div>`;
    
    paginationContainer.innerHTML = paginationHTML;
    console.log('Hourly pagination HTML updated');
}

function goToMonthlyPage(page) {
    console.log('goToMonthlyPage called with page:', page);
    currentMonthlyPage = page;
    filterMonthlyVehicles(false); // Don't reset page when navigating
}

function goToHourlyPage(page) {
    console.log('goToHourlyPage called with page:', page);
    currentHourlyPage = page;
    filterHourlyVehicles(false); // Don't reset page when navigating
}

// Helper function to calculate page range for smart pagination
function getPageRange(currentPage, totalPages) {
    const maxVisible = 5; // Maximum number of page buttons to show
    let startPage, endPage;
    let showStartEllipsis = false;
    let showEndEllipsis = false;
    
    if (totalPages <= maxVisible) {
        // Show all pages if total is small
        startPage = 1;
        endPage = totalPages;
    } else {
        // Calculate range around current page
        const halfVisible = Math.floor((maxVisible - 2) / 2); // -2 for first and last page
        
        if (currentPage <= halfVisible + 1) {
            // Near the beginning
            startPage = 1;
            endPage = maxVisible - 1;
            showEndEllipsis = true;
        } else if (currentPage >= totalPages - halfVisible) {
            // Near the end
            startPage = totalPages - maxVisible + 2;
            endPage = totalPages;
            showStartEllipsis = true;
        } else {
            // In the middle
            startPage = currentPage - halfVisible;
            endPage = currentPage + halfVisible;
            showStartEllipsis = true;
            showEndEllipsis = true;
        }
    }
    
    return { startPage, endPage, showStartEllipsis, showEndEllipsis };
}

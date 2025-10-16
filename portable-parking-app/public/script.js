// Global variables
let currentEditId = null;
let allVehicles = [];

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

// Render monthly vehicles table
function renderMonthlyVehicles(vehicles) {
    console.log('renderMonthlyVehicles called with', vehicles.length, 'vehicles');
    monthlyVehicleTableBody.innerHTML = '';
    
    if (vehicles.length === 0) {
        console.log('No monthly vehicles to display');
        monthlyVehicleTableBody.innerHTML = `
            <tr>
                <td colspan="10" style="text-align: center; padding: 40px; color: #666;">
                    Chưa có xe gửi tháng nào
                </td>
            </tr>
        `;
        return;
    }
    
    vehicles.forEach((vehicle, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td><strong>${formatLicensePlate(vehicle.license_plate)}</strong></td>
            <td>${vehicle.vehicle_type}</td>
            <td>${vehicle.owner_name}</td>
            <td>${vehicle.phone}</td>
            <td>${formatDateTime(vehicle.entry_date)}</td>
            <td>${vehicle.exit_date ? formatDateTime(vehicle.exit_date) : '-'}</td>
            <td>${formatCurrency(vehicle.price)}</td>
            <td>
                <span class="payment-detail-link" onclick="viewPaymentDetails(${vehicle.id})">
                    📋 Click để xem chi tiết
                </span>
            </td>
            <td>
                <span class="status-badge ${vehicle.status === 'IN' ? 'status-in' : 'status-out'}">
                    ${vehicle.status === 'IN' ? 'Trong bãi' : 'Đã ra'}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-primary" onclick="editVehicle(${vehicle.id})">Sửa</button>
                    <button class="btn btn-success" onclick="showPaymentModal(${vehicle.id})" title="Thanh toán">💰</button>
                    ${vehicle.status === 'IN' ? 
                        `<button class="btn btn-danger" onclick="exitVehicle(${vehicle.id})">Xe ra</button>` : 
                        `<button class="btn btn-secondary" onclick="reenterVehicle(${vehicle.id})">Vào lại</button>`
                    }
                </div>
            </td>
        `;
        monthlyVehicleTableBody.appendChild(row);
    });
}

// Render hourly vehicles table
function renderHourlyVehicles(vehicles) {
    hourlyVehicleTableBody.innerHTML = '';
    
    if (vehicles.length === 0) {
        hourlyVehicleTableBody.innerHTML = `
            <tr>
                <td colspan="10" style="text-align: center; padding: 40px; color: #666;">
                    Chưa có xe gửi theo giờ nào
                </td>
            </tr>
        `;
        return;
    }
    
    vehicles.forEach((vehicle, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td><strong>${formatLicensePlate(vehicle.license_plate)}</strong></td>
            <td>${vehicle.vehicle_type}</td>
            <td>${vehicle.owner_name}</td>
            <td>${vehicle.phone}</td>
            <td>${formatDateTime(vehicle.entry_date)}</td>
            <td>${vehicle.exit_date ? formatDateTime(vehicle.exit_date) : '-'}</td>
            <td>${formatCurrency(vehicle.price)}</td>
            <td>
                <span class="status-badge ${vehicle.status === 'IN' ? 'status-in' : 'status-out'}">
                    ${vehicle.status === 'IN' ? 'Trong bãi' : 'Đã ra'}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-primary" onclick="editVehicle(${vehicle.id})">Sửa</button>
                    ${vehicle.status === 'IN' ? 
                        `<button class="btn btn-success" onclick="exitVehicle(${vehicle.id})">Xe ra</button>` : 
                        `<button class="btn btn-secondary" onclick="reenterVehicle(${vehicle.id})">Vào lại</button>`
                    }
                </div>
            </td>
        `;
        hourlyVehicleTableBody.appendChild(row);
    });
}

// Filter monthly vehicles
function filterMonthlyVehicles() {
    const searchTerm = searchMonthlyInput.value.toLowerCase();
    const statusFilterValue = statusMonthlyFilter.value;
    
    let filteredVehicles = allVehicles.filter(vehicle => {
        const isMonthly = vehicle.monthly_parking === 1;
        const matchesSearch = vehicle.license_plate.toLowerCase().includes(searchTerm) ||
                            vehicle.owner_name.toLowerCase().includes(searchTerm);
        const matchesStatus = !statusFilterValue || vehicle.status === statusFilterValue;
        
        return isMonthly && matchesSearch && matchesStatus;
    });
    
    renderMonthlyVehicles(filteredVehicles);
}

// Filter hourly vehicles
function filterHourlyVehicles() {
    const searchTerm = searchHourlyInput.value.toLowerCase();
    const statusFilterValue = statusHourlyFilter.value;
    
    let filteredVehicles = allVehicles.filter(vehicle => {
        const isHourly = vehicle.monthly_parking !== 1;
        const matchesSearch = vehicle.license_plate.toLowerCase().includes(searchTerm) ||
                            vehicle.owner_name.toLowerCase().includes(searchTerm);
        const matchesStatus = !statusFilterValue || vehicle.status === statusFilterValue;
        
        return isHourly && matchesSearch && matchesStatus;
    });
    
    renderHourlyVehicles(filteredVehicles);
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
    try {
        const vehicle = await apiCall(`/api/vehicles/${id}`);
        
        // Fill form with vehicle data
        document.getElementById('licensePlate').value = vehicle.license_plate;
        document.getElementById('vehicleType').value = vehicle.vehicle_type;
        document.getElementById('ownerName').value = vehicle.owner_name;
        document.getElementById('phone').value = vehicle.phone;
        document.getElementById('price').value = vehicle.price;
        document.getElementById('monthlyParking').checked = vehicle.monthly_parking === 1;
        
        // Disable price field if vehicle has exited
        const priceField = document.getElementById('price');
        const priceHelp = document.getElementById('priceHelp');
        
        if (vehicle.status === 'OUT') {
            priceField.disabled = true;
            priceField.title = 'Không thể sửa giá tiền cho xe đã ra bãi';
            priceHelp.style.display = 'block';
        } else {
            priceField.disabled = false;
            priceField.title = '';
            priceHelp.style.display = 'none';
        }
        
        currentEditId = id;
        cancelBtn.style.display = 'inline-block';
        
        // Update form title to indicate editing
        document.querySelector('.form-section h2').textContent = 
            `Sửa thông tin xe ${vehicle.license_plate} ${vehicle.status === 'OUT' ? '(Đã ra bãi)' : '(Trong bãi)'}`;
        
        // Change submit button text to "Cập nhật"
        document.getElementById('submitBtn').textContent = 'Cập nhật';
        
        // Scroll to form
        document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Failed to load vehicle for editing:', error);
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
            updateVehicleStatus(id, 'OUT');
        }
    } else {
        // Show regular hourly modal for price calculation
        exitPrice.value = vehicle.price;
        exitModal.style.display = 'block';
        exitModal.setAttribute('data-vehicle-id', id);
    }
}

// Helper function to update vehicle status
async function updateVehicleStatus(vehicleId, status) {
    try {
        await apiCall(`/api/vehicles/${vehicleId}`, 'PUT', {
            exit_date: new Date().toISOString(),
            status: status
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
            status: 'OUT'
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
            // Monthly vehicle: just update status
            await apiCall(`/api/vehicles/${id}`, 'PUT', {
                exit_date: null,
                status: 'IN'
            });
        } else {
            // Hourly vehicle: create new entry (as it was removed from main table)
            await apiCall('/api/vehicles', 'POST', {
                license_plate: vehicle.license_plate,
                vehicle_type: vehicle.vehicle_type,
                owner_name: vehicle.owner_name,
                phone: vehicle.phone,
                price: 0,
                is_monthly: false
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

// Handle monthly exit confirmation
async function handleExitMonthlyConfirm() {
    const vehicleId = exitMonthlyModal.getAttribute('data-vehicle-id');
    const isPaid = monthlyPaid.checked;
    
    try {
        const updateData = {
            exit_date: new Date().toISOString(),
            status: 'OUT',
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

// Helper function to format date
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
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
    
    if (!confirm('🚨 XÁC NHẬN LẦN 2: Tất cả xe và lịch sử sẽ bị xóa vĩnh viễn!\n\nBạn có chắc chắn tiếp tục?')) {
        return;
    }
    
    try {
        const response = await fetch('/api/clear-all-data', {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showMessage('✅ ' + result.message, 'success');
            // Reload the page to refresh all tables
            setTimeout(() => {
                loadVehicles();
            }, 1000);
        } else {
            throw new Error(result.error || 'Có lỗi xảy ra khi xóa dữ liệu');
        }
    } catch (error) {
        console.error('Clear data error:', error);
        showMessage('❌ Lỗi xóa dữ liệu: ' + error.message, 'error');
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

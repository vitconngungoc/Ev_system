// ============================================================================
// APP.JS - GREEN FUTURE EV RENTAL SYSTEM
// ============================================================================

const API_BASE = 'http://localhost:8080/api';
const API = {
    auth: {
        login: `${API_BASE}/auth/login`,
        register: `${API_BASE}/auth/register`
    },
    profile: {
        role: `${API_BASE}/profile/role`,
        get: `${API_BASE}/profile`
    },
    stations: `${API_BASE}/stations`,
    models: `${API_BASE}/models`,
    vehicles: `${API_BASE}/vehicles`,
    bookings: {
        create: `${API_BASE}/bookings`,
        myBookings: `${API_BASE}/renter/my-bookings`, // ✅ SỬA: /renter/my-bookings thay vì /bookings/my-bookings
        getById: (id) => `${API_BASE}/bookings/${id}`,
        calculatePrice: `${API_BASE}/bookings/calculate-price`
    },
    staff: {
        station: `${API_BASE}/staff/my-station`,
        stats: `${API_BASE}/staff/dashboard/stats`,
        bookings: `${API_BASE}/staff/bookings`,
        penaltyFees: `${API_BASE}/staff/penalty-fees`,
        contracts: `${API_BASE}/staff/contracts`, // ✅ THÊM
        invoices: `${API_BASE}/staff/invoices`, // ✅ THÊM
        verifications: `${API_BASE}/staff/verifications/pending`, // ✅ THÊM
        confirmDeposit: (bookingId) => `${API_BASE}/staff/bookings/${bookingId}/confirm-deposit`, // ✅ THÊM
        checkIn: (bookingId) => `${API_BASE}/staff/rentals/check-in/${bookingId}`, // ✅ THÊM
        calculateBill: (bookingId) => `${API_BASE}/staff/bookings/${bookingId}/calculate-bill`, // ✅ THÊM
        confirmPayment: (bookingId) => `${API_BASE}/staff/bookings/${bookingId}/confirm-payment` // ✅ THÊM
    }
};

// Global State
let currentUser = null;
let currentRole = null;
let selectedStation = null;
let selectedStationName = null;
let selectedFilters = {
    stationId: null,
    startTime: null,
    endTime: null
};
// ✅ THÊM: Cache để lưu thông tin models
let modelsCache = {};

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing application...');

    if (initializeApp()) {
        setupEventListeners();
        checkAuth();
    }
});

function setupEventListeners() {
    console.log('Setting up event listeners...');

    // ✅ KIỂM TRA VÀ GẮN EVENT LISTENERS CHO AUTH FORMS
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const logoutBtn = document.getElementById('logout-btn');

    if (loginForm) {
        console.log('Login form found, attaching event listener');
        loginForm.addEventListener('submit', handleLogin);
    } else {
        console.error('Login form not found!');
    }

    if (registerForm) {
        console.log('Register form found, attaching event listener');
        registerForm.addEventListener('submit', handleRegister);
    } else {
        console.error('Register form not found!');
    }

    if (logoutBtn) {
        console.log('Logout button found, attaching event listener');
        logoutBtn.addEventListener('click', handleLogout);
    } else {
        console.log('Logout button not found (normal if not logged in)');
    }

    // ��� KIỂM TRA VÀ GẮN EVENT LISTENERS CHO RENTER FEATURES
    const stationSelect = document.getElementById('station-select');
    if (stationSelect) {
        console.log('Station select found, attaching event listener');
        stationSelect.addEventListener('change', handleStationSelect);
    }

    const searchForm = document.getElementById('search-form');
    if (searchForm) {
        console.log('Search form found, attaching event listener');
        searchForm.addEventListener('submit', handleSearch);
    }

    const bookingForm = document.getElementById('booking-form');
    if (bookingForm) {
        console.log('Booking form found, attaching event listener');
        bookingForm.addEventListener('submit', handleBooking);
    }

    // ✅ THÊM EVENT LISTENERS CHO MODAL CLOSE
    setupModalEventListeners();

    console.log('All event listeners setup completed');
}

// ✅ THÊM: Setup modal event listeners
function setupModalEventListeners() {
    // Close modals when clicking outside
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
            // ✅ SỬA: Restore overflow khi đóng modal
            document.body.style.overflow = '';
        }
    });

    // Close modals with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const activeModal = document.querySelector('.modal.active');
            if (activeModal) {
                activeModal.classList.remove('active');
                // ✅ SỬA: Restore overflow khi đóng modal
                document.body.style.overflow = '';
            }
        }
    });
}

// ============================================================================
// AUTHENTICATION
// ============================================================================

async function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        showView('auth-view');
        return;
    }

    try {
        const response = await fetch(API.profile.role, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Invalid token');

        const data = await response.json();
        currentUser = data;
        currentRole = data.role;

        updateUserInfo(data);

        if (currentRole === 'EV_RENTER') {
            showView('renter-view');
            await initRenterView();
        } else if (currentRole === 'STATION_STAFF') {
            showView('staff-view');
            await initStaffView();
        } else {
            throw new Error('Invalid role');
        }

    } catch (error) {
        console.error('Auth failed:', error);
        localStorage.removeItem('token');
        showView('auth-view');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const identifier = document.getElementById('login-identifier').value.trim();
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch(API.auth.login, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier, password })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Đăng nhập thất bại');
        }

        const data = await response.json();
        localStorage.setItem('token', data.token);
        
        showToast('Đăng nhập thành công!', 'success');
        e.target.reset();
        await checkAuth();

    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const form = e.target;
    
    const password = form['reg-password'].value;
    const confirmPassword = form['reg-confirmPassword'].value;

    if (password !== confirmPassword) {
        showToast('Mật khẩu xác nhận không khớp', 'warning');
        return;
    }

    const data = {
        fullName: form['reg-fullName'].value.trim(),
        email: form['reg-email'].value.trim(),
        phone: form['reg-phone'].value.trim(),
        password: password,
        agreedToTerms: form['reg-agreedToTerms'].checked
    };

    try {
        const response = await fetch(API.auth.register, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Đăng ký thất bại');
        }

        showToast('Đăng ký thành công! Vui lòng đăng nhập.', 'success');
        form.reset();

    } catch (error) {
        showToast(error.message, 'error');
    }
}

function handleLogout() {
    localStorage.removeItem('token');
    currentUser = null;
    currentRole = null;
    selectedStation = null;
    selectedStationName = null;
    selectedFilters = { stationId: null, startTime: null, endTime: null };
    showView('auth-view');
    showToast('Đã đăng xuất', 'info');
}

function updateUserInfo(user) {
    const userInfo = document.getElementById('user-info');
    const logoutBtn = document.getElementById('logout-btn');
    
    if (userInfo && user) {
        userInfo.textContent = `${user.fullName || user.email}`;
        userInfo.style.display = 'block';
    }
    
    if (logoutBtn) {
        logoutBtn.style.display = 'block';
    }
}

// ============================================================================
// RENTER FUNCTIONS - BƯỚC 1: CHỌN TRẠM
// ============================================================================

async function initRenterView() {
    await loadStations();
    await loadMyBookings();

    // Reset về bước 1
    document.getElementById('page-select-station').style.display = 'block';
    document.getElementById('page-models').style.display = 'none';
}

async function loadStations() {
    const select = document.getElementById('station-select');
    if (!select) return;

    try {
        const response = await fetch(API.stations);
        if (!response.ok) throw new Error('Không thể tải danh sách trạm');

        const stations = await response.json();
        select.innerHTML = '<option value="">-- Vui lòng chọn trạm --</option>';

        // ✅ SỬA: Load trạm vào cả 2 dropdowns
        const filterSelect = document.getElementById('filter-station-select');
        if (filterSelect) {
            filterSelect.innerHTML = '<option value="">-- Chọn trạm --</option>';

            // ✅ SỬA: Xóa event listener cũ trước khi gắn mới để tránh duplicate
            filterSelect.removeEventListener('change', handleFilterStationChange);
        }

        stations.forEach(station => {
            const option = document.createElement('option');
            option.value = station.stationId || station.id;
            option.textContent = `${station.name} - ${station.address}`;
            option.dataset.name = station.name;
            option.dataset.address = station.address;
            select.appendChild(option);

            // ✅ THÊM: Clone option cho filter dropdown
            if (filterSelect) {
                const filterOption = option.cloneNode(true);
                filterSelect.appendChild(filterOption);
            }
        });

        // ✅ THÊM: Gắn event listener cho filter station select
        if (filterSelect) {
            filterSelect.addEventListener('change', handleFilterStationChange);
        }

    } catch (error) {
        showToast(error.message, 'error');
    }
}

// ✅ THÊM: Xử lý khi thay đổi trạm trong bộ lọc
async function handleFilterStationChange(e) {
    const stationId = e.target.value;

    if (!stationId) {
        showToast('Vui lòng chọn trạm', 'warning');
        return;
    }

    const selectedOption = e.target.options[e.target.selectedIndex];
    selectedStation = stationId;
    selectedStationName = `${selectedOption.dataset.name} - ${selectedOption.dataset.address}`;
    selectedFilters.stationId = stationId;

    document.getElementById('selected-station-id').value = stationId;

    // Đồng bộ với dropdown chính
    const mainSelect = document.getElementById('station-select');
    if (mainSelect) {
        mainSelect.value = stationId;
    }

    // Load lại models của trạm mới
    await loadStationModels(stationId);
    showToast(`Đã chuyển sang trạm: ${selectedOption.dataset.name}`, 'success');
}

// BƯỚC 1 → BƯỚC 2: Khi chọn trạm xong ở trang 1
async function handleStationSelect(e) {
    const stationId = e.target.value;

    if (!stationId) {
        // Nếu bỏ chọn trạm, quay về bước 1
        document.getElementById('page-select-station').style.display = 'block';
        document.getElementById('page-models').style.display = 'none';
        return;
    }

    const selectedOption = e.target.options[e.target.selectedIndex];
    selectedStation = stationId;
    selectedStationName = `${selectedOption.dataset.name} - ${selectedOption.dataset.address}`;
    selectedFilters.stationId = stationId;

    // Ẩn bước 1, hiện bước 2
    document.getElementById('page-select-station').style.display = 'none';
    document.getElementById('page-models').style.display = 'block';

    // Cập nhật dropdown trong bộ lọc
    const filterStationSelect = document.getElementById('filter-station-select');
    if (filterStationSelect) {
        filterStationSelect.value = stationId;
    }

    document.getElementById('selected-station-id').value = stationId;

    // Set minimum datetime to now
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    const minDateTime = now.toISOString().slice(0, 16);
    document.getElementById('filter-start-time').min = minDateTime;
    document.getElementById('filter-end-time').min = minDateTime;

    // Reset filters về null khi mới chọn trạm
    selectedFilters.startTime = null;
    selectedFilters.endTime = null;

    // Load models của trạm sử dụng API search (không có thời gian)
    await loadStationModels(stationId);
}

// Quay lại bước 1
function backToStationSelection() {
    document.getElementById('page-select-station').style.display = 'block';
    document.getElementById('page-models').style.display = 'none';
    document.getElementById('station-select').value = '';
    selectedStation = null;
    selectedStationName = null;
    selectedFilters = { stationId: null, startTime: null, endTime: null };
}

// ============================================================================
// BƯỚC 2: HIỂN THỊ MODELS VÀ FILTER
// ============================================================================

async function loadStationModels(stationId) {
    const container = document.getElementById('models-list');
    const title = document.getElementById('models-title');

    container.innerHTML = '<div style="padding: 2rem; text-align: center;"><div class="loading"></div> Đang tải danh sách xe...</div>';
    title.textContent = 'Danh sách xe tại trạm';

    try {
        // Sử dụng API search không có thời gian để lấy tất cả models
        const response = await fetch(`${API.stations}/${stationId}/models/search`);
        if (!response.ok) throw new Error('Không thể tải danh sách xe');

        const models = await response.json();

        // Lưu models vào cache
        models.forEach(model => {
            modelsCache[model.modelId] = model;
        });

        if (models.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-car-side"></i>
                    <p>Không có xe nào tại trạm này</p>
                </div>
            `;
            return;
        }

        container.innerHTML = models.map(model => `
            <div class="model-card" onclick="viewModelDetail(${model.modelId})">
                ${model.imagePaths && model.imagePaths.length > 0 ? 
                    `<img src="${model.imagePaths[0]}" class="model-card-img" alt="${model.modelName}" onclick="viewModelDetail(${model.modelId})">` : 
                    `<div class="model-card-img" onclick="viewModelDetail(${model.modelId})"></div>`}
                <div class="model-card-body">
                    <h3 class="model-card-title">${model.modelName}</h3>
                    <div class="model-specs">
                        <span><i class="fas fa-users"></i> ${model.seatCount} chỗ</span>
                        <span><i class="fas fa-battery-full"></i> ${model.batteryCapacity || 'N/A'} kWh</span>
                        <span><i class="fas fa-road"></i> ${model.rangeKm || 'N/A'} km</span>
                    </div>
                    <div class="model-price">
                        ${formatCurrency(model.pricePerHour)}<small>/giờ</small>
                    </div>
                    <div class="model-available">
                        <i class="fas fa-car"></i> ${model.totalVehicleCount || 0} xe tại trạm
                    </div>
                    <div class="model-actions">
                        <button class="btn btn-primary btn-sm" style="width: 100%;" onclick="event.stopPropagation(); viewModelDetail(${model.modelId})">
                            <i class="fas fa-eye"></i> Xem chi tiết
                        </button>
                        <button class="btn btn-secondary btn-sm" style="width: 100%;" onclick="event.stopPropagation(); handleBookingModel(${model.modelId})">
                            <i class="fas fa-car-side"></i> Đặt xe
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

    } catch (error) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>${error.message}</p></div>`;
        showToast(error.message, 'error');
    }
}

// Hàm xem chi tiết model
async function viewModelDetail(modelId) {
    const modal = document.getElementById('model-detail-modal');
    const body = document.getElementById('modal-model-body');
    const title = document.getElementById('modal-model-title');

    if (!modal || !body || !title) {
        showToast('Không tìm thấy modal chi tiết', 'error');
        return;
    }

    // Lấy model từ cache
    let model = modelsCache[modelId];

    if (!model) {
        showToast('Không tìm thấy thông tin xe. Vui lòng tải lại trang.', 'error');
        return;
    }

    // ✅ OPTIMIZE: Hiển thị loading ngay lập tức
    title.textContent = model.modelName;
    body.innerHTML = '<div style="padding: 3rem; text-align: center;"><div class="loading"></div><p style="margin-top: 1rem; color: var(--secondary);">Đang tải thông tin...</p></div>';

    // ✅ OPTIMIZE: Mở modal ngay với loading state
    openModal('model-detail-modal');

    // Kiểm tra xem đã chọn thời gian chưa
    const startTime = selectedFilters.startTime;
    const endTime = selectedFilters.endTime;

    // ✅ OPTIMIZE: Sử dụng requestAnimationFrame để render mượt hơn
    requestAnimationFrame(() => {
        if (!startTime || !endTime) {
            renderModelDetailWithoutTime(model, body, title);
        } else {
            renderModelDetailWithVehicles(model, body, title, startTime, endTime);
        }
    });
}

// ✅ THÊM: Render model detail khi chưa chọn thời gian
function renderModelDetailWithoutTime(model, body, title) {
    title.textContent = model.modelName;

    let html = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem;">
            <div>
                ${model.imagePaths && model.imagePaths.length > 0 ? 
                    `<img src="${model.imagePaths[0]}" alt="${model.modelName}" style="width: 100%; border-radius: 12px; object-fit: cover; max-height: 300px;">` : 
                    '<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); height: 300px; border-radius: 12px; display: flex; align-items: center; justify-content: center;"><i class="fas fa-car" style="font-size: 4rem; color: white;"></i></div>'}
            </div>
            <div>
                <h3 style="font-size: 1.5rem; margin-bottom: 1rem;">Thông số kỹ thuật</h3>
                <p style="color: var(--secondary); margin-bottom: 1.5rem;">${model.description || 'Xe điện hiện đại, thân thiện với môi trường'}</p>
                <div style="display: grid; gap: 0.75rem;">
                    <div style="display: flex; justify-content: space-between; padding: 0.75rem; background: var(--light); border-radius: 8px;">
                        <span><i class="fas fa-users"></i> Số chỗ ngồi</span>
                        <strong>${model.seatCount}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 0.75rem; background: var(--light); border-radius: 8px;">
                        <span><i class="fas fa-battery-full"></i> Dung lượng pin</span>
                        <strong>${model.batteryCapacity || 'N/A'} kWh</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 0.75rem; background: var(--light); border-radius: 8px;">
                        <span><i class="fas fa-road"></i> Quãng đường tối đa</span>
                        <strong>${model.rangeKm || 'N/A'} km (đầy pin)</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 0.75rem; background: var(--light); border-radius: 8px;">
                        <span><i class="fas fa-dollar-sign"></i> Giá thuê</span>
                        <strong style="color: var(--primary); font-size: 1.25rem;">${formatCurrency(model.pricePerHour)}/giờ</strong>
                    </div>
                </div>
            </div>
        </div>
        <div style="background: #fef3c7; color: #92400e; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; border-left: 4px solid #f59e0b;">
            <i class="fas fa-info-circle"></i> <strong>Để xem xe khả dụng và đặt xe:</strong> Vui lòng chọn thời gian nhận xe và trả xe ở phía trên, sau đó nhấn nút "Tìm xe khả dụng"
        </div>
        <button class="btn btn-primary" style="width: 100%;" onclick="closeModal('model-detail-modal'); document.getElementById('filter-start-time')?.scrollIntoView({ behavior: 'smooth', block: 'center' });">
            <i class="fas fa-search"></i> Đóng và chọn thời gian
        </button>
    `;

    body.innerHTML = html;
}

// ✅ THÊM: Render model detail khi đã chọn thời gian, hiển thị danh sách xe khả dụng
async function renderModelDetailWithVehicles(model, body, title, startTime, endTime) {
    title.textContent = model.modelName;

    body.innerHTML = '<div style="padding: 2rem; text-align: center;"><div class="loading"></div> Đang tải danh sách xe khả dụng...</div>';

    try {
        const params = new URLSearchParams({
            startTime: startTime,
            endTime: endTime
        });

        const response = await fetch(`${API.stations}/${selectedStation}/models/${model.modelId}/available-vehicles?${params.toString()}`);
        
        if (!response.ok) throw new Error('Không thể tải danh sách xe khả dụng');

        const vehicles = await response.json();

        let html = `
            <div style="margin-bottom: 2rem;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
                    <div>
                        ${model.imagePaths && model.imagePaths.length > 0 ? 
                            `<img src="${model.imagePaths[0]}" alt="${model.modelName}" style="width: 100%; border-radius: 12px; object-fit: cover; max-height: 250px;">` : 
                            '<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); height: 250px; border-radius: 12px; display: flex; align-items: center; justify-content: center;"><i class="fas fa-car" style="font-size: 4rem; color: white;"></i></div>'}
                    </div>
                    <div>
                        <h3 style="font-size: 1.3rem; margin-bottom: 0.75rem; color: var(--dark);">Thông số kỹ thuật</h3>
                        <p style="color: var(--secondary); margin-bottom: 1rem; font-size: 0.9rem;">${model.description || 'Xe điện hiện đại, thân thiện với môi trường'}</p>
                        <div style="display: grid; gap: 0.5rem;">
                            <div style="display: flex; justify-content: space-between; padding: 0.6rem 0.75rem; background: var(--light); border-radius: 6px; font-size: 0.9rem;">
                                <span><i class="fas fa-users" style="color: var(--primary);"></i> Số chỗ ngồi</span>
                                <strong>${model.seatCount}</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 0.6rem 0.75rem; background: var(--light); border-radius: 6px; font-size: 0.9rem;">
                                <span><i class="fas fa-battery-full" style="color: var(--success);"></i> Dung lượng pin</span>
                                <strong>${model.batteryCapacity || 'N/A'} kWh</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 0.6rem 0.75rem; background: var(--light); border-radius: 6px; font-size: 0.9rem;">
                                <span><i class="fas fa-road" style="color: var(--info);"></i> Quãng đường tối đa</span>
                                <strong>${model.rangeKm || 'N/A'} km (đầy pin)</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 0.6rem 0.75rem; background: var(--primary-light); border-radius: 6px; font-size: 0.9rem;">
                                <span><i class="fas fa-dollar-sign" style="color: var(--primary);"></i> Giá thuê</span>
                                <strong style="color: var(--primary); font-size: 1.1rem;">${formatCurrency(model.pricePerHour)}/giờ</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <hr style="margin: 1.5rem 0; border: none; border-top: 2px solid var(--border);">
            
            <div style="margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center;">
                <h3 style="margin: 0; color: var(--dark);"><i class="fas fa-car"></i> Xe khả dụng</h3>
                <span style="background: var(--primary-light); color: var(--primary); padding: 0.4rem 1rem; border-radius: 20px; font-weight: 600; font-size: 0.9rem;">
                    ${vehicles.length} xe
                </span>
            </div>
        `;

        if (vehicles.length === 0) {
            html += `
                <div class="empty-state" style="padding: 3rem 2rem;">
                    <i class="fas fa-inbox" style="font-size: 3rem; color: var(--secondary); margin-bottom: 1rem;"></i>
                    <p style="font-size: 1.1rem;">Không có xe khả dụng trong khung thời gian này</p>
                    <p style="color: var(--secondary); font-size: 0.9rem;">Vui lòng chọn thời gian khác hoặc chọn model xe khác</p>
                </div>
            `;
        } else {
            html += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; max-height: 400px; overflow-y: auto; padding: 0.5rem;">';

            vehicles.forEach(vehicle => {
                const statusText = vehicle.isAvailable ? 'Khả dụng' : 'Không khả dụng';
                const statusColor = vehicle.isAvailable ? 'var(--success)' : 'var(--danger)';
                const statusBg = vehicle.isAvailable ? '#d1fae5' : '#fee2e2';
                const borderColor = vehicle.isAvailable ? 'var(--success)' : 'var(--border)';

                // Tính trạng thái pin
                const batteryStatus = vehicle.batteryLevel >= 80 ? 'Tốt' :
                                     vehicle.batteryLevel >= 50 ? 'Khá' :
                                     vehicle.batteryLevel >= 20 ? 'Thấp' : 'Rất thấp';
                const batteryColor = vehicle.batteryLevel >= 80 ? 'var(--success)' :
                                    vehicle.batteryLevel >= 50 ? 'var(--info)' :
                                    vehicle.batteryLevel >= 20 ? 'var(--warning)' : 'var(--danger)';

                // Dịch tình trạng xe sang tiếng Việt
                const getConditionText = (condition) => {
                    switch(condition) {
                        case 'EXCELLENT': return 'Xuất sắc';
                        case 'GOOD': return 'Tốt';
                        case 'MINOR_DAMAGE': return 'Hư hỏng nhẹ';
                        case 'MAINTENANCE_REQUIRED': return 'Cần được bảo trì';
                        default: return condition;
                    }
                };

                html += `
                    <div style="
                        border: 2px solid ${borderColor}; 
                        border-radius: 12px; 
                        padding: 1rem; 
                        background: white;
                        transition: all 0.3s ease;
                        ${vehicle.isAvailable ? 'cursor: pointer;' : 'opacity: 0.7;'}
                        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                    " 
                    ${vehicle.isAvailable ? `onmouseover="this.style.boxShadow='0 4px 12px rgba(16, 185, 129, 0.2)'; this.style.transform='translateY(-2px)';" onmouseout="this.style.boxShadow='0 2px 4px rgba(0,0,0,0.05)'; this.style.transform='translateY(0)';"` : ''}>
                        
                        <!-- Header với biển số -->
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border);">
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <i class="fas fa-id-card" style="color: var(--primary); font-size: 1.2rem;"></i>
                                <h4 style="margin: 0; font-size: 1.1rem; font-weight: 700; color: var(--dark);">${vehicle.licensePlate}</h4>
                            </div>
                            <span style="
                                background: ${statusBg}; 
                                color: ${statusColor}; 
                                padding: 0.3rem 0.75rem; 
                                border-radius: 12px; 
                                font-size: 0.75rem; 
                                font-weight: 600;
                                border: 1px solid ${statusColor};
                            ">
                                ${statusText}
                            </span>
                        </div>
                        
                        <!-- Thông tin chi tiết -->
                        <div style="display: grid; gap: 0.5rem; margin-bottom: 1rem;">
                            
                            <!-- Pin -->
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: var(--light); border-radius: 6px;">
                                <span style="font-size: 0.85rem; color: var(--secondary);">
                                    <i class="fas fa-battery-three-quarters" style="color: ${batteryColor}; margin-right: 0.3rem;"></i>
                                    Mức pin
                                </span>
                                <div style="text-align: right;">
                                    <strong style="color: ${batteryColor}; font-size: 0.95rem;">${vehicle.batteryLevel || 'N/A'}%</strong>
                                    <div style="font-size: 0.7rem; color: var(--secondary);">${batteryStatus}</div>
                                </div>
                            </div>
                            
                            <!-- Số km đã đi -->
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: var(--light); border-radius: 6px;">
                                <span style="font-size: 0.85rem; color: var(--secondary);">
                                    <i class="fas fa-tachometer-alt" style="color: var(--info); margin-right: 0.3rem;"></i>
                                    Số km
                                </span>
                                <strong style="font-size: 0.9rem;">${vehicle.currentMileage ? Math.round(vehicle.currentMileage).toLocaleString('vi-VN') : 'N/A'} km</strong>
                            </div>
                            
                            <!-- Tình trạng xe -->
                            ${vehicle.condition ? `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: var(--light); border-radius: 6px;">
                                <span style="font-size: 0.85rem; color: var(--secondary);">
                                    <i class="fas fa-tools" style="color: var(--warning); margin-right: 0.3rem;"></i>
                                    Tình trạng
                                </span>
                                <strong style="font-size: 0.9rem;">${getConditionText(vehicle.condition)}</strong>
                            </div>
                            ` : ''}
                            
                        </div>
                        
                        ${vehicle.availabilityNote ? `
                        <div style="background: #fef3c7; color: #92400e; padding: 0.6rem; border-radius: 6px; margin-bottom: 0.75rem; font-size: 0.8rem; border-left: 3px solid #f59e0b;">
                            <i class="fas fa-info-circle"></i> ${vehicle.availabilityNote}
                        </div>
                        ` : ''}
                        
                        <!-- Nút chọn xe -->
                        ${vehicle.isAvailable ? 
                            `<button class="btn btn-primary" onclick="selectVehicle(${vehicle.vehicleId}, '${vehicle.licensePlate}')" style="width: 100%; padding: 0.75rem; font-weight: 600; border-radius: 8px;">
                                <i class="fas fa-hand-pointer"></i> Chọn xe này
                            </button>` : 
                            `<button class="btn btn-secondary" disabled style="width: 100%; padding: 0.75rem; border-radius: 8px;">
                                <i class="fas fa-ban"></i> Không khả dụng
                            </button>`
                        }
                    </div>
                `;
            });
            html += '</div>';
        }

        body.innerHTML = html;

    } catch (error) {
        body.innerHTML = `<div class="empty-state" style="padding: 3rem 2rem;"><i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: var(--danger); margin-bottom: 1rem;"></i><p style="font-size: 1.1rem; color: var(--danger);">${error.message}</p></div>`;
        showToast(error.message, 'error');
    }
}

// ✅ THÊM: Hàm chọn xe
function selectVehicle(vehicleId, licensePlate) {
    closeModal('model-detail-modal');
    
    // Lưu thông tin xe đã chọn
    document.getElementById('selected-vehicle-id').value = vehicleId;
    
    // Scroll đến form booking
    const bookingSection = document.getElementById('booking-section');
    if (bookingSection) {
        bookingSection.style.display = 'block';
        bookingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    showToast(`Đã chọn xe ${licensePlate}. Vui lòng hoàn tất thông tin đặt xe.`, 'success');
}

async function loadMyBookings() {
    const container = document.getElementById('my-bookings-container');
    const token = localStorage.getItem('token');

    if (!token) return;

    container.innerHTML = '<p style="padding: 2rem; text-align: center;"><div class="loading"></div> Đang tải...</p>';

    try {
        const response = await fetch(API.bookings.myBookings, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Không thể tải lịch sử booking');

        const bookings = await response.json();

        if (bookings.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>Bạn chưa có booking nào</p></div>';
            return;
        }

        let html = `
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Xe</th>
                        <th>Thời gian</th>
                        <th>Trạng thái</th>
                        <th>Tổng tiền</th>
                        <th>Hành động</th>
                    </tr>
                </thead>
                <tbody>
        `;

        bookings.forEach(booking => {
            const statusBadge = getStatusBadge(booking.status);
            html += `
                <tr>
                    <td>${booking.bookingId || booking.id}</td>
                    <td>
                        ${booking.vehicle?.model?.modelName || 'N/A'}<br>
                        <small>${booking.vehicle?.licensePlate || ''}</small>
                    </td>
                    <td>
                        <small>${formatDateTime(booking.startDate || booking.startTime)}<br>${formatDateTime(booking.endDate || booking.endTime)}</small>
                    </td>
                    <td>${statusBadge}</td>
                    <td><strong>${formatCurrency(booking.finalFee || booking.totalPrice || 0)}</strong></td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="viewBookingDetail(${booking.bookingId || booking.id})">
                            <i class="fas fa-eye"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        container.innerHTML = html;

    } catch (error) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>${error.message}</p></div>`;
    }
}

function viewBookingDetail(bookingId) {
    showToast(`Xem chi tiết booking #${bookingId}`, 'info');
}

// ============================================================================
// STAFF FUNCTIONS
// ============================================================================

async function initStaffView() {
    await loadStaffStation();
    await loadStaffStats();
    await loadStaffBookings(); // ✅ THÊM: Tải danh sách booking cho staff
}

async function loadStaffStation() {
    const el = document.getElementById('staff-station-name');
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(API.staff.station, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Không thể tải thông tin trạm');

        const station = await response.json();
        el.textContent = `Trạm: ${station.name} - ${station.address}`;

    } catch (error) {
        el.textContent = 'Không thể tải thông tin trạm';
    }
}

async function loadStaffStats() {
    const container = document.getElementById('stats-container');
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(API.staff.stats, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Không thể tải thống kê');

        const stats = await response.json();
        
        container.innerHTML = `
            <div class="stat-card" style="border-left-color: var(--primary);">
                <div class="stat-value" style="color: var(--primary);">${stats.totalBookings || 0}</div>
                <div class="stat-label">Tổng Bookings</div>
            </div>
            <div class="stat-card" style="border-left-color: var(--warning);">
                <div class="stat-value" style="color: var(--warning);">${stats.pendingBookings || 0}</div>
                <div class="stat-label">Chờ xử lý</div>
            </div>
            <div class="stat-card" style="border-left-color: var(--success);">
                <div class="stat-value" style="color: var(--success);">${stats.activeRentals || 0}</div>
                <div class="stat-label">Đang cho thuê</div>
            </div>
            <div class="stat-card" style="border-left-color: var(--info);">
                <div class="stat-value" style="color: var(--info);">${stats.availableVehicles || 0}</div>
                <div class="stat-label">Xe khả dụng</div>
            </div>
            <div class="stat-card" style="border-left-color: var(--danger);">
                <div class="stat-value" style="color: var(--danger);">${formatCurrency(stats.totalRevenue || 0)}</div>
                <div class="stat-label">Doanh thu tháng</div>
            </div>
        `;

    } catch (error) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>${error.message}</p></div>`;
    }
}

// ✅ THÊM: Function load staff bookings
async function loadStaffBookings() {
    const container = document.getElementById('bookings-list-container');
    const token = localStorage.getItem('token');

    if (!container) {
        console.error('Container bookings-list-container not found');
        return;
    }

    container.innerHTML = '<p style="padding: 2rem; text-align: center;"><div class="loading"></div> Đang tải...</p>';

    try {
        const response = await fetch(API.staff.bookings, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error loading staff bookings:', errorText);
            throw new Error('Không thể tải danh sách booking');
        }

        const bookings = await response.json();
        console.log('Staff bookings loaded:', bookings.length);

        if (bookings.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>Không có booking nào</p></div>';
            return;
        }

        let html = `
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr>
                        <th style="padding: 1rem; text-align: left; border-bottom: 2px solid var(--border);">ID</th>
                        <th style="padding: 1rem; text-align: left; border-bottom: 2px solid var(--border);">Khách hàng</th>
                        <th style="padding: 1rem; text-align: left; border-bottom: 2px solid var(--border);">Xe</th>
                        <th style="padding: 1rem; text-align: left; border-bottom: 2px solid var(--border);">Thời gian</th>
                        <th style="padding: 1rem; text-align: left; border-bottom: 2px solid var(--border);">Trạng thái</th>
                        <th style="padding: 1rem; text-align: left; border-bottom: 2px solid var(--border);">Tổng tiền</th>
                        <th style="padding: 1rem; text-align: left; border-bottom: 2px solid var(--border);">Hành động</th>
                    </tr>
                </thead>
                <tbody>
        `;

        bookings.forEach(booking => {
            const statusBadge = getStatusBadge(booking.status);
            const customerName = booking.user?.fullName || booking.renter?.fullName || 'N/A';
            const vehicleInfo = booking.vehicle?.model?.modelName || 'N/A';
            const licensePlate = booking.vehicle?.licensePlate || '';

            html += `
                <tr style="border-bottom: 1px solid var(--border);">
                    <td style="padding: 1rem;">#${booking.bookingId || booking.id}</td>
                    <td style="padding: 1rem;">
                        ${customerName}<br>
                        <small style="color: var(--secondary);">${booking.user?.phone || booking.renter?.phone || ''}</small>
                    </td>
                    <td style="padding: 1rem;">
                        ${vehicleInfo}<br>
                        <small style="color: var(--secondary);">${licensePlate}</small>
                    </td>
                    <td style="padding: 1rem;">
                        <small>${formatDateTime(booking.startDate || booking.startTime)}<br>→ ${formatDateTime(booking.endDate || booking.endTime)}</small>
                    </td>
                    <td style="padding: 1rem;">${statusBadge}</td>
                    <td style="padding: 1rem;"><strong>${formatCurrency(booking.finalFee || booking.totalPrice || 0)}</strong></td>
                    <td style="padding: 1rem;">
                        <button class="btn btn-sm btn-primary" onclick="viewBookingDetail(${booking.bookingId || booking.id})">
                            <i class="fas fa-eye"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        container.innerHTML = html;

    } catch (error) {
        console.error('Error in loadStaffBookings:', error);
        container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>${error.message}</p></div>`;
    }
}

// ✅ THÊM: Function xem chi tiết booking cho staff
function viewStaffBookingDetail(bookingId) {
    showToast(`Đang xem chi tiết booking #${bookingId}`, 'info');
    // TODO: Implement full booking detail view
}

// ✅ THÊM: Function load contracts
async function loadStaffContracts() {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(API.staff.contracts, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Không thể tải danh sách hợp đồng');

        const contracts = await response.json();
        console.log('Contracts loaded:', contracts.length);
        showToast(`Đã tải ${contracts.length} hợp đồng`, 'success');

        // TODO: Display contracts in modal

    } catch (error) {
        console.error('Error loading contracts:', error);
        showToast(error.message, 'error');
    }
}

// ✅ THÊM: Function load invoices
async function loadStaffInvoices() {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(API.staff.invoices, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Không thể tải danh sách hóa đơn');

        const invoices = await response.json();
        console.log('Invoices loaded:', invoices.length);
        showToast(`Đã tải ${invoices.length} hóa đơn`, 'success');

        // TODO: Display invoices in modal

    } catch (error) {
        console.error('Error loading invoices:', error);
        showToast(error.message, 'error');
    }
}

// ============================================================================
// UI FUNCTIONS
// ============================================================================

function showView(viewId) {
    console.log('Switching to view:', viewId);

    // Hide all views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });

    // Show target view
    const targetView = document.getElementById(viewId);
    if (targetView) {
        targetView.classList.add('active');
        window.scrollTo(0, 0);
    } else {
        console.error('Target view not found:', viewId);
    }
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    } else {
        console.error('Modal not found:', modalId);
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    } else {
        console.error('Modal not found:', modalId);
    }
}

function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-icon">
            ${type === 'success' ? '<i class="fas fa-check-circle"></i>' : ''}
            ${type === 'error' ? '<i class="fas fa-exclamation-circle"></i>' : ''}
            ${type === 'warning' ? '<i class="fas fa-exclamation-triangle"></i>' : ''}
            ${type === 'info' ? '<i class="fas fa-info-circle"></i>' : ''}
        </div>
        <div class="toast-message">${message}</div>
        <div class="toast-close" onclick="this.parentElement.remove();">&times;</div>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 5000);
}

// ============================================================================
// FORMATTERS
// ============================================================================

function formatCurrency(amount) {
    if (amount == null) return 'N/A';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function formatDateTime(dateTime) {
    if (!dateTime) return 'N/A';
    const options = {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
    };
    return new Date(dateTime).toLocaleString('vi-VN', options);
}

function formatNumber(num) {
    if (num == null) return 'N/A';
    return new Intl.NumberFormat('vi-VN').format(num);
}

// ============================================================================
// STATUS BADGES
// ============================================================================

function getStatusBadge(status) {
    switch (status) {
        case 'PENDING':
            return '<span class="badge badge-warning">Chờ xử lý</span>';
        case 'CONFIRMED':
            return '<span class="badge badge-info">Đã xác nhận</span>';
        case 'CANCELLED':
            return '<span class="badge badge-danger">Đã hủy</span>';
        case 'COMPLETED':
            return '<span class="badge badge-success">Hoàn thành</span>';
        case 'ACTIVE':
            return '<span class="badge badge-success">Đang hoạt động</span>';
        case 'INACTIVE':
            return '<span class="badge badge-secondary">Ngừng hoạt động</span>';
        default:
            return '<span class="badge badge-light">Không xác định</span>';
    }
}

// ============================================================================
// APP INITIALIZATION
// ============================================================================

function initializeApp() {
    console.log('Initializing app...');

    // Check browser support for features
    if (!('fetch' in window)) {
        alert('Trình duyệt của bạn không hỗ trợ tính năng cần thiết. Vui lòng cập nhật trình duyệt.');
        return false;
    }

    // Create toast container if not exists
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    console.log('App initialized');
    return true;
}

// BƯỚC 2: Khi submit form tìm kiếm (với thời gian)
async function handleSearch(e) {
    e.preventDefault();
    const form = e.target;

    // ✅ SỬA: Lấy stationId từ dropdown trong bộ lọc
    const filterStationSelect = document.getElementById('filter-station-select');
    const stationId = filterStationSelect ? filterStationSelect.value : selectedStation;
    const startTime = form['filter-start-time'].value;
    const endTime = form['filter-end-time'].value;
    const minPrice = form['filter-min-price'].value;
    const maxPrice = form['filter-max-price'].value;
    const seatCount = form['filter-seat-count'].value;

    if (!stationId || !startTime || !endTime) {
        showToast('Vui lòng chọn đầy đủ trạm và thời gian', 'warning');
        return;
    }

    if (new Date(startTime) >= new Date(endTime)) {
        showToast('Thời gian trả xe phải sau thời gian nhận xe', 'warning');
        return;
    }

    // ✅ SỬA: Cập nhật selectedStation và selectedStationName
    if (filterStationSelect && filterStationSelect.value) {
        const selectedOption = filterStationSelect.options[filterStationSelect.selectedIndex];
        selectedStation = stationId;
        selectedStationName = `${selectedOption.dataset.name} - ${selectedOption.dataset.address}`;
    }

    // Lưu filters
    selectedFilters = { stationId, startTime, endTime };

    // Build query parameters
    const params = new URLSearchParams({
        startTime,
        endTime
    });

    if (minPrice) params.append('minPrice', minPrice);
    if (maxPrice) params.append('maxPrice', maxPrice);
    if (seatCount) params.append('seatCount', seatCount);

    const container = document.getElementById('models-list');
    const title = document.getElementById('models-title');

    container.innerHTML = '<div style="padding: 2rem; text-align: center;"><div class="loading"></div> Đang tìm kiếm...</div>';
    title.textContent = 'Kết quả tìm kiếm';

    try {
        // Sửa API endpoint: /api/stations/{stationId}/models/search
        const response = await fetch(`${API.stations}/${stationId}/models/search?${params.toString()}`);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Không thể tìm kiếm xe');
        }

        const models = await response.json();

        // ✅ SỬA: Lưu models vào cache
        models.forEach(model => {
            modelsCache[model.modelId] = model;
        });

        if (models.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-car-side"></i>
                    <p>Không tìm thấy xe phù hợp</p>
                </div>
            `;
            return;
        }

        container.innerHTML = models.map(model => `
            <div class="model-card" onclick="viewModelDetail(${model.modelId})">
                ${model.imagePaths && model.imagePaths.length > 0 ? 
                    `<img src="${model.imagePaths[0]}" class="model-card-img" alt="${model.modelName}">` : 
                    `<div class="model-card-img"></div>`}
                <div class="model-card-body">
                    <h3 class="model-card-title">${model.modelName}</h3>
                    <div class="model-specs">
                        <span><i class="fas fa-users"></i> ${model.seatCount} chỗ</span>
                        <span><i class="fas fa-battery-full"></i> ${model.batteryCapacity || 'N/A'} kWh</span>
                        <span><i class="fas fa-road"></i> ${model.rangeKm || 'N/A'} km</span>
                    </div>
                    <div class="model-price">
                        ${formatCurrency(model.pricePerHour)}<small>/giờ</small>
                    </div>
                    <div class="model-available">
                        <i class="fas fa-check-circle"></i> ${model.availableVehicleCount || 0} xe khả dụng
                    </div>
                    <button class="btn btn-primary btn-sm" style="width: 100%;" onclick="event.stopPropagation(); viewModelDetail(${model.modelId})">
                        <i class="fas fa-eye"></i> Xem chi tiết & Chọn xe
                    </button>
                </div>
            </div>
        `).join('');

    } catch (error) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>${error.message}</p></div>`;
        showToast(error.message, 'error');
    }
}

async function handleBooking(e) {
    e.preventDefault();
    showToast('Chức năng đặt xe đang được phát triển', 'info');
}

// ✅ THÊM: Handler khi click nút "Đặt xe" trên model card
function handleBookingModel(modelId) {
    const startTime = selectedFilters.startTime;
    const endTime = selectedFilters.endTime;

    if (!startTime || !endTime) {
        showToast('Vui lòng chọn thời gian nhận xe và trả xe trước khi đặt xe', 'warning');
        document.getElementById('filter-start-time')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
        // Nếu đã có thời gian, mở modal để chọn xe
        viewModelDetail(modelId);
    }
}

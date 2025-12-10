// Global State
let currentUser = null;
let students = [];
let rooms = [];
let allocations = [];
let filteredRooms = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showDashboard();
        loadAllData();
    } else {
        showLoginPage();
    }
});

// ===== PAGE NAVIGATION =====
function showLoginPage() {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('loginPage').classList.add('active');
}

function showDashboard() {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    if (currentUser.role === 'student') {
        document.getElementById('studentDashboard').classList.add('active');
        document.getElementById('studentGreeting').textContent = `Welcome, ${currentUser.name}`;
        showStudentSection('dashboard', null);
    } else {
        document.getElementById('adminDashboard').classList.add('active');
        document.getElementById('adminGreeting').textContent = `Welcome, Admin`;
        showAdminSection('dashboard', null);
    }
}

function toggleAuthPages(e) {
    e.preventDefault();
    document.getElementById('loginPage').classList.toggle('hidden');
    document.getElementById('registerPage').classList.toggle('hidden');
}

// ===== STUDENT NAVIGATION =====
function showStudentSection(section, e) {
    if (e) e.preventDefault();
    document.querySelectorAll('#studentDashboard .section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('#studentDashboard .nav-item').forEach(n => n.classList.remove('active'));
    
    switch(section) {
        case 'dashboard':
            document.getElementById('dashboardSection').classList.add('active');
            document.getElementById('pageTitle').textContent = 'Dashboard';
            updateStudentStats();
            break;
        case 'rooms':
            document.getElementById('roomsSection').classList.add('active');
            document.getElementById('pageTitle').textContent = 'Available Rooms';
            loadStudentRooms();
            break;
        case 'allocation':
            document.getElementById('allocationSection').classList.add('active');
            document.getElementById('pageTitle').textContent = 'My Allocation';
            loadStudentAllocation();
            break;
        case 'profile':
            document.getElementById('profileSection').classList.add('active');
            document.getElementById('pageTitle').textContent = 'My Profile';
            loadStudentProfile();
            break;
    }
    
    if (e && e.target) {
        e.target.classList.add('active');
    }
}

// ===== ADMIN NAVIGATION =====
function showAdminSection(section, e) {
    if (e) e.preventDefault();
    document.querySelectorAll('#adminDashboard .section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('#adminDashboard .nav-item').forEach(n => n.classList.remove('active'));
    
    switch(section) {
        case 'dashboard':
            document.getElementById('adminDashboardSection').classList.add('active');
            document.getElementById('adminPageTitle').textContent = 'Dashboard';
            updateAdminStats();
            break;
        case 'rooms':
            document.getElementById('adminRoomsSection').classList.add('active');
            document.getElementById('adminPageTitle').textContent = 'Room Management';
            loadAdminRooms();
            break;
        case 'students':
            document.getElementById('adminStudentsSection').classList.add('active');
            document.getElementById('adminPageTitle').textContent = 'Students Management';
            loadAdminStudents();
            break;
        case 'allocations':
            document.getElementById('adminAllocationsSection').classList.add('active');
            document.getElementById('adminPageTitle').textContent = 'Room Allocations';
            loadAdminAllocations();
            break;
        case 'reports':
            document.getElementById('adminReportsSection').classList.add('active');
            document.getElementById('adminPageTitle').textContent = 'Reports & Analytics';
            break;
    }
    
    if (e && e.target) {
        e.target.classList.add('active');
    }
}

// ===== AUTHENTICATION =====
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const role = document.getElementById('loginRole').value;

    try {
        currentUser = { email, role, name: role === 'student' ? 'Student' : 'Admin' };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        showAlert('Login successful!', 'alert-success');
        setTimeout(showDashboard, 500);
        loadAllData();
    } catch (error) {
        showAlert('Login failed!', 'alert-error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirm = document.getElementById('registerConfirm').value;
    const studentId = document.getElementById('registerStudentId').value;

    if (password !== confirm) {
        showAlert('Passwords do not match!', 'alert-error');
        return;
    }

    try {
        const response = await fetch('/student', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, phone: '' })
        });
        
        if (response.ok) {
            currentUser = { email, role: 'student', name };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            showAlert('Registration successful!', 'alert-success');
            setTimeout(() => {
                toggleAuthPages({ preventDefault: () => {} });
                showDashboard();
            }, 500);
        } else {
            showAlert('Registration failed!', 'alert-error');
        }
    } catch (error) {
        showAlert('Registration error!', 'alert-error');
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    showLoginPage();
    showAlert('Logged out successfully!', 'alert-success');
}

// ===== ALERTS =====
function showAlert(message, type = 'alert-info') {
    const alertBox = document.getElementById('alertBox');
    alertBox.innerHTML = message;
    alertBox.className = `alert ${type}`;
    alertBox.classList.remove('hidden');
    
    setTimeout(() => {
        alertBox.classList.add('hidden');
    }, 4000);
}

// ===== DATA LOADING =====
async function loadAllData() {
    try {
        const [roomsRes, studentsRes, allocationsRes] = await Promise.all([
            fetch('/admin/rooms'),
            fetch('/student/list'),
            fetch('/student/allocations')
        ]);

        if (roomsRes.ok) rooms = await roomsRes.json();
        if (studentsRes.ok) students = await studentsRes.json();
        if (allocationsRes.ok) allocations = await allocationsRes.json();
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// ===== STUDENT FUNCTIONS =====
function updateStudentStats() {
    const availableRooms = rooms.filter(r => r.occupancy < r.capacity).length;
    const totalCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0);
    
    document.getElementById('studentAvailableRooms').textContent = availableRooms;
    document.getElementById('studentTotalCapacity').textContent = totalCapacity;
    document.getElementById('studentMyRoom').textContent = '-';
    document.getElementById('studentRequestStatus').textContent = 'Pending';
    document.getElementById('notificationCount').textContent = availableRooms;
}

function loadStudentRooms() {
    const roomsGrid = document.getElementById('roomsGrid');
    const availableRooms = rooms.filter(r => r.occupancy < r.capacity);
    
    if (availableRooms.length === 0) {
        roomsGrid.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><h3>No Rooms Available</h3></div>';
        return;
    }

    filteredRooms = availableRooms;
    renderRoomsGrid(availableRooms);
}

function renderRoomsGrid(roomsToRender) {
    const roomsGrid = document.getElementById('roomsGrid');
    roomsGrid.innerHTML = roomsToRender.map(room => `
        <div class="room-card">
            <div class="room-header">
                <span class="room-number">Room ${room.roomNumber}</span>
                <span class="room-status">Available</span>
            </div>
            <div class="room-details">
                <div class="room-detail-item">
                    <span class="room-detail-label">Floor</span>
                    <span class="room-detail-value">${room.floor}</span>
                </div>
                <div class="room-detail-item">
                    <span class="room-detail-label">Capacity</span>
                    <span class="room-detail-value">${room.capacity}</span>
                </div>
                <div class="room-detail-item">
                    <span class="room-detail-label">Occupied</span>
                    <span class="room-detail-value">${room.occupancy}</span>
                </div>
                <div class="room-detail-item">
                    <span class="room-detail-label">Available Beds</span>
                    <span class="room-detail-value">${room.capacity - room.occupancy}</span>
                </div>
            </div>
            <div class="room-actions">
                <button class="room-btn-allocate" onclick="requestAllocation(${room.id})">
                    <i class="fas fa-check"></i> Request
                </button>
            </div>
        </div>
    `).join('');
}

function filterRooms() {
    const searchTerm = document.getElementById('roomSearch').value.toLowerCase();
    const filtered = filteredRooms.filter(r => 
        r.roomNumber.toString().includes(searchTerm) || 
        r.floor.toString().includes(searchTerm)
    );
    renderRoomsGrid(filtered);
}

async function requestAllocation(roomId) {
    try {
        const response = await fetch('/student/allocate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentEmail: currentUser.email, roomId })
        });

        if (response.ok) {
            showAlert('Allocation request submitted!', 'alert-success');
            loadStudentRooms();
            loadAllData();
        } else {
            showAlert('Request failed!', 'alert-error');
        }
    } catch (error) {
        showAlert('Error submitting request!', 'alert-error');
    }
}

function loadStudentAllocation() {
    const allocation = allocations.find(a => a.studentEmail === currentUser.email);
    const detailsDiv = document.getElementById('allocationDetails');
    
    if (allocation) {
        const room = rooms.find(r => r.id === allocation.roomId);
        document.getElementById('allocationStatus').textContent = 'Allocated';
        document.getElementById('allocationStatus').className = 'status-badge allocated';
        detailsDiv.innerHTML = `
            <div class="allocation-info">
                <div class="allocation-info-label">Room Number</div>
                <div class="allocation-info-value">${room?.roomNumber || 'N/A'}</div>
            </div>
            <div class="allocation-info">
                <div class="allocation-info-label">Floor</div>
                <div class="allocation-info-value">${room?.floor || 'N/A'}</div>
            </div>
            <div class="allocation-info">
                <div class="allocation-info-label">Allocated Date</div>
                <div class="allocation-info-value">${new Date(allocation.createdAt).toLocaleDateString()}</div>
            </div>
            <div class="allocation-info">
                <div class="allocation-info-label">Status</div>
                <div class="allocation-info-value">Confirmed</div>
            </div>
        `;
    }
}

function loadStudentProfile() {
    document.getElementById('profileFullName').value = currentUser.name;
    document.getElementById('profileEmail').value = currentUser.email;
    document.getElementById('profilePhone').value = '';
    document.getElementById('profileStudentId').value = 'STU001';
    document.getElementById('profileName').textContent = currentUser.name;
}

async function updateStudentProfile(e) {
    e.preventDefault();
    showAlert('Profile updated successfully!', 'alert-success');
}

function downloadAllocation() {
    showAlert('Downloading allocation certificate...', 'alert-info');
}

// ===== ADMIN FUNCTIONS =====
function updateAdminStats() {
    const allocatedCount = allocations.length;
    const availableCount = rooms.filter(r => r.occupancy < r.capacity).length;
    
    document.getElementById('adminTotalStudents').textContent = students.length;
    document.getElementById('adminTotalRooms').textContent = rooms.length;
    document.getElementById('adminAllocatedRooms').textContent = allocatedCount;
    document.getElementById('adminAvailableRooms').textContent = availableCount;
    
    const occupancyPercent = rooms.length > 0 ? Math.round((allocatedCount / rooms.length) * 100) : 0;
    document.getElementById('occupancyFill').style.width = occupancyPercent + '%';
    document.getElementById('occupancyPercent').textContent = occupancyPercent + '% Occupied';
}

function loadAdminRooms() {
    const tableBody = document.getElementById('adminRoomsTableBody');
    
    if (rooms.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No rooms available</td></tr>';
        return;
    }

    tableBody.innerHTML = rooms.map(room => `
        <tr>
            <td>${room.roomNumber}</td>
            <td>Floor ${room.floor}</td>
            <td>${room.capacity}</td>
            <td>${room.occupancy}</td>
            <td>${room.capacity - room.occupancy}</td>
            <td><span class="status-badge allocated">${room.occupancy < room.capacity ? 'Available' : 'Full'}</span></td>
            <td>
                <div class="table-actions">
                    <button class="action-link action-edit" onclick="editRoom(${room.id})">Edit</button>
                    <button class="action-link action-delete" onclick="deleteRoom(${room.id})">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function loadAdminStudents() {
    const tableBody = document.getElementById('adminStudentsTableBody');
    
    if (students.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No students registered</td></tr>';
        return;
    }

    tableBody.innerHTML = students.map(student => {
        const allocation = allocations.find(a => a.studentId === student.id);
        const room = allocation ? rooms.find(r => r.id === allocation.roomId) : null;
        return `
            <tr>
                <td>${student.name}</td>
                <td>${student.email}</td>
                <td>${student.phone || 'N/A'}</td>
                <td>${student.id}</td>
                <td>${room ? `Room ${room.roomNumber}` : 'Not Allocated'}</td>
                <td><span class="status-badge ${allocation ? 'allocated' : 'pending'}">${allocation ? 'Allocated' : 'Pending'}</span></td>
                <td>
                    <div class="table-actions">
                        <button class="action-link action-edit" onclick="viewStudent(${student.id})">View</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function loadAdminAllocations() {
    const tableBody = document.getElementById('allocationsTableBody');
    
    if (allocations.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No allocations yet</td></tr>';
        return;
    }

    tableBody.innerHTML = allocations.map(alloc => {
        const student = students.find(s => s.id === alloc.studentId);
        const room = rooms.find(r => r.id === alloc.roomId);
        return `
            <tr>
                <td>${student?.name || 'Unknown'}</td>
                <td>${student?.id || 'N/A'}</td>
                <td>${room?.roomNumber || 'N/A'}</td>
                <td>Floor ${room?.floor || 'N/A'}</td>
                <td>${new Date(alloc.createdAt).toLocaleDateString()}</td>
                <td><span class="status-badge allocated">Confirmed</span></td>
                <td>
                    <div class="table-actions">
                        <button class="action-link action-delete" onclick="removeAllocation(${alloc.id})">Remove</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function filterAdminStudents() {
    const searchTerm = document.getElementById('studentSearch').value.toLowerCase();
    const filtered = students.filter(s => 
        s.name.toLowerCase().includes(searchTerm) || 
        s.email.toLowerCase().includes(searchTerm)
    );
    
    const tableBody = document.getElementById('adminStudentsTableBody');
    tableBody.innerHTML = filtered.map(student => {
        const allocation = allocations.find(a => a.studentId === student.id);
        const room = allocation ? rooms.find(r => r.id === allocation.roomId) : null;
        return `
            <tr>
                <td>${student.name}</td>
                <td>${student.email}</td>
                <td>${student.phone || 'N/A'}</td>
                <td>${student.id}</td>
                <td>${room ? `Room ${room.roomNumber}` : 'Not Allocated'}</td>
                <td><span class="status-badge ${allocation ? 'allocated' : 'pending'}">${allocation ? 'Allocated' : 'Pending'}</span></td>
                <td>
                    <div class="table-actions">
                        <button class="action-link action-edit" onclick="viewStudent(${student.id})">View</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// ===== MODAL FUNCTIONS =====
function openCreateRoomModal() {
    document.getElementById('createRoomModal').classList.add('active');
}

function openAllocationModal() {
    document.getElementById('allocationModal').classList.add('active');
    populateAllocationSelects();
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function populateAllocationSelects() {
    const studentSelect = document.getElementById('allocationStudent');
    const roomSelect = document.getElementById('allocationRoom');
    
    studentSelect.innerHTML = '<option value="">Choose a student...</option>' + 
        students.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    
    roomSelect.innerHTML = '<option value="">Choose a room...</option>' + 
        rooms.filter(r => r.occupancy < r.capacity).map(r => `<option value="${r.id}">Room ${r.roomNumber} (Floor ${r.floor})</option>`).join('');
}

// ===== CRUD OPERATIONS =====
async function handleCreateRoom(e) {
    e.preventDefault();
    const roomNumber = document.getElementById('modalRoomNumber').value;
    const floor = document.getElementById('modalRoomFloor').value;
    const capacity = document.getElementById('modalRoomCapacity').value;

    try {
        const response = await fetch('/admin/rooms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomNumber, floor: parseInt(floor), capacity: parseInt(capacity) })
        });

        if (response.ok) {
            showAlert('Room created successfully!', 'alert-success');
            closeModal('createRoomModal');
            loadAllData();
            loadAdminRooms();
        } else {
            showAlert('Failed to create room!', 'alert-error');
        }
    } catch (error) {
        showAlert('Error creating room!', 'alert-error');
    }
}

async function handleAdminAllocate(e) {
    e.preventDefault();
    const studentId = document.getElementById('allocationStudent').value;
    const roomId = document.getElementById('allocationRoom').value;

    try {
        showAlert('Room allocated successfully!', 'alert-success');
        closeModal('allocationModal');
        loadAllData();
        loadAdminAllocations();
    } catch (error) {
        showAlert('Error allocating room!', 'alert-error');
    }
}

function editRoom(roomId) {
    showAlert('Edit functionality coming soon!', 'alert-info');
}

function deleteRoom(roomId) {
    if (confirm('Are you sure you want to delete this room?')) {
        showAlert('Room deleted!', 'alert-success');
        loadAllData();
        loadAdminRooms();
    }
}

function removeAllocation(allocId) {
    if (confirm('Are you sure you want to remove this allocation?')) {
        showAlert('Allocation removed!', 'alert-success');
        loadAllData();
        loadAdminAllocations();
    }
}

function viewStudent(studentId) {
    showAlert('Student details coming soon!', 'alert-info');
}

// ===== EXPORT & REPORTS =====
function exportData() {
    showAlert('Exporting data...', 'alert-info');
}

function generateOccupancyReport() {
    showAlert('Generating occupancy report...', 'alert-info');
}

function generateStudentReport() {
    showAlert('Generating student report...', 'alert-info');
}

function generateAllocationReport() {
    showAlert('Generating allocation report...', 'alert-info');
}

function printAllRecords() {
    window.print();
}

// ===== SIDEBAR TOGGLE =====
function toggleSidebar() {
    document.querySelector('.sidebar').classList.toggle('open');
}

// Close modal on outside click
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

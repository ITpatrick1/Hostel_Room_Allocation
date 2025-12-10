// Global state
let currentUser = null;
let students = [];
let rooms = [];
let allocations = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Register form
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    
    // Student register form
    document.getElementById('studentRegisterForm').addEventListener('submit', handleStudentRegister);
    
    // Create room form
    document.getElementById('createRoomForm').addEventListener('submit', handleCreateRoom);
    
    // Check if user is already logged in
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showDashboard();
    } else {
        showLoginPage();
    }
});

// Toggle between login and register forms
function toggleForms() {
    document.getElementById('loginPage').classList.toggle('hidden');
    document.getElementById('registerPage').classList.toggle('hidden');
}

// Show alert
function showAlert(message, type = 'info') {
    const alertBox = document.getElementById('alertBox');
    alertBox.textContent = message;
    alertBox.className = `alert ${type}`;
    
    setTimeout(() => {
        alertBox.classList.add('hidden');
    }, 4000);
}

// Login handler
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const role = document.getElementById('loginRole').value;
    
    // For demo: Accept any email/password combination
    // In production, validate against backend
    if (!email || !password) {
        showAlert('Please fill in all fields', 'error');
        return;
    }
    
    // Demo accounts
    const validLogins = {
        'admin@hostel.com': { role: 'admin', password: 'admin123' },
        'student@hostel.com': { role: 'student', password: 'student123' }
    };
    
    // For demo purposes, accept any login
    currentUser = {
        id: Math.floor(Math.random() * 10000),
        email: email,
        role: role,
        name: email.split('@')[0]
    };
    
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    showAlert(`Welcome ${currentUser.name}!`, 'success');
    
    // Load data
    await loadData();
    showDashboard();
}

// Register handler
async function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirm = document.getElementById('registerConfirm').value;
    const studentId = document.getElementById('registerStudentId').value;
    
    if (password !== confirm) {
        showAlert('Passwords do not match', 'error');
        return;
    }
    
    // Create student account
    currentUser = {
        id: Math.floor(Math.random() * 10000),
        email: email,
        name: name,
        role: 'student',
        studentId: studentId
    };
    
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    showAlert('Account created successfully!', 'success');
    
    await loadData();
    showDashboard();
}

// Student registration
async function handleStudentRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('stdName').value;
    const email = document.getElementById('stdEmail').value;
    const phone = document.getElementById('stdPhone').value;
    
    try {
        const response = await fetch('/student', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, phone })
        });
        
        if (response.ok) {
            const student = await response.json();
            showAlert('Student registered successfully!', 'success');
            document.getElementById('studentRegisterForm').reset();
            await loadData();
        } else {
            showAlert('Registration failed', 'error');
        }
    } catch (err) {
        showAlert('Error: ' + err.message, 'error');
    }
}

// Create room (admin only)
async function handleCreateRoom(e) {
    e.preventDefault();
    
    const roomNumber = document.getElementById('roomNumber').value;
    const floor = document.getElementById('roomFloor').value;
    const capacity = document.getElementById('roomCapacity').value;
    
    try {
        const response = await fetch('/admin/rooms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                roomNumber: roomNumber,
                floor: parseInt(floor),
                capacity: parseInt(capacity),
                occupancy: 0
            })
        });
        
        if (response.ok) {
            showAlert('Room created successfully!', 'success');
            document.getElementById('createRoomForm').reset();
            await loadData();
        } else {
            showAlert('Failed to create room', 'error');
        }
    } catch (err) {
        showAlert('Error: ' + err.message, 'error');
    }
}

// Load data from backend
async function loadData() {
    try {
        // Load students
        const studentRes = await fetch('/student/list');
        if (studentRes.ok) {
            students = await studentRes.json();
        }
        
        // Load rooms
        const roomRes = await fetch('/admin/rooms');
        if (roomRes.ok) {
            rooms = await roomRes.json();
        }
        
        // Load allocations
        const allocRes = await fetch('/student/allocations');
        if (allocRes.ok) {
            allocations = await allocRes.json();
        }
    } catch (err) {
        console.error('Error loading data:', err);
    }
}

// Show dashboard
async function showDashboard() {
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('registerPage').classList.add('hidden');
    
    if (currentUser.role === 'admin') {
        document.getElementById('studentDashboard').classList.add('hidden');
        document.getElementById('adminDashboard').classList.remove('hidden');
        
        document.getElementById('adminGreeting').textContent = `Welcome, ${currentUser.name} (Admin)`;
        
        await loadData();
        renderAdminDashboard();
    } else {
        document.getElementById('adminDashboard').classList.add('hidden');
        document.getElementById('studentDashboard').classList.remove('hidden');
        
        document.getElementById('userGreeting').textContent = `Welcome, ${currentUser.name}`;
        
        await loadData();
        renderStudentDashboard();
    }
}

// Render student dashboard
function renderStudentDashboard() {
    // Render available rooms
    const roomsList = document.getElementById('roomsList');
    
    if (rooms.length === 0) {
        roomsList.innerHTML = '<p>No rooms available</p>';
        return;
    }
    
    roomsList.innerHTML = rooms.map(room => {
        const available = room.capacity - room.occupancy;
        const isFull = available === 0;
        
        return `
            <div class="room-card">
                <h4>Room ${room.roomNumber}</h4>
                <div class="room-info">Floor: ${room.floor}</div>
                <div class="room-info">Capacity: ${room.capacity}</div>
                <div class="room-info">Occupied: ${room.occupancy}</div>
                <div class="room-${isFull ? 'full' : 'available'}">
                    ${available > 0 ? `${available} available` : 'FULL'}
                </div>
                ${!isFull ? `<button class="btn btn-secondary" onclick="allocateRoom(${room.id})">Request Room</button>` : ''}
            </div>
        `;
    }).join('');
    
    // Show current allocation
    const myAllocation = allocations.find(a => a.studentId === currentUser.id);
    if (myAllocation) {
        document.getElementById('allocationInfo').innerHTML = `
            <div style="color: var(--primary-color); font-weight: 600;">
                ✓ Room Allocated: ${myAllocation.Room.roomNumber}
            </div>
            <p>Floor: ${myAllocation.Room.floor}</p>
            <p>Capacity: ${myAllocation.Room.capacity}</p>
        `;
    }
}

// Render admin dashboard
function renderAdminDashboard() {
    // Update stats
    const totalStudents = students.length;
    const totalRooms = rooms.length;
    const allocatedCount = allocations.length;
    const availableRoomsCount = rooms.filter(r => r.capacity > r.occupancy).length;
    
    document.getElementById('totalStudents').textContent = totalStudents;
    document.getElementById('totalRooms').textContent = totalRooms;
    document.getElementById('allocatedRooms').textContent = allocatedCount;
    document.getElementById('availableRooms').textContent = availableRoomsCount;
    
    // Render rooms table
    const roomsTableBody = document.getElementById('roomsTableBody');
    if (rooms.length === 0) {
        roomsTableBody.innerHTML = '<tr><td colspan="5">No rooms created yet</td></tr>';
    } else {
        roomsTableBody.innerHTML = rooms.map(room => `
            <tr>
                <td>${room.roomNumber}</td>
                <td>${room.floor}</td>
                <td>${room.capacity}</td>
                <td>${room.occupancy}</td>
                <td>${room.capacity - room.occupancy}</td>
            </tr>
        `).join('');
    }
    
    // Render students table
    const studentsTableBody = document.getElementById('studentsTableBody');
    if (students.length === 0) {
        studentsTableBody.innerHTML = '<tr><td colspan="5">No students registered</td></tr>';
    } else {
        studentsTableBody.innerHTML = students.map(student => {
            const allocation = allocations.find(a => a.studentId === student.id);
            return `
                <tr>
                    <td>${student.name}</td>
                    <td>${student.email}</td>
                    <td>${student.phone || '-'}</td>
                    <td>${allocation ? `Room ${allocation.Room.roomNumber}` : 'Not allocated'}</td>
                    <td>
                        ${!allocation ? `<button class="btn btn-secondary" onclick="adminAllocate(${student.id})">Allocate</button>` : ''}
                    </td>
                </tr>
            `;
        }).join('');
    }
}

// Allocate room (student)
async function allocateRoom(roomId) {
    try {
        // First ensure student is registered
        const studentCheck = students.find(s => s.email === currentUser.email);
        if (!studentCheck) {
            showAlert('Please register as a student first', 'warning');
            return;
        }
        
        const response = await fetch('/student/allocate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                studentId: studentCheck.id,
                roomId: roomId
            })
        });
        
        if (response.ok) {
            showAlert('Room allocated successfully!', 'success');
            await loadData();
            renderStudentDashboard();
        } else {
            const error = await response.json();
            showAlert(error.error || 'Failed to allocate room', 'error');
        }
    } catch (err) {
        showAlert('Error: ' + err.message, 'error');
    }
}

// Admin allocate room
async function adminAllocate(studentId) {
    const roomId = prompt('Enter Room ID:');
    if (!roomId) return;
    
    try {
        const response = await fetch('/student/allocate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                studentId: parseInt(studentId),
                roomId: parseInt(roomId)
            })
        });
        
        if (response.ok) {
            showAlert('Room allocated successfully!', 'success');
            await loadData();
            renderAdminDashboard();
        } else {
            const error = await response.json();
            showAlert(error.error || 'Failed to allocate room', 'error');
        }
    } catch (err) {
        showAlert('Error: ' + err.message, 'error');
    }
}

// Show login page
function showLoginPage() {
    document.getElementById('loginPage').classList.remove('hidden');
    document.getElementById('registerPage').classList.add('hidden');
    document.getElementById('studentDashboard').classList.add('hidden');
    document.getElementById('adminDashboard').classList.add('hidden');
}

// Logout
function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    document.getElementById('loginForm').reset();
    document.getElementById('registerForm').reset();
    showLoginPage();
    showAlert('Logged out successfully', 'success');
}

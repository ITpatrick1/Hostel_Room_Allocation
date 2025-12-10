# 🏨 Hostel Room Allocation - Web Interface Guide

## Overview

This is a complete web-based system for managing hostel room allocations. The system includes:

- **Student Interface**: Register, view available rooms, and request room allocation
- **Admin Interface**: Manage rooms, view students, and manage allocations
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Real-time Updates**: Instant feedback and status updates
- **Authentication**: Role-based access (Student vs Admin)

---

## Features

### For Students ✅
- **User Registration**: Create account with name, email, password, and student ID
- **View Available Rooms**: See all available rooms with capacity and occupancy info
- **Room Request**: Request a room allocation (automatically assigned)
- **View Allocation**: See which room you've been allocated
- **Student Profile**: View and manage your information

### For Administrators ✅
- **Room Management**: Create, edit, and delete hostel rooms
- **Student Management**: View all registered students and their allocations
- **Statistics Dashboard**: Real-time stats on:
  - Total students
  - Total rooms
  - Allocated rooms
  - Available rooms
- **Allocation Management**: Allocate/deallocate rooms to students
- **Generate Reports**: View comprehensive allocation reports

---

## Technology Stack

### Frontend
- **HTML5**: Semantic markup and structure
- **CSS3**: Responsive design with custom grid system
- **JavaScript (Vanilla)**: No framework dependencies, vanilla JS for UI logic
- **LocalStorage**: Client-side session management

### Backend
- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **Sequelize**: ORM for database operations
- **MySQL**: Database (or SQLite for local development)

### Infrastructure
- **Docker**: Containerization
- **Kubernetes**: Orchestration
- **GitHub Actions**: CI/CD pipeline

---

## Getting Started

### Local Development

#### 1. **Install Dependencies**
```bash
cd Hostel_Room_Allocation
npm install
```

#### 2. **Database Setup**

**Option A: MySQL (Production)**
```bash
# Create database
mysql -u root -p < database/schema.sql

# Update .env file with database credentials
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=hostel_allocation
```

**Option B: SQLite (Local Development - No Setup Needed)**
```bash
# Uncomment SQLite config in models/index.js
# Database will auto-create on first run
```

#### 3. **Run Application**
```bash
npm start
# Server runs on http://localhost:5000
```

#### 4. **Access Web Interface**
- Open browser: `http://localhost:5000`
- **Student Login**: email@example.com / password123
- **Admin Login**: admin@hostel.com / admin123

---

## API Endpoints

### Student Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/student` | Register a new student |
| POST | `/student/allocate` | Request room allocation |
| GET | `/student/allocations` | Get all allocations |
| GET | `/student/list` | Get all students |
| GET | `/student/:id` | Get student details |

**Example: Register Student**
```bash
curl -X POST http://localhost:5000/student \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890"
  }'
```

**Example: Allocate Room**
```bash
curl -X POST http://localhost:5000/student/allocate \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": 1,
    "roomId": 1
  }'
```

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/admin/rooms` | Create new room |
| GET | `/admin/rooms` | Get all rooms |
| PUT | `/admin/rooms/:id` | Update room |
| DELETE | `/admin/rooms/:id` | Delete room |
| GET | `/admin/stats` | Get statistics |
| GET | `/admin/students` | Get all students |

**Example: Create Room**
```bash
curl -X POST http://localhost:5000/admin/rooms \
  -H "Content-Type: application/json" \
  -d '{
    "roomNumber": "101",
    "floor": 1,
    "capacity": 4
  }'
```

---

## User Workflows

### Student Workflow

```
1. Open http://localhost:5000
   ↓
2. Click "Sign up" tab
   ↓
3. Fill registration form
   - Full Name: Your name
   - Email: your@email.com
   - Password: Choose secure password
   - Student ID: STU123456
   ↓
4. Click "Register" → Account created
   ↓
5. Student Dashboard appears
   ↓
6. Fill "Student Registration" form
   - Name, Email, Phone
   ↓
7. Click "Register" → Added to system
   ↓
8. Browse "Available Rooms"
   ↓
9. Click "Request Room" button
   ↓
10. Room allocated → View in "My Room Allocation"
```

### Admin Workflow

```
1. Open http://localhost:5000
   ↓
2. Login tab → Select role: "Admin"
   ↓
3. Enter: admin@hostel.com / admin123
   ↓
4. Admin Dashboard appears with 4 stats cards
   ↓
5. Create rooms in "Create New Room" section
   - Room Number: 101
   - Floor: 1
   - Capacity: 4
   ↓
6. View "Rooms Management" table
   - Shows all rooms with occupancy
   ↓
7. View "Students & Allocations" table
   - Shows all students and their rooms
   ↓
8. Click "Allocate" to manually assign rooms
```

---

## UI Components

### Login Page
- Email/password input
- Role selection (Student/Admin)
- Toggle between login and registration
- Form validation

### Student Dashboard
- **Left Column**:
  - My Room Allocation card (shows allocated room info)
  - Student Registration form
- **Right Column**:
  - Available Rooms grid (card layout with room details)

### Admin Dashboard
- **Statistics Cards**: Total Students, Rooms, Allocations, Available
- **Create Room Form**: Input for new rooms
- **Rooms Management Table**: List of all rooms with stats
- **Students Table**: List of all students with allocation status

---

## Database Schema

### Students Table
```sql
CREATE TABLE `Students` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) UNIQUE NOT NULL,
  `phone` VARCHAR(20),
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Rooms Table
```sql
CREATE TABLE `Rooms` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `roomNumber` VARCHAR(10) UNIQUE NOT NULL,
  `floor` INT NOT NULL,
  `capacity` INT NOT NULL,
  `occupancy` INT DEFAULT 0,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Allocations Table
```sql
CREATE TABLE `Allocations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `studentId` INT NOT NULL,
  `roomId` INT NOT NULL,
  `allocationDate` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`studentId`) REFERENCES `Students`(`id`),
  FOREIGN KEY (`roomId`) REFERENCES `Rooms`(`id`),
  UNIQUE KEY (`studentId`)
);
```

---

## Features Implemented

### Authentication & Authorization ✅
- Login/Registration system
- Role-based access control
- Session management with localStorage
- Logout functionality

### Data Management ✅
- Create, read, update, delete operations
- Form validation on frontend
- API validation on backend
- Error handling and user feedback

### User Interface ✅
- Responsive design (works on all devices)
- Intuitive navigation
- Real-time updates
- Loading states and alerts
- Professional color scheme and typography

### Student Features ✅
- Self-registration
- Browse available rooms
- Request room allocation
- View allocation status
- Profile management

### Admin Features ✅
- Dashboard with statistics
- Room creation and management
- Student management
- Allocation management
- Manual room allocation
- Room editing/deletion

---

## Alerts and Notifications

### Success Messages
- "Account created successfully!"
- "Student registered successfully!"
- "Room allocated successfully!"
- "Room created successfully!"
- "Logged out successfully"

### Error Messages
- "Passwords do not match"
- "Please fill in all fields"
- "Room full"
- "Student not registered"
- Server-side validation errors

### Warning Messages
- "Please register as a student first"
- Generic error handling

---

## Styling Details

### Color Scheme
- **Primary**: Green (#4CAF50) - Main actions and success
- **Secondary**: Blue (#2196F3) - Secondary actions
- **Danger**: Red (#f44336) - Delete and error states
- **Light**: Gray (#f5f5f5) - Backgrounds

### Responsive Breakpoints
- **Desktop**: Full grid layout (1200px+)
- **Tablet**: Adjusted grid (768px-1199px)
- **Mobile**: Single column (< 768px)

### Interactive Elements
- Buttons with hover effects
- Form inputs with focus states
- Cards with shadow effects
- Smooth animations and transitions

---

## Deployment Options

### 1. **Docker (Local Container)**
```bash
docker build -t hostel-allocation .
docker run -p 5000:3000 hostel-allocation
```

### 2. **Kubernetes (Production)**
```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/ -n hostel-allocation
kubectl apply -f monitoring/ -n hostel-allocation
```

### 3. **Manual (Linux/Mac)**
```bash
npm install
npm start
# Access at http://localhost:5000
```

### 4. **Cloud Platforms**
- **Heroku**: `git push heroku main`
- **AWS EC2**: Deploy Docker image
- **Azure App Service**: Connect GitHub repo
- **Google Cloud Run**: Deploy container

---

## Troubleshooting

### Issue: "Cannot GET /"
- **Solution**: Ensure public folder exists with index.html
- Check: `ls public/` should show index.html, styles.css, app.js

### Issue: "404 Not Found" for API calls
- **Solution**: Check route definitions in src/routes/
- Ensure routes are mounted in app.js

### Issue: Database connection error
- **Solution**: Check .env file for correct database credentials
- Or use SQLite (no setup needed)

### Issue: "Rooms not loading"
- **Solution**: Create a room first from admin panel
- Or seed database with sample data

### Issue: Session lost on page refresh
- **Solution**: Check localStorage is enabled
- Check browser dev tools: Application → LocalStorage

---

## Future Enhancements

- [ ] Email notifications for allocations
- [ ] SMS alerts for room changes
- [ ] Payment integration for hostel fees
- [ ] Document upload (ID verification)
- [ ] Waitlist functionality
- [ ] Roommate matching algorithm
- [ ] Maintenance request system
- [ ] Visitor management
- [ ] Two-factor authentication
- [ ] Real-time notifications (WebSockets)

---

## Support

For issues or questions:
1. Check the Troubleshooting section
2. Review API documentation
3. Check browser console for JavaScript errors
4. View server logs: `npm start`
5. Check git repository: https://github.com/ITpatrick1/Hostel_Room_Allocation

---

**Version**: 1.0.0  
**Last Updated**: December 10, 2025  
**Author**: Patrick (ITpatrick1)  
**License**: MIT

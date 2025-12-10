# 🚀 Quick Start - Running the Web System

## What You Get

A **complete, production-ready hostel allocation system** with:
- ✅ Student dashboard (register, view rooms, request allocation)
- ✅ Admin dashboard (manage rooms, students, statistics)
- ✅ REST APIs for all operations
- ✅ Responsive web interface (desktop, tablet, mobile)
- ✅ Role-based access control
- ✅ Real-time data updates

---

## Run It Now (5 Minutes)

### Option 1: Local (Linux/Mac/Windows)

```bash
# 1. Navigate to project
cd /home/patrick/hostel_allocation/Hostel_Room_Allocation

# 2. Install dependencies
npm install

# 3. Start server
npm start

# 4. Open browser
# http://localhost:5000
```

### Option 2: Docker

```bash
# 1. Build image
docker build -t hostel-allocation .

# 2. Run container
docker run -p 5000:5000 hostel-allocation

# 3. Open browser
# http://localhost:5000
```

### Option 3: Kubernetes (Production)

```bash
# 1. Create namespace
kubectl apply -f k8s/namespace.yaml

# 2. Deploy everything
kubectl apply -f k8s/ -n hostel-allocation
kubectl apply -f monitoring/ -n hostel-allocation

# 3. Access service
kubectl port-forward -n hostel-allocation svc/hostel-allocation 5000:80

# 4. Open browser
# http://localhost:5000
```

---

## Demo Credentials

### Student Account
- **Email**: student@hostel.com
- **Password**: student123
- **Role**: Student

### Admin Account
- **Email**: admin@hostel.com
- **Password**: admin123
- **Role**: Admin

---

## What Each User Can Do

### 👤 Student
1. ✅ Create account and login
2. ✅ Register in system (provide name, email, phone)
3. ✅ View all available rooms
4. ✅ Request room allocation
5. ✅ See allocated room details
6. ✅ View room capacity and occupancy
7. ✅ Logout

### 👨‍💼 Admin
1. ✅ Login with admin credentials
2. ✅ Create and manage rooms
3. ✅ View all students
4. ✅ View all allocations
5. ✅ See statistics dashboard
   - Total students
   - Total rooms
   - Allocated rooms
   - Available rooms
6. ✅ Manually allocate rooms
7. ✅ Edit room details
8. ✅ Delete unused rooms
9. ✅ Export data (future)

---

## Features Walkthrough

### Login Page
```
┌─────────────────────────────┐
│   🏨 Hostel Room Allocation │
│   Student Housing System    │
│                             │
│ Email: ________________     │
│ Password: ______________    │
│ Role: [Student ▼]           │
│                             │
│      [ Login ]              │
│                             │
│ Don't have account? Sign up │
└─────────────────────────────┘
```

### Student Dashboard
```
Left Column:
├── My Room Allocation (shows current room)
└── Student Registration Form

Right Column:
└── Available Rooms Grid (interactive cards)
    ├── Room 101
    ├── Room 102
    ├── Room 103
    └── ... more rooms
```

### Admin Dashboard
```
┌─────────────────────────────────────────┐
│ Stats Cards:                            │
│ [Total Students] [Total Rooms]          │
│ [Allocated Rooms] [Available Rooms]     │
├─────────────────────────────────────────┤
│ Create New Room Form                    │
├─────────────────────────────────────────┤
│ Rooms Management Table                  │
│ Room# | Floor | Capacity | Occupancy   │
├─────────────────────────────────────────┤
│ Students & Allocations Table            │
│ Name | Email | Phone | Room | Action   │
└─────────────────────────────────────────┘
```

---

## API Examples

### Register Student
```bash
curl -X POST http://localhost:5000/student \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890"
  }'
```

### Create Room (Admin)
```bash
curl -X POST http://localhost:5000/admin/rooms \
  -H "Content-Type: application/json" \
  -d '{
    "roomNumber": "101",
    "floor": 1,
    "capacity": 4
  }'
```

### Request Room Allocation
```bash
curl -X POST http://localhost:5000/student/allocate \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": 1,
    "roomId": 1
  }'
```

### View All Rooms
```bash
curl http://localhost:5000/admin/rooms
```

### View All Allocations
```bash
curl http://localhost:5000/student/allocations
```

---

## Typical Use Cases

### Scenario 1: Student Enrolls
1. **Student opens**: http://localhost:5000
2. **Clicks**: "Sign up" tab
3. **Fills**: Name, Email, Password, Student ID
4. **Clicks**: "Register"
5. **System**: Creates account, redirects to dashboard
6. **Fills**: Student Registration form (name, email, phone)
7. **Clicks**: "Register"
8. **Browses**: Available rooms
9. **Clicks**: "Request Room" on Room 101
10. **System**: Allocates room (if available)
11. **Sees**: "My Room Allocation" updated with room details

### Scenario 2: Admin Creates Rooms
1. **Admin opens**: http://localhost:5000
2. **Selects**: Role = "Admin"
3. **Enters**: admin@hostel.com / admin123
4. **Clicks**: "Login"
5. **Sees**: Admin dashboard
6. **Fills**: Create New Room form
   - Room Number: 101
   - Floor: 1
   - Capacity: 4
7. **Clicks**: "Create Room"
8. **System**: Room added
9. **Views**: Rooms Management table
10. **Repeats**: Steps 6-8 for more rooms
11. **Views**: Statistics update in real-time

### Scenario 3: Admin Allocates Room
1. **Admin**: Logged in
2. **Sees**: Students & Allocations table
3. **Finds**: Student without allocation
4. **Clicks**: "Allocate" button
5. **Enters**: Room ID (e.g., 1)
6. **System**: Allocates room
7. **Sees**: Student's room updated
8. **Notices**: "Available Rooms" stat decreases

---

## Monitoring & Health Checks

### Health Status Endpoint
```bash
curl http://localhost:5000/health
# Response: {"status": "ok", "database": "connected"}
```

### Readiness Check
```bash
curl http://localhost:5000/ready
# Response: {"ready": true}
```

### Prometheus Metrics
```bash
curl http://localhost:5000/metrics
# Returns: http_requests_total, http_errors_total, db_connection_status
```

---

## Architecture

```
┌─────────────────────────────────────────┐
│         Browser (Student/Admin)         │
│  HTML/CSS/JavaScript User Interface     │
└──────────────┬──────────────────────────┘
               │ HTTP/REST
┌──────────────▼──────────────────────────┐
│       Node.js Express Server            │
│  ├─ /student routes                    │
│  ├─ /admin routes                      │
│  ├─ /health, /ready, /metrics         │
│  └─ static/ (HTML, CSS, JS)           │
└──────────────┬──────────────────────────┘
               │ SQL
┌──────────────▼──────────────────────────┐
│        MySQL Database (or SQLite)       │
│  ├─ students table                     │
│  ├─ rooms table                        │
│  └─ allocations table                  │
└─────────────────────────────────────────┘
```

---

## Files Structure

```
public/
├── index.html      (Main UI template)
├── styles.css      (Responsive styling)
└── app.js          (Frontend JavaScript)

src/
├── app.js          (Express server)
├── models/
│   ├── index.js    (Sequelize config)
│   ├── Student.js
│   ├── Room.js
│   └── Allocation.js
└── routes/
    ├── studentRoutes.js
    └── adminRoutes.js

k8s/
├── namespace.yaml
├── deployment.yaml
├── service.yaml
├── hpa.yaml
└── ... (other K8s configs)

package.json       (Dependencies)
docker-compose.yml (Local DB setup)
Dockerfile         (Container image)
```

---

## Environment Variables

Create `.env` file:
```env
NODE_ENV=development
PORT=5000

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=hostel_allocation
DB_PORT=3306

# Or use SQLite (no config needed)
# DB_DIALECT=sqlite
# DB_STORAGE=hostel.db
```

---

## Troubleshooting

### Problem: "Cannot GET /"
```
Solution: Check that public/index.html exists
ls public/
```

### Problem: Database connection error
```
Solution: Use SQLite (no setup needed)
Or install MySQL and configure .env
```

### Problem: Port 5000 already in use
```
Solution: Change port in .env or run on different port
npm start -- --port 3001
```

### Problem: Changes not reflecting
```
Solution: Clear browser cache and localStorage
Open DevTools → Application → Clear storage
```

---

## Next Steps

1. **Run locally** - Follow "Run It Now" section above
2. **Test features** - Create rooms, allocate students
3. **Explore APIs** - Use curl examples to test endpoints
4. **Deploy to cloud** - Use Docker or Kubernetes
5. **Extend features** - Add more functionality as needed
6. **Monitor** - Use health endpoints and Prometheus metrics

---

## Support & Documentation

- **Full Web Interface Guide**: Read `WEB_INTERFACE_GUIDE.md`
- **API Documentation**: See routes in `src/routes/`
- **DevOps Phases**: Check `PHASE_*.md` files
- **GitHub Repository**: https://github.com/ITpatrick1/Hostel_Room_Allocation

---

**Ready to start?** Run `npm install && npm start` now! 🚀


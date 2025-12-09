# Hostel Room Allocation System

[![CI/CD Pipeline](https://github.com/username/hostel-allocation/workflows/CI%2FCD%20Pipeline/badge.svg)](https://github.com/username/hostel-allocation/actions)
[![Security Checks](https://github.com/username/hostel-allocation/workflows/Security%20Checks/badge.svg)](https://github.com/username/hostel-allocation/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A modern, scalable hostel management system with automated CI/CD pipeline, real-time room allocation, and comprehensive admin controls.

## Features

- ✅ **Student Portal** - Register, request room allocation, track assignments
- ✅ **Admin Dashboard** - Manage rooms, allocations, and occupancy
- ✅ **Real-time Updates** - Live room availability status
- ✅ **Role-based Access** - Student and admin portals
- ✅ **Database Integration** - MySQL with Sequelize ORM
- ✅ **Automated CI/CD** - GitHub Actions pipeline
- ✅ **Docker Support** - Multi-stage builds, optimized containers
- ✅ **Security** - Vulnerability scanning, non-root users
- ✅ **Testing** - Jest test suite with coverage reports
- ✅ **Responsive UI** - Bootstrap 5, mobile-friendly

## Tech Stack

### Backend
- **Node.js** 20 (Alpine Linux)
- **Express.js** 5.x
- **Sequelize** 6.x (ORM)
- **MySQL** 8

### Frontend
- **Bootstrap** 5.3
- **Vanilla JavaScript** (ES6+)
- **Responsive Design**

### DevOps
- **Docker** with multi-stage builds
- **Docker Compose** for orchestration
- **GitHub Actions** for CI/CD
- **Trivy** for security scanning

## Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- MySQL 8 (or use Docker)

### Local Development

```bash
# Clone the repository
git clone https://github.com/username/hostel-allocation.git
cd hostel-allocation

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Start development server
npm run dev
```

Server runs at: `http://localhost:5000`

### Docker Setup

```bash
# Build and run with Docker Compose
docker compose up

# Access the application
# Frontend: http://localhost:5000
# Database: localhost:3306
```

## Project Structure


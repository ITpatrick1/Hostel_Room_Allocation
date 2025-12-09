# Hostel Room Allocation System

A comprehensive, production-ready hostel room allocation system built with Node.js, Express, and MySQL with complete CI/CD, Kubernetes deployment, and comprehensive monitoring.

## 🎯 Features

- ✅ Student registration and management
- ✅ Room allocation with occupancy tracking
- ✅ Admin dashboard for room management
- ✅ RESTful API endpoints
- ✅ Test coverage: 82.35%
- ✅ **Docker containerization** (Docker Hub: `itpatrick/hostel_room_allocation`)
- ✅ **GitHub Actions CI/CD pipeline** (automated build, test, security scan, push)
- ✅ **Kubernetes deployment** with rolling updates and auto-scaling
- ✅ **Prometheus + Grafana monitoring** with 5 alert rules
- ✅ **Horizontal Pod Autoscaler** (3-10 replicas)
- ✅ **Health checks** (`/health`, `/ready`, `/metrics`)
- ✅ **Security scanning** (Trivy + CodeQL)
- ✅ **Slack notifications** for pipeline and alerts
- ✅ **Comprehensive documentation** (1,500+ lines)

## 🛠️ Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **ORM:** Sequelize
- **Database:** MySQL / SQLite
- **Testing:** Jest
- **Containerization:** Docker & Docker Compose
- **Orchestration:** Kubernetes
- **Monitoring:** Prometheus + Grafana + AlertManager
- **CI/CD:** GitHub Actions
- **Code Quality:** ESLint, Trivy, CodeQL

## 📊 Architecture Overview

```
Git Repository (GitHub)
    ↓
CI/CD Pipeline (GitHub Actions)
    ├─ Code Quality Checks
    ├─ Security Scanning (Trivy + CodeQL)
    ├─ Docker Build & Push (itpatrick/hostel_room_allocation)
    ├─ GitHub Release Creation
    └─ Slack Notifications
        ↓
Kubernetes Cluster
    ├─ Application Deployment (3+ pods)
    │   ├─ /health - Liveness probe
    │   ├─ /ready - Readiness probe
    │   └─ /metrics - Prometheus metrics
    ├─ Service (LoadBalancer)
    ├─ HPA (Horizontal Pod Autoscaler 3-10)
    └─ Monitoring Stack
        ├─ Prometheus (metrics collection)
        ├─ Grafana (visualization)
        ├─ AlertManager (alert routing)
        └─ Alert Rules (CPU, memory, errors)
```

## 📖 Documentation

- **[QUICKSTART.md](./QUICKSTART.md)** - Fast reference for deployment and scaling
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete Kubernetes deployment guide (250+ lines)
- **[OPERATIONS.md](./OPERATIONS.md)** - Operations, monitoring, and troubleshooting (420+ lines)
- **[PIPELINE_SUMMARY.md](./PIPELINE_SUMMARY.md)** - CI/CD architecture and components
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Complete project overview

## 🚀 Quick Start

### Local Development
```bash
# Install dependencies
npm install

# Run tests
npm test

# Start with Docker Compose (includes MySQL)
docker-compose up

# Access application
curl http://localhost:3000
```

### Local Testing with Monitoring Stack
```bash
# Start application + Prometheus + Grafana + AlertManager
docker-compose -f docker-compose-monitoring.yml up

# Access services
# Application: http://localhost:3000
# Grafana: http://localhost:3001 (admin/admin)
# Prometheus: http://localhost:9090
```

### Kubernetes Deployment
```bash
# Deploy to Kubernetes cluster
./scripts/deploy-k8s.sh

# Access application
kubectl port-forward svc/hostel-allocation 3000:80 -n hostel-allocation

# Monitor
kubectl get pods -n hostel-allocation -w
```

## 🔄 CI/CD Pipeline

### Automated Workflow (GitHub Actions)

**On Main Branch Push:**
1. Code quality checks (linting)
2. Security scanning (Trivy + CodeQL)
3. Build Docker image
4. Slack notification

**On Version Tag (v1.x.x):**
1. All above checks
2. Push Docker image to Docker Hub
3. Create GitHub Release
4. Prepare Kubernetes deployment
5. Slack notification

### Example Usage
```bash
# Trigger CI pipeline (quality checks + security scan)
git push origin main

# Trigger CD pipeline (build + push + release)
git tag v1.0.0
git push origin v1.0.0
```

Visit: https://github.com/ITpatrick1/Hostel_Room_Allocation/actions

## 📊 Monitoring & Auto-scaling

### Health Endpoints
- `GET /health` - Liveness probe (used by Kubernetes)
- `GET /ready` - Readiness probe (pod health)
- `GET /metrics` - Prometheus metrics

### Monitoring Stack
- **Prometheus:** Collects metrics every 15 seconds
- **Grafana:** Visualizes metrics and trends
- **AlertManager:** Routes alerts to Slack
- **HPA:** Auto-scales pods 3-10 replicas based on CPU/memory

### Auto-scaling Behavior
- **Scale up:** When CPU > 70% or Memory > 80%
- **Scale down:** When idle > 5 minutes (conservative)
- **Speed:** Scales up in ~30 seconds under load
- **Limits:** Min 3 pods, Max 10 pods

### Test Auto-scaling
```bash
# Generate load
ab -n 10000 -c 100 http://localhost:3000/

# Watch scaling in real-time
watch kubectl get hpa -n hostel-allocation
```

## 🔐 Security Features

- ✅ Non-root container execution
- ✅ Security scanning (Trivy for vulnerabilities)
- ✅ Code analysis (CodeQL for SAST)
- ✅ SARIF report uploads to GitHub
- ✅ Pod security context enforced
- ✅ RBAC configured
- ✅ Network policies supported
- ✅ TLS/HTTPS ready (Ingress with cert-manager)

## 📁 Project Structure
# Kubernetes Deployment Guide

## Prerequisites

- Kubernetes cluster (v1.20+)
- kubectl configured
- Docker images pushed to `itpatrick/hostel_room_allocation:latest`
- Persistent storage class available (optional, for Prometheus/Grafana)

## Directory Structure

```
k8s/
├── namespace.yaml          # Namespace for the application
├── configmap.yaml          # Environment configuration
├── deployment.yaml         # Main application deployment
├── service.yaml            # LoadBalancer service
├── hpa.yaml                # Horizontal Pod Autoscaler
└── ingress.yaml            # Ingress configuration

monitoring/
├── prometheus-config.yaml       # Prometheus configuration
├── alert-rules.yaml            # Alert rules
├── prometheus-deployment.yaml   # Prometheus + ServiceAccount
├── grafana-deployment.yaml      # Grafana dashboards
└── alertmanager-deployment.yaml # Alertmanager for routing alerts
```

## Deployment Steps

### 1. Deploy Core Application

```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Deploy configuration and application
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml

# Verify deployment
kubectl get pods -n hostel-allocation
kubectl get svc -n hostel-allocation
```

### 2. Configure Auto-scaling

```bash
# Deploy HPA (requires metrics-server)
# First, check if metrics-server is installed:
kubectl get deployment metrics-server -n kube-system

# If not installed, install it:
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# Deploy HPA
kubectl apply -f k8s/hpa.yaml

# Monitor scaling
kubectl get hpa -n hostel-allocation -w
```

### 3. Setup Monitoring

```bash
# Deploy Prometheus
kubectl apply -f monitoring/prometheus-config.yaml
kubectl apply -f monitoring/alert-rules.yaml
kubectl apply -f monitoring/prometheus-deployment.yaml

# Deploy Grafana
kubectl apply -f monitoring/grafana-deployment.yaml

# Deploy AlertManager
kubectl apply -f monitoring/alertmanager-deployment.yaml

# Verify monitoring stack
kubectl get pods -n hostel-allocation
```

### 4. Configure Ingress (Optional)

Update the `k8s/ingress.yaml` with your domain and apply:

```bash
kubectl apply -f k8s/ingress.yaml
```

## Accessing Services

### Application
```bash
# Get LoadBalancer IP/DNS
kubectl get svc hostel-allocation -n hostel-allocation

# Access application
curl http://<EXTERNAL-IP>
```

### Prometheus
```bash
# Port forward to Prometheus
kubectl port-forward -n hostel-allocation svc/prometheus 9090:9090

# Access at http://localhost:9090
```

### Grafana
```bash
# Port forward to Grafana
kubectl port-forward -n hostel-allocation svc/grafana 3000:3000

# Access at http://localhost:3000
# Default credentials: admin / admin
```

### AlertManager
```bash
# Port forward to AlertManager
kubectl port-forward -n hostel-allocation svc/alertmanager 9093:9093

# Access at http://localhost:9093
```

## Health Checks

The application exposes three endpoints:

- `/health` - Liveness probe (is the pod alive?)
- `/ready` - Readiness probe (is the pod ready to serve traffic?)
- `/metrics` - Prometheus metrics

Test them:

```bash
# Port forward to application
kubectl port-forward -n hostel-allocation svc/hostel-allocation 3000:80

# In another terminal
curl http://localhost:3000/health
curl http://localhost:3000/ready
curl http://localhost:3000/metrics
```

## Auto-scaling Behavior

The HPA is configured to:

- **Minimum replicas:** 3
- **Maximum replicas:** 10
- **Scale up:** When CPU > 70% or Memory > 80%
- **Scale down:** When CPU < 70% and Memory < 80% (300s stabilization window)

Monitor scaling:

```bash
kubectl get hpa -n hostel-allocation -w
```

## Monitoring Alerts

Configured alerts:

1. **HighErrorRate** - If error rate > 5% for 5 minutes
2. **HighMemoryUsage** - If memory usage > 85% of limit
3. **HighCPUUsage** - If CPU usage > 80%
4. **PodCrashLooping** - If pod restarts > 0.1 times per 15 minutes
5. **DeploymentReplicasMismatch** - If desired replicas ≠ available replicas

## Rolling Updates

To deploy a new version:

```bash
# Push new image to Docker Hub
docker push itpatrick/hostel_room_allocation:v1.7.0

# Update deployment
kubectl set image deployment/hostel-allocation \
  hostel-allocation=itpatrick/hostel_room_allocation:v1.7.0 \
  -n hostel-allocation

# Monitor rollout
kubectl rollout status deployment/hostel-allocation -n hostel-allocation

# Rollback if needed
kubectl rollout undo deployment/hostel-allocation -n hostel-allocation
```

## Resource Requirements

### Application Pod
- CPU Request: 100m | Limit: 500m
- Memory Request: 128Mi | Limit: 512Mi

### Prometheus
- CPU Request: 500m | Limit: 1000m
- Memory Request: 500Mi | Limit: 1Gi

### Grafana
- CPU Request: 100m | Limit: 500m
- Memory Request: 128Mi | Limit: 512Mi

### Alertmanager
- CPU Request: 100m | Limit: 500m
- Memory Request: 128Mi | Limit: 512Mi

## Troubleshooting

```bash
# View pod logs
kubectl logs <pod-name> -n hostel-allocation

# Describe pod for events
kubectl describe pod <pod-name> -n hostel-allocation

# View deployment status
kubectl describe deployment hostel-allocation -n hostel-allocation

# Check HPA status and metrics
kubectl describe hpa hostel-allocation-hpa -n hostel-allocation

# View all resources
kubectl get all -n hostel-allocation
```

## Production Checklist

- [ ] Configure persistent volumes for Prometheus/Grafana
- [ ] Setup RBAC policies
- [ ] Configure network policies
- [ ] Enable pod security policies
- [ ] Setup backup strategy for Prometheus data
- [ ] Configure real Slack webhook for AlertManager
- [ ] Update Ingress with real domain
- [ ] Configure SSL/TLS certificates
- [ ] Setup log aggregation (ELK/Loki)
- [ ] Configure resource quotas
- [ ] Setup namespace limits
- [ ] Enable audit logging

# Phase 6: Deploy - CD Pipeline Configuration

## Overview
This phase implements Continuous Deployment with rolling updates to ensure zero-downtime deployments.

## Deployment Strategy

### Rolling Update Configuration
```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1           # Allow 1 extra pod during update
    maxUnavailable: 0     # Never take down all pods
```

**Benefits:**
- Zero-downtime deployments
- Gradual rollout of new versions
- Easy rollback if issues detected
- Traffic continuity during updates

### Pod Resource Requirements

#### Per-Pod Allocation:
| Resource | Request | Limit | Reason |
|----------|---------|-------|--------|
| CPU | 100m | 500m | Node.js baseline + Express overhead |
| Memory | 128Mi | 512Mi | App runtime + database connections |
| Storage | 1Gi | 5Gi | Logs and temp files |

#### Cluster Scenarios:
| Scenario | Pods | Total CPU | Total Memory | Node Count | Cost |
|----------|------|----------|--------------|------------|------|
| Minimum (Idle) | 3 | 300m | 384Mi | 1 | ~$0.15/hr |
| Average Load | 5 | 500m | 640Mi | 1-2 | ~$0.25/hr |
| Peak Load | 10 | 1000m | 1280Mi | 3-4 | ~$0.50/hr |

### Deployment Manifest Highlights

**File:** `k8s/deployment.yaml`

Key Features:
1. **Replicas:** 3 (high availability)
2. **Strategy:** RollingUpdate with maxSurge=1, maxUnavailable=0
3. **Image Pull Policy:** Always (ensures latest image)
4. **Health Checks:**
   - Liveness Probe: `/health` (checks if pod is alive)
   - Readiness Probe: `/ready` (checks if pod can receive traffic)
   - Initial Delay: 30 seconds
   - Period: 10 seconds

5. **Resource Limits:**
   - Requests: 100m CPU, 128Mi Memory
   - Limits: 500m CPU, 512Mi Memory

6. **Prometheus Integration:**
   - Scrape enabled on port 3000
   - Metrics path: `/metrics`
   - Automatic service discovery

### Service Configuration

**File:** `k8s/service.yaml`

```yaml
apiVersion: v1
kind: Service
metadata:
  name: hostel-allocation
  namespace: hostel-allocation
spec:
  type: LoadBalancer
  selector:
    app: hostel-allocation
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  sessionAffinity: None
```

**Features:**
- LoadBalancer type for external access
- Port mapping: 80 → 3000
- Service discovery via DNS: `hostel-allocation.hostel-allocation.svc.cluster.local`

### Deployment Procedure

#### Step 1: Create Namespace
```bash
kubectl apply -f k8s/namespace.yaml
```

#### Step 2: Apply Configuration
```bash
kubectl apply -f k8s/configmap.yaml
```

#### Step 3: Deploy Application
```bash
kubectl apply -f k8s/deployment.yaml
```

#### Step 4: Expose Service
```bash
kubectl apply -f k8s/service.yaml
```

#### Step 5: Verify Deployment
```bash
# Check pod status
kubectl get pods -n hostel-allocation -w

# Check service
kubectl get svc -n hostel-allocation

# Check deployment status
kubectl get deployment hostel-allocation -n hostel-allocation

# Expected output: 3 replicas running
```

### Rolling Update Procedure

#### Update Image to New Version
```bash
kubectl set image deployment/hostel-allocation \
  hostel-allocation=itpatrick/hostel_room_allocation:v1.1.0 \
  -n hostel-allocation

# Monitor the rollout
kubectl rollout status deployment/hostel-allocation -n hostel-allocation
```

#### Rollback if Issues Detected
```bash
kubectl rollout undo deployment/hostel-allocation -n hostel-allocation

# Verify rollback
kubectl rollout history deployment/hostel-allocation -n hostel-allocation
```

### Health Check Endpoints

The application exposes three critical endpoints for Kubernetes:

#### 1. /health (Liveness Probe)
```
GET /health
Response: { "status": "ok", "database": "connected" }
Status Code: 200 (healthy) or 503 (unhealthy)
```
Purpose: Determines if pod should be restarted

#### 2. /ready (Readiness Probe)
```
GET /ready
Response: { "ready": true }
Status Code: 200 (ready) or 503 (not ready)
```
Purpose: Determines if pod should receive traffic

#### 3. /metrics (Prometheus)
```
GET /metrics
Response: Prometheus format metrics
Status Code: 200
```
Purpose: Provides metrics for monitoring

### Ingress Configuration

**File:** `k8s/ingress.yaml`

Optional HTTPS/HTTP routing:
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: hostel-allocation-ingress
  namespace: hostel-allocation
spec:
  rules:
  - host: allocation.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: hostel-allocation
            port:
              number: 80
```

### Deployment Best Practices Implemented

1. ✅ **Resource Limits:** Prevent resource starvation
2. ✅ **Health Checks:** Automatic failure detection and recovery
3. ✅ **Rolling Updates:** Zero-downtime deployments
4. ✅ **Image Pull Policy:** Always use latest image
5. ✅ **Namespaces:** Isolate resources
6. ✅ **Service Discovery:** DNS-based service location
7. ✅ **Pod Anti-affinity:** (Optional) Spread across nodes

---

## Deployment Verification Checklist

- [ ] Namespace created: `kubectl get namespace hostel-allocation`
- [ ] ConfigMap deployed: `kubectl get configmap -n hostel-allocation`
- [ ] Deployment running: `kubectl get deployment -n hostel-allocation`
- [ ] 3 pods running: `kubectl get pods -n hostel-allocation | grep Running`
- [ ] Service created: `kubectl get svc -n hostel-allocation`
- [ ] Health check responds: `kubectl exec <pod> -n hostel-allocation -- curl localhost:3000/health`
- [ ] Metrics endpoint works: `kubectl exec <pod> -n hostel-allocation -- curl localhost:3000/metrics`
- [ ] LoadBalancer has external IP: `kubectl get svc -n hostel-allocation -o wide`

---

## CD Pipeline Integration

The GitHub Actions workflow triggers deployment on new tags:

```yaml
- name: Deploy to Kubernetes
  if: startsWith(github.ref, 'refs/tags/')
  run: |
    kubectl set image deployment/hostel-allocation \
      hostel-allocation=itpatrick/hostel_room_allocation:${{ github.ref_name }} \
      -n hostel-allocation
    kubectl rollout status deployment/hostel-allocation -n hostel-allocation
```

**Trigger:** Push tag matching `v*.*.* ` pattern
**Action:** Update deployment to new image
**Verification:** Wait for rollout to complete

---

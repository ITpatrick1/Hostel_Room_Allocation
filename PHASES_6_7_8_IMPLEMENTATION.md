# Phases 6-8 Implementation Guide: Deploy, Operate, Monitor

## Quick Start - Deploy Everything in Minutes

```bash
cd /home/patrick/hostel_allocation/Hostel_Room_Allocation

# 1. Ensure cluster is running
kubectl cluster-info

# 2. Deploy all at once
kubectl apply -f k8s/
kubectl apply -f monitoring/

# 3. Verify deployment
kubectl get all -n hostel-allocation
kubectl get hpa -n hostel-allocation
```

---

## Phase 6: Deploy - Configuration Details

### What Gets Deployed

**Kubernetes Resources:**
- Namespace: `hostel-allocation`
- Deployment: 3 replicas with rolling updates
- Service: LoadBalancer on port 80 → 3000
- ConfigMap: Environment variables
- HPA: Auto-scales 3-10 pods

**Rolling Update Strategy:**
```
Old Pod           New Pod
  │                 │
  ├─ Running      ├─ Starting
  ├─ Running      ├─ Warming up (30s initial delay)
  ├─ Running      ├─ Ready to receive traffic
  │                 ├─ Receiving traffic
  ├─ Draining     ├─ Receiving traffic
  └─ Stopped      └─ Running
  
Total Time: ~60 seconds for 1 pod replacement
All 3 pods: ~3 minutes total
```

### Resource Requirements Table

**Per Pod:**
```
CPU Request:     100m  (0.1 vCPU)
CPU Limit:       500m  (0.5 vCPU)
Memory Request:  128Mi
Memory Limit:    512Mi
```

**Cluster Scenarios:**
```
Scenario          Pods  Total CPU  Total Memory  Cost/hour
─────────────────────────────────────────────────────────
Baseline (idle)    3    300m       384Mi        $0.15
Normal load        5    500m       640Mi        $0.25
High load          8    800m       1.28Gi       $0.40
Peak/Emergency    10    1000m      1.28Gi       $0.50
```

### Deployment Command Reference

```bash
# Apply all manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get deployment hostel-allocation -n hostel-allocation

# Watch pod creation in real-time
kubectl get pods -n hostel-allocation -w

# Get service details (check external IP)
kubectl get svc -n hostel-allocation

# Check health endpoint
kubectl exec <pod-name> -n hostel-allocation -- \
  curl -s localhost:3000/health | jq .

# View deployment events
kubectl describe deployment hostel-allocation -n hostel-allocation
```

---

## Phase 7: Operate - Monitoring & Logging

### What Gets Deployed

**Monitoring Stack:**
- **Prometheus:** Metrics collection + time-series database
- **Grafana:** Dashboard visualization (port 3000)
- **AlertManager:** Alert routing to Slack
- **Alert Rules:** 6 pre-configured rules

**Metrics Collected:**
- Application: requests, errors, latency, database health
- Infrastructure: CPU, memory, disk, network, pod restarts
- Kubernetes: deployment status, replica counts, pod availability

### Alert Rules Summary

| Alert | Trigger | Severity | Action |
|-------|---------|----------|--------|
| High Error Rate | >5% errors for 5 min | CRITICAL | Page engineer |
| High Memory | >85% of limit for 5 min | WARNING | Scale or optimize |
| High CPU | >80% utilization for 5 min | WARNING | Scale or optimize |
| Pod Crash Loop | >0.1 restarts/min | CRITICAL | Immediate fix |
| Replicas Mismatch | Desired ≠ Available for 10 min | WARNING | Investigate |
| Database Down | Connection fails for 2 min | CRITICAL | Check database |

### Deploy Monitoring

```bash
# Apply monitoring stack
kubectl apply -f monitoring/

# Verify all components running
kubectl get pods -n hostel-allocation | grep -E "prometheus|grafana|alertmanager"

# Access Prometheus
kubectl port-forward svc/prometheus -n hostel-allocation 9090:9090 &
# http://localhost:9090

# Access Grafana
kubectl port-forward svc/grafana -n hostel-allocation 3000:3000 &
# http://localhost:3000 (admin/admin)

# Access AlertManager
kubectl port-forward svc/alertmanager -n hostel-allocation 9093:9093 &
# http://localhost:9093
```

### Error Budget Strategy

**SLO: 99.9% Uptime**
- Budget: 43.2 minutes downtime per month
- Distribution:
  - 80% for application errors (34 min)
  - 15% for infrastructure (6 min)
  - 5% for maintenance (2 min)

**Alert Thresholds:**
- Warning: 2% error rate (consumes budget at 10x rate)
- Critical: 5% error rate (consumes budget at 25x rate)
- Page: 10% error rate (emergency response)

### Key Prometheus Queries

```promql
# Request rate (req/sec)
rate(http_requests_total[5m])

# Error rate (%)
(sum(rate(http_errors_total[5m])) / 
 sum(rate(http_requests_total[5m]))) * 100

# P95 latency (seconds)
histogram_quantile(0.95, 
  rate(http_request_duration_seconds_bucket[5m]))

# Pod memory (MB)
container_memory_usage_bytes / 1024 / 1024

# Pod CPU (millicores)
rate(container_cpu_usage_seconds_total[5m]) * 1000
```

---

## Phase 8: Monitor - Auto-scaling & Feedback Loop

### Horizontal Pod Autoscaler (HPA)

**Configuration:**
```yaml
Min Replicas: 3
Max Replicas: 10
CPU Target: 70% average utilization
Memory Target: 80% average utilization
Scale-Up: Immediate (double or +2 pods)
Scale-Down: Slow (50% per minute after 5-min window)
```

### Scaling Behavior Examples

**Example 1: Normal Scaling**
```
Time    Load    Pods  Action              CPU Impact
────────────────────────────────────────────────────────
0:00    Light   3     Baseline            45%
0:05    Moderate 3    CPU rising          65%
0:10    Heavy   3     CPU > 70% trigger   75%
0:15    Heavy   5     +2 pods added       42%
0:20    Light   5     CPU dropping        38%
5:20    Light   5     5-min window OK     35%
5:25    Light   3     -2 pods (scale-dn)  50%
5:30    Light   3     Stable              45%
```

### Deploy HPA

```bash
# HPA is included in k8s/hpa.yaml
kubectl apply -f k8s/hpa.yaml

# Check HPA status
kubectl get hpa -n hostel-allocation

# Watch HPA in real-time
kubectl get hpa -n hostel-allocation -w

# View detailed HPA info
kubectl describe hpa hostel-allocation-hpa -n hostel-allocation
```

### Load Testing HPA

```bash
# Terminal 1: Watch HPA
kubectl get hpa -n hostel-allocation -w

# Terminal 2: Watch pods
kubectl get pods -n hostel-allocation -w

# Terminal 3: Generate load
kubectl run load-generator --rm --image=busybox --restart=Never -- \
  sh -c 'while true; do wget -q -O- http://hostel-allocation.hostel-allocation.svc.cluster.local > /dev/null; done'

# Terminal 4: Monitor metrics
kubectl top pods -n hostel-allocation
```

### Feedback Loop: Alerts to Action

```
┌─────────────────────────────────────────────────────┐
│ Continuous Feedback Loop                            │
├─────────────────────────────────────────────────────┤
│                                                      │
│ 1. Monitoring Detects Issue                         │
│    └─ High error rate (>5% for 5 min)              │
│                                                      │
│ 2. Alert Triggered                                  │
│    └─ Prometheus evaluates rule                     │
│    └─ AlertManager groups alerts                    │
│    └─ Sends to Slack                                │
│                                                      │
│ 3. Alert Routing                                    │
│    ├─ CRITICAL → #alerts-critical                  │
│    └─ WARNING → #alerts-warning                     │
│                                                      │
│ 4. Engineer Response                                │
│    ├─ Review alert in Slack                         │
│    ├─ Check Grafana dashboard                       │
│    └─ Decide action:                                │
│       ├─ Recent deployment? → Rollback             │
│       ├─ High load? → Scale up                      │
│       └─ Code issue? → Fix & redeploy              │
│                                                      │
│ 5. Automatic Actions                                │
│    ├─ HPA scales automatically on CPU/memory       │
│    ├─ Rollback on sustained error rate             │
│    └─ Health checks restart failed pods            │
│                                                      │
│ 6. Feedback                                         │
│    └─ Metrics return to normal                      │
│    └─ Resolved alert sent to Slack                  │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## Complete Deployment Workflow

### Step-by-Step Deployment

```bash
# Step 1: Create namespace
kubectl apply -f k8s/namespace.yaml

# Step 2: Create configuration
kubectl apply -f k8s/configmap.yaml

# Step 3: Deploy application
kubectl apply -f k8s/deployment.yaml

# Step 4: Expose service
kubectl apply -f k8s/service.yaml

# Step 5: Configure auto-scaling
kubectl apply -f k8s/hpa.yaml

# Step 6: Deploy monitoring stack
kubectl apply -f monitoring/prometheus-config.yaml
kubectl apply -f monitoring/prometheus-deployment.yaml
kubectl apply -f monitoring/grafana-deployment.yaml
kubectl apply -f monitoring/alertmanager-deployment.yaml
kubectl apply -f monitoring/alert-rules.yaml
```

### Verification Checklist

```bash
# Check everything deployed
echo "=== Namespace ==="
kubectl get namespace hostel-allocation

echo -e "\n=== Pods ==="
kubectl get pods -n hostel-allocation

echo -e "\n=== Services ==="
kubectl get svc -n hostel-allocation

echo -e "\n=== HPA ==="
kubectl get hpa -n hostel-allocation

echo -e "\n=== Health Check ==="
kubectl port-forward svc/hostel-allocation -n hostel-allocation 3000:80 &
sleep 2
curl http://localhost:3000/health
kill %1

echo -e "\n=== Metrics ==="
curl http://localhost:3000/metrics | head -5
kill %1
```

---

## Monitoring Dashboard Access

### Grafana Dashboards

**Dashboard 1: Application Health**
- Request Rate (requests/sec)
- Error Rate (%)
- Response Time (P50/P95/P99)
- Database Connection Status
- Active Connections

**Dashboard 2: Infrastructure Metrics**
- CPU Usage (per pod)
- Memory Usage (per pod)
- Network I/O
- Disk Usage
- Pod Restart Count

**Dashboard 3: Deployment Health**
- Desired vs Available Pods
- Pod Availability Timeline
- Deployment Status
- Rollout Progress

### Access Commands

```bash
# Port forward to access UIs
kubectl port-forward -n hostel-allocation svc/prometheus 9090:9090 &
kubectl port-forward -n hostel-allocation svc/grafana 3000:3000 &
kubectl port-forward -n hostel-allocation svc/alertmanager 9093:9093 &
kubectl port-forward -n hostel-allocation svc/hostel-allocation 8080:80 &

# Access URLs
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3000 (admin/admin)
# AlertManager: http://localhost:9093
# Application: http://localhost:8080
```

---

## Troubleshooting Guide

### Issue: Deployment stuck in pending

```bash
# Check pod events
kubectl describe pod <pod-name> -n hostel-allocation

# Common causes:
# - No resource available
# - Image not found
# - ConfigMap not created

# Solution: Check resource limits, image name, configmap
```

### Issue: HPA not scaling

```bash
# Check metrics-server running
kubectl get deployment metrics-server -n kube-system

# Check if metrics available
kubectl top pods -n hostel-allocation

# Check HPA status
kubectl describe hpa hostel-allocation-hpa -n hostel-allocation

# Solution: Install metrics-server if missing
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

### Issue: Prometheus not scraping metrics

```bash
# Check Prometheus targets
# http://localhost:9090/targets

# Check if pod has prometheus annotation
kubectl get pod <pod-name> -n hostel-allocation -o yaml | grep prometheus

# Check pod endpoint
kubectl exec <pod-name> -n hostel-allocation -- curl localhost:3000/metrics

# Solution: Verify pod has correct annotations in deployment
```

### Issue: Alerts not sending to Slack

```bash
# Check AlertManager logs
kubectl logs -f deployment/alertmanager -n hostel-allocation

# Check webhook configuration
kubectl get secret slack-webhook -n hostel-allocation -o yaml

# Manually trigger test alert
kubectl exec -it alertmanager-0 -n hostel-allocation -- amtool alert add test severity=critical

# Solution: Update Slack webhook URL in alertmanager config
```

---

## Resource Calculation Summary

### Pod Resource Requirements
| Resource | Request | Limit | Per Pod |
|----------|---------|-------|---------|
| CPU | 100m | 500m | 0.1-0.5 vCPU |
| Memory | 128Mi | 512Mi | 128-512 MB |

### Cluster Sizing (Monthly Cost)
| Baseline | Average | Peak | Emergency |
|----------|---------|------|-----------|
| 3 pods → $4.32/day | 5 pods → $7.20/day | 8 pods → $11.52/day | 10 pods → $14.40/day |
| = $129.60/mo | = $216/mo | = $345.60/mo | = $432/mo |

### Network Costs
| Item | Estimated |
|------|-----------|
| LoadBalancer | ~$18/month |
| Data transfer (outbound) | ~$5-20/month |
| Total networking | ~$23-38/month |

### Total Monthly Estimate
- **Baseline:** $150-170/month
- **Average:** $240-260/month
- **Peak:** $370-390/month

---

## Performance Metrics

### Deployment Time
- Rolling update: 3-5 minutes (3 pods, maxUnavailable=0)
- Scale-up: 30-60 seconds per 2-3 pods
- Scale-down: 5-10 minutes (conservative window)

### Alert Response Time
- Metric collection: 15 seconds
- Alert evaluation: 30 seconds
- Slack notification: <5 seconds
- **Total detection time: ~50 seconds**

### Health Check Response
- Liveness probe: 30-40 seconds (initial delay + period)
- Readiness probe: 5-10 seconds (initial delay + period)

---

## Next Steps

1. **Deploy:** `kubectl apply -f k8s/ && kubectl apply -f monitoring/`
2. **Verify:** Check all pods running: `kubectl get pods -n hostel-allocation`
3. **Monitor:** Access Grafana at http://localhost:3000
4. **Test:** Generate load and observe HPA scaling
5. **Alert:** Verify Slack notifications working
6. **Optimize:** Adjust resource requests based on actual usage

---

## Files Reference

| File | Phase | Purpose |
|------|-------|---------|
| PHASE_6_DEPLOY.md | 6 | Deployment, rolling updates, resource calc |
| PHASE_7_OPERATE.md | 7 | Monitoring, logging, alerting |
| PHASE_8_MONITOR.md | 8 | Auto-scaling, feedback loop |
| k8s/deployment.yaml | 6 | Kubernetes deployment config |
| k8s/hpa.yaml | 8 | Horizontal Pod Autoscaler |
| monitoring/prometheus-config.yaml | 7 | Prometheus scrape config |
| monitoring/alert-rules.yaml | 7 | Alert rules definition |
| monitoring/alertmanager-deployment.yaml | 7 | Alert routing config |
| monitoring/grafana-deployment.yaml | 7 | Grafana visualization |

---

**Status: ✅ All Phases 6-8 Implemented and Documented**

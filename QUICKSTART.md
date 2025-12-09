# Quick Start Guide

## Phase 6: Deploy ✅

### Local Testing (5-10 minutes)

```bash
# Start monitoring stack with application
docker-compose -f docker-compose-monitoring.yml up -d

# Wait for services to start
sleep 10

# Test application
curl http://localhost:3000/health
curl http://localhost:3000/ready
curl http://localhost:3000/metrics

# Access dashboards (in browser)
# Grafana: http://localhost:3001 (admin/admin)
# Prometheus: http://localhost:9090
# AlertManager: http://localhost:9093

# Stop everything
docker-compose -f docker-compose-monitoring.yml down
```

### Kubernetes Deployment (10-15 minutes)

**Prerequisites:**
```bash
# Verify kubectl is configured
kubectl cluster-info

# Check metrics-server (required for HPA)
kubectl get deployment metrics-server -n kube-system
# If not found, install it:
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

**Deploy:**
```bash
# Run deployment script
chmod +x scripts/deploy-k8s.sh
./scripts/deploy-k8s.sh

# Or manually
kubectl apply -f k8s/
kubectl apply -f monitoring/
```

**Verify:**
```bash
# Check pods
kubectl get pods -n hostel-allocation

# Check services
kubectl get svc -n hostel-allocation

# Check HPA
kubectl get hpa -n hostel-allocation
```

---

## Phase 7: Operate ✅

### Health Monitoring

```bash
# Port forward to application
kubectl port-forward -n hostel-allocation svc/hostel-allocation 3000:80 &

# Check health endpoints
curl http://localhost:3000/health
curl http://localhost:3000/ready
curl http://localhost:3000/metrics
```

### Access Monitoring Stack

```bash
# Prometheus (metrics database)
kubectl port-forward -n hostel-allocation svc/prometheus 9090:9090 &
# Visit: http://localhost:9090

# Grafana (visualization)
kubectl port-forward -n hostel-allocation svc/grafana 3000:3000 &
# Visit: http://localhost:3000 (admin/admin)

# AlertManager (alert routing)
kubectl port-forward -n hostel-allocation svc/alertmanager 9093:9093 &
# Visit: http://localhost:9093
```

### View Logs

```bash
# Real-time logs
kubectl logs -f deployment/hostel-allocation -n hostel-allocation

# Last 100 lines
kubectl logs deployment/hostel-allocation -n hostel-allocation --tail=100

# With timestamps
kubectl logs deployment/hostel-allocation -n hostel-allocation --timestamps=true
```

### Check Metrics

```bash
# Pod resource usage
kubectl top pods -n hostel-allocation

# Node resource usage
kubectl top nodes

# HPA status
kubectl describe hpa hostel-allocation-hpa -n hostel-allocation

# Watch HPA scaling
kubectl get hpa -n hostel-allocation -w
```

---

## Phase 8: Monitor & Scale ✅

### Generate Load to Test Auto-scaling

```bash
# Port forward to application
kubectl port-forward -n hostel-allocation svc/hostel-allocation 3000:80 &

# Install load testing tool (choose one)
# Option 1: Apache Bench (ab)
sudo apt-get install apache2-utils

# Option 2: hey
go install github.com/rakyll/hey@latest

# Generate sustained load
ab -n 10000 -c 100 http://localhost:3000/
# Or with hey
hey -n 10000 -c 100 -q 10 http://localhost:3000/
```

### Watch Auto-scaling in Action

In another terminal, watch the pods scale:
```bash
# Watch HPA
watch kubectl get hpa -n hostel-allocation

# Watch pods
watch kubectl get pods -n hostel-allocation

# Watch metrics
watch kubectl top pods -n hostel-allocation
```

### Expected Behavior

1. **Before Load:**
   ```
   NAME                              REFERENCE                       TARGETS            MINPODS   MAXPODS   REPLICAS   AGE
   hostel-allocation-hpa             Deployment/hostel-allocation    1%/70%, 10%/80%    3         10        3          5m
   ```

2. **During Load (30 seconds in):**
   - CPU usage jumps to 80%+
   - HPA detects threshold crossed
   - Scales up to 4-5 replicas

3. **At Peak Load (2 minutes in):**
   - Further scaling to 6-10 replicas
   - Distributed load across pods
   - Response times improve

4. **After Load Stops (5+ minutes):**
   - CPU/Memory usage drops
   - HPA stabilizes at 5 minutes
   - Gradually scales back down
   - Returns to 3 replicas

### Monitor Metrics in Grafana

1. Open Grafana: http://localhost:3000
2. Create new dashboard:
   - Add panel: `rate(http_requests_total[5m])` - Request rate
   - Add panel: `rate(http_errors_total[5m])` - Error rate
   - Add panel: `container_cpu_usage_seconds_total` - CPU usage
   - Add panel: `container_memory_usage_bytes` - Memory usage

---

## CI/CD Pipeline Testing

### Trigger Build Pipeline

```bash
# Make a code change
echo "# Test" >> README.md

# Push to main (triggers code quality + security scan)
git add README.md
git commit -m "docs: Test pipeline"
git push origin main

# Watch GitHub Actions: https://github.com/ITpatrick1/Hostel_Room_Allocation/actions
```

### Trigger Release Pipeline

```bash
# Create and push version tag (triggers build + push + release + deploy)
git tag v1.8.0
git push origin v1.8.0

# Watch GitHub Actions: https://github.com/ITpatrick1/Hostel_Room_Allocation/actions
# - Code quality check
# - Security scan
# - Build & push Docker image
# - Create GitHub release
# - Deploy job (prepared)
# - Slack notifications
```

### Check GitHub Release

Visit: https://github.com/ITpatrick1/Hostel_Room_Allocation/releases

Should show:
- Version v1.8.0
- Build status
- Docker image reference

---

## Troubleshooting

### Pods not starting?
```bash
kubectl describe pod <pod-name> -n hostel-allocation
kubectl logs <pod-name> -n hostel-allocation
```

### HPA not scaling?
```bash
# Check metrics-server
kubectl get deployment metrics-server -n kube-system

# Check HPA status
kubectl describe hpa hostel-allocation-hpa -n hostel-allocation

# Check metrics available
kubectl get hpa hostel-allocation-hpa -n hostel-allocation -o wide
```

### Can't access application?
```bash
# Check service
kubectl get svc -n hostel-allocation

# Check endpoints
kubectl get endpoints -n hostel-allocation

# Port forward and test
kubectl port-forward svc/hostel-allocation 3000:80 -n hostel-allocation
curl http://localhost:3000/health
```

### Alerts not firing?
```bash
# Check Prometheus targets
# Visit: http://localhost:9090/targets

# Check AlertManager config
kubectl describe cm alertmanager-config -n hostel-allocation

# Check AlertManager logs
kubectl logs deployment/alertmanager -n hostel-allocation
```

---

## Documentation Links

- **Full Deployment Guide:** `DEPLOYMENT.md`
- **Operations & Monitoring:** `OPERATIONS.md`
- **Pipeline Summary:** `PIPELINE_SUMMARY.md`
- **Project README:** `README.md`

---

## Success Checklist

✅ **Deployment Phase**
- [ ] Application deployed to Kubernetes
- [ ] 3+ pods running
- [ ] Service accessible
- [ ] Health checks passing

✅ **Operational Phase**
- [ ] Logs viewable via kubectl
- [ ] Metrics visible in Prometheus
- [ ] Dashboards working in Grafana
- [ ] AlertManager configured

✅ **Scaling Phase**
- [ ] HPA monitoring CPU/Memory
- [ ] Manual load test causes scale-up
- [ ] Pods scale up within 30 seconds
- [ ] Pods scale down after 5 minutes idle

✅ **CI/CD Phase**
- [ ] Main branch pushes trigger quality checks
- [ ] Tags trigger full build/release pipeline
- [ ] Docker images pushed to Docker Hub
- [ ] GitHub releases created
- [ ] Slack notifications sent

---

## Next Steps

1. **Local Testing** (Today)
   - Run docker-compose for monitoring
   - Test health endpoints
   - Generate load

2. **Staging Deployment** (This week)
   - Deploy to staging K8s cluster
   - Test auto-scaling behavior
   - Verify alerts work

3. **Production Ready** (Next week)
   - Deploy to production cluster
   - Configure persistent volumes
   - Setup backup strategy

4. **SRE Best Practices** (Ongoing)
   - Monitor error budgets
   - Analyze metrics trends
   - Optimize based on patterns
   - Create runbooks

---

## Questions?

Refer to:
- `DEPLOYMENT.md` - Setup and deployment
- `OPERATIONS.md` - Day-to-day operations
- `PIPELINE_SUMMARY.md` - Complete architecture overview

**Your Hostel Room Allocation system is now production-ready!** 🎉

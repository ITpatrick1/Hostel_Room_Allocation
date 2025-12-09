# Operations and Monitoring Guide

## Overview

This guide covers operating the Hostel Room Allocation application in Kubernetes with comprehensive monitoring, logging, and alerting.

## Monitoring Stack Components

### 1. Prometheus
**Purpose:** Metrics collection and time-series database

**Key Metrics:**
- `http_requests_total` - Total HTTP requests
- `http_errors_total` - Total HTTP errors  
- `db_connection_status` - Database connection health (1 = healthy, 0 = unhealthy)
- Kubernetes metrics (CPU, memory, network)

**Scrape Configuration:**
- Application pods: 15s interval
- Kubernetes API: 30s interval
- Alert rules evaluation: 30s interval

### 2. Grafana
**Purpose:** Visualization and dashboarding

**Default Dashboard Metrics:**
- Request rate (requests/second)
- Error rate (% of requests)
- Response time (latency)
- Database connection status
- Pod resource usage (CPU/Memory)
- Pod restart count

**Access:**
```bash
kubectl port-forward -n hostel-allocation svc/grafana 3000:3000
# http://localhost:3000 (admin/admin)
```

### 3. AlertManager
**Purpose:** Alert routing and notification management

**Features:**
- Group related alerts
- Deduplicate alerts
- Send to Slack channels based on severity
- Manage alert lifecycle

**Routing:**
- Critical alerts → `#alerts-critical` Slack channel
- Warning alerts → `#alerts-warning` Slack channel
- Default route → webhook

### 4. Prometheus Alert Rules

#### High Error Rate
- **Trigger:** Error rate > 5% for 5 minutes
- **Severity:** Critical
- **Action:** Check application logs, rollback if needed

#### High Memory Usage
- **Trigger:** Memory > 85% of limit for 5 minutes
- **Severity:** Warning
- **Action:** Scale up replicas, review code for memory leaks

#### High CPU Usage
- **Trigger:** CPU > 80% for 5 minutes
- **Severity:** Warning
- **Action:** Scale up replicas, optimize hot code paths

#### Pod Crash Looping
- **Trigger:** Restarts > 0.1 times per 15 minutes
- **Severity:** Critical
- **Action:** Check pod logs, investigate root cause

#### Deployment Replicas Mismatch
- **Trigger:** Desired replicas ≠ Available replicas for 10 minutes
- **Severity:** Warning
- **Action:** Check node resources, pod events

## Horizontal Pod Autoscaling (HPA)

### Configuration

```yaml
minReplicas: 3        # Minimum 3 pods always running
maxReplicas: 10       # Maximum 10 pods
Metrics:
  - CPU > 70% → scale up
  - Memory > 80% → scale up
```

### Scale-up Behavior
- **Stabilization:** 0 seconds (immediate)
- **Policy:** Max of (+100% or +2 pods) every 30 seconds
- **Result:** Can double pod count in ~2 minutes under load

### Scale-down Behavior
- **Stabilization:** 300 seconds (5 minutes)
- **Policy:** -50% every 60 seconds
- **Result:** Conservative scale-down to avoid thrashing

### Monitor Scaling
```bash
# Watch HPA in real-time
kubectl get hpa -n hostel-allocation -w

# Detailed HPA status
kubectl describe hpa hostel-allocation-hpa -n hostel-allocation

# View metrics server (required for HPA)
kubectl get deployment metrics-server -n kube-system
```

### Testing Auto-scaling

Generate load to trigger scaling:

```bash
# Port forward to application
kubectl port-forward -n hostel-allocation svc/hostel-allocation 3000:80 &

# Generate load with Apache Bench
ab -n 10000 -c 100 http://localhost:3000/

# Or use hey
go install github.com/rakyll/hey@latest
hey -n 10000 -c 100 http://localhost:3000/
```

Monitor while load is running:
```bash
watch kubectl get hpa -n hostel-allocation
watch kubectl get pods -n hostel-allocation
```

## Health Checks

### Liveness Probe (`/health`)
- **Purpose:** Is the pod alive and responsive?
- **Failure:** Pod is restarted
- **Check Interval:** Every 10 seconds
- **Timeout:** 5 seconds
- **Failure Threshold:** 3 consecutive failures

```bash
curl http://<pod-ip>:3000/health
# Response: {"status":"ok","database":"connected"}
```

### Readiness Probe (`/ready`)
- **Purpose:** Is the pod ready to serve traffic?
- **Failure:** Pod is removed from service endpoints
- **Check Interval:** Every 5 seconds
- **Timeout:** 3 seconds
- **Failure Threshold:** 3 consecutive failures
- **Initial Delay:** 10 seconds (wait for startup)

```bash
curl http://<pod-ip>:3000/ready
# Response: {"ready":true}
```

### Metrics Endpoint (`/metrics`)
- **Format:** Prometheus text format
- **Content:** HTTP requests, errors, database status
- **Scrape Interval:** 15 seconds

```bash
curl http://<pod-ip>:3000/metrics
```

## Logging Strategy

### Application Logs
```bash
# View logs from all pods
kubectl logs -n hostel-allocation -f deployment/hostel-allocation

# View logs from specific pod
kubectl logs -n hostel-allocation <pod-name> -f

# View logs with timestamps
kubectl logs -n hostel-allocation <pod-name> --timestamps=true

# View logs from last 1 hour
kubectl logs -n hostel-allocation <pod-name> --since=1h
```

### Log Aggregation (ELK Stack)
For production, deploy ELK stack:

```bash
# Install Filebeat to send logs to Elasticsearch
helm repo add elastic https://helm.elastic.co
helm install filebeat elastic/filebeat -n hostel-allocation
```

### Important Log Messages
- `MySQL connected` - Database connection successful
- `Tables synced` - Schema initialization complete
- `Server running on port 3000` - Application ready
- High error rates in HTTP responses
- Database connection timeouts

## Troubleshooting Guide

### Pod Not Starting

```bash
# Check pod status
kubectl describe pod <pod-name> -n hostel-allocation

# Common issues:
# - Pending: Not enough resources (check node capacity)
# - CrashLoopBackOff: Application error (check logs)
# - ImagePullBackOff: Docker image not found

# View logs
kubectl logs <pod-name> -n hostel-allocation
```

### High Memory Usage

```bash
# Check memory usage
kubectl top pods -n hostel-allocation

# Check pod limits
kubectl get pods -n hostel-allocation -o custom-columns=NAME:.metadata.name,MEM-REQ:.spec.containers[0].resources.requests.memory,MEM-LIM:.spec.containers[0].resources.limits.memory

# Common causes:
# - Memory leak in application
# - Too many concurrent connections
# - Large response payloads
```

### Deployment Not Rolling Out

```bash
# Check rollout status
kubectl rollout status deployment/hostel-allocation -n hostel-allocation

# Check events
kubectl describe deployment hostel-allocation -n hostel-allocation

# Roll back to previous version
kubectl rollout undo deployment/hostel-allocation -n hostel-allocation

# View rollout history
kubectl rollout history deployment/hostel-allocation -n hostel-allocation
```

### Cannot Connect to Application

```bash
# Check service
kubectl get svc -n hostel-allocation

# Check endpoints
kubectl get endpoints -n hostel-allocation

# Test pod directly
kubectl port-forward svc/hostel-allocation 3000:80 -n hostel-allocation
curl http://localhost:3000/health

# Check pod IP connectivity
kubectl exec -it <pod-name> -n hostel-allocation -- sh
curl http://localhost:3000/health
```

### Metrics Not Appearing in Prometheus

```bash
# Check Prometheus targets
kubectl port-forward -n hostel-allocation svc/prometheus 9090:9090
# Visit http://localhost:9090/targets

# Check pod annotations
kubectl get pods -n hostel-allocation -o jsonpath='{.items[*].metadata.annotations}'

# Verify metrics endpoint
kubectl exec -it <pod-name> -n hostel-allocation -- sh
curl http://localhost:3000/metrics
```

## Performance Tuning

### Resource Limits
Current defaults are conservative. Adjust based on actual usage:

```yaml
# In deployment.yaml
resources:
  requests:
    cpu: 100m        # Increase if experiencing throttling
    memory: 128Mi     # Increase if OOMKilled
  limits:
    cpu: 500m        # Hard limit
    memory: 512Mi     # Hard limit
```

### HPA Tuning
Adjust based on your SLA:

```yaml
# Faster scale-up (more aggressive)
policies:
- type: Percent
  value: 100       # Double the pods
  periodSeconds: 15

# Slower scale-down (more conservative)  
stabilizationWindowSeconds: 600  # Wait 10 minutes before scaling down
```

### Database Connection Pool
Adjust in environment if using database:
```yaml
DB_POOL_MIN: 2
DB_POOL_MAX: 10
DB_CONNECTION_TIMEOUT: 30000
```

## Alerting Best Practices

### Error Budgets
With 99.9% uptime SLA (3 nines):
- Monthly allowance: 43.2 minutes of downtime
- Daily allowance: ~86 seconds of downtime
- Hourly allowance: ~3.6 seconds of downtime

Set critical alerts when approaching error budget:
```
Error rate > 0.1% for 5 minutes = Use ~50% of hourly budget
```

### On-call Runbooks

**For High Error Rate Alert:**
1. Check application logs for recent changes
2. Verify database connectivity
3. Check resource utilization (CPU/Memory)
4. Check recent deployments via GitHub Actions
5. Rollback last deployment if needed
6. Engage backend team

**For Pod Crash Looping:**
1. Check pod logs: `kubectl logs <pod> -n hostel-allocation`
2. Check pod events: `kubectl describe pod <pod> -n hostel-allocation`
3. Check resource limits: May be OOMKilled
4. Check liveness probe configuration
5. Rollback to previous version if recent change

**For Memory Pressure:**
1. Check memory trends in Grafana
2. Identify if memory growth is linear (leak) or step-wise (load)
3. If leak: Deploy patched version
4. Temporary solution: Increase max replicas to distribute load

## Production Checklist

### Pre-deployment
- [ ] Verify all health checks pass locally
- [ ] Load test to establish baseline metrics
- [ ] Define SLA and error budgets
- [ ] Create on-call runbooks
- [ ] Setup Slack channels for alerts
- [ ] Configure backup strategy

### Post-deployment
- [ ] Monitor first 24 hours continuously
- [ ] Verify HPA triggers on load
- [ ] Test alert notifications
- [ ] Document deployment steps
- [ ] Create incident response procedures
- [ ] Schedule weekly performance reviews

### Ongoing
- [ ] Review alerts weekly
- [ ] Analyze error budgets
- [ ] Optimize resource requests/limits
- [ ] Update runbooks based on incidents
- [ ] Plan capacity based on growth trends
- [ ] Security audit quarterly

## Key Metrics to Monitor

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| Error Rate | < 0.1% | > 0.5% | > 1% |
| P95 Latency | < 100ms | > 200ms | > 500ms |
| CPU Utilization | 30-70% | > 80% | > 90% |
| Memory Utilization | 30-70% | > 85% | > 95% |
| Pod Restarts | 0/hour | > 0.1/hour | > 1/hour |
| Available Replicas | = Desired | < Desired | < Desired (5min+) |
| Database Connection | Connected | Degraded | Failed |

## Commands Reference

```bash
# Monitoring access
kubectl port-forward -n hostel-allocation svc/prometheus 9090:9090
kubectl port-forward -n hostel-allocation svc/grafana 3000:3000
kubectl port-forward -n hostel-allocation svc/alertmanager 9093:9093

# Application access
kubectl port-forward -n hostel-allocation svc/hostel-allocation 3000:80

# View resources
kubectl get pods -n hostel-allocation
kubectl get hpa -n hostel-allocation
kubectl top pods -n hostel-allocation
kubectl top nodes

# View logs
kubectl logs -f deployment/hostel-allocation -n hostel-allocation
kubectl logs <pod-name> -n hostel-allocation --tail=100

# Debugging
kubectl describe pod <pod-name> -n hostel-allocation
kubectl exec -it <pod-name> -n hostel-allocation -- sh
kubectl events -n hostel-allocation

# Deployments
kubectl set image deployment/hostel-allocation hostel-allocation=itpatrick/hostel_room_allocation:TAG -n hostel-allocation
kubectl rollout status deployment/hostel-allocation -n hostel-allocation
kubectl rollout undo deployment/hostel-allocation -n hostel-allocation
```

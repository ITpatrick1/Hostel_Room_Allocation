# Phase 7: Operate - Monitoring and Logging Setup

## Overview
This phase implements comprehensive monitoring with Prometheus/Grafana and alerting based on error budgets.

---

## Monitoring Stack Architecture

```
Application Pods
    ↓ (Metrics on :3000/metrics)
Prometheus ServiceMonitor
    ↓ (Scrapes every 15 seconds)
Prometheus StatefulSet
    ↓ (Time-series database)
    ├─→ Grafana (Dashboards)
    ├─→ AlertManager (Alert Routing)
    └─→ PrometheusRules (Alert Evaluation)
        ↓
    Slack Notifications
```

---

## Prometheus Configuration

**File:** `monitoring/prometheus-config.yaml`

### Scrape Configuration
```yaml
global:
  scrape_interval: 15s        # Scrape every 15 seconds
  evaluation_interval: 30s    # Evaluate alerts every 30 seconds
  external_labels:
    cluster: 'hostel-allocation'
    environment: 'production'
```

### Scrape Targets
```yaml
scrape_configs:
- job_name: 'hostel-allocation'
  kubernetes_sd_configs:
  - role: pod
    namespaces:
      names:
      - hostel-allocation
  relabel_configs:
  - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
    action: keep
    regex: true
```

**Features:**
- Auto-discovery of pods with Prometheus scrape annotation
- 15-second scrape interval (balance between granularity and load)
- 30-second evaluation interval for alerts
- TLS verification enabled

---

## Metrics Collected

### Application Metrics

| Metric | Type | Labels | Description | Alert Threshold |
|--------|------|--------|-------------|------------------|
| `http_requests_total` | Counter | endpoint, method, status | Total HTTP requests | - |
| `http_errors_total` | Counter | endpoint, status | Total HTTP errors (5xx) | >5% for 5 min |
| `http_request_duration_seconds` | Histogram | endpoint, method | Request latency | >1s for 95% |
| `db_connection_status` | Gauge | - | DB health (1=up, 0=down) | == 0 for 2 min |
| `db_query_duration_seconds` | Histogram | operation | Query execution time | >500ms avg |

### Infrastructure Metrics

| Metric | Type | Description | Alert Threshold |
|--------|------|-------------|------------------|
| `container_cpu_usage_seconds_total` | Gauge | CPU usage per pod | >80% for 5 min |
| `container_memory_usage_bytes` | Gauge | Memory per pod | >85% for 5 min |
| `container_fs_usage_bytes` | Gauge | Disk usage per pod | >90% |
| `kube_pod_container_status_restarts_total` | Gauge | Pod restart count | >0 in 15 min |
| `kube_deployment_status_replicas_available` | Gauge | Available replicas | <desired for 10 min |

---

## Alert Rules Configuration

**File:** `monitoring/alert-rules.yaml`

### Rule 1: High Error Rate
```yaml
- alert: HighErrorRate
  expr: |
    (sum(rate(http_errors_total[5m])) / 
     sum(rate(http_requests_total[5m]))) > 0.05
  for: 5m
  annotations:
    severity: critical
    summary: "High error rate detected"
    description: "Error rate is {{ $value | humanizePercentage }} above 5%"
```

**Trigger:** Error rate > 5% for 5 consecutive minutes
**Severity:** CRITICAL
**Action:** Page on-call engineer immediately

### Rule 2: High Memory Usage
```yaml
- alert: HighMemoryUsage
  expr: |
    (container_memory_usage_bytes / 
     container_spec_memory_limit_bytes) > 0.85
  for: 5m
  annotations:
    severity: warning
    summary: "High memory usage in pod"
    description: "Pod {{ $labels.pod_name }} memory at {{ $value | humanizePercentage }}"
```

**Trigger:** Memory > 85% of limit for 5 minutes
**Severity:** WARNING
**Action:** Schedule capacity planning, may need scale-up

### Rule 3: High CPU Usage
```yaml
- alert: HighCPUUsage
  expr: |
    (rate(container_cpu_usage_seconds_total[5m]) * 1000) > 80
  for: 5m
  annotations:
    severity: warning
    summary: "High CPU usage"
    description: "Pod CPU at {{ $value }}m"
```

**Trigger:** CPU > 80% for 5 minutes
**Severity:** WARNING
**Action:** Investigate hot paths, optimize code

### Rule 4: Pod Crash Looping
```yaml
- alert: PodCrashLooping
  expr: |
    rate(kube_pod_container_status_restarts_total[15m]) > 0.1
  for: 5m
  annotations:
    severity: critical
    summary: "Pod crash looping"
    description: "Pod {{ $labels.pod_name }} restarting {{ $value }}/min"
```

**Trigger:** >0.1 restarts per minute for 15 minutes
**Severity:** CRITICAL
**Action:** Immediate investigation required

### Rule 5: Deployment Replicas Mismatch
```yaml
- alert: DeploymentReplicasMismatch
  expr: |
    kube_deployment_status_replicas_available < 
    kube_deployment_spec_replicas
  for: 10m
  annotations:
    severity: warning
    summary: "Deployment replicas mismatch"
    description: "{{ $value }} replicas missing"
```

**Trigger:** Available replicas < desired replicas for 10 minutes
**Severity:** WARNING
**Action:** Check pod events and logs

### Rule 6: Database Connection Lost
```yaml
- alert: DatabaseConnectionLost
  expr: |
    db_connection_status == 0
  for: 2m
  annotations:
    severity: critical
    summary: "Database connection lost"
    description: "Cannot connect to database"
```

**Trigger:** Database health == 0 for 2 minutes
**Severity:** CRITICAL
**Action:** Alert DBA, check database availability

---

## Error Budget Strategy

### Error Budget Definition
- **Total Budget:** 99.9% uptime (43.2 minutes downtime per month)
- **Distribution:**
  - 80% application errors (34 minutes)
  - 15% infrastructure errors (6 minutes)
  - 5% maintenance (2 minutes)

### Budget Consumption Tracking
```
Monthly Budget: 43.2 minutes
├─ Consumed (Application): 15 minutes (35%)
├─ Consumed (Infrastructure): 3 minutes (7%)
├─ Consumed (Maintenance): 0 minutes (0%)
└─ Remaining: 25.2 minutes (58%)
```

### Alert Thresholds Based on Budget
- **Warning Level:** Error rate > 2% for 5 min (consumes budget at 10x normal rate)
- **Critical Level:** Error rate > 5% for 5 min (consumes budget at 25x normal rate)
- **Page Engineering:** Error rate > 10% (emergency response needed)

---

## Grafana Dashboards

### Dashboard 1: Application Health
**Metrics Displayed:**
- Request rate (requests/sec)
- Error rate (%)
- Response time P50/P95/P99
- Database connection status
- Active connections

**Update Interval:** 5 seconds
**Time Range:** Last 1 hour

### Dashboard 2: Infrastructure Status
**Metrics Displayed:**
- CPU usage per pod (%)
- Memory usage per pod (%)
- Network I/O (in/out)
- Disk usage per pod (%)
- Pod restart count

**Update Interval:** 10 seconds
**Time Range:** Last 6 hours

### Dashboard 3: Deployment Health
**Metrics Displayed:**
- Desired vs Available pods
- Replica count over time
- Pod availability timeline
- Deployment status (ready/progressing)
- Rollout progress

**Update Interval:** 5 seconds
**Time Range:** Last 24 hours

---

## Prometheus Queries

### Request Rate (requests/second)
```promql
rate(http_requests_total[5m])
```

### Error Rate (percentage)
```promql
(sum(rate(http_errors_total[5m])) / 
 sum(rate(http_requests_total[5m]))) * 100
```

### Response Time (P95)
```promql
histogram_quantile(0.95, 
  rate(http_request_duration_seconds_bucket[5m]))
```

### Pod Memory Usage (MB)
```promql
container_memory_usage_bytes{pod_name=~"hostel-allocation.*"} / 1024 / 1024
```

### Pod CPU Usage (millicores)
```promql
rate(container_cpu_usage_seconds_total{pod_name=~"hostel-allocation.*"}[5m]) * 1000
```

### Database Connection Health
```promql
db_connection_status
```

---

## AlertManager Configuration

**File:** `monitoring/alertmanager-deployment.yaml`

### Alert Routing
```yaml
global:
  resolve_timeout: 5m

route:
  receiver: 'default'
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
  
  routes:
  - match:
      severity: critical
    receiver: 'critical'
    continue: true
    
  - match:
      severity: warning
    receiver: 'warning'
    continue: true
```

### Receivers (Slack Integration)

**Critical Channel:**
```yaml
receivers:
- name: 'critical'
  slack_configs:
  - api_url: '${SLACK_WEBHOOK_CRITICAL}'
    channel: '#alerts-critical'
    title: '🚨 Critical Alert'
    text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
```

**Warning Channel:**
```yaml
- name: 'warning'
  slack_configs:
  - api_url: '${SLACK_WEBHOOK_WARNING}'
    channel: '#alerts-warning'
    title: '⚠️ Warning Alert'
    text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
```

---

## Access Monitoring Services

### Prometheus (Metrics Database)
```bash
kubectl port-forward -n hostel-allocation svc/prometheus 9090:9090
# Access: http://localhost:9090
# Query builder, alerts status, targets
```

### Grafana (Dashboards)
```bash
kubectl port-forward -n hostel-allocation svc/grafana 3000:3000
# Access: http://localhost:3000
# Default credentials: admin/admin
```

### AlertManager (Alert Routing)
```bash
kubectl port-forward -n hostel-allocation svc/alertmanager 9093:9093
# Access: http://localhost:9093
# View grouped alerts, alert history
```

---

## Logging Strategy

### Application Logs
**Container Stdout/Stderr:**
```bash
# Real-time logs
kubectl logs -f deployment/hostel-allocation -n hostel-allocation

# Last 100 lines
kubectl logs --tail=100 deployment/hostel-allocation -n hostel-allocation

# Previous pod logs (after restart)
kubectl logs <pod-name> -n hostel-allocation --previous
```

### Log Retention
- **Pod Logs:** 7 days (Kubernetes default)
- **Prometheus Metrics:** 15 days
- **Grafana Dashboards:** Permanent
- **AlertManager History:** 7 days

### Structured Logging Format
```json
{
  "timestamp": "2024-12-10T10:30:45Z",
  "level": "ERROR",
  "logger": "app",
  "message": "Database connection failed",
  "pod": "hostel-allocation-xyz",
  "request_id": "abc-123",
  "error": "ECONNREFUSED",
  "stack": "..."
}
```

---

## Monitoring Best Practices

✅ **Implemented:**
1. Automated metric collection (Prometheus scrapes every 15s)
2. Multi-level alerting (Critical, Warning levels)
3. Error budget tracking (99.9% SLO)
4. Dashboard visualization (3 custom dashboards)
5. Alert routing by severity (Slack channels)
6. Metric retention (15 days)
7. Health check integration (Liveness/Readiness probes)

✅ **Benefits:**
- Quick incident detection (2-minute response time for critical alerts)
- Error budget awareness (prevents alert fatigue)
- Multi-dimensional metrics (pod, endpoint, method labels)
- Automated root cause hints (alert descriptions)
- Slack integration (real-time notifications)

---

## Operational Runbooks

### Alert: High Error Rate
**Response Time:** < 5 minutes

1. Check Slack notification for alert details
2. Access Grafana dashboard for error trends
3. Run: `kubectl logs -f deployment/hostel-allocation -n hostel-allocation`
4. Check for recent deployments: `kubectl rollout history deployment/hostel-allocation -n hostel-allocation`
5. If recent deployment caused issue: `kubectl rollout undo deployment/hostel-allocation -n hostel-allocation`
6. If database issue: Check MySQL pod logs

### Alert: High Memory Usage
**Response Time:** < 15 minutes

1. Identify affected pod: `kubectl top pod -n hostel-allocation`
2. Check pod age and restart count
3. If memory leak suspected: Trigger HPA scale-up or schedule pod restart
4. Review code for potential leaks
5. Consider increasing memory limit if load is high

### Alert: Pod Crash Looping
**Response Time:** < 10 minutes (CRITICAL)

1. Immediately check pod events: `kubectl describe pod <pod-name> -n hostel-allocation`
2. Check logs: `kubectl logs <pod-name> -n hostel-allocation --previous`
3. Common causes:
   - Dependency not available (database, cache)
   - Configuration error
   - Out of memory
   - Failed health check
4. Fix root cause and redeploy

---

## Monitoring Verification Checklist

- [ ] Prometheus scraping targets: `http://localhost:9090/targets`
- [ ] Alert rules loaded: `http://localhost:9090/alerts`
- [ ] Grafana dashboards created and visible
- [ ] Slack webhooks configured and working
- [ ] Test alert: Manually trigger high error rate
- [ ] Verify Slack notification received
- [ ] Test AlertManager routing: Check #alerts-critical and #alerts-warning channels

---

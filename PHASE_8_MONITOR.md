# Phase 8: Monitor - Auto-scaling and Feedback Loop

## Overview
This phase demonstrates Horizontal Pod Autoscaling (HPA) and the feedback loop from monitoring alerts to pipeline triggers.

---

## Horizontal Pod Autoscaler (HPA) Configuration

**File:** `k8s/hpa.yaml`

### HPA Specification
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: hostel-allocation-hpa
  namespace: hostel-allocation
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: hostel-allocation
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Key Parameters

| Parameter | Value | Purpose |
|-----------|-------|---------|
| **minReplicas** | 3 | Minimum pods (high availability) |
| **maxReplicas** | 10 | Maximum pods (cost control) |
| **CPU Target** | 70% | Scale-up when CPU exceeds 70% |
| **Memory Target** | 80% | Scale-up when memory exceeds 80% |
| **Scale-Up Policy** | Immediate | Respond immediately to load increase |
| **Scale-Down Window** | 300s | Wait 5 min before scale-down (stability) |

### Scaling Behavior

```yaml
behavior:
  scaleUp:
    stabilizationWindowSeconds: 0
    policies:
    - type: Percent
      value: 100           # Double the pods
      periodSeconds: 15
    - type: Pods
      value: 2             # Or add 2 pods
      periodSeconds: 15
    selectPolicy: Max      # Use the policy that scales most
    
  scaleDown:
    stabilizationWindowSeconds: 300  # Wait 5 minutes
    policies:
    - type: Percent
      value: 50            # Remove 50% of extra pods
      periodSeconds: 60
    selectPolicy: Min      # Use the policy that scales least
```

**Strategy:**
- **Fast Scale-Up:** Respond immediately to increased load (prevent timeouts)
- **Slow Scale-Down:** Wait 5 minutes before removing pods (avoid oscillation)
- **Conservative Scale-Down:** Remove only 50% of extra pods per minute

---

## Scaling Scenarios

### Scenario 1: Normal Load (Baseline)
```
Initial State: 3 pods
CPU Average: 45%
Memory Average: 50%

Action: No scaling
Result: Stable at 3 pods
Cost: ~$0.15/hr
```

### Scenario 2: Moderate Load
```
Initial State: 3 pods
CPU Average: 65% (approaching 70%)
Memory Average: 75% (approaching 80%)

Trigger Point: CPU reaches 72%
Action: Immediately add 1 pod
Timeline:
  t=0s: Scale trigger detected
  t=5s: New pod created
  t=30s: New pod ready to receive traffic
  
Result: 4 pods
CPU Average: 52% (4 pods)
Memory Average: 60% (4 pods)
Cost: ~$0.20/hr
```

### Scenario 3: High Load
```
Initial State: 3 pods
CPU Average: 78% (above 70%)
Memory Average: 85% (at threshold)

Trigger Point: Both CPU and memory high
Action: Scale based on most aggressive policy
Timeline:
  t=0s: Scale trigger (CPU at 78%)
  t=5s: Add 2 pods (100% increase or +2)
  t=15s: Evaluate again
  t=20s: CPU still at 75%, add 2 more pods
  
Result: 7 pods
CPU Average: 33% (7 pods)
Memory Average: 48% (7 pods)
Cost: ~$0.35/hr
```

### Scenario 4: Peak Load
```
Initial State: 3 pods
CPU Average: 85% (high sustained)
Memory Average: 88% (sustained)

Scaling Timeline:
  t=0s: 3 pods, CPU 85%
  t=15s: Add 2 pods → 5 pods, CPU 51%
  t=30s: 5 pods, CPU 73%
  t=45s: Add 2 pods → 7 pods, CPU 44%
  t=60s: 7 pods, CPU 38%
  
Result: Plateaus at 7-8 pods
Cost: ~$0.35/hr
```

### Scenario 5: Returning to Normal
```
Initial State: 8 pods (after high load)
CPU Average: 30%
Memory Average: 35%

Scale-Down Timeline (Conservative):
  t=0s: 8 pods, CPU 30% (below 70%)
  t=300s: Stabilization window complete
  t=305s: Can scale down
  t=310s: Remove 4 pods (50% of 8) → 4 pods
  t=370s: Evaluate again
  t=375s: Remove 2 pods (50% of 4) → 2 pods (hit minimum)
  t=435s: Stabilize at 3 pods (minReplicas)
  
Result: Returns to 3 pods over ~7 minutes
Cost: ~$0.15/hr
```

---

## HPA Monitoring

### Check HPA Status
```bash
kubectl get hpa -n hostel-allocation

# Output:
NAME                     REFERENCE                      TARGETS       MINPODS MAXPODS REPLICAS AGE
hostel-allocation-hpa   Deployment/hostel-allocation   45%/70%, 50%/80%  3  10       5        2d
```

### Watch HPA in Real-Time
```bash
kubectl get hpa -n hostel-allocation -w

# Watch pods scaling:
kubectl get pods -n hostel-allocation -w
```

### View HPA Events
```bash
kubectl describe hpa hostel-allocation-hpa -n hostel-allocation

# Output:
Events:
  Type    Reason             Age   From                       Message
  ----    ------             ----  ----                       -------
  Normal  SuccessfulRescale  5m    horizontal-pod-autoscaler  New size: 4; reason: cpu resource utilization (65%) exceeded target (70%)
  Normal  SuccessfulRescale  2m    horizontal-pod-autoscaler  New size: 3; reason: All metrics below target
```

### Check Metrics-Server
```bash
kubectl get deployment metrics-server -n kube-system

# If not installed:
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# Verify metrics available:
kubectl top pods -n hostel-allocation
kubectl top nodes
```

---

## Load Testing HPA

### Test 1: Generate Normal Load
```bash
# Run load generator pod
kubectl run -i --tty load-generator --rm --image=busybox --restart=Never -- /bin/sh

# Inside the pod:
while true; do wget -q -O- http://hostel-allocation.hostel-allocation.svc.cluster.local; done
```

### Test 2: Generate High Load
```bash
# Multiple load generators for sustained high load
for i in {1..5}; do
  kubectl run load-$i --rm --image=busybox --restart=Never -- \
    sh -c 'while true; do wget -q -O- http://hostel-allocation.hostel-allocation.svc.cluster.local > /dev/null; done' &
done

# Monitor HPA response:
kubectl get hpa hostel-allocation-hpa -n hostel-allocation -w
```

### Test 3: Verify Scale-Down
```bash
# Stop load generators (Ctrl+C on each)
# Monitor scale-down (takes ~5 minutes)
kubectl get hpa hostel-allocation-hpa -n hostel-allocation -w

# Expected behavior:
# 1. Load drops below threshold
# 2. Wait 5 minutes (stabilization window)
# 3. Gradually remove pods (50% per minute)
# 4. Return to 3 pods
```

---

## Feedback Loop: Monitoring to Pipeline

### Alert-Based Deployment Trigger

```
Monitoring Alert (High Error Rate)
    ↓
AlertManager Routes Alert
    ↓
Slack Notification to #alerts-critical
    ↓
On-Call Engineer Reviews Alert
    ↓
Decision Point:
  ├─ Recent deployment caused issue
  │  └─ Trigger: kubectl rollout undo
  │
  ├─ Scaling issue
  │  └─ Trigger: HPA scales up automatically
  │     (or manual: kubectl scale deployment ... --replicas=10)
  │
  └─ Code issue
     └─ Fix in code → Commit → Push tag → CI/CD → Deploy
```

### Automated Rollback on Monitoring Alert

**Option 1: Manual Trigger (Current)**
```bash
# Engineer manually triggers rollback
kubectl rollout undo deployment/hostel-allocation -n hostel-allocation
kubectl rollout status deployment/hostel-allocation -n hostel-allocation
```

**Option 2: Automated Trigger (Advanced)**
Create a webhook receiver:
```bash
# AlertManager sends webhook to rollback service
# Rollback service receives high error rate alert
# If error rate > 10% for 2 min → Automatically undo last deployment
# Otherwise → Page engineer for manual intervention
```

### Deployment Health Feedback

```
New Deployment
    ↓
Monitor Error Rate (first 5 minutes)
    ↓
Decision Point:
  ├─ Error Rate < 2% ✓
  │  └─ Deployment Healthy
  │     └─ Continue monitoring
  │
  └─ Error Rate > 5% ✗
     └─ Deployment Unhealthy
        └─ Trigger: kubectl rollout undo
        └─ Alert: #alerts-critical
        └─ Notify: On-call engineer
```

### Scaling Feedback Loop

```
High Load Detected (CPU > 70%)
    ↓
HPA Scales Up (add 2-3 pods)
    ↓
New Pods Starting
    ↓
Monitor CPU/Memory
    ├─ Drop to 50%: ✓ Scaling successful
    │  └─ Continue normal operation
    │
    └─ Remain high: ✗ Scaling insufficient
       └─ Trigger: Scale to max replicas (10)
       └─ Alert: #alerts-warning
       └─ Message: "Sustained high load, consider optimization"
```

---

## Monitoring Metrics for Scaling Decisions

### Real-Time Dashboard During Scale Events

**Metric 1: Pod Count Over Time**
```
Pods
  |     ╱─────╲
10|    ╱       ╲
  |   ╱         ╲
  |  ╱           ╲
  | ╱             ╲___
  |╱                   ╲____
  |________________________
  0  5m 10m 15m 20m 25m 30m
  
Timeline:
  0m:  High load arrives
  2m:  Scale to 5 pods
  4m:  Scale to 8 pods
  6m:  CPU stabilizes at 50%
  7m:  High load ends
  12m: Start scale-down (after 5m window)
  25m: Return to 3 pods
```

**Metric 2: CPU Usage During Scaling**
```
CPU %
  |
100|  ╱──╲
   | ╱    ╲___   ╱─╲
 70│╱          ╲_╱   ╲___
   |
  0└─────────────────────
   0  5m 10m 15m 20m 25m
   
Pattern:
  - CPU peaks at 80-85% (triggers scale-up)
  - Drops to 45-50% after scaling
  - Stabilizes around 40-50%
```

**Metric 3: Request Latency Impact**
```
Latency (ms)
    |
 500|    ╱╲
    |   ╱  ╲     ╱────
 300|  ╱    \___╱
    | ╱
 100|────────────────
    0  2m 4m 6m 8m 10m
    
Impact:
  - Pre-scale: 400ms (high load)
  - During scale: 500ms (new pods warming up)
  - Post-scale: 200ms (load distributed)
```

---

## Cost Impact of Scaling

### Hourly Cost Analysis

| Scenario | Replicas | CPU Total | Memory Total | Approx Cost/hr |
|----------|----------|-----------|--------------|--------|
| Idle (Night) | 3 | 300m | 384Mi | $0.15 |
| Normal (Day) | 5 | 500m | 640Mi | $0.25 |
| Busy (Peak) | 8 | 800m | 1280Mi | $0.40 |
| Extreme (Emergency) | 10 | 1000m | 1280Mi | $0.50 |

### Monthly Cost Projection

**Assumption:** 8 hours peak, 8 hours normal, 8 hours idle per day

```
Daily Cost:
  Idle (8h × $0.15):     $1.20
  Normal (8h × $0.25):   $2.00
  Peak (8h × $0.40):     $3.20
  Daily Total:           $6.40
  
Monthly Cost:
  $6.40 × 30 days = $192/month
  
With Auto-scaling:
  Prevents over-provisioning
  Cost: ~$150-200/month (depending on load patterns)
```

---

## HPA Troubleshooting

### Issue: HPA Not Scaling

**Check 1: Metrics Server Running?**
```bash
kubectl get deployment metrics-server -n kube-system
```

**Check 2: Pod Requests Defined?**
```bash
kubectl get pods -n hostel-allocation -o json | grep -A2 "requests"
# Must have CPU/memory requests defined
```

**Check 3: Current Metrics Available?**
```bash
kubectl get hpa hostel-allocation-hpa -n hostel-allocation
# TARGETS should show actual metrics, not "unknown"
```

**Check 4: HPA Events**
```bash
kubectl describe hpa hostel-allocation-hpa -n hostel-allocation
# Look for error messages in Events section
```

### Issue: Scaling Too Aggressively

**Solution: Adjust stabilization window**
```yaml
behavior:
  scaleUp:
    stabilizationWindowSeconds: 60  # Wait 1 min
  scaleDown:
    stabilizationWindowSeconds: 600 # Wait 10 min
```

### Issue: Pod Scaling Too Slow

**Solution: Adjust scale-up policy**
```yaml
behavior:
  scaleUp:
    policies:
    - type: Percent
      value: 200      # Triple the pods (was 100%)
      periodSeconds: 15
```

---

## Kubernetes Metrics Types

### Type 1: Resource Metrics (CPU, Memory)
- Source: Metrics Server
- Granularity: Per-pod
- Frequency: Every 15 seconds
- Latency: ~30 seconds

### Type 2: Custom Metrics
- Source: Custom Metric API (e.g., from Prometheus)
- Examples: HTTP requests/sec, queue length
- Setup required: Prometheus adapter

### Type 3: External Metrics
- Source: External services (e.g., cloud provider metrics)
- Examples: Pub/Sub queue depth, cloud load balancer metrics
- Setup required: External metric provider

---

## Auto-scaling Best Practices

✅ **Implemented:**
1. Multiple scaling metrics (CPU and memory)
2. Separate scale-up/scale-down policies (fast up, slow down)
3. Resource requests and limits defined
4. Min/max replica bounds (3-10)
5. Monitoring integration (Prometheus metrics)
6. Stabilization windows (prevent flapping)

✅ **Benefits:**
- Cost optimization (pay only for needed capacity)
- Performance maintenance (keeps latency low under load)
- Fault tolerance (automatically recovers from pod failures)
- Predictable behavior (stabilization prevents oscillation)
- Integration with monitoring (data-driven decisions)

---

## Scaling Verification Checklist

- [ ] Metrics Server installed and running
- [ ] HPA created: `kubectl get hpa -n hostel-allocation`
- [ ] Pod requests/limits defined in deployment
- [ ] Metrics visible: `kubectl top pods -n hostel-allocation`
- [ ] HPA shows TARGETS (not "unknown")
- [ ] Generate load and observe scaling: `watch kubectl get hpa -n hostel-allocation`
- [ ] Verify scale-up occurs within 30 seconds
- [ ] Verify scale-down takes ~5 minutes
- [ ] Monitor pod logs during scaling events
- [ ] Verify no pod evictions during scaling

---

## End-to-End Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ Continuous Deployment Pipeline                              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Git Commit/Tag                                              │
│    ↓                                                          │
│  GitHub Actions CI/CD                                        │
│    ├─ Code Quality Check                                     │
│    ├─ Security Scan (Trivy + CodeQL)                        │
│    ├─ Build Docker Image                                     │
│    ├─ Push to Registry                                       │
│    └─ Deploy to Kubernetes                                   │
│    ↓                                                          │
│  Rolling Update (Zero-Downtime)                             │
│    ├─ New pods created                                       │
│    ├─ Traffic shifted gradually                              │
│    └─ Old pods terminated                                    │
│    ↓                                                          │
│  Monitoring & Alerting                                       │
│    ├─ Prometheus scrapes metrics (15s)                       │
│    ├─ Error rates, latency, resource usage                  │
│    └─ Alerts if thresholds exceeded                          │
│    ↓                                                          │
│  Scaling Decision                                            │
│    ├─ CPU > 70% OR Memory > 80%                             │
│    ├─ HPA automatically adds pods                            │
│    └─ Up to max 10 replicas                                  │
│    ↓                                                          │
│  Feedback Loop                                               │
│    ├─ High Error Rate Detected                              │
│    ├─ Alert to #alerts-critical (Slack)                     │
│    ├─ On-call reviews → decides action                       │
│    └─ Manual rollback or fix & redeploy                      │
│    ↓                                                          │
│  Return to Baseline (Normal Load)                           │
│    ├─ Scale down over 5 minutes                              │
│    └─ Return to 3 pods                                       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

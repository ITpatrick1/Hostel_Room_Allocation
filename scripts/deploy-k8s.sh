#!/bin/bash

# Hostel Allocation Kubernetes Deployment Script
# This script deploys the application to a Kubernetes cluster

set -e

NAMESPACE="hostel-allocation"
DEPLOYMENT_NAME="hostel-allocation"
DOCKER_IMAGE="${1:-itpatrick/hostel_room_allocation:latest}"

echo "🚀 Starting Kubernetes Deployment"
echo "=================================="
echo "Namespace: $NAMESPACE"
echo "Deployment: $DEPLOYMENT_NAME"
echo "Image: $DOCKER_IMAGE"
echo ""

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed. Please install kubectl first."
    exit 1
fi

# Create namespace if it doesn't exist
echo "📦 Creating namespace..."
kubectl apply -f k8s/namespace.yaml

# Deploy configurations
echo "⚙️  Deploying configurations..."
kubectl apply -f k8s/configmap.yaml

# Deploy application
echo "🎯 Deploying application..."
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml

# Wait for deployment to be ready
echo "⏳ Waiting for deployment to be ready..."
kubectl rollout status deployment/$DEPLOYMENT_NAME -n $NAMESPACE

# Deploy auto-scaling
echo "📈 Configuring auto-scaling..."
kubectl apply -f k8s/hpa.yaml

# Deploy monitoring stack
echo "📊 Deploying monitoring stack..."
kubectl apply -f monitoring/prometheus-config.yaml
kubectl apply -f monitoring/alert-rules.yaml
kubectl apply -f monitoring/prometheus-deployment.yaml
kubectl apply -f monitoring/grafana-deployment.yaml
kubectl apply -f monitoring/alertmanager-deployment.yaml

# Get service information
echo ""
echo "✅ Deployment Complete!"
echo "=================================="
echo ""
echo "📍 Service Information:"
kubectl get svc -n $NAMESPACE

echo ""
echo "📊 Accessing Services:"
echo "  Application: kubectl port-forward -n $NAMESPACE svc/$DEPLOYMENT_NAME 3000:80"
echo "  Prometheus: kubectl port-forward -n $NAMESPACE svc/prometheus 9090:9090"
echo "  Grafana: kubectl port-forward -n $NAMESPACE svc/grafana 3000:3000"
echo "  AlertManager: kubectl port-forward -n $NAMESPACE svc/alertmanager 9093:9093"
echo ""
echo "🔍 Monitor deployment:"
echo "  kubectl get pods -n $NAMESPACE -w"
echo "  kubectl get hpa -n $NAMESPACE -w"

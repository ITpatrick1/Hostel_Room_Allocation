#!/bin/bash

# Hostel Allocation Kubernetes Cleanup Script
# This script removes all Kubernetes resources

set -e

NAMESPACE="hostel-allocation"

echo "🗑️  Removing Kubernetes resources from namespace: $NAMESPACE"
echo "=================================================="
echo ""

# Delete all resources in the namespace
echo "Deleting all resources in $NAMESPACE..."
kubectl delete all --all -n $NAMESPACE

# Delete ConfigMaps
echo "Deleting ConfigMaps..."
kubectl delete configmap --all -n $NAMESPACE || true

# Delete the namespace
echo "Deleting namespace..."
kubectl delete namespace $NAMESPACE || true

echo ""
echo "✅ Cleanup complete!"
echo "=================================================="

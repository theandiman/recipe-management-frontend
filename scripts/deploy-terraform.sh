#!/bin/bash
# Quick start script to deploy dev environment via Cloud Build
# Usage: ./scripts/deploy-terraform.sh [environment] [billing_account] [org_id]

set -e

ENVIRONMENT=${1:-dev}
BILLING_ACCOUNT=${2:-""}
ORG_ID=${3:-""}

if [ -z "$BILLING_ACCOUNT" ]; then
  echo "Error: Billing account required"
  echo "Usage: $0 [environment] [billing_account] [org_id]"
  echo ""
  echo "Get your billing account ID:"
  echo "  gcloud billing accounts list"
  exit 1
fi

echo "Deploying Terraform for environment: $ENVIRONMENT"
echo "Billing Account: $BILLING_ACCOUNT"
echo "Organization ID: $ORG_ID"
echo ""

# Build and submit to Cloud Build
gcloud builds submit \
  --config=cloudbuild-terraform.yaml \
  --substitutions=_ENVIRONMENT=$ENVIRONMENT,_BILLING_ACCOUNT=$BILLING_ACCOUNT,_ORG_ID=$ORG_ID

echo ""
echo "✅ Terraform deployment complete!"
echo ""
echo "To get your Firebase config for .env:"
echo "  cd terraform/environments/$ENVIRONMENT"
echo "  terraform output -raw env_file_content > ../../../.env"

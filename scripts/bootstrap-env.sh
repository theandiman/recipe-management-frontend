#!/usr/bin/env bash
set -euo pipefail

# Bootstrap .env.local for frontend using firebase CLI
# Run this script from project root.

if ! command -v firebase >/dev/null 2>&1; then
  echo "firebase CLI not found. Install it first: npm install -g firebase-tools" >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "jq not found. Please install it. See https://stedolan.github.io/jq/download/" >&2
  exit 1
fi

if ! command -v gcloud >/dev/null 2>&1; then
  echo "gcloud CLI not found. Install and authenticate first." >&2
  exit 1
fi

# Try to get project ID from .firebaserc first, fall back to gcloud
if [ -f ".firebaserc" ]; then
  PROJECT_ID=$(jq -r '.projects.default // ""' .firebaserc 2>/dev/null || true)
fi

if [ -z "$PROJECT_ID" ]; then
  PROJECT_ID=$(gcloud config get-value project 2>/dev/null || true)
fi

if [ -z "$PROJECT_ID" ]; then
  echo "No project ID found. Set it in .firebaserc or run 'gcloud config set project <PROJECT_ID>'." >&2
  exit 1
fi

echo "Using project: $PROJECT_ID"
echo "Extracting Firebase web app config via 'firebase apps:sdkconfig'..."
SDKCONF=$(firebase apps:sdkconfig WEB --project="$PROJECT_ID" 2>&1)

# Extract just the JSON part (skip the success message line)
JSON_CONFIG=$(echo "$SDKCONF" | grep -A 20 "^{" | jq -c '.')

if [ -z "$JSON_CONFIG" ] || [ "$JSON_CONFIG" = "null" ]; then
  echo "Failed to retrieve Firebase config. Make sure you have a web app configured in Firebase." >&2
  exit 1
fi

# Parse the JSON using jq
FIREBASE_API_KEY=$(echo "$JSON_CONFIG" | jq -r '.apiKey // ""')
FIREBASE_AUTH_DOMAIN=$(echo "$JSON_CONFIG" | jq -r '.authDomain // ""')
FIREBASE_PROJECT_ID=$(echo "$JSON_CONFIG" | jq -r '.projectId // ""')
FIREBASE_STORAGE_BUCKET=$(echo "$JSON_CONFIG" | jq -r '.storageBucket // ""')
FIREBASE_MESSAGING_SENDER_ID=$(echo "$JSON_CONFIG" | jq -r '.messagingSenderId // ""')
FIREBASE_APP_ID=$(echo "$JSON_CONFIG" | jq -r '.appId // ""')

# Use defaults if parsing failed
FIREBASE_AUTH_DOMAIN=${FIREBASE_AUTH_DOMAIN:-$PROJECT_ID.firebaseapp.com}
FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID:-$PROJECT_ID}
FIREBASE_STORAGE_BUCKET=${FIREBASE_STORAGE_BUCKET:-$PROJECT_ID.appspot.com}

# Get Cloud Run service URLs for AI and Storage services
echo "Fetching Cloud Run service URLs..."

# Get AI service URL
API_URL=$(gcloud run services describe recipe-ai-service --region=europe-west2 --project="$PROJECT_ID" --format='value(status.url)' 2>/dev/null || echo "")

if [ -z "$API_URL" ]; then
  echo "Failed to find recipe-ai-service in Cloud Run (europe-west2). Check service name and region." >&2
  exit 1
fi

# Get Storage service URL
STORAGE_API_URL=$(gcloud run services describe recipe-storage-service --region=europe-west2 --project="$PROJECT_ID" --format='value(status.url)' 2>/dev/null || echo "")

if [ -z "$STORAGE_API_URL" ]; then
  echo "Failed to find recipe-storage-service in Cloud Run (europe-west2). Check service name and region." >&2
  exit 1
fi

cat > .env.local <<EOF
VITE_FIREBASE_API_KEY=$FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=$FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET=$FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID=$FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID=$FIREBASE_APP_ID
VITE_API_URL=$API_URL
VITE_STORAGE_API_URL=$STORAGE_API_URL
EOF

echo ".env.local created (or overwritten)"

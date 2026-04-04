#!/bin/bash
set -e

REPO="theandiman/recipe-management-frontend"
ENV="dev"

echo "🔐 Pushing environment secrets to GitHub..."
echo "Repository: $REPO"
echo "Environment: $ENV"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    exit 1
fi

# Source the .env file
set -a
source .env
set +a

echo "📤 Setting Firebase configuration secrets..."
gh secret set VITE_FIREBASE_API_KEY \
    --env "$ENV" \
    --repo "$REPO" \
    --body "$VITE_FIREBASE_API_KEY"

gh secret set VITE_FIREBASE_AUTH_DOMAIN \
    --env "$ENV" \
    --repo "$REPO" \
    --body "$VITE_FIREBASE_AUTH_DOMAIN"

gh secret set VITE_FIREBASE_PROJECT_ID \
    --env "$ENV" \
    --repo "$REPO" \
    --body "$VITE_FIREBASE_PROJECT_ID"

gh secret set VITE_FIREBASE_STORAGE_BUCKET \
    --env "$ENV" \
    --repo "$REPO" \
    --body "$VITE_FIREBASE_STORAGE_BUCKET"

gh secret set VITE_FIREBASE_MESSAGING_SENDER_ID \
    --env "$ENV" \
    --repo "$REPO" \
    --body "$VITE_FIREBASE_MESSAGING_SENDER_ID"

gh secret set VITE_FIREBASE_APP_ID \
    --env "$ENV" \
    --repo "$REPO" \
    --body "$VITE_FIREBASE_APP_ID"

echo "📤 Setting backend API URL secrets..."
gh secret set VITE_API_URL \
    --env "$ENV" \
    --repo "$REPO" \
    --body "$VITE_API_URL"

gh secret set VITE_MANAGEMENT_API_URL \
    --env "$ENV" \
    --repo "$REPO" \
    --body "$VITE_MANAGEMENT_API_URL"

echo "📤 Setting Firebase deployment secrets..."
gh secret set FIREBASE_PROJECT_ID_DEV \
    --env "$ENV" \
    --repo "$REPO" \
    --body "$VITE_FIREBASE_PROJECT_ID"

echo ""
echo "✅ All secrets pushed successfully!"
echo ""
echo "⚠️  Note: You still need to manually set FIREBASE_SERVICE_ACCOUNT_DEV"
echo "    Get it from: Firebase Console > Project Settings > Service Accounts > Generate new private key"
echo "    Then run:"
echo "    gh secret set FIREBASE_SERVICE_ACCOUNT_DEV --env dev --repo $REPO < service-account-key.json"
echo ""

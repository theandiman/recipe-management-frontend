#!/bin/bash
set -e

echo "🔧 Fixing deployment with correct Cloud Run URLs"
echo ""

# 1. Build frontend with new URLs
echo "📦 Building frontend with updated API URLs..."
cd "$(dirname "$0")"
npm run build

# 2. Deploy to Firebase
echo "🚀 Deploying to Firebase Hosting..."
firebase deploy --only hosting

echo ""
echo "✅ Frontend deployed with correct URLs!"
echo ""
echo "📝 Updated URLs:"
echo "   AI Service: https://recipe-ai-service-htubs7zkna-nw.a.run.app"
echo "   Management Service: https://recipe-management-service-htubs7zkna-nw.a.run.app"
echo ""
echo "🌐 Test your app at: https://recipe-mgmt-dev.web.app"

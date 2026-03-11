#!/bin/bash
# ORBsignal Deploy Script
# Usage: ./deploy.sh "your commit message"
# Or just: ./deploy.sh  (uses default message)

MSG=${1:-"update build"}

echo ""
echo "🔧 Running scaffold..."
node scaffold.js <<< "$(yes y | head -20)"

echo ""
echo "🏗  Building..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Build failed — aborting push"
  exit 1
fi

echo ""
echo "🚀 Pushing to GitHub..."
git add .
git commit -m "$MSG"
git push

echo ""
echo "✅ Done! Vercel and Railway will redeploy automatically."
echo ""

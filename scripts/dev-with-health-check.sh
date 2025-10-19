#!/bin/bash

# Development Startup Script with Health Check
# 
# Usage:
#   chmod +x scripts/dev-with-health-check.sh
#   ./scripts/dev-with-health-check.sh

set -e

echo "🚀 Starting JSM Banking App with Health Check..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

# Run health check
echo "🏥 Running health check..."
echo ""

if npm run health-check; then
  echo ""
  echo -e "${GREEN}✅ Health check passed!${NC}"
  echo ""
  echo "🎯 Starting development server..."
  echo ""
  npm run dev
else
  echo ""
  echo -e "${RED}❌ Health check failed!${NC}"
  echo ""
  echo "⚠️  Some services may not be available:"
  echo "   • Check your .env.local file"
  echo "   • Verify Supabase project is running"
  echo "   • Check Plaid and Dwolla credentials"
  echo ""
  echo "Starting development server anyway (may have limited functionality)..."
  echo ""
  npm run dev
fi

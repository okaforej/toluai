#!/bin/bash

# ToluAI E2E Browser Automation Test Runner
# This script runs Playwright tests with a visible browser so you can watch the automation

echo "🤖 ==============================================="
echo "🤖  ToluAI E2E Browser Automation Test Runner"
echo "🤖 ==============================================="
echo ""
echo "📌 This will open a real browser window and automate UI interactions"
echo "📌 You can watch the entire test process in real-time!"
echo ""

# Check if servers are running
echo "🔍 Checking if servers are running..."

# Check backend
if curl -s http://localhost:5001/health | grep -q "healthy"; then
    echo "✅ Backend server is running"
else
    echo "⚠️  Backend server not detected. Starting it..."
    cd ..
    source venv/bin/activate 2>/dev/null || python3 -m venv venv && source venv/bin/activate
    python run_simple.py > /tmp/backend.log 2>&1 &
    cd frontend
    sleep 5
fi

# Check frontend
if curl -s http://localhost:5173/ | grep -q "<!DOCTYPE html>"; then
    echo "✅ Frontend server is running"
else
    echo "⚠️  Frontend server not detected. It will be started automatically"
fi

echo ""
echo "🎬 Starting E2E tests with visible browser..."
echo "👀 Watch the browser window that will open!"
echo ""

# Run Playwright tests with specific options
npx playwright test \
  --headed \
  --slowMo=500 \
  --timeout=60000 \
  --workers=1 \
  --reporter=list \
  --project=chromium

echo ""
echo "✅ E2E tests completed!"
echo ""
echo "📊 Test Results:"
echo "  - Check 'playwright-report' folder for detailed HTML report"
echo "  - Run 'npx playwright show-report' to view the report"
echo ""
echo "🎯 To run specific tests:"
echo "  - Full journey: npx playwright test full-user-journey --headed"
echo "  - PRA workflow: npx playwright test -g 'PRA Score' --headed"
echo "  - Company autocomplete: npx playwright test -g 'Company Autocomplete' --headed"
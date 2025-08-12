#!/bin/bash

# ToluAI System Monitor
# This script monitors both frontend and backend for errors and runs UI tests

echo "🔍 ToluAI System Monitor"
echo "========================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check backend status
echo "📡 Checking Backend Status..."
if curl -s http://localhost:5001/health | grep -q "healthy"; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
else
    echo -e "${RED}❌ Backend is not responding${NC}"
fi

# Check frontend status
echo ""
echo "🖥️  Checking Frontend Status..."
if curl -s http://localhost:5173/ | grep -q "<!DOCTYPE html>"; then
    echo -e "${GREEN}✅ Frontend is running${NC}"
else
    echo -e "${RED}❌ Frontend is not responding${NC}"
fi

# Check for recent errors in backend log
echo ""
echo "📋 Recent Backend Activity:"
tail -5 /tmp/backend.log 2>/dev/null | grep -E "ERROR|WARNING|Exception" || echo "No recent errors"

# Check for recent errors in frontend log
echo ""
echo "📋 Recent Frontend Activity:"
tail -5 /tmp/frontend.log 2>/dev/null | grep -E "error|Error|ERROR" || echo "No recent errors"

# Test specific endpoints
echo ""
echo "🧪 Testing API Endpoints:"

# Test entities endpoint
if curl -s "http://localhost:5001/api/v2/irpa/insured-entities?per_page=1" | grep -q "insured_entities"; then
    echo -e "${GREEN}✅ Entities API working${NC}"
else
    echo -e "${RED}❌ Entities API failed${NC}"
fi

# Test assessments endpoint
if curl -s "http://localhost:5001/api/v2/irpa/assessments?per_page=1" | grep -q "assessments"; then
    echo -e "${GREEN}✅ Assessments API working${NC}"
else
    echo -e "${RED}❌ Assessments API failed${NC}"
fi

# Memory usage
echo ""
echo "💾 Memory Usage:"
ps aux | grep -E "python|node" | grep -v grep | awk '{printf "%-20s %s\n", $11, $4"%"}'

echo ""
echo "✨ Monitoring complete!"
echo ""
echo "📌 Quick Actions:"
echo "  • View UI Test Panel: Open http://localhost:5173 and look for the test panel"
echo "  • Toggle Test Panel: Press Ctrl+Shift+T in the browser"
echo "  • Run Unit Tests: npm run test"
echo "  • View Logs: tail -f /tmp/backend.log or tail -f /tmp/frontend.log"
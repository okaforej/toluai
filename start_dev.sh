#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to cleanup background processes
cleanup() {
    echo -e "\n${YELLOW}🛑 Stopping development servers...${NC}"
    if [ ! -z "$FLASK_PID" ]; then
        kill $FLASK_PID 2>/dev/null
        echo -e "${RED}🔥 Flask server stopped${NC}"
    fi
    if [ ! -z "$REACT_PID" ]; then
        kill $REACT_PID 2>/dev/null
        echo -e "${BLUE}⚛️  React server stopped${NC}"
    fi
    exit 0
}

# Set trap for cleanup on script exit
trap cleanup SIGINT SIGTERM

echo -e "${GREEN}🚀 Starting ToluAI Development Environment${NC}"
echo -e "${GREEN}=========================================${NC}"

# Check if we're in the right directory
if [ ! -f "wsgi.py" ]; then
    echo -e "${RED}❌ Please run this script from the project root directory${NC}"
    exit 1
fi

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    echo -e "${YELLOW}🐍 Activating Python virtual environment...${NC}"
    source venv/bin/activate
fi

# Start Flask development server
echo -e "${GREEN}🌶️  Starting Flask backend server...${NC}"
echo -e "${BLUE}   URL: http://localhost:5000${NC}"
echo -e "${BLUE}   API: http://localhost:5000/api/v1/${NC}"

export FLASK_ENV=development
export FLASK_DEBUG=1

python run_dev.py &
FLASK_PID=$!

# Wait a moment for Flask to start
sleep 3

# Check if Flask started successfully
if ! kill -0 $FLASK_PID 2>/dev/null; then
    echo -e "${RED}❌ Flask server failed to start${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Flask server started (PID: $FLASK_PID)${NC}"

# Start React development server
echo -e "${GREEN}⚛️  Starting React frontend server...${NC}"
echo -e "${BLUE}   URL: http://localhost:5173${NC}"

cd frontend

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing React dependencies...${NC}"
    npm install
fi

# Start React dev server
npm run dev &
REACT_PID=$!

cd ..

# Wait a moment for React to start
sleep 5

# Check if React started successfully
if ! kill -0 $REACT_PID 2>/dev/null; then
    echo -e "${RED}❌ React server failed to start${NC}"
    cleanup
    exit 1
fi

echo -e "${GREEN}✅ React server started (PID: $REACT_PID)${NC}"

echo -e "\n${GREEN}🎉 Development environment ready!${NC}"
echo -e "${GREEN}================================${NC}"
echo -e "${YELLOW}📍 Frontend:${NC} http://localhost:5173"
echo -e "${YELLOW}📍 Backend:${NC}  http://localhost:5000"
echo -e "${YELLOW}📍 API Docs:${NC} http://localhost:5000/api/v1/"
echo -e "\n${BLUE}🔄 Both servers have hot reload enabled${NC}"
echo -e "${BLUE}💾 Changes to files will automatically restart servers${NC}"
echo -e "\n${RED}🛑 Press Ctrl+C to stop all servers${NC}"

# Keep script running and wait for user interrupt
wait $FLASK_PID $REACT_PID
#!/bin/bash

echo "================================================"
echo "    LOG LENS - Complete Setup & Launch         "
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check for Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Python 3 is not installed. Please install Python 3.8 or higher.${NC}"
    exit 1
fi

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Please install Node.js 16 or higher.${NC}"
    exit 1
fi

echo -e "${GREEN}[1/6] Setting up Python backend...${NC}"
# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install Python dependencies
pip install --upgrade pip
pip install flask flask-cors duckdb

echo -e "${GREEN}[2/6] Creating database...${NC}"
# Create the database
python3 create_mock_db.py

# Check if database was created
if [ ! -f "universal_cmdb.db" ]; then
    echo -e "${RED}Database creation failed!${NC}"
    exit 1
fi

echo -e "${GREEN}[3/6] Installing Node.js dependencies...${NC}"
# Install npm dependencies
npm install

echo -e "${GREEN}[4/6] Starting Flask backend...${NC}"
# Start Flask app in background
python app.py &
FLASK_PID=$!

# Wait for Flask to start
sleep 5

echo -e "${GREEN}[5/6] Starting Next.js development server...${NC}"
# Start Next.js
npm run dev &
NEXT_PID=$!

echo ""
echo "================================================"
echo -e "${GREEN}    LOG LENS IS RUNNING!${NC}"
echo "================================================"
echo ""
echo "📊 Flask API:     http://localhost:5000"
echo "🎨 Next.js App:   http://localhost:3000"
echo ""
echo "Test the API endpoints:"
echo "  http://localhost:5000/api/database_status"
echo "  http://localhost:5000/api/source_tables_metrics"
echo "  http://localhost:5000/api/region_metrics"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Shutting down services...${NC}"
    kill $FLASK_PID 2>/dev/null
    kill $NEXT_PID 2>/dev/null
    deactivate
    echo -e "${GREEN}Services stopped.${NC}"
    exit 0
}

# Set trap to cleanup on Ctrl+C
trap cleanup INT

# Keep script running
wait
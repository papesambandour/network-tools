#!/bin/bash

echo "=========================================="
echo "   SSH Tunnel Manager - Quick Start"
echo "=========================================="
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
fi

if [ ! -d "client/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd client && npm install && cd ..
fi

echo ""
echo "Starting application..."
echo "Backend API: http://localhost:3001"
echo "Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

npm run dev

#!/bin/bash

# Receipt Scanner AI - Unix Setup Script
# This script helps set up the project on Linux/macOS

echo ""
echo "========================================"
echo "Receipt Scanner AI - Setup"
echo "========================================"
echo ""

# Check Java
echo "[1/4] Checking Java 21..."
if ! command -v java &> /dev/null; then
    echo "ERROR: Java 21 not found. Please install Java 21 first."
    echo "Download from: https://www.oracle.com/java/technologies/downloads/#java21"
    exit 1
fi
echo "OK: Java found ($(java -version 2>&1 | grep -i version | head -1))"

# Check Node
echo "[2/4] Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js not found. Please install Node.js 18+ first."
    echo "Download from: https://nodejs.org/"
    exit 1
fi
echo "OK: Node.js found ($(node --version))"

# Check PostgreSQL
echo "[3/4] Checking PostgreSQL..."
if ! command -v psql &> /dev/null; then
    echo "WARNING: PostgreSQL not found in PATH."
    echo "Make sure PostgreSQL is running on localhost:5432"
else
    echo "OK: PostgreSQL found ($(psql --version))"
fi

# Check .env
echo "[4/4] Checking .env file..."
if [ ! -f ".env" ]; then
    echo "Creating .env from template..."
    cp .env.example .env
    echo ""
    echo "IMPORTANT: Edit .env with your actual values:"
    echo "  - GEMINI_API_KEY (from https://aistudio.google.com/apikey)"
    echo "  - PostgreSQL credentials"
    echo ""
    read -p "Press Enter to continue..."
else
    echo "OK: .env exists"
fi

echo ""
echo "========================================"
echo "Setup Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "  1. Edit .env with your credentials"
echo "  2. Open Terminal 1 and run: cd back-end && mvn spring-boot:run"
echo "  3. Open Terminal 2 and run: cd front-end && npm install && npm run dev"
echo "  4. Open http://localhost:5173 in browser"
echo ""

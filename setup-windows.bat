@echo off
REM Receipt Scanner AI - Windows Setup Script
REM This script helps set up the project on Windows

echo.
echo ========================================
echo Receipt Scanner AI - Setup
echo ========================================
echo.

REM Check Java
echo [1/4] Checking Java 21...
java -version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Java 21 not found. Please install Java 21 first.
    echo Download from: https://www.oracle.com/java/technologies/downloads/#java21
    pause
    exit /b 1
)
echo OK: Java found

REM Check Node
echo [2/4] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found. Please install Node.js 18+ first.
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)
echo OK: Node.js found

REM Check PostgreSQL
echo [3/4] Checking PostgreSQL...
psql --version >nul 2>&1
if errorlevel 1 (
    echo WARNING: PostgreSQL not found in PATH. 
    echo Make sure PostgreSQL is running on localhost:5432
) else (
    echo OK: PostgreSQL found
)

REM Check .env
echo [4/4] Checking .env file...
if not exist ".env" (
    echo Creating .env from template...
    copy .env.example .env
    echo.
    echo IMPORTANT: Edit .env with your actual values:
    echo   - GEMINI_API_KEY (from https://aistudio.google.com/apikey)
    echo   - PostgreSQL credentials
    echo.
    pause
) else (
    echo OK: .env exists
)

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo   1. Edit .env with your credentials
echo   2. Open Terminal 1 and run: cd back-end ^&^& mvn spring-boot:run
echo   3. Open Terminal 2 and run: cd front-end ^&^& npm install ^&^& npm run dev
echo   4. Open http://localhost:5173 in browser
echo.
pause

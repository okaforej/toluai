@echo off
REM ToluAI Windows Setup Script (CMD/Batch)
REM Run this script in Command Prompt: setup_windows.bat

echo =====================================
echo    ToluAI Windows Setup Script
echo =====================================
echo.

REM Check Python installation
echo Checking Python installation...
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Python is installed
    python --version
) else (
    python3 --version >nul 2>&1
    if %errorlevel% equ 0 (
        echo [OK] Python3 is installed
        python3 --version
        set PYTHON_CMD=python3
    ) else (
        echo [ERROR] Python is not installed
        echo Please install Python 3.9+ from https://www.python.org/downloads/
        echo After installing Python, run this script again.
        pause
        exit /b 1
    )
)

if not defined PYTHON_CMD (
    set PYTHON_CMD=python
)

REM Check Node.js installation
echo.
echo Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Node.js is installed
    node --version
) else (
    echo [ERROR] Node.js is not installed
    echo Please install Node.js from https://nodejs.org/
    echo After installing Node.js, run this script again.
    pause
    exit /b 1
)

REM Check npm installation
npm --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] npm is installed
    npm --version
) else (
    echo [WARNING] npm is not installed but Node.js is installed
)

REM Check Git installation
echo.
echo Checking Git installation...
git --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Git is installed
    git --version
) else (
    echo [WARNING] Git is not installed
    echo Install Git from https://git-scm.com/download/win for version control
)

echo.
echo =====================================
echo    Setting up Python Environment
echo =====================================
echo.

REM Create virtual environment
echo Creating Python virtual environment...
if exist venv (
    echo [WARNING] Virtual environment already exists
    set /p recreate="Do you want to recreate it? (y/n): "
    if /i "%recreate%"=="y" (
        echo Removing existing virtual environment...
        rmdir /s /q venv
        %PYTHON_CMD% -m venv venv
        echo [OK] Virtual environment recreated
    )
) else (
    %PYTHON_CMD% -m venv venv
    echo [OK] Virtual environment created
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat
echo [OK] Virtual environment activated

REM Upgrade pip
echo Upgrading pip...
python -m pip install --upgrade pip >nul 2>&1
echo [OK] pip upgraded

REM Install Python dependencies
echo Installing Python dependencies from requirements.txt...
if exist requirements.txt (
    python -m pip install -r requirements.txt
    if %errorlevel% equ 0 (
        echo [OK] Python dependencies installed
    ) else (
        echo [ERROR] Failed to install some Python dependencies
    )
) else (
    echo [ERROR] requirements.txt not found
    pause
    exit /b 1
)

echo.
echo =====================================
echo    Setting up Frontend
echo =====================================
echo.

REM Navigate to frontend directory
echo Setting up frontend dependencies...
if exist frontend (
    cd frontend
    
    REM Install npm dependencies
    echo Installing npm packages (this may take a few minutes)...
    call npm install
    
    if %errorlevel% equ 0 (
        echo [OK] Frontend dependencies installed
    ) else (
        echo [ERROR] Failed to install frontend dependencies
    )
    
    REM Return to root directory
    cd ..
) else (
    echo [ERROR] frontend directory not found
)

echo.
echo =====================================
echo    Database Setup
echo =====================================
echo.

REM Check PostgreSQL installation
echo Checking PostgreSQL installation...
psql --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] PostgreSQL is installed
    psql --version
    
    set /p setupdb="Do you want to set up the PostgreSQL database? (y/n): "
    if /i "%setupdb%"=="y" (
        echo Setting up database...
        echo Note: You may need to run this part manually as administrator
        echo Database name: toluai_dev
        echo Username: toluai_dev
        echo Password: toluai_dev_pass123
    )
) else (
    echo [WARNING] PostgreSQL not installed
    echo For production use, install PostgreSQL from:
    echo https://www.postgresql.org/download/windows/
    echo The application will use SQLite for development.
)

echo.
echo =====================================
echo    Environment Configuration
echo =====================================
echo.

REM Create .env file if it doesn't exist
if not exist .env (
    echo Creating .env file...
    (
        echo # ToluAI Environment Variables
        echo ENVIRONMENT=development
        echo FLASK_ENV=development
        echo FLASK_DEBUG=1
        echo.
        echo # Database
        echo DATABASE_URL=sqlite:///toluai.db
        echo.
        echo # Security
        echo SECRET_KEY=dev-secret-key-change-in-production
        echo JWT_SECRET_KEY=jwt-secret-key-change-in-production
        echo.
        echo # API Configuration
        echo API_VERSION=v1
        echo CORS_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:5175
        echo.
        echo # Server Configuration
        echo PORT=5001
        echo HOST=0.0.0.0
    ) > .env
    echo [OK] .env file created
) else (
    echo [WARNING] .env file already exists
)

echo.
echo =====================================
echo    Setup Complete!
echo =====================================
echo.
echo To start the application:
echo.
echo 1. Start the backend server:
echo    venv\Scripts\activate
echo    python main.py
echo.
echo 2. In a new terminal, start the frontend:
echo    cd frontend
echo    npm run dev
echo.
echo 3. Access the application:
echo    Frontend: http://localhost:5173
echo    Backend API: http://localhost:5001
echo    API Docs: http://localhost:5001/api/docs
echo.
echo Demo Credentials:
echo    admin@toluai.com / Admin123!
echo    analyst@toluai.com / Analyst123!
echo    viewer@toluai.com / Viewer123!
echo.
echo For more information, see README.md
echo.
pause
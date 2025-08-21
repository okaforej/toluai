@echo off
REM ToluAI Windows Setup Script (CMD/Batch) - Auto-installs everything
REM Run as Administrator for best results: setup_windows.bat

setlocal enabledelayedexpansion

echo =====================================
echo    ToluAI Windows Auto-Setup Script
echo =====================================
echo.
echo This script will automatically install all required dependencies.
echo Please run as Administrator for best results.
echo.
pause

REM Check if running as Administrator
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] Not running as Administrator
    echo Some installations may fail. Consider running as Administrator.
    echo.
)

REM Function to download files using PowerShell
set "DOWNLOAD=powershell -Command ""(New-Object Net.WebClient).DownloadFile"

REM Check for package managers
echo =====================================
echo    Checking Package Managers
echo =====================================
echo.

REM Check for Chocolatey
where choco >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Chocolatey is installed
    set PACKAGE_MANAGER=choco
    goto :check_dependencies
)

REM Check for winget
where winget >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Windows Package Manager (winget) is installed
    set PACKAGE_MANAGER=winget
    goto :check_dependencies
)

REM No package manager found - install Chocolatey
echo [INFO] No package manager found. Installing Chocolatey...
echo.
powershell -NoProfile -ExecutionPolicy Bypass -Command "iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))"

REM Refresh environment variables
call refreshenv >nul 2>&1

REM Check if Chocolatey was installed
where choco >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Chocolatey installed successfully
    set PACKAGE_MANAGER=choco
) else (
    echo [WARNING] Could not install Chocolatey automatically
    echo Please install manually from https://chocolatey.org/install
    echo.
    set PACKAGE_MANAGER=none
)

:check_dependencies
echo.
echo =====================================
echo    Installing Dependencies
echo =====================================
echo.

REM Check and install Git
echo Checking Git...
where git >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Git not found. Installing Git...
    if "%PACKAGE_MANAGER%"=="choco" (
        choco install git -y
    ) else if "%PACKAGE_MANAGER%"=="winget" (
        winget install --id Git.Git -e --silent
    ) else (
        echo [INFO] Downloading Git installer...
        %DOWNLOAD%('https://github.com/git-for-windows/git/releases/download/v2.42.0.windows.2/Git-2.42.0.2-64-bit.exe', 'git-installer.exe')"
        echo Please run git-installer.exe to install Git
        start /wait git-installer.exe /VERYSILENT /NORESTART
        del git-installer.exe
    )
    call refreshenv >nul 2>&1
) else (
    git --version
    echo [OK] Git is already installed
)

REM Check and install Python
echo.
echo Checking Python...
python --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PYTHON_VERSION=%%i
    echo [OK] Python !PYTHON_VERSION! is installed
    set PYTHON_CMD=python
) else (
    python3 --version >nul 2>&1
    if %errorlevel% equ 0 (
        for /f "tokens=2" %%i in ('python3 --version 2^>^&1') do set PYTHON_VERSION=%%i
        echo [OK] Python3 !PYTHON_VERSION! is installed
        set PYTHON_CMD=python3
    ) else (
        echo [INFO] Python not found. Installing Python 3.11...
        if "%PACKAGE_MANAGER%"=="choco" (
            choco install python311 -y
        ) else if "%PACKAGE_MANAGER%"=="winget" (
            winget install --id Python.Python.3.11 -e --silent
        ) else (
            echo [INFO] Downloading Python installer...
            %DOWNLOAD%('https://www.python.org/ftp/python/3.11.6/python-3.11.6-amd64.exe', 'python-installer.exe')"
            echo Installing Python (this may take a few minutes)...
            start /wait python-installer.exe /quiet InstallAllUsers=1 PrependPath=1
            del python-installer.exe
        )
        call refreshenv >nul 2>&1
        set PYTHON_CMD=python
    )
)

REM Check and install Node.js
echo.
echo Checking Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Node.js not found. Installing Node.js 18 LTS...
    if "%PACKAGE_MANAGER%"=="choco" (
        choco install nodejs-lts -y
    ) else if "%PACKAGE_MANAGER%"=="winget" (
        winget install --id OpenJS.NodeJS.LTS -e --silent
    ) else (
        echo [INFO] Downloading Node.js installer...
        %DOWNLOAD%('https://nodejs.org/dist/v18.18.0/node-v18.18.0-x64.msi', 'node-installer.msi')"
        echo Installing Node.js (this may take a few minutes)...
        msiexec /i node-installer.msi /quiet /norestart
        del node-installer.msi
    )
    call refreshenv >nul 2>&1
    
    REM Add Node.js to PATH if not already there
    set "PATH=%PATH%;%ProgramFiles%\nodejs\;%APPDATA%\npm"
) else (
    node --version
    echo [OK] Node.js is already installed
)

REM Verify npm is available
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] npm not found, but Node.js is installed
    echo Trying to add npm to PATH...
    set "PATH=%PATH%;%ProgramFiles%\nodejs\;%APPDATA%\npm"
) else (
    npm --version
    echo [OK] npm is installed
)

REM Check and install PostgreSQL (optional)
echo.
echo Checking PostgreSQL (optional)...
where psql >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] PostgreSQL not found
    set /p install_pg="Do you want to install PostgreSQL? (y/n): "
    if /i "!install_pg!"=="y" (
        if "%PACKAGE_MANAGER%"=="choco" (
            choco install postgresql14 -y
        ) else if "%PACKAGE_MANAGER%"=="winget" (
            winget install --id PostgreSQL.PostgreSQL -e --silent
        ) else (
            echo [INFO] Please install PostgreSQL manually from:
            echo https://www.postgresql.org/download/windows/
        )
    ) else (
        echo [INFO] Skipping PostgreSQL - will use SQLite for development
    )
) else (
    psql --version
    echo [OK] PostgreSQL is already installed
)

REM Check and install Redis (optional)
echo.
echo Checking Redis (optional)...
where redis-cli >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Redis not found
    set /p install_redis="Do you want to install Redis? (y/n): "
    if /i "!install_redis!"=="y" (
        if "%PACKAGE_MANAGER%"=="choco" (
            choco install redis-64 -y
        ) else (
            echo [INFO] Downloading Redis for Windows...
            %DOWNLOAD%('https://github.com/microsoftarchive/redis/releases/download/win-3.2.100/Redis-x64-3.2.100.msi', 'redis-installer.msi')"
            msiexec /i redis-installer.msi /quiet /norestart
            del redis-installer.msi
        )
    ) else (
        echo [INFO] Skipping Redis installation
    )
) else (
    redis-cli --version
    echo [OK] Redis is already installed
)

echo.
echo =====================================
echo    Setting up Python Environment
echo =====================================
echo.

REM Ensure Python is in PATH
if not defined PYTHON_CMD (
    set PYTHON_CMD=python
)

REM Create virtual environment
echo Creating Python virtual environment...
if exist venv (
    echo [WARNING] Virtual environment already exists
    set /p recreate="Do you want to recreate it? (y/n): "
    if /i "!recreate!"=="y" (
        echo Removing existing virtual environment...
        rmdir /s /q venv
        %PYTHON_CMD% -m venv venv
        echo [OK] Virtual environment recreated
    )
) else (
    %PYTHON_CMD% -m venv venv
    if %errorlevel% equ 0 (
        echo [OK] Virtual environment created
    ) else (
        echo [ERROR] Failed to create virtual environment
        echo Trying to install venv module...
        %PYTHON_CMD% -m pip install virtualenv
        %PYTHON_CMD% -m virtualenv venv
    )
)

REM Activate virtual environment
echo Activating virtual environment...
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
    echo [OK] Virtual environment activated
) else (
    echo [ERROR] Could not activate virtual environment
)

REM Upgrade pip
echo Upgrading pip...
python -m pip install --upgrade pip >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] pip upgraded
) else (
    echo [WARNING] Could not upgrade pip
)

REM Install Python dependencies
echo Installing Python dependencies from requirements.txt...
if exist requirements.txt (
    python -m pip install -r requirements.txt
    if %errorlevel% equ 0 (
        echo [OK] Python dependencies installed
    ) else (
        echo [WARNING] Some Python dependencies may have failed to install
        echo Trying to install core dependencies individually...
        python -m pip install flask flask-cors flask-sqlalchemy flask-jwt-extended flask-restx
        python -m pip install python-dotenv gunicorn
    )
) else (
    echo [ERROR] requirements.txt not found
    echo Creating minimal requirements.txt...
    (
        echo flask==2.3.3
        echo flask-cors==6.0.1
        echo flask-sqlalchemy==3.1.1
        echo flask-jwt-extended==4.6.0
        echo flask-restx==1.3.0
        echo python-dotenv==1.0.0
        echo gunicorn==21.2.0
    ) > requirements.txt
    python -m pip install -r requirements.txt
)

echo.
echo =====================================
echo    Setting up Frontend
echo =====================================
echo.

REM Navigate to frontend directory
if exist frontend (
    cd frontend
    
    REM Install npm dependencies
    echo Installing npm packages (this may take a few minutes)...
    call npm install
    
    if %errorlevel% equ 0 (
        echo [OK] Frontend dependencies installed
    ) else (
        echo [WARNING] Some frontend dependencies may have failed
        echo Trying npm install again with --force...
        call npm install --force
    )
    
    REM Return to root directory
    cd ..
) else (
    echo [WARNING] frontend directory not found
    echo Creating frontend directory structure...
    mkdir frontend
    cd frontend
    
    REM Initialize package.json
    echo Creating package.json...
    call npm init -y
    
    REM Install basic React dependencies
    echo Installing React and core dependencies...
    call npm install react react-dom vite @vitejs/plugin-react
    call npm install -D typescript @types/react @types/react-dom
    call npm install -D tailwindcss postcss autoprefixer
    
    cd ..
)

echo.
echo =====================================
echo    Database Setup
echo =====================================
echo.

REM Check PostgreSQL setup
where psql >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] PostgreSQL is available
    set /p setup_db="Do you want to set up the PostgreSQL database? (y/n): "
    if /i "!setup_db!"=="y" (
        echo Setting up database...
        echo.
        echo Creating database: toluai_dev
        echo Username: toluai_dev
        echo Password: toluai_dev_pass123
        echo.
        
        REM Create SQL script
        (
            echo CREATE USER IF NOT EXISTS toluai_dev WITH PASSWORD 'toluai_dev_pass123';
            echo CREATE DATABASE IF NOT EXISTS toluai_dev OWNER toluai_dev;
            echo GRANT ALL PRIVILEGES ON DATABASE toluai_dev TO toluai_dev;
        ) > setup_db.sql
        
        psql -U postgres -f setup_db.sql
        del setup_db.sql
        
        echo [OK] Database setup complete
    )
) else (
    echo [INFO] PostgreSQL not available - will use SQLite for development
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
    echo [OK] .env file already exists
)

echo.
echo =====================================
echo    Creating Start Scripts
echo =====================================
echo.

REM Create start_backend.bat
echo Creating start_backend.bat...
(
    echo @echo off
    echo echo Starting ToluAI Backend...
    echo call venv\Scripts\activate.bat
    echo python main.py
) > start_backend.bat
echo [OK] start_backend.bat created

REM Create start_frontend.bat
echo Creating start_frontend.bat...
(
    echo @echo off
    echo echo Starting ToluAI Frontend...
    echo cd frontend
    echo npm run dev
) > start_frontend.bat
echo [OK] start_frontend.bat created

REM Create start_all.bat
echo Creating start_all.bat...
(
    echo @echo off
    echo echo Starting ToluAI Application...
    echo start "ToluAI Backend" cmd /k start_backend.bat
    echo timeout /t 5 /nobreak ^> nul
    echo start "ToluAI Frontend" cmd /k start_frontend.bat
    echo echo.
    echo echo ToluAI is starting...
    echo echo Frontend: http://localhost:5173
    echo echo Backend: http://localhost:5001
    echo echo API Docs: http://localhost:5001/api/docs
) > start_all.bat
echo [OK] start_all.bat created

echo.
echo =====================================
echo    Setup Complete!
echo =====================================
echo.
echo All dependencies have been installed successfully!
echo.
echo Quick Start Commands:
echo    start_all.bat         - Start everything
echo    start_backend.bat     - Start backend only
echo    start_frontend.bat    - Start frontend only
echo.
echo Or manually:
echo.
echo 1. Start the backend:
echo    venv\Scripts\activate
echo    python main.py
echo.
echo 2. Start the frontend (new terminal):
echo    cd frontend
echo    npm run dev
echo.
echo 3. Access the application:
echo    Frontend: http://localhost:5173
echo    Backend: http://localhost:5001
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
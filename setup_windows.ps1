# ToluAI Windows Setup Script (PowerShell) - Auto-installs everything
# Run as Administrator: Set-ExecutionPolicy Bypass -Scope Process -Force; .\setup_windows.ps1

param(
    [switch]$SkipPrompts = $false,
    [switch]$InstallOptional = $false
)

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "   ToluAI Windows Auto-Setup Script" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

if (-not $isAdmin) {
    Write-Host "⚠ Not running as Administrator" -ForegroundColor Yellow
    Write-Host "Some installations may require admin privileges." -ForegroundColor Yellow
    Write-Host "Consider running PowerShell as Administrator." -ForegroundColor Yellow
    Write-Host ""
}

# Function to check if a command exists
function Test-Command {
    param($Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    } catch {
        return $false
    }
}

# Function to print status messages
function Write-Status {
    param(
        [string]$Message,
        [string]$Type = "Info"
    )
    
    switch ($Type) {
        "Success" { Write-Host "✓ $Message" -ForegroundColor Green }
        "Error" { Write-Host "✗ $Message" -ForegroundColor Red }
        "Warning" { Write-Host "⚠ $Message" -ForegroundColor Yellow }
        "Info" { Write-Host "→ $Message" -ForegroundColor Cyan }
    }
}

# Function to install using package manager
function Install-Package {
    param(
        [string]$PackageName,
        [string]$WingetId,
        [string]$ChocoId,
        [string]$ManualUrl
    )
    
    if (Test-Command "winget") {
        Write-Status "Installing $PackageName using winget..." "Info"
        winget install --id $WingetId -e --silent --accept-package-agreements --accept-source-agreements
        return $?
    } elseif (Test-Command "choco") {
        Write-Status "Installing $PackageName using Chocolatey..." "Info"
        choco install $ChocoId -y
        return $?
    } else {
        Write-Status "No package manager found. Please install manually from: $ManualUrl" "Warning"
        return $false
    }
}

# Install Chocolatey if no package manager exists
Write-Status "Checking for package managers..."
if (-not (Test-Command "winget") -and -not (Test-Command "choco")) {
    Write-Status "No package manager found. Installing Chocolatey..." "Info"
    
    try {
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        
        # Refresh PATH
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
        
        if (Test-Command "choco") {
            Write-Status "Chocolatey installed successfully" "Success"
        }
    } catch {
        Write-Status "Failed to install Chocolatey: $_" "Error"
    }
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "   Installing Core Dependencies" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check and install Git
Write-Status "Checking Git installation..."
if (Test-Command "git") {
    $gitVersion = git --version
    Write-Status "Git found: $gitVersion" "Success"
} else {
    Write-Status "Git not found. Installing Git..." "Warning"
    if (Install-Package -PackageName "Git" -WingetId "Git.Git" -ChocoId "git" -ManualUrl "https://git-scm.com/download/win") {
        # Refresh PATH
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
        Write-Status "Git installed successfully" "Success"
    }
}

# Check and install Python
Write-Status "Checking Python installation..."
$pythonCmd = $null
if (Test-Command "python") {
    $pythonVersion = python --version 2>&1
    if ($pythonVersion -match "Python 3\.(\d+)") {
        $pythonCmd = "python"
        Write-Status "Python found: $pythonVersion" "Success"
    }
} elseif (Test-Command "python3") {
    $pythonVersion = python3 --version
    $pythonCmd = "python3"
    Write-Status "Python3 found: $pythonVersion" "Success"
}

if (-not $pythonCmd) {
    Write-Status "Python not found. Installing Python 3.11..." "Warning"
    if (Install-Package -PackageName "Python 3.11" -WingetId "Python.Python.3.11" -ChocoId "python311" -ManualUrl "https://www.python.org/downloads/") {
        # Refresh PATH
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
        $pythonCmd = "python"
        Write-Status "Python installed successfully" "Success"
    } else {
        Write-Status "Failed to install Python. Please install manually." "Error"
        exit 1
    }
}

# Check and install Node.js
Write-Status "Checking Node.js installation..."
if (Test-Command "node") {
    $nodeVersion = node --version
    Write-Status "Node.js found: $nodeVersion" "Success"
} else {
    Write-Status "Node.js not found. Installing Node.js LTS..." "Warning"
    if (Install-Package -PackageName "Node.js" -WingetId "OpenJS.NodeJS.LTS" -ChocoId "nodejs-lts" -ManualUrl "https://nodejs.org/") {
        # Refresh PATH
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
        Write-Status "Node.js installed successfully" "Success"
    } else {
        Write-Status "Failed to install Node.js. Please install manually." "Error"
        exit 1
    }
}

# Check npm
if (Test-Command "npm") {
    $npmVersion = npm --version
    Write-Status "npm found: $npmVersion" "Success"
} else {
    Write-Status "npm not found but Node.js is installed. This is unusual." "Warning"
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "   Optional Dependencies" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# PostgreSQL (optional)
Write-Status "Checking PostgreSQL..."
if (Test-Command "psql") {
    $psqlVersion = psql --version
    Write-Status "PostgreSQL found: $psqlVersion" "Success"
} else {
    Write-Status "PostgreSQL not found" "Warning"
    
    if ($InstallOptional -or (-not $SkipPrompts -and (Read-Host "Install PostgreSQL? (y/n)") -eq 'y')) {
        if (Install-Package -PackageName "PostgreSQL" -WingetId "PostgreSQL.PostgreSQL" -ChocoId "postgresql14" -ManualUrl "https://www.postgresql.org/download/windows/") {
            Write-Status "PostgreSQL installed successfully" "Success"
        }
    } else {
        Write-Status "Skipping PostgreSQL - will use SQLite for development" "Info"
    }
}

# Redis (optional)
Write-Status "Checking Redis..."
if (Test-Command "redis-cli") {
    $redisVersion = redis-cli --version
    Write-Status "Redis found: $redisVersion" "Success"
} else {
    Write-Status "Redis not found" "Warning"
    
    if ($InstallOptional -or (-not $SkipPrompts -and (Read-Host "Install Redis? (y/n)") -eq 'y')) {
        if (Test-Command "choco") {
            choco install redis-64 -y
            Write-Status "Redis installed successfully" "Success"
        } else {
            Write-Status "Redis for Windows: https://github.com/microsoftarchive/redis/releases" "Info"
        }
    } else {
        Write-Status "Skipping Redis installation" "Info"
    }
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "   Setting up Python Environment" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Create virtual environment
Write-Status "Creating Python virtual environment..."
if (Test-Path "venv") {
    Write-Status "Virtual environment already exists" "Warning"
    if (-not $SkipPrompts) {
        $response = Read-Host "Do you want to recreate it? (y/n)"
        if ($response -eq 'y') {
            Remove-Item -Recurse -Force venv
            & $pythonCmd -m venv venv
            Write-Status "Virtual environment recreated" "Success"
        }
    }
} else {
    & $pythonCmd -m venv venv
    if ($?) {
        Write-Status "Virtual environment created" "Success"
    } else {
        Write-Status "Failed to create virtual environment" "Error"
        Write-Status "Trying with virtualenv package..." "Info"
        & $pythonCmd -m pip install virtualenv
        & $pythonCmd -m virtualenv venv
    }
}

# Activate virtual environment
Write-Status "Activating virtual environment..."
$activateScript = ".\venv\Scripts\Activate.ps1"
if (Test-Path $activateScript) {
    & $activateScript
    Write-Status "Virtual environment activated" "Success"
} else {
    Write-Status "Could not find activation script" "Error"
}

# Upgrade pip
Write-Status "Upgrading pip..."
python -m pip install --upgrade pip --quiet
if ($?) {
    Write-Status "pip upgraded" "Success"
}

# Install Python dependencies
Write-Status "Installing Python dependencies..."
if (Test-Path "requirements.txt") {
    python -m pip install -r requirements.txt
    if ($?) {
        Write-Status "Python dependencies installed" "Success"
    } else {
        Write-Status "Some dependencies failed. Installing core packages..." "Warning"
        python -m pip install flask flask-cors flask-sqlalchemy flask-jwt-extended flask-restx python-dotenv gunicorn
    }
} else {
    Write-Status "requirements.txt not found. Creating minimal requirements..." "Warning"
    @"
flask==2.3.3
flask-cors==6.0.1
flask-sqlalchemy==3.1.1
flask-jwt-extended==4.6.0
flask-restx==1.3.0
python-dotenv==1.0.0
gunicorn==21.2.0
"@ | Out-File -FilePath "requirements.txt" -Encoding UTF8
    python -m pip install -r requirements.txt
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "   Setting up Frontend" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Install frontend dependencies
if (Test-Path "frontend") {
    Write-Status "Installing frontend dependencies..."
    Set-Location frontend
    
    npm install
    if ($?) {
        Write-Status "Frontend dependencies installed" "Success"
    } else {
        Write-Status "Some dependencies failed. Trying with --force..." "Warning"
        npm install --force
    }
    
    Set-Location ..
} else {
    Write-Status "frontend directory not found" "Error"
    Write-Status "Creating basic frontend structure..." "Info"
    
    New-Item -ItemType Directory -Path frontend -Force | Out-Null
    Set-Location frontend
    
    npm init -y
    npm install react react-dom vite @vitejs/plugin-react
    npm install -D typescript @types/react @types/react-dom tailwindcss postcss autoprefixer
    
    Set-Location ..
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "   Database Setup" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# PostgreSQL setup
if (Test-Command "psql") {
    if ($SkipPrompts -or (Read-Host "Set up PostgreSQL database? (y/n)") -eq 'y') {
        Write-Status "Setting up PostgreSQL database..."
        
        $dbScript = @"
-- Create user if not exists
DO `$`$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'toluai_dev') THEN
      CREATE USER toluai_dev WITH PASSWORD 'toluai_dev_pass123';
   END IF;
END
`$`$;

-- Create database if not exists
SELECT 'CREATE DATABASE toluai_dev OWNER toluai_dev'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'toluai_dev')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE toluai_dev TO toluai_dev;
"@
        
        $dbScript | Out-File -FilePath "temp_db_setup.sql" -Encoding UTF8
        psql -U postgres -f temp_db_setup.sql
        Remove-Item "temp_db_setup.sql"
        
        Write-Status "Database setup complete" "Success"
        Write-Host "Database: toluai_dev"
        Write-Host "User: toluai_dev"
        Write-Host "Password: toluai_dev_pass123"
    }
} else {
    Write-Status "PostgreSQL not available - will use SQLite for development" "Info"
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "   Environment Configuration" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Create .env file
if (-not (Test-Path ".env")) {
    Write-Status "Creating .env file..."
    
    @"
# ToluAI Environment Variables
ENVIRONMENT=development
FLASK_ENV=development
FLASK_DEBUG=1

# Database
DATABASE_URL=sqlite:///toluai.db

# Security
SECRET_KEY=dev-secret-key-change-in-production
JWT_SECRET_KEY=jwt-secret-key-change-in-production

# API Configuration
API_VERSION=v1
CORS_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:5175

# Server Configuration
PORT=5001
HOST=0.0.0.0
"@ | Out-File -FilePath ".env" -Encoding UTF8
    
    Write-Status ".env file created" "Success"
} else {
    Write-Status ".env file already exists" "Warning"
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "   Creating Helper Scripts" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Create start scripts
Write-Status "Creating start scripts..."

# start_backend.ps1
@"
# Start ToluAI Backend
Write-Host "Starting ToluAI Backend..." -ForegroundColor Green
.\venv\Scripts\Activate.ps1
python main.py
"@ | Out-File -FilePath "start_backend.ps1" -Encoding UTF8

# start_frontend.ps1
@"
# Start ToluAI Frontend
Write-Host "Starting ToluAI Frontend..." -ForegroundColor Green
Set-Location frontend
npm run dev
"@ | Out-File -FilePath "start_frontend.ps1" -Encoding UTF8

# start_all.ps1
@"
# Start ToluAI Application
Write-Host "Starting ToluAI Application..." -ForegroundColor Cyan

# Start backend in new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", ".\start_backend.ps1"

# Wait a moment for backend to start
Start-Sleep -Seconds 5

# Start frontend in new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", ".\start_frontend.ps1"

Write-Host ""
Write-Host "ToluAI is starting..." -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host "Backend: http://localhost:5001" -ForegroundColor Yellow
Write-Host "API Docs: http://localhost:5001/api/docs" -ForegroundColor Yellow
"@ | Out-File -FilePath "start_all.ps1" -Encoding UTF8

Write-Status "Helper scripts created" "Success"

Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "   Setup Complete!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""

Write-Host "All dependencies have been installed!" -ForegroundColor Green
Write-Host ""
Write-Host "Quick Start Commands:" -ForegroundColor Yellow
Write-Host "   .\start_all.ps1      - Start everything" -ForegroundColor White
Write-Host "   .\start_backend.ps1  - Start backend only" -ForegroundColor White
Write-Host "   .\start_frontend.ps1 - Start frontend only" -ForegroundColor White
Write-Host ""
Write-Host "Or manually:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Start the backend:" -ForegroundColor Cyan
Write-Host "   .\venv\Scripts\Activate.ps1" -ForegroundColor White
Write-Host "   python main.py" -ForegroundColor White
Write-Host ""
Write-Host "2. Start the frontend (new terminal):" -ForegroundColor Cyan
Write-Host "   cd frontend" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "3. Access the application:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "   Backend: http://localhost:5001" -ForegroundColor White
Write-Host "   API Docs: http://localhost:5001/api/docs" -ForegroundColor White
Write-Host ""
Write-Host "Demo Credentials:" -ForegroundColor Yellow
Write-Host "   admin@toluai.com / Admin123!" -ForegroundColor White
Write-Host "   analyst@toluai.com / Analyst123!" -ForegroundColor White
Write-Host "   viewer@toluai.com / Viewer123!" -ForegroundColor White
Write-Host ""
Write-Host "For more information, see README.md" -ForegroundColor Cyan
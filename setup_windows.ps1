# ToluAI Windows Setup Script (PowerShell)
# Run this script in PowerShell as Administrator: .\setup_windows.ps1

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "   ToluAI Windows Setup Script" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

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

# Check Python installation
Write-Status "Checking Python installation..."
if (Test-Command python) {
    $pythonVersion = python --version 2>&1
    Write-Status "Python found: $pythonVersion" "Success"
} elseif (Test-Command python3) {
    $pythonVersion = python3 --version 2>&1
    Write-Status "Python3 found: $pythonVersion" "Success"
    # Create alias for python
    Set-Alias -Name python -Value python3
} else {
    Write-Status "Python not found. Please install Python 3.9+ from https://www.python.org/downloads/" "Error"
    Write-Host "After installing Python, run this script again."
    exit 1
}

# Check Node.js installation
Write-Status "Checking Node.js installation..."
if (Test-Command node) {
    $nodeVersion = node --version
    Write-Status "Node.js found: $nodeVersion" "Success"
} else {
    Write-Status "Node.js not found. Please install Node.js from https://nodejs.org/" "Error"
    Write-Host "After installing Node.js, run this script again."
    exit 1
}

# Check npm installation
if (Test-Command npm) {
    $npmVersion = npm --version
    Write-Status "npm found: $npmVersion" "Success"
} else {
    Write-Status "npm not found but Node.js is installed. This is unusual." "Warning"
}

# Check Git installation
Write-Status "Checking Git installation..."
if (Test-Command git) {
    $gitVersion = git --version
    Write-Status "Git found: $gitVersion" "Success"
} else {
    Write-Status "Git not found. Please install Git from https://git-scm.com/download/win" "Warning"
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
    $response = Read-Host "Do you want to recreate it? (y/n)"
    if ($response -eq 'y') {
        Remove-Item -Recurse -Force venv
        python -m venv venv
        Write-Status "Virtual environment recreated" "Success"
    }
} else {
    python -m venv venv
    Write-Status "Virtual environment created" "Success"
}

# Activate virtual environment
Write-Status "Activating virtual environment..."
$activateScript = ".\venv\Scripts\Activate.ps1"
if (Test-Path $activateScript) {
    & $activateScript
    Write-Status "Virtual environment activated" "Success"
} else {
    Write-Status "Could not find activation script. Trying alternate method..." "Warning"
    $activateScript = ".\venv\Scripts\activate"
    if (Test-Path $activateScript) {
        & $activateScript
    } else {
        Write-Status "Could not activate virtual environment" "Error"
    }
}

# Upgrade pip
Write-Status "Upgrading pip..."
python -m pip install --upgrade pip --quiet
Write-Status "pip upgraded" "Success"

# Install Python dependencies
Write-Status "Installing Python dependencies from requirements.txt..."
if (Test-Path "requirements.txt") {
    python -m pip install -r requirements.txt --quiet
    Write-Status "Python dependencies installed" "Success"
} else {
    Write-Status "requirements.txt not found" "Error"
    exit 1
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "   Setting up Frontend" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to frontend directory
Write-Status "Setting up frontend dependencies..."
if (Test-Path "frontend") {
    Set-Location frontend
    
    # Install npm dependencies
    Write-Status "Installing npm packages (this may take a few minutes)..."
    npm install
    
    if ($LASTEXITCODE -eq 0) {
        Write-Status "Frontend dependencies installed" "Success"
    } else {
        Write-Status "Error installing frontend dependencies" "Error"
    }
    
    # Return to root directory
    Set-Location ..
} else {
    Write-Status "frontend directory not found" "Error"
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "   Database Setup" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check PostgreSQL installation
Write-Status "Checking PostgreSQL installation..."
if (Test-Command psql) {
    $psqlVersion = psql --version
    Write-Status "PostgreSQL found: $psqlVersion" "Success"
    
    # Ask if user wants to set up database
    $setupDb = Read-Host "Do you want to set up the PostgreSQL database? (y/n)"
    if ($setupDb -eq 'y') {
        Write-Status "Setting up database..."
        
        # Database configuration
        $dbName = "toluai_dev"
        $dbUser = "toluai_dev"
        $dbPassword = "toluai_dev_pass123"
        
        # Create database and user
        $sqlScript = @"
-- Create user if not exists
DO `$`$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$dbUser') THEN
      CREATE USER $dbUser WITH PASSWORD '$dbPassword';
   END IF;
END
`$`$;

-- Create database if not exists
SELECT 'CREATE DATABASE $dbName OWNER $dbUser'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$dbName')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE $dbName TO $dbUser;
"@
        
        # Save to temp file and execute
        $sqlScript | Out-File -FilePath "temp_db_setup.sql" -Encoding UTF8
        psql -U postgres -f temp_db_setup.sql
        Remove-Item "temp_db_setup.sql"
        
        Write-Status "Database setup complete" "Success"
        Write-Host "Database: $dbName"
        Write-Host "User: $dbUser"
        Write-Host "Password: $dbPassword"
    }
} else {
    Write-Status "PostgreSQL not found" "Warning"
    Write-Host "For production use, install PostgreSQL from: https://www.postgresql.org/download/windows/"
    Write-Host "The application will use SQLite for development."
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "   Environment Configuration" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Create .env file if it doesn't exist
if (-not (Test-Path ".env")) {
    Write-Status "Creating .env file..."
    
    $envContent = @"
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
"@
    
    $envContent | Out-File -FilePath ".env" -Encoding UTF8
    Write-Status ".env file created" "Success"
} else {
    Write-Status ".env file already exists" "Warning"
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "   Setup Complete!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""

Write-Host "To start the application:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Start the backend server:" -ForegroundColor Cyan
Write-Host "   .\venv\Scripts\Activate.ps1" -ForegroundColor White
Write-Host "   python main.py" -ForegroundColor White
Write-Host ""
Write-Host "2. In a new terminal, start the frontend:" -ForegroundColor Cyan
Write-Host "   cd frontend" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "3. Access the application:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "   Backend API: http://localhost:5001" -ForegroundColor White
Write-Host "   API Docs: http://localhost:5001/api/docs" -ForegroundColor White
Write-Host ""
Write-Host "Demo Credentials:" -ForegroundColor Yellow
Write-Host "   admin@toluai.com / Admin123!" -ForegroundColor White
Write-Host "   analyst@toluai.com / Analyst123!" -ForegroundColor White
Write-Host "   viewer@toluai.com / Viewer123!" -ForegroundColor White
Write-Host ""
Write-Host "For more information, see README.md" -ForegroundColor Cyan
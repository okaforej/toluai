#!/usr/bin/env python3
"""
Cross-platform setup script for ToluAI
Works on Windows, macOS, and Linux
"""

import os
import sys
import subprocess
import platform
import shutil
from pathlib import Path

# ANSI color codes for cross-platform colored output
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    END = '\033[0m'
    BOLD = '\033[1m'

def print_header(message):
    """Print a header message"""
    print(f"\n{Colors.CYAN}{'='*50}{Colors.END}")
    print(f"{Colors.CYAN}{message}{Colors.END}")
    print(f"{Colors.CYAN}{'='*50}{Colors.END}\n")

def print_success(message):
    """Print a success message"""
    print(f"{Colors.GREEN}✓ {message}{Colors.END}")

def print_error(message):
    """Print an error message"""
    print(f"{Colors.FAIL}✗ {message}{Colors.END}")

def print_warning(message):
    """Print a warning message"""
    print(f"{Colors.WARNING}⚠ {message}{Colors.END}")

def print_info(message):
    """Print an info message"""
    print(f"{Colors.BLUE}→ {message}{Colors.END}")

def check_command(command):
    """Check if a command is available"""
    return shutil.which(command) is not None

def run_command(command, shell=True, check=True, capture_output=False):
    """Run a command cross-platform"""
    try:
        if capture_output:
            result = subprocess.run(command, shell=shell, check=check, capture_output=True, text=True)
            return result.stdout.strip()
        else:
            return subprocess.run(command, shell=shell, check=check)
    except subprocess.CalledProcessError as e:
        print_error(f"Command failed: {command}")
        return None

def get_python_command():
    """Get the correct Python command for the platform"""
    if check_command("python3"):
        return "python3"
    elif check_command("python"):
        # Check if it's Python 3
        version = run_command("python --version", capture_output=True)
        if version and "Python 3" in version:
            return "python"
    else:
        print_error("Python 3 is not installed")
        print("Please install Python 3.9+ from https://www.python.org/downloads/")
        sys.exit(1)
    return None

def setup_python_environment():
    """Set up Python virtual environment and dependencies"""
    print_header("Setting up Python Environment")
    
    python_cmd = get_python_command()
    if not python_cmd:
        return False
    
    # Check Python version
    version = run_command(f"{python_cmd} --version", capture_output=True)
    print_success(f"Python found: {version}")
    
    # Create virtual environment
    venv_path = Path("venv")
    if venv_path.exists():
        print_warning("Virtual environment already exists")
        response = input("Do you want to recreate it? (y/n): ").lower()
        if response == 'y':
            print_info("Removing existing virtual environment...")
            shutil.rmtree(venv_path)
            run_command(f"{python_cmd} -m venv venv")
            print_success("Virtual environment recreated")
    else:
        print_info("Creating virtual environment...")
        run_command(f"{python_cmd} -m venv venv")
        print_success("Virtual environment created")
    
    # Determine pip command based on platform
    if platform.system() == "Windows":
        pip_cmd = os.path.join("venv", "Scripts", "pip")
        activate_cmd = os.path.join("venv", "Scripts", "activate")
    else:
        pip_cmd = os.path.join("venv", "bin", "pip")
        activate_cmd = f"source {os.path.join('venv', 'bin', 'activate')}"
    
    # Upgrade pip
    print_info("Upgrading pip...")
    run_command(f"{pip_cmd} install --upgrade pip", capture_output=True)
    print_success("pip upgraded")
    
    # Install dependencies
    if Path("requirements.txt").exists():
        print_info("Installing Python dependencies (this may take a few minutes)...")
        result = run_command(f"{pip_cmd} install -r requirements.txt", check=False)
        if result and result.returncode == 0:
            print_success("Python dependencies installed")
        else:
            print_warning("Some dependencies may have failed to install")
    else:
        print_error("requirements.txt not found")
        return False
    
    print_info(f"To activate the virtual environment, run: {activate_cmd}")
    return True

def setup_nodejs():
    """Set up Node.js and frontend dependencies"""
    print_header("Setting up Frontend")
    
    # Check Node.js
    if not check_command("node"):
        print_error("Node.js is not installed")
        print("Please install Node.js from https://nodejs.org/")
        return False
    
    node_version = run_command("node --version", capture_output=True)
    print_success(f"Node.js found: {node_version}")
    
    # Check npm
    if not check_command("npm"):
        print_error("npm is not installed")
        return False
    
    npm_version = run_command("npm --version", capture_output=True)
    print_success(f"npm found: {npm_version}")
    
    # Install frontend dependencies
    frontend_path = Path("frontend")
    if frontend_path.exists():
        print_info("Installing frontend dependencies (this may take a few minutes)...")
        os.chdir(frontend_path)
        result = run_command("npm install", check=False)
        os.chdir("..")
        
        if result and result.returncode == 0:
            print_success("Frontend dependencies installed")
        else:
            print_warning("Some frontend dependencies may have failed to install")
    else:
        print_error("frontend directory not found")
        return False
    
    return True

def setup_database():
    """Set up database (PostgreSQL or SQLite)"""
    print_header("Database Setup")
    
    # Check for PostgreSQL
    if check_command("psql"):
        psql_version = run_command("psql --version", capture_output=True)
        print_success(f"PostgreSQL found: {psql_version}")
        
        response = input("Do you want to set up PostgreSQL database? (y/n): ").lower()
        if response == 'y':
            print_info("Setting up PostgreSQL database...")
            
            db_setup = """
-- Create user if not exists
DO $$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'toluai_dev') THEN
      CREATE USER toluai_dev WITH PASSWORD 'toluai_dev_pass123';
   END IF;
END
$$;

-- Create database if not exists
SELECT 'CREATE DATABASE toluai_dev OWNER toluai_dev'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'toluai_dev')\\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE toluai_dev TO toluai_dev;
"""
            
            # Write SQL to temp file
            with open("temp_db_setup.sql", "w") as f:
                f.write(db_setup)
            
            # Execute SQL
            result = run_command("psql -U postgres -f temp_db_setup.sql", check=False)
            os.remove("temp_db_setup.sql")
            
            if result and result.returncode == 0:
                print_success("PostgreSQL database created")
                print_info("Database: toluai_dev")
                print_info("User: toluai_dev")
                print_info("Password: toluai_dev_pass123")
            else:
                print_warning("Could not create PostgreSQL database, will use SQLite")
    else:
        print_warning("PostgreSQL not found")
        print_info("The application will use SQLite for development")
        print_info("For production, install PostgreSQL from https://www.postgresql.org/download/")

def create_env_file():
    """Create .env file if it doesn't exist"""
    print_header("Environment Configuration")
    
    env_path = Path(".env")
    if not env_path.exists():
        print_info("Creating .env file...")
        
        env_content = """# ToluAI Environment Variables
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
"""
        
        with open(env_path, "w") as f:
            f.write(env_content)
        
        print_success(".env file created")
    else:
        print_warning(".env file already exists")

def main():
    """Main setup function"""
    print_header("ToluAI Setup Script")
    print(f"Platform: {platform.system()}")
    print(f"Python: {sys.version}")
    
    # Check Git
    if check_command("git"):
        git_version = run_command("git --version", capture_output=True)
        print_success(f"Git found: {git_version}")
    else:
        print_warning("Git not found. Version control will not be available")
    
    # Run setup steps
    success = True
    
    if not setup_python_environment():
        success = False
    
    if not setup_nodejs():
        success = False
    
    setup_database()
    create_env_file()
    
    # Print completion message
    print_header("Setup Complete!" if success else "Setup Completed with Warnings")
    
    print("\n" + Colors.BOLD + "To start the application:" + Colors.END)
    print("\n1. Start the backend server:")
    
    if platform.system() == "Windows":
        print("   " + Colors.CYAN + ".\\venv\\Scripts\\activate" + Colors.END)
    else:
        print("   " + Colors.CYAN + "source venv/bin/activate" + Colors.END)
    
    print("   " + Colors.CYAN + f"{get_python_command()} main.py" + Colors.END)
    
    print("\n2. In a new terminal, start the frontend:")
    print("   " + Colors.CYAN + "cd frontend" + Colors.END)
    print("   " + Colors.CYAN + "npm run dev" + Colors.END)
    
    print("\n3. Access the application:")
    print("   Frontend: " + Colors.GREEN + "http://localhost:5173" + Colors.END)
    print("   Backend API: " + Colors.GREEN + "http://localhost:5001" + Colors.END)
    print("   API Docs: " + Colors.GREEN + "http://localhost:5001/api/docs" + Colors.END)
    
    print("\n" + Colors.BOLD + "Demo Credentials:" + Colors.END)
    print("   admin@toluai.com / Admin123!")
    print("   analyst@toluai.com / Analyst123!")
    print("   viewer@toluai.com / Viewer123!")
    
    print("\nFor more information, see README.md")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nSetup interrupted by user")
        sys.exit(1)
    except Exception as e:
        print_error(f"An error occurred: {e}")
        sys.exit(1)
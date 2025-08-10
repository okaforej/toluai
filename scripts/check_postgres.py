#!/usr/bin/env python3
"""
PostgreSQL Health Check and Auto-Setup Script
This script checks if PostgreSQL is available and properly configured.
If not, it attempts to set it up automatically.
"""

import os
import sys
import subprocess
import time
import psycopg2
from psycopg2 import OperationalError
from pathlib import Path
from typing import Optional, Dict, Any
import json

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))


class PostgreSQLSetup:
    """Handles PostgreSQL setup and health checks."""
    
    def __init__(self):
        self.project_root = project_root
        self.env_file = self.project_root / '.env'
        self.env_postgres = self.project_root / '.env.postgres'
        self.docker_compose_file = self.project_root / 'docker-compose.dev.yml'
        self.connection_params = self._load_connection_params()
        
    def _load_connection_params(self) -> Dict[str, Any]:
        """Load database connection parameters from environment."""
        # Default development parameters
        params = {
            'host': os.getenv('POSTGRES_HOST', 'localhost'),
            'port': int(os.getenv('POSTGRES_PORT', 5432)),
            'database': os.getenv('POSTGRES_DB', 'toluai_dev'),
            'user': os.getenv('POSTGRES_USER', 'toluai_dev'),
            'password': os.getenv('POSTGRES_PASSWORD', 'toluai_dev_pass123')
        }
        
        # Try to parse DATABASE_URI if provided
        db_uri = os.getenv('DATABASE_URI')
        if db_uri and db_uri.startswith('postgresql://'):
            try:
                # Parse PostgreSQL URI
                # Format: postgresql://user:password@host:port/database
                uri_parts = db_uri.replace('postgresql://', '').split('@')
                if len(uri_parts) == 2:
                    user_pass = uri_parts[0].split(':')
                    host_port_db = uri_parts[1].split('/')
                    host_port = host_port_db[0].split(':')
                    
                    params['user'] = user_pass[0]
                    params['password'] = user_pass[1] if len(user_pass) > 1 else ''
                    params['host'] = host_port[0]
                    params['port'] = int(host_port[1]) if len(host_port) > 1 else 5432
                    params['database'] = host_port_db[1] if len(host_port_db) > 1 else 'toluai_dev'
            except Exception as e:
                print(f"Warning: Could not parse DATABASE_URI: {e}")
        
        return params
    
    def check_docker_installed(self) -> bool:
        """Check if Docker is installed and running."""
        try:
            result = subprocess.run(
                ['docker', 'version'],
                capture_output=True,
                text=True,
                check=False
            )
            return result.returncode == 0
        except FileNotFoundError:
            return False
    
    def check_docker_compose_installed(self) -> bool:
        """Check if Docker Compose is installed."""
        # Try docker-compose command
        try:
            result = subprocess.run(
                ['docker-compose', 'version'],
                capture_output=True,
                text=True,
                check=False
            )
            if result.returncode == 0:
                return True
        except FileNotFoundError:
            pass
        
        # Try docker compose command (Docker Compose V2)
        try:
            result = subprocess.run(
                ['docker', 'compose', 'version'],
                capture_output=True,
                text=True,
                check=False
            )
            return result.returncode == 0
        except:
            return False
    
    def is_postgres_container_running(self) -> bool:
        """Check if PostgreSQL Docker container is running."""
        if not self.check_docker_installed():
            return False
        
        try:
            result = subprocess.run(
                ['docker', 'ps', '--filter', 'name=toluai-postgres', '--format', '{{.Names}}'],
                capture_output=True,
                text=True,
                check=False
            )
            return 'toluai-postgres' in result.stdout
        except:
            return False
    
    def test_connection(self, max_retries: int = 5) -> bool:
        """Test PostgreSQL connection with retries."""
        for attempt in range(max_retries):
            try:
                conn = psycopg2.connect(**self.connection_params)
                conn.close()
                return True
            except OperationalError as e:
                if attempt < max_retries - 1:
                    print(f"Connection attempt {attempt + 1} failed, retrying...")
                    time.sleep(2)
                else:
                    print(f"Failed to connect after {max_retries} attempts: {e}")
                    return False
        return False
    
    def start_postgres_docker(self) -> bool:
        """Start PostgreSQL using Docker Compose."""
        if not self.check_docker_installed():
            print("❌ Docker is not installed. Please install Docker first.")
            print("   Visit: https://docs.docker.com/get-docker/")
            return False
        
        if not self.check_docker_compose_installed():
            print("❌ Docker Compose is not installed.")
            print("   Visit: https://docs.docker.com/compose/install/")
            return False
        
        print("🚀 Starting PostgreSQL with Docker...")
        
        # Determine docker-compose command
        docker_compose_cmd = ['docker-compose']
        test_result = subprocess.run(
            ['docker-compose', 'version'],
            capture_output=True,
            check=False
        )
        if test_result.returncode != 0:
            docker_compose_cmd = ['docker', 'compose']
        
        try:
            # Start PostgreSQL container
            subprocess.run(
                docker_compose_cmd + ['-f', str(self.docker_compose_file), 'up', '-d', 'postgres', 'redis'],
                cwd=self.project_root,
                check=True
            )
            
            print("⏳ Waiting for PostgreSQL to be ready...")
            time.sleep(5)  # Give PostgreSQL time to start
            
            return self.test_connection(max_retries=15)
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to start PostgreSQL container: {e}")
            return False
    
    def setup_env_file(self) -> bool:
        """Setup .env file if it doesn't exist."""
        if not self.env_file.exists() and self.env_postgres.exists():
            print("📝 Creating .env file from template...")
            try:
                import shutil
                shutil.copy(self.env_postgres, self.env_file)
                print("✅ .env file created. Please review and update if needed.")
                return True
            except Exception as e:
                print(f"❌ Failed to create .env file: {e}")
                return False
        return True
    
    def initialize_database(self) -> bool:
        """Initialize database schema if needed."""
        try:
            conn = psycopg2.connect(**self.connection_params)
            cursor = conn.cursor()
            
            # Check if tables exist
            cursor.execute("""
                SELECT COUNT(*) 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name IN ('users', 'clients', 'insurance_applications')
            """)
            
            table_count = cursor.fetchone()[0]
            
            if table_count == 0:
                print("📦 Initializing database schema...")
                
                # Run initialization scripts
                init_scripts = [
                    self.project_root / 'scripts' / 'init_extensions.sql',
                    self.project_root / 'scripts' / 'init_db.sql'
                ]
                
                for script_path in init_scripts:
                    if script_path.exists():
                        with open(script_path, 'r') as f:
                            sql_script = f.read()
                        
                        # Execute script
                        cursor.execute(sql_script)
                        conn.commit()
                        print(f"✅ Executed {script_path.name}")
                
                print("✅ Database schema initialized successfully!")
            else:
                print("✅ Database schema already exists.")
            
            cursor.close()
            conn.close()
            return True
            
        except Exception as e:
            print(f"❌ Failed to initialize database: {e}")
            return False
    
    def run_health_check(self) -> Dict[str, Any]:
        """Run comprehensive health check."""
        results = {
            'docker_installed': self.check_docker_installed(),
            'docker_compose_installed': self.check_docker_compose_installed(),
            'postgres_container_running': self.is_postgres_container_running(),
            'postgres_connection': False,
            'database_initialized': False,
            'env_file_exists': self.env_file.exists()
        }
        
        # Test PostgreSQL connection
        if self.test_connection():
            results['postgres_connection'] = True
            
            # Check if database is initialized
            try:
                conn = psycopg2.connect(**self.connection_params)
                cursor = conn.cursor()
                cursor.execute("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'")
                table_count = cursor.fetchone()[0]
                results['database_initialized'] = table_count > 0
                cursor.close()
                conn.close()
            except:
                pass
        
        return results
    
    def auto_setup(self) -> bool:
        """Automatically setup PostgreSQL if not configured."""
        print("🔍 Checking PostgreSQL setup...")
        
        # Setup .env file
        if not self.setup_env_file():
            return False
        
        # Reload connection params after env setup
        self.connection_params = self._load_connection_params()
        
        # Check if PostgreSQL is accessible
        if self.test_connection():
            print("✅ PostgreSQL is already running and accessible!")
        else:
            print("⚠️  PostgreSQL is not accessible. Attempting to start...")
            
            # Try to start with Docker
            if not self.start_postgres_docker():
                print("\n❌ Failed to start PostgreSQL automatically.")
                print("\nPlease run one of the following:")
                print("  1. ./scripts/setup_postgres.sh docker  (recommended)")
                print("  2. ./scripts/setup_postgres.sh local   (for local PostgreSQL)")
                print("  3. Manually start PostgreSQL and update .env file")
                return False
        
        # Initialize database if needed
        if not self.initialize_database():
            print("⚠️  Database initialization failed, but PostgreSQL is running.")
            print("   You may need to run migrations manually.")
        
        print("\n✅ PostgreSQL setup completed successfully!")
        print(f"\n📊 Connection Details:")
        print(f"   Host: {self.connection_params['host']}")
        print(f"   Port: {self.connection_params['port']}")
        print(f"   Database: {self.connection_params['database']}")
        print(f"   User: {self.connection_params['user']}")
        
        return True


def main():
    """Main entry point."""
    setup = PostgreSQLSetup()
    
    if len(sys.argv) > 1 and sys.argv[1] == 'health':
        # Run health check only
        results = setup.run_health_check()
        print("\n🏥 PostgreSQL Health Check Results:")
        print("=" * 40)
        for key, value in results.items():
            status = "✅" if value else "❌"
            print(f"{status} {key.replace('_', ' ').title()}: {value}")
        
        if all(results.values()):
            print("\n✅ All checks passed!")
            sys.exit(0)
        else:
            print("\n⚠️  Some checks failed. Run without arguments to auto-setup.")
            sys.exit(1)
    else:
        # Run auto-setup
        if setup.auto_setup():
            sys.exit(0)
        else:
            sys.exit(1)


if __name__ == "__main__":
    main()
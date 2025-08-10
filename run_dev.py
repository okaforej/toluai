#!/usr/bin/env python3
"""
Development server script with hot reload
"""

import os
import sys
from backend.app import create_app
from werkzeug.serving import run_simple

def run_dev_server():
    """Run development server with hot reload"""
    
    # Set environment to development
    os.environ['FLASK_ENV'] = 'development'
    os.environ['FLASK_DEBUG'] = '1'
    
    # Create app
    app = create_app('development')
    
    print("🚀 Starting ToluAI Development Server...")
    print("📍 Backend URL: http://localhost:5175")
    print("📍 API Documentation: http://localhost:5175/api/v1/")
    print("🔄 Hot reload enabled - changes will auto-restart server")
    print("📝 Debug mode enabled")
    print("🛑 Press Ctrl+C to stop")
    print("-" * 60)
    
    # Run with werkzeug development server (supports hot reload)
    run_simple(
        hostname='0.0.0.0',
        port=5175,
        application=app,
        use_reloader=True,  # Enable hot reload
        use_debugger=True,  # Enable debugger
        use_evalex=True,    # Enable interactive debugger
        extra_files=None,   # Watch additional files
        reloader_interval=1,  # Check for changes every second
        reloader_type='stat',  # Use stat reloader (more reliable)
        threaded=True       # Enable threading
    )

if __name__ == '__main__':
    run_dev_server()
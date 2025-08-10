#!/usr/bin/env python3
"""Script to create IRPA database tables"""

import os
import sys

# Add the app directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from backend.app import create_app, db
from backend.models.irpa import *
from backend.models.external_risk import *
from backend.models.access_control import *

def create_tables():
    app = create_app()
    with app.app_context():
        print("Creating IRPA database tables...")
        db.create_all()
        print("✅ IRPA tables created successfully!")

if __name__ == '__main__':
    create_tables()
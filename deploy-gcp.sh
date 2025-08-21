#!/bin/bash

# GCP Deployment Script for ToluAI
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="toluai-prod-1755383107"
REGION="us-central1"
DB_INSTANCE_NAME="toluai-db"
DB_PASSWORD=$(openssl rand -hex 16)
JWT_SECRET=$(openssl rand -hex 32)

echo -e "${GREEN}Starting ToluAI GCP Deployment${NC}"
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"

# Step 1: Set up gcloud
echo -e "\n${YELLOW}Step 1: Configuring gcloud${NC}"
export PATH="/usr/local/share/google-cloud-sdk/bin:$PATH"
gcloud config set project $PROJECT_ID

# Step 2: Enable required APIs
echo -e "\n${YELLOW}Step 2: Enabling required GCP APIs${NC}"
gcloud services enable \
    appengine.googleapis.com \
    sqladmin.googleapis.com \
    cloudbuild.googleapis.com \
    cloudresourcemanager.googleapis.com \
    compute.googleapis.com \
    servicenetworking.googleapis.com \
    vpcaccess.googleapis.com \
    redis.googleapis.com

# Step 3: Create App Engine app if not exists
echo -e "\n${YELLOW}Step 3: Setting up App Engine${NC}"
gcloud app describe >/dev/null 2>&1 || gcloud app create --region=$REGION

# Step 4: Create Cloud SQL instance
echo -e "\n${YELLOW}Step 4: Creating Cloud SQL PostgreSQL instance${NC}"
if ! gcloud sql instances describe $DB_INSTANCE_NAME >/dev/null 2>&1; then
    gcloud sql instances create $DB_INSTANCE_NAME \
        --database-version=POSTGRES_15 \
        --tier=db-f1-micro \
        --region=$REGION \
        --network=default \
        --no-assign-ip
    
    # Set root password
    gcloud sql users set-password postgres \
        --instance=$DB_INSTANCE_NAME \
        --password=$DB_PASSWORD
    
    # Create database
    gcloud sql databases create toluai_prod \
        --instance=$DB_INSTANCE_NAME
    
    # Create application user
    gcloud sql users create toluai_prod \
        --instance=$DB_INSTANCE_NAME \
        --password=$DB_PASSWORD
    
    echo -e "${GREEN}Database created successfully${NC}"
    echo "Database password: $DB_PASSWORD"
else
    echo "Cloud SQL instance already exists"
fi

# Step 5: Get Cloud SQL connection name
CLOUD_SQL_CONNECTION_NAME=$(gcloud sql instances describe $DB_INSTANCE_NAME --format="value(connectionName)")
echo "Cloud SQL Connection Name: $CLOUD_SQL_CONNECTION_NAME"

# Step 6: Create VPC connector for private IP access
echo -e "\n${YELLOW}Step 6: Creating VPC connector${NC}"
if ! gcloud compute networks vpc-access connectors describe toluai-connector --region=$REGION >/dev/null 2>&1; then
    gcloud compute networks vpc-access connectors create toluai-connector \
        --region=$REGION \
        --subnet-range=10.8.0.0/28 \
        --network=default
else
    echo "VPC connector already exists"
fi

# Step 7: Build frontend
echo -e "\n${YELLOW}Step 7: Building frontend${NC}"
cd frontend
npm install
VITE_API_URL=/api npm run build
cd ..

# Step 8: Create app.yaml with actual values
echo -e "\n${YELLOW}Step 8: Creating production app.yaml${NC}"
cat > app.yaml.production <<EOF
runtime: python39
env: standard
service: default

instance_class: F2

automatic_scaling:
  target_cpu_utilization: 0.65
  min_instances: 1
  max_instances: 10
  max_concurrent_requests: 80

handlers:
- url: /api/.*
  script: auto
  secure: always

- url: /assets
  static_dir: frontend/dist/assets
  secure: always
  expiration: "30d"

- url: /.*
  static_files: frontend/dist/index.html
  upload: frontend/dist/index.html
  secure: always

env_variables:
  ENVIRONMENT: "production"
  FLASK_ENV: "production"
  DATABASE_URL: "postgresql://toluai_prod:${DB_PASSWORD}@/toluai_prod?host=/cloudsql/${CLOUD_SQL_CONNECTION_NAME}"
  JWT_SECRET_KEY: "${JWT_SECRET}"
  SECRET_KEY: "${JWT_SECRET}"

vpc_access_connector:
  name: projects/${PROJECT_ID}/locations/${REGION}/connectors/toluai-connector

beta_settings:
  cloud_sql_instances: "${CLOUD_SQL_CONNECTION_NAME}"

entrypoint: gunicorn -b :\$PORT main:app --workers 2 --threads 8 --timeout 60
EOF

# Step 9: Deploy to App Engine
echo -e "\n${YELLOW}Step 9: Deploying to App Engine${NC}"
gcloud app deploy app.yaml.production --quiet --promote --stop-previous-version

# Step 10: Set up database schema
echo -e "\n${YELLOW}Step 10: Running database migrations${NC}"
# This would typically be done via Cloud Build or a one-time job
# For now, we'll note it needs to be done

echo -e "\n${GREEN}Deployment Complete!${NC}"
echo -e "Your application is available at: https://${PROJECT_ID}.appspot.com"
echo -e "\n${YELLOW}Important: Save these credentials:${NC}"
echo "Database Password: $DB_PASSWORD"
echo "JWT Secret: $JWT_SECRET"
echo -e "\n${YELLOW}Next steps:${NC}"
echo "1. Run database migrations"
echo "2. Set up monitoring and alerts"
echo "3. Configure custom domain (if needed)"
echo "4. Set up CI/CD pipeline"
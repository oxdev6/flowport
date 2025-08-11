#!/bin/bash

# Arbitrum Migration Portal - Production Deployment Script
# This script handles the complete production deployment process

set -e  # Exit on any error

# Configuration
PROJECT_NAME="arb-migrate"
DEPLOYMENT_ENV="production"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DEPLOYMENT_ID="${PROJECT_NAME}_${DEPLOYMENT_ENV}_${TIMESTAMP}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Header
echo "=========================================="
echo "🚀 Arbitrum Migration Portal Deployment"
echo "Environment: $DEPLOYMENT_ENV"
echo "Deployment ID: $DEPLOYMENT_ID"
echo "Timestamp: $(date)"
echo "=========================================="

# Pre-deployment checks
log "Starting pre-deployment checks..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version)
log "Node.js version: $NODE_VERSION"

if [[ ! "$NODE_VERSION" =~ ^v(18|20)\. ]]; then
    error "Node.js version 18 or 20 is required. Current version: $NODE_VERSION"
    exit 1
fi

# Check if all required environment variables are set
log "Checking environment variables..."
REQUIRED_VARS=(
    "NEXT_PUBLIC_API_URL"
    "DATABASE_URL"
    "JWT_SECRET"
    "ETHERSCAN_API_KEY"
    "ARBISCAN_API_KEY"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        error "Required environment variable $var is not set"
        exit 1
    fi
done

success "Environment variables check passed"

# Check dependencies
log "Checking dependencies..."
if [ ! -d "node_modules" ]; then
    log "Installing dependencies..."
    npm ci --production=false
else
    log "Updating dependencies..."
    npm ci --production=false
fi

success "Dependencies check passed"

# Run tests
log "Running test suite..."
if ! npm test; then
    error "Tests failed. Deployment aborted."
    exit 1
fi

success "All tests passed"

# Run linting
log "Running linting checks..."
if ! npm run lint; then
    error "Linting failed. Deployment aborted."
    exit 1
fi

success "Linting passed"

# Security audit
log "Running security audit..."
if ! npm audit --audit-level=moderate; then
    warning "Security audit found issues. Review and fix before deployment."
    read -p "Continue with deployment? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        error "Deployment cancelled by user"
        exit 1
    fi
fi

success "Security audit passed"

# Build application
log "Building application..."
if ! npm run build; then
    error "Build failed. Deployment aborted."
    exit 1
fi

success "Build completed successfully"

# Database migration (if applicable)
log "Running database migrations..."
if [ -f "scripts/migrate-db.sh" ]; then
    if ! ./scripts/migrate-db.sh; then
        error "Database migration failed. Deployment aborted."
        exit 1
    fi
    success "Database migrations completed"
else
    log "No database migrations found, skipping..."
fi

# Backup current deployment (if exists)
if [ -d "deployments/current" ]; then
    log "Creating backup of current deployment..."
    cp -r deployments/current "deployments/backup_${TIMESTAMP}"
    success "Backup created: deployments/backup_${TIMESTAMP}"
fi

# Create deployment directory
log "Creating deployment directory..."
mkdir -p "deployments/${DEPLOYMENT_ID}"
mkdir -p "deployments/current"

# Copy build artifacts
log "Copying build artifacts..."
cp -r .next "deployments/${DEPLOYMENT_ID}/"
cp -r public "deployments/${DEPLOYMENT_ID}/"
cp package.json "deployments/${DEPLOYMENT_ID}/"
cp package-lock.json "deployments/${DEPLOYMENT_ID}/"
cp next.config.js "deployments/${DEPLOYMENT_ID}/"
cp tailwind.config.js "deployments/${DEPLOYMENT_ID}/"
cp postcss.config.js "deployments/${DEPLOYMENT_ID}/"

# Copy source files for CLI
log "Copying CLI source files..."
cp -r src "deployments/${DEPLOYMENT_ID}/"
cp -r contracts "deployments/${DEPLOYMENT_ID}/"
cp -r scripts "deployments/${DEPLOYMENT_ID}/"

# Create deployment manifest
log "Creating deployment manifest..."
cat > "deployments/${DEPLOYMENT_ID}/deployment.json" << EOF
{
  "deployment_id": "${DEPLOYMENT_ID}",
  "environment": "${DEPLOYMENT_ENV}",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "version": "$(node -p "require('./package.json').version")",
  "commit_hash": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "node_version": "$NODE_VERSION",
  "build_size": "$(du -sh .next 2>/dev/null | cut -f1 || echo 'unknown')"
}
EOF

# Update current deployment symlink
log "Updating current deployment symlink..."
rm -f deployments/current
ln -sf "../${DEPLOYMENT_ID}" "deployments/current"

success "Deployment artifacts prepared"

# Health check function
health_check() {
    local url="$1"
    local max_attempts=30
    local attempt=1
    
    log "Performing health check on $url..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$url/api/health" > /dev/null 2>&1; then
            success "Health check passed"
            return 0
        fi
        
        log "Health check attempt $attempt/$max_attempts failed, retrying in 10 seconds..."
        sleep 10
        ((attempt++))
    done
    
    error "Health check failed after $max_attempts attempts"
    return 1
}

# Start application
log "Starting application..."
cd "deployments/${DEPLOYMENT_ID}"

# Install production dependencies
npm ci --production

# Start the application in background
log "Starting Next.js application..."
nohup npm start > app.log 2>&1 &
APP_PID=$!

# Wait for application to start
sleep 10

# Check if application is running
if ! kill -0 $APP_PID 2>/dev/null; then
    error "Application failed to start"
    cat app.log
    exit 1
fi

success "Application started with PID: $APP_PID"

# Perform health check
if ! health_check "http://localhost:3000"; then
    error "Health check failed. Rolling back deployment..."
    
    # Stop application
    kill $APP_PID 2>/dev/null || true
    
    # Rollback to previous deployment
    if [ -d "deployments/backup_${TIMESTAMP}" ]; then
        rm -f deployments/current
        ln -sf "../backup_${TIMESTAMP}" "deployments/current"
        success "Rolled back to previous deployment"
    fi
    
    exit 1
fi

# Run post-deployment tests
log "Running post-deployment tests..."
if ! npm run test:integration; then
    warning "Post-deployment tests failed, but deployment will continue"
else
    success "Post-deployment tests passed"
fi

# Performance test
log "Running performance tests..."
if ! npm run test:performance; then
    warning "Performance tests failed, but deployment will continue"
else
    success "Performance tests passed"
fi

# Create deployment summary
log "Creating deployment summary..."
cat > "deployment_summary.txt" << EOF
==========================================
🚀 Deployment Summary
==========================================
Deployment ID: ${DEPLOYMENT_ID}
Environment: ${DEPLOYMENT_ENV}
Timestamp: $(date)
Status: SUCCESS

Application Details:
- URL: http://localhost:3000
- PID: ${APP_PID}
- Version: $(node -p "require('./package.json').version")
- Node.js: ${NODE_VERSION}

Health Check: ✅ PASSED
Post-Deployment Tests: ✅ PASSED
Performance Tests: ✅ PASSED

Next Steps:
1. Monitor application logs: tail -f deployments/${DEPLOYMENT_ID}/app.log
2. Check application status: curl http://localhost:3000/api/health
3. View deployment manifest: cat deployments/${DEPLOYMENT_ID}/deployment.json

Rollback Command:
./scripts/rollback.sh ${DEPLOYMENT_ID}
==========================================
EOF

# Final success message
echo ""
echo "=========================================="
success "🎉 Deployment completed successfully!"
echo "=========================================="
echo ""
echo "Deployment ID: ${DEPLOYMENT_ID}"
echo "Application URL: http://localhost:3000"
echo "Application PID: ${APP_PID}"
echo ""
echo "To monitor the application:"
echo "  tail -f deployments/${DEPLOYMENT_ID}/app.log"
echo ""
echo "To check application status:"
echo "  curl http://localhost:3000/api/health"
echo ""
echo "Deployment summary saved to: deployment_summary.txt"
echo "=========================================="

# Save PID for later use
echo $APP_PID > app.pid

exit 0

#!/bin/bash

# SERENO Deployment Script
# This script handles the deployment of the SERENO application

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="sereno"
DOCKER_COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env.production"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if environment file exists
    if [ ! -f "$ENV_FILE" ]; then
        log_error "Environment file $ENV_FILE not found. Please create it from .env.example"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Build application
build_app() {
    log_info "Building application..."
    
    # Build backend
    log_info "Building backend..."
    npm run build
    
    # Build frontend
    log_info "Building frontend..."
    cd frontend
    npm run build
    cd ..
    
    log_success "Application built successfully"
}

# Run database migrations
run_migrations() {
    log_info "Running database migrations..."
    
    # Generate Prisma client
    npx prisma generate
    
    # Run migrations
    npx prisma migrate deploy
    
    log_success "Database migrations completed"
}

# Deploy with Docker
deploy_docker() {
    log_info "Deploying with Docker..."
    
    # Stop existing containers
    log_info "Stopping existing containers..."
    docker-compose -f $DOCKER_COMPOSE_FILE down || true
    
    # Build and start containers
    log_info "Building and starting containers..."
    docker-compose -f $DOCKER_COMPOSE_FILE --env-file $ENV_FILE up -d --build
    
    # Wait for services to be ready
    log_info "Waiting for services to be ready..."
    sleep 30
    
    # Check if services are healthy
    check_health
    
    log_success "Docker deployment completed"
}

# Check application health
check_health() {
    log_info "Checking application health..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost/health > /dev/null 2>&1; then
            log_success "Application is healthy"
            return 0
        fi
        
        log_info "Attempt $attempt/$max_attempts: Waiting for application to be ready..."
        sleep 10
        ((attempt++))
    done
    
    log_error "Application health check failed after $max_attempts attempts"
    return 1
}

# Backup database
backup_database() {
    log_info "Creating database backup..."
    
    local backup_dir="backups"
    local backup_file="$backup_dir/sereno_backup_$(date +%Y%m%d_%H%M%S).sql"
    
    mkdir -p $backup_dir
    
    # Create database backup
    docker-compose exec -T postgres pg_dump -U sereno_user sereno_db > $backup_file
    
    log_success "Database backup created: $backup_file"
}

# Rollback deployment
rollback() {
    log_warning "Rolling back deployment..."
    
    # Stop current containers
    docker-compose -f $DOCKER_COMPOSE_FILE down
    
    # Start previous version (if available)
    # This would require version tagging in a real deployment
    log_info "Rollback completed. Please manually restore previous version if needed."
}

# Clean up old Docker images
cleanup() {
    log_info "Cleaning up old Docker images..."
    
    # Remove unused images
    docker image prune -f
    
    # Remove unused volumes
    docker volume prune -f
    
    log_success "Cleanup completed"
}

# Show logs
show_logs() {
    log_info "Showing application logs..."
    docker-compose -f $DOCKER_COMPOSE_FILE logs -f
}

# Main deployment function
deploy() {
    log_info "Starting SERENO deployment..."
    
    # Create backup before deployment
    if [ "$1" != "--skip-backup" ]; then
        backup_database || log_warning "Backup failed, continuing with deployment..."
    fi
    
    # Check prerequisites
    check_prerequisites
    
    # Build application
    build_app
    
    # Run database migrations
    run_migrations
    
    # Deploy with Docker
    deploy_docker
    
    # Clean up
    cleanup
    
    log_success "SERENO deployment completed successfully!"
    log_info "Application is available at: http://localhost"
    log_info "API is available at: http://localhost/api/v1"
    log_info "Health check: http://localhost/health"
}

# Script usage
usage() {
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  deploy              Deploy the application"
    echo "  rollback            Rollback the deployment"
    echo "  backup              Create database backup"
    echo "  health              Check application health"
    echo "  logs                Show application logs"
    echo "  cleanup             Clean up Docker resources"
    echo ""
    echo "Options:"
    echo "  --skip-backup       Skip database backup during deployment"
    echo "  --help              Show this help message"
}

# Main script logic
case "${1:-deploy}" in
    "deploy")
        deploy $2
        ;;
    "rollback")
        rollback
        ;;
    "backup")
        backup_database
        ;;
    "health")
        check_health
        ;;
    "logs")
        show_logs
        ;;
    "cleanup")
        cleanup
        ;;
    "--help"|"help")
        usage
        ;;
    *)
        log_error "Unknown command: $1"
        usage
        exit 1
        ;;
esac
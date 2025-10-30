#!/bin/bash

###############################################################################
# PanicSense Deployment Helper Script
# 
# This script helps prepare and deploy PanicSense to various platforms.
# Usage: ./scripts/deploy.sh [platform]
# 
# Supported platforms:
#   - render
#   - railway
#   - heroku
#   - vercel
#   - docker
#   - check (just run pre-deployment checks)
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
  echo -e "${RED}✗ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ $1${NC}"
}

print_header() {
  echo ""
  echo "================================"
  echo "$1"
  echo "================================"
}

# Pre-deployment checks
run_checks() {
  print_header "Running Pre-Deployment Checks"
  
  local checks_passed=true
  
  # Check for .env file
  if [ ! -f ".env" ]; then
    print_error ".env file not found!"
    print_info "Create .env from .env.example and configure it"
    checks_passed=false
  else
    print_success ".env file exists"
  fi
  
  # Check for required environment variables
  if [ -f ".env" ]; then
    if ! grep -q "DATABASE_URL=" .env || grep -q "DATABASE_URL=$" .env; then
      print_error "DATABASE_URL not configured in .env"
      checks_passed=false
    else
      print_success "DATABASE_URL is configured"
    fi
    
    if ! grep -q "GROQ_API_KEY=" .env || grep -q "GROQ_API_KEY=$" .env; then
      print_warning "GROQ_API_KEY not configured (required for AI features)"
    else
      print_success "GROQ_API_KEY is configured"
    fi
    
    if ! grep -q "ADMIN_PASSWORD=" .env || grep -q "ADMIN_PASSWORD=your_secure" .env; then
      print_error "ADMIN_PASSWORD not changed from default!"
      print_warning "Please set a secure admin password in production"
      checks_passed=false
    else
      print_success "ADMIN_PASSWORD is configured"
    fi
  fi
  
  # Check TypeScript compilation
  print_info "Running TypeScript type check..."
  if npm run check; then
    print_success "TypeScript compilation successful"
  else
    print_error "TypeScript compilation failed!"
    checks_passed=false
  fi
  
  # Check if database is accessible
  if [ -f ".env" ] && grep -q "DATABASE_URL=" .env; then
    print_info "Testing database connection..."
    # This would require a simple db test script
    print_warning "Manual database connection test recommended"
  fi
  
  # Test build process
  print_info "Testing build process..."
  if npm run build; then
    print_success "Build successful"
  else
    print_error "Build failed!"
    checks_passed=false
  fi
  
  if [ "$checks_passed" = true ]; then
    print_header "✓ All Checks Passed!"
    return 0
  else
    print_header "✗ Some Checks Failed"
    return 1
  fi
}

# Deploy to Render
deploy_render() {
  print_header "Deploying to Render.com"
  
  print_info "Render deployment is typically done via their dashboard"
  print_info "Follow these steps:"
  echo ""
  echo "1. Go to https://dashboard.render.com"
  echo "2. Create a new Web Service"
  echo "3. Connect your GitHub repository"
  echo "4. Configure:"
  echo "   - Build Command: npm install && npm run build"
  echo "   - Start Command: npm run start"
  echo "5. Add environment variables from .env"
  echo "6. Create a PostgreSQL database in Render"
  echo "7. Deploy!"
  echo ""
  print_success "For detailed instructions, see DEPLOYMENT.md"
}

# Deploy to Railway
deploy_railway() {
  print_header "Deploying to Railway"
  
  if ! command -v railway &> /dev/null; then
    print_warning "Railway CLI not installed"
    print_info "Install with: npm install -g @railway/cli"
    echo ""
    print_info "Or deploy via Railway dashboard:"
    echo "1. Go to https://railway.app"
    echo "2. New Project → Deploy from GitHub"
    echo "3. Select your repository"
    echo "4. Add PostgreSQL service"
    echo "5. Configure environment variables"
    print_success "See DEPLOYMENT.md for details"
    return
  fi
  
  print_info "Initializing Railway deployment..."
  railway login
  railway init
  
  print_info "Add PostgreSQL:"
  echo "railway run railway add --database postgresql"
  
  print_success "Deployment initialized! Run 'railway up' to deploy"
}

# Deploy to Heroku
deploy_heroku() {
  print_header "Deploying to Heroku"
  
  if ! command -v heroku &> /dev/null; then
    print_error "Heroku CLI not installed!"
    print_info "Install from: https://devcenter.heroku.com/articles/heroku-cli"
    return 1
  fi
  
  print_info "Logging in to Heroku..."
  heroku login
  
  print_info "Creating Heroku app..."
  read -p "Enter app name (or press Enter for random): " app_name
  if [ -z "$app_name" ]; then
    heroku create
  else
    heroku create "$app_name"
  fi
  
  print_info "Adding PostgreSQL..."
  heroku addons:create heroku-postgresql:essential-0
  
  print_info "Adding buildpacks..."
  heroku buildpacks:add --index 1 heroku/python
  heroku buildpacks:add --index 2 heroku/nodejs
  
  print_info "Setting environment variables..."
  heroku config:set NODE_ENV=production
  heroku config:set ADMIN_PASSWORD="$(openssl rand -base64 32)"
  
  print_info "Note: Add GROQ_API_KEY manually:"
  echo "heroku config:set GROQ_API_KEY=your_key"
  
  print_success "Ready to deploy! Run: git push heroku main"
}

# Build Docker image
deploy_docker() {
  print_header "Building Docker Image"
  
  if ! command -v docker &> /dev/null; then
    print_error "Docker not installed!"
    print_info "Install from: https://docs.docker.com/get-docker/"
    return 1
  fi
  
  print_info "Building Docker image..."
  docker build -t panicsense:latest .
  
  print_success "Docker image built successfully!"
  echo ""
  print_info "To run locally:"
  echo "docker-compose up -d"
  echo ""
  print_info "To push to registry:"
  echo "docker tag panicsense:latest your-registry/panicsense:latest"
  echo "docker push your-registry/panicsense:latest"
}

# Deploy to Vercel
deploy_vercel() {
  print_header "Deploying to Vercel"
  
  print_warning "Note: Vercel has limitations for this full-stack app"
  print_info "Consider Render or Railway for better compatibility"
  echo ""
  
  if ! command -v vercel &> /dev/null; then
    print_info "Installing Vercel CLI..."
    npm install -g vercel
  fi
  
  print_info "Deploying to Vercel..."
  vercel --prod
  
  print_warning "Remember to:"
  echo "1. Add DATABASE_URL in Vercel dashboard"
  echo "2. Add GROQ_API_KEY in Vercel dashboard"
  echo "3. Configure other environment variables"
}

# Main script logic
main() {
  local platform="${1:-check}"
  
  echo "🚨 PanicSense Deployment Helper"
  
  case "$platform" in
    check)
      run_checks
      ;;
    render)
      run_checks || { print_error "Fix issues before deploying"; exit 1; }
      deploy_render
      ;;
    railway)
      run_checks || { print_error "Fix issues before deploying"; exit 1; }
      deploy_railway
      ;;
    heroku)
      run_checks || { print_error "Fix issues before deploying"; exit 1; }
      deploy_heroku
      ;;
    vercel)
      run_checks || { print_error "Fix issues before deploying"; exit 1; }
      deploy_vercel
      ;;
    docker)
      run_checks || { print_error "Fix issues before deploying"; exit 1; }
      deploy_docker
      ;;
    *)
      echo "Usage: $0 [platform]"
      echo ""
      echo "Available platforms:"
      echo "  check   - Run pre-deployment checks only"
      echo "  render  - Deploy to Render.com"
      echo "  railway - Deploy to Railway"
      echo "  heroku  - Deploy to Heroku"
      echo "  vercel  - Deploy to Vercel"
      echo "  docker  - Build Docker image"
      echo ""
      echo "Example: $0 render"
      exit 1
      ;;
  esac
}

# Run main function with all arguments
main "$@"

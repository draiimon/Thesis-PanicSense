#!/bin/bash

###############################################################################
# PanicSense Setup Script
# 
# This script automates the initial setup process for PanicSense.
# Run this after cloning the repository to get up and running quickly.
###############################################################################

set -e  # Exit on error

echo "🚨 PanicSense Setup Script"
echo "=========================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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
  echo "ℹ $1"
}

# Check if Node.js is installed
print_info "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
  print_error "Node.js is not installed!"
  echo "Please install Node.js 18.x or higher from https://nodejs.org"
  exit 1
fi

NODE_VERSION=$(node --version)
print_success "Node.js $NODE_VERSION is installed"

# Check if Python is installed
print_info "Checking Python installation..."
if ! command -v python3 &> /dev/null; then
  print_error "Python 3 is not installed!"
  echo "Please install Python 3.11 or higher from https://python.org"
  exit 1
fi

PYTHON_VERSION=$(python3 --version)
print_success "$PYTHON_VERSION is installed"

# Check if PostgreSQL is accessible
print_info "Checking PostgreSQL..."
if ! command -v psql &> /dev/null; then
  print_warning "PostgreSQL client not found locally"
  print_info "You'll need a PostgreSQL database (local or cloud-hosted)"
else
  print_success "PostgreSQL client is available"
fi

# Install Node.js dependencies
print_info "Installing Node.js dependencies..."
npm install
print_success "Node.js dependencies installed"

# Install Python dependencies
print_info "Installing Python dependencies..."
if [ -f "server/python/requirements.txt" ]; then
  pip3 install -r server/python/requirements.txt
  print_success "Python dependencies installed"
else
  print_warning "requirements.txt not found, skipping Python dependencies"
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
  print_info "Creating .env file from template..."
  if [ -f ".env.example" ]; then
    cp .env.example .env
    print_success ".env file created"
    print_warning "Please edit .env and add your configuration!"
  else
    print_error ".env.example not found!"
  fi
else
  print_success ".env file already exists"
fi

# Create necessary directories
print_info "Creating necessary directories..."
mkdir -p uploads/data uploads/temp uploads/profile_images
print_success "Directories created"

echo ""
echo "=========================="
echo "🎉 Setup Complete!"
echo "=========================="
echo ""
echo "Next steps:"
echo "1. Edit .env file with your configuration:"
echo "   - Add DATABASE_URL (PostgreSQL connection string)"
echo "   - Add GROQ_API_KEY (from console.groq.com)"
echo "   - Set ADMIN_PASSWORD to a secure password"
echo ""
echo "2. Push database schema:"
echo "   npm run db:push"
echo ""
echo "3. Start development server:"
echo "   npm run dev"
echo ""
echo "The application will be available at http://localhost:5000"
echo ""
print_success "Happy coding! 🚀"

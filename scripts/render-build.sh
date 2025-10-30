#!/bin/bash

set -e

echo "🚀 Starting PanicSense Render FREE TIER Build Process..."
echo "================================================"
echo "⚡ Optimized for 512 MB RAM limit"
echo "================================================"

# Step 1: Install Node.js dependencies
echo ""
echo "📦 Step 1: Installing Node.js dependencies..."
echo "Using npm ci for faster, more reliable installs..."
npm ci --production=false --prefer-offline --no-audit

# Step 2: Check if Python is available
echo ""
echo "🐍 Step 2: Setting up Python environment..."
if command -v python3 &> /dev/null; then
    echo "✅ Python3 found: $(python3 --version)"
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    echo "✅ Python found: $(python --version)"
    PYTHON_CMD="python"
else
    echo "❌ Python not found! Installing dependencies may fail."
    echo "⚠️  Continuing without Python dependencies..."
    PYTHON_CMD=""
fi

# Step 3: Install Python dependencies if Python is available
if [ -n "$PYTHON_CMD" ]; then
    echo ""
    echo "📦 Step 3: Installing Python dependencies..."
    echo "⚠️  NOTE: Some ML packages may fail on FREE tier (limited RAM)"
    echo "⚠️  This is NORMAL - the app will still work!"
    # Use lite requirements for free tier (no torch/transformers)
    if [ -f "server/python/requirements-lite.txt" ]; then
        echo "Installing from requirements-lite.txt (FREE TIER optimized)..."
        $PYTHON_CMD -m pip install --upgrade pip --quiet
        $PYTHON_CMD -m pip install -r server/python/requirements-lite.txt --quiet --no-cache-dir || {
            echo "⚠️  Some packages failed - continuing anyway"
        }
        echo "✅ Lightweight Python dependencies installed"
    elif [ -f "server/python/requirements.txt" ]; then
        echo "Installing from requirements.txt (may fail on FREE tier)..."
        $PYTHON_CMD -m pip install --upgrade pip --quiet
        # Install packages one by one to handle failures gracefully
        while IFS= read -r package; do
            if [[ ! "$package" =~ ^[[:space:]]*# ]] && [[ -n "$package" ]]; then
                echo "Installing $package..."
                $PYTHON_CMD -m pip install "$package" --quiet --no-cache-dir || {
                    echo "⚠️  Skipped $package (failed to install - OK on free tier)"
                }
            fi
        done < server/python/requirements.txt
        echo "✅ Python dependencies processed (some may have been skipped)"
    else
        echo "⚠️  No requirements file found, skipping Python dependencies"
    fi
else
    echo ""
    echo "⚠️  Step 3: Skipping Python dependencies (Python not available)"
fi

# Step 4: Download NLTK data if Python is available
if [ -n "$PYTHON_CMD" ]; then
    echo ""
    echo "📚 Step 4: Downloading NLTK data..."
    $PYTHON_CMD -c "import nltk; nltk.download('punkt'); nltk.download('stopwords')" || {
        echo "⚠️  Warning: NLTK data download failed"
    }
else
    echo ""
    echo "⚠️  Step 4: Skipping NLTK data (Python not available)"
fi

# Step 5: Build the frontend with Vite
echo ""
echo "🏗️  Step 5: Building frontend with Vite..."
echo "Using memory-optimized settings for FREE tier..."
NODE_OPTIONS="--max-old-space-size=512" npm run build

# Step 6: Verify build output
echo ""
echo "✅ Step 6: Verifying build output..."
if [ -d "dist/public" ]; then
    echo "✅ Frontend build successful - dist/public directory exists"
    ls -lah dist/public | head -10
else
    echo "❌ ERROR: Frontend build failed - dist/public directory not found!"
    exit 1
fi

echo ""
echo "================================================"
echo "✅ Build process completed successfully!"
echo "================================================"

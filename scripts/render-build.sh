#!/bin/bash

set -e

echo "🚀 Starting PanicSense Render Build Process..."
echo "================================================"

# Step 1: Install Node.js dependencies
echo ""
echo "📦 Step 1: Installing Node.js dependencies..."
npm install --production=false

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
    if [ -f "server/python/requirements.txt" ]; then
        echo "Installing from server/python/requirements.txt..."
        $PYTHON_CMD -m pip install --upgrade pip
        $PYTHON_CMD -m pip install -r server/python/requirements.txt || {
            echo "⚠️  Warning: Some Python packages failed to install"
            echo "⚠️  The app will work but ML features may be limited"
        }
    else
        echo "⚠️  requirements.txt not found, skipping Python dependencies"
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
npm run build

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

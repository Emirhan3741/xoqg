#!/bin/bash

# Firebase Functions Deployment Script
set -e

echo "🚀 Starting Firebase Functions deployment..."

# Check if we're in the right directory
if [ ! -f "firebase.json" ]; then
    echo "❌ Error: firebase.json not found. Please run this script from the project root."
    exit 1
fi

# Check if functions directory exists
if [ ! -d "functions" ]; then
    echo "❌ Error: functions directory not found."
    exit 1
fi

# Check if functions source files exist
if [ ! -f "functions/src/index.ts" ]; then
    echo "❌ Error: functions/src/index.ts not found."
    exit 1
fi

# Create functions/package.json if it doesn't exist
if [ ! -f "functions/package.json" ]; then
    echo "📝 Creating functions/package.json..."
    cat > functions/package.json << 'EOF'
{
  "name": "functions",
  "version": "1.0.0",
  "description": "Firebase Functions for XO Quiz Game",
  "private": true,
  "engines": { "node": ">=18" },
  "main": "lib/index.js",
  "scripts": {
    "build": "tsc",
    "serve": "npm run build && firebase emulators:start --only functions",
    "shell": "npm run build && firebase functions:shell",
    "start": "npm run shell",
    "deploy": "firebase deploy --only functions",
    "logs": "firebase functions:log"
  },
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^5.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
EOF
fi

# Create functions/tsconfig.json if it doesn't exist
if [ ! -f "functions/tsconfig.json" ]; then
    echo "📝 Creating functions/tsconfig.json..."
    cat > functions/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "es2017",
    "module": "commonjs",
    "outDir": "lib",
    "sourceMap": true,
    "strict": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "compileOnSave": true,
  "include": ["src"]
}
EOF
fi

# Set the correct Firebase project
echo "🎯 Setting Firebase project to xoqg-f41c9..."
firebase use xoqg-f41c9

# Verify project
echo "📋 Current Firebase project:"
firebase projects:list

# Navigate to functions directory
cd functions

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the functions
echo "🔨 Building functions..."
npm run build

# Deploy functions
echo "🚀 Deploying functions..."
firebase deploy --only functions

# List deployed functions
echo "📋 Deployed functions:"
firebase functions:list

echo "✅ Deployment complete!"
echo ""
echo "🧪 Test your functions by running:"
echo "  npx expo start -c"
echo "  Then navigate to /dev-functions-test"
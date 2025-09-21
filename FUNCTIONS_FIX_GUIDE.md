# Firebase Functions Internal Error Fix

## Current Issue
You're getting an "internal" error when calling the `joinQueue` function. This typically means:

1. **Functions are not deployed** - The function exists in code but not on Firebase
2. **Missing dependencies** - The function is deployed but missing required packages
3. **Configuration issues** - Environment variables or Firebase Admin SDK not properly initialized

## Quick Fix Steps

### 1. Deploy Functions (Most Likely Fix)
```bash
# Make the deployment script executable
chmod +x deploy-functions.sh

# Run the deployment script
./deploy-functions.sh
```

### 2. Manual Deployment (If script fails)
```bash
# Set correct project
firebase use xoqg-f41c9

# Navigate to functions directory
cd functions

# Create package.json (if missing)
cat > package.json << 'EOF'
{
  "name": "functions",
  "version": "1.0.0",
  "description": "Firebase Functions for XO Quiz Game",
  "private": true,
  "engines": { "node": ">=18" },
  "main": "lib/index.js",
  "scripts": {
    "build": "tsc",
    "deploy": "firebase deploy --only functions"
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

# Create tsconfig.json (if missing)
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "es2017",
    "module": "commonjs",
    "outDir": "lib",
    "sourceMap": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
EOF

# Install dependencies
npm install

# Build and deploy
npm run build
firebase deploy --only functions
```

### 3. Verify Deployment
```bash
# List deployed functions
firebase functions:list

# Should show: ping, createMatch, joinQueue, leaveQueue, getQuestion, submitMove, etc.
```

### 4. Check Logs (If still failing)
```bash
# Check function logs for detailed error
firebase functions:log --only joinQueue --limit 50
```

### 5. Test in App
After deployment:
1. Run `npx expo start -c` (clear cache)
2. Navigate to `/dev-functions-test`
3. Check that all functions show ✅
4. Try the "Seed Questions" button
5. Test matchmaking in the app

## Common Issues

### "functions/not-found"
- Function not deployed
- Function name mismatch between client and server

### "functions/internal" 
- Missing dependencies in functions/package.json
- Firebase Admin SDK initialization issues
- Database permissions issues
- Missing question bank (run seed questions first)

### "functions/unauthenticated"
- User not signed in (should auto-sign in anonymously)
- Firebase Auth not configured

## Environment Check
Make sure your `.env` file has:
```
EXPO_PUBLIC_FIREBASE_FUNCTIONS_REGION=us-central1
```

And all other Firebase config variables are set correctly.
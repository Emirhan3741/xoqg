## Quick Fix for "internal" Error

The Firebase Functions need to be deployed. Here's how to fix it:

### Option 1: Use the deployment script
```bash
chmod +x deploy-functions.sh
./deploy-functions.sh
```

### Option 2: Manual deployment
```bash
# Set correct project
firebase use xoqg-f41c9

# Go to functions directory
cd functions

# Create package.json (copy this content):
```
```json
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
```

```bash
# Create tsconfig.json (copy this content):
```
```json
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
```

```bash
# Install and deploy
npm install
npm run build
firebase deploy --only functions

# Verify deployment
firebase functions:list
```

### After deployment:
1. Run `npx expo start -c` (clear cache)
2. Test at `/dev-functions-test` - should show all ✅
3. Use "Seed Questions" button to populate database
4. Try matchmaking - should work now!

The "internal" error was caused by Firebase Admin SDK initialization conflicts, which I've fixed in the code.
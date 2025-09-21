# Firebase Functions Deployment Guide

## Current Issues
You're experiencing "FirebaseError: internal" errors when calling Firebase Functions. This typically indicates:

1. Functions are not properly deployed
2. Runtime errors in the functions
3. Configuration mismatches between client and server

## Quick Fix Steps

### 1. Deploy Functions
```bash
# Navigate to functions directory
cd functions

# Install dependencies (if package.json exists)
npm install

# Build TypeScript
npm run build

# Deploy functions
firebase deploy --only functions

# Verify deployment
firebase functions:list
```

### 2. Check Function Logs
```bash
# View recent logs
firebase functions:log --limit 50

# View specific function logs
firebase functions:log --only joinQueue --limit 25
```

### 3. Verify Configuration

#### Client Configuration (.env)
Your current .env looks correct:
```
EXPO_PUBLIC_FIREBASE_FUNCTIONS_REGION=us-central1
```

#### Server Configuration (functions/src/*)
All functions use `region: "us-central1"` which matches your client config.

### 4. Test Functions
After deployment, test in your app:

1. Go to `/debug-env` - verify all EXPO_PUBLIC_* values are loaded
2. Go to `/dev-functions-test` - test ping and createMatch functions
3. Try "Seed Questions" to populate the question bank

## Common Issues & Solutions

### Issue: "functions/not-found"
**Cause**: Function not deployed or name mismatch
**Solution**: 
- Run `firebase functions:list` to verify deployment
- Check function names match exactly between client calls and server exports

### Issue: "functions/internal" 
**Cause**: Runtime error in function
**Solution**:
- Check logs: `firebase functions:log --only functionName --limit 50`
- Common causes:
  - Empty question bank (run seedQuestions first)
  - Firestore permission issues
  - Invalid function arguments

### Issue: Region Mismatch
**Cause**: Client and server regions don't match
**Solution**: Ensure both use "us-central1"

## Deployment Commands

```bash
# Full deployment
cd functions
npm install
npm run build
firebase deploy --only functions

# Quick redeploy (after code changes)
npm run build && firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:joinQueue
```

## Verification Steps

1. **Check deployment status**:
   ```bash
   firebase functions:list
   ```
   Should show: ping, createMatch, joinQueue, leaveQueue, getQuestion, submitMove, etc.

2. **Test basic function**:
   ```bash
   firebase functions:log --only ping --limit 10
   ```

3. **Monitor real-time logs**:
   ```bash
   firebase functions:log --follow
   ```

## Next Steps

1. Run the deployment commands above
2. Test the functions in your app
3. If you still get "internal" errors, check the function logs for specific error details
4. Seed the question bank using the "Seed Questions" button in `/dev-functions-test`

The functions code looks correct, so the main issue is likely that they haven't been properly deployed yet.
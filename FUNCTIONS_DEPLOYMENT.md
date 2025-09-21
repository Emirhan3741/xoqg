# Firebase Functions Deployment Guide

## Prerequisites

1. **Firebase CLI installed globally:**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase:**
   ```bash
   firebase login
   ```

3. **Initialize Firebase project (if not done):**
   ```bash
   firebase init
   ```

## Deploy Functions

1. **Navigate to functions directory:**
   ```bash
   cd functions
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build TypeScript:**
   ```bash
   npm run build
   ```

4. **Deploy functions:**
   ```bash
   firebase deploy --only functions
   ```

## Verify Deployment

After deployment, you should see output like:
```
✔  functions: Finished running predeploy script.
✔  functions[us-central1-ping]: Successful create operation.
✔  functions[us-central1-joinQueue]: Successful create operation.
✔  functions[us-central1-leaveQueue]: Successful create operation.
✔  functions[us-central1-getQuestion]: Successful create operation.
✔  functions[us-central1-submitMove]: Successful create operation.
✔  functions[us-central1-forfeitMatch]: Successful create operation.
✔  functions[us-central1-cleanupQueue]: Successful create operation.
✔  functions[us-central1-processQuestionCsv]: Successful create operation.

✔  Deploy complete!
```

## Test Functions

Use the `/dev-functions-test` route in the app to test if functions are working properly.

## Common Issues

1. **"functions/internal" error:** Usually means functions are not deployed or there's a server-side error
2. **"functions/not-found" error:** Function doesn't exist or wrong region
3. **"functions/unauthenticated" error:** User not signed in anonymously

## Required Firebase Services

Make sure these are enabled in Firebase Console:
- Authentication (Anonymous sign-in)
- Firestore Database
- Realtime Database
- Cloud Functions
- Cloud Storage (if using question import)

## Function Regions

All functions are deployed to `us-central1` region. Make sure your client configuration matches:
```
EXPO_PUBLIC_FIREBASE_FUNCTIONS_REGION=us-central1
```
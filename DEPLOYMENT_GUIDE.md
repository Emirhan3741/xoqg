# Firebase Functions Deployment Guide

## Quick Deployment Steps

### 1. Prerequisites
- Firebase CLI installed: `npm install -g firebase-tools`
- Logged in to Firebase: `firebase login`
- Project selected: `firebase use xoqg-f41c9`

### 2. Deploy Functions
```bash
# Navigate to functions directory
cd functions

# Install dependencies (if package.json exists)
npm install

# Build TypeScript (if tsconfig.json exists)
npm run build

# Deploy functions
firebase deploy --only functions
```

### 3. Verify Deployment
```bash
# List deployed functions
firebase functions:list

# Expected functions:
# - ping (us-central1)
# - createMatch (us-central1)
# - joinQueue (us-central1)
# - leaveQueue (us-central1)
# - getQuestion (us-central1)
# - submitMove (us-central1)
# - forfeitMatch (us-central1)
# - cleanupQueue (us-central1)
# - processQuestionCsv (us-central1)
```

### 4. Test Functions
- Open app and go to `/dev-functions-test`
- Should see ✅ for ping() and createMatch()
- If you see "functions/not-found", the functions are not deployed
- If you see "functions/internal", check function logs: `firebase functions:log`

### 5. Enable Firebase Services
1. **Authentication**: Console → Authentication → Sign-in method → Anonymous → Enable
2. **Firestore**: Console → Firestore Database → Create database → Start in test mode
3. **Realtime Database**: Console → Realtime Database → Create database → Start in test mode
4. **Storage**: Console → Storage → Get started → Start in test mode

### 6. Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own data
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 7. Realtime Database Security Rules
```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```

### 8. Storage Security Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Troubleshooting

### Functions "internal" Error
- Check function logs: `firebase functions:log --limit 50`
- Ensure Node.js version is 18+ in functions/package.json
- Verify all dependencies are installed
- Check for syntax errors in function code

### Region Mismatch
- Client uses: `us-central1` (default)
- Functions must be deployed to same region
- Check functions/src/index.ts for region settings

### Authentication Issues
- Ensure Anonymous auth is enabled in Firebase Console
- Check if user is authenticated before calling functions
- Verify Firebase config is correct

### Configuration Issues
- Check `.env` file has all required EXPO_PUBLIC_* variables
- Verify `services/firebase.web.json` as fallback
- Restart dev server after config changes: `npx expo start -c`
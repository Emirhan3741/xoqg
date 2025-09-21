# Firebase Functions Setup Instructions

This project includes Firebase Functions for multiplayer matchmaking and game logic. The functions are currently commented out to prevent TypeScript errors during development.

## Setup Steps

### 1. Initialize Firebase Functions

```bash
# Install Firebase CLI if you haven't already
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase Functions in your project
firebase init functions
```

When prompted:
- Choose "Use an existing project" and select your Firebase project
- Choose TypeScript as the language
- Choose to use ESLint
- Choose to install dependencies with npm

### 2. Install Dependencies

```bash
cd functions
npm install firebase-functions firebase-admin
```

### 3. Enable the Functions

1. Open `functions/src/matchmaking.ts`
2. Uncomment all the code (remove the `/*` and `*/` comment blocks)
3. Open `functions/src/index.ts`
4. Uncomment the export line: `export * from "./matchmaking";`

### 4. Set up Firestore Security Rules

Create or update your `firestore.rules` file:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Matchmaking queue: users can only manage their own queue entry
    match /mm_queue/{uid} {
      allow create: if request.auth != null && request.auth.uid == uid;
      allow update, delete: if request.auth != null && request.auth.uid == uid;
      allow read: if false; // Keep queue private
    }

    // Matches: only participants can read, no direct writes allowed
    match /matches/{matchId} {
      allow read: if request.auth != null && 
        (resource.data.players.A == request.auth.uid || 
         resource.data.players.B == request.auth.uid);
      allow write: if false; // Only Cloud Functions can write
    }

    // Active match pointers: users can only read their own
    match /user_active_match/{uid} {
      allow read: if request.auth != null && request.auth.uid == uid;
      allow write: if false; // Only Cloud Functions can write
    }

    // Question bank: read-only for authenticated users
    match /question_bank/{questionId} {
      allow read: if request.auth != null;
      allow write: if false; // Admin only
    }

    // User recent questions: users can manage their own
    match /users/{uid}/recent_questions/{category} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

### 5. Set up Firestore Indexes

Create or update your `firestore.indexes.json` file:

```json
{
  "indexes": [
    {
      "collectionGroup": "mm_queue",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "mode", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "matches",
      "queryScope": "COLLECTION", 
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "turnDeadline", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "question_bank",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "locale", "order": "ASCENDING" },
        { "fieldPath": "category", "order": "ASCENDING" },
        { "fieldPath": "approved", "order": "ASCENDING" },
        { "fieldPath": "rand", "order": "ASCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

### 6. Deploy Functions

```bash
# Deploy all functions
firebase deploy --only functions

# Or deploy specific functions
firebase deploy --only functions:joinQueue,leaveQueue,getQuestion,submitMove
```

### 7. Set up Scheduled Functions (Optional)

The cleanup and timeout functions use Cloud Scheduler. Make sure your Firebase project has billing enabled to use scheduled functions.

## Available Functions

- `joinQueue`: Join matchmaking queue or get immediate match
- `leaveQueue`: Leave matchmaking queue  
- `getQuestion`: Get a question for a specific board cell
- `submitMove`: Submit an answer and update game state
- `forfeitMatch`: Forfeit an active match
- `cleanupQueue`: Scheduled cleanup of stale queue entries
- `timeoutSweep`: Scheduled timeout handling for expired matches

## Testing

You can test the functions locally using the Firebase emulator:

```bash
cd functions
npm run serve
```

This will start the functions emulator and you can test your functions locally before deploying.

## Data Structure

### Matchmaking Queue (`mm_queue/{uid}`)
```typescript
{
  uid: string,
  mode: "general",
  elo: number,
  status: "waiting",
  createdAt: Timestamp
}
```

### Match (`matches/{matchId}`)
```typescript
{
  players: { A: string, B: string },
  turnUid: string,
  board: Array<{
    cat: string,
    qid: string | null,
    state: "empty" | "A" | "B"
  }>,
  status: "active" | "finished" | "timeout" | "forfeit",
  winner?: "A" | "B" | "draw",
  createdAt: Timestamp,
  updatedAt: Timestamp,
  turnDeadline: Timestamp
}
```

### User Active Match (`user_active_match/{uid}`)
```typescript
{
  matchId: string,
  createdAt: Timestamp
}
```
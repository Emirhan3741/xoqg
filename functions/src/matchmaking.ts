import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// Use the already initialized Firebase Admin SDK from index.ts
const db = getFirestore();

// Type definitions
interface BoardCell {
  cat: string;
  qid: string | null;
  state: string;
}

interface MatchData {
  players: { A: string; B: string };
  turnUid: string;
  board: BoardCell[];
  status: string;
  createdAt: FieldValue;
  updatedAt: FieldValue;
  turnDeadline: FieldValue;
  winner?: string;
}

interface QueueEntry {
  uid: string;
  elo: number;
  mode: string;
  joinedAt: FieldValue;
  expandedRange?: number;
}

interface QuestionData {
  id: string;
  category: string;
  question: string;
  options: string[];
  correct: number;
  difficulty: string;
}

// Helper functions
const rnd = () => Math.random();

// Elo matching parameters
const ELO_INITIAL = 150;      // ±150 initial window
const ELO_STEP = 50;          // +50 every 10 seconds
const MAX_WAIT_MS = 60_000;   // 60s max wait

// Categories for board generation
const CATEGORIES = ["spor", "tarih", "coğrafya", "bilim", "sanat", "eğlence", "teknoloji", "edebiyat"];

// Generate random board with categories
function generateBoard(): BoardCell[] {
  const board: BoardCell[] = [];
  for (let i = 0; i < 9; i++) {
    board.push({
      cat: CATEGORIES[Math.floor(rnd() * CATEGORIES.length)]!,
      qid: null,
      state: "empty" // empty, pending, correct_A, correct_B, wrong_A, wrong_B
    });
  }
  return board;
}

// Find suitable opponent in queue
async function findOpponent(uid: string, elo: number, mode: string): Promise<FirebaseFirestore.DocumentSnapshot | null> {
  // Input validation
  if (!mode?.trim() || mode.length > 50) {
    throw new Error("Invalid mode parameter");
  }
  
  const sanitizedMode = mode.trim();
  const queueRef = db.collection("mm_queue");
  const now = Date.now();
  
  // Calculate expanded range based on wait time
  const candidates = await queueRef
    .where("mode", "==", sanitizedMode)
    .where("uid", "!=", uid)
    .orderBy("joinedAt")
    .get();
    
  for (const doc of candidates.docs) {
    const data = doc.data() as QueueEntry;
    const waitTime = now - (data.joinedAt as any).toMillis();
    const expandedRange = ELO_INITIAL + Math.floor(waitTime / 10000) * ELO_STEP;
    
    if (Math.abs(data.elo - elo) <= expandedRange) {
      return doc;
    }
  }
  
  return null;
}

// Create new match (internal helper)
async function createMatchInternal(playerA: string, playerB: string): Promise<string> {
  // Input validation
  if (!playerA?.trim() || !playerB?.trim() || playerA.length > 100 || playerB.length > 100) {
    throw new Error("Invalid player IDs");
  }
  
  const sanitizedPlayerA = playerA.trim();
  const sanitizedPlayerB = playerB.trim();
  const matchId = db.collection("matches").doc().id;
  const board = generateBoard();
  const firstPlayer = rnd() < 0.5 ? playerA : playerB;
  
  const matchData: MatchData = {
    players: { A: sanitizedPlayerA, B: sanitizedPlayerB },
    turnUid: firstPlayer,
    board,
    status: "active",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    turnDeadline: FieldValue.serverTimestamp()
  };
  
  const batch = db.batch();
  
  // Create match document
  batch.set(db.collection("matches").doc(matchId), matchData);
  
  // Update user active match references
  batch.set(db.collection("user_active_match").doc(sanitizedPlayerA), {
    matchId,
    role: "A",
    updatedAt: FieldValue.serverTimestamp()
  });
  
  batch.set(db.collection("user_active_match").doc(sanitizedPlayerB), {
    matchId,
    role: "B",
    updatedAt: FieldValue.serverTimestamp()
  });
  
  await batch.commit();
  return matchId;
}

// Join matchmaking queue
export const joinQueue = onCall({ region: "us-central1" }, async (request) => {
  const data = request.data as { mode: string; elo: number };
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }
  
  // Input validation
  if (!data || typeof data !== 'object') {
    throw new HttpsError("invalid-argument", "Invalid data provided");
  }
  
  const mode = (data.mode || "general").trim();
  const elo = data.elo || 1200;
  
  if (!mode || mode.length > 50) {
    throw new HttpsError("invalid-argument", "Invalid mode parameter");
  }
  
  try {
    // Check if user already has an active match
    const activeMatchDoc = await db.collection("user_active_match").doc(uid).get();
    if (activeMatchDoc.exists) {
      const activeMatch = activeMatchDoc.data();
      return {
        success: true,
        matchFound: true,
        matchId: activeMatch?.matchId,
        message: "Returning to existing match"
      };
    }
    
    // Look for opponent
    const opponent = await findOpponent(uid, elo, mode);
    
    if (opponent) {
      // Match found - create game
      const opponentData = opponent.data() as QueueEntry;
      const matchId = await createMatchInternal(uid, opponentData.uid);
      
      // Remove both players from queue
      const batch = db.batch();
      batch.delete(db.collection("mm_queue").doc(uid));
      batch.delete(opponent.ref);
      await batch.commit();
      
      return {
        success: true,
        matchFound: true,
        matchId,
        opponent: opponentData.uid,
        message: "Match found!"
      };
    } else {
      // No opponent found - join queue
      await db.collection("mm_queue").doc(uid).set({
        uid,
        elo,
        mode,
        joinedAt: FieldValue.serverTimestamp()
      });
      
      return {
        success: true,
        matchFound: false,
        message: "Added to matchmaking queue"
      };
    }
  } catch (error) {
    console.error("Error in joinQueue:", error);
    throw new HttpsError("internal", "Failed to join queue");
  }
});

// Leave matchmaking queue
export const leaveQueue = onCall({ region: "us-central1" }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }
  
  try {
    await db.collection("mm_queue").doc(uid).delete();
    return { success: true, message: "Left matchmaking queue" };
  } catch (error) {
    console.error("Error in leaveQueue:", error);
    throw new HttpsError("internal", "Failed to leave queue");
  }
});

// Get question for a specific cell
export const getQuestion = onCall({ region: "us-central1" }, async (request) => {
  const data = request.data as { matchId: string; cellIndex: number };
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }
  
  const { matchId, cellIndex } = data;
  
  try {
    // Verify user is in this match and it's their turn
    const matchDoc = await db.collection("matches").doc(matchId).get();
    if (!matchDoc.exists) {
      throw new HttpsError("not-found", "Match not found");
    }
    
    const matchData = matchDoc.data() as MatchData;
    if (matchData.turnUid !== uid) {
      throw new HttpsError("permission-denied", "Not your turn");
    }
    
    if (matchData.board[cellIndex]?.state !== "empty") {
      throw new HttpsError("failed-precondition", "Cell is not available");
    }
    
    // Get random question from the cell's category
    const category = matchData.board[cellIndex]?.cat;
    const questionsQuery = await db.collection("question_bank")
      .where("category", "==", category)
      .limit(50)
      .get();
    
    if (questionsQuery.empty) {
      throw new HttpsError("not-found", "No questions found for category");
    }
    
    // Select random question
    const questions = questionsQuery.docs;
    const randomQuestion = questions[Math.floor(rnd() * questions.length)]!;
    const questionData = randomQuestion.data() as QuestionData;
    
    // Update match with question ID and set cell to pending
    const updatedBoard = [...matchData.board];
    updatedBoard[cellIndex] = {
      ...updatedBoard[cellIndex]!,
      qid: randomQuestion.id,
      state: "pending"
    };
    
    await db.collection("matches").doc(matchId).update({
      board: updatedBoard,
      updatedAt: FieldValue.serverTimestamp(),
      turnDeadline: FieldValue.serverTimestamp() // Add 30 seconds for answer
    });
    
    return {
      success: true,
      question: {
        id: questionData.id,
        question: questionData.question,
        options: questionData.options,
        category: questionData.category,
        difficulty: questionData.difficulty
      }
    };
  } catch (error) {
    console.error("Error in getQuestion:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", "Failed to get question");
  }
});

// Submit move (answer question)
export const submitMove = onCall({ region: "us-central1" }, async (request) => {
  const data = request.data as { matchId: string; cellIndex: number; answer: number };
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }
  
  const { matchId, cellIndex, answer } = data;
  
  try {
    // Get match and question data
    const matchDoc = await db.collection("matches").doc(matchId).get();
    if (!matchDoc.exists) {
      throw new HttpsError("not-found", "Match not found");
    }
    
    const matchData = matchDoc.data() as MatchData;
    if (matchData.turnUid !== uid) {
      throw new HttpsError("permission-denied", "Not your turn");
    }
    
    const cell = matchData.board[cellIndex];
    if (!cell || cell.state !== "pending" || !cell.qid) {
      throw new HttpsError("failed-precondition", "Invalid cell state");
    }
    
    // Get question to check correct answer
    const questionDoc = await db.collection("question_bank").doc(cell.qid).get();
    if (!questionDoc.exists) {
      throw new HttpsError("not-found", "Question not found");
    }
    
    const questionData = questionDoc.data() as QuestionData;
    const isCorrect = answer === questionData.correct;
    
    // Determine player role
    const playerRole = matchData.players.A === uid ? "A" : "B";
    const otherPlayer = matchData.players.A === uid ? matchData.players.B : matchData.players.A;
    
    // Update board
    const updatedBoard = [...matchData.board];
    updatedBoard[cellIndex] = {
      ...cell,
      state: isCorrect ? `correct_${playerRole}` : `wrong_${playerRole}`
    };
    
    // Check for win condition (3 in a row)
    const checkWin = (board: BoardCell[], player: string): boolean => {
      const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
        [0, 4, 8], [2, 4, 6] // diagonals
      ];
      
      return winPatterns.some(pattern => 
        pattern.every(i => board[i]?.state === `correct_${player}`)
      );
    };
    
    let gameStatus = matchData.status;
    let winner = matchData.winner;
    
    if (isCorrect && checkWin(updatedBoard, playerRole)) {
      gameStatus = "finished";
      winner = uid;
    } else if (updatedBoard.every(cell => cell.state !== "empty")) {
      // Board full - check who has more correct answers
      const scoreA = updatedBoard.filter(cell => cell.state === "correct_A").length;
      const scoreB = updatedBoard.filter(cell => cell.state === "correct_B").length;
      
      gameStatus = "finished";
      if (scoreA > scoreB) {
        winner = matchData.players.A;
      } else if (scoreB > scoreA) {
        winner = matchData.players.B;
      } else {
        winner = "draw";
      }
    }
    
    // Update match
    const updateData: any = {
      board: updatedBoard,
      turnUid: isCorrect ? uid : otherPlayer, // Keep turn if correct, switch if wrong
      updatedAt: FieldValue.serverTimestamp(),
      status: gameStatus
    };
    
    if (winner) {
      updateData.winner = winner;
    }
    
    await db.collection("matches").doc(matchId).update(updateData);
    
    // If game finished, clean up user_active_match
    if (gameStatus === "finished") {
      const batch = db.batch();
      batch.delete(db.collection("user_active_match").doc(matchData.players.A));
      batch.delete(db.collection("user_active_match").doc(matchData.players.B));
      await batch.commit();
    }
    
    return {
      success: true,
      correct: isCorrect,
      correctAnswer: questionData.correct,
      gameStatus,
      winner,
      nextTurn: updateData.turnUid
    };
  } catch (error) {
    console.error("Error in submitMove:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", "Failed to submit move");
  }
});

// Forfeit match
export const forfeitMatch = onCall({ region: "us-central1" }, async (request) => {
  const data = request.data as { matchId: string };
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }
  
  const { matchId } = data;
  
  try {
    const matchDoc = await db.collection("matches").doc(matchId).get();
    if (!matchDoc.exists) {
      throw new HttpsError("not-found", "Match not found");
    }
    
    const matchData = matchDoc.data() as MatchData;
    const otherPlayer = matchData.players.A === uid ? matchData.players.B : matchData.players.A;
    
    // Update match as forfeited
    await db.collection("matches").doc(matchId).update({
      status: "finished",
      winner: otherPlayer,
      updatedAt: FieldValue.serverTimestamp()
    });
    
    // Clean up user_active_match
    const batch = db.batch();
    batch.delete(db.collection("user_active_match").doc(matchData.players.A));
    batch.delete(db.collection("user_active_match").doc(matchData.players.B));
    await batch.commit();
    
    return {
      success: true,
      message: "Match forfeited",
      winner: otherPlayer
    };
  } catch (error) {
    console.error("Error in forfeitMatch:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", "Failed to forfeit match");
  }
});

// Cleanup expired queue entries (HTTP function for manual cleanup)
export const cleanupQueue = onCall({ region: "us-central1" }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }
  
  try {
    const cutoff = new Date(Date.now() - MAX_WAIT_MS);
    
    const expiredEntries = await db.collection("mm_queue")
      .where("joinedAt", "<", cutoff)
      .get();
    
    const batch = db.batch();
    expiredEntries.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    if (!expiredEntries.empty) {
      await batch.commit();
      console.log(`Cleaned up ${expiredEntries.size} expired queue entries`);
    }
    
    return {
      success: true,
      cleaned: expiredEntries.size,
      message: `Cleaned up ${expiredEntries.size} expired queue entries`
    };
  } catch (error) {
    console.error("Error in cleanupQueue:", error);
    throw new HttpsError("internal", "Failed to cleanup queue");
  }
});



// Create match function for testing
export const createMatch = onCall({ region: "us-central1" }, async (req) => {
  const uid = req.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "Login required.");
  }
  
  try {
    const mode = (req.data?.mode as string) || "quick";
    const ref = db.collection("matches").doc();
    
    const matchData = {
      id: ref.id, 
      owner: uid, 
      mode, 
      createdAt: Date.now(),
      status: 'created'
    };
    
    await ref.set(matchData);
    return { id: ref.id, match: matchData };
  } catch (error) {
    console.error('Error creating match:', error);
    throw new HttpsError("internal", "Failed to create match");
  }
});

// Seed questions function for testing
export const seedQuestions = onCall({ region: "us-central1" }, async (req) => {
  const uid = req.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "Login required.");
  }
  
  try {
    const sampleQuestions = [
      {
        category: "tarih",
        question: "Türkiye Cumhuriyeti ne zaman kuruldu?",
        options: ["1920", "1923", "1925", "1930"],
        correct: 1,
        difficulty: "easy"
      },
      {
        category: "coğrafya",
        question: "Türkiye'nin başkenti neresidir?",
        options: ["İstanbul", "İzmir", "Ankara", "Bursa"],
        correct: 2,
        difficulty: "easy"
      },
      {
        category: "spor",
        question: "Futbolda bir takımda kaç oyuncu bulunur?",
        options: ["10", "11", "12", "9"],
        correct: 1,
        difficulty: "easy"
      },
      {
        category: "bilim",
        question: "Su'nun kimyasal formülü nedir?",
        options: ["H2O", "CO2", "O2", "H2SO4"],
        correct: 0,
        difficulty: "easy"
      },
      {
        category: "sanat",
        question: "Mona Lisa tablosunu kim yapmıştır?",
        options: ["Picasso", "Van Gogh", "Leonardo da Vinci", "Michelangelo"],
        correct: 2,
        difficulty: "medium"
      }
    ];
    
    const batch = db.batch();
    let added = 0;
    
    for (const question of sampleQuestions) {
      const questionRef = db.collection("question_bank").doc();
      batch.set(questionRef, {
        ...question,
        createdAt: new Date(),
        id: questionRef.id
      });
      added++;
    }
    
    await batch.commit();
    
    return { 
      success: true, 
      added,
      message: `Successfully seeded ${added} questions to Firebase` 
    };
  } catch (error) {
    console.error('Error seeding questions:', error);
    throw new HttpsError("internal", "Failed to seed questions");
  }
});

// Process CSV import for questions (admin function)
export const processQuestionCsv = onCall({ region: "us-central1" }, async (request) => {
  const data = request.data as { csvData: string };
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }
  
  // TODO: Add admin check here
  // const userDoc = await db.collection("users").doc(uid).get();
  // if (!userDoc.data()?.isAdmin) {
  //   throw new HttpsError("permission-denied", "Admin access required");
  // }
  
  const { csvData } = data;
  
  try {
    const lines = csvData.split("\n").filter(line => line.trim());
    const batch = db.batch();
    let processed = 0;
    
    for (let i = 1; i < lines.length; i++) { // Skip header
      const line = lines[i]!.trim();
      if (!line) continue;
      
      const [category, question, option1, option2, option3, option4, correct, difficulty] = line.split(",").map(s => s.trim().replace(/^"|"$/g, ""));
      
      if (!category || !question || !option1 || !option2 || !option3 || !option4 || !correct || !difficulty) {
        console.warn(`Skipping invalid line ${i + 1}: ${line}`);
        continue;
      }
      
      const questionDoc = db.collection("question_bank").doc();
      batch.set(questionDoc, {
        category: category.toLowerCase(),
        question,
        options: [option1, option2, option3, option4],
        correct: parseInt(correct) - 1, // Convert to 0-based index
        difficulty: difficulty.toLowerCase(),
        createdAt: FieldValue.serverTimestamp()
      });
      
      processed++;
      
      // Commit in batches of 500
      if (processed % 500 === 0) {
        await batch.commit();
      }
    }
    
    // Commit remaining
    if (processed % 500 !== 0) {
      await batch.commit();
    }
    
    return {
      success: true,
      processed,
      message: `Successfully imported ${processed} questions`
    };
  } catch (error) {
    console.error("Error in processQuestionCsv:", error);
    throw new HttpsError("internal", "Failed to process CSV");
  }
});
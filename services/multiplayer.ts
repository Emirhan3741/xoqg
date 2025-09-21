import { 
  doc, 
  onSnapshot
} from 'firebase/firestore';
import { 
  ref, 
  onValue, 
  set, 
  onDisconnect,
  serverTimestamp as rtdbServerTimestamp
} from 'firebase/database';
import { httpsCallable } from 'firebase/functions';
import { User } from 'firebase/auth';
import { getFirebase } from './firebase';
import { 
  Match, 
  PresenceData,
  Question
} from '@/types/game';

// Helper functions for validation
function assertAnswerIndex(v: unknown): asserts v is number {
  if (typeof v !== "number" || v < 0 || v > 3 || !Number.isInteger(v)) {
    throw new Error("invalid-argument: answer must be an integer 0..3");
  }
}

function requireSvc<T>(svc: T | null | undefined, name: string): T {
  if (!svc) throw new Error(`${name} not initialized`);
  return svc as T;
}

// Auth service
export class AuthService {
  private static instance: AuthService;

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  getCurrentUser(): User | null {
    try {
      const { auth } = getFirebase();
      return requireSvc(auth, 'auth').currentUser;
    } catch (error) {
      throw new Error('Firebase Auth not initialized. Check your Firebase configuration.');
    }
  }

  getUid(): string {
    try {
      const { auth } = getFirebase();
      const user = requireSvc(auth, 'auth').currentUser;
      if (!user?.uid?.trim()) {
        throw new Error('User not authenticated');
      }
      return user.uid;
    } catch (error) {
      throw new Error('Firebase Auth not initialized. Check your Firebase configuration.');
    }
  }
}

// Presence service
export class PresenceService {
  private static instance: PresenceService;
  private uid: string | null = null;

  static getInstance(): PresenceService {
    if (!PresenceService.instance) {
      PresenceService.instance = new PresenceService();
    }
    return PresenceService.instance;
  }

  async initialize(uid: string): Promise<void> {
    try {
      const { rtdb } = getFirebase();
      const database = requireSvc(rtdb, 'rtdb');
      
      this.uid = uid;
      const presenceRef = ref(database, `presence/${uid}`);
      
      // Set online status
      await set(presenceRef, {
        state: 'online',
        lastSeen: rtdbServerTimestamp()
      });

      // Set offline on disconnect
      onDisconnect(presenceRef).set({
        state: 'offline',
        lastSeen: rtdbServerTimestamp()
      });
    } catch (error) {
      throw new Error('Firebase Realtime Database not initialized. Check your Firebase configuration.');
    }
  }

  subscribeToPresence(uid: string, callback: (presence: PresenceData | null) => void): () => void {
    try {
      const { rtdb } = getFirebase();
      const database = requireSvc(rtdb, 'rtdb');
      
      const presenceRef = ref(database, `presence/${uid}`);
      return onValue(presenceRef, (snapshot) => {
        callback(snapshot.val());
      });
    } catch (error) {
      throw new Error('Firebase Realtime Database not initialized. Check your Firebase configuration.');
    }
  }
}

// Matchmaking service
export class MatchmakingService {
  private static instance: MatchmakingService;

  static getInstance(): MatchmakingService {
    if (!MatchmakingService.instance) {
      MatchmakingService.instance = new MatchmakingService();
    }
    return MatchmakingService.instance;
  }

  async joinQueue(mode: 'general' = 'general', elo: number = 1200): Promise<{ matchId?: string; queued?: boolean; success?: boolean; matchFound?: boolean; message?: string }> {
    const authService = AuthService.getInstance();
    const uid = authService.getUid();
    
    console.log('🎯 [MatchmakingService] Joining queue with uid:', uid, 'mode:', mode, 'elo:', elo);
    
    try {
      const { functions } = getFirebase();
      const functionsService = requireSvc(functions, 'functions');
      
      console.log('🔧 [MatchmakingService] Functions service initialized');
      console.log('🔧 [MatchmakingService] Functions URL:', (functionsService as any)?._url);
      console.log('🔧 [MatchmakingService] Functions region:', (functionsService as any)?._region);
      console.log('🔧 [MatchmakingService] Functions app:', (functionsService as any)?._app?.options?.projectId);
      
      // Call the new joinQueue function
      console.log('📞 [MatchmakingService] Calling joinQueue function with data:', { mode, elo });
      const joinQueueFunction = httpsCallable(functionsService, 'joinQueue');
      const result = await joinQueueFunction({ mode, elo });
      
      console.log('✅ [MatchmakingService] Join queue result:', result.data);
      return result.data as { matchId?: string; queued?: boolean; success?: boolean; matchFound?: boolean; message?: string };
    } catch (error: any) {
      console.error('❌ [MatchmakingService] Join queue error:', error);
      console.error('❌ [MatchmakingService] Error details:', {
        code: error?.code,
        message: error?.message,
        details: error?.details,
        stack: error?.stack
      });
      
      // Log additional debugging info
      try {
        const { functions } = getFirebase();
        console.error('🔍 [MatchmakingService] Debug info:', {
          functionsUrl: (functions as any)?._url,
          functionsRegion: (functions as any)?._region,
          projectId: (functions as any)?._app?.options?.projectId
        });
      } catch (debugError) {
        console.error('🔍 [MatchmakingService] Failed to get debug info:', debugError);
      }
      
      // Provide more specific error messages
      if (error?.code === 'functions/not-found') {
        throw new Error('Firebase Functions not deployed. Please run: cd functions && npm run build && firebase deploy --only functions');
      } else if (error?.code === 'functions/unauthenticated') {
        throw new Error('Authentication required. Please sign in.');
      } else if (error?.code === 'functions/internal') {
        throw new Error(`Server error occurred. Check Firebase Functions logs with: firebase functions:log --only joinQueue --limit 50. Original error: ${error?.message || 'Unknown internal error'}`);
      } else if (error?.code === 'functions/unavailable') {
        throw new Error('Firebase Functions are currently unavailable. Please try again later.');
      } else if (error?.code === 'functions/deadline-exceeded') {
        throw new Error('Request timeout. The server took too long to respond.');
      } else {
        throw new Error(`Matchmaking failed: ${error?.message || 'Unknown error'} (Code: ${error?.code || 'unknown'})`);
      }
    }
  }

  async leaveQueue(): Promise<void> {
    try {
      const { functions } = getFirebase();
      const functionsService = requireSvc(functions, 'functions');
      
      const leaveQueueFunction = httpsCallable(functionsService, 'leaveQueue');
      await leaveQueueFunction({});
    } catch (error: any) {
      console.error('Leave queue error:', error);
      
      if (error?.code === 'functions/not-found') {
        throw new Error('Firebase Functions not deployed.');
      } else if (error?.code === 'functions/internal') {
        throw new Error('Server error occurred while leaving queue.');
      } else {
        throw new Error(`Failed to leave queue: ${error?.message || 'Unknown error'}`);
      }
    }
  }

  subscribeToActiveMatch(uid: string, callback: (matchId: string | null) => void): () => void {
    try {
      const { db } = getFirebase();
      const firestore = requireSvc(db, 'db');
      
      const activeMatchRef = doc(firestore, 'user_active_match', uid);
      
      return onSnapshot(activeMatchRef, (snapshot) => {
        if (snapshot.exists()) {
          const matchId = snapshot.get('matchId');
          callback(matchId);
        } else {
          callback(null);
        }
      });
    } catch (error) {
      throw new Error('Firebase Firestore not initialized. Check your Firebase configuration.');
    }
  }

  async createInvite(targetUid: string): Promise<string> {
    try {
      const { functions } = getFirebase();
      const functionsService = requireSvc(functions, 'functions');
      
      const createInviteFunction = httpsCallable(functionsService, 'createInvite');
      const result = await createInviteFunction({ targetUid });
      
      return (result.data as any).matchId;
    } catch (error: any) {
      console.error('Create invite error:', error);
      
      if (error?.code === 'functions/not-found') {
        throw new Error('Firebase Functions not deployed.');
      } else if (error?.code === 'functions/internal') {
        throw new Error('Server error occurred while creating invite.');
      } else {
        throw new Error(`Failed to create invite: ${error?.message || 'Unknown error'}`);
      }
    }
  }
}

// Match service
export class MatchService {
  private static instance: MatchService;

  static getInstance(): MatchService {
    if (!MatchService.instance) {
      MatchService.instance = new MatchService();
    }
    return MatchService.instance;
  }

  subscribeToMatch(matchId: string, callback: (match: Match | null) => void): () => void {
    try {
      const { db } = getFirebase();
      const firestore = requireSvc(db, 'db');
      
      const matchRef = doc(firestore, 'matches', matchId);
      
      return onSnapshot(matchRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const match: Match = {
            id: snapshot.id,
            players: data.players,
            board: data.board,
            turnUid: data.turnUid,
            turnDeadline: data.turnDeadline.toDate(),
            seed: data.seed,
            status: data.status,
            winner: data.winner,
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate()
          };
          callback(match);
        } else {
          callback(null);
        }
      });
    } catch (error) {
      throw new Error('Firebase Firestore not initialized. Check your Firebase configuration.');
    }
  }

  async getQuestion(matchId: string, cellIndex: number): Promise<Question> {
    try {
      const { functions } = getFirebase();
      const functionsService = requireSvc(functions, 'functions');
      
      const getQuestionFunction = httpsCallable(functionsService, 'getQuestion');
      const result = await getQuestionFunction({ matchId, cellIndex });
      
      return (result.data as any).question;
    } catch (error) {
      throw new Error('Firebase Functions not initialized. Check your Firebase configuration.');
    }
  }

  async submitMove(matchId: string, cellIndex: number, answer: number): Promise<{
    success: boolean;
    correct: boolean;
    correctAnswer: number;
    gameStatus: string;
    winner?: string;
    nextTurn: string;
  }> {
    // Validate answer parameter
    assertAnswerIndex(answer);
    
    try {
      const { functions } = getFirebase();
      const functionsService = requireSvc(functions, 'functions');
      
      const submitMoveFunction = httpsCallable(functionsService, 'submitMove');
      const result = await submitMoveFunction({ matchId, cellIndex, answer });
      
      return result.data as any;
    } catch (error: any) {
      console.error('Submit move error:', error);
      
      if (error?.code === 'functions/not-found') {
        throw new Error('Firebase Functions not deployed.');
      } else if (error?.code === 'functions/internal') {
        throw new Error('Server error occurred while submitting move.');
      } else if (error?.code === 'functions/permission-denied') {
        throw new Error('Not your turn or invalid move.');
      } else if (error?.code === 'functions/failed-precondition') {
        throw new Error('Invalid cell state or move not allowed.');
      } else {
        throw new Error(`Failed to submit move: ${error?.message || 'Unknown error'}`);
      }
    }
  }

  async forfeitMatch(matchId: string): Promise<void> {
    try {
      const { functions } = getFirebase();
      const functionsService = requireSvc(functions, 'functions');
      
      const forfeitFunction = httpsCallable(functionsService, 'forfeitMatch');
      await forfeitFunction({ matchId });
    } catch (error) {
      throw new Error('Firebase Functions not initialized. Check your Firebase configuration.');
    }
  }
}

// Question service
export class QuestionService {
  private static instance: QuestionService;

  static getInstance(): QuestionService {
    if (!QuestionService.instance) {
      QuestionService.instance = new QuestionService();
    }
    return QuestionService.instance;
  }

  async getBoardQuestions(request: {
    uid: string;
    categories: string[];
    locale: string;
    difficultyBand?: { min: number; max: number };
    perCategory: number;
  }): Promise<{
    questions: {
      qid: string;
      prompt: string;
      options: string[];
      category: string;
      difficulty: number;
    }[];
  }> {
    if (!request?.uid?.trim() || !request?.categories?.length || !request?.locale?.trim()) {
      throw new Error('Invalid request parameters');
    }
    
    try {
      const { functions } = getFirebase();
      const functionsService = requireSvc(functions, 'functions');
      
      const getBoardQuestionsFunction = httpsCallable(functionsService, 'getBoardQuestions');
      const result = await getBoardQuestionsFunction(request);
      
      return result.data as any;
    } catch (error) {
      throw new Error('Firebase Functions not initialized. Check your Firebase configuration.');
    }
  }

  async processQuestionCsv(storagePath: string): Promise<{
    inserted: number;
    updated: number;
    skipped: number;
    errors: string[];
  }> {
    try {
      const { functions } = getFirebase();
      const functionsService = requireSvc(functions, 'functions');
      
      const processQuestionCsvFunction = httpsCallable(functionsService, 'processQuestionCsv');
      const result = await processQuestionCsvFunction({ storagePath });
      
      return result.data as any;
    } catch (error) {
      throw new Error('Firebase Functions not initialized. Check your Firebase configuration.');
    }
  }
}

// Timer service for turn deadlines
export class TimerService {
  private static instance: TimerService;
  private timers: Map<string, NodeJS.Timeout> = new Map();

  static getInstance(): TimerService {
    if (!TimerService.instance) {
      TimerService.instance = new TimerService();
    }
    return TimerService.instance;
  }

  startTimer(
    matchId: string, 
    deadline: Date, 
    onTimeout: () => void,
    onTick?: (remainingMs: number) => void
  ): void {
    this.clearTimer(matchId);

    const now = Date.now();
    const deadlineMs = deadline.getTime();
    const remainingMs = deadlineMs - now;

    if (remainingMs <= 0) {
      onTimeout();
      return;
    }

    // Set up tick interval if callback provided
    if (onTick) {
      const tickInterval = setInterval(() => {
        const remaining = deadlineMs - Date.now();
        if (remaining <= 0) {
          clearInterval(tickInterval);
          onTimeout();
        } else {
          onTick(remaining);
        }
      }, 1000);

      this.timers.set(`${matchId}_tick`, tickInterval as unknown as NodeJS.Timeout);
    }

    // Set up timeout
    const timeout = setTimeout(() => {
      this.clearTimer(matchId);
      onTimeout();
    }, remainingMs);

    this.timers.set(matchId, timeout as unknown as NodeJS.Timeout);
  }

  clearTimer(matchId: string): void {
    const timeout = this.timers.get(matchId);
    if (timeout) {
      clearTimeout(timeout);
      this.timers.delete(matchId);
    }

    const tickInterval = this.timers.get(`${matchId}_tick`);
    if (tickInterval) {
      clearInterval(tickInterval);
      this.timers.delete(`${matchId}_tick`);
    }
  }

  clearAllTimers(): void {
    this.timers.forEach((timer) => {
      if (timer) {
        clearTimeout(timer);
      }
    });
    this.timers.clear();
  }
}

// Export singleton instances
export const authService = AuthService.getInstance();
export const presenceService = PresenceService.getInstance();
export const matchmakingService = MatchmakingService.getInstance();
export const matchService = MatchService.getInstance();
export const questionService = QuestionService.getInstance();
export const timerService = TimerService.getInstance();
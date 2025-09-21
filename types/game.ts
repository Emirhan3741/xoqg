export interface Question {
  id: string;
  locale: string;
  category: QuestionCategory;
  difficulty: number; // 1-5
  type: 'mcq';
  prompt: string;
  options: string[]; // 4 options
  answer: string; // correct answer text
  approved: boolean;
  rand: number; // for random ordering
}

export type QuestionCategory = 
  | 'spor' 
  | 'tarih' 
  | 'coğrafya' 
  | 'bilim' 
  | 'sanat' 
  | 'eğlence' 
  | 'teknoloji' 
  | 'edebiyat'
  | 'genel kültür'
  | 'yabancı dil';

export interface RecentQuestions {
  ids: string[];
}

export interface Match {
  id: string;
  players: { A: string; B: string }; // UIDs
  board: BoardCell[];
  turnUid: string;
  turnDeadline: Date;
  seed: number;
  status: 'active' | 'finished' | 'timeout' | 'forfeit';
  winner?: 'A' | 'B' | 'draw';
  createdAt: Date;
  updatedAt: Date;
}

export interface BoardCell {
  cat: string;
  qid: string | null;
  state: 'empty' | 'A' | 'B';
}

export interface Move {
  id: string;
  uid: string;
  cellIndex: number;
  selectedText: string;
  isCorrect: boolean;
  createdAt: Date;
}

export interface PresenceData {
  state: 'online' | 'offline';
  lastSeen: number;
}

export interface QueueData {
  elo: number;
  ts: number;
}

export interface MatchmakingRequest {
  mode: 'general' | 'friend';
  targetUid?: string;
}

export interface MatchmakingResponse {
  matchId: string;
  opponent: {
    uid: string;
    name: string;
  };
}

export interface Player {
  id: string;
  name: string;
  symbol: 'X' | 'O';
  score: number;
  correctAnswers: number;
  totalAnswers: number;
}

export interface GameCell {
  id: number;
  question: Question;
  answeredBy: Player | null;
  isAnswered: boolean;
}

export interface GameState {
  board: GameCell[];
  currentPlayer: Player;
  players: [Player, Player];
  gameStatus: 'playing' | 'won' | 'draw';
  winner: Player | null;
  moveHistory: number[];
}

export interface GameStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  totalCorrectAnswers: number;
  totalQuestions: number;
  currentStreak: number;
  bestStreak: number;
}
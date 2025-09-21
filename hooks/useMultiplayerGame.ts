import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { Platform } from 'react-native';
import { 
  authService, 
  presenceService, 
  matchmakingService, 
  matchService, 
  timerService 
} from '@/services/multiplayer';
import { Match, Question, PresenceData } from '@/types/game';

interface MultiplayerGameState {
  // Auth state
  isAuthenticated: boolean;
  uid: string | null;
  
  // Matchmaking state
  isSearching: boolean;
  searchError: string | null;
  
  // Match state
  currentMatch: Match | null;
  matchError: string | null;
  
  // Question state
  currentQuestion: Question | null;
  isLoadingQuestion: boolean;
  usedQuestionIds: Set<string>;
  
  // Timer state
  timeRemaining: number;
  
  // Opponent presence
  opponentPresence: PresenceData | null;
}

const initialState: MultiplayerGameState = {
  isAuthenticated: false,
  uid: null,
  isSearching: false,
  searchError: null,
  currentMatch: null,
  matchError: null,
  currentQuestion: null,
  isLoadingQuestion: false,
  usedQuestionIds: new Set<string>(),
  timeRemaining: 0,
  opponentPresence: null,
};

export const [MultiplayerGameProvider, useMultiplayerGame] = createContextHook(() => {
  const [state, setState] = useState<MultiplayerGameState>(initialState);
  const [matchUnsubscribe, setMatchUnsubscribe] = useState<(() => void) | null>(null);
  const [presenceUnsubscribe, setPresenceUnsubscribe] = useState<(() => void) | null>(null);
  const [gameQuestions, setGameQuestions] = useState<Question[]>([]);

  // Load unique questions for the game
  const loadGameQuestions = useCallback(async () => {
    try {
      console.log('Loading unique questions for multiplayer game...');
      
      // Import Firebase service
      const { getNewGameQuestions } = await import('@/services/firebase');
      
      // Get fresh questions for this game session
      const questions = await getNewGameQuestions();
      
      // Convert to Question format
      const formattedQuestions: Question[] = questions.map((q, index) => ({
        id: q.id || `mp-${index}-${Date.now()}`,
        locale: 'tr',
        category: q.category as any,
        difficulty: 2,
        type: 'mcq' as const,
        prompt: q.question,
        options: q.options,
        answer: q.answer,
        approved: true,
        rand: Math.random()
      }));
      
      setGameQuestions(formattedQuestions);
      console.log(`Loaded ${formattedQuestions.length} unique questions for multiplayer game`);
      
      return formattedQuestions;
    } catch (error) {
      console.error('Failed to load game questions:', error);
      
      // Fallback to diverse mock questions
      const fallbackQuestions: Question[] = [
        {
          id: `fb-geo-${Date.now()}-1`,
          locale: 'tr',
          category: 'coğrafya',
          difficulty: 2,
          type: 'mcq',
          prompt: 'Türkiye\'nin başkenti neresidir?',
          options: ['İstanbul', 'Ankara', 'İzmir', 'Bursa'],
          answer: 'Ankara',
          approved: true,
          rand: Math.random()
        },
        {
          id: `fb-sport-${Date.now()}-2`,
          locale: 'tr',
          category: 'spor',
          difficulty: 2,
          type: 'mcq',
          prompt: 'Futbolda bir takımda kaç oyuncu sahada bulunur?',
          options: ['10', '11', '12', '9'],
          answer: '11',
          approved: true,
          rand: Math.random()
        },
        {
          id: `fb-art-${Date.now()}-3`,
          locale: 'tr',
          category: 'sanat',
          difficulty: 2,
          type: 'mcq',
          prompt: 'Mona Lisa tablosunu kim yapmıştır?',
          options: ['Picasso', 'Leonardo da Vinci', 'Van Gogh', 'Michelangelo'],
          answer: 'Leonardo da Vinci',
          approved: true,
          rand: Math.random()
        },
        {
          id: `fb-hist-${Date.now()}-4`,
          locale: 'tr',
          category: 'tarih',
          difficulty: 2,
          type: 'mcq',
          prompt: 'Osmanlı İmparatorluğu hangi yılda kuruldu?',
          options: ['1299', '1453', '1326', '1389'],
          answer: '1299',
          approved: true,
          rand: Math.random()
        },
        {
          id: `fb-sci-${Date.now()}-5`,
          locale: 'tr',
          category: 'bilim',
          difficulty: 2,
          type: 'mcq',
          prompt: 'Işığın hızı saniyede kaç kilometredir?',
          options: ['300.000 km', '299.792.458 km', '250.000 km', '350.000 km'],
          answer: '299.792.458 km',
          approved: true,
          rand: Math.random()
        },
        {
          id: `fb-tech-${Date.now()}-6`,
          locale: 'tr',
          category: 'teknoloji',
          difficulty: 2,
          type: 'mcq',
          prompt: 'İlk bilgisayar hangi yılda icat edildi?',
          options: ['1940', '1946', '1950', '1955'],
          answer: '1946',
          approved: true,
          rand: Math.random()
        },
        {
          id: `fb-geo2-${Date.now()}-7`,
          locale: 'tr',
          category: 'coğrafya',
          difficulty: 2,
          type: 'mcq',
          prompt: 'Dünyanın en büyük okyanusu hangisidir?',
          options: ['Atlantik', 'Pasifik', 'Hint', 'Arktik'],
          answer: 'Pasifik',
          approved: true,
          rand: Math.random()
        },
        {
          id: `fb-sci2-${Date.now()}-8`,
          locale: 'tr',
          category: 'bilim',
          difficulty: 2,
          type: 'mcq',
          prompt: 'Hangi gezegen Güneş\'e en yakındır?',
          options: ['Venüs', 'Mars', 'Merkür', 'Dünya'],
          answer: 'Merkür',
          approved: true,
          rand: Math.random()
        },
        {
          id: `fb-lit-${Date.now()}-9`,
          locale: 'tr',
          category: 'edebiyat',
          difficulty: 2,
          type: 'mcq',
          prompt: 'Shakespeare\'in en ünlü eseri hangisidir?',
          options: ['Hamlet', 'Romeo ve Juliet', 'Macbeth', 'Othello'],
          answer: 'Hamlet',
          approved: true,
          rand: Math.random()
        }
      ];
      
      setGameQuestions(fallbackQuestions);
      return fallbackQuestions;
    }
  }, []);

  // Initialize authentication
  const initialize = useCallback(async () => {
    try {
      console.log('Initializing multiplayer game...');
      const user = authService.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      await presenceService.initialize(user.uid);
      
      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        uid: user.uid
      }));
      
      console.log('Multiplayer game initialized for user:', user.uid);
    } catch (error) {
      console.error('Failed to initialize multiplayer game:', error);
      setState(prev => ({
        ...prev,
        matchError: 'Failed to initialize game'
      }));
    }
  }, []);

  // Start matchmaking
  const findMatch = useCallback(async () => {
    if (!state.isAuthenticated) {
      await initialize();
    }

    setState(prev => ({
      ...prev,
      isSearching: true,
      searchError: null
    }));

    try {
      console.log('Starting matchmaking...');
      
      // For demo purposes, we'll simulate finding a match
      // In production, this would call the actual matchmaking service
      if (Platform.OS === 'web') {
        // Mock match for web demo
        setTimeout(() => {
          const mockMatch: Match = {
            id: 'demo-match-' + Date.now(),
            players: { A: state.uid!, B: 'opponent-uid' },
            board: Array.from({ length: 9 }, (_, i) => ({
              cat: ['spor', 'tarih', 'coğrafya', 'bilim', 'sanat', 'eğlence', 'teknoloji', 'edebiyat'][i % 8],
              qid: null,
              state: 'empty' as const
            })),
            turnUid: state.uid!,
            turnDeadline: new Date(Date.now() + 10000), // 10 seconds
            seed: Math.random(),
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
          };

          setState(prev => ({
            ...prev,
            isSearching: false,
            currentMatch: mockMatch,
            usedQuestionIds: new Set<string>() // Reset used questions for new match
          }));
          
          // Load questions for this match
          loadGameQuestions();

          // Start timer
          timerService.startTimer(
            mockMatch.id,
            mockMatch.turnDeadline,
            () => {
              console.log('Turn timeout!');
              setState(prev => ({
                ...prev,
                timeRemaining: 0
              }));
            },
            (remaining) => {
              setState(prev => ({
                ...prev,
                timeRemaining: Math.ceil(remaining / 1000)
              }));
            }
          );
        }, 2000);
        return;
      }

      const result = await matchmakingService.joinQueue('general');
      console.log('Join queue result:', result);
      
      if (result.matchId) {
        console.log('Match found:', result.matchId);
      } else {
        console.log('Added to queue, waiting for match...');
        // In a real implementation, you'd listen for match notifications
        return;
      }
      
      setState(prev => ({
        ...prev,
        isSearching: false
      }));

      // Subscribe to match updates
      const unsubscribe = matchService.subscribeToMatch(result.matchId!, (match) => {
        if (match) {
          setState(prev => ({
            ...prev,
            currentMatch: match
          }));

          // Start timer for current turn
          if (match.status === 'active') {
            timerService.startTimer(
              match.id,
              match.turnDeadline,
              () => {
                console.log('Turn timeout!');
                setState(prev => ({
                  ...prev,
                  timeRemaining: 0
                }));
              },
              (remaining) => {
                setState(prev => ({
                  ...prev,
                  timeRemaining: Math.ceil(remaining / 1000)
                }));
              }
            );
          }

          // Subscribe to opponent presence
          const opponentUid = match.players.A === state.uid ? match.players.B : match.players.A;
          const presenceUnsub = presenceService.subscribeToPresence(opponentUid, (presence) => {
            setState(prev => ({
              ...prev,
              opponentPresence: presence
            }));
          });
          setPresenceUnsubscribe(() => presenceUnsub);
        }
      });
      
      setMatchUnsubscribe(() => unsubscribe);
      
    } catch (error: any) {
      console.error('Matchmaking failed:', error);
      
      // If Firebase Functions are not available, fall back to demo mode
      if (error?.message?.includes('Firebase Functions') || error?.message?.includes('Server error')) {
        console.log('Firebase Functions not available, falling back to demo mode');
        
        // Create a mock match for demo purposes
        setTimeout(() => {
          const mockMatch: Match = {
            id: 'demo-match-' + Date.now(),
            players: { A: state.uid!, B: 'demo-opponent' },
            board: Array.from({ length: 9 }, (_, i) => ({
              cat: ['spor', 'tarih', 'coğrafya', 'bilim', 'sanat', 'eğlence', 'teknoloji', 'edebiyat'][i % 8],
              qid: null,
              state: 'empty' as const
            })),
            turnUid: state.uid!,
            turnDeadline: new Date(Date.now() + 30000), // 30 seconds
            seed: Math.random(),
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
          };

          setState(prev => ({
            ...prev,
            isSearching: false,
            currentMatch: mockMatch,
            usedQuestionIds: new Set<string>() // Reset used questions for new match
          }));
          
          // Load questions for this match
          loadGameQuestions();

          // Start timer
          timerService.startTimer(
            mockMatch.id,
            mockMatch.turnDeadline,
            () => {
              console.log('Turn timeout!');
              setState(prev => ({
                ...prev,
                timeRemaining: 0
              }));
            },
            (remaining) => {
              setState(prev => ({
                ...prev,
                timeRemaining: Math.ceil(remaining / 1000)
              }));
            }
          );
        }, 2000);
        return;
      }
      
      setState(prev => ({
        ...prev,
        isSearching: false,
        searchError: error?.message || 'Failed to find match'
      }));
    }
  }, [state.isAuthenticated, state.uid, initialize, loadGameQuestions]);

  // Cancel matchmaking
  const cancelSearch = useCallback(async () => {
    try {
      await matchmakingService.leaveQueue();
      setState(prev => ({
        ...prev,
        isSearching: false,
        searchError: null
      }));
    } catch (error: any) {
      console.error('Failed to cancel search:', error);
      // Even if leaving queue fails, we should still update the local state
      setState(prev => ({
        ...prev,
        isSearching: false,
        searchError: null
      }));
    }
  }, []);

  // Load question for a cell
  const loadQuestion = useCallback(async (cellIndex: number) => {
    if (!state.currentMatch) return;

    setState(prev => ({
      ...prev,
      isLoadingQuestion: true
    }));

    try {
      // Ensure we have questions loaded
      let questions = gameQuestions;
      if (questions.length === 0) {
        questions = await loadGameQuestions();
      }
      
      // Find an unused question for this cell
      const availableQuestions = questions.filter(q => !state.usedQuestionIds.has(q.id));
      
      let selectedQuestion: Question;
      
      if (availableQuestions.length > 0) {
        // Select a random unused question
        const randomIndex = Math.floor(Math.random() * availableQuestions.length);
        selectedQuestion = availableQuestions[randomIndex];
        
        // Mark this question as used
        setState(prev => ({
          ...prev,
          currentQuestion: selectedQuestion,
          isLoadingQuestion: false,
          usedQuestionIds: new Set([...prev.usedQuestionIds, selectedQuestion.id])
        }));
        
        console.log(`Selected unused question: ${selectedQuestion.id} (${availableQuestions.length} remaining)`);
      } else {
        // All questions used, need to reload new questions
        console.log('All questions used, loading new set...');
        const newQuestions = await loadGameQuestions();
        
        if (newQuestions.length > 0) {
          selectedQuestion = newQuestions[cellIndex % newQuestions.length];
          
          setState(prev => ({
            ...prev,
            currentQuestion: selectedQuestion,
            isLoadingQuestion: false,
            usedQuestionIds: new Set([selectedQuestion.id]) // Reset used questions with this one
          }));
          
          console.log(`Selected question from new set: ${selectedQuestion.id}`);
        } else {
          throw new Error('No questions available');
        }
      }

      if (Platform.OS !== 'web') {
        try {
          const serverQuestion = await matchService.getQuestion(state.currentMatch.id, cellIndex);
          setState(prev => ({
            ...prev,
            currentQuestion: serverQuestion,
            isLoadingQuestion: false
          }));
        } catch (error) {
          console.error('Failed to get question from server, using local:', error);
          // Continue with local question selection
        }
      }
    } catch (error) {
      console.error('Failed to load question:', error);
      setState(prev => ({
        ...prev,
        isLoadingQuestion: false,
        matchError: 'Failed to load question'
      }));
    }
  }, [state.currentMatch, state.usedQuestionIds, gameQuestions, loadGameQuestions]);

  // Submit answer
  const submitAnswer = useCallback(async (selectedText: string) => {
    if (!state.currentMatch || !state.currentQuestion) return false;
    
    // Input validation
    if (!selectedText?.trim()) {
      console.warn('Empty answer submitted');
      return false;
    }
    
    const sanitizedAnswer = selectedText.trim();
    if (sanitizedAnswer.length > 100) {
      console.warn('Answer too long');
      return false;
    }

    try {
      // For demo purposes, simulate answer validation
      const isCorrect = sanitizedAnswer === state.currentQuestion.answer;
      
      console.log('Answer submitted:', sanitizedAnswer, 'Correct:', isCorrect);
      
      // Clear current question
      setState(prev => ({
        ...prev,
        currentQuestion: null
      }));

      if (Platform.OS !== 'web') {
        try {
          const result = await matchService.submitMove(
            state.currentMatch.id,
            0, // cellIndex would be tracked separately
            0 // answerIndex - would need to be calculated from sanitizedAnswer
          );
          return result.correct; // Use 'correct' instead of 'isCorrect'
        } catch (error) {
          console.error('Failed to submit move to server, using local validation:', error);
          // Fall back to local validation if server fails
        }
      }

      return isCorrect;
    } catch (error) {
      console.error('Failed to submit answer:', error);
      setState(prev => ({
        ...prev,
        matchError: 'Failed to submit answer'
      }));
      return false;
    }
  }, [state.currentMatch, state.currentQuestion]);

  // Forfeit match
  const forfeitMatch = useCallback(async () => {
    if (!state.currentMatch) return;

    try {
      if (Platform.OS !== 'web') {
        try {
          await matchService.forfeitMatch(state.currentMatch.id);
        } catch (error) {
          console.error('Failed to forfeit match on server:', error);
          // Continue with local cleanup even if server call fails
        }
      }
      
      // Clean up
      if (matchUnsubscribe) {
        matchUnsubscribe();
        setMatchUnsubscribe(null);
      }
      if (presenceUnsubscribe) {
        presenceUnsubscribe();
        setPresenceUnsubscribe(null);
      }
      timerService.clearTimer(state.currentMatch.id);
      
      setState(prev => ({
        ...prev,
        currentMatch: null,
        currentQuestion: null,
        timeRemaining: 0,
        opponentPresence: null,
        usedQuestionIds: new Set<string>() // Reset used questions
      }));
      
      // Clear game questions
      setGameQuestions([]);
    } catch (error) {
      console.error('Failed to forfeit match:', error);
    }
  }, [state.currentMatch, matchUnsubscribe, presenceUnsubscribe]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (matchUnsubscribe) {
        matchUnsubscribe();
      }
      if (presenceUnsubscribe) {
        presenceUnsubscribe();
      }
      timerService.clearAllTimers();
    };
  }, [matchUnsubscribe, presenceUnsubscribe]);

  // Computed values
  const isMyTurn = useMemo(() => {
    return state.currentMatch?.turnUid === state.uid;
  }, [state.currentMatch?.turnUid, state.uid]);

  const myPlayerSymbol = useMemo(() => {
    if (!state.currentMatch || !state.uid) return null;
    return state.currentMatch.players.A === state.uid ? 'A' : 'B';
  }, [state.currentMatch, state.uid]);

  const opponentPlayerSymbol = useMemo(() => {
    if (!state.currentMatch || !state.uid) return null;
    return state.currentMatch.players.A === state.uid ? 'B' : 'A';
  }, [state.currentMatch, state.uid]);

  return useMemo(() => ({
    // State
    ...state,
    
    // Computed values
    isMyTurn,
    myPlayerSymbol,
    opponentPlayerSymbol,
    
    // Actions
    initialize,
    findMatch,
    cancelSearch,
    loadQuestion,
    loadGameQuestions,
    submitAnswer,
    forfeitMatch,
  }), [
    state,
    isMyTurn,
    myPlayerSymbol,
    opponentPlayerSymbol,
    initialize,
    findMatch,
    cancelSearch,
    loadQuestion,
    loadGameQuestions,
    submitAnswer,
    forfeitMatch,
  ]);
});
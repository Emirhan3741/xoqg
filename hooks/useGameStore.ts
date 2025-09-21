import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo } from 'react';
import { GameState, Player, GameCell, GameStats } from '@/types/game';
// import { getBoardQuestions, submitMove } from '@/services/api'; // Artık kullanmıyoruz
// import { getRandomCategories } from '@/constants/categories'; // Artık kullanmıyoruz
import { getNewGameQuestions } from '@/services/firebase';





const createPlayer = (name: string, symbol: 'X' | 'O'): Player => ({
  id: Math.random().toString(36).substr(2, 9),
  name,
  symbol,
  score: 0,
  correctAnswers: 0,
  totalAnswers: 0,
});

const checkWinner = (board: GameCell[]): Player | null => {
  const winPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6] // diagonals
  ];

  for (const pattern of winPatterns) {
    const [a, b, c] = pattern;
    if (
      board[a].isAnswered &&
      board[b].isAnswered &&
      board[c].isAnswered &&
      board[a].answeredBy?.symbol === board[b].answeredBy?.symbol &&
      board[b].answeredBy?.symbol === board[c].answeredBy?.symbol
    ) {
      return board[a].answeredBy;
    }
  }

  return null;
};

const isDraw = (board: GameCell[]): boolean => {
  return board.every(cell => cell.isAnswered) && !checkWinner(board);
};

export const [GameProvider, useGame] = createContextHook(() => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState<boolean>(false);
  const [questionLoadError, setQuestionLoadError] = useState<string | null>(null);
  const [isAutoRestarting, setIsAutoRestarting] = useState<boolean>(false);
  const [stats, setStats] = useState<GameStats>({
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    totalCorrectAnswers: 0,
    totalQuestions: 0,
    currentStreak: 0,
    bestStreak: 0,
  });

  const createInitialBoard = useCallback(async (): Promise<GameCell[]> => {
    try {
      console.log('Yeni oyun için 9 kare sorular yükleniyor...');
      setIsLoadingQuestions(true);
      setQuestionLoadError(null);
      
      // Timeout ile soru yükleme
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Soru yükleme zaman aşımına uğradı')), 12000); // 12 saniye
      });
      
      const questions = await Promise.race([
        getNewGameQuestions(),
        timeoutPromise
      ]);
      
      // Tam olarak 9 soru olduğundan emin ol
      const gameQuestions = questions.slice(0, 9);
      
      // Eğer 9'dan az soru varsa, fallback sorularla tamamla
      while (gameQuestions.length < 9) {
        const fallbackIndex = gameQuestions.length;
        gameQuestions.push({
          id: `fallback-${fallbackIndex}`,
          category: 'genel kültür',
          question: `Fallback soru ${fallbackIndex + 1}`,
          options: ['A', 'B', 'C', 'D'],
          answer: 'A'
        });
      }
      
      console.log(`Oyun tahtası için ${gameQuestions.length} soru hazırlandı`);
      
      setIsLoadingQuestions(false);
      
      return gameQuestions.map((q, index) => ({
        id: index,
        question: {
          id: q.id,
          locale: 'tr',
          category: q.category as any,
          difficulty: 3, // Varsayılan zorluk
          type: 'mcq' as const,
          prompt: q.question,
          options: q.options,
          answer: q.answer, // Doğru cevabı sakla (client-side oyun için)
          approved: true,
          rand: Math.random()
        },
        answeredBy: null,
        isAnswered: false,
      }));
    } catch (error) {
      console.error('Sorular yüklenirken hata:', error);
      setIsLoadingQuestions(false);
      
      // Hata tipine göre daha spesifik mesajlar
      let errorMessage = 'Sorular yüklenirken bir hata oluştu.';
      if (error instanceof Error) {
        if (error.message.includes('zaman aşımı')) {
          errorMessage = 'Soru yükleme zaman aşımına uğradı. Lütfen internet bağlantınızı kontrol edin.';
        } else if (error.message.includes('Firebase')) {
          errorMessage = 'Veritabanı bağlantısı kurulamadı. Lütfen daha sonra tekrar deneyin.';
        } else {
          errorMessage = 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.';
        }
      }
      
      setQuestionLoadError(errorMessage);
      
      // Fallback to 9 working questions
      const fallbackQuestions = [
        { question: 'Türkiye\'nin başkenti neresidir?', options: ['İstanbul', 'Ankara', 'İzmir', 'Bursa'], answer: 'Ankara', category: 'coğrafya' },
        { question: 'Futbolda bir takımda kaç oyuncu sahada bulunur?', options: ['10', '11', '12', '9'], answer: '11', category: 'spor' },
        { question: 'Mona Lisa tablosunu kim yapmıştır?', options: ['Picasso', 'Leonardo da Vinci', 'Van Gogh', 'Michelangelo'], answer: 'Leonardo da Vinci', category: 'sanat' },
        { question: 'Osmanlı İmparatorluğu hangi yılda kurulmuştur?', options: ['1299', '1453', '1326', '1389'], answer: '1299', category: 'tarih' },
        { question: 'Işığın hızı saniyede kaç kilometredir?', options: ['300.000 km', '299.792.458 km', '250.000 km', '350.000 km'], answer: '299.792.458 km', category: 'bilim' },
        { question: 'İlk bilgisayar hangi yılda icat edilmiştir?', options: ['1940', '1946', '1950', '1955'], answer: '1946', category: 'teknoloji' },
        { question: 'Dünyanın en büyük okyanusu hangisidir?', options: ['Atlantik', 'Pasifik', 'Hint', 'Arktik'], answer: 'Pasifik', category: 'coğrafya' },
        { question: 'Hangi gezegen Güneş\'e en yakındır?', options: ['Venüs', 'Mars', 'Merkür', 'Dünya'], answer: 'Merkür', category: 'bilim' },
        { question: 'Shakespeare\'in en ünlü eseri hangisidir?', options: ['Hamlet', 'Romeo ve Juliet', 'Macbeth', 'Othello'], answer: 'Hamlet', category: 'edebiyat' }
      ];
      
      return fallbackQuestions.map((q, index) => ({
        id: index,
        question: {
          id: `fallback-${index}`,
          locale: 'tr',
          category: q.category as any,
          difficulty: 2,
          type: 'mcq' as const,
          prompt: q.question,
          options: q.options,
          answer: q.answer,
          approved: true,
          rand: Math.random()
        },
        answeredBy: null,
        isAnswered: false,
      }));
    } finally {
      setIsLoadingQuestions(false);
    }
  }, []);

    const loadStats = useCallback(async () => {
      console.log('Loading stats from storage');
    // TODO: AsyncStorage'dan istatistikleri yükle
    }, []);

    const saveStats = useCallback(async (newStats: GameStats) => {
      if (!newStats || typeof newStats !== 'object') {
        console.error('Invalid stats data');
        return;
      }
      if (newStats.gamesPlayed < 0 || newStats.wins < 0 || newStats.losses < 0 || newStats.draws < 0) {
        console.error('Invalid stats values');
        return;
      }
      setStats(newStats);
      console.log('Stats saved:', newStats);
    }, []);



    const autoRestartAfterDraw = useCallback(async (player1Name: string, player2Name: string, currentPlayers: [Player, Player]) => {
      console.log('Oyun berabere bitti, yeni sorularla devam ediliyor...');
      setIsAutoRestarting(true);
      setQuestionLoadError(null);
      
      try {
        // Create new board with completely fresh questions
        console.log('Beraberlik sonrası yeni sorular yükleniyor...');
        const newBoard = await createInitialBoard();
        
        // Keep the same players but reset their game-specific stats
        const updatedPlayers: [Player, Player] = [
          {
            ...currentPlayers[0],
            correctAnswers: 0,
            totalAnswers: 0,
          },
          {
            ...currentPlayers[1], 
            correctAnswers: 0,
            totalAnswers: 0,
          }
        ];
        
        // Start new game with same players but fresh questions
        setGameState({
          board: newBoard,
          currentPlayer: updatedPlayers[0], // Always start with player 1
          players: updatedPlayers,
          gameStatus: 'playing',
          winner: null,
          moveHistory: [],
        });
        
        console.log('Beraberlik sonrası yeni oyun başlatıldı - aynı oyuncular, tamamen yeni sorular');
      } catch (error) {
        console.error('Otomatik yeniden başlatma hatası:', error);
        setQuestionLoadError('Yeni sorular yüklenirken hata oluştu. Lütfen tekrar deneyin.');
      } finally {
        setIsAutoRestarting(false);
      }
    }, [createInitialBoard]);

    const startNewGame = useCallback(async (player1Name: string, player2Name: string) => {
      const sanitizedPlayer1Name = player1Name?.trim() || 'Player 1';
      const sanitizedPlayer2Name = player2Name?.trim() || 'Player 2';
      
      if (sanitizedPlayer1Name.length > 20) {
        console.error('Player 1 name too long');
        return;
      }
      if (sanitizedPlayer2Name.length > 20) {
        console.error('Player 2 name too long');
        return;
      }

      console.log('Yeni oyun başlatılıyor, tamamen yeni sorular yükleniyor...');
      setQuestionLoadError(null);
      
      const player1 = createPlayer(sanitizedPlayer1Name, 'X');
      const player2 = createPlayer(sanitizedPlayer2Name, 'O');
      
      // Her yeni oyun için tamamen yeni sorular yükle
      const board = await createInitialBoard();

      setGameState({
        board,
        currentPlayer: player1,
        players: [player1, player2],
        gameStatus: 'playing',
        winner: null,
        moveHistory: [],
      });
      
      console.log('Yeni oyun başarıyla başlatıldı');
    }, [createInitialBoard]);

    const answerQuestion = useCallback(async (cellId: number, selectedAnswer: string) => {
    if (!gameState || gameState.gameStatus !== 'playing') return;

    try {
      const newGameState = { ...gameState };
      const cell = newGameState.board[cellId];
      
      // Client-side cevap kontrolü
      const isCorrect = cell.question.answer === selectedAnswer;
      
      // Update player stats
      const currentPlayerIndex = newGameState.players.findIndex(p => p.id === newGameState.currentPlayer.id);
      newGameState.players[currentPlayerIndex].totalAnswers++;
      
      if (isCorrect) {
        // Mark cell as answered by current player
        cell.isAnswered = true;
        cell.answeredBy = newGameState.currentPlayer;
        
        // Update player score and correct answers
        newGameState.players[currentPlayerIndex].correctAnswers++;
        newGameState.players[currentPlayerIndex].score += 10;
        
        // Add to move history
        newGameState.moveHistory.push(cellId);
        
        // Check for winner
        const winner = checkWinner(newGameState.board);
        if (winner) {
          newGameState.gameStatus = 'won';
          newGameState.winner = winner;
          // Winner gets bonus points
          const winnerIndex = newGameState.players.findIndex(p => p.id === winner.id);
          newGameState.players[winnerIndex].score += 50;
        } else if (isDraw(newGameState.board)) {
          newGameState.gameStatus = 'draw';
          // Both players get draw points
          newGameState.players[0].score += 20;
          newGameState.players[1].score += 20;
        }
      }
      
      // Switch to next player (regardless of correct/incorrect answer)
      const nextPlayerIndex = currentPlayerIndex === 0 ? 1 : 0;
      newGameState.currentPlayer = newGameState.players[nextPlayerIndex];
      
      setGameState(newGameState);
      
      // Update stats if game ended
      if (newGameState.gameStatus !== 'playing') {
        const newStats = { ...stats };
        newStats.gamesPlayed++;
        newStats.totalQuestions += newGameState.players[0].totalAnswers + newGameState.players[1].totalAnswers;
        newStats.totalCorrectAnswers += newGameState.players[0].correctAnswers + newGameState.players[1].correctAnswers;
        
        if (newGameState.gameStatus === 'won') {
          // Assuming player 1 is the human player for stats
          if (newGameState.winner?.symbol === 'X') {
            newStats.wins++;
            newStats.currentStreak++;
            if (newStats.currentStreak > newStats.bestStreak) {
              newStats.bestStreak = newStats.currentStreak;
            }
          } else {
            newStats.losses++;
            newStats.currentStreak = 0;
          }
        } else if (newGameState.gameStatus === 'draw') {
          newStats.draws++;
          // Auto-restart game with new questions if it's a draw
          console.log('Oyun berabere bitti, 3 saniye sonra yeni sorularla devam edilecek');
          setTimeout(() => {
            autoRestartAfterDraw(newGameState.players[0].name, newGameState.players[1].name, newGameState.players);
          }, 3000); // Wait 3 seconds before auto-restart to show draw result
        }
        
        saveStats(newStats);
      }
      
      console.log(`Soru cevaplandı: ${isCorrect ? 'Doğru' : 'Yanlış'} - ${selectedAnswer}`);
      return isCorrect;
    } catch (error) {
      console.error('Cevap işlenirken hata:', error);
      return false;
    }
    }, [gameState, stats, saveStats, autoRestartAfterDraw]);



    const resetGame = useCallback(() => {
      setGameState(null);
      setIsAutoRestarting(false);
    }, []);

  return useMemo(() => ({
    gameState,
    stats,
    isLoadingQuestions,
    questionLoadError,
    isAutoRestarting,
    startNewGame,
    answerQuestion,
    resetGame,
    loadStats,
  }), [gameState, stats, isLoadingQuestions, questionLoadError, isAutoRestarting, startNewGame, answerQuestion, resetGame, loadStats]);
});
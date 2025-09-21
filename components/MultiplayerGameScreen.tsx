import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, MoreHorizontal, Home, MessageCircle, Clock, Wifi, WifiOff } from 'lucide-react-native';
import { useMultiplayerGame } from '@/hooks/useMultiplayerGame';
import { GameBoard } from './GameBoard';
import { QuestionModal } from './QuestionModal';
import { GameCell } from '@/types/game';

interface MultiplayerGameScreenProps {
  onBack: () => void;
  onHome: () => void;
}

export function MultiplayerGameScreen({ onBack, onHome }: MultiplayerGameScreenProps) {
  const insets = useSafeAreaInsets();
  const [selectedCell, setSelectedCell] = useState<number | null>(null);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  
  const {
    currentMatch,
    currentQuestion,
    isLoadingQuestion,
    timeRemaining,
    isMyTurn,
    myPlayerSymbol,
    opponentPlayerSymbol,
    opponentPresence,
    loadQuestion,
    submitAnswer,
    forfeitMatch,
  } = useMultiplayerGame();

  // Convert match board to GameCell format for compatibility
  const gameBoard: GameCell[] = currentMatch?.board.map((cell, index) => ({
    id: index,
    question: {
      id: cell.qid || `cell-${index}`,
      locale: 'tr',
      category: cell.cat as any,
      difficulty: 1,
      type: 'mcq' as const,
      prompt: `${cell.cat} sorusu`,
      options: ['A', 'B', 'C', 'D'],
      answer: 'A',
      approved: true,
      rand: Math.random()
    },
    answeredBy: cell.state === 'empty' ? null : {
      id: cell.state === 'A' ? currentMatch.players.A : currentMatch.players.B,
      name: cell.state === 'A' ? 'Player A' : 'Player B',
      symbol: cell.state === 'A' ? 'X' : 'O',
      score: 0,
      correctAnswers: 0,
      totalAnswers: 0,
    },
    isAnswered: cell.state !== 'empty',
  })) || [];

  const handleCellPress = async (cellId: number) => {
    if (!currentMatch || !isMyTurn) return;
    
    const cell = currentMatch.board[cellId];
    if (cell.state !== 'empty') return;

    setSelectedCell(cellId);
    await loadQuestion(cellId);
    setShowQuestionModal(true);
  };

  const handleAnswer = async (selectedAnswer: string) => {
    if (selectedCell !== null && selectedAnswer?.trim()) {
      const isCorrect = await submitAnswer(selectedAnswer.trim());
      console.log('Answer result:', isCorrect);
    }
    setShowQuestionModal(false);
    setSelectedCell(null);
  };

  const handleForfeit = async () => {
    // For web compatibility, use a simple confirm
    const shouldForfeit = confirm('Oyundan çıkmak istediğinizden emin misiniz? Bu durumda kaybetmiş sayılacaksınız.');
    if (shouldForfeit) {
      await forfeitMatch();
      onBack();
    }
  };

  if (!currentMatch) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#F7F3FF', '#E9E1F8']} style={styles.gradientBackground}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Maç yükleniyor...</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  const isOpponentOnline = opponentPresence?.state === 'online';

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#F7F3FF', '#E9E1F8']} style={styles.gradientBackground}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity style={styles.headerButton} onPress={handleForfeit}>
            <ArrowLeft size={24} color="#120d1b" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>
              <Text style={styles.xLetter}>X</Text>
              <Text style={styles.dashText}>-</Text>
              <Text style={styles.oLetter}>O</Text>
              <Text style={styles.quizText}> Quiz Game</Text>
            </Text>
          </View>
          <TouchableOpacity style={styles.headerButton}>
            <MoreHorizontal size={24} color="#120d1b" />
          </TouchableOpacity>
        </View>

        {/* Players */}
        <View style={styles.playersContainer}>
          <View style={styles.playerCard}>
            <View style={styles.playerAvatar}>
              <Text style={styles.playerSymbol}>
                {myPlayerSymbol === 'A' ? 'X' : 'O'}
              </Text>
            </View>
            <Text style={styles.playerName}>Sen</Text>
            <View style={styles.playerStatus}>
              <Wifi size={16} color="#4ade80" />
            </View>
          </View>
          
          <Text style={styles.vsText}>VS</Text>
          
          <View style={styles.playerCard}>
            <View style={styles.playerAvatar}>
              <Text style={styles.playerSymbol}>
                {opponentPlayerSymbol === 'A' ? 'X' : 'O'}
              </Text>
            </View>
            <Text style={styles.playerName}>Rakip</Text>
            <View style={styles.playerStatus}>
              {isOpponentOnline ? (
                <Wifi size={16} color="#4ade80" />
              ) : (
                <WifiOff size={16} color="#ef4444" />
              )}
            </View>
          </View>
        </View>

        {/* Turn Indicator */}
        <View style={styles.turnContainer}>
          <View style={styles.turnIndicator}>
            <Clock size={20} color="#6c2bee" />
            <Text style={styles.turnText}>
              {isMyTurn ? 'Senin sıran' : 'Rakibin sırası'}
            </Text>
            <Text style={styles.timerText}>{timeRemaining}s</Text>
          </View>
        </View>

        {/* Game Board */}
        <View style={styles.boardContainer}>
          <GameBoard
            board={gameBoard}
            onCellPress={handleCellPress}
            disabled={!isMyTurn || currentMatch.status !== 'active'}
          />
        </View>

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.footerButtons}>
            <TouchableOpacity style={styles.iconButton} onPress={onHome}>
              <Home size={24} color="#120d1b" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <MessageCircle size={24} color="#6c2bee" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <QuestionModal
        visible={showQuestionModal}
        question={currentQuestion}
        onAnswer={handleAnswer}
        onClose={() => {
          setShowQuestionModal(false);
          setSelectedCell(null);
        }}
        playerName="Sen"
        playerSymbol={myPlayerSymbol === 'A' ? 'X' : 'O'}
        timeLimit={10}
        isLoading={isLoadingQuestion}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F3FF',
  },
  gradientBackground: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#120d1b',
    fontWeight: '600' as const,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600' as const,
    letterSpacing: -0.5,
    textAlign: 'center' as const,
  },
  xLetter: {
    color: '#ff5555',
    fontWeight: '900' as const,
  },
  oLetter: {
    color: '#55aaff',
    fontWeight: '900' as const,
  },
  dashText: {
    color: '#120d1b',
    fontWeight: '600' as const,
  },
  quizText: {
    color: '#120d1b',
    fontWeight: '600' as const,
  },
  playersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  playerCard: {
    alignItems: 'center',
    flex: 1,
  },
  playerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6c2bee',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  playerSymbol: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#ffffff',
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#120d1b',
    marginBottom: 4,
  },
  playerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vsText: {
    fontSize: 24,
    fontWeight: '900' as const,
    color: '#120d1b',
    marginHorizontal: 16,
  },
  turnContainer: {
    marginHorizontal: 24,
    marginBottom: 24,
  },
  turnIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  turnText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#120d1b',
    marginLeft: 8,
    flex: 1,
  },
  timerText: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: '#6c2bee',
  },
  boardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    paddingHorizontal: 24,
  },
  footerButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  iconButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
});
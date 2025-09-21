import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GameProvider, useGame } from '@/hooks/useGameStore';
import { MultiplayerGameProvider } from '@/hooks/useMultiplayerGame';
import { GameSetup } from '@/components/GameSetup';
import { PlayerCard } from '@/components/PlayerCard';
import { QuestionModal } from '@/components/QuestionModal';
import { GameOverModal } from '@/components/GameOverModal';
import { GameBoard } from '@/components/GameBoard';
import { MatchmakingScreen } from '@/components/MatchmakingScreen';
import { MultiplayerGameScreen } from '@/components/MultiplayerGameScreen';
import { AIBotGame } from '@/components/AIBotGame';
import { AIQuestionGenerator } from '@/components/AIQuestionGenerator';

import { ArrowLeft, MoreHorizontal, Home, MessageCircle } from 'lucide-react-native';


type GameMode = 'menu' | 'singleplayer' | 'matchmaking' | 'multiplayer' | 'aibot' | 'aiquestions';

function GameScreen() {
  const { gameState, stats, isLoadingQuestions, questionLoadError, isAutoRestarting, startNewGame, answerQuestion, resetGame, loadStats } = useGame();
  const [selectedCell, setSelectedCell] = useState<number | null>(null);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [gameMode, setGameMode] = useState<GameMode>('menu');
  const insets = useSafeAreaInsets();


  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleCellPress = (cellId: number) => {
    if (!gameState || gameState.gameStatus !== 'playing') return;
    
    const cell = gameState.board[cellId];
    if (cell.isAnswered) return;

    setSelectedCell(cellId);
    setShowQuestionModal(true);
  };

  const handleAnswer = async (selectedAnswer: string) => {
    if (selectedCell !== null && selectedAnswer?.trim()) {
      await answerQuestion(selectedCell, selectedAnswer.trim());
    }
    setShowQuestionModal(false);
    setSelectedCell(null);
  };

  const handlePlayAgain = async () => {
    if (gameState) {
      await startNewGame(gameState.players[0].name, gameState.players[1].name);
    }
  };

  const handleNewGame = () => {
    resetGame();
    setGameMode('menu');
  };

  const selectedQuestion = selectedCell !== null && gameState 
    ? gameState.board[selectedCell].question 
    : null;

  // Game mode selection menu
  if (gameMode === 'menu') {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#F7F3FF', '#E9E1F8']}
          style={styles.gradientBackground}
        >
          <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
            <View style={styles.headerButton} />
            <View style={styles.titleContainer}>
              <Text style={styles.headerTitle}>
                <Text style={styles.xLetter}>X</Text>
                <Text style={styles.dashText}>-</Text>
                <Text style={styles.oLetter}>O</Text>
                <Text style={styles.quizText}> Quiz Game</Text>
              </Text>
            </View>
            <View style={styles.headerButton} />
          </View>

          <View style={styles.menuContainer}>
            <Text style={styles.menuTitle}>Oyun Modu Seç</Text>

            {/* Single Player */}
            <TouchableOpacity
              style={styles.modeButton}
              onPress={() => setGameMode('singleplayer')}
            >
              <View style={styles.modeIcon}>
                <Text style={styles.modeEmoji}>🎯</Text>
              </View>
              <View style={styles.modeContent}>
                <Text style={styles.modeTitle}>Tek Oyuncu</Text>
                <Text style={styles.modeDescription}>
                  Karışık kategorilerle pratik yap
                </Text>
              </View>
            </TouchableOpacity>

            {/* Multiplayer */}
            <TouchableOpacity
              style={styles.modeButton}
              onPress={() => setGameMode('matchmaking')}
            >
              <View style={styles.modeIcon}>
                <Text style={styles.modeEmoji}>⚔️</Text>
              </View>
              <View style={styles.modeContent}>
                <Text style={styles.modeTitle}>Çok Oyunculu</Text>
                <Text style={styles.modeDescription}>
                  Eşleş, 3×3 tahtada sırayla soruları çöz!
                </Text>
              </View>
            </TouchableOpacity>

            {/* AI Bot */}
            <TouchableOpacity
              style={styles.modeButton}
              onPress={() => setGameMode('aibot')}
            >
              <View style={styles.modeIcon}>
                <Text style={styles.modeEmoji}>🤖</Text>
              </View>
              <View style={styles.modeContent}>
                <Text style={styles.modeTitle}>AI Bot ile Oyna</Text>
                <Text style={styles.modeDescription}>
                  ChatGPT destekli akıllı bot ile X-O oyna
                </Text>
              </View>
            </TouchableOpacity>

            {/* AI Question Generator */}
            <TouchableOpacity
              style={styles.modeButton}
              onPress={() => setGameMode('aiquestions')}
            >
              <View style={styles.modeIcon}>
                <Text style={styles.modeEmoji}>🧠</Text>
              </View>
              <View style={styles.modeContent}>
                <Text style={styles.modeTitle}>AI Soru Üreticisi</Text>
                <Text style={styles.modeDescription}>
                  ChatGPT ile otomatik soru üret ve test et
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }

  // Matchmaking screen
  if (gameMode === 'matchmaking') {
    return (
      <MatchmakingScreen 
        onBack={() => setGameMode('menu')}
        onMatchFound={() => setGameMode('multiplayer')}
      />
    );
  }

  // Multiplayer game screen
  if (gameMode === 'multiplayer') {
    return (
      <MultiplayerGameScreen 
        onBack={() => setGameMode('menu')}
        onHome={() => setGameMode('menu')}
      />
    );
  }

  // AI Bot game screen
  if (gameMode === 'aibot') {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#F7F3FF', '#E9E1F8']}
          style={styles.gradientBackground}
        >
          <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
            <TouchableOpacity style={styles.headerButton} onPress={() => setGameMode('menu')}>
              <ArrowLeft size={24} color="#120d1b" />
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <Text style={styles.headerTitle}>AI Bot Oyunu</Text>
            </View>
            <View style={styles.headerButton} />
          </View>
          <AIBotGame onGameEnd={() => {}} />
        </LinearGradient>
      </View>
    );
  }

  // AI Question Generator screen
  if (gameMode === 'aiquestions') {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#F7F3FF', '#E9E1F8']}
          style={styles.gradientBackground}
        >
          <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
            <TouchableOpacity style={styles.headerButton} onPress={() => setGameMode('menu')}>
              <ArrowLeft size={24} color="#120d1b" />
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <Text style={styles.headerTitle}>AI Soru Üreticisi</Text>
            </View>
            <View style={styles.headerButton} />
          </View>
          <AIQuestionGenerator />
        </LinearGradient>
      </View>
    );
  }

  // Single player setup
  if (!gameState) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <GameSetup 
          onStartGame={startNewGame} 
          onBack={() => setGameMode('menu')}
          isLoading={isLoadingQuestions}
          error={questionLoadError}
        />
      </View>
    );
  }

  const isGameOver = gameState.gameStatus !== 'playing';



  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#F7F3FF', '#E9E1F8']}
        style={styles.gradientBackground}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity style={styles.headerButton} onPress={handleNewGame}>
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

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Players */}
          <View style={styles.playersContainer}>
            <PlayerCard
              player={gameState.players[0]}
              isCurrentPlayer={gameState.currentPlayer.id === gameState.players[0].id}
              isWinner={gameState.winner?.id === gameState.players[0].id}
            />
            <Text style={styles.vsText}>VS</Text>
            <PlayerCard
              player={gameState.players[1]}
              isCurrentPlayer={gameState.currentPlayer.id === gameState.players[1].id}
              isWinner={gameState.winner?.id === gameState.players[1].id}
            />
          </View>

          {/* Game Board */}
          <View style={styles.boardContainer}>
            {isLoadingQuestions || isAutoRestarting ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>
                  {isAutoRestarting ? '🎆 Berabere! Yeni sorularla devam ediliyor...' : '📚 Sorular yükleniyor...'}
                </Text>
                <Text style={styles.loadingSubtext}>
                  {isAutoRestarting ? 'Bir oyuncu kazanana kadar devam edilecek' : 'Yeni sorular hazırlanıyor, lütfen bekleyin'}
                </Text>
                {!isAutoRestarting && (
                  <TouchableOpacity 
                    style={styles.loadingBackButton}
                    onPress={handleNewGame}
                  >
                    <Text style={styles.loadingBackButtonText}>Geri Dön</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : questionLoadError ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>⚠️ Soru Yükleme Hatası</Text>
                <Text style={styles.errorMessage}>{questionLoadError}</Text>
                <View style={styles.errorButtons}>
                  <TouchableOpacity 
                    style={styles.retryButton}
                    onPress={() => {
                      if (gameState) {
                        startNewGame(gameState.players[0].name, gameState.players[1].name);
                      }
                    }}
                  >
                    <Text style={styles.retryButtonText}>Yeni Sorular Yükle</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.backButton}
                    onPress={handleNewGame}
                  >
                    <Text style={styles.backButtonText}>Ana Menü</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <GameBoard
                board={gameState.board}
                onCellPress={handleCellPress}
                disabled={isGameOver || isAutoRestarting}
              />
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.footerButtons}>
            {isGameOver && !isAutoRestarting ? (
              <TouchableOpacity style={styles.playAgainButton} onPress={handlePlayAgain}>
                <Text style={styles.playAgainText}>Yeniden Oyna</Text>
              </TouchableOpacity>
            ) : isAutoRestarting ? (
              <View style={styles.statusContainer}>
                <Text style={styles.gameStatus}>
                  Yeni oyun hazırlanıyor...
                </Text>
              </View>
            ) : (
              <View style={styles.statusContainer}>
                <Text style={styles.gameStatus}>
                  {gameState.currentPlayer.name} sırası
                </Text>
              </View>
            )}
            <TouchableOpacity style={styles.iconButton}>
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
        question={selectedQuestion}
        onAnswer={handleAnswer}
        onClose={() => {
          setShowQuestionModal(false);
          setSelectedCell(null);
        }}
        playerName={gameState.currentPlayer.name}
        playerSymbol={gameState.currentPlayer.symbol}
      />

      <GameOverModal
        visible={isGameOver && !isAutoRestarting}
        winner={gameState.winner}
        players={gameState.players}
        stats={stats}
        onPlayAgain={handlePlayAgain}
        onNewGame={handleNewGame}
      />
    </View>
  );
}

export default function PlayScreen() {
  return (
    <MultiplayerGameProvider>
      <GameProvider>
        <GameScreen />
      </GameProvider>
    </MultiplayerGameProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F3FF',
  },
  gradientBackground: {
    flex: 1,
    backgroundColor: '#F7F3FF',
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
  mainContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  playersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 32,
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  vsText: {
    fontSize: 32,
    fontWeight: '900' as const,
    color: '#120d1b',
  },
  boardContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  footer: {
    paddingHorizontal: 24,
  },
  footerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statusContainer: {
    flex: 1,
  },
  gameStatus: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#120d1b',
    textAlign: 'center' as const,
  },
  playAgainButton: {
    flex: 1,
    backgroundColor: '#6c2bee',
    paddingVertical: 16,
    borderRadius: 28,
    shadowColor: '#6c2bee',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  playAgainText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold' as const,
    textAlign: 'center' as const,
    letterSpacing: 0.5,
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
  menuContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    alignItems: 'center',
  },
  menuTitle: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: '#120d1b',
    marginBottom: 32,
    textAlign: 'center' as const,
  },
  modeButton: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  modeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f7f3ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  modeTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#120d1b',
    marginBottom: 8,
    textAlign: 'center' as const,
  },
  modeDescription: {
    fontSize: 14,
    color: '#664c9a',
    textAlign: 'center' as const,
    lineHeight: 20,
  },
  modeContent: {
    flex: 1,
  },
  modeEmoji: {
    fontSize: 32,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#120d1b',
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#664c9a',
    marginBottom: 20,
  },
  loadingBackButton: {
    backgroundColor: 'transparent',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#6c2bee',
  },
  loadingBackButtonText: {
    color: '#6c2bee',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#EF4444',
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center' as const,
    marginBottom: 20,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#6c2bee',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  errorButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  backButton: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#6c2bee',
  },
  backButtonText: {
    color: '#6c2bee',
    fontSize: 16,
    fontWeight: '600' as const,
    textAlign: 'center' as const,
  },
});
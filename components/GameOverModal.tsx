import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Player, GameStats } from '@/types/game';
import { LinearGradient } from 'expo-linear-gradient';

interface GameOverModalProps {
  visible: boolean;
  winner: Player | null;
  players: [Player, Player];
  stats: GameStats;
  onPlayAgain: () => void;
  onNewGame: () => void;
}

export function GameOverModal({
  visible,
  winner,
  players,
  stats,
  onPlayAgain,
  onNewGame,
}: GameOverModalProps) {
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
    }
  }, [visible, fadeAnim, scaleAnim]);

  const isDraw = !winner;
  const [player1, player2] = players;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={isDraw ? ['#F59E0B', '#D97706'] : winner ? ['#22C55E', '#16A34A'] : ['#EF4444', '#DC2626']}
            style={styles.modalContent}
          >
            <Text style={styles.resultTitle}>
              {isDraw ? '🤝 Berabere!' : `🏆 ${winner?.name} Kazandı!`}
            </Text>
            
            {isDraw && (
              <Text style={styles.drawSubtitle}>
                Yeni sorularla devam ediliyor...
              </Text>
            )}

            <View style={styles.playersContainer}>
              <View style={styles.playerResult}>
                <Text style={styles.playerSymbol}>{player1.symbol}</Text>
                <Text style={styles.playerName}>{player1.name}</Text>
                <Text style={styles.playerScore}>Score: {player1.score}</Text>
                <Text style={styles.playerAccuracy}>
                  {player1.totalAnswers > 0 
                    ? `${Math.round((player1.correctAnswers / player1.totalAnswers) * 100)}% accuracy`
                    : 'No answers'
                  }
                </Text>
              </View>

              <Text style={styles.vs}>VS</Text>

              <View style={styles.playerResult}>
                <Text style={styles.playerSymbol}>{player2.symbol}</Text>
                <Text style={styles.playerName}>{player2.name}</Text>
                <Text style={styles.playerScore}>Score: {player2.score}</Text>
                <Text style={styles.playerAccuracy}>
                  {player2.totalAnswers > 0 
                    ? `${Math.round((player2.correctAnswers / player2.totalAnswers) * 100)}% accuracy`
                    : 'No answers'
                  }
                </Text>
              </View>
            </View>

            <View style={styles.statsContainer}>
              <Text style={styles.statsTitle}>Your Stats</Text>
              <View style={styles.statsRow}>
                <Text style={styles.statItem}>Games: {stats.gamesPlayed}</Text>
                <Text style={styles.statItem}>Wins: {stats.wins}</Text>
                <Text style={styles.statItem}>Draws: {stats.draws}</Text>
              </View>
              <Text style={styles.statItem}>
                Overall Accuracy: {stats.totalQuestions > 0 
                  ? Math.round((stats.totalCorrectAnswers / stats.totalQuestions) * 100)
                  : 0}%
              </Text>
              <Text style={styles.statItem}>Best Streak: {stats.bestStreak}</Text>
            </View>

            {!isDraw && (
              <View style={styles.buttonsContainer}>
                <TouchableOpacity
                  style={styles.playAgainButton}
                  onPress={onPlayAgain}
                >
                  <Text style={styles.buttonText}>Tekrar Oyna</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.newGameButton}
                  onPress={onNewGame}
                >
                  <Text style={styles.buttonText}>Yeni Oyun</Text>
                </TouchableOpacity>
              </View>
            )}
            
            {isDraw && (
              <View style={styles.drawInfo}>
                <Text style={styles.drawInfoText}>
                  Bir oyuncu kazanana kadar devam edilecek
                </Text>
              </View>
            )}
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  playersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 24,
  },
  playerResult: {
    alignItems: 'center',
    flex: 1,
  },
  playerSymbol: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  playerScore: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 2,
  },
  playerAccuracy: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  vs: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginHorizontal: 16,
  },
  statsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 24,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  statItem: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  playAgainButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  newGameButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  drawSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 16,
  },
  drawInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    width: '100%',
  },
  drawInfoText: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '500',
  },
});
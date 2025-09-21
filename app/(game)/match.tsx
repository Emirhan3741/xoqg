import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Home, MessageCircle } from 'lucide-react-native';
import { authService, matchService, timerService } from '@/services/multiplayer';
import { Match } from '@/types/game';

export default function MatchScreen() {
  const router = useRouter();
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const insets = useSafeAreaInsets();
  const [match, setMatch] = useState<Match | null>(null);
  const [remainingTime, setRemainingTime] = useState<number>(0);

  useEffect(() => {
    if (!matchId) {
      router.replace('/(tabs)/play');
      return;
    }

    let unsubscribe: (() => void) | null = null;

    const setupMatch = async () => {
      try {
        const user = authService.getCurrentUser();
        if (!user) {
          router.replace('/(tabs)/play');
          return;
        }

        // Subscribe to match updates
        unsubscribe = matchService.subscribeToMatch(matchId, (matchData) => {
          if (matchData) {
            setMatch(matchData);
            
            // Set up turn timer
            if (matchData.status === 'active' && matchData.turnDeadline) {
              timerService.startTimer(
                matchId,
                matchData.turnDeadline,
                () => {
                  console.log('Turn timeout');
                  setRemainingTime(0);
                },
                (remaining) => {
                  setRemainingTime(remaining);
                }
              );
            }
          } else {
            router.replace('/(tabs)/play');
          }
        });
      } catch (error) {
        console.error('Error setting up match:', error);
        Alert.alert('Hata', 'Maç yüklenirken hata oluştu.');
        router.back();
      }
    };

    setupMatch();

    return () => {
      if (unsubscribe) unsubscribe();
      timerService.clearTimer(matchId);
    };
  }, [matchId, router]);

  const handleCellPress = async (cellIndex: number) => {
    if (!match || !matchId) return;
    
    const user = authService.getCurrentUser();
    if (!user || match.turnUid !== user.uid) return;

    const cell = match.board[cellIndex];
    if (cell.state !== 'empty') return;

    try {
      // Get question for this cell
      const question = await matchService.getQuestion(matchId, cellIndex);
      
      // For now, just simulate answering the first option
      // In a real implementation, you'd show a question modal
      const selectedAnswer = question.options[0];
      
      await matchService.submitMove(matchId, cellIndex, selectedAnswer);
    } catch (error: any) {
      console.error('Error making move:', error);
      Alert.alert('Hata', error?.message ?? 'Hamle yapılırken hata oluştu.');
    }
  };

  const handleForfeit = async () => {
    if (!matchId) return;
    
    Alert.alert(
      'Teslim Ol',
      'Maçı teslim etmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Teslim Ol',
          style: 'destructive',
          onPress: async () => {
            try {
              await matchService.forfeitMatch(matchId);
            } catch (error: any) {
              Alert.alert('Hata', error?.message ?? 'Teslim olurken hata oluştu.');
            }
          }
        }
      ]
    );
  };

  const formatTime = (ms: number): string => {
    const seconds = Math.ceil(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderCell = (cell: any, index: number) => {
    const isMyTurn = match?.turnUid === authService.getCurrentUser()?.uid;
    const canPress = isMyTurn && cell.state === 'empty' && match?.status === 'active';
    
    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.cell,
          canPress && styles.cellActive,
          cell.state !== 'empty' && styles.cellFilled
        ]}
        onPress={() => handleCellPress(index)}
        disabled={!canPress}
      >
        <Text style={styles.cellCategory}>{cell.cat}</Text>
        {cell.state === 'A' && <Text style={styles.symbolX}>X</Text>}
        {cell.state === 'B' && <Text style={styles.symbolO}>O</Text>}
      </TouchableOpacity>
    );
  };

  if (!match) {
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

  const user = authService.getCurrentUser();
  const isPlayerA = match.players.A === user?.uid;
  const currentPlayerSymbol = isPlayerA ? 'X' : 'O';
  const isMyTurn = match.turnUid === user?.uid;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#F7F3FF', '#E9E1F8']} style={styles.gradientBackground}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#120d1b" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>X-O Quiz Game</Text>
          </View>
          <TouchableOpacity style={styles.headerButton} onPress={handleForfeit}>
            <Text style={styles.forfeitText}>Teslim</Text>
          </TouchableOpacity>
        </View>

        {/* Game Status */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            {match.status === 'active' ? (
              isMyTurn ? 'Sizin sıranız' : 'Rakibin sırası'
            ) : (
              match.status === 'finished' ? 'Oyun bitti' : 'Oyun durdu'
            )}
          </Text>
          {match.status === 'active' && remainingTime > 0 && (
            <Text style={styles.timerText}>
              Kalan süre: {formatTime(remainingTime)}
            </Text>
          )}
        </View>

        {/* Players */}
        <View style={styles.playersContainer}>
          <View style={styles.playerCard}>
            <Text style={styles.playerSymbol}>X</Text>
            <Text style={styles.playerText}>
              {isPlayerA ? 'Sen' : 'Rakip'}
            </Text>
          </View>
          <Text style={styles.vsText}>VS</Text>
          <View style={styles.playerCard}>
            <Text style={styles.playerSymbol}>O</Text>
            <Text style={styles.playerText}>
              {!isPlayerA ? 'Sen' : 'Rakip'}
            </Text>
          </View>
        </View>

        {/* Game Board */}
        <View style={styles.boardContainer}>
          <View style={styles.board}>
            {match.board.map((cell, index) => renderCell(cell, index))}
          </View>
        </View>

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.footerButtons}>
            <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/(tabs)/play')}>
              <Home size={24} color="#120d1b" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <MessageCircle size={24} color="#6c2bee" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
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
  forfeitText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#ff5757',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#120d1b',
    textAlign: 'center' as const,
  },
  statusContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#120d1b',
    marginBottom: 8,
  },
  timerText: {
    fontSize: 16,
    color: '#6c2bee',
    fontWeight: '500' as const,
  },
  playersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 32,
    paddingVertical: 16,
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
  },
  playerSymbol: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    color: '#6c2bee',
    marginBottom: 8,
  },
  playerText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#120d1b',
  },
  vsText: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#120d1b',
  },
  boardContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  board: {
    width: '100%',
    maxWidth: 300,
    aspectRatio: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cell: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cellActive: {
    borderWidth: 2,
    borderColor: '#6c2bee',
  },
  cellFilled: {
    backgroundColor: '#f7f3ff',
  },
  cellCategory: {
    fontSize: 10,
    color: '#664c9a',
    fontWeight: '500' as const,
    textAlign: 'center' as const,
    marginBottom: 4,
  },
  symbolX: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#ff5555',
  },
  symbolO: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#55aaff',
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
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Users } from 'lucide-react-native';
import { authService, matchmakingService } from '@/services/multiplayer';
import { useAuth } from '@/hooks/useAuthStore';

export default function WaitingRoom() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [waitTime, setWaitTime] = useState(0);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let timer: NodeJS.Timeout | null = null;

    const setupWaiting = async () => {
      try {
        if (!user?.uid) {
          console.log('No authenticated user, redirecting to play');
          router.replace('/(tabs)/play');
          return;
        }

        console.log('Setting up waiting room for user:', user.uid);

        // Subscribe to active match changes
        unsubscribe = matchmakingService.subscribeToActiveMatch(user.uid, (matchId) => {
          if (matchId) {
            console.log('Match found:', matchId);
            router.replace({ pathname: '/(game)/match', params: { matchId } } as any);
          }
        });

        // Start wait time counter
        timer = setInterval(() => {
          setWaitTime(prev => prev + 1);
        }, 1000) as unknown as NodeJS.Timeout;
      } catch (error) {
        console.error('Error setting up waiting room:', error);
        Alert.alert('Hata', 'Bekleme odası kurulurken hata oluştu.');
        router.back();
      }
    };

    setupWaiting();

    return () => {
      if (unsubscribe) unsubscribe();
      if (timer) clearInterval(timer);
    };
  }, [router]);

  const handleCancel = async () => {
    if (isLeaving) return;
    
    try {
      setIsLeaving(true);
      await matchmakingService.leaveQueue();
      router.back();
    } catch (error: any) {
      console.error('Error leaving queue:', error);
      Alert.alert('Hata', error?.message ?? 'Kuyruktan çıkılamadı.');
    } finally {
      setIsLeaving(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#F7F3FF', '#E9E1F8']}
        style={styles.gradientBackground}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={handleCancel}
            disabled={isLeaving}
          >
            <ArrowLeft size={24} color="#120d1b" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>Eşleşme Aranıyor</Text>
          </View>
          <View style={styles.headerButton} />
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          <View style={styles.waitingCard}>
            <View style={styles.iconContainer}>
              <Users size={64} color="#6c2bee" />
            </View>
            
            <Text style={styles.waitingTitle}>Rakip Aranıyor...</Text>
            <Text style={styles.waitingDescription}>
              Sizinle aynı seviyede bir rakip buluyoruz.
              Bu işlem birkaç saniye sürebilir.
            </Text>
            
            <View style={styles.timerContainer}>
              <ActivityIndicator size="large" color="#6c2bee" />
              <Text style={styles.timerText}>{formatTime(waitTime)}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity 
            style={[styles.cancelButton, isLeaving && styles.cancelButtonDisabled]}
            onPress={handleCancel}
            disabled={isLeaving}
          >
            {isLeaving ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.cancelButtonText}>İptal Et</Text>
            )}
          </TouchableOpacity>
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
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#120d1b',
    textAlign: 'center' as const,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waitingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    width: '100%',
    maxWidth: 320,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#f7f3ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  waitingTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#120d1b',
    textAlign: 'center' as const,
    marginBottom: 12,
  },
  waitingDescription: {
    fontSize: 16,
    color: '#664c9a',
    textAlign: 'center' as const,
    lineHeight: 24,
    marginBottom: 32,
  },
  timerContainer: {
    alignItems: 'center',
    gap: 16,
  },
  timerText: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    color: '#6c2bee',
    fontFamily: 'monospace',
  },
  footer: {
    paddingHorizontal: 24,
  },
  cancelButton: {
    backgroundColor: '#ff5757',
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
    shadowColor: '#ff5757',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  cancelButtonDisabled: {
    opacity: 0.6,
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold' as const,
    letterSpacing: 0.5,
  },
});
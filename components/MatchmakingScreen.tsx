import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Users, Zap, Clock } from 'lucide-react-native';
import { matchmakingService } from '@/services/multiplayer';
import { useAuth } from '@/hooks/useAuthStore';

interface MatchmakingScreenProps {
  onBack: () => void;
  onMatchFound: () => void;
}

export function MatchmakingScreen({ onBack }: MatchmakingScreenProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setSearchError('Kimlik doğrulama gerekli');
    }
  }, [user]);

  const handleFindMatch = async () => {
    if (isSearching || !user?.uid) return;
    
    try {
      setIsSearching(true);
      setSearchError(null);
      
      console.log('Finding match for user:', user.uid);
      const result = await matchmakingService.joinQueue('general', 1200);
      
      if (result.matchId) {
        // Immediately matched
        console.log('Immediate match found:', result.matchId);
        router.push({ pathname: '/(game)/match', params: { matchId: result.matchId } } as any);
      } else {
        // Go to waiting room
        console.log('Joining queue, going to waiting room');
        router.push('/(game)/waiting' as any);
      }
    } catch (error: any) {
      console.error('Failed to find match:', error);
      
      let errorMessage = 'Eşleşme hatası';
      if (error?.message?.includes('Firebase Functions not deployed')) {
        errorMessage = 'Sunucu servisleri henüz hazır değil. Demo modunda devam edebilirsiniz.';
      } else if (error?.message?.includes('Server error')) {
        errorMessage = 'Sunucu hatası. Demo modunda devam edebilirsiniz.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      setSearchError(errorMessage);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCancelSearch = async () => {
    try {
      await matchmakingService.leaveQueue();
      setIsSearching(false);
    } catch (error) {
      console.error('Failed to cancel search:', error);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1122', '#2f2348']}
        style={styles.gradientBackground}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <ArrowLeft size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Çevrimiçi Oyun</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Game Mode Selection */}
          <View style={styles.gameModeContainer}>
            <View style={styles.iconContainer}>
              <Users size={48} color="#8013ec" />
            </View>
            <Text style={styles.gameModeTitle}>Hızlı Eşleşme</Text>
            <Text style={styles.gameModeDescription}>
              Rastgele bir oyuncuyla eşleş ve hemen oynamaya başla
            </Text>
          </View>

          {/* Status */}
          <View style={styles.statusContainer}>
            {isSearching ? (
              <>
                <ActivityIndicator size="large" color="#8013ec" style={styles.loader} />
                <Text style={styles.statusText}>Oyuncu aranıyor...</Text>
                <Text style={styles.statusSubtext}>
                  Seviyene uygun bir rakip buluyoruz
                </Text>
              </>
            ) : searchError ? (
              <>
                <Text style={styles.errorText}>❌ {searchError}</Text>
                <Text style={styles.statusSubtext}>
                  Lütfen tekrar deneyin
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.statusText}>Hazır mısın?</Text>
                <Text style={styles.statusSubtext}>
                  Rakibinle 10 saniyede cevap ver!
                </Text>
              </>
            )}
          </View>

          {/* Game Features */}
          <View style={styles.featuresContainer}>
            <View style={styles.feature}>
              <Zap size={24} color="#8013ec" />
              <Text style={styles.featureText}>Hızlı Oyun</Text>
            </View>
            <View style={styles.feature}>
              <Clock size={24} color="#8013ec" />
              <Text style={styles.featureText}>10 Saniye</Text>
            </View>
            <View style={styles.feature}>
              <Users size={24} color="#8013ec" />
              <Text style={styles.featureText}>1v1 Mücadele</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          {isSearching ? (
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancelSearch}>
              <Text style={styles.cancelButtonText}>İptal Et</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.playButton, (!user?.uid) && styles.playButtonDisabled]} 
              onPress={handleFindMatch}
              disabled={!user?.uid}
            >
              <Text style={styles.playButtonText}>
                {!user?.uid ? 'Kimlik Doğrulanıyor...' : 'Oyun Bul'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1122',
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#ffffff',
    textAlign: 'center' as const,
  },
  placeholder: {
    width: 40,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  gameModeContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(128, 19, 236, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  gameModeTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center' as const,
  },
  gameModeDescription: {
    fontSize: 16,
    color: '#a492c9',
    textAlign: 'center' as const,
    lineHeight: 24,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  loader: {
    marginBottom: 16,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center' as const,
  },
  statusSubtext: {
    fontSize: 14,
    color: '#a492c9',
    textAlign: 'center' as const,
    lineHeight: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ff5757',
    marginBottom: 8,
    textAlign: 'center' as const,
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  feature: {
    alignItems: 'center',
    flex: 1,
  },
  featureText: {
    fontSize: 12,
    color: '#a492c9',
    marginTop: 8,
    textAlign: 'center' as const,
  },
  footer: {
    paddingHorizontal: 24,
  },
  playButton: {
    backgroundColor: '#8013ec',
    paddingVertical: 16,
    borderRadius: 28,
    shadowColor: '#8013ec',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  playButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold' as const,
    textAlign: 'center' as const,
    letterSpacing: 0.5,
  },
  playButtonDisabled: {
    backgroundColor: '#666666',
    opacity: 0.6,
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 16,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600' as const,
    textAlign: 'center' as const,
    letterSpacing: 0.5,
  },
});
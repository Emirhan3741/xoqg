import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { X, Circle, CheckCircle } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuthStore';

export default function WelcomeScreen() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        console.log('User authenticated, redirecting to game...');
        const timer = setTimeout(() => {
          router.replace('/play');
        }, 1500);
        return () => clearTimeout(timer);
      } else {
        console.log('No user found, redirecting to login...');
        const timer = setTimeout(() => {
          router.replace('/login');
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [user, isLoading]);

  const handlePlayNow = () => {
    console.log('Manual navigation to game');
    router.push('/play');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.gameBoard}>
          <View style={styles.boardRow}>
            <View style={styles.boardCell}>
              <X size={24} color="#FFFFFF" strokeWidth={3} />
            </View>
            <View style={styles.boardCell}>
              <Circle size={24} color="#FFFFFF" strokeWidth={3} />
            </View>
            <View style={styles.boardCell} />
          </View>
          <View style={styles.boardRow}>
            <View style={styles.boardCell}>
              <Circle size={24} color="#FFFFFF" strokeWidth={3} />
            </View>
            <View style={styles.boardCell}>
              <X size={24} color="#FFFFFF" strokeWidth={3} />
            </View>
            <View style={styles.boardCell} />
          </View>
          <View style={styles.boardRow}>
            <View style={styles.boardCell} />
            <View style={styles.boardCell} />
            <View style={styles.boardCell}>
              <X size={24} color="#FFFFFF" strokeWidth={3} />
            </View>
          </View>
        </View>

        <Text style={styles.title}>
          <Text style={styles.titleX}>X-O</Text>
          <Text style={styles.titleRest}> Quiz Game</Text>
        </Text>
        
        <Text style={styles.subtitle}>Firebase ile güvenli oyun deneyimi!</Text>

        {user ? (
          <View style={styles.statusContainer}>
            <CheckCircle size={24} color="#10b981" />
            <Text style={styles.statusText}>Bağlantı başarılı!</Text>
            <Text style={styles.statusSubtext}>Oyuna yönlendiriliyorsunuz...</Text>
          </View>
        ) : (
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>Giriş ekranına yönlendiriliyorsunuz...</Text>
          </View>
        )}

        <TouchableOpacity 
          style={styles.loginButton} 
          onPress={user ? handlePlayNow : () => router.replace('/login')}
        >
          <Text style={styles.loginButtonText}>
            {user ? 'Oyuna Başla' : 'Giriş Yap'}
          </Text>
        </TouchableOpacity>

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>Anonim kimlik doğrulama kullanılıyor</Text>
          <Text style={styles.infoSubtext}>Verileriniz güvende</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1122',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  gameBoard: {
    marginBottom: 32,
  },
  boardRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  boardCell: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold' as const,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -1,
  },
  titleX: {
    color: '#8013ec',
  },
  titleRest: {
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 18,
    color: '#ad92c9',
    textAlign: 'center',
    marginBottom: 32,
  },
  statusContainer: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 32,
    paddingHorizontal: 24,
  },
  statusText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600' as const,
    textAlign: 'center' as const,
  },
  statusSubtext: {
    fontSize: 14,
    color: '#ad92c9',
    textAlign: 'center' as const,
  },
  loginButton: {
    width: '100%',
    maxWidth: 320,
    height: 56,
    backgroundColor: '#8013ec',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold' as const,
    letterSpacing: 0.5,
  },
  infoContainer: {
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    color: '#ad92c9',
    fontSize: 14,
    textAlign: 'center' as const,
  },
  infoSubtext: {
    color: '#8b7aa3',
    fontSize: 12,
    textAlign: 'center' as const,
  },
});
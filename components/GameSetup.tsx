import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft } from 'lucide-react-native';

interface GameSetupProps {
  onStartGame: (player1Name: string, player2Name: string) => Promise<void>;
  onBack?: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export function GameSetup({ onStartGame, onBack, isLoading = false, error }: GameSetupProps) {
  const [player1Name, setPlayer1Name] = useState('You');
  const [player2Name, setPlayer2Name] = useState('Oyuncu 2');

  const handleStartGame = async () => {
    const name1 = player1Name.trim() || 'You';
    const name2 = player2Name.trim() || 'Oyuncu 2';
    await onStartGame(name1, name2);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#F7F3FF', '#E9E1F8']}
        style={styles.background}
      >
        {onBack && (
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <ArrowLeft size={24} color="#120d1b" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Oyun Kurulumu</Text>
            <View style={styles.headerSpacer} />
          </View>
        )}
        <View style={styles.content}>
          <Text style={styles.title}>Tic Tac Toe</Text>
          <Text style={styles.subtitle}>
            Soruları doğru cevaplayarak sembolünü yerleştir!
          </Text>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Oyuncu X</Text>
              <TextInput
                style={styles.input}
                value={player1Name}
                onChangeText={setPlayer1Name}
                placeholder="İsim girin"
                placeholderTextColor="#9CA3AF"
                maxLength={20}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Oyuncu O</Text>
              <TextInput
                style={styles.input}
                value={player2Name}
                onChangeText={setPlayer2Name}
                placeholder="İsim girin"
                placeholderTextColor="#9CA3AF"
                maxLength={20}
              />
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>⚠️ Hata</Text>
                <Text style={styles.errorMessage}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.startButton, isLoading && styles.startButtonDisabled]}
              onPress={handleStartGame}
              disabled={isLoading}
            >
              <Text style={styles.startButtonText}>
                {isLoading ? 'Sorular Yükleniyor...' : 'Oyunu Başlat'}
              </Text>
            </TouchableOpacity>
            
            {isLoading && onBack && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onBack}
              >
                <Text style={styles.cancelButtonText}>Geri Dön</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.rulesContainer}>
            <Text style={styles.rulesTitle}>Nasıl Oynanır:</Text>
            <Text style={styles.ruleText}>• Bir kareye dokunarak soru görün</Text>
            <Text style={styles.ruleText}>• Doğru cevap vererek sembolünüzü yerleştirin</Text>
            <Text style={styles.ruleText}>• 3&apos;lü çizgi yaparak kazanın!</Text>
            <Text style={styles.ruleText}>• Yanlış cevaplar sırayı geçirir</Text>
            <Text style={styles.ruleText}>• Her soru için 10 saniye süreniz var</Text>
          </View>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#120d1b',
  },
  headerSpacer: {
    width: 40,
  },
  background: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#120d1b',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: '#664c9a',
    textAlign: 'center',
    marginBottom: 40,
  },
  form: {
    width: '100%',
    maxWidth: 300,
    marginBottom: 40,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#120d1b',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  startButton: {
    backgroundColor: '#6c2bee',
    borderRadius: 28,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#6c2bee',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  rulesContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  rulesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#120d1b',
    marginBottom: 12,
    textAlign: 'center',
  },
  ruleText: {
    fontSize: 14,
    color: '#664c9a',
    marginBottom: 6,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: '#EF4444',
    textAlign: 'center' as const,
    marginBottom: 4,
  },
  errorMessage: {
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center' as const,
    lineHeight: 18,
  },
  startButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0.1,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderRadius: 28,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 2,
    borderColor: '#6c2bee',
  },
  cancelButtonText: {
    color: '#6c2bee',
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
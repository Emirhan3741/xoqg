import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Question } from '@/types/game';
import { CATEGORY_CONFIG } from '@/constants/categories';
import { LinearGradient } from 'expo-linear-gradient';

interface QuestionModalProps {
  visible: boolean;
  question: Question | null;
  onAnswer: (selectedAnswer: string) => void;
  onClose: () => void;
  playerName: string;
  playerSymbol: 'X' | 'O';
  timeLimit?: number;
  isLoading?: boolean;
}

export function QuestionModal({
  visible,
  question,
  onAnswer,
  onClose,
  playerName,
  playerSymbol,
  timeLimit = 10,
  isLoading = false,
}: QuestionModalProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);


  useEffect(() => {
    if (visible) {
      setSelectedOption(null);
      setShowResult(false);
      setTimeLeft(timeLimit);
      
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

      // Start timer
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Time's up - pass empty answer
            setShowResult(true);
            setTimeout(() => {
              onAnswer('');
            }, 1500);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [visible, fadeAnim, scaleAnim, onAnswer, timeLimit]);

  if (!question) return null;

  const categoryConfig = CATEGORY_CONFIG[question.category] || CATEGORY_CONFIG.spor;

  const handleOptionPress = (optionIndex: number) => {
    if (selectedOption !== null || showResult || timeLeft === 0) return;

    // Clear timer when user answers
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setSelectedOption(optionIndex);
    const selectedAnswer = question.options[optionIndex];
    
    // We don't know if it's correct on client side - server will validate
    setShowResult(true);

    setTimeout(() => {
      onAnswer(selectedAnswer);
    }, 2000);
  };

  const getOptionStyle = (index: number) => {
    if (!showResult) {
      return selectedOption === index ? styles.selectedOption : styles.option;
    }

    // We don't know correct answer on client side
    if (selectedOption === index) {
      return styles.selectedOption;
    }

    return styles.disabledOption;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
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
            colors={[categoryConfig.lightColor, '#FFFFFF']}
            style={styles.modalContent}
          >
            <View style={styles.header}>
              <View style={[styles.categoryBadge, { backgroundColor: categoryConfig.color }]}>
                <Text style={styles.categoryIcon}>{categoryConfig.icon}</Text>
                <Text style={styles.categoryText}>{categoryConfig.name}</Text>
              </View>
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>{playerName}</Text>
                <Text style={[styles.playerSymbol, { color: categoryConfig.color }]}>
                  {playerSymbol}
                </Text>
              </View>
            </View>

            <View style={styles.timerContainer}>
              <View style={[
                styles.timerCircle,
                { borderColor: timeLeft <= 3 ? '#EF4444' : categoryConfig.color }
              ]}>
                <Text style={[
                  styles.timerText,
                  { color: timeLeft <= 3 ? '#EF4444' : categoryConfig.color }
                ]}>
                  {timeLeft}
                </Text>
              </View>
              <Text style={styles.timerLabel}>saniye kaldı</Text>
            </View>

            <Text style={styles.question}>{question.prompt}</Text>

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Soru yükleniyor...</Text>
              </View>
            ) : (
              <View style={styles.optionsContainer}>
                {question.options.map((option, index) => (
                  <TouchableOpacity
                    key={`option-${index}-${option.slice(0, 10)}`}
                    style={getOptionStyle(index)}
                    onPress={() => handleOptionPress(index)}
                    disabled={showResult || timeLeft === 0 || isLoading}
                  >
                    <Text style={styles.optionText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {showResult && (
              <View style={styles.resultContainer}>
                <Text style={[
                  styles.resultText,
                  { color: '#3B82F6' }
                ]}>
                  {timeLeft === 0 && selectedOption === null ? '⏰ Süre Doldu!' : '📤 Cevap Gönderiliyor...'}
                </Text>
                <Text style={styles.resultSubtext}>
                  {timeLeft === 0 && selectedOption === null 
                    ? 'Sıra diğer oyuncuya geçti.' 
                    : 'Cevabınız kontrol ediliyor...'}
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    marginHorizontal: 20,
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  playerInfo: {
    alignItems: 'center',
  },
  playerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  playerSymbol: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  question: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  optionsContainer: {
    gap: 12,
  },
  option: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    backgroundColor: '#DBEAFE',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  correctOption: {
    backgroundColor: '#DCFCE7',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#22C55E',
  },
  incorrectOption: {
    backgroundColor: '#FEE2E2',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  disabledOption: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    opacity: 0.5,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    textAlign: 'center',
  },
  resultContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  resultText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  resultSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  timerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  timerText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  timerLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
});
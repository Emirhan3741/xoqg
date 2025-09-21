import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useOpenAI } from '../hooks/useOpenAI';

export const AIQuestionGenerator: React.FC = () => {
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
  const { generateQuestions, loading } = useOpenAI();

  const categories = [
    'Genel Kültür',
    'Tarih',
    'Coğrafya',
    'Bilim',
    'Spor',
    'Sanat',
    'Teknoloji',
    'Matematik'
  ];

  const difficulties = ['Kolay', 'Orta', 'Zor'];

  const handleGenerateQuestions = async (category: string, difficulty: string) => {
    try {
      const questions = await generateQuestions(category, difficulty, 5);
      
      if (questions.length > 0) {
        setGeneratedQuestions(questions);
        Alert.alert('Başarılı', `${questions.length} soru üretildi!`);
      } else {
        Alert.alert('Hata', 'Soru üretilemedi. Lütfen tekrar deneyin.');
      }
    } catch (error) {
      Alert.alert('Hata', 'Soru üretimi sırasında bir hata oluştu.');
    }
  };

  const renderQuestion = (question: any, index: number) => (
    <View key={index} style={styles.questionCard}>
      <Text style={styles.questionText}>{question.question}</Text>
      
      <View style={styles.optionsContainer}>
        {question.options?.map((option: string, optionIndex: number) => (
          <Text 
            key={optionIndex} 
            style={[
              styles.optionText,
              optionIndex === question.correct && styles.correctOption
            ]}
          >
            {String.fromCharCode(65 + optionIndex)}) {option}
          </Text>
        ))}
      </View>
      
      <Text style={styles.categoryText}>
        Kategori: {question.category} | Zorluk: {question.difficulty}
      </Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>AI Soru Üreticisi</Text>
      
      <Text style={styles.subtitle}>Kategori ve zorluk seçin:</Text>
      
      {categories.map((category) => (
        <View key={category} style={styles.categorySection}>
          <Text style={styles.categoryTitle}>{category}</Text>
          
          <View style={styles.difficultyButtons}>
            {difficulties.map((difficulty) => (
              <TouchableOpacity
                key={`${category}-${difficulty}`}
                style={styles.difficultyButton}
                onPress={() => handleGenerateQuestions(category, difficulty)}
                disabled={loading}
              >
                <Text style={styles.difficultyButtonText}>{difficulty}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Sorular üretiliyor...</Text>
        </View>
      )}

      {generatedQuestions.length > 0 && (
        <View style={styles.questionsContainer}>
          <Text style={styles.questionsTitle}>Üretilen Sorular:</Text>
          {generatedQuestions.map(renderQuestion)}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 15,
    color: '#666',
  },
  categorySection: {
    marginBottom: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  difficultyButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  difficultyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    minWidth: 60,
  },
  difficultyButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#007AFF',
  },
  questionsContainer: {
    marginTop: 20,
  },
  questionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  questionCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  questionText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  optionsContainer: {
    marginBottom: 10,
  },
  optionText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#666',
    paddingLeft: 10,
  },
  correctOption: {
    backgroundColor: '#e8f5e8',
    color: '#2d5a2d',
    fontWeight: 'bold',
    borderRadius: 5,
    padding: 5,
  },
  categoryText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
});

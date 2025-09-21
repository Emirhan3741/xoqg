import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GameProvider, useGame } from '@/hooks/useGameStore';
import { CATEGORY_CONFIG, CATEGORIES } from '@/constants/categories';

function StatsScreen() {
  const { stats, loadStats } = useGame();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const winRate = stats.gamesPlayed > 0 
    ? Math.round((stats.wins / stats.gamesPlayed) * 100) 
    : 0;

  const overallAccuracy = stats.totalQuestions > 0 
    ? Math.round((stats.totalCorrectAnswers / stats.totalQuestions) * 100) 
    : 0;

  return (
    <LinearGradient
      colors={['#1F2937', '#111827']}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
          <Text style={styles.title}>Your Stats</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.gamesPlayed}</Text>
              <Text style={styles.statLabel}>Games Played</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: '#22C55E' }]}>{stats.wins}</Text>
              <Text style={styles.statLabel}>Wins</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: '#EAB308' }]}>{stats.draws}</Text>
              <Text style={styles.statLabel}>Draws</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: '#EF4444' }]}>{stats.losses}</Text>
              <Text style={styles.statLabel}>Losses</Text>
            </View>
          </View>

          <View style={styles.detailsContainer}>
            <View style={styles.detailCard}>
              <Text style={styles.detailTitle}>Win Rate</Text>
              <Text style={[styles.detailValue, { color: '#22C55E' }]}>{winRate}%</Text>
            </View>

            <View style={styles.detailCard}>
              <Text style={styles.detailTitle}>Overall Accuracy</Text>
              <Text style={[styles.detailValue, { color: '#3B82F6' }]}>{overallAccuracy}%</Text>
            </View>

            <View style={styles.detailCard}>
              <Text style={styles.detailTitle}>Current Streak</Text>
              <Text style={[styles.detailValue, { color: '#8B5CF6' }]}>{stats.currentStreak}</Text>
            </View>

            <View style={styles.detailCard}>
              <Text style={styles.detailTitle}>Best Streak</Text>
              <Text style={[styles.detailValue, { color: '#F59E0B' }]}>{stats.bestStreak}</Text>
            </View>
          </View>

          <View style={styles.questionsContainer}>
            <Text style={styles.sectionTitle}>Question Stats</Text>
            <View style={styles.questionStats}>
              <Text style={styles.questionStatText}>
                Total Questions: {stats.totalQuestions}
              </Text>
              <Text style={styles.questionStatText}>
                Correct Answers: {stats.totalCorrectAnswers}
              </Text>
              <Text style={styles.questionStatText}>
                Incorrect Answers: {stats.totalQuestions - stats.totalCorrectAnswers}
              </Text>
            </View>
          </View>

          <View style={styles.categoriesContainer}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <View style={styles.categoriesGrid}>
              {CATEGORIES.map((category) => {
                const config = CATEGORY_CONFIG[category];
                return (
                  <View 
                    key={category}
                    style={[styles.categoryCard, { borderColor: config.color }]}
                  >
                    <Text style={styles.categoryIcon}>{config.icon}</Text>
                    <Text style={styles.categoryName}>{config.name}</Text>
                  </View>
                );
              })}
            </View>
          </View>
      </ScrollView>
    </LinearGradient>
  );
}

export default function StatsTab() {
  return (
    <GameProvider>
      <StatsScreen />
    </GameProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  detailsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  detailCard: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
  },
  detailTitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 8,
    textAlign: 'center',
  },
  detailValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  questionsContainer: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  questionStats: {
    gap: 8,
  },
  questionStatText: {
    fontSize: 16,
    color: '#E5E7EB',
    textAlign: 'center',
  },
  categoriesContainer: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 20,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    backgroundColor: '#4B5563',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    flex: 1,
    minWidth: '30%',
    borderWidth: 2,
  },
  categoryIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 12,
    color: '#E5E7EB',
    textAlign: 'center',
    fontWeight: '500',
  },
});
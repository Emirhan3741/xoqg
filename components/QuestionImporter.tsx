import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { processQuestionCsv } from '@/services/api';

interface ImportResult {
  inserted: number;
  updated: number;
  skipped: number;
  errors: string[];
}

export function QuestionImporter() {
  const [isImporting, setIsImporting] = useState(false);
  const [lastResult, setLastResult] = useState<ImportResult | null>(null);

  const handleImport = async () => {
    if (isImporting) return;

    setIsImporting(true);
    try {
      // In a real implementation, this would:
      // 1. Open file picker
      // 2. Upload CSV to Firebase Storage
      // 3. Call processQuestionCsv with storage path
      
      const result = await processQuestionCsv('admin_uploads/trivia_questions_8x100_TR.csv');
      setLastResult(result);
      
      Alert.alert(
        'Import Complete',
        `Inserted: ${result.inserted}\nUpdated: ${result.updated}\nSkipped: ${result.skipped}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Import failed:', error);
      Alert.alert('Import Failed', 'Please try again later.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Question Bank Importer</Text>
        <Text style={styles.subtitle}>
          Import trivia questions from CSV file
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CSV Format</Text>
          <Text style={styles.formatText}>
            Required columns: id, locale, category, difficulty, type, prompt, optionA, optionB, optionC, optionD, answer
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.importButton, isImporting && styles.importButtonDisabled]}
          onPress={handleImport}
          disabled={isImporting}
        >
          <Text style={styles.importButtonText}>
            {isImporting ? 'Importing...' : 'Import CSV'}
          </Text>
        </TouchableOpacity>

        {lastResult && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>Last Import Result</Text>
            <Text style={styles.resultText}>Inserted: {lastResult.inserted}</Text>
            <Text style={styles.resultText}>Updated: {lastResult.updated}</Text>
            <Text style={styles.resultText}>Skipped: {lastResult.skipped}</Text>
            {lastResult.errors.length > 0 && (
              <View style={styles.errorsContainer}>
                <Text style={styles.errorsTitle}>Errors:</Text>
                {lastResult.errors.map((error, index) => (
                  <Text key={index} style={styles.errorText}>
                    • {error}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  formatText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  importButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  importButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  importButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  resultText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  errorsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  errorsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    marginBottom: 4,
  },
});
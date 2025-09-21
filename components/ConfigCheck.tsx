import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AlertTriangle } from 'lucide-react-native';
import { configSource } from '@/services/firebase';

interface ConfigCheckProps {
  error?: string;
  loading?: boolean;
}

export default function ConfigCheck({ error, loading }: ConfigCheckProps) {
  const insets = useSafeAreaInsets();

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#F7F3FF', '#E9E1F8']}
          style={styles.gradientBackground}
        >
          <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
            <Text style={styles.loadingText}>Firebase başlatılıyor...</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  if (!error) return null;

  const isNetworkError = error.includes('network-request-failed') || error.includes('network');
  const isConfigError = error.includes('api-key') || error.includes('project') || error.includes('auth-domain') || error.includes('Missing Firebase env') || error.includes('REPLACE_WITH_') || error.includes('placeholder');
  const isPlaceholderError = error.includes('REPLACE_WITH_') || error.includes('PLACEHOLDER') || error.includes('placeholder') || error.includes('8f9a2b3c4d5e6f7g8h9i0j1k');

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#F7F3FF', '#E9E1F8']}
        style={styles.gradientBackground}
      >
        <ScrollView 
          style={[styles.scrollView, { paddingTop: insets.top + 16 }]}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 16 }]}
        >
          <View style={styles.errorCard}>
            <View style={styles.iconContainer}>
              <AlertTriangle size={48} color="#ff5757" />
            </View>
            
            <Text style={styles.title}>Firebase Yapılandırma Hatası</Text>
            
            <Text style={styles.description}>
              {isPlaceholderError
                ? 'Firebase Web App ID is missing or contains placeholder values. Please get the real Web App ID from Firebase Console and update your .env file.'
                : isNetworkError 
                ? 'Firebase connection failed. Please check your Firebase configuration and internet connection.'
                : isConfigError
                ? 'Firebase configuration is missing or incorrect.'
                : 'Authentication error occurred.'
              }
            </Text>

            <Text style={styles.configSourceText}>Config source: {configSource()}</Text>

            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>

            <View style={styles.stepsContainer}>
              <Text style={styles.stepsTitle}>Solution Steps:</Text>
              
              <View style={styles.step}>
                <Text style={styles.stepNumber}>1.</Text>
                <Text style={styles.stepText}>
                  Go to Firebase Console → Project Settings → General → &quot;Your apps&quot; section
                </Text>
              </View>

              <View style={styles.step}>
                <Text style={styles.stepNumber}>2.</Text>
                <Text style={styles.stepText}>
                  {isPlaceholderError 
                    ? 'If no web app exists, click &quot;Add app&quot; → Web (&lt;/&gt;), register with name &quot;XOQG Web&quot;'
                    : 'Copy the web app configuration values'
                  }
                </Text>
              </View>

              <View style={styles.step}>
                <Text style={styles.stepNumber}>3.</Text>
                <Text style={styles.stepText}>
                  Update the <Text style={styles.code}>.env</Text> file in your project root:
                </Text>
              </View>

              <View style={styles.configBox}>
                <Text style={styles.configText}>
                  {isPlaceholderError 
                    ? 'EXPO_PUBLIC_FIREBASE_APP_ID=1:345865955324:web:YOUR_REAL_WEB_APP_ID_HERE'
                    : `EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key_here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id`
                  }
                </Text>
              </View>

              <View style={styles.step}>
                <Text style={styles.stepNumber}>4.</Text>
                <Text style={styles.stepText}>
                  Enable Anonymous Authentication: Console → Authentication → Sign-in method → Anonymous → Enable
                </Text>
              </View>

              <View style={styles.step}>
                <Text style={styles.stepNumber}>5.</Text>
                <Text style={styles.stepText}>
                  Restart the dev server (Ctrl+C → npm start)
                </Text>
              </View>
            </View>

            <View style={styles.noteContainer}>
              <Text style={styles.noteTitle}>Note:</Text>
              <Text style={styles.noteText}>
                You can find your configuration values in Firebase Console → Project Settings → General → Your apps → Web app section.
                Make sure Anonymous Authentication is enabled for the app to work properly.
              </Text>
            </View>
          </View>
        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
  },
  errorCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#120d1b',
    textAlign: 'center' as const,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#664c9a',
    textAlign: 'center' as const,
    lineHeight: 24,
    marginBottom: 20,
  },
  errorBox: {
    backgroundColor: '#fff5f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#ff5757',
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
    fontFamily: 'monospace',
  },
  stepsContainer: {
    marginBottom: 24,
  },
  stepsTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#120d1b',
    marginBottom: 16,
  },
  step: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: '#6c2bee',
    marginRight: 8,
    minWidth: 20,
  },
  stepText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    flex: 1,
  },
  code: {
    fontFamily: 'monospace',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 14,
  },
  configBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  configText: {
    fontSize: 12,
    color: '#475569',
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  noteContainer: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: '#1e40af',
    marginBottom: 8,
  },
  noteText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
  configSourceText: {
    textAlign: 'center' as const,
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500' as const,
    marginBottom: 16,
    fontFamily: 'monospace',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    fontSize: 18,
    color: '#664c9a',
    fontWeight: '500' as const,
  },
});
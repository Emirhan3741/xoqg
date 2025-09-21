import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { configSource } from '@/services/firebase';

export default function DebugEnv() {
  const envVars = {
    EXPO_PUBLIC_FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    EXPO_PUBLIC_FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    EXPO_PUBLIC_FIREBASE_SENDER_ID: process.env.EXPO_PUBLIC_FIREBASE_SENDER_ID,
    EXPO_PUBLIC_FIREBASE_APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    EXPO_PUBLIC_FIREBASE_DATABASE_URL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  };

  console.log('[DEBUG] Raw process.env:', {
    keys: Object.keys(process.env).filter(k => k.startsWith('EXPO_PUBLIC_FIREBASE')),
    values: envVars
  });

  return (
    <>
      <Stack.Screen options={{ title: 'Debug Environment' }} />
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Environment Variables Debug</Text>
        <Text style={styles.subtitle}>Status: {Object.values(envVars).every(v => v) ? '✅ All loaded' : '❌ Some missing'}</Text>
        <Text style={styles.subtitle}>Config Source: {configSource()}</Text>
        {Object.entries(envVars).map(([key, value]) => (
          <View key={key} style={styles.row}>
            <Text style={styles.key}>{key}:</Text>
            <Text style={[styles.value, { color: value ? '#22c55e' : '#ef4444' }]}>
              {value ? (key.includes('API_KEY') ? '*** (present)' : value) : 'undefined'}
            </Text>
          </View>
        ))}
        
        <Text style={styles.subtitle}>All process.env keys starting with EXPO_PUBLIC_FIREBASE:</Text>
        <Text style={styles.info}>
          {Object.keys(process.env).filter(k => k.startsWith('EXPO_PUBLIC_FIREBASE')).join('\n') || 'None found'}
        </Text>
        
        <Text style={styles.subtitle}>Expected Values:</Text>
        <Text style={styles.info}>
          API_KEY: Should be present{'\n'}
          AUTH_DOMAIN: xoqg-f41c9.firebaseapp.com{'\n'}
          PROJECT_ID: xoqg-f41c9{'\n'}
          STORAGE_BUCKET: xoqg-f41c9.appspot.com{'\n'}
          SENDER_ID: 345865955324{'\n'}
          APP_ID: 1:345865955324:web:00e033bcad71f19da77479{'\n'}
          DATABASE_URL: https://xoqg-f41c9-default-rtdb.firebaseio.com
        </Text>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 8,
  },
  row: {
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
  key: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  value: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  info: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
});
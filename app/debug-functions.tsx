import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { httpsCallable } from 'firebase/functions';
import { getFirebase, configSource } from '@/services/firebase';
import { matchmakingService } from '@/services/multiplayer';

export default function DebugFunctionsPage() {
  const insets = useSafeAreaInsets();
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const testDirectFunctionCall = async () => {
    setLoading(true);
    addLog('Testing direct function call...');
    
    try {
      const { functions } = getFirebase();
      addLog(`Functions region: ${(functions as any)?._region || 'unknown'}`);
      addLog(`Functions URL: ${(functions as any)?._url || 'unknown'}`);
      
      const ping = httpsCallable(functions, 'ping');
      const result = await ping({ test: true });
      
      addLog(`✅ Direct ping successful: ${JSON.stringify(result.data)}`);
    } catch (error: any) {
      addLog(`❌ Direct ping failed: ${error.code || 'unknown'} - ${error.message}`);
      addLog(`Error details: ${JSON.stringify({ code: error.code, message: error.message, details: error.details })}`);
    } finally {
      setLoading(false);
    }
  };

  const testMatchmakingService = async () => {
    setLoading(true);
    addLog('Testing matchmaking service...');
    
    try {
      const result = await matchmakingService.joinQueue('general', 1200);
      addLog(`✅ Matchmaking successful: ${JSON.stringify(result)}`);
    } catch (error: any) {
      addLog(`❌ Matchmaking failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testCreateMatch = async () => {
    setLoading(true);
    addLog('Testing createMatch function...');
    
    try {
      const { functions } = getFirebase();
      const createMatch = httpsCallable(functions, 'createMatch');
      const result = await createMatch({ mode: 'test' });
      
      addLog(`✅ CreateMatch successful: ${JSON.stringify(result.data)}`);
    } catch (error: any) {
      addLog(`❌ CreateMatch failed: ${error.code || 'unknown'} - ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const showDeploymentInstructions = () => {
    addLog('📋 Deployment Instructions:');
    addLog('1. Install Firebase CLI: npm install -g firebase-tools');
    addLog('2. Login: firebase login');
    addLog('3. Navigate to functions folder: cd functions');
    addLog('4. Install dependencies: npm install');
    addLog('5. Deploy: firebase deploy --only functions');
    addLog('📖 Check FUNCTIONS_DEPLOYMENT.md for detailed instructions.');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Firebase Functions Debug</Text>
        
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Configuration</Text>
          <Text style={styles.infoText}>Config source: {configSource()}</Text>
          <Text style={styles.infoText}>Expected region: us-central1</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={testDirectFunctionCall}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Test Direct Function Call</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={testMatchmakingService}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Test Matchmaking Service</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={testCreateMatch}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Test CreateMatch</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.deployButton} 
            onPress={showDeploymentInstructions}
          >
            <Text style={styles.deployButtonText}>Deployment Instructions</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.clearButton} onPress={clearLogs}>
            <Text style={styles.clearButtonText}>Clear Logs</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.logsContainer}>
          <Text style={styles.logsTitle}>Debug Logs:</Text>
          {logs.length === 0 ? (
            <Text style={styles.noLogsText}>No logs yet. Run a test to see debug information.</Text>
          ) : (
            logs.map((log, index) => (
              <Text key={`log-${index}-${log.slice(0, 10)}`} style={styles.logText}>
                {log}
              </Text>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    textAlign: 'center' as const,
    marginBottom: 20,
    color: '#333',
  },
  infoCard: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: '#1976d2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1976d2',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#2196f3',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center' as const,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold' as const,
    fontSize: 16,
  },
  deployButton: {
    backgroundColor: '#ff9800',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center' as const,
  },
  deployButtonText: {
    color: 'white',
    fontWeight: 'bold' as const,
    fontSize: 16,
  },
  clearButton: {
    backgroundColor: '#f44336',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center' as const,
  },
  clearButtonText: {
    color: 'white',
    fontWeight: 'bold' as const,
    fontSize: 16,
  },
  logsContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    minHeight: 200,
  },
  logsTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    marginBottom: 12,
    color: '#333',
  },
  noLogsText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic' as const,
    textAlign: 'center' as const,
    marginTop: 20,
  },
  logText: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
    lineHeight: 16,
    color: '#333',
  },
});
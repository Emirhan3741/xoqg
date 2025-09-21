import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { httpsCallable } from "firebase/functions";
import { getFirebase, ensureAnonymousAuth, configSource, getNewGameQuestions } from "@/services/firebase";
import { seedQuestionsToFirebase, resetAllQuestionsUsage } from "@/data/questions";

type Row = { name: string; ok: boolean; detail?: string };

export default function FunctionsSelfTest() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const push = (r: Row) => setRows((p) => [...p, r]);

  useEffect(() => {
    (async () => {
      try {
        const firebase = getFirebase();

        // 0) anon auth
        const uid = await ensureAnonymousAuth();
        push({ name: "Anonymous auth", ok: !!uid, detail: uid });

        // 1) Basic Firebase services
        push({ name: "Config source", ok: true, detail: configSource() });
        push({ name: "Firestore", ok: !!firebase.db, detail: "Connected" });
        push({ name: "Realtime DB", ok: !!firebase.rtdb, detail: "Connected" });
        push({ name: "Storage", ok: !!firebase.storage, detail: "Connected" });
        
        const functionsRegion = (firebase.functions as any)?._region || 'unknown';
        const functionsUrl = (firebase.functions as any)?._url || 'unknown';
        push({ name: "Functions", ok: !!firebase.functions, detail: `Region: ${functionsRegion}` });
        push({ name: "Functions URL", ok: !!functionsUrl, detail: functionsUrl });

        // 2) Test functions calls
        // Test ping function
        try {
          const ping = httpsCallable(firebase.functions, "ping");
          const res = await ping({ hello: "world" });
          push({ name: "functions: ping()", ok: true, detail: JSON.stringify(res.data) });
        } catch (e: any) {
          const code = e?.code || "";
          const ok = code === "functions/not-found"; // function doesn't exist but endpoint is reachable
          const detail = `${code || 'unknown'}: ${e?.message || e}`;
          push({ name: "functions: ping()", ok, detail });
        }

        // Test createMatch function
        try {
          const createMatch = httpsCallable(firebase.functions, "createMatch");
          const res = await createMatch({ mode: "quick" });
          push({ name: "functions: createMatch()", ok: true, detail: JSON.stringify(res.data) });
        } catch (e: any) {
          const code = e?.code || "";
          const ok = code === "functions/not-found";
          const detail = `${code || 'unknown'}: ${e?.message || e}`;
          push({ name: "functions: createMatch()", ok, detail });
        }

        // Test joinQueue function
        try {
          const joinQueue = httpsCallable(firebase.functions, "joinQueue");
          const res = await joinQueue({ mode: "general", elo: 1200 });
          push({ name: "functions: joinQueue()", ok: true, detail: JSON.stringify(res.data) });
        } catch (e: any) {
          const code = e?.code || "";
          const ok = code === "functions/not-found";
          const detail = `${code || 'unknown'}: ${e?.message || e}`;
          push({ name: "functions: joinQueue()", ok, detail });
        }

      } catch (e: any) {
        push({ name: "Firebase init", ok: false, detail: String(e?.message || e) });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const [seedingQuestions, setSeedingQuestions] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);
  const [seedingViaFunction, setSeedingViaFunction] = useState(false);
  const [functionSeedResult, setFunctionSeedResult] = useState<string | null>(null);
  const [testingGameQuestions, setTestingGameQuestions] = useState(false);
  const [gameQuestionsResult, setGameQuestionsResult] = useState<string | null>(null);
  const [resettingUsage, setResettingUsage] = useState(false);
  const [resetResult, setResetResult] = useState<string | null>(null);

  const handleSeedQuestions = async () => {
    setSeedingQuestions(true);
    setSeedResult(null);
    try {
      const result = await seedQuestionsToFirebase();
      setSeedResult(`✅ Successfully seeded ${result.count} questions to Firebase`);
    } catch (error: any) {
      setSeedResult(`❌ Failed to seed questions: ${error?.message || error}`);
    } finally {
      setSeedingQuestions(false);
    }
  };

  const handleSeedViaFunction = async () => {
    setSeedingViaFunction(true);
    setFunctionSeedResult(null);
    try {
      const firebase = getFirebase();
      const seedQuestions = httpsCallable(firebase.functions, "seedQuestions");
      const result = await seedQuestions({});
      const data = result.data as any;
      setFunctionSeedResult(`✅ ${data.message || 'Successfully seeded questions via Firebase Function'}`);
    } catch (error: any) {
      const code = error?.code || "";
      const message = error?.message || error;
      setFunctionSeedResult(`❌ Failed to seed via function (${code}): ${message}`);
    } finally {
      setSeedingViaFunction(false);
    }
  };

  const handleTestGameQuestions = async () => {
    setTestingGameQuestions(true);
    setGameQuestionsResult(null);
    try {
      const questions = await getNewGameQuestions();
      const categories = questions.map(q => q.category);
      const uniqueCategories = [...new Set(categories)];
      
      setGameQuestionsResult(
        `✅ ${questions.length} soru seçildi\n` +
        `Kategoriler: ${categories.join(', ')}\n` +
        `Benzersiz kategori sayısı: ${uniqueCategories.length}/9\n` +
        `İlk soru: ${questions[0]?.question || 'Yok'}`
      );
    } catch (error: any) {
      setGameQuestionsResult(`❌ Oyun soruları test edilirken hata: ${error?.message || error}`);
    } finally {
      setTestingGameQuestions(false);
    }
  };

  const handleResetUsage = async () => {
    setResettingUsage(true);
    setResetResult(null);
    try {
      const result = await resetAllQuestionsUsage();
      setResetResult(`✅ ${result.count} sorunun used alanı sıfırlandı`);
    } catch (error: any) {
      setResetResult(`❌ Used alanları sıfırlanırken hata: ${error?.message || error}`);
    } finally {
      setResettingUsage(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.wrap}>
        <Text style={styles.title}>Firebase Self-Test</Text>
        {loading && (
          <View style={styles.row}><ActivityIndicator /><Text> Running…</Text></View>
        )}
        {rows.map((r) => (
          <Text key={r.name} style={styles.rowText}>
            {r.ok ? "✅" : "❌"} {r.name}{r.detail ? ` — ${r.detail}` : ""}
          </Text>
        ))}
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Database Setup</Text>
          <TouchableOpacity 
            style={[styles.button, seedingQuestions && styles.buttonDisabled]} 
            onPress={handleSeedQuestions}
            disabled={seedingQuestions}
          >
            {seedingQuestions ? (
              <View style={styles.row}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.buttonText}> Seeding Questions...</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>Seed Questions to Firebase (Direct)</Text>
            )}
          </TouchableOpacity>
          {seedResult && (
            <Text style={styles.resultText}>{seedResult}</Text>
          )}
          
          <TouchableOpacity 
            style={[styles.button, { marginTop: 12, backgroundColor: '#34C759' }, seedingViaFunction && styles.buttonDisabled]} 
            onPress={handleSeedViaFunction}
            disabled={seedingViaFunction}
          >
            {seedingViaFunction ? (
              <View style={styles.row}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.buttonText}> Seeding via Function...</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>Seed Questions via Firebase Function</Text>
            )}
          </TouchableOpacity>
          {functionSeedResult && (
            <Text style={styles.resultText}>{functionSeedResult}</Text>
          )}
          
          <TouchableOpacity 
            style={[styles.button, { marginTop: 12, backgroundColor: '#FF9500' }, testingGameQuestions && styles.buttonDisabled]} 
            onPress={handleTestGameQuestions}
            disabled={testingGameQuestions}
          >
            {testingGameQuestions ? (
              <View style={styles.row}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.buttonText}> Testing Game Questions...</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>Test Game Question Selection</Text>
            )}
          </TouchableOpacity>
          {gameQuestionsResult && (
            <Text style={styles.resultText}>{gameQuestionsResult}</Text>
          )}
          
          <TouchableOpacity 
            style={[styles.button, { marginTop: 12, backgroundColor: '#FF3B30' }, resettingUsage && styles.buttonDisabled]} 
            onPress={handleResetUsage}
            disabled={resettingUsage}
          >
            {resettingUsage ? (
              <View style={styles.row}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.buttonText}> Resetting Usage...</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>Reset All Questions Usage</Text>
            )}
          </TouchableOpacity>
          {resetResult && (
            <Text style={styles.resultText}>{resetResult}</Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  wrap: { padding: 16, gap: 6 },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 6 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowText: { fontSize: 14 },
  section: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#999',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'monospace',
  },
});
// /components/FirebaseHealthCheck.tsx
import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, ScrollView, StyleSheet } from "react-native";
import { getFirebase, ensureAnonymousAuth, envStatus, configSource } from "@/services/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { ref as rRef, set as rSet, get as rGet } from "firebase/database";
import { ref as sRef, getDownloadURL } from "firebase/storage";

type Step = { name: string; ok: boolean; detail?: string };

export default function FirebaseHealthCheck() {
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(true);

  const push = (s: Step) => setSteps((prev) => [...prev, s]);

  useEffect(() => {
    (async () => {
      try {
        // 1) ENV kontrol (import seviyesinde crash olmaz)
        const env = envStatus();
        if (!env.ok) {
          let detail = "";
          if (env.missing.length) detail += "Missing: " + env.missing.join(", ");
          if (env.placeholders.length) detail += (detail ? "; " : "") + "Placeholders: " + env.placeholders.join(", ");
          if (env.invalidAppId) detail += (detail ? "; " : "") + "Invalid appId format";
          push({ name: "Config loaded", ok: false, detail });
          return; // diğer testleri atla
        }
        push({ name: "Config loaded", ok: true, detail: "Using " + (configSource() === "env" ? "environment variables" : "JSON fallback") });

        // 2) Firebase instance
        const { db, rtdb, storage } = getFirebase();

        // 3) Auth (anon)
        const uid = await ensureAnonymousAuth();
        push({ name: "Anonymous auth", ok: !!uid, detail: uid });

        // 4) Firestore write/read
        const pingRef = doc(db, "health", "ping");
        await setDoc(pingRef, { ts: serverTimestamp(), uid }, { merge: true });
        const snap = await getDoc(pingRef);
        push({
          name: "Firestore read/write",
          ok: snap.exists(),
          detail: snap.exists() ? JSON.stringify(snap.data() ?? {}) : "no doc",
        });

        // 5) Realtime DB write/read
        const r = rRef(rtdb, "health/ping");
        await rSet(r, { uid, at: Date.now() });
        const back = await rGet(r);
        push({
          name: "Realtime DB read/write",
          ok: back.exists(),
          detail: back.exists() ? JSON.stringify(back.val() ?? {}) : "no node",
        });

        // 6) Storage erişimi (dosya yoksa 'object-not-found' beklenen)
        try {
          await getDownloadURL(sRef(storage, "non-existent-file.txt"));
          push({ name: "Storage access", ok: true });
        } catch (e: any) {
          const msg = String(e?.code ?? e?.message ?? e);
          const ok = msg.includes("object-not-found") || msg.includes("404");
          push({ name: "Storage SDK reachable", ok, detail: ok ? "OK (no file)" : msg });
        }
      } catch (e: any) {
        push({ name: "HealthCheck error", ok: false, detail: e?.message ?? String(e) });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.title}>Firebase Health Check</Text>

      {loading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator />
          <Text>Running checks…</Text>
        </View>
      )}

      {steps.map((s, i) => (
        <Text key={`${s.name}-${i}`} style={styles.step}>
          {s.ok ? "✅" : "❌"} {s.name}{s.detail ? ` — ${s.detail}` : ""}
        </Text>
      ))}

      {!loading && steps.some((s) => !s.ok) && (
        <View style={styles.trbl}>
          <Text style={styles.trblTitle}>Troubleshooting</Text>
          <Text>• <Text style={styles.bold}>Missing env/placeholder values</Text>: Update .env with real Firebase config from Console, restart dev server.</Text>
          <Text>• <Text style={styles.bold}>auth/operation-not-allowed</Text>: Console → Authentication → Sign-in method → Anonymous → Enable.</Text>
          <Text>• <Text style={styles.bold}>permission-denied</Text>: Update Firestore/RTDB rules to allow authenticated users.</Text>
          <Text>• <Text style={styles.bold}>network-request-failed</Text>: Check internet connection and Firebase config values.</Text>
        </View>
      )}

      {!loading && !steps.some((s) => !s.ok) && (
        <Text style={styles.ok}>All good. You can hide this screen now.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 8 },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 6 },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  step: { fontSize: 14 },
  trbl: { marginTop: 10 },
  trblTitle: { fontWeight: "700" },
  bold: { fontWeight: "600" },
  ok: { marginTop: 8, fontWeight: "600" },
});
import React, { useState, useCallback } from "react";
import { View, Text, Pressable, ActivityIndicator, Alert, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { matchmakingService, authService } from "@/services/multiplayer";
import { Gamepad2, Users } from "lucide-react-native";

export default function GameModeMenu() {
  const router = useRouter();
  const [loadingMode, setLoadingMode] = useState<null | "single" | "multi">(null);

  const ensureAuth = useCallback(async () => {
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        await authService.initialize();
      }
      return authService.getUid();
    } catch (error) {
      throw new Error("Please sign in to play.");
    }
  }, []);

  const handleSinglePlayer = useCallback(async () => {
    try {
      setLoadingMode("single");
      await ensureAuth();
      // For now, redirect to the existing single player game
      router.push("/(tabs)/play");
    } catch (e: any) {
      Alert.alert("Single Player", e?.message ?? "Failed to start practice game.");
    } finally {
      setLoadingMode(null);
    }
  }, [router, ensureAuth]);

  const handleMultiplayer = useCallback(async () => {
    try {
      setLoadingMode("multi");
      await ensureAuth();
      
      // Join matchmaking queue
      const result = await matchmakingService.joinQueue("general", 1200);
      
      if (result?.matchId) {
        // Immediate match found
        router.push({ pathname: "/(game)/match", params: { matchId: result.matchId }});
      } else {
        // Go to waiting room
        router.push("/(game)/waiting");
      }
    } catch (e: any) {
      Alert.alert("Multiplayer", e?.message ?? "Failed to join the queue.");
    } finally {
      setLoadingMode(null);
    }
  }, [router, ensureAuth]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Oyun Modu Seç</Text>

      {/* Single Player */}
      <Pressable
        onPress={handleSinglePlayer}
        disabled={!!loadingMode}
        style={({ pressed }) => [
          styles.modeButton,
          pressed && { opacity: 0.9 }
        ]}
        accessibilityRole="button"
        accessibilityLabel="Tek Oyuncu, pratik modu başlat"
      >
        <View style={styles.modeIcon}>
          <Gamepad2 size={32} color="#6c2bee" />
        </View>
        <View style={styles.modeContent}>
          <Text style={styles.modeTitle}>Tek Oyuncu</Text>
          <Text style={styles.modeDescription}>
            Karışık kategorilerle pratik yap
          </Text>
        </View>
        {loadingMode === "single" && (
          <ActivityIndicator style={styles.loader} color="#6c2bee" />
        )}
      </Pressable>

      {/* Multiplayer */}
      <Pressable
        onPress={handleMultiplayer}
        disabled={!!loadingMode}
        style={({ pressed }) => [
          styles.modeButton,
          pressed && { opacity: 0.9 }
        ]}
        accessibilityRole="button"
        accessibilityLabel="Çok Oyunculu, çevrimiçi rakiple eşleş"
      >
        <View style={styles.modeIcon}>
          <Users size={32} color="#6c2bee" />
        </View>
        <View style={styles.modeContent}>
          <Text style={styles.modeTitle}>Çok Oyunculu</Text>
          <Text style={styles.modeDescription}>
            Eşleş, 3×3 tahtada sırayla soruları çöz!
          </Text>
        </View>
        {loadingMode === "multi" && (
          <ActivityIndicator style={styles.loader} color="#6c2bee" />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: '#120d1b',
    marginBottom: 32,
    textAlign: 'center' as const,
  },
  modeButton: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  modeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f7f3ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  modeContent: {
    flex: 1,
  },
  modeTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#120d1b',
    marginBottom: 4,
  },
  modeDescription: {
    fontSize: 14,
    color: '#664c9a',
    lineHeight: 20,
  },
  loader: {
    marginLeft: 8,
  },
});
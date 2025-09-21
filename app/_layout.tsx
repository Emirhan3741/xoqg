import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { StyleSheet, View, Text, ActivityIndicator } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "@/hooks/useAuthStore";
import ConfigCheck from "@/components/ConfigCheck";
import FirebaseHealthCheck from "@/components/FirebaseHealthCheck";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <>
      <StatusBar style={statusBarStyle} />
      <Stack screenOptions={stackScreenOptions}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(game)" />
      </Stack>
    </>
  );
}

function AppContent() {
  const { isInitialized, isLoading, error } = useAuth();
  const [showHealthCheck, setShowHealthCheck] = useState(true);

  useEffect(() => {
    if (isInitialized) {
      SplashScreen.hideAsync();
    }
    // Hide health check after 2 seconds for quick verification
    const timer = setTimeout(() => setShowHealthCheck(false), 2000);
    return () => clearTimeout(timer);
  }, [isInitialized]);

  // Show health check first for quick Firebase service verification
  if (showHealthCheck) {
    return <FirebaseHealthCheck />;
  }

  if (error && (error.includes('network-request-failed') || error.includes('auth/') || error.includes('Firebase') || error.includes('Missing Firebase env'))) {
    return <ConfigCheck error={error} />;
  }

  // Only show loading if we're not initialized AND still loading
  // If initialized but loading, let the navigation handle it
  if (!isInitialized && isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6c2bee" />
        <Text style={styles.loadingText}>Initializing...</Text>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }

  // If initialized, always show the navigation
  // The auth state will handle redirects
  return <RootLayoutNav />;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <GestureHandlerRootView style={styles.container}>
          <AppContent />
        </GestureHandlerRootView>
      </AuthProvider>
    </QueryClientProvider>
  );
}

const stackScreenOptions = {
  headerShown: false,
};

const statusBarStyle = "light" as const;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F3FF',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#664c9a',
    fontWeight: '500' as const,
  },
  errorText: {
    fontSize: 14,
    color: '#ff5757',
    textAlign: 'center' as const,
    paddingHorizontal: 24,
  },
});
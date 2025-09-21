import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, User, signInAnonymously, GoogleAuthProvider, signInWithCredential, OAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirebase, envStatus } from '@/services/firebase';
import * as AuthSession from 'expo-auth-session';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { router } from 'expo-router';

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<User>;
  signInWithApple: () => Promise<User>;
  signInAnonymous: () => Promise<User>;
  signOut: () => Promise<void>;
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signInAnonymous = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Signing in anonymously...');
      const { auth } = getFirebase();
      const userCredential = await signInAnonymously(auth);
      console.log('Anonymous sign in successful:', userCredential.user.uid);
      return userCredential.user;
    } catch (err: any) {
      console.error('Anonymous sign in failed:', err);
      const errorMessage = err.message || 'Authentication failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Starting Google sign in...');
      
      const { auth } = getFirebase();
      
      if (Platform.OS === 'web') {
        // Web implementation
        const provider = new GoogleAuthProvider();
        provider.addScope('profile');
        provider.addScope('email');
        
        const result = await signInWithPopup(auth, provider);
        console.log('Google sign in successful:', result.user.uid);
        return result.user;
      } else {
        // Mobile implementation with AuthSession
        const redirectUri = AuthSession.makeRedirectUri();
        const request = new AuthSession.AuthRequest({
          clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '',
          scopes: ['openid', 'profile', 'email'],
          redirectUri,
          responseType: AuthSession.ResponseType.Code,
          extraParams: {},
        });
        
        const result = await request.promptAsync({
          authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
        });
        
        if (result.type === 'success') {
          const { code } = result.params;
          
          // Exchange code for tokens
          const tokenResponse = await AuthSession.exchangeCodeAsync(
            {
              clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '',
              code,
              redirectUri,
              extraParams: {
                client_secret: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_SECRET || '',
              },
            },
            {
              tokenEndpoint: 'https://oauth2.googleapis.com/token',
            }
          );
          
          const credential = GoogleAuthProvider.credential(
            tokenResponse.idToken,
            tokenResponse.accessToken
          );
          
          const userCredential = await signInWithCredential(auth, credential);
          console.log('Google sign in successful:', userCredential.user.uid);
          return userCredential.user;
        } else {
          throw new Error('Google sign in was cancelled');
        }
      }
    } catch (err: any) {
      console.error('Google sign in failed:', err);
      const errorMessage = err.message || 'Google authentication failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signInWithApple = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Starting Apple sign in...');
      
      const { auth } = getFirebase();
      
      if (Platform.OS !== 'ios') {
        throw new Error('Apple Sign In is only available on iOS');
      }
      
      const nonce = Math.random().toString(36).substring(2, 10);
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        nonce,
        { encoding: Crypto.CryptoEncoding.HEX }
      );
      
      const appleCredential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });
      
      const { identityToken } = appleCredential;
      
      if (!identityToken) {
        throw new Error('Apple Sign In failed - no identity token');
      }
      
      const provider = new OAuthProvider('apple.com');
      const credential = provider.credential({
        idToken: identityToken,
        rawNonce: nonce,
      });
      
      const userCredential = await signInWithCredential(auth, credential);
      console.log('Apple sign in successful:', userCredential.user.uid);
      return userCredential.user;
    } catch (err: any) {
      console.error('Apple sign in failed:', err);
      if (err.code === 'ERR_REQUEST_CANCELED') {
        throw err; // Don't show error for user cancellation
      }
      const errorMessage = err.message || 'Apple authentication failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { auth } = getFirebase();
      await auth.signOut();
      console.log('User signed out');
      
      // Clear user state immediately
      setUser(null);
      
      // Navigate to login page after successful logout
      router.replace('/login');
    } catch (err: any) {
      console.error('Sign out failed:', err);
      setError(err.message || 'Sign out failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log('Setting up auth state listener...');
    
    // Check if environment is ready first
    const env = envStatus();
    if (!env.ok) {
      console.error('Firebase env not ready:', env.missing.join(',') + ' hasPlaceholders:', env.placeholders.length > 0);
      
      let errorMsg = 'Firebase env not ready: ';
      if (env.missing.length > 0) {
        errorMsg += env.missing.join(',');
      }
      if (env.placeholders.length > 0) {
        errorMsg += ' hasPlaceholders: true';
      } else {
        errorMsg += ' hasPlaceholders: false';
      }
      if (env.invalidAppId) {
        errorMsg += ' invalidAppId: true';
      }
      
      setError(errorMsg);
      setIsLoading(false);
      setIsInitialized(true);
      return;
    }

    try {
      const { auth } = getFirebase();
      
      const unsubscribe = onAuthStateChanged(
        auth,
        async (firebaseUser) => {
          console.log('Auth state changed:', firebaseUser?.uid || 'null');
          try {
            setUser(firebaseUser);
            setError(null);
            
            if (!firebaseUser) {
              console.log('No user found, redirecting to login...');
              // Always redirect to login when no user is found
              router.replace('/login');
            }
          } catch (err: any) {
            console.error('Auth error:', err);
            let errorMessage = err.message || 'Authentication error';
            if ((err as any).code === 'auth/operation-not-allowed') {
              errorMessage = 'Anonymous authentication is not enabled. Please enable it in Firebase Console → Authentication → Sign-in method → Anonymous.';
            } else if ((err as any).code === 'auth/network-request-failed') {
              errorMessage = 'Network error. Please check your internet connection and Firebase configuration.';
            }
            setError(errorMessage);
          } finally {
            setIsLoading(false);
            setIsInitialized(true);
          }
        },
        (err) => {
          console.error('Auth state change error:', err);
          let errorMessage = err.message || 'Auth listener error';
          if ((err as any).code === 'auth/network-request-failed') {
            errorMessage = 'Firebase network error. Please check your configuration and internet connection.';
          }
          setError(errorMessage);
          setIsLoading(false);
          setIsInitialized(true);
        }
      );

      return () => {
        console.log('Cleaning up auth listener');
        unsubscribe();
      };
    } catch (err: any) {
      console.error('Failed to initialize Firebase auth:', err);
      let errorMessage = err.message || 'Firebase initialization failed';
      if (err.message?.includes('placeholder') || err.message?.includes('REPLACE')) {
        errorMessage = 'Firebase config contains placeholder values. Please update .env with real values from Firebase Console.';
      }
      setError(errorMessage);
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, []);

  return {
    user,
    isLoading,
    isInitialized,
    error,
    signInWithGoogle,
    signInWithApple,
    signInAnonymous,
    signOut,
  };
});
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { X, Circle, LogIn, Sparkles, Users, Trophy } from 'lucide-react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useAuth } from '@/hooks/useAuthStore';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(0);
  const { signInWithGoogle, signInWithApple, signInAnonymous } = useAuth();
  const insets = useSafeAreaInsets();
  
  // Animation values
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);
  const scaleAnim = new Animated.Value(0.8);
  const rotateAnim = new Animated.Value(0);
  
  const features = [
    { icon: Trophy, text: 'Arkadaşlarınla yarış', color: '#FFD700' },
    { icon: Users, text: 'Çok oyunculu oyunlar', color: '#4CAF50' },
    { icon: Sparkles, text: 'Binlerce soru', color: '#E91E63' },
  ];
  
  useEffect(() => {
    // Initial animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Rotating animation for game board
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();
    
    // Feature cycling
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);
  
  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      console.error(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await signInWithGoogle();
      router.replace('/play');
    } catch (error: any) {
      console.error('Google sign in error:', error);
      showAlert('Hata', 'Google ile giriş yapılamadı. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setIsLoading(true);
      await signInWithApple();
      router.replace('/play');
    } catch (error: any) {
      console.error('Apple sign in error:', error);
      if (error.code !== 'ERR_REQUEST_CANCELED') {
        showAlert('Hata', 'Apple ile giriş yapılamadı. Lütfen tekrar deneyin.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnonymousSignIn = async () => {
    try {
      setIsLoading(true);
      await signInAnonymous();
      router.replace('/play');
    } catch (error: any) {
      console.error('Anonymous sign in error:', error);
      showAlert('Hata', 'Anonim giriş yapılamadı. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0612" />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#0a0612', '#1a1122', '#2d1b3d']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Floating Background Elements */}
      <View style={styles.backgroundElements}>
        <Animated.View 
          style={[
            styles.floatingElement,
            styles.element1,
            { transform: [{ rotate: spin }] }
          ]}
        />
        <Animated.View 
          style={[
            styles.floatingElement,
            styles.element2,
            { transform: [{ rotate: spin }] }
          ]}
        />
        <Animated.View 
          style={[
            styles.floatingElement,
            styles.element3,
            { transform: [{ rotate: spin }] }
          ]}
        />
      </View>
      
      <Animated.View 
        style={[
          styles.content,
          {
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 20,
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim }
            ]
          }
        ]}
      >
        {/* Animated Game Board */}
        <Animated.View style={[styles.gameBoard, { transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.boardContainer}>
            <View style={styles.boardRow}>
              <Animated.View style={[styles.boardCell, styles.cellAnimated]}>
                <X size={28} color="#8013ec" strokeWidth={3} />
              </Animated.View>
              <Animated.View style={[styles.boardCell, styles.cellAnimated]}>
                <Circle size={28} color="#e91e63" strokeWidth={3} />
              </Animated.View>
              <View style={styles.boardCell} />
            </View>
            <View style={styles.boardRow}>
              <Animated.View style={[styles.boardCell, styles.cellAnimated]}>
                <Circle size={28} color="#e91e63" strokeWidth={3} />
              </Animated.View>
              <Animated.View style={[styles.boardCell, styles.cellAnimated]}>
                <X size={28} color="#8013ec" strokeWidth={3} />
              </Animated.View>
              <View style={styles.boardCell} />
            </View>
            <View style={styles.boardRow}>
              <View style={styles.boardCell} />
              <View style={styles.boardCell} />
              <Animated.View style={[styles.boardCell, styles.cellAnimated]}>
                <X size={28} color="#8013ec" strokeWidth={3} />
              </Animated.View>
            </View>
          </View>
        </Animated.View>

        {/* Title with Gradient */}
        <Animated.View style={[styles.titleContainer, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.title}>
            <Text style={styles.titleX}>X-O</Text>
            <Text style={styles.titleRest}> Quiz</Text>
          </Text>
          <Text style={styles.titleGame}>Game</Text>
        </Animated.View>
        
        {/* Feature Showcase */}
        <Animated.View style={[styles.featureContainer, { opacity: fadeAnim }]}>
          {(() => {
            const IconComponent = features[currentFeature].icon;
            return (
              <IconComponent 
                size={24} 
                color={features[currentFeature].color} 
                style={styles.featureIcon}
              />
            );
          })()}
          <Text style={[styles.featureText, { color: features[currentFeature].color }]}>
            {features[currentFeature].text}
          </Text>
        </Animated.View>

        {/* Sign In Buttons */}
        <Animated.View 
          style={[
            styles.buttonContainer,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          {/* Google Sign In */}
          <TouchableOpacity 
            style={[styles.signInButton, styles.googleButton]} 
            onPress={handleGoogleSignIn}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <View style={styles.googleIcon}>
              <Text style={styles.googleIconText}>G</Text>
            </View>
            <Text style={styles.buttonText}>Google ile Giriş Yap</Text>
            {isLoading && <ActivityIndicator size="small" color="#666" />}
          </TouchableOpacity>

          {/* Apple Sign In - Only show on iOS */}
          {Platform.OS === 'ios' && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={16}
              style={styles.appleButton}
              onPress={handleAppleSignIn}
            />
          )}

          {/* Anonymous Sign In */}
          <TouchableOpacity 
            style={[styles.signInButton, styles.anonymousButton]} 
            onPress={handleAnonymousSignIn}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <LogIn size={22} color="#FFFFFF" />
            <Text style={[styles.buttonText, styles.anonymousButtonText]}>
              Misafir Olarak Devam Et
            </Text>
            {isLoading && <ActivityIndicator size="small" color="#FFFFFF" />}
          </TouchableOpacity>
        </Animated.View>

        {/* Benefits */}
        <Animated.View style={[styles.benefitsContainer, { opacity: fadeAnim }]}>
          <View style={styles.benefitItem}>
            <View style={styles.benefitDot} />
            <Text style={styles.benefitText}>Kişisel istatistiklerin</Text>
          </View>
          <View style={styles.benefitItem}>
            <View style={styles.benefitDot} />
            <Text style={styles.benefitText}>Arkadaşlarınla yarış</Text>
          </View>
          <View style={styles.benefitItem}>
            <View style={styles.benefitDot} />
            <Text style={styles.benefitText}>Liderlik tablosu</Text>
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0612',
  },
  backgroundElements: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  floatingElement: {
    position: 'absolute',
    borderRadius: 50,
    opacity: 0.1,
  },
  element1: {
    width: 100,
    height: 100,
    backgroundColor: '#8013ec',
    top: '15%',
    right: '10%',
  },
  element2: {
    width: 60,
    height: 60,
    backgroundColor: '#e91e63',
    top: '70%',
    left: '15%',
  },
  element3: {
    width: 80,
    height: 80,
    backgroundColor: '#4CAF50',
    top: '40%',
    right: '20%',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  gameBoard: {
    marginBottom: 40,
  },
  boardContainer: {
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  boardRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  boardCell: {
    width: 52,
    height: 52,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cellAnimated: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#8013ec',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 56,
    fontWeight: '800' as const,
    textAlign: 'center',
    letterSpacing: -2,
    textShadowColor: 'rgba(128, 19, 236, 0.5)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
  },
  titleX: {
    color: '#8013ec',
  },
  titleRest: {
    color: '#FFFFFF',
  },
  titleGame: {
    fontSize: 24,
    fontWeight: '600' as const,
    color: '#ad92c9',
    marginTop: -8,
    letterSpacing: 4,
  },
  featureContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minHeight: 56,
    gap: 12,
  },
  featureIcon: {
    shadowColor: 'currentColor',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  featureText: {
    fontSize: 16,
    fontWeight: '600' as const,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 340,
    gap: 20,
    marginBottom: 32,
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    borderRadius: 16,
    paddingHorizontal: 24,
    gap: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    shadowColor: '#000000',
  },
  googleIcon: {
    width: 28,
    height: 28,
    backgroundColor: '#4285F4',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIconText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  appleButton: {
    height: 60,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  anonymousButton: {
    backgroundColor: 'rgba(128, 19, 236, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(128, 19, 236, 0.4)',
    shadowColor: '#8013ec',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#333333',
    flex: 1,
    textAlign: 'center' as const,
  },
  anonymousButtonText: {
    color: '#FFFFFF',
    fontWeight: '700' as const,
  },
  benefitsContainer: {
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#8013ec',
  },
  benefitText: {
    color: '#ad92c9',
    fontSize: 15,
    fontWeight: '500' as const,
  },
});
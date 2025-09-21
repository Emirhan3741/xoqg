import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserStats {
  elo: number;
  wins: number;
  losses: number;
  draws: number;
  gamesPlayed: number;
  accuracy: number;
  currentStreak: number;
  bestStreak: number;
}

export interface UserSettings {
  language: 'tr' | 'en';
  notifications: {
    enabled: boolean;
    turnNotifications: boolean;
    gameResults: boolean;
  };
  sound: boolean;
  vibration: boolean;
  privacy: {
    profileVisibility: 'everyone' | 'friends';
    allowInvites: boolean;
  };
}

export interface User {
  uid: string;
  username: string;
  email: string;
  photoURL: string;
  country: string;
  bio?: string;
  stats: UserStats;
  settings: UserSettings;
  createdAt: string;
}

export interface Session {
  id: string;
  deviceName: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

const defaultUser: User = {
  uid: 'demo-user-123',
  username: 'DemoPlayer',
  email: 'demo@example.com',
  photoURL: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBrrYX3GSQP_QP0Q8bRhDPf-dP3NxhWJnfaVTDuDsRBJwX7PyD-BGTPCovJ4jOgZe9NR80dzfE5JUuGAt-b6vvnU3NooRMJxeBL4koe1TXOT9zsFYavbX71d4mxkK5d0XVXe2z_UAQSkWJsFurcFD_c0_WGRGOXR_rUggNYd6eYkU2GPFlZCsmiYgIqSnIK4ldVkoKlaHmRvOwHXq_bTU_wuPLLOr0NIg0mCf0ax_9HQtK6eszHAuSiwyD8A4Vebkm9H9tiYM6lkkrF',
  country: 'Türkiye',
  bio: 'Quiz oyunlarını seviyorum! 🎯',
  stats: {
    elo: 1250,
    wins: 15,
    losses: 8,
    draws: 3,
    gamesPlayed: 26,
    accuracy: 0.78,
    currentStreak: 3,
    bestStreak: 7,
  },
  settings: {
    language: 'tr',
    notifications: {
      enabled: true,
      turnNotifications: true,
      gameResults: true,
    },
    sound: true,
    vibration: true,
    privacy: {
      profileVisibility: 'everyone',
      allowInvites: true,
    },
  },
  createdAt: '2024-01-15T10:30:00Z',
};

const defaultSessions: Session[] = [
  {
    id: 'session-1',
    deviceName: 'iPhone 15 Pro',
    location: 'İstanbul, Türkiye',
    lastActive: '2 dakika önce',
    isCurrent: true,
  },
  {
    id: 'session-2',
    deviceName: 'MacBook Pro',
    location: 'İstanbul, Türkiye',
    lastActive: '1 saat önce',
    isCurrent: false,
  },
  {
    id: 'session-3',
    deviceName: 'iPad Air',
    location: 'Ankara, Türkiye',
    lastActive: '2 gün önce',
    isCurrent: false,
  },
];

export const [UserProvider, useUser] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<Session[]>(defaultSessions);
  const [isLoading, setIsLoading] = useState(false);

  const loadUser = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('Loading user data...');
      
      // Try to load from AsyncStorage first
      const storedUser = await AsyncStorage.getItem('user_profile');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        console.log('User loaded from storage:', parsedUser.username);
      } else {
        // Use default user for demo
        setUser(defaultUser);
        await AsyncStorage.setItem('user_profile', JSON.stringify(defaultUser));
        console.log('Default user loaded');
      }
    } catch (error) {
      console.error('Error loading user:', error);
      setUser(defaultUser);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<Pick<User, 'username' | 'bio' | 'photoURL' | 'country'>>) => {
    if (!user) return;

    try {
      console.log('Updating profile:', updates);
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      await AsyncStorage.setItem('user_profile', JSON.stringify(updatedUser));
      console.log('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  }, [user]);

  const updateSettings = useCallback(async (updates: Partial<UserSettings>) => {
    if (!user) return;

    try {
      console.log('Updating settings:', updates);
      const updatedSettings = { ...user.settings, ...updates };
      const updatedUser = { ...user, settings: updatedSettings };
      setUser(updatedUser);
      await AsyncStorage.setItem('user_profile', JSON.stringify(updatedUser));
      console.log('Settings updated successfully');
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  }, [user]);

  const updateStats = useCallback(async (updates: Partial<UserStats>) => {
    if (!user) return;

    try {
      console.log('Updating stats:', updates);
      const updatedStats = { ...user.stats, ...updates };
      const updatedUser = { ...user, stats: updatedStats };
      setUser(updatedUser);
      await AsyncStorage.setItem('user_profile', JSON.stringify(updatedUser));
      console.log('Stats updated successfully');
    } catch (error) {
      console.error('Error updating stats:', error);
    }
  }, [user]);

  const terminateSession = useCallback(async (sessionId: string) => {
    try {
      console.log('Terminating session:', sessionId);
      const updatedSessions = sessions.filter(session => session.id !== sessionId);
      setSessions(updatedSessions);
      console.log('Session terminated successfully');
    } catch (error) {
      console.error('Error terminating session:', error);
    }
  }, [sessions]);

  const logout = useCallback(async () => {
    try {
      console.log('Logging out user...');
      await AsyncStorage.removeItem('user_profile');
      setUser(null);
      console.log('User logged out successfully');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }, []);

  return useMemo(() => ({
    user,
    sessions,
    isLoading,
    loadUser,
    updateProfile,
    updateSettings,
    updateStats,
    terminateSession,
    logout,
  }), [
    user,
    sessions,
    isLoading,
    loadUser,
    updateProfile,
    updateSettings,
    updateStats,
    terminateSession,
    logout,
  ]);
});
import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './useAuthStore';
import * as Clipboard from 'expo-clipboard';
import { Alert, Platform } from 'react-native';

export interface Friend {
  id: string;
  username: string;
  email: string;
  photoURL: string;
  country: string;
  elo: number;
  isOnline: boolean;
  lastSeen: string;
  addedAt: string;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUsername: string;
  fromPhotoURL: string;
  fromElo: number;
  toUserId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  inviteCode?: string;
}

export interface InviteLink {
  code: string;
  createdAt: string;
  expiresAt: string;
  usedBy?: string;
  isActive: boolean;
}

const mockFriends: Friend[] = [
  {
    id: 'friend-1',
    username: 'QuizMaster',
    email: 'quizmaster@example.com',
    photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    country: 'Türkiye',
    elo: 1420,
    isOnline: true,
    lastSeen: 'Şimdi',
    addedAt: '2024-01-10T15:30:00Z',
  },
  {
    id: 'friend-2',
    username: 'BrainStorm',
    email: 'brainstorm@example.com',
    photoURL: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    country: 'Türkiye',
    elo: 1180,
    isOnline: false,
    lastSeen: '2 saat önce',
    addedAt: '2024-01-08T10:15:00Z',
  },
  {
    id: 'friend-3',
    username: 'KnowledgeSeeker',
    email: 'knowledge@example.com',
    photoURL: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    country: 'Almanya',
    elo: 1350,
    isOnline: true,
    lastSeen: 'Şimdi',
    addedAt: '2024-01-05T08:45:00Z',
  },
];

const mockFriendRequests: FriendRequest[] = [
  {
    id: 'request-1',
    fromUserId: 'user-123',
    fromUsername: 'SmartPlayer',
    fromPhotoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face',
    fromElo: 1290,
    toUserId: 'demo-user-123',
    status: 'pending',
    createdAt: '2024-01-15T12:00:00Z',
  },
  {
    id: 'request-2',
    fromUserId: 'user-456',
    fromUsername: 'QuizChampion',
    fromPhotoURL: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    fromElo: 1450,
    toUserId: 'demo-user-123',
    status: 'pending',
    createdAt: '2024-01-14T16:30:00Z',
  },
];

export const [FriendsProvider, useFriends] = createContextHook(() => {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [inviteLinks, setInviteLinks] = useState<InviteLink[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadFriends = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('Loading friends...');
      
      // Load from AsyncStorage
      const storedFriends = await AsyncStorage.getItem('user_friends');
      const storedRequests = await AsyncStorage.getItem('friend_requests');
      const storedInvites = await AsyncStorage.getItem('invite_links');
      
      if (storedFriends) {
        setFriends(JSON.parse(storedFriends));
      } else {
        // Use mock data for demo
        setFriends(mockFriends);
        await AsyncStorage.setItem('user_friends', JSON.stringify(mockFriends));
      }
      
      if (storedRequests) {
        setFriendRequests(JSON.parse(storedRequests));
      } else {
        setFriendRequests(mockFriendRequests);
        await AsyncStorage.setItem('friend_requests', JSON.stringify(mockFriendRequests));
      }
      
      if (storedInvites) {
        setInviteLinks(JSON.parse(storedInvites));
      }
      
      console.log('Friends loaded successfully');
    } catch (error) {
      console.error('Error loading friends:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateInviteLink = useCallback(async (): Promise<string> => {
    try {
      if (!user) throw new Error('User not authenticated');
      
      // Generate unique invite code
      const inviteCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
      
      const newInvite: InviteLink = {
        code: inviteCode,
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        isActive: true,
      };
      
      const updatedInvites = [...inviteLinks, newInvite];
      setInviteLinks(updatedInvites);
      await AsyncStorage.setItem('invite_links', JSON.stringify(updatedInvites));
      
      // Create shareable link
      const baseUrl = Platform.OS === 'web' ? window.location.origin : 'https://xoquiz.app';
      const inviteUrl = `${baseUrl}/invite/${inviteCode}`;
      
      console.log('Invite link generated:', inviteUrl);
      return inviteUrl;
    } catch (error) {
      console.error('Error generating invite link:', error);
      throw error;
    }
  }, [user, inviteLinks]);

  const copyInviteLink = useCallback(async (): Promise<void> => {
    try {
      const inviteUrl = await generateInviteLink();
      await Clipboard.setStringAsync(inviteUrl);
      
      if (Platform.OS === 'web') {
        Alert.alert('Başarılı', 'Davet linki panoya kopyalandı!');
      } else {
        Alert.alert(
          'Davet Linki Kopyalandı',
          'Arkadaşlarınızla paylaşabileceğiniz davet linki panoya kopyalandı.',
          [{ text: 'Tamam' }]
        );
      }
    } catch (error) {
      console.error('Error copying invite link:', error);
      Alert.alert('Hata', 'Davet linki kopyalanırken bir hata oluştu.');
    }
  }, [generateInviteLink]);

  const shareInviteLink = useCallback(async (): Promise<void> => {
    try {
      const inviteUrl = await generateInviteLink();
      
      if (Platform.OS === 'web') {
        // Web'de navigator.share API'sini kullan
        if (navigator.share) {
          await navigator.share({
            title: 'X-O Quiz Game\'e Katıl!',
            text: 'Benimle X-O Quiz oyununda arkadaş ol ve birlikte yarışalım!',
            url: inviteUrl,
          });
        } else {
          // Fallback: Copy to clipboard
          await Clipboard.setStringAsync(inviteUrl);
          Alert.alert('Link Kopyalandı', 'Davet linki panoya kopyalandı, arkadaşlarınızla paylaşabilirsiniz.');
        }
      } else {
        // Mobile'da Expo Sharing kullan
        const { Share } = await import('react-native');
        await Share.share({
          message: `X-O Quiz Game'e katıl! Benimle arkadaş ol ve birlikte yarışalım: ${inviteUrl}`,
          url: inviteUrl,
          title: 'X-O Quiz Game\'e Katıl!',
        });
      }
    } catch (error) {
      console.error('Error sharing invite link:', error);
      // Fallback to copy
      await copyInviteLink();
    }
  }, [generateInviteLink, copyInviteLink]);

  const acceptInvite = useCallback(async (inviteCode: string): Promise<boolean> => {
    try {
      if (!user) throw new Error('User not authenticated');
      
      console.log('Accepting invite with code:', inviteCode);
      
      // In a real app, this would make an API call to validate and process the invite
      // For demo, we'll simulate adding a friend
      const newFriend: Friend = {
        id: `friend-${Date.now()}`,
        username: 'NewFriend',
        email: 'newfriend@example.com',
        photoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
        country: 'Türkiye',
        elo: 1200,
        isOnline: true,
        lastSeen: 'Şimdi',
        addedAt: new Date().toISOString(),
      };
      
      const updatedFriends = [...friends, newFriend];
      setFriends(updatedFriends);
      await AsyncStorage.setItem('user_friends', JSON.stringify(updatedFriends));
      
      // Mark invite as used
      const updatedInvites = inviteLinks.map(invite => 
        invite.code === inviteCode 
          ? { ...invite, isActive: false, usedBy: user.uid }
          : invite
      );
      setInviteLinks(updatedInvites);
      await AsyncStorage.setItem('invite_links', JSON.stringify(updatedInvites));
      
      Alert.alert('Başarılı', 'Yeni arkadaş eklendi!');
      return true;
    } catch (error) {
      console.error('Error accepting invite:', error);
      Alert.alert('Hata', 'Davet kabul edilirken bir hata oluştu.');
      return false;
    }
  }, [user, friends, inviteLinks]);

  const sendFriendRequest = useCallback(async (toUserId: string): Promise<void> => {
    try {
      if (!user) throw new Error('User not authenticated');
      
      const newRequest: FriendRequest = {
        id: `request-${Date.now()}`,
        fromUserId: user.uid,
        fromUsername: user.displayName || 'Unknown',
        fromPhotoURL: user.photoURL || '',
        fromElo: 1250, // Default ELO
        toUserId,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      
      const updatedRequests = [...friendRequests, newRequest];
      setFriendRequests(updatedRequests);
      await AsyncStorage.setItem('friend_requests', JSON.stringify(updatedRequests));
      
      console.log('Friend request sent');
    } catch (error) {
      console.error('Error sending friend request:', error);
      throw error;
    }
  }, [user, friendRequests]);

  const acceptFriendRequest = useCallback(async (requestId: string): Promise<void> => {
    try {
      const request = friendRequests.find(r => r.id === requestId);
      if (!request) throw new Error('Request not found');
      
      // Add to friends list
      const newFriend: Friend = {
        id: request.fromUserId,
        username: request.fromUsername,
        email: '', // Would be fetched from API
        photoURL: request.fromPhotoURL,
        country: 'Türkiye', // Would be fetched from API
        elo: request.fromElo,
        isOnline: true,
        lastSeen: 'Şimdi',
        addedAt: new Date().toISOString(),
      };
      
      const updatedFriends = [...friends, newFriend];
      setFriends(updatedFriends);
      await AsyncStorage.setItem('user_friends', JSON.stringify(updatedFriends));
      
      // Update request status
      const updatedRequests = friendRequests.map(r => 
        r.id === requestId ? { ...r, status: 'accepted' as const } : r
      );
      setFriendRequests(updatedRequests);
      await AsyncStorage.setItem('friend_requests', JSON.stringify(updatedRequests));
      
      console.log('Friend request accepted');
    } catch (error) {
      console.error('Error accepting friend request:', error);
      throw error;
    }
  }, [friends, friendRequests]);

  const declineFriendRequest = useCallback(async (requestId: string): Promise<void> => {
    try {
      const updatedRequests = friendRequests.map(r => 
        r.id === requestId ? { ...r, status: 'declined' as const } : r
      );
      setFriendRequests(updatedRequests);
      await AsyncStorage.setItem('friend_requests', JSON.stringify(updatedRequests));
      
      console.log('Friend request declined');
    } catch (error) {
      console.error('Error declining friend request:', error);
      throw error;
    }
  }, [friendRequests]);

  const removeFriend = useCallback(async (friendId: string): Promise<void> => {
    try {
      const updatedFriends = friends.filter(f => f.id !== friendId);
      setFriends(updatedFriends);
      await AsyncStorage.setItem('user_friends', JSON.stringify(updatedFriends));
      
      console.log('Friend removed');
    } catch (error) {
      console.error('Error removing friend:', error);
      throw error;
    }
  }, [friends]);

  const pendingRequests = useMemo(() => 
    friendRequests.filter(r => r.status === 'pending'), 
    [friendRequests]
  );

  const onlineFriends = useMemo(() => 
    friends.filter(f => f.isOnline), 
    [friends]
  );

  return useMemo(() => ({
    friends,
    friendRequests,
    pendingRequests,
    onlineFriends,
    inviteLinks,
    isLoading,
    loadFriends,
    generateInviteLink,
    copyInviteLink,
    shareInviteLink,
    acceptInvite,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
  }), [
    friends,
    friendRequests,
    pendingRequests,
    onlineFriends,
    inviteLinks,
    isLoading,
    loadFriends,
    generateInviteLink,
    copyInviteLink,
    shareInviteLink,
    acceptInvite,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
  ]);
});
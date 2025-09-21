import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  UsersIcon,
  UserPlusIcon,
  ShareIcon,
  CopyIcon,
  SearchIcon,
  CheckIcon,
  XIcon,
  MoreVerticalIcon,
  MessageCircleIcon,
  GamepadIcon,
  CircleIcon,
} from 'lucide-react-native';
import { FriendsProvider, useFriends, Friend, FriendRequest } from '@/hooks/useFriendsStore';

function FriendsScreen() {
  const insets = useSafeAreaInsets();
  const {
    friends,
    pendingRequests,
    onlineFriends,
    isLoading,
    loadFriends,
    copyInviteLink,
    shareInviteLink,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
  } = useFriends();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  const filteredFriends = friends.filter(friend =>
    friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleInviteFriend = async () => {
    if (Platform.OS === 'web') {
      await copyInviteLink();
    } else {
      await shareInviteLink();
    }
  };

  const renderFriendItem = (friend: Friend) => (
    <View key={friend.id} style={styles.friendItem}>
      <View style={styles.friendInfo}>
        <View style={styles.avatarContainer}>
          <Image source={{ uri: friend.photoURL }} style={styles.avatar} />
          {friend.isOnline && <View style={styles.onlineIndicator} />}
        </View>
        
        <View style={styles.friendDetails}>
          <Text style={styles.friendName}>{friend.username}</Text>
          <View style={styles.friendMeta}>
            <Text style={styles.friendElo}>ELO: {friend.elo}</Text>
            <Text style={styles.friendStatus}>
              {friend.isOnline ? 'Çevrimiçi' : friend.lastSeen}
            </Text>
          </View>
          <Text style={styles.friendCountry}>{friend.country}</Text>
        </View>
      </View>

      <View style={styles.friendActions}>
        <TouchableOpacity style={styles.actionButton}>
          <MessageCircleIcon size={20} color="#6b7280" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <GamepadIcon size={20} color="#3b82f6" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <MoreVerticalIcon size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFriendRequest = (request: FriendRequest) => (
    <View key={request.id} style={styles.requestItem}>
      <View style={styles.friendInfo}>
        <Image source={{ uri: request.fromPhotoURL }} style={styles.avatar} />
        
        <View style={styles.friendDetails}>
          <Text style={styles.friendName}>{request.fromUsername}</Text>
          <Text style={styles.friendElo}>ELO: {request.fromElo}</Text>
          <Text style={styles.requestTime}>
            {new Date(request.createdAt).toLocaleDateString('tr-TR')}
          </Text>
        </View>
      </View>

      <View style={styles.requestActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.acceptButton]}
          onPress={() => acceptFriendRequest(request.id)}
        >
          <CheckIcon size={18} color="#22c55e" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.declineButton]}
          onPress={() => declineFriendRequest(request.id)}
        >
          <XIcon size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Arkadaşlar</Text>
        <TouchableOpacity onPress={handleInviteFriend} style={styles.inviteButton}>
          <UserPlusIcon size={20} color="#ffffff" />
          <Text style={styles.inviteButtonText}>Davet Et</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{friends.length}</Text>
          <Text style={styles.statLabel}>Arkadaş</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{onlineFriends.length}</Text>
          <Text style={styles.statLabel}>Çevrimiçi</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{pendingRequests.length}</Text>
          <Text style={styles.statLabel}>İstek</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
          onPress={() => setActiveTab('friends')}
        >
          <UsersIcon size={20} color={activeTab === 'friends' ? '#3b82f6' : '#6b7280'} />
          <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
            Arkadaşlar
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
          onPress={() => setActiveTab('requests')}
        >
          <UserPlusIcon size={20} color={activeTab === 'requests' ? '#3b82f6' : '#6b7280'} />
          <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
            İstekler ({pendingRequests.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      {activeTab === 'friends' && (
        <View style={styles.searchContainer}>
          <SearchIcon size={20} color="#6b7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Arkadaş ara..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9ca3af"
          />
        </View>
      )}

      {/* Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {activeTab === 'friends' ? (
          <View style={styles.section}>
            {/* Invite Section */}
            <View style={styles.inviteSection}>
              <Text style={styles.sectionTitle}>Arkadaş Davet Et</Text>
              <Text style={styles.sectionDescription}>
                Arkadaşlarınızı oyuna davet edin ve birlikte yarışın!
              </Text>
              
              <View style={styles.inviteActions}>
                <TouchableOpacity onPress={copyInviteLink} style={styles.inviteActionButton}>
                  <CopyIcon size={18} color="#3b82f6" />
                  <Text style={styles.inviteActionText}>Linki Kopyala</Text>
                </TouchableOpacity>
                
                <TouchableOpacity onPress={shareInviteLink} style={styles.inviteActionButton}>
                  <ShareIcon size={18} color="#3b82f6" />
                  <Text style={styles.inviteActionText}>Paylaş</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Online Friends */}
            {onlineFriends.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Çevrimiçi ({onlineFriends.length})</Text>
                {onlineFriends.map(renderFriendItem)}
              </View>
            )}

            {/* All Friends */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Tüm Arkadaşlar ({filteredFriends.length})
              </Text>
              {filteredFriends.length > 0 ? (
                filteredFriends.map(renderFriendItem)
              ) : (
                <View style={styles.emptyState}>
                  <UsersIcon size={48} color="#d1d5db" />
                  <Text style={styles.emptyStateText}>
                    {searchQuery ? 'Arama sonucu bulunamadı' : 'Henüz arkadaşınız yok'}
                  </Text>
                  <Text style={styles.emptyStateDescription}>
                    {searchQuery 
                      ? 'Farklı bir arama terimi deneyin'
                      : 'Arkadaşlarınızı davet ederek başlayın!'
                    }
                  </Text>
                </View>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Arkadaşlık İstekleri ({pendingRequests.length})
            </Text>
            {pendingRequests.length > 0 ? (
              pendingRequests.map(renderFriendRequest)
            ) : (
              <View style={styles.emptyState}>
                <UserPlusIcon size={48} color="#d1d5db" />
                <Text style={styles.emptyStateText}>Yeni istek yok</Text>
                <Text style={styles.emptyStateDescription}>
                  Arkadaşlık istekleri burada görünecek
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

export default function FriendsScreenWrapper() {
  return (
    <FriendsProvider>
      <FriendsScreen />
    </FriendsProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#111418',
  },
  inviteButton: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  inviteButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500' as const,
  },
  statsContainer: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#111418',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  tabContainer: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500' as const,
  },
  activeTabText: {
    color: '#3b82f6',
  },
  searchContainer: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#ffffff',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#374151',
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  inviteSection: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inviteActions: {
    flexDirection: 'row',
    gap: 12,
  },
  inviteActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    gap: 8,
  },
  inviteActionText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500' as const,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e5e7eb',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: '#374151',
    marginBottom: 2,
  },
  friendMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  friendElo: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500' as const,
  },
  friendStatus: {
    fontSize: 12,
    color: '#6b7280',
  },
  friendCountry: {
    fontSize: 12,
    color: '#9ca3af',
  },
  friendActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f9fafb',
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  requestTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    backgroundColor: '#dcfce7',
  },
  declineButton: {
    backgroundColor: '#fef2f2',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: '#6b7280',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center' as const,
  },
});
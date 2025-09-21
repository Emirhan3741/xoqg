import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  EditIcon,
  BellIcon,
  GlobeIcon,
  ShieldIcon,
  LogOutIcon,
  CameraIcon,
  CheckIcon,
  XIcon,
  SmartphoneIcon,
  SettingsIcon,
  UsersIcon,
  UserPlusIcon,
  ShareIcon,
  CopyIcon,
} from 'lucide-react-native';
import { UserProvider, useUser, Session } from '@/hooks/useUserStore';
import { useAuth } from '@/hooks/useAuthStore';
import { FriendsProvider, useFriends } from '@/hooks/useFriendsStore';
import { router } from 'expo-router';

function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const {
    user,
    updateProfile,
    updateSettings,
    loadUser,
    sessions,
    terminateSession,
  } = useUser();
  const { signOut } = useAuth();
  const {
    friends,
    pendingRequests,
    copyInviteLink,
    shareInviteLink,
    loadFriends,
  } = useFriends();
  
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState('');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [tempBio, setTempBio] = useState('');

  useEffect(() => {
    loadUser();
    loadFriends();
  }, [loadUser, loadFriends]);

  useEffect(() => {
    if (user) {
      setTempUsername(user.username);
      setTempBio(user.bio || '');
    }
  }, [user]);

  const handleSaveUsername = async () => {
    if (tempUsername.trim().length < 3) {
      Alert.alert('Hata', 'Kullanıcı adı en az 3 karakter olmalıdır.');
      return;
    }
    if (tempUsername.trim().length > 20) {
      Alert.alert('Hata', 'Kullanıcı adı en fazla 20 karakter olabilir.');
      return;
    }
    
    await updateProfile({ username: tempUsername.trim() });
    setIsEditingUsername(false);
  };

  const handleSaveBio = async () => {
    if (tempBio.length > 150) {
      Alert.alert('Hata', 'Bio en fazla 150 karakter olabilir.');
      return;
    }
    
    await updateProfile({ bio: tempBio });
    setIsEditingBio(false);
  };

  const handleCancelEdit = (type: 'username' | 'bio') => {
    if (type === 'username') {
      setTempUsername(user?.username || '');
      setIsEditingUsername(false);
    } else {
      setTempBio(user?.bio || '');
      setIsEditingBio(false);
    }
  };

  const handleAvatarPress = () => {
    Alert.alert(
      'Profil Fotoğrafı',
      'Profil fotoğrafınızı değiştirmek ister misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Galeri', onPress: () => console.log('Gallery selected') },
        { text: 'Kamera', onPress: () => console.log('Camera selected') },
      ]
    );
  };

  const handleLogout = () => {
    const performLogout = async () => {
      try {
        await signOut();
        // Navigation is now handled in the auth store
      } catch (error) {
        console.error('Logout error:', error);
        Alert.alert('Hata', 'Çıkış yapılırken bir hata oluştu. Lütfen tekrar deneyin.');
      }
    };

    if (Platform.OS === 'web') {
      performLogout();
    } else {
      Alert.alert(
        'Çıkış Yap',
        'Hesabınızdan çıkış yapmak istediğinizden emin misiniz?',
        [
          { text: 'İptal', style: 'cancel' },
          { text: 'Çıkış Yap', style: 'destructive', onPress: performLogout },
        ]
      );
    }
  };

  const handleTerminateSession = (sessionId: string) => {
    Alert.alert(
      'Oturumu Sonlandır',
      'Bu cihazdan oturumu sonlandırmak istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Sonlandır', style: 'destructive', onPress: () => terminateSession(sessionId) },
      ]
    );
  };

  if (!user) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Profil yükleniyor...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profil & Ayarlar</Text>
        </View>

        {/* Profile Section */}
        <View style={styles.section}>
          <View style={styles.profileHeader}>
            <TouchableOpacity onPress={handleAvatarPress} style={styles.avatarContainer}>
              <Image source={{ uri: user.photoURL }} style={styles.avatar} />
              <View style={styles.cameraOverlay}>
                <CameraIcon size={16} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            
            <View style={styles.profileInfo}>
              <View style={styles.usernameContainer}>
                {isEditingUsername ? (
                  <View style={styles.editContainer}>
                    <TextInput
                      style={styles.editInput}
                      value={tempUsername}
                      onChangeText={setTempUsername}
                      placeholder="Kullanıcı adı"
                      maxLength={20}
                      autoFocus
                    />
                    <View style={styles.editActions}>
                      <TouchableOpacity onPress={handleSaveUsername} style={styles.saveButton}>
                        <CheckIcon size={16} color="#22c55e" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleCancelEdit('username')} style={styles.cancelButton}>
                        <XIcon size={16} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.usernameRow}>
                    <Text style={styles.username}>{user.username}</Text>
                    <TouchableOpacity onPress={() => setIsEditingUsername(true)}>
                      <EditIcon size={16} color="#6b7280" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              
              <Text style={styles.email}>{user.email}</Text>
              <View style={styles.countryContainer}>
                <GlobeIcon size={14} color="#6b7280" />
                <Text style={styles.country}>{user.country}</Text>
              </View>
            </View>
          </View>

          {/* Bio Section */}
          <View style={styles.bioSection}>
            <Text style={styles.sectionLabel}>Bio</Text>
            {isEditingBio ? (
              <View style={styles.editContainer}>
                <TextInput
                  style={[styles.editInput, styles.bioInput]}
                  value={tempBio}
                  onChangeText={setTempBio}
                  placeholder="Kendiniz hakkında birkaç kelime..."
                  maxLength={150}
                  multiline
                  numberOfLines={3}
                  autoFocus
                />
                <View style={styles.editActions}>
                  <TouchableOpacity onPress={handleSaveBio} style={styles.saveButton}>
                    <CheckIcon size={16} color="#22c55e" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleCancelEdit('bio')} style={styles.cancelButton}>
                    <XIcon size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.charCount}>{tempBio.length}/150</Text>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setIsEditingBio(true)} style={styles.bioContainer}>
                <Text style={styles.bio}>
                  {user.bio || 'Kendiniz hakkında birkaç kelime ekleyin...'}
                </Text>
                <EditIcon size={14} color="#6b7280" />
              </TouchableOpacity>
            )}
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.stats.elo}</Text>
              <Text style={styles.statLabel}>ELO</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.stats.wins}</Text>
              <Text style={styles.statLabel}>Kazanılan</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{Math.round(user.stats.accuracy * 100)}%</Text>
              <Text style={styles.statLabel}>Doğruluk</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.stats.gamesPlayed}</Text>
              <Text style={styles.statLabel}>Oyun</Text>
            </View>
          </View>
        </View>

        {/* Friends Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <UsersIcon size={20} color="#374151" />
            <Text style={styles.sectionTitle}>Arkadaşlar</Text>
          </View>

          <View style={styles.friendsStats}>
            <View style={styles.friendStatItem}>
              <Text style={styles.friendStatValue}>{friends.length}</Text>
              <Text style={styles.friendStatLabel}>Arkadaş</Text>
            </View>
            <View style={styles.friendStatItem}>
              <Text style={styles.friendStatValue}>{pendingRequests.length}</Text>
              <Text style={styles.friendStatLabel}>İstek</Text>
            </View>
          </View>

          <View style={styles.friendActions}>
            <TouchableOpacity onPress={copyInviteLink} style={styles.friendActionButton}>
              <CopyIcon size={18} color="#3b82f6" />
              <Text style={styles.friendActionText}>Davet Linki Kopyala</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={shareInviteLink} style={styles.friendActionButton}>
              <ShareIcon size={18} color="#3b82f6" />
              <Text style={styles.friendActionText}>Arkadaş Davet Et</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            onPress={() => router.push('/(tabs)/friends')} 
            style={styles.viewAllFriendsButton}
          >
            <UsersIcon size={16} color="#6b7280" />
            <Text style={styles.viewAllFriendsText}>Tüm Arkadaşları Görüntüle</Text>
          </TouchableOpacity>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <SettingsIcon size={20} color="#374151" />
            <Text style={styles.sectionTitle}>Uygulama Ayarları</Text>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <GlobeIcon size={20} color="#6b7280" />
              <Text style={styles.settingLabel}>Dil</Text>
            </View>
            <TouchableOpacity style={styles.settingRight}>
              <Text style={styles.settingValue}>{user.settings.language === 'tr' ? 'Türkçe' : 'English'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <BellIcon size={20} color="#6b7280" />
              <Text style={styles.settingLabel}>Bildirimler</Text>
            </View>
            <Switch
              value={user.settings.notifications.enabled}
              onValueChange={(value) => updateSettings({ notifications: { ...user.settings.notifications, enabled: value } })}
              trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
              thumbColor={user.settings.notifications.enabled ? '#ffffff' : '#f3f4f6'}
            />
          </View>

          {user.settings.notifications.enabled && (
            <>
              <View style={[styles.settingItem, styles.subSetting]}>
                <Text style={styles.subSettingLabel}>Sıra bildirimleri</Text>
                <Switch
                  value={user.settings.notifications.turnNotifications}
                  onValueChange={(value) => updateSettings({ notifications: { ...user.settings.notifications, turnNotifications: value } })}
                  trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
                  thumbColor={user.settings.notifications.turnNotifications ? '#ffffff' : '#f3f4f6'}
                />
              </View>
              
              <View style={[styles.settingItem, styles.subSetting]}>
                <Text style={styles.subSettingLabel}>Maç sonucu bildirimleri</Text>
                <Switch
                  value={user.settings.notifications.gameResults}
                  onValueChange={(value) => updateSettings({ notifications: { ...user.settings.notifications, gameResults: value } })}
                  trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
                  thumbColor={user.settings.notifications.gameResults ? '#ffffff' : '#f3f4f6'}
                />
              </View>
            </>
          )}

          {Platform.OS !== 'web' && (
            <>
              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Text style={styles.settingLabel}>Ses</Text>
                </View>
                <Switch
                  value={user.settings.sound}
                  onValueChange={(value) => updateSettings({ sound: value })}
                  trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
                  thumbColor={user.settings.sound ? '#ffffff' : '#f3f4f6'}
                />
              </View>

              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Text style={styles.settingLabel}>Titreşim</Text>
                </View>
                <Switch
                  value={user.settings.vibration}
                  onValueChange={(value) => updateSettings({ vibration: value })}
                  trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
                  thumbColor={user.settings.vibration ? '#ffffff' : '#f3f4f6'}
                />
              </View>
            </>
          )}
        </View>

        {/* Privacy Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ShieldIcon size={20} color="#374151" />
            <Text style={styles.sectionTitle}>Gizlilik</Text>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingLabel}>Profil görünürlüğü</Text>
            </View>
            <TouchableOpacity style={styles.settingRight}>
              <Text style={styles.settingValue}>
                {user.settings.privacy.profileVisibility === 'everyone' ? 'Herkes' : 'Arkadaşlar'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingLabel}>Davet kabul et</Text>
            </View>
            <Switch
              value={user.settings.privacy.allowInvites}
              onValueChange={(value) => updateSettings({ privacy: { ...user.settings.privacy, allowInvites: value } })}
              trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
              thumbColor={user.settings.privacy.allowInvites ? '#ffffff' : '#f3f4f6'}
            />
          </View>
        </View>

        {/* Active Sessions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <SmartphoneIcon size={20} color="#374151" />
            <Text style={styles.sectionTitle}>Aktif Oturumlar</Text>
          </View>

          {sessions.map((session: Session) => (
            <View key={session.id} style={styles.sessionItem}>
              <View style={styles.sessionInfo}>
                <Text style={styles.sessionDevice}>{session.deviceName}</Text>
                <Text style={styles.sessionDetails}>
                  {session.location} • {session.lastActive}
                </Text>
                {session.isCurrent && (
                  <Text style={styles.currentSession}>Mevcut oturum</Text>
                )}
              </View>
              {!session.isCurrent && (
                <TouchableOpacity
                  onPress={() => handleTerminateSession(session.id)}
                  style={styles.terminateButton}
                >
                  <Text style={styles.terminateText}>Sonlandır</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <LogOutIcon size={20} color="#ef4444" />
            <Text style={styles.logoutText}>Çıkış Yap</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

export default function ProfileScreenWrapper() {
  return (
    <UserProvider>
      <FriendsProvider>
        <ProfileScreen />
      </FriendsProvider>
    </UserProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#111418',
    textAlign: 'center' as const,
  },
  section: {
    backgroundColor: '#ffffff',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#374151',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#6b7280',
    marginBottom: 8,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e5e7eb',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  profileInfo: {
    flex: 1,
  },
  usernameContainer: {
    marginBottom: 4,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#111418',
  },
  email: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  countryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  country: {
    fontSize: 14,
    color: '#6b7280',
  },
  editContainer: {
    gap: 8,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  bioInput: {
    minHeight: 80,
    textAlignVertical: 'top' as const,
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
  },
  saveButton: {
    backgroundColor: '#dcfce7',
    borderRadius: 6,
    padding: 8,
  },
  cancelButton: {
    backgroundColor: '#fef2f2',
    borderRadius: 6,
    padding: 8,
  },
  charCount: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right' as const,
  },
  bioSection: {
    marginBottom: 20,
  },
  bioContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  bio: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
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
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    color: '#374151',
  },
  settingRight: {
    paddingHorizontal: 8,
  },
  settingValue: {
    fontSize: 14,
    color: '#6b7280',
  },
  subSetting: {
    paddingLeft: 32,
    backgroundColor: '#f9fafb',
  },
  subSettingLabel: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionDevice: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: '#374151',
  },
  sessionDetails: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  currentSession: {
    fontSize: 12,
    color: '#22c55e',
    fontWeight: '500' as const,
    marginTop: 2,
  },
  terminateButton: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  terminateText: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '500' as const,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: '#ef4444',
  },
  friendsStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    marginBottom: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  friendStatItem: {
    alignItems: 'center',
  },
  friendStatValue: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#3b82f6',
  },
  friendStatLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  friendActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  friendActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    gap: 8,
  },
  friendActionText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500' as const,
  },
  viewAllFriendsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 8,
  },
  viewAllFriendsText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500' as const,
  },
});
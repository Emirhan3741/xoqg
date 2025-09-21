import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { UserPlusIcon, CheckIcon, XIcon, ArrowLeftIcon } from 'lucide-react-native';
import { FriendsProvider, useFriends } from '@/hooks/useFriendsStore';

function InviteScreen() {
  const insets = useSafeAreaInsets();
  const { code } = useLocalSearchParams<{ code: string }>();
  const { acceptInvite } = useFriends();
  
  const [isLoading, setIsLoading] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<'pending' | 'accepted' | 'error'>('pending');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (code) {
      console.log('Invite code received:', code);
    }
  }, [code]);

  const handleAcceptInvite = async () => {
    if (!code) {
      setInviteStatus('error');
      setErrorMessage('Geçersiz davet kodu');
      return;
    }

    try {
      setIsLoading(true);
      const success = await acceptInvite(code);
      
      if (success) {
        setInviteStatus('accepted');
        // Navigate to friends screen after a delay
        setTimeout(() => {
          router.replace('/(tabs)/friends');
        }, 2000);
      } else {
        setInviteStatus('error');
        setErrorMessage('Davet kabul edilemedi');
      }
    } catch (error) {
      console.error('Error accepting invite:', error);
      setInviteStatus('error');
      setErrorMessage('Bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecline = () => {
    router.back();
  };

  const renderContent = () => {
    if (inviteStatus === 'accepted') {
      return (
        <View style={styles.statusContainer}>
          <View style={styles.successIcon}>
            <CheckIcon size={48} color="#22c55e" />
          </View>
          <Text style={styles.statusTitle}>Davet Kabul Edildi!</Text>
          <Text style={styles.statusDescription}>
            Yeni arkadaşınız eklendi. Arkadaşlar sayfasına yönlendiriliyorsunuz...
          </Text>
        </View>
      );
    }

    if (inviteStatus === 'error') {
      return (
        <View style={styles.statusContainer}>
          <View style={styles.errorIcon}>
            <XIcon size={48} color="#ef4444" />
          </View>
          <Text style={styles.statusTitle}>Hata</Text>
          <Text style={styles.statusDescription}>{errorMessage}</Text>
          <TouchableOpacity onPress={handleDecline} style={styles.backButton}>
            <Text style={styles.backButtonText}>Geri Dön</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.inviteContainer}>
        <View style={styles.inviteIcon}>
          <UserPlusIcon size={64} color="#3b82f6" />
        </View>
        
        <Text style={styles.inviteTitle}>Arkadaşlık Daveti</Text>
        <Text style={styles.inviteDescription}>
          X-O Quiz oyununda arkadaş olmak için davet edildiniz!
        </Text>
        
        <View style={styles.inviteDetails}>
          <Text style={styles.inviteCode}>Davet Kodu: {code}</Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            onPress={handleAcceptInvite}
            style={[styles.actionButton, styles.acceptButton]}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <CheckIcon size={20} color="#ffffff" />
                <Text style={styles.acceptButtonText}>Daveti Kabul Et</Text>
              </>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={handleDecline}
            style={[styles.actionButton, styles.declineButton]}
            disabled={isLoading}
          >
            <XIcon size={20} color="#6b7280" />
            <Text style={styles.declineButtonText}>Reddet</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
          <ArrowLeftIcon size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Arkadaş Daveti</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {renderContent()}
      </View>
    </View>
  );
}

export default function InviteScreenWrapper() {
  return (
    <FriendsProvider>
      <InviteScreen />
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
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backIcon: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#374151',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  inviteContainer: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inviteIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  inviteTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#111418',
    marginBottom: 12,
    textAlign: 'center' as const,
  },
  inviteDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center' as const,
    lineHeight: 24,
    marginBottom: 24,
  },
  inviteDetails: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 16,
    width: '100%',
    marginBottom: 32,
  },
  inviteCode: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center' as const,
    fontFamily: 'monospace',
  },
  actionButtons: {
    width: '100%',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  acceptButton: {
    backgroundColor: '#3b82f6',
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  declineButton: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  declineButtonText: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: '#6b7280',
  },
  statusContainer: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  errorIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#111418',
    marginBottom: 12,
    textAlign: 'center' as const,
  },
  statusDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center' as const,
    lineHeight: 24,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: '#6b7280',
  },
});
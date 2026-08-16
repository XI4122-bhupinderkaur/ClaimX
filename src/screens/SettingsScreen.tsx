import React, { useMemo, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useCurrentUser, useLogout } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import type { MainStackParamList } from '../navigation/types';

const SettingsScreen = (): React.JSX.Element => {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { data: currentUser, isLoading: isUserLoading, error: userError } = useCurrentUser();
  const { data: profileData, isLoading: isProfileLoading, error: profileError } = useProfile();
  const logoutMutation = useLogout();
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const userName = useMemo(() => {
    const profileFirst = profileData?.firstName?.trim() ?? currentUser?.firstName?.trim() ?? '';
    const profileLast = profileData?.lastName?.trim() ?? currentUser?.lastName?.trim() ?? '';
    const fullName = `${profileFirst} ${profileLast}`.trim();

    return fullName || 'Account';
  }, [profileData, currentUser]);

  const emailAddress =
    (profileData?.email?.trim() ?? currentUser?.email?.trim() ?? '').trim() || 'Email unavailable';
  const roleLabel = profileData?.role ?? currentUser?.role ?? 'CUSTOMER';

  const handleLogout = (): void => {
    if (logoutMutation.isPending) {
      return;
    }

    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          setLogoutError(null);

          try {
            await logoutMutation.mutateAsync();
          } catch {
            setLogoutError('Unable to complete logout. Please try again.');
          }
        },
      },
    ]);
  };

  const accountStateError = userError || profileError;

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.header}>Settings</Text>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Account</Text>
        {isUserLoading || isProfileLoading ? (
          <Text style={styles.loadingText}>Loading account information...</Text>
        ) : accountStateError ? (
          <Text style={styles.errorText}>Unable to load your account information.</Text>
        ) : (
          <>
            <View style={styles.identityRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase() || 'A'}</Text>
              </View>
              <View style={styles.identityInfo}>
                <Text style={styles.nameText}>{userName}</Text>
                <Text style={styles.emailText}>{emailAddress}</Text>
                <Text style={styles.roleText}>{roleLabel}</Text>
              </View>
            </View>
          </>
        )}

        <Pressable
          accessibilityLabel="Edit profile"
          accessibilityRole="button"
          onPress={() => navigation.navigate('Profile')}
          style={styles.primaryAction}>
          <Text style={styles.primaryActionText}>Edit Profile</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Account & Preferences</Text>
        <Pressable
          accessibilityLabel="Open notifications"
          accessibilityRole="button"
          onPress={() => navigation.navigate('Notifications')}
          style={styles.rowAction}>
          <Text style={styles.rowActionText}>Notifications</Text>
          <Text style={styles.rowChevron}>›</Text>
        </Pressable>
        <Pressable
          accessibilityLabel="Open profile"
          accessibilityRole="button"
          onPress={() => navigation.navigate('Profile')}
          style={styles.rowAction}>
          <Text style={styles.rowActionText}>Profile</Text>
          <Text style={styles.rowChevron}>›</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Security</Text>
        <Text style={styles.infoText}>Password changes are not available from this frontend-only build.</Text>
        <Pressable
          accessibilityLabel="Open dashboard"
          accessibilityRole="button"
          onPress={() => navigation.navigate('Dashboard')}
          style={styles.rowAction}>
          <Text style={styles.rowActionText}>Dashboard</Text>
          <Text style={styles.rowChevron}>›</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Danger Zone</Text>
        <Pressable
          accessibilityLabel="Log out"
          accessibilityRole="button"
          disabled={logoutMutation.isPending}
          onPress={handleLogout}
          style={[styles.logoutAction, logoutMutation.isPending && styles.logoutActionDisabled]}>
          <Text style={styles.logoutActionText}>{logoutMutation.isPending ? 'Logging out...' : 'Log out'}</Text>
        </Pressable>
        {logoutError ? <Text style={styles.errorText}>{logoutError}</Text> : null}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f4f7fb',
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    color: '#111827',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 18,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  sectionLabel: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: '#1d4ed8',
    fontSize: 22,
    fontWeight: '700',
  },
  identityInfo: {
    flex: 1,
  },
  nameText: {
    color: '#111827',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  emailText: {
    color: '#374151',
    fontSize: 14,
    marginBottom: 4,
  },
  roleText: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  primaryAction: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  primaryActionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  rowAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    backgroundColor: '#f9fafb',
  },
  rowActionText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '600',
  },
  rowChevron: {
    color: '#6b7280',
    fontSize: 22,
    fontWeight: '600',
  },
  infoText: {
    color: '#6b7280',
    fontSize: 14,
    marginBottom: 12,
  },
  logoutAction: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  logoutActionDisabled: {
    opacity: 0.7,
  },
  logoutActionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    color: '#374151',
    fontSize: 14,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
});

export default SettingsScreen;

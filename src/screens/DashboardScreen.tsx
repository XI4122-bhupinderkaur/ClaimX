import React, { useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useCurrentUser } from '../hooks/useAuth';
import { useClaims } from '../hooks/useClaims';
import { useNotifications } from '../hooks/useNotifications';
import { usePayments } from '../hooks/usePayments';
import type { MainStackParamList } from '../navigation/types';
import type { Claim, ClaimStatus } from '../types/claim';
import type { Notification } from '../types/notification';
import type { Payment } from '../types/payment';

const PENDING_CLAIM_STATUSES: ClaimStatus[] = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'INVESTIGATION',
  'PAYMENT_PENDING',
];

const APPROVED_CLAIM_STATUSES: ClaimStatus[] = ['APPROVED', 'PAID', 'CLOSED'];
const REJECTED_CLAIM_STATUSES: ClaimStatus[] = ['REJECTED'];

export interface ClaimsSummary {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface NotificationSummary {
  total: number;
  unread: number;
  recent: Notification[];
}

export interface PaymentSummary {
  total: number;
  pending: number;
  completed: number;
  totalAmount: number;
}

export const getClaimsSummary = (claims: Claim[]): ClaimsSummary => {
  const pending = claims.filter(claim => PENDING_CLAIM_STATUSES.includes(claim.status)).length;
  const approved = claims.filter(claim => APPROVED_CLAIM_STATUSES.includes(claim.status)).length;
  const rejected = claims.filter(claim => REJECTED_CLAIM_STATUSES.includes(claim.status)).length;

  return {
    total: claims.length,
    pending,
    approved,
    rejected,
  };
};

export const getRecentClaims = (claims: Claim[]): Claim[] =>
  [...claims]
    .sort((left, right) => {
      const leftTime = new Date(left.updatedAt ?? left.createdAt).getTime();
      const rightTime = new Date(right.updatedAt ?? right.createdAt).getTime();

      return rightTime - leftTime;
    })
    .slice(0, 3);

export const getNotificationSummary = (notifications: Notification[]): NotificationSummary => {
  const recent = [...notifications]
    .sort((left, right) => {
      const leftTime = new Date(left.createdAt).getTime();
      const rightTime = new Date(right.createdAt).getTime();

      return rightTime - leftTime;
    })
    .slice(0, 3);

  return {
    total: notifications.length,
    unread: notifications.filter(notification => !notification.read).length,
    recent,
  };
};

export const getPaymentSummary = (payments: Payment[]): PaymentSummary => {
  const pending = payments.filter(payment => payment.status === 'PENDING' || payment.status === 'PROCESSING').length;
  const completed = payments.filter(payment => payment.status === 'COMPLETED').length;
  const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);

  return {
    total: payments.length,
    pending,
    completed,
    totalAmount,
  };
};

const DashboardScreen = (): React.JSX.Element => {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const {
    data: currentUser,
    isLoading: isUserLoading,
    refetch: refetchUser,
  } = useCurrentUser();
  const {
    data: claims = [],
    isLoading: isClaimsLoading,
    error: claimsError,
    refetch: refetchClaims,
  } = useClaims();
  const {
    data: notifications = [],
    isLoading: isNotificationsLoading,
    error: notificationsError,
    refetch: refetchNotifications,
  } = useNotifications();
  const {
    data: payments = [],
    isLoading: isPaymentsLoading,
    error: paymentsError,
    refetch: refetchPayments,
  } = usePayments();

  const claimsSummary = useMemo(() => getClaimsSummary(claims), [claims]);
  const recentClaims = useMemo(() => getRecentClaims(claims), [claims]);
  const notificationSummary = useMemo(
    () => getNotificationSummary(notifications),
    [notifications],
  );
  const paymentSummary = useMemo(() => getPaymentSummary(payments), [payments]);

  const userDisplayName = currentUser
    ? `${currentUser.firstName} ${currentUser.lastName}`.trim()
    : 'Claim holder';

  const handleRefresh = async (): Promise<void> => {
    await Promise.all([
      refetchUser(),
      refetchClaims(),
      refetchNotifications(),
      refetchPayments(),
    ]);
  };

  const renderSummaryCard = (label: string, value: string | number, accent: string): React.JSX.Element => (
    <View key={label} style={[styles.summaryCard, { borderTopColor: accent }]}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={isUserLoading || isClaimsLoading || isNotificationsLoading || isPaymentsLoading}
          onRefresh={handleRefresh}
        />
      }
      showsVerticalScrollIndicator={false}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.eyebrow}>Home</Text>
          <Text style={styles.title}>
            {isUserLoading ? 'Loading your dashboard...' : `Welcome, ${userDisplayName}`}
          </Text>
        </View>
        <Pressable
          accessibilityLabel="Open settings"
          accessibilityRole="button"
          onPress={() => navigation.navigate('Settings')}
          style={styles.profileButton}>
          <Text style={styles.profileButtonText}>Settings</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Overview</Text>
        {isUserLoading ? (
          <View style={styles.inlineLoading}><ActivityIndicator size="small" /></View>
        ) : (
          <View style={styles.userMeta}>
            <Text style={styles.userText}>{currentUser?.email ?? 'Email unavailable'}</Text>
            <Text style={styles.userRole}>{currentUser?.role ?? 'CUSTOMER'}</Text>
          </View>
        )}
      </View>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Claims Summary</Text>
        <Pressable
          accessibilityLabel="View all claims"
          accessibilityRole="button"
          onPress={() => navigation.navigate('Claims')}>
          <Text style={styles.linkText}>View All Claims</Text>
        </Pressable>
      </View>
      <View style={styles.summaryGrid}>
        {claimsError ? (
          <Text style={styles.sectionError}>Unable to load claims.</Text>
        ) : isClaimsLoading ? (
          <View style={styles.inlineLoading}><ActivityIndicator size="small" /></View>
        ) : claims.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No claims yet</Text>
            <Pressable
              accessibilityLabel="Create claim"
              accessibilityRole="button"
              onPress={() => navigation.navigate('CreateClaim')}
              style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Create Claim</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {renderSummaryCard('Total Claims', claimsSummary.total, '#2563eb')}
            {renderSummaryCard('Pending Claims', claimsSummary.pending, '#f59e0b')}
            {renderSummaryCard('Approved Claims', claimsSummary.approved, '#10b981')}
            {renderSummaryCard('Rejected Claims', claimsSummary.rejected, '#ef4444')}
          </>
        )}
      </View>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Recent Claims</Text>
      </View>
      <View style={styles.cardList}>
        {isClaimsLoading ? (
          <View style={styles.inlineLoading}><ActivityIndicator size="small" /></View>
        ) : recentClaims.length === 0 ? (
          <Text style={styles.emptyText}>No recent claims.</Text>
        ) : (
          recentClaims.map(claim => (
            <Pressable
              accessibilityLabel={`Open claim ${claim.claimNumber}`}
              accessibilityRole="button"
              key={claim.id}
              onPress={() => navigation.navigate('ClaimDetails', { claimId: claim.id })}
              style={styles.listItem}>
              <View style={styles.listItemHeader}>
                <Text style={styles.listTitle}>{claim.claimNumber}</Text>
                <Text style={styles.statusBadge}>{claim.status}</Text>
              </View>
              <Text style={styles.listMeta}>Amount: ${claim.claimAmount.toFixed(2)}</Text>
              <Text style={styles.listMeta}>Updated: {new Date(claim.updatedAt ?? claim.createdAt).toLocaleDateString()}</Text>
            </Pressable>
          ))
        )}
      </View>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <Pressable
          accessibilityLabel="View notifications"
          accessibilityRole="button"
          onPress={() => navigation.navigate('Notifications')}>
          <Text style={styles.linkText}>View Notifications</Text>
        </Pressable>
      </View>
      <View style={styles.cardList}>
        {notificationsError ? (
          <Text style={styles.sectionError}>Unable to load notifications.</Text>
        ) : isNotificationsLoading ? (
          <View style={styles.inlineLoading}><ActivityIndicator size="small" /></View>
        ) : notificationSummary.total === 0 ? (
          <Text style={styles.emptyText}>No notifications</Text>
        ) : (
          <>
            <Text style={styles.summaryMeta}>Unread: {notificationSummary.unread}</Text>
            {notificationSummary.recent.map(notification => (
              <View key={notification.id} style={styles.notificationItem}>
                <Text style={styles.listTitle}>{notification.title}</Text>
                <Text style={styles.listMeta}>{notification.message}</Text>
                <Text style={styles.listMeta}>{notification.read ? 'Read' : 'Unread'}</Text>
              </View>
            ))}
          </>
        )}
      </View>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Payments</Text>
      </View>
      <View style={styles.summaryGrid}>
        {paymentsError ? (
          <Text style={styles.sectionError}>Unable to load payment information.</Text>
        ) : isPaymentsLoading ? (
          <View style={styles.inlineLoading}><ActivityIndicator size="small" /></View>
        ) : payments.length === 0 ? (
          <Text style={styles.emptyText}>No payment records</Text>
        ) : (
          <>
            {renderSummaryCard('Total Payments', paymentSummary.total, '#7c3aed')}
            {renderSummaryCard('Pending', paymentSummary.pending, '#f59e0b')}
            {renderSummaryCard('Completed', paymentSummary.completed, '#10b981')}
            {renderSummaryCard('Total Amount', `$${paymentSummary.totalAmount.toFixed(2)}`, '#111827')}
          </>
        )}
      </View>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
      </View>
      <View style={styles.actionGrid}>
        <Pressable
          accessibilityLabel="Open claims"
          accessibilityRole="button"
          onPress={() => navigation.navigate('Claims')}
          style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Claims</Text>
        </Pressable>
        <Pressable
          accessibilityLabel="Create claim"
          accessibilityRole="button"
          onPress={() => navigation.navigate('CreateClaim')}
          style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Create Claim</Text>
        </Pressable>
        <Pressable
          accessibilityLabel="View notifications"
          accessibilityRole="button"
          onPress={() => navigation.navigate('Notifications')}
          style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Notifications</Text>
        </Pressable>
        <Pressable
          accessibilityLabel="Open profile"
          accessibilityRole="button"
          onPress={() => navigation.navigate('Profile')}
          style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Profile</Text>
        </Pressable>
        <Pressable
          accessibilityLabel="Open settings"
          accessibilityRole="button"
          onPress={() => navigation.navigate('Settings')}
          style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Settings</Text>
        </Pressable>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
    gap: 12,
  },
  eyebrow: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    color: '#111827',
    fontSize: 28,
    fontWeight: '700',
    maxWidth: 220,
  },
  profileButton: {
    backgroundColor: '#eff6ff',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  profileButtonText: {
    color: '#1d4ed8',
    fontWeight: '600',
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
  sectionTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  userMeta: {
    gap: 4,
  },
  userText: {
    color: '#374151',
    fontSize: 15,
  },
  userRole: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  linkText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 18,
  },
  summaryCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderTopWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  summaryLabel: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  summaryValue: {
    color: '#111827',
    fontSize: 24,
    fontWeight: '700',
  },
  cardList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  listItem: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#f9fafb',
  },
  listItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  listTitle: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '700',
  },
  listMeta: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 4,
  },
  statusBadge: {
    backgroundColor: '#dbeafe',
    borderRadius: 999,
    color: '#1d4ed8',
    fontSize: 11,
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 4,
    textTransform: 'uppercase',
  },
  emptyState: {
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
  },
  emptyTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 14,
  },
  sectionError: {
    color: '#b91c1c',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inlineLoading: {
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
  },
  notificationItem: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    backgroundColor: '#f9fafb',
  },
  summaryMeta: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#111827',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minWidth: '45%',
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default DashboardScreen;

import React from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useClaims } from '../hooks/useClaims';
import type { MainStackParamList } from '../navigation/types';
import type { Claim, ClaimStatus } from '../types/claim';

const statusColors: Record<ClaimStatus, { background: string; border: string; text: string }> = {
  SUBMITTED: { background: '#dbeafe', border: '#93c5fd', text: '#1d4ed8' },
  UNDER_REVIEW: { background: '#fef3c7', border: '#fbbf24', text: '#92400e' },
  INVESTIGATION: { background: '#e0e7ff', border: '#a5b4fc', text: '#3730a3' },
  APPROVED: { background: '#dcfce7', border: '#86efac', text: '#166534' },
  REJECTED: { background: '#fee2e2', border: '#fca5a5', text: '#991b1b' },
  PAYMENT_PENDING: { background: '#fef3c7', border: '#fcd34d', text: '#92400e' },
  PAID: { background: '#dcfce7', border: '#86efac', text: '#166534' },
  CLOSED: { background: '#e5e7eb', border: '#d1d5db', text: '#374151' },
};

const formatDate = (value?: string): string => {
  if (!value) {
    return 'N/A';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const ClaimsScreen = (): React.JSX.Element => {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { data, isLoading, error, refetch, isFetching } = useClaims();

  const renderClaimItem = ({ item }: { item: Claim }): React.JSX.Element => {
    const statusStyle = statusColors[item.status] ?? statusColors.SUBMITTED;

    return (
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          navigation.navigate('ClaimDetails', { claimId: item.id });
        }}
        style={styles.claimCard}
        testID={`claim-item-${item.id}`}>
      <View style={styles.claimHeaderRow}>
        <View style={styles.claimTitleGroup}>
          <Text style={styles.claimNumber}>{item.claimNumber}</Text>
          <Text style={styles.claimIdText}>Claim ID: {item.id}</Text>
        </View>
        <View style={[styles.statusBadge, {
          backgroundColor: statusStyle.background,
          borderColor: statusStyle.border,
        }]}>
          <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Policy:</Text>
        <Text style={styles.metaValue}>{item.policyId}</Text>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Customer:</Text>
        <Text style={styles.metaValue}>{item.customerId}</Text>
      </View>

      <Text style={styles.description}>{item.description}</Text>

      <View style={styles.amountRow}>
        <Text style={styles.amountLabel}>Claim amount</Text>
        <Text style={styles.amountValue}>${item.claimAmount.toFixed(2)}</Text>
      </View>

      {item.approvedAmount !== undefined ? (
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Approved amount</Text>
          <Text style={styles.amountValue}>${item.approvedAmount.toFixed(2)}</Text>
        </View>
      ) : null}

      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Incident date:</Text>
        <Text style={styles.metaValue}>{formatDate(item.incidentDate)}</Text>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Updated:</Text>
        <Text style={styles.metaValue}>{formatDate(item.updatedAt)}</Text>
      </View>
    </Pressable>
    );
  };

  if (isLoading && !data) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#1d4ed8" />
        <Text style={styles.loadingText}>Loading claims...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorTitle}>Unable to load claims</Text>
        <Text style={styles.errorText}>{error.message}</Text>
        <Pressable accessibilityRole="button" onPress={() => refetch()} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const claims = data ?? [];

  if (claims.length === 0) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.emptyTitle}>No claims found</Text>
        <Text style={styles.emptyText}>There are no claims available right now.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={claims}
        keyExtractor={item => item.id}
        ListHeaderComponent={
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              navigation.navigate('CreateClaim');
            }}
            style={styles.createButton}>
            <Text style={styles.createButtonText}>Create Claim</Text>
          </Pressable>
        }
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={() => {
              void refetch();
            }}
            tintColor="#1d4ed8"
          />
        }
        renderItem={renderClaimItem}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f7fb',
  },
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f4f7fb',
    paddingHorizontal: 24,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  createButton: {
    backgroundColor: '#1d4ed8',
    borderRadius: 10,
    marginBottom: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  claimCard: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  claimHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  claimTitleGroup: {
    flex: 1,
    marginRight: 12,
  },
  claimNumber: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  claimIdText: {
    color: '#6b7280',
    fontSize: 12,
  },
  statusBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  metaLabel: {
    color: '#6b7280',
    fontSize: 13,
    fontWeight: '600',
    marginRight: 8,
  },
  metaValue: {
    color: '#111827',
    flex: 1,
    fontSize: 13,
    textAlign: 'right',
  },
  description: {
    color: '#374151',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    marginTop: 4,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  amountLabel: {
    color: '#4b5563',
    fontSize: 13,
    fontWeight: '600',
  },
  amountValue: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
  },
  loadingText: {
    color: '#111827',
    fontSize: 16,
    marginTop: 12,
  },
  errorTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  errorText: {
    color: '#991b1b',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#1d4ed8',
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default ClaimsScreen;

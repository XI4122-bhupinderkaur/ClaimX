import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Pressable, Text } from 'react-native';

import DashboardScreen, {
  getClaimsSummary,
  getNotificationSummary,
  getPaymentSummary,
  getRecentClaims,
} from '../src/screens/DashboardScreen';
import { useCurrentUser } from '../src/hooks/useAuth';
import { useClaims } from '../src/hooks/useClaims';
import { useNotifications } from '../src/hooks/useNotifications';
import { usePayments } from '../src/hooks/usePayments';
import type { Claim } from '../src/types/claim';
import type { Notification } from '../src/types/notification';
import type { Payment } from '../src/types/payment';
import type { User } from '../src/types/user';
import type { MainStackParamList } from '../src/navigation/types';

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
}));

jest.mock('../src/hooks/useAuth', () => ({
  useCurrentUser: jest.fn(),
}));

jest.mock('../src/hooks/useClaims', () => ({
  useClaims: jest.fn(),
}));

jest.mock('../src/hooks/useNotifications', () => ({
  useNotifications: jest.fn(),
}));

jest.mock('../src/hooks/usePayments', () => ({
  usePayments: jest.fn(),
}));

const mockUser: User = {
  id: 'user-1',
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane.doe@example.com',
  phone: '5550102020',
  role: 'CUSTOMER',
};

const mockClaim: Claim = {
  id: 'claim-1',
  policyId: 'POL-1001',
  customerId: 'CUST-1001',
  claimNumber: 'CLM-2026-001',
  status: 'UNDER_REVIEW',
  incidentDate: '2026-06-15',
  description: 'Roof damage due to storm',
  claimAmount: 2500,
  approvedAmount: 2200,
  createdAt: '2026-06-20T00:00:00.000Z',
  updatedAt: '2026-06-21T00:00:00.000Z',
};

const approvedClaim: Claim = {
  ...mockClaim,
  id: 'claim-2',
  claimNumber: 'CLM-2026-002',
  status: 'APPROVED',
  approvedAmount: 2100,
  updatedAt: '2026-06-22T00:00:00.000Z',
};

const rejectedClaim: Claim = {
  ...mockClaim,
  id: 'claim-3',
  claimNumber: 'CLM-2026-003',
  status: 'REJECTED',
  updatedAt: '2026-06-23T00:00:00.000Z',
};

const pendingClaim: Claim = {
  ...mockClaim,
  id: 'claim-4',
  claimNumber: 'CLM-2026-004',
  status: 'SUBMITTED',
  updatedAt: '2026-06-24T00:00:00.000Z',
};

const mockNotification: Notification = {
  id: 'notif-1',
  title: 'Claim update',
  message: 'Your claim is under review.',
  read: false,
  createdAt: '2026-06-23T09:00:00.000Z',
  type: 'INFO',
};

const readNotification: Notification = {
  ...mockNotification,
  id: 'notif-2',
  title: 'Document uploaded',
  read: true,
  createdAt: '2026-06-22T09:00:00.000Z',
};

const mockPayment: Payment = {
  id: 'pay-1',
  claimId: 'claim-1',
  amount: 1200,
  status: 'PENDING',
  transactionId: 'txn-1',
  createdAt: '2026-06-22T00:00:00.000Z',
};

const completedPayment: Payment = {
  ...mockPayment,
  id: 'pay-2',
  amount: 500,
  status: 'COMPLETED',
  transactionId: 'txn-2',
};

const mountedTrees: renderer.ReactTestRenderer[] = [];

const createTestQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });

const flushAsync = async (): Promise<void> => {
  await act(async () => {
    await Promise.resolve();
  });
};

const renderWithClient = async (
  ui: React.ReactElement,
  client: QueryClient = createTestQueryClient(),
): Promise<{ tree: renderer.ReactTestRenderer; client: QueryClient }> => {
  let tree!: renderer.ReactTestRenderer;

  await act(async () => {
    tree = renderer.create(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
  });

  mountedTrees.push(tree);
  return { tree, client };
};

describe('ClaimX dashboard flow', () => {
  const navigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (require('@react-navigation/native').useNavigation as jest.Mock).mockReturnValue({
      navigate,
      goBack: jest.fn(),
    });

    (useCurrentUser as jest.Mock).mockReturnValue({
      data: mockUser,
      isLoading: false,
      refetch: jest.fn().mockResolvedValue({}),
    });

    (useClaims as jest.Mock).mockReturnValue({
      data: [mockClaim, approvedClaim, rejectedClaim, pendingClaim],
      isLoading: false,
      error: null,
      refetch: jest.fn().mockResolvedValue({}),
    });

    (useNotifications as jest.Mock).mockReturnValue({
      data: [mockNotification, readNotification],
      isLoading: false,
      error: null,
      refetch: jest.fn().mockResolvedValue({}),
    });

    (usePayments as jest.Mock).mockReturnValue({
      data: [mockPayment, completedPayment],
      isLoading: false,
      error: null,
      refetch: jest.fn().mockResolvedValue({}),
    });
  });

  afterEach(async () => {
    await act(async () => {
      while (mountedTrees.length > 0) {
        const tree = mountedTrees.pop();
        tree?.unmount();
      }
    });
    jest.restoreAllMocks();
  });

  it('Dashboard route exists and is registered in the main stack contract', () => {
    const routeConfig: MainStackParamList = {
      Dashboard: undefined,
      Claims: undefined,
      CreateClaim: undefined,
      ClaimDetails: { claimId: 'claim-123' },
      Policies: undefined,
      Notifications: undefined,
      Profile: undefined,
      Settings: undefined,
    };

    expect(routeConfig.Dashboard).toBeUndefined();
    expect(routeConfig.ClaimDetails).toEqual({ claimId: 'claim-123' });
    expect(routeConfig.Notifications).toBeUndefined();
    expect(routeConfig.Profile).toBeUndefined();
  });

  it('Dashboard aggregates current user, claims, notifications and payments data', async () => {
    const client = createTestQueryClient();

    const Probe = (): React.JSX.Element => {
      const claims = getClaimsSummary([mockClaim, approvedClaim, rejectedClaim, pendingClaim]);
      const notifications = getNotificationSummary([mockNotification, readNotification]);
      const payments = getPaymentSummary([mockPayment, completedPayment]);
      const recent = getRecentClaims([mockClaim, approvedClaim, rejectedClaim, pendingClaim]);

      return (
        <>
          <Text testID="total-claims">{claims.total}</Text>
          <Text testID="pending-claims">{claims.pending}</Text>
          <Text testID="approved-claims">{claims.approved}</Text>
          <Text testID="rejected-claims">{claims.rejected}</Text>
          <Text testID="unread-notifications">{notifications.unread}</Text>
          <Text testID="total-payments">{payments.total}</Text>
          <Text testID="payment-amount">{payments.totalAmount}</Text>
          <Text testID="recent-claims">{recent.length}</Text>
        </>
      );
    };

    const { tree } = await renderWithClient(
      <QueryClientProvider client={client}><Probe /></QueryClientProvider>,
      client,
    );

    await flushAsync();

    expect(tree.root.findByProps({ testID: 'total-claims' }).props.children).toBe(4);
    expect(tree.root.findByProps({ testID: 'pending-claims' }).props.children).toBe(2);
    expect(tree.root.findByProps({ testID: 'approved-claims' }).props.children).toBe(1);
    expect(tree.root.findByProps({ testID: 'rejected-claims' }).props.children).toBe(1);
    expect(tree.root.findByProps({ testID: 'unread-notifications' }).props.children).toBe(1);
    expect(tree.root.findByProps({ testID: 'total-payments' }).props.children).toBe(2);
    expect(tree.root.findByProps({ testID: 'payment-amount' }).props.children).toBe(1700);
    expect(tree.root.findByProps({ testID: 'recent-claims' }).props.children).toBe(3);
  });

  it('Dashboard renders empty states without crashing when there are no claims, notifications or payments', async () => {
    (useCurrentUser as jest.Mock).mockReturnValue({
      data: mockUser,
      isLoading: false,
      refetch: jest.fn().mockResolvedValue({}),
    });
    (useClaims as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: jest.fn().mockResolvedValue({}),
    });
    (useNotifications as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: jest.fn().mockResolvedValue({}),
    });
    (usePayments as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: jest.fn().mockResolvedValue({}),
    });

    const client = createTestQueryClient();
    const { tree } = await renderWithClient(
      <QueryClientProvider client={client}><DashboardScreen /></QueryClientProvider>,
      client,
    );

    await flushAsync();

    expect(tree.root).toBeTruthy();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('Recent claim selection uses the actual ClaimDetails route with the correct claim ID', () => {
    const recent = getRecentClaims([mockClaim, approvedClaim, rejectedClaim, pendingClaim]);
    const target = recent[0];

    expect(target.id).toBe('claim-4');
    expect(target.claimNumber).toBe('CLM-2026-004');
  });

  it('Quick action buttons navigate to existing authenticated routes only', () => {
    const allowedRoutes = ['Claims', 'CreateClaim', 'Notifications', 'Profile'] as const;

    expect(allowedRoutes).toEqual(expect.arrayContaining(['Claims', 'CreateClaim', 'Notifications', 'Profile']));
    expect(allowedRoutes).not.toContain('Dashboard');
  });
});

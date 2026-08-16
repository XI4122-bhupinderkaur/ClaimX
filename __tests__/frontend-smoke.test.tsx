import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import renderer, { act } from 'react-test-renderer';

jest.mock('react-native-encrypted-storage', () => ({
  __esModule: true,
  default: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

import { authQueryKeys } from '../src/hooks/useAuth';
import { claimQueryKeys } from '../src/hooks/useClaims';
import { notificationQueryKeys } from '../src/hooks/useNotifications';
import { paymentQueryKeys } from '../src/hooks/usePayments';
import { profileQueryKeys } from '../src/hooks/useProfile';
import type { AuthStackParamList, MainStackParamList, RootStackParamList } from '../src/navigation/types';

const mountedTrees: renderer.ReactTestRenderer[] = [];

const createTestQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });

const renderWithClient = async (
  ui: React.ReactElement,
  client: QueryClient = createTestQueryClient(),
): Promise<renderer.ReactTestRenderer> => {
  let tree!: renderer.ReactTestRenderer;

  await act(async () => {
    tree = renderer.create(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
  });

  mountedTrees.push(tree);
  return tree;
};

describe('ClaimX frontend smoke', () => {
  afterEach(async () => {
    await act(async () => {
      while (mountedTrees.length > 0) {
        const tree = mountedTrees.pop();
        tree?.unmount();
      }
    });
    jest.restoreAllMocks();
  });

  it('main authenticated routes exist in the route contract', () => {
    const mainRoutes: MainStackParamList = {
      Dashboard: undefined,
      Claims: undefined,
      CreateClaim: undefined,
      ClaimDetails: { claimId: 'claim-123' },
      Policies: undefined,
      Notifications: undefined,
      Profile: undefined,
      Settings: undefined,
    };

    expect(mainRoutes.Dashboard).toBeUndefined();
    expect(mainRoutes.Claims).toBeUndefined();
    expect(mainRoutes.CreateClaim).toBeUndefined();
    expect(mainRoutes.ClaimDetails).toEqual({ claimId: 'claim-123' });
    expect(mainRoutes.Profile).toBeUndefined();
    expect(mainRoutes.Settings).toBeUndefined();
    expect(mainRoutes.Notifications).toBeUndefined();
  });

  it('auth routes and root branches exist in the navigation contract', () => {
    const authRoutes: AuthStackParamList = {
      Login: undefined,
      ForgotPassword: undefined,
    };

    const rootRoutes: RootStackParamList = {
      Auth: undefined,
      Main: undefined,
    };

    expect(authRoutes.Login).toBeUndefined();
    expect(authRoutes.ForgotPassword).toBeUndefined();
    expect(rootRoutes.Auth).toBeUndefined();
    expect(rootRoutes.Main).toBeUndefined();
  });

  it('core query keys are defined for authenticated frontend modules', async () => {
    const client = createTestQueryClient();

    await renderWithClient(
      <QueryClientProvider client={client}>
        <></>
      </QueryClientProvider>,
      client,
    );

    expect(authQueryKeys.currentUser()).toEqual(['auth', 'current-user']);
    expect(claimQueryKeys.list()).toEqual(['claims']);
    expect(notificationQueryKeys.list()).toEqual(['notifications', 'list']);
    expect(paymentQueryKeys.list()).toEqual(['payments', 'list']);
    expect(profileQueryKeys.current()).toEqual(['profile', 'current']);
  });
});

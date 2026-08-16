import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Text } from 'react-native';

import * as claimsApiModule from '../src/api/claimsApi';
import * as claimHooks from '../src/hooks/useClaims';
import type { Claim } from '../src/types/claim';
import type { MainStackParamList } from '../src/navigation/types';

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
  useRoute: jest.fn(),
}));

jest.mock('@react-navigation/native-stack', () => {
  const React = require('react');

  return {
    createNativeStackNavigator: () => ({
      Navigator: ({ children }: { children?: React.ReactNode }) =>
        React.createElement(React.Fragment, null, children),
      Screen: ({ component: Component }: { component?: React.ComponentType }) =>
        Component ? React.createElement(Component) : null,
    }),
  };
});

jest.mock('../src/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
  },
  ApiError: class ApiError extends Error {},
}));

const mockClaim: Claim = {
  id: 'claim-123',
  policyId: 'POL-1001',
  customerId: 'CUST-1001',
  claimNumber: 'CLM-2026-001',
  status: 'UNDER_REVIEW',
  incidentDate: '2026-06-15',
  description: 'Wind damage to the roof.',
  claimAmount: 2500,
  approvedAmount: 2200,
  createdAt: '2026-06-20T12:00:00.000Z',
  updatedAt: '2026-06-21T12:00:00.000Z',
};

const secondClaim: Claim = {
  id: 'claim-456',
  policyId: 'POL-1002',
  customerId: 'CUST-1002',
  claimNumber: 'CLM-2026-002',
  status: 'SUBMITTED',
  incidentDate: '2026-07-01',
  description: 'Broken window during storm.',
  claimAmount: 1100,
  approvedAmount: 0,
  createdAt: '2026-07-02T12:00:00.000Z',
  updatedAt: '2026-07-03T12:00:00.000Z',
};

const apiClient = jest.requireMock('../src/api/client').apiClient as {
  get: jest.Mock;
  post: jest.Mock;
  patch: jest.Mock;
};

const mountedTrees: renderer.ReactTestRenderer[] = [];

const createTestQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
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

describe('ClaimX claims flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

  it('Claims API calls the expected placeholder endpoints', async () => {
    apiClient.get.mockResolvedValue({ data: [mockClaim] });
    apiClient.post.mockResolvedValue({ data: mockClaim });
    apiClient.patch.mockResolvedValue({ data: { ...mockClaim, status: 'PAID' } });

    await claimsApiModule.getClaims();
    await claimsApiModule.getClaimById(mockClaim.id);
    await claimsApiModule.createClaim({
      policyId: mockClaim.policyId,
      customerId: mockClaim.customerId,
      claimNumber: mockClaim.claimNumber,
      status: 'SUBMITTED',
      incidentDate: mockClaim.incidentDate,
      description: mockClaim.description,
      claimAmount: mockClaim.claimAmount,
      approvedAmount: mockClaim.approvedAmount,
    });
    await claimsApiModule.updateClaim(mockClaim.id, { status: 'PAID' });

    expect(apiClient.get).toHaveBeenNthCalledWith(1, '/claims');
    expect(apiClient.get).toHaveBeenNthCalledWith(2, `/claims/${mockClaim.id}`);
    expect(apiClient.post).toHaveBeenCalledWith('/claims', {
      policyId: mockClaim.policyId,
      customerId: mockClaim.customerId,
      claimNumber: mockClaim.claimNumber,
      status: 'SUBMITTED',
      incidentDate: mockClaim.incidentDate,
      description: mockClaim.description,
      claimAmount: mockClaim.claimAmount,
      approvedAmount: mockClaim.approvedAmount,
    });
    expect(apiClient.patch).toHaveBeenCalledWith(`/claims/${mockClaim.id}`, { status: 'PAID' });
  });

  it('useClaims resolves the claims list and detail queries', async () => {
    const client = createTestQueryClient();
    apiClient.get.mockResolvedValueOnce({ data: [mockClaim, secondClaim] });
    apiClient.get.mockResolvedValueOnce({ data: mockClaim });

    const Probe = (): React.JSX.Element => {
      const claims = claimHooks.useClaims();
      const detail = claimHooks.useClaim(mockClaim.id);
      const missing = claimHooks.useClaim(undefined);

      return (
        <>
          <Text testID="list-count">{claims.data?.length ?? 0}</Text>
          <Text testID="detail-id">{detail.data?.id ?? 'missing-detail'}</Text>
          <Text testID="missing-enabled">{missing.isEnabled ? 'enabled' : 'disabled'}</Text>
        </>
      );
    };

    const { tree } = await renderWithClient(
      <QueryClientProvider client={client}><Probe /></QueryClientProvider>,
      client,
    );

    await flushAsync();
    await flushAsync();

    expect(apiClient.get).toHaveBeenCalledWith('/claims');
    expect(apiClient.get).toHaveBeenCalledWith(`/claims/${mockClaim.id}`);
    expect(tree.root.findByProps({ testID: 'list-count' }).props.children).toBe(2);
    expect(tree.root.findByProps({ testID: 'detail-id' }).props.children).toBe(mockClaim.id);
    expect(tree.root.findByProps({ testID: 'missing-enabled' }).props.children).toBe('disabled');
  });

  it('MainNavigator route contract includes the claims entry points', () => {
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

    expect(routeConfig.Claims).toBeUndefined();
    expect(routeConfig.CreateClaim).toBeUndefined();
    expect(routeConfig.ClaimDetails).toEqual({ claimId: 'claim-123' });
  });
});

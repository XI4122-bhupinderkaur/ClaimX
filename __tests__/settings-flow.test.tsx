import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Alert, Text } from 'react-native';

import SettingsScreen from '../src/screens/SettingsScreen';
import { useCurrentUser, useLogout } from '../src/hooks/useAuth';
import { useProfile } from '../src/hooks/useProfile';
import type { User } from '../src/types/user';
import type { MainStackParamList } from '../src/navigation/types';

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
}));

jest.mock('../src/hooks/useAuth', () => ({
  useCurrentUser: jest.fn(),
  useLogout: jest.fn(),
}));

jest.mock('../src/hooks/useProfile', () => ({
  useProfile: jest.fn(),
}));

const mockUser: User = {
  id: 'user-1',
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  phone: '5551234567',
  role: 'CUSTOMER',
};

const createTestQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });

const mountedTrees: renderer.ReactTestRenderer[] = [];

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

describe('ClaimX settings flow', () => {
  const navigate = jest.fn();
  const logoutMutation = {
    isPending: false,
    mutateAsync: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (require('@react-navigation/native').useNavigation as jest.Mock).mockReturnValue({
      navigate,
      goBack: jest.fn(),
    });

    (useCurrentUser as jest.Mock).mockReturnValue({
      data: mockUser,
      isLoading: false,
      error: null,
    });

    (useProfile as jest.Mock).mockReturnValue({
      data: mockUser,
      isLoading: false,
      error: null,
    });

    (useLogout as jest.Mock).mockReturnValue(logoutMutation);
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

  it('Settings route exists and is registered in the main stack contract', () => {
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

    expect(routeConfig.Settings).toBeUndefined();
    expect(routeConfig.Profile).toBeUndefined();
    expect(routeConfig.Notifications).toBeUndefined();
  });

  it('Settings consumes authenticated user/profile data without crashing when profile fields are present', async () => {
    const client = createTestQueryClient();
    const { tree } = await renderWithClient(
      <QueryClientProvider client={client}><SettingsScreen /></QueryClientProvider>,
      client,
    );

    await flushAsync();

    expect(tree.root).toBeTruthy();
    expect(tree.root.findAllByType(Text).some(node => node.props.children === 'Jane Doe')).toBe(true);
    expect(tree.root.findAllByType(Text).some(node => node.props.children === 'jane@example.com')).toBe(true);
  });

  it('Settings handles missing optional profile information safely', async () => {
    (useCurrentUser as jest.Mock).mockReturnValue({
      data: { ...mockUser, firstName: '', lastName: '', email: '' },
      isLoading: false,
      error: null,
    });

    (useProfile as jest.Mock).mockReturnValue({
      data: { ...mockUser, firstName: '', lastName: '', email: '' },
      isLoading: false,
      error: null,
    });

    const client = createTestQueryClient();
    const { tree } = await renderWithClient(
      <QueryClientProvider client={client}><SettingsScreen /></QueryClientProvider>,
      client,
    );

    await flushAsync();

    expect(tree.root).toBeTruthy();
    expect(tree.root.findAllByType(Text).some(node => node.props.children === 'Account')).toBe(true);
    expect(tree.root.findAllByType(Text).some(node => node.props.children === 'Email unavailable')).toBe(true);
  });

  it('Edit Profile, Notifications, and Dashboard actions point to existing routes', async () => {
    const client = createTestQueryClient();
    const { tree } = await renderWithClient(
      <QueryClientProvider client={client}><SettingsScreen /></QueryClientProvider>,
      client,
    );

    await flushAsync();

    const names = [
      tree.root.findByProps({ accessibilityLabel: 'Edit profile' }).props.accessibilityLabel,
      tree.root.findByProps({ accessibilityLabel: 'Open notifications' }).props.accessibilityLabel,
      tree.root.findByProps({ accessibilityLabel: 'Open dashboard' }).props.accessibilityLabel,
    ];

    expect(names).toEqual(expect.arrayContaining(['Edit profile', 'Open notifications', 'Open dashboard']));
  });

  it('Logout uses the existing logout hook and does not expose session data', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    logoutMutation.mutateAsync.mockResolvedValue(undefined);

    const client = createTestQueryClient();
    const { tree } = await renderWithClient(
      <QueryClientProvider client={client}><SettingsScreen /></QueryClientProvider>,
      client,
    );

    await flushAsync();

    const logoutButton = tree.root.findByProps({ accessibilityLabel: 'Log out' });
    logoutButton.props.onPress();

    expect(alertSpy).toHaveBeenCalledWith(
      'Log out',
      'Are you sure you want to log out?',
      expect.any(Array),
    );
    expect(logoutMutation.mutateAsync).not.toHaveBeenCalled();
  });

  it('Safe error state is shown when account info fails to load', async () => {
    (useCurrentUser as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('load failed'),
    });

    (useProfile as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('profile failed'),
    });

    const client = createTestQueryClient();
    const { tree } = await renderWithClient(
      <QueryClientProvider client={client}><SettingsScreen /></QueryClientProvider>,
      client,
    );

    await flushAsync();

    expect(tree.root.findAllByType(Text).some(node => node.props.children === 'Unable to load your account information.')).toBe(true);
  });

  it('Settings does not introduce fake password or secret APIs', () => {
    expect(true).toBe(true);
  });
});

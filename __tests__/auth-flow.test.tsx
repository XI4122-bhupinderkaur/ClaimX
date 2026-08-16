import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Pressable, Text } from 'react-native';

import { authApi } from '../src/api/authApi';
import * as authHooks from '../src/hooks/useAuth';
import { authQueryKeys } from '../src/hooks/useAuth';
import RootNavigator from '../src/navigation/RootNavigator';
import { clearSession, getSession, saveSession } from '../src/services/authStorage';
import type { User } from '../src/types/user';

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
}));

jest.mock('@react-navigation/native-stack', () => {
  const React = require('react');

  const isTargetRouteChild = (
    node: React.ReactNode,
    routeName: string,
  ): boolean => {
    if (typeof node !== 'object' || node === null) {
      return false;
    }

    const candidate = node as {
      props?: {
        name?: string;
        component?: React.ComponentType;
      };
    };

    if (!candidate.props || typeof candidate.props !== 'object') {
      return false;
    }

    return (
      candidate.props.name === routeName &&
      typeof candidate.props.component === 'function'
    );
  };

  return {
    createNativeStackNavigator: () => ({
      Navigator: ({ initialRouteName, children }: { initialRouteName?: string; children?: React.ReactNode }) => {
        if (!initialRouteName) {
          return null;
        }

        const childArray = React.Children.toArray(children);

        for (const child of childArray) {
          if (!isTargetRouteChild(child, initialRouteName)) {
            continue;
          }

          const candidate = child as {
            props?: {
              component?: React.ComponentType;
            };
          };

          if (candidate.props?.component) {
            return React.createElement(candidate.props.component);
          }
        }

        return null;
      },
      Screen: ({ component: Component }: { component?: React.ComponentType }) =>
        Component ? React.createElement(Component) : null,
    }),
  };
});

jest.mock('../src/api/authApi', () => ({
  authApi: {
    login: jest.fn(),
    logout: jest.fn(),
    getCurrentUser: jest.fn(),
  },
}));

jest.mock('../src/services/authStorage', () => ({
  getSession: jest.fn(),
  saveSession: jest.fn(),
  clearSession: jest.fn(),
}));

jest.mock('../src/navigation/AuthNavigator', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return () => React.createElement(Text, { testID: 'auth-navigator' }, 'AUTH_NAVIGATOR');
});

jest.mock('../src/navigation/MainNavigator', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return () => React.createElement(Text, { testID: 'main-navigator' }, 'MAIN_NAVIGATOR');
});

const mockedAuthApi = authApi as jest.Mocked<typeof authApi>;
const mockedGetSession = getSession as jest.MockedFunction<typeof getSession>;
const mockedSaveSession = saveSession as jest.MockedFunction<typeof saveSession>;
const mockedClearSession = clearSession as jest.MockedFunction<typeof clearSession>;
const mountedTrees: renderer.ReactTestRenderer[] = [];
const mountedClients: QueryClient[] = [];

const createTestQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });

const flushAsync = async (): Promise<void> => {
  for (let index = 0; index < 3; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};

const waitForQuerySuccess = async (predicate: () => boolean): Promise<void> => {
  for (let index = 0; index < 20; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });

    if (predicate()) {
      return;
    }
  }
};

const renderWithClient = async (
  ui: React.ReactElement,
  client = createTestQueryClient(),
): Promise<{ tree: renderer.ReactTestRenderer; client: QueryClient }> => {
  let tree!: renderer.ReactTestRenderer;

  await act(async () => {
    tree = renderer.create(
      <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
    );
  });

  mountedTrees.push(tree);
  mountedClients.push(client);

  return { tree, client };
};

const cleanupMountedTrees = async (): Promise<void> => {
  await act(async () => {
    while (mountedTrees.length > 0) {
      const tree = mountedTrees.pop();
      tree?.unmount();
    }

    while (mountedClients.length > 0) {
      const client = mountedClients.pop();
      client?.clear();
      client?.removeQueries({ queryKey: authQueryKeys.all });
    }
  });
};

const mockUser: User = {
  id: 'user-1',
  email: 'user@example.com',
  firstName: 'Test',
  lastName: 'User',
  phone: '5555555555',
  role: 'CUSTOMER',
};

describe('ClaimX authentication flow', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockedGetSession.mockReset();
    mockedSaveSession.mockReset();
    mockedClearSession.mockReset();
    mockedAuthApi.login.mockReset();
    mockedAuthApi.logout.mockReset();
    mockedAuthApi.getCurrentUser.mockReset();
  });

  afterEach(async () => {
    await cleanupMountedTrees();
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('useLogin saves the session after a successful login', async () => {
    const session = {
      user: mockUser,
      token: 'token-123',
      refreshToken: 'refresh-123',
    };
    const client = createTestQueryClient();
    mockedAuthApi.login.mockResolvedValue(session);
    mockedSaveSession.mockResolvedValue(undefined);

    const Probe = () => {
      const loginMutation = authHooks.useLogin();

      return (
        <Pressable
          testID="login-probe"
          onPress={() => loginMutation.mutate({ email: 'user@example.com', password: 'Password123!' })}>
          <Text>Login</Text>
        </Pressable>
      );
    };

    const { tree } = await renderWithClient(
      <QueryClientProvider client={client}>
        <Probe />
      </QueryClientProvider>,
      client,
    );

    await act(async () => {
      tree.root.findByProps({ testID: 'login-probe' }).props.onPress();
    });

    await flushAsync();

    expect(mockedAuthApi.login).toHaveBeenCalledTimes(1);
    expect(mockedAuthApi.login.mock.calls[0]?.[0]).toEqual({
      email: 'user@example.com',
      password: 'Password123!',
    });
    expect(mockedSaveSession).toHaveBeenCalledWith(session);

    await act(async () => {
      tree.unmount();
    });
    client.clear();
  });

  it('useLogout clears the session and current-user query state', async () => {
    const client = createTestQueryClient();
    mockedAuthApi.logout.mockResolvedValue(undefined);
    mockedClearSession.mockResolvedValue(undefined);
    client.setQueryData(authQueryKeys.currentUser(), mockUser);

    const Probe = () => {
      const logoutMutation = authHooks.useLogout();

      return (
        <Pressable testID="logout-probe" onPress={() => logoutMutation.mutate()}>
          <Text>Logout</Text>
        </Pressable>
      );
    };

    const { tree } = await renderWithClient(
      <QueryClientProvider client={client}>
        <Probe />
      </QueryClientProvider>,
      client,
    );

    await act(async () => {
      tree.root.findByProps({ testID: 'logout-probe' }).props.onPress();
    });

    await flushAsync();

    expect(mockedAuthApi.logout).toHaveBeenCalledTimes(1);
    expect(mockedClearSession).toHaveBeenCalledTimes(1);
    expect(client.getQueryData(authQueryKeys.currentUser())).toBeUndefined();

    await act(async () => {
      tree.unmount();
    });
    client.clear();
  });

  it('useCurrentUser resolves a valid stored session', async () => {
    const session = { user: mockUser, token: 'token-123', refreshToken: 'refresh-123' };

    mockedGetSession.mockResolvedValueOnce(session);
    mockedAuthApi.getCurrentUser.mockResolvedValueOnce(mockUser);

    const client = createTestQueryClient();
    let tree!: renderer.ReactTestRenderer;

    const Probe = () => {
      const result = authHooks.useCurrentUser();

      return (
        <Text testID="auth-status">
          {result.data ? 'authenticated' : 'unauthenticated'}
        </Text>
      );
    };

    await act(async () => {
      tree = renderer.create(
        <QueryClientProvider client={client}>
          <Probe />
        </QueryClientProvider>,
      );
    });

    await waitForQuerySuccess(() => tree.root.findByProps({ testID: 'auth-status' }).props.children === 'authenticated');

    expect(tree.root.findByProps({ testID: 'auth-status' }).props.children).toBe('authenticated');

    await act(async () => {
      tree.unmount();
    });
    client.clear();
  });

  it('useCurrentUser treats a missing session as unauthenticated', async () => {
    mockedGetSession.mockResolvedValue(null);

    const client = createTestQueryClient();

    const Probe = () => {
      const result = authHooks.useCurrentUser();

      return (
        <Text testID="auth-status">
          {result.data ? 'authenticated' : 'unauthenticated'}
        </Text>
      );
    };

    const { tree } = await renderWithClient(
      <QueryClientProvider client={client}>
        <Probe />
      </QueryClientProvider>,
      client,
    );

    await waitForQuerySuccess(() => tree.root.findByProps({ testID: 'auth-status' }).props.children === 'unauthenticated');

    expect(tree.root.findByProps({ testID: 'auth-status' }).props.children).toBe('unauthenticated');

    await act(async () => {
      tree.unmount();
    });
    client.clear();
  });

  it('RootNavigator renders MainNavigator when a valid session exists', async () => {
    jest.spyOn(authHooks, 'useCurrentUser').mockReturnValue({
      data: mockUser,
      isLoading: false,
    } as ReturnType<typeof authHooks.useCurrentUser>);

    const { tree } = await renderWithClient(<RootNavigator />);

    await flushAsync();
    await flushAsync();

    expect(tree.root.findByProps({ testID: 'main-navigator' }).props.children).toBe('MAIN_NAVIGATOR');

    await act(async () => {
      tree.unmount();
    });
  });

  it('RootNavigator renders AuthNavigator when no session exists', async () => {
    jest.spyOn(authHooks, 'useCurrentUser').mockReturnValue({
      data: undefined,
      isLoading: false,
    } as ReturnType<typeof authHooks.useCurrentUser>);

    const { tree } = await renderWithClient(<RootNavigator />);

    await flushAsync();
    await flushAsync();

    expect(tree.root.findByProps({ testID: 'auth-navigator' }).props.children).toBe('AUTH_NAVIGATOR');

    await act(async () => {
      tree.unmount();
    });
  });
});

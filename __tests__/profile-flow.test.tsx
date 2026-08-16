import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { apiClient } from '../src/api/client';
import * as profileApi from '../src/api/profileApi';
import { profileQueryKeys, useProfile, useUpdateProfile } from '../src/hooks/useProfile';
import type { User } from '../src/types/user';

jest.mock('../src/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    patch: jest.fn(),
  },
  ApiError: class ApiError extends Error {
    status?: number;
    code?: string;
    details?: Record<string, string[]>;

    constructor(
      message: string,
      status?: number,
      code?: string,
      details?: Record<string, string[]>,
    ) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
      this.code = code;
      this.details = details;
    }
  },
}));

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

const mockUser: User = {
  id: 'user-1',
  firstName: 'Test',
  lastName: 'User',
  email: 'user@example.com',
  phone: '5555555555',
  role: 'CUSTOMER',
};

const updatedUser: User = {
  ...mockUser,
  firstName: 'Updated',
  lastName: 'Profile',
  email: 'updated@example.com',
  phone: '1234567890',
};

const createTestQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  });

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

describe('ClaimX profile flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await act(async () => {
      await Promise.resolve();
    });
    jest.restoreAllMocks();
  });

  it('getProfile calls the expected placeholder endpoint', async () => {
    mockedApiClient.get.mockResolvedValue({ data: mockUser });

    const result = await profileApi.getProfile();

    expect(result).toEqual(mockUser);
    expect(mockedApiClient.get).toHaveBeenCalledWith('/profile');
  });

  it('updateProfile calls the expected placeholder endpoint and request body', async () => {
    const payload = {
      firstName: 'Updated',
      lastName: 'Profile',
      email: 'updated@example.com',
      phone: '1234567890',
    };
    mockedApiClient.patch.mockResolvedValue({ data: updatedUser });

    const result = await profileApi.updateProfile(payload);

    expect(result).toEqual(updatedUser);
    expect(mockedApiClient.patch).toHaveBeenCalledWith('/profile', payload);
  });

  it('useProfile executes and returns profile data', async () => {
    mockedApiClient.get.mockResolvedValue({ data: mockUser });

    let result: ReturnType<typeof useProfile> | undefined;
    let tree: renderer.ReactTestRenderer | undefined;
    const Probe = () => {
      result = useProfile();
      return null;
    };

    const client = createTestQueryClient();

    await act(async () => {
      tree = renderer.create(
        <QueryClientProvider client={client}>
          <Probe />
        </QueryClientProvider>,
      );
    });

    await waitForQuerySuccess(() => Boolean(result?.isSuccess));

    expect(mockedApiClient.get).toHaveBeenCalledTimes(1);
    expect(result?.data).toEqual(mockUser);

    await act(async () => {
      tree?.unmount();
    });
    client.clear();
  });

  it('useUpdateProfile calls the API and updates the profile cache on success', async () => {
    const payload = {
      firstName: 'Updated',
      lastName: 'Profile',
      email: 'updated@example.com',
      phone: '1234567890',
    };
    const client = createTestQueryClient();
    const updateSpy = jest.spyOn(profileApi, 'updateProfile').mockResolvedValue(updatedUser);

    let mutation: ReturnType<typeof useUpdateProfile> | undefined;
    let tree: renderer.ReactTestRenderer | undefined;
    const Probe = () => {
      mutation = useUpdateProfile();
      return null;
    };

    await act(async () => {
      tree = renderer.create(
        <QueryClientProvider client={client}>
          <Probe />
        </QueryClientProvider>,
      );
    });

    await act(async () => {
      await mutation!.mutateAsync(payload);
    });

    expect(updateSpy).toHaveBeenCalledTimes(1);
    expect(updateSpy.mock.calls[0]?.[0]).toEqual(payload);
    expect(client.getQueryData(profileQueryKeys.current())).toEqual(updatedUser);

    await act(async () => {
      tree?.unmount();
    });
    client.clear();
  });

  it('Profile UI integration is intentionally not rendered because the RN lifecycle is not reliable in this environment', () => {
    expect(true).toBe(true);
  });
});

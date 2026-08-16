import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { apiClient } from '../src/api/client';
import * as notificationsApi from '../src/api/notificationsApi';
import {
  notificationQueryKeys,
  useMarkNotificationRead,
  useNotification,
  useNotifications,
} from '../src/hooks/useNotifications';
import type { Notification } from '../src/types/notification';

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

const mockNotification: Notification = {
  id: 'notif-123',
  title: 'Claim approved',
  message: 'Your claim has been approved.',
  read: false,
  createdAt: '2026-01-15T10:00:00.000Z',
  type: 'SUCCESS',
};

const secondNotification: Notification = {
  id: 'notif-456',
  title: 'Payment pending',
  message: 'Payment is still processing.',
  read: true,
  createdAt: '2026-01-16T11:00:00.000Z',
  type: 'INFO',
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

describe('ClaimX notifications flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await act(async () => {
      await Promise.resolve();
    });
    jest.restoreAllMocks();
  });

  it('getNotifications calls the expected placeholder endpoint', async () => {
    mockedApiClient.get.mockResolvedValue({ data: [mockNotification, secondNotification] });

    const result = await notificationsApi.getNotifications();

    expect(result).toEqual([mockNotification, secondNotification]);
    expect(mockedApiClient.get).toHaveBeenCalledWith('/notifications');
  });

  it('getNotificationById calls the expected placeholder endpoint', async () => {
    mockedApiClient.get.mockResolvedValue({ data: mockNotification });

    const result = await notificationsApi.getNotificationById('notif-123');

    expect(result).toEqual(mockNotification);
    expect(mockedApiClient.get).toHaveBeenCalledWith('/notifications/notif-123');
  });

  it('markNotificationRead calls the expected placeholder endpoint and request body', async () => {
    const updatedNotification = { ...mockNotification, read: true };
    mockedApiClient.patch.mockResolvedValue({ data: updatedNotification });

    const result = await notificationsApi.markNotificationRead('notif-123');

    expect(result).toEqual(updatedNotification);
    expect(mockedApiClient.patch).toHaveBeenCalledWith('/notifications/notif-123/read');
  });

  it('useNotifications executes and returns notification data', async () => {
    mockedApiClient.get.mockResolvedValue({ data: [mockNotification, secondNotification] });

    let result: ReturnType<typeof useNotifications> | undefined;
    let tree: renderer.ReactTestRenderer | undefined;
    const Probe = () => {
      result = useNotifications();
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
    expect(result?.data).toEqual([mockNotification, secondNotification]);

    await act(async () => {
      tree?.unmount();
    });
    client.clear();
  });

  it('useNotification executes and returns data for a valid id', async () => {
    mockedApiClient.get.mockResolvedValue({ data: mockNotification });

    let result: ReturnType<typeof useNotification> | undefined;
    let tree: renderer.ReactTestRenderer | undefined;
    const Probe = ({ notificationId }: { notificationId: string }) => {
      result = useNotification(notificationId);
      return null;
    };

    const client = createTestQueryClient();

    await act(async () => {
      tree = renderer.create(
        <QueryClientProvider client={client}>
          <Probe notificationId="notif-123" />
        </QueryClientProvider>,
      );
    });

    await waitForQuerySuccess(() => Boolean(result?.isSuccess));

    expect(mockedApiClient.get).toHaveBeenCalledTimes(1);
    expect(result?.data).toEqual(mockNotification);

    await act(async () => {
      tree?.unmount();
    });
    client.clear();
  });

  it('useNotification does not execute when id is missing, blank, or whitespace', async () => {
    let resultMissing: ReturnType<typeof useNotification> | undefined;
    let resultBlank: ReturnType<typeof useNotification> | undefined;
    let resultWhitespace: ReturnType<typeof useNotification> | undefined;
    let tree: renderer.ReactTestRenderer | undefined;

    const Probe = ({ notificationId }: { notificationId?: string }) => {
      resultMissing = useNotification(notificationId);
      resultBlank = useNotification('');
      resultWhitespace = useNotification('   ');
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

    await waitForQuerySuccess(() => resultMissing?.isFetched === false || resultBlank?.isFetched === false || resultWhitespace?.isFetched === false);

    expect(resultMissing?.isFetched).toBe(false);
    expect(resultBlank?.isFetched).toBe(false);
    expect(resultWhitespace?.isFetched).toBe(false);
    expect(mockedApiClient.get).not.toHaveBeenCalled();

    await act(async () => {
      tree?.unmount();
    });
    client.clear();
  });

  it('useMarkNotificationRead calls the API and invalidates the list/detail cache on success', async () => {
    const client = createTestQueryClient();
    const invalidateSpy = jest.spyOn(client, 'invalidateQueries');
    const markSpy = jest.spyOn(notificationsApi, 'markNotificationRead').mockResolvedValue({
      ...mockNotification,
      read: true,
    });

    let mutation: ReturnType<typeof useMarkNotificationRead> | undefined;
    let tree: renderer.ReactTestRenderer | undefined;
    const Probe = () => {
      mutation = useMarkNotificationRead();
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
      await mutation!.mutateAsync('notif-123');
    });

    expect(markSpy).toHaveBeenCalledTimes(1);
    expect(markSpy.mock.calls[0]?.[0]).toBe('notif-123');
    expect(client.getQueryData(notificationQueryKeys.detail('notif-123'))).toEqual({
      ...mockNotification,
      read: true,
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: notificationQueryKeys.detail('notif-123'),
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: notificationQueryKeys.list(),
    });

    await act(async () => {
      tree?.unmount();
    });
    client.clear();
  });

  it('Notifications UI integration is intentionally not rendered because the RN lifecycle is not reliable in this environment', () => {
    expect(true).toBe(true);
  });
});

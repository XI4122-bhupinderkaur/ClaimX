import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { apiClient } from '../src/api/client';
import * as paymentsApi from '../src/api/paymentsApi';
import {
  paymentQueryKeys,
  useCreatePayment,
  usePayment,
  usePayments,
} from '../src/hooks/usePayments';
import type { Payment } from '../src/types/payment';

jest.mock('../src/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
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

const mockPayment: Payment = {
  id: 'pay-123',
  claimId: 'claim-123',
  amount: 1250,
  status: 'PENDING',
  transactionId: 'txn-123',
  createdAt: '2026-01-10T09:00:00.000Z',
};

const secondPayment: Payment = {
  id: 'pay-456',
  claimId: 'claim-456',
  amount: 320,
  status: 'COMPLETED',
  transactionId: 'txn-456',
  createdAt: '2026-01-12T09:00:00.000Z',
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

describe('ClaimX payments flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await act(async () => {
      await Promise.resolve();
    });
    jest.restoreAllMocks();
  });

  it('getPayments calls the expected placeholder endpoint', async () => {
    mockedApiClient.get.mockResolvedValue({ data: [mockPayment, secondPayment] });

    const result = await paymentsApi.getPayments();

    expect(result).toEqual([mockPayment, secondPayment]);
    expect(mockedApiClient.get).toHaveBeenCalledWith('/payments');
  });

  it('getPaymentById calls the expected placeholder endpoint', async () => {
    mockedApiClient.get.mockResolvedValue({ data: mockPayment });

    const result = await paymentsApi.getPaymentById('pay-123');

    expect(result).toEqual(mockPayment);
    expect(mockedApiClient.get).toHaveBeenCalledWith('/payments/pay-123');
  });

  it('createPayment calls the expected placeholder endpoint and request body', async () => {
    const payload = {
      claimId: 'claim-123',
      amount: 1250,
      status: 'PENDING' as const,
      transactionId: 'txn-123',
    };

    mockedApiClient.post.mockResolvedValue({ data: mockPayment });

    const result = await paymentsApi.createPayment(payload);

    expect(result).toEqual(mockPayment);
    expect(mockedApiClient.post).toHaveBeenCalledWith('/payments', payload);
  });

  it('usePayments executes and returns payment data', async () => {
    mockedApiClient.get.mockResolvedValue({ data: [mockPayment, secondPayment] });

    let result: ReturnType<typeof usePayments> | undefined;
    let tree: renderer.ReactTestRenderer | undefined;
    const Probe = () => {
      result = usePayments();
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
    expect(result?.data).toEqual([mockPayment, secondPayment]);

    await act(async () => {
      tree?.unmount();
    });
    client.clear();
  });

  it('usePayment executes and returns data for a valid id', async () => {
    mockedApiClient.get.mockResolvedValue({ data: mockPayment });

    let result: ReturnType<typeof usePayment> | undefined;
    let tree: renderer.ReactTestRenderer | undefined;
    const Probe = ({ paymentId }: { paymentId: string }) => {
      result = usePayment(paymentId);
      return null;
    };

    const client = createTestQueryClient();

    await act(async () => {
      tree = renderer.create(
        <QueryClientProvider client={client}>
          <Probe paymentId="pay-123" />
        </QueryClientProvider>,
      );
    });

    await waitForQuerySuccess(() => Boolean(result?.isSuccess));

    expect(mockedApiClient.get).toHaveBeenCalledTimes(1);
    expect(result?.data).toEqual(mockPayment);

    await act(async () => {
      tree?.unmount();
    });
    client.clear();
  });

  it('usePayment does not execute when id is missing or blank', async () => {
    let resultMissing: ReturnType<typeof usePayment> | undefined;
    let resultBlank: ReturnType<typeof usePayment> | undefined;
    let resultWhitespace: ReturnType<typeof usePayment> | undefined;
    let tree: renderer.ReactTestRenderer | undefined;

    const Probe = ({ paymentId }: { paymentId?: string }) => {
      resultMissing = usePayment(paymentId);
      resultBlank = usePayment('');
      resultWhitespace = usePayment('   ');
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

  it('useCreatePayment calls the API and updates cache/invalidation on success', async () => {
    const payload = {
      claimId: 'claim-123',
      amount: 1250,
      status: 'PENDING' as const,
      transactionId: 'txn-123',
    };
    const client = createTestQueryClient();
    const invalidateSpy = jest.spyOn(client, 'invalidateQueries');
    const createSpy = jest.spyOn(paymentsApi, 'createPayment').mockResolvedValue(mockPayment);

    let mutation: ReturnType<typeof useCreatePayment> | undefined;
    let tree: renderer.ReactTestRenderer | undefined;
    const Probe = () => {
      mutation = useCreatePayment();
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

    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(createSpy.mock.calls[0]?.[0]).toEqual(payload);
    expect(client.getQueryData(paymentQueryKeys.detail(mockPayment.id))).toEqual(mockPayment);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: paymentQueryKeys.list(),
    });

    await act(async () => {
      tree?.unmount();
    });
    client.clear();
  });
});

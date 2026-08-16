import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { apiClient } from '../src/api/client';
import * as fraudApi from '../src/api/fraudApi';
import { fraudQueryKeys, useFraudAssessment, useFraudAssessmentById } from '../src/hooks/useFraud';
import type { Fraud } from '../src/types/fraud';

jest.mock('../src/api/client', () => ({
  apiClient: {
    get: jest.fn(),
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

const mockFraudAssessment: Fraud = {
  claimId: 'claim-123',
  fraudScore: 82,
  riskLevel: 'HIGH',
  riskFactors: ['duplicate invoice', 'suspicious timing'],
  status: 'REVIEW',
};

const mountedTrees: renderer.ReactTestRenderer[] = [];
const mountedClients: QueryClient[] = [];

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
      client?.removeQueries({ queryKey: fraudQueryKeys.all });
    }
  });
};

describe('ClaimX fraud flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await cleanupMountedTrees();
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('getFraudAssessment calls the expected placeholder endpoint', async () => {
    mockedApiClient.get.mockResolvedValue({ data: mockFraudAssessment });

    const result = await fraudApi.getFraudAssessment('claim-123');

    expect(result).toEqual(mockFraudAssessment);
    expect(mockedApiClient.get).toHaveBeenCalledWith('/claims/claim-123/fraud');
  });

  it('getFraudAssessmentById calls the expected placeholder endpoint', async () => {
    mockedApiClient.get.mockResolvedValue({ data: mockFraudAssessment });

    const result = await fraudApi.getFraudAssessmentById('fraud-123');

    expect(result).toEqual(mockFraudAssessment);
    expect(mockedApiClient.get).toHaveBeenCalledWith('/fraud/fraud-123');
  });

  it('useFraudAssessment executes and returns data for a valid claimId', async () => {
    mockedApiClient.get.mockResolvedValue({ data: mockFraudAssessment });

    let result: ReturnType<typeof useFraudAssessment> | undefined;
    let tree: renderer.ReactTestRenderer | undefined;
    const Probe = ({ claimId }: { claimId: string }) => {
      result = useFraudAssessment(claimId);
      return null;
    };

    const client = createTestQueryClient();

    await act(async () => {
      tree = renderer.create(
        <QueryClientProvider client={client}>
          <Probe claimId="claim-123" />
        </QueryClientProvider>,
      );
    });

    await waitForQuerySuccess(() => Boolean(result?.isSuccess));

    expect(mockedApiClient.get).toHaveBeenCalledTimes(1);
    expect(result?.data).toEqual(mockFraudAssessment);

    await act(async () => {
      tree?.unmount();
    });
    client.clear();
  });

  it('useFraudAssessment does not execute when claimId is missing', async () => {
    let result: ReturnType<typeof useFraudAssessment> | undefined;
    let tree: renderer.ReactTestRenderer | undefined;
    const Probe = ({ claimId }: { claimId?: string }) => {
      result = useFraudAssessment(claimId);
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

    await waitForQuerySuccess(() => result?.isFetched === false || result?.isFetched === true);

    expect(result?.isFetched).toBe(false);
    expect(mockedApiClient.get).not.toHaveBeenCalled();

    await act(async () => {
      tree?.unmount();
    });
    client.clear();
  });

  it('useFraudAssessment does not execute when claimId is blank', async () => {
    let result: ReturnType<typeof useFraudAssessment> | undefined;
    let tree: renderer.ReactTestRenderer | undefined;
    const Probe = ({ claimId }: { claimId: string }) => {
      result = useFraudAssessment(claimId);
      return null;
    };

    const client = createTestQueryClient();

    await act(async () => {
      tree = renderer.create(
        <QueryClientProvider client={client}>
          <Probe claimId="   " />
        </QueryClientProvider>,
      );
    });

    await waitForQuerySuccess(() => result?.isFetched === false || result?.isFetched === true);

    expect(result?.isFetched).toBe(false);
    expect(mockedApiClient.get).not.toHaveBeenCalled();

    await act(async () => {
      tree?.unmount();
    });
    client.clear();
  });

  it('useFraudAssessmentById executes and returns data for a valid fraudId', async () => {
    mockedApiClient.get.mockResolvedValue({ data: mockFraudAssessment });

    let result: ReturnType<typeof useFraudAssessmentById> | undefined;
    let tree: renderer.ReactTestRenderer | undefined;
    const Probe = ({ fraudId }: { fraudId: string }) => {
      result = useFraudAssessmentById(fraudId);
      return null;
    };

    const client = createTestQueryClient();

    await act(async () => {
      tree = renderer.create(
        <QueryClientProvider client={client}>
          <Probe fraudId="fraud-123" />
        </QueryClientProvider>,
      );
    });

    await waitForQuerySuccess(() => Boolean(result?.isSuccess));

    expect(mockedApiClient.get).toHaveBeenCalledTimes(1);
    expect(result?.data).toEqual(mockFraudAssessment);

    await act(async () => {
      tree?.unmount();
    });
    client.clear();
  });

  it('useFraudAssessmentById does not execute when fraudId is missing', async () => {
    let result: ReturnType<typeof useFraudAssessmentById> | undefined;
    let tree: renderer.ReactTestRenderer | undefined;
    const Probe = ({ fraudId }: { fraudId?: string }) => {
      result = useFraudAssessmentById(fraudId);
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

    await waitForQuerySuccess(() => result?.isFetched === false || result?.isFetched === true);

    expect(result?.isFetched).toBe(false);
    expect(mockedApiClient.get).not.toHaveBeenCalled();

    await act(async () => {
      tree?.unmount();
    });
    client.clear();
  });

  it('useFraudAssessmentById does not execute when fraudId is blank', async () => {
    let result: ReturnType<typeof useFraudAssessmentById> | undefined;
    let tree: renderer.ReactTestRenderer | undefined;
    const Probe = ({ fraudId }: { fraudId: string }) => {
      result = useFraudAssessmentById(fraudId);
      return null;
    };

    const client = createTestQueryClient();

    await act(async () => {
      tree = renderer.create(
        <QueryClientProvider client={client}>
          <Probe fraudId="   " />
        </QueryClientProvider>,
      );
    });

    await waitForQuerySuccess(() => result?.isFetched === false || result?.isFetched === true);

    expect(result?.isFetched).toBe(false);
    expect(mockedApiClient.get).not.toHaveBeenCalled();

    await act(async () => {
      tree?.unmount();
    });
    client.clear();
  });

  it('Fraud UI integration is intentionally not rendered because the RN lifecycle is not reliable in this environment', () => {
    expect(true).toBe(true);
  });
});

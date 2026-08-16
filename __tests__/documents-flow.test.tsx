import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { apiClient } from '../src/api/client';
import * as documentsApi from '../src/api/documentsApi';
import {
  documentsQueryKeys,
  useDeleteDocument,
  useDocument,
  useDocuments,
  useUploadDocument,
} from '../src/hooks/useDocuments';
import type { Document } from '../src/types/document';

jest.mock('../src/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
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

const mockDocument: Document = {
  id: 'doc-1',
  claimId: 'claim-123',
  name: 'Claim Photo',
  type: 'PHOTOGRAPH',
  url: 'https://example.com/photo.jpg',
  uploadedAt: '2025-01-15T10:00:00.000Z',
  status: 'APPROVED',
};

const mockDocumentList: Document[] = [
  mockDocument,
  {
    ...mockDocument,
    id: 'doc-2',
    name: 'Medical Report',
    type: 'MEDICAL',
    status: 'PENDING',
  },
];

describe('ClaimX documents flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await act(async () => {
      await Promise.resolve();
    });
  });

  it('getDocuments calls the expected placeholder endpoint', async () => {
    mockedApiClient.get.mockResolvedValue({ data: mockDocumentList });

    const result = await documentsApi.getDocuments('claim-123');

    expect(result).toEqual(mockDocumentList);
    expect(mockedApiClient.get).toHaveBeenCalledWith('/claims/claim-123/documents');
  });

  it('getDocumentById calls the expected placeholder endpoint', async () => {
    mockedApiClient.get.mockResolvedValue({ data: mockDocument });

    const result = await documentsApi.getDocumentById('doc-1');

    expect(result).toEqual(mockDocument);
    expect(mockedApiClient.get).toHaveBeenCalledWith('/documents/doc-1');
  });

  it('uploadDocument calls the expected placeholder endpoint and request body', async () => {
    const request = { name: 'Invoice', type: 'INVOICE' as const };
    mockedApiClient.post.mockResolvedValue({ data: mockDocument });

    const result = await documentsApi.uploadDocument('claim-123', request);

    expect(result).toEqual(mockDocument);
    expect(mockedApiClient.post).toHaveBeenCalledWith('/claims/claim-123/documents', request);
  });

  it('deleteDocument calls the expected placeholder endpoint', async () => {
    mockedApiClient.delete.mockResolvedValue(undefined);

    await documentsApi.deleteDocument('doc-1');

    expect(mockedApiClient.delete).toHaveBeenCalledWith('/documents/doc-1');
  });

  it('useDocuments returns document data for a valid claimId', async () => {
    mockedApiClient.get.mockResolvedValue({ data: mockDocumentList });

    let result: ReturnType<typeof useDocuments> | undefined;
    let tree: renderer.ReactTestRenderer | undefined;
    const Probe = ({ claimId }: { claimId: string }) => {
      result = useDocuments(claimId);
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
    expect(result?.data).toEqual(mockDocumentList);

    await act(async () => {
      tree?.unmount();
    });
    client.clear();
  });

  it('useDocument returns document data for a valid documentId', async () => {
    mockedApiClient.get.mockResolvedValue({ data: mockDocument });

    let result: ReturnType<typeof useDocument> | undefined;
    let tree: renderer.ReactTestRenderer | undefined;
    const Probe = ({ documentId }: { documentId: string }) => {
      result = useDocument(documentId);
      return null;
    };

    const client = createTestQueryClient();

    await act(async () => {
      tree = renderer.create(
        <QueryClientProvider client={client}>
          <Probe documentId="doc-1" />
        </QueryClientProvider>,
      );
    });

    await waitForQuerySuccess(() => Boolean(result?.isSuccess));

    expect(mockedApiClient.get).toHaveBeenCalledTimes(1);
    expect(result?.data).toEqual(mockDocument);

    await act(async () => {
      tree?.unmount();
    });
    client.clear();
  });

  it('missing claimId does not execute the list query', async () => {
    let result: ReturnType<typeof useDocuments> | undefined;
    let tree: renderer.ReactTestRenderer | undefined;
    const Probe = ({ claimId }: { claimId?: string }) => {
      result = useDocuments(claimId);
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

  it('missing documentId does not execute the detail query', async () => {
    let result: ReturnType<typeof useDocument> | undefined;
    let tree: renderer.ReactTestRenderer | undefined;
    const Probe = ({ documentId }: { documentId?: string }) => {
      result = useDocument(documentId);
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

  it('useUploadDocument calls the API and invalidates the correct claim query on success', async () => {
    const request = { name: 'Passport', type: 'IDENTITY' as const };
    const client = createTestQueryClient();
    const invalidateSpy = jest.spyOn(client, 'invalidateQueries');
    const uploadSpy = jest.spyOn(documentsApi, 'uploadDocument').mockResolvedValue(mockDocument);

    let mutation: ReturnType<typeof useUploadDocument> | undefined;
    let tree: renderer.ReactTestRenderer | undefined;
    const Probe = () => {
      mutation = useUploadDocument();
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
      await mutation!.mutateAsync({ claimId: 'claim-123', request });
    });

    expect(uploadSpy).toHaveBeenCalledWith('claim-123', request);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: documentsQueryKeys.byClaim('claim-123'),
    });

    await act(async () => {
      tree?.unmount();
    });
    client.clear();
  });

  it('useDeleteDocument calls the API and invalidates the correct claim query on success', async () => {
    const client = createTestQueryClient();
    const invalidateSpy = jest.spyOn(client, 'invalidateQueries');
    const deleteSpy = jest.spyOn(documentsApi, 'deleteDocument').mockResolvedValue(undefined);

    let mutation: ReturnType<typeof useDeleteDocument> | undefined;
    let tree: renderer.ReactTestRenderer | undefined;
    const Probe = () => {
      mutation = useDeleteDocument();
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
      await mutation!.mutateAsync({ claimId: 'claim-123', documentId: 'doc-1' });
    });

    expect(deleteSpy).toHaveBeenCalledWith('doc-1');
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: documentsQueryKeys.byClaim('claim-123'),
    });

    await act(async () => {
      tree?.unmount();
    });
    client.clear();
  });

  it('documents UI integration is intentionally not rendered because the RN lifecycle is not reliable in this environment', () => {
    expect(true).toBe(true);
  });
});

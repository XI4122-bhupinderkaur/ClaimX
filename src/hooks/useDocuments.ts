import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  deleteDocument,
  getDocumentById,
  getDocuments,
  uploadDocument,
  type UploadDocumentRequest,
} from '../api/documentsApi';
import type { Document } from '../types/document';

export const documentsQueryKeys = {
  all: ['documents'] as const,
  byClaim: (claimId: string) => [...documentsQueryKeys.all, 'claim', claimId] as const,
  detail: (documentId: string) => [...documentsQueryKeys.all, documentId] as const,
};

export const useDocuments = (claimId: string | undefined) =>
  useQuery<Document[], Error>({
    queryKey: documentsQueryKeys.byClaim(claimId ?? 'missing'),
    queryFn: async () => {
      if (!claimId || claimId.trim().length === 0) {
        throw new Error('Claim ID is required');
      }

      return getDocuments(claimId);
    },
    enabled: Boolean(claimId && claimId.trim().length > 0),
  });

export const useDocument = (documentId: string | undefined) =>
  useQuery<Document, Error>({
    queryKey: documentsQueryKeys.detail(documentId ?? 'missing'),
    queryFn: async () => {
      if (!documentId || documentId.trim().length === 0) {
        throw new Error('Document ID is required');
      }

      return getDocumentById(documentId);
    },
    enabled: Boolean(documentId && documentId.trim().length > 0),
  });

export const useUploadDocument = () => {
  const queryClient = useQueryClient();

  return useMutation<Document, Error, { claimId: string; request: UploadDocumentRequest }>({
    mutationFn: async ({ claimId, request }) => uploadDocument(claimId, request),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: documentsQueryKeys.byClaim(variables.claimId),
      });
    },
  });
};

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { claimId: string; documentId: string }>({
    mutationFn: async ({ documentId }) => deleteDocument(documentId),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: documentsQueryKeys.byClaim(variables.claimId),
      });
    },
  });
};

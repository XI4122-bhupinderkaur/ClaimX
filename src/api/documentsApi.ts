import { apiClient, ApiError } from './client';
import type { Document, DocumentType } from '../types/document';

export interface UploadDocumentRequest {
  name: string;
  type: DocumentType;
}

const DOCUMENTS_PATHS = {
  list: (claimId: string): string => `/claims/${claimId}/documents`,
  detail: (documentId: string): string => `/documents/${documentId}`,
  create: (claimId: string): string => `/claims/${claimId}/documents`,
  delete: (documentId: string): string => `/documents/${documentId}`,
} as const;

export const getDocuments = async (claimId: string): Promise<Document[]> => {
  try {
    const response = await apiClient.get<Document[]>(DOCUMENTS_PATHS.list(claimId));
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError('Unable to fetch documents');
  }
};

export const getDocumentById = async (documentId: string): Promise<Document> => {
  try {
    const response = await apiClient.get<Document>(DOCUMENTS_PATHS.detail(documentId));
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError('Unable to fetch document');
  }
};

export const uploadDocument = async (
  claimId: string,
  request: UploadDocumentRequest,
): Promise<Document> => {
  try {
    const response = await apiClient.post<Document>(DOCUMENTS_PATHS.create(claimId), request);
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError('Unable to upload document');
  }
};

export const deleteDocument = async (documentId: string): Promise<void> => {
  try {
    await apiClient.delete(DOCUMENTS_PATHS.delete(documentId));
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError('Unable to delete document');
  }
};

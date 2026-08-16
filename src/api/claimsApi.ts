import { apiClient, ApiError } from './client';
import type { Claim, ClaimStatus } from '../types/claim';

export interface CreateClaimRequest {
  policyId: string;
  customerId: string;
  claimNumber: string;
  status: ClaimStatus;
  incidentDate: string;
  description: string;
  claimAmount: number;
  approvedAmount?: number;
}

export type UpdateClaimRequest = Partial<CreateClaimRequest>;

const CLAIMS_PATHS = {
  list: '/claims',
  detail: (id: string): string => `/claims/${id}`,
  create: '/claims',
  update: (id: string): string => `/claims/${id}`,
} as const;

export const getClaims = async (): Promise<Claim[]> => {
  try {
    const response = await apiClient.get<Claim[]>(CLAIMS_PATHS.list);
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError('Unable to fetch claims');
  }
};

export const getClaimById = async (id: string): Promise<Claim> => {
  try {
    const response = await apiClient.get<Claim>(CLAIMS_PATHS.detail(id));
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError('Unable to fetch claim');
  }
};

export const createClaim = async (payload: CreateClaimRequest): Promise<Claim> => {
  try {
    const response = await apiClient.post<Claim>(CLAIMS_PATHS.create, payload);
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError('Unable to create claim');
  }
};

export const updateClaim = async (
  id: string,
  payload: UpdateClaimRequest,
): Promise<Claim> => {
  try {
    const response = await apiClient.patch<Claim>(CLAIMS_PATHS.update(id), payload);
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError('Unable to update claim');
  }
};

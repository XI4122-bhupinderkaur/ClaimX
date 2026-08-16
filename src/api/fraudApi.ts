import { apiClient, ApiError } from './client';
import type { Fraud } from '../types/fraud';

const FRAUD_PATHS = {
  byClaim: (claimId: string): string => `/claims/${claimId}/fraud`,
  byId: (fraudId: string): string => `/fraud/${fraudId}`,
} as const;

export const getFraudAssessment = async (claimId: string): Promise<Fraud> => {
  try {
    const response = await apiClient.get<Fraud>(FRAUD_PATHS.byClaim(claimId));
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError('Unable to fetch fraud assessment');
  }
};

export const getFraudAssessmentById = async (fraudId: string): Promise<Fraud> => {
  try {
    const response = await apiClient.get<Fraud>(FRAUD_PATHS.byId(fraudId));
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError('Unable to fetch fraud assessment');
  }
};

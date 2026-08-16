import { useQuery } from '@tanstack/react-query';

import { getFraudAssessment, getFraudAssessmentById } from '../api/fraudApi';
import type { Fraud } from '../types/fraud';

export const fraudQueryKeys = {
  all: ['fraud'] as const,
  byClaim: (claimId: string) => [...fraudQueryKeys.all, 'claim', claimId] as const,
  detail: (fraudId: string) => [...fraudQueryKeys.all, fraudId] as const,
};

export const useFraudAssessment = (claimId: string | undefined) =>
  useQuery<Fraud, Error>({
    queryKey: fraudQueryKeys.byClaim(claimId ?? 'missing'),
    queryFn: async () => {
      if (!claimId || claimId.trim().length === 0) {
        throw new Error('Claim ID is required');
      }

      return getFraudAssessment(claimId);
    },
    enabled: Boolean(claimId && claimId.trim().length > 0),
  });

export const useFraudAssessmentById = (fraudId: string | undefined) =>
  useQuery<Fraud, Error>({
    queryKey: fraudQueryKeys.detail(fraudId ?? 'missing'),
    queryFn: async () => {
      if (!fraudId || fraudId.trim().length === 0) {
        throw new Error('Fraud ID is required');
      }

      return getFraudAssessmentById(fraudId);
    },
    enabled: Boolean(fraudId && fraudId.trim().length > 0),
  });

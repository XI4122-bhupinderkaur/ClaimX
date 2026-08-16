import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createClaim,
  getClaimById,
  getClaims,
  type CreateClaimRequest,
  type UpdateClaimRequest,
  updateClaim,
} from '../api/claimsApi';
import type { Claim } from '../types/claim';

export const claimQueryKeys = {
  all: ['claims'] as const,
  list: () => [...claimQueryKeys.all] as const,
  detail: (id: string) => [...claimQueryKeys.all, id] as const,
};

export const useClaims = () =>
  useQuery<Claim[], Error>({
    queryKey: claimQueryKeys.list(),
    queryFn: getClaims,
  });

export const useClaim = (claimId: string | undefined) =>
  useQuery<Claim, Error>({
    queryKey: claimQueryKeys.detail(claimId ?? 'missing'),
    queryFn: async () => {
      if (!claimId || claimId.trim().length === 0) {
        throw new Error('Claim ID is required');
      }

      return getClaimById(claimId);
    },
    enabled: Boolean(claimId && claimId.trim().length > 0),
  });

export const useCreateClaim = () => {
  const queryClient = useQueryClient();

  return useMutation<Claim, Error, CreateClaimRequest>({
    mutationFn: createClaim,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: claimQueryKeys.list(),
      });
      await queryClient.refetchQueries({
        queryKey: claimQueryKeys.list(),
      });
    },
  });
};

export interface UpdateClaimVariables {
  id: string;
  payload: UpdateClaimRequest;
}

export const useUpdateClaim = () => {
  const queryClient = useQueryClient();

  return useMutation<Claim, Error, UpdateClaimVariables>({
    mutationFn: async ({ id, payload }) => updateClaim(id, payload),
    onSuccess: async (updatedClaim, variables) => {
      await queryClient.setQueryData<Claim | undefined>(
        claimQueryKeys.detail(variables.id),
        updatedClaim,
      );
      await queryClient.invalidateQueries({
        queryKey: claimQueryKeys.detail(variables.id),
      });
      await queryClient.invalidateQueries({
        queryKey: claimQueryKeys.list(),
      });
    },
  });
};

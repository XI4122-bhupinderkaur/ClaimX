import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createPayment,
  getPaymentById,
  getPayments,
  type CreatePaymentRequest,
} from '../api/paymentsApi';
import type { Payment } from '../types/payment';

export const paymentQueryKeys = {
  all: ['payments'] as const,
  list: () => [...paymentQueryKeys.all, 'list'] as const,
  detail: (id: string) => [...paymentQueryKeys.all, id] as const,
};

export const usePayments = () =>
  useQuery<Payment[], Error>({
    queryKey: paymentQueryKeys.list(),
    queryFn: getPayments,
  });

export const usePayment = (id: string | undefined) =>
  useQuery<Payment, Error>({
    queryKey: paymentQueryKeys.detail(id ?? 'missing'),
    queryFn: async () => {
      if (!id || id.trim().length === 0) {
        throw new Error('Payment ID is required');
      }

      return getPaymentById(id);
    },
    enabled: Boolean(id && id.trim().length > 0),
  });

export const useCreatePayment = () => {
  const queryClient = useQueryClient();

  return useMutation<Payment, Error, CreatePaymentRequest>({
    mutationFn: createPayment,
    onSuccess: async (createdPayment) => {
      await queryClient.setQueryData<Payment | undefined>(
        paymentQueryKeys.detail(createdPayment.id),
        createdPayment,
      );
      await queryClient.invalidateQueries({
        queryKey: paymentQueryKeys.list(),
      });
    },
  });
};

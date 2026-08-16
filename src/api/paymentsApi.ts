import { apiClient, ApiError } from './client';
import type { Payment, PaymentStatus } from '../types/payment';

export interface CreatePaymentRequest {
  claimId: string;
  amount: number;
  status: PaymentStatus;
  transactionId: string;
}

const PAYMENTS_PATHS = {
  list: '/payments',
  detail: (id: string): string => `/payments/${id}`,
  create: '/payments',
} as const;

export const getPayments = async (): Promise<Payment[]> => {
  try {
    const response = await apiClient.get<Payment[]>(PAYMENTS_PATHS.list);
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError('Unable to fetch payments');
  }
};

export const getPaymentById = async (id: string): Promise<Payment> => {
  try {
    const response = await apiClient.get<Payment>(PAYMENTS_PATHS.detail(id));
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError('Unable to fetch payment');
  }
};

export const createPayment = async (
  payload: CreatePaymentRequest,
): Promise<Payment> => {
  try {
    const response = await apiClient.post<Payment>(PAYMENTS_PATHS.create, payload);
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError('Unable to create payment');
  }
};

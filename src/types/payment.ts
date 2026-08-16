export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface Payment {
  id: string;
  claimId: string;
  amount: number;
  status: PaymentStatus;
  transactionId: string;
  createdAt: string;
}

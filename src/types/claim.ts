export type ClaimStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'INVESTIGATION'
  | 'APPROVED'
  | 'REJECTED'
  | 'PAYMENT_PENDING'
  | 'PAID'
  | 'CLOSED';

export interface Claim {
  id: string;
  policyId: string;
  customerId: string;
  claimNumber: string;
  status: ClaimStatus;
  incidentDate: string;
  description: string;
  claimAmount: number;
  approvedAmount: number;
  createdAt: string;
  updatedAt: string;
}

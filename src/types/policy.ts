export type PolicyStatus = 'ACTIVE' | 'EXPIRED' | 'PENDING' | 'CANCELLED';

export type PolicyType = 'AUTO' | 'HOME' | 'HEALTH' | 'LIFE' | 'COMMERCIAL';

export interface Policy {
  id: string;
  policyNumber: string;
  customerId: string;
  policyType: PolicyType;
  startDate: string;
  endDate: string;
  coverageAmount: number;
  status: PolicyStatus;
}

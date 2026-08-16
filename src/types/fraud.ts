export type FraudRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type FraudStatus = 'PENDING' | 'REVIEW' | 'FLAGGED' | 'CLEARED';

export interface Fraud {
  claimId: string;
  fraudScore: number;
  riskLevel: FraudRiskLevel;
  riskFactors: string[];
  status: FraudStatus;
}

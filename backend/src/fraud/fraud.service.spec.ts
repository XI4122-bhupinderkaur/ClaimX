import { FraudService } from './fraud.service';

describe('FraudService', () => {
  let service: FraudService;
  const mockPrisma: any = {
    claim: { findUnique: jest.fn() },
    fraudAssessment: { findUnique: jest.fn() },
  };

  beforeEach(() => {
    jest.resetAllMocks();
    service = new FraudService(mockPrisma as any);
  });

  it('returns fraud assessment for owned claim', async () => {
    mockPrisma.claim.findUnique.mockResolvedValue({ id: 'claim-1', customerId: 'u1' });
    mockPrisma.fraudAssessment.findUnique.mockResolvedValue({ id: 'f1', claimId: 'claim-1', fraudScore: 50, riskLevel: 'MEDIUM', riskFactors: ['a'], status: 'REVIEW' });

    const res = await service.getByClaimId('claim-1', 'u1');
    expect(res.claimId).toBe('claim-1');
    expect(res.fraudScore).toBe(50);
  });

  it('throws 403 when accessing another user claim', async () => {
    mockPrisma.claim.findUnique.mockResolvedValue({ id: 'claim-1', customerId: 'u2' });
    await expect(service.getByClaimId('claim-1', 'u1')).rejects.toThrow();
  });

  it('throws 404 when claim not found', async () => {
    mockPrisma.claim.findUnique.mockResolvedValue(null);
    await expect(service.getByClaimId('claim-1', 'u1')).rejects.toThrow();
  });

  it('throws 404 when fraud assessment not found', async () => {
    mockPrisma.claim.findUnique.mockResolvedValue({ id: 'claim-1', customerId: 'u1' });
    mockPrisma.fraudAssessment.findUnique.mockResolvedValue(null);
    await expect(service.getByClaimId('claim-1', 'u1')).rejects.toThrow();
  });

  it('getById enforces ownership and returns assessment', async () => {
    mockPrisma.fraudAssessment.findUnique.mockResolvedValue({ id: 'f1', claimId: 'claim-1', fraudScore: 10, riskLevel: 'LOW', riskFactors: [], status: 'CLEARED' });
    mockPrisma.claim.findUnique.mockResolvedValue({ id: 'claim-1', customerId: 'u1' });

    const res = await service.getById('f1', 'u1');
    expect(res.fraudScore).toBe(10);
  });

  it('getById throws 404 when assessment missing', async () => {
    mockPrisma.fraudAssessment.findUnique.mockResolvedValue(null);
    await expect(service.getById('no', 'u1')).rejects.toThrow();
  });
});

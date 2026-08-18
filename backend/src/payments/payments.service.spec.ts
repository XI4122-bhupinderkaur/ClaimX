import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  let service: PaymentsService;
  const mockPrisma: any = {
    payment: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn() },
    claim: { findUnique: jest.fn() },
  };

  beforeEach(() => {
    jest.resetAllMocks();
    service = new PaymentsService(mockPrisma as any);
  });

  it('listPayments returns payments for user claims', async () => {
    mockPrisma.payment.findMany.mockResolvedValue([
      { id: 'p1', claimId: 'c1', amount: 100, status: 'PENDING', transactionId: 't1', createdAt: new Date() },
    ]);

    const res = await service.listPayments('u1');
    expect(res).toHaveLength(1);
    expect(res[0].amount).toBe(100);
  });

  it('getPaymentById returns payment if owned by user', async () => {
    mockPrisma.payment.findUnique.mockResolvedValue({ id: 'p1', claimId: 'c1', amount: 200, status: 'COMPLETED', transactionId: 't2', createdAt: new Date() });
    mockPrisma.claim.findUnique.mockResolvedValue({ id: 'c1', customerId: 'u1' });

    const res = await service.getPaymentById('p1', 'u1');
    expect(res.amount).toBe(200);
  });

  it('getPaymentById throws 404 when missing', async () => {
    mockPrisma.payment.findUnique.mockResolvedValue(null);
    await expect(service.getPaymentById('no', 'u1')).rejects.toThrow();
  });

  it('createPayment creates when claim owned', async () => {
    mockPrisma.claim.findUnique.mockResolvedValue({ id: 'c1', customerId: 'u1' });
    mockPrisma.payment.create.mockResolvedValue({ id: 'p1', claimId: 'c1', amount: 300, status: 'PENDING', transactionId: 't3', createdAt: new Date() });

    const res = await service.createPayment({ claimId: 'c1', amount: 300, status: 'PENDING', transactionId: 't3' } as any, 'u1');
    expect(res.amount).toBe(300);
  });

  it('createPayment rejects when claim is for another user', async () => {
    mockPrisma.claim.findUnique.mockResolvedValue({ id: 'c1', customerId: 'u2' });
    await expect(service.createPayment({ claimId: 'c1', amount: 10, status: 'PENDING', transactionId: 't' } as any, 'u1')).rejects.toThrow();
  });

  it('createPayment throws 404 when claim missing', async () => {
    mockPrisma.claim.findUnique.mockResolvedValue(null);
    await expect(service.createPayment({ claimId: 'c1', amount: 10, status: 'PENDING', transactionId: 't' } as any, 'u1')).rejects.toThrow();
  });
});

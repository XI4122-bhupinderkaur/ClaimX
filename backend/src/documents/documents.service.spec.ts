import { DocumentsService } from './documents.service';

describe('DocumentsService', () => {
  let service: DocumentsService;
  const mockPrisma: any = {
    claim: { findUnique: jest.fn() },
    document: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), delete: jest.fn() },
  };

  beforeEach(() => {
    jest.resetAllMocks();
    service = new DocumentsService(mockPrisma as any);
  });

  it('listDocuments returns documents for owned claim', async () => {
    mockPrisma.claim.findUnique.mockResolvedValue({ id: 'claim-1', customerId: 'u1' });
    mockPrisma.document.findMany.mockResolvedValue([{ id: 'd1', claimId: 'claim-1', name: 'n', type: 'PHOTOGRAPH', url: '', uploadedAt: new Date(), status: 'PENDING' }]);

    const res = await service.listDocuments('claim-1', 'u1');
    expect(res).toHaveLength(1);
    expect(res[0].claimId).toBe('claim-1');
  });

  it('listDocuments rejects access to another user claim', async () => {
    mockPrisma.claim.findUnique.mockResolvedValue({ id: 'claim-1', customerId: 'u2' });
    await expect(service.listDocuments('claim-1', 'u1')).rejects.toThrow();
  });

  it('getDocumentById returns document for owned claim', async () => {
    mockPrisma.document.findUnique.mockResolvedValue({ id: 'd1', claimId: 'claim-1', name: 'n', type: 'PHOTOGRAPH', url: '', uploadedAt: new Date(), status: 'PENDING' });
    mockPrisma.claim.findUnique.mockResolvedValue({ id: 'claim-1', customerId: 'u1' });

    const res = await service.getDocumentById('d1', 'u1');
    expect(res.id).toBe('d1');
  });

  it('getDocumentById throws 404 when missing', async () => {
    mockPrisma.document.findUnique.mockResolvedValue(null);
    await expect(service.getDocumentById('no', 'u1')).rejects.toThrow();
  });

  it('createDocument creates metadata for owned claim', async () => {
    mockPrisma.claim.findUnique.mockResolvedValue({ id: 'claim-1', customerId: 'u1' });
    mockPrisma.document.create.mockResolvedValue({ id: 'd1', claimId: 'claim-1', name: 'n', type: 'PHOTOGRAPH', url: '', uploadedAt: new Date(), status: 'PENDING' });

    const res = await service.createDocument('claim-1', { name: 'n', type: 'PHOTOGRAPH' } as any, 'u1');
    expect(res.id).toBe('d1');
  });

  it('deleteDocument deletes document for owned claim', async () => {
    mockPrisma.document.findUnique.mockResolvedValue({ id: 'd1', claimId: 'claim-1' });
    mockPrisma.claim.findUnique.mockResolvedValue({ id: 'claim-1', customerId: 'u1' });
    mockPrisma.document.delete.mockResolvedValue({});

    await expect(service.deleteDocument('d1', 'u1')).resolves.toBeUndefined();
  });
});

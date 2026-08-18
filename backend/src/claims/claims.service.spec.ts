import { ClaimsService } from './claims.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('ClaimsService', () => {
  let service: ClaimsService;
  let prisma: Partial<PrismaService>;

  beforeEach(() => {
    prisma = {
      claim: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      } as any,
    };

    service = new ClaimsService(prisma as PrismaService);
  });

  it('lists claims for user', async () => {
    const mock = [
      {
        id: '1',
        policyId: 'p1',
        customerId: 'u1',
        claimNumber: 'C-100',
        status: 'SUBMITTED',
        incidentDate: new Date('2020-01-01'),
        description: 'd',
        claimAmount: 100,
        approvedAmount: 0,
        createdAt: new Date('2020-01-02'),
        updatedAt: new Date('2020-01-03'),
      },
    ];

    (prisma.claim!.findMany as jest.Mock).mockResolvedValue(mock);

    const res = await service.listClaims('u1');
    expect(res).toHaveLength(1);
    expect(res[0].id).toBe('1');
    expect(res[0].claimAmount).toBe(100);
  });

  it('getClaimById throws NotFound when missing', async () => {
    (prisma.claim!.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(service.getClaimById('nope')).rejects.toThrow(NotFoundException);
  });

  it('getClaimById throws Forbidden when owner mismatch', async () => {
    (prisma.claim!.findUnique as jest.Mock).mockResolvedValue({ id: '1', customerId: 'u2', incidentDate: new Date(), claimAmount: 10, approvedAmount: 0, createdAt: new Date(), updatedAt: new Date(), policyId: '', claimNumber: '', status: 'SUBMITTED', description: '' });
    await expect(service.getClaimById('1', 'u1')).rejects.toThrow(ForbiddenException);
  });

  it('createClaim delegates to prisma.create and returns mapped', async () => {
    const payload: any = {
      policyId: 'p',
      customerId: 'u1',
      claimNumber: 'CN',
      status: 'SUBMITTED',
      incidentDate: '2020-01-01',
      description: 'desc',
      claimAmount: 123.45,
    };

    const created = {
      ...payload,
      id: 'new',
      claimAmount: 123.45,
      approvedAmount: 0,
      incidentDate: new Date(payload.incidentDate),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (prisma.claim!.create as jest.Mock).mockResolvedValue(created);

    const res = await service.createClaim(payload, 'u1');
    expect(res.id).toBe('new');
    expect(res.claimAmount).toBe(123.45);
  });
});

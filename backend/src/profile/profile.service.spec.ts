import { ProfileService } from './profile.service';

describe('ProfileService', () => {
  let service: ProfileService;
  const mockPrisma: any = { user: { findUnique: jest.fn(), update: jest.fn() } };

  beforeEach(() => {
    service = new ProfileService(mockPrisma as any);
  });

  it('getProfile returns mapped user without passwordHash', async () => {
    const user = { id: 'u1', firstName: 'A', lastName: 'B', email: 'a@b.com', phone: '123', role: 'CUSTOMER', passwordHash: 'secret' };
    mockPrisma.user.findUnique.mockResolvedValue(user);
    const res = await service.getProfile('u1');
    expect(res).toEqual({ id: 'u1', firstName: 'A', lastName: 'B', email: 'a@b.com', phone: '123', role: 'CUSTOMER' });
  });

  it('getProfile throws NotFound for missing user', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    await expect(service.getProfile('no')).rejects.toThrow();
  });

  it('updateProfile updates allowed fields and returns mapped user', async () => {
    const updated = { id: 'u1', firstName: 'X', lastName: 'Y', email: 'x@y.com', phone: '9', role: 'CUSTOMER', passwordHash: 'secret' };
    mockPrisma.user.update.mockResolvedValue(updated);
    const res = await service.updateProfile('u1', { firstName: 'X', email: 'x@y.com' });
    expect(res).toEqual({ id: 'u1', firstName: 'X', lastName: 'Y', email: 'x@y.com', phone: '9', role: 'CUSTOMER' });
  });
});

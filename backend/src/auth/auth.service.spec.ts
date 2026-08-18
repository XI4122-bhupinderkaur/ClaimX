import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  const mockPrisma: any = { user: { findUnique: jest.fn() } };
  const mockJwt: any = { sign: jest.fn().mockReturnValue('tok') , verifyAsync: jest.fn() };

  beforeEach(() => {
    service = new AuthService(mockPrisma as any, mockJwt as any);
  });

  it('validateUser returns null for unknown user', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    const res = await service.validateUser('no', 'pw');
    expect(res).toBeNull();
  });

  it('validateUser returns user for correct password', async () => {
    const user = { id: 'u1', email: 'e', passwordHash: await require('bcryptjs').hash('pw', 4), role: 'CUSTOMER' };
    mockPrisma.user.findUnique.mockResolvedValue(user);
    const res = await service.validateUser('e', 'pw');
    expect(res).toBeDefined();
    expect((res as any).passwordHash).toBeUndefined();
  });

  it('login returns user and token', async () => {
    const user = { id: 'u1', email: 'e', role: 'CUSTOMER' };
    mockJwt.sign.mockReturnValue('signed');
    const out = await service.login(user);
    expect(out.token).toBe('signed');
    expect(out.user).toEqual(user);
  });
});

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ProfileService } from '../profile/profile.service';
import { NotFoundException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  const mockAuthService: any = {};
  const mockProfileService: any = { getProfile: jest.fn() };

  beforeEach(() => {
    controller = new AuthController(mockAuthService as any, mockProfileService as any);
  });

  it('returns full user profile for authenticated user', async () => {
    const user = {
      id: 'u1',
      firstName: 'A',
      lastName: 'B',
      email: 'a@b.com',
      phone: '123',
      role: 'CUSTOMER',
    };

    mockProfileService.getProfile.mockResolvedValue(user);

    const res = await controller.me({ user: { id: 'u1' } } as any);
    expect(res).toEqual(user);
    expect(res).not.toHaveProperty('passwordHash');
  });

  it('does not return passwordHash even if present', async () => {
    const userWithHash = {
      id: 'u1',
      firstName: 'A',
      lastName: 'B',
      email: 'a@b.com',
      phone: '123',
      role: 'CUSTOMER',
      passwordHash: 'sekrit',
    };

    // ProfileService.getProfile should already strip passwordHash, but test protection
    mockProfileService.getProfile.mockResolvedValue(userWithHash);

    const res = await controller.me({ user: { id: 'u1' } } as any);
    expect((res as any).passwordHash).toBeUndefined();
    expect(res).toEqual({
      id: 'u1',
      firstName: 'A',
      lastName: 'B',
      email: 'a@b.com',
      phone: '123',
      role: 'CUSTOMER',
    });
  });

  it('returns 404 when user missing', async () => {
    mockProfileService.getProfile.mockRejectedValue(new NotFoundException('User not found'));

    await expect(controller.me({ user: { id: 'no' } } as any)).rejects.toThrow(NotFoundException);
  });
});

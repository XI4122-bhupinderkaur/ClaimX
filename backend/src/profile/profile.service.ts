import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  private mapUser(user: any) {
    if (!user) return null;
    const { passwordHash, ...safe } = user;
    return {
      id: safe.id,
      firstName: safe.firstName,
      lastName: safe.lastName,
      email: safe.email,
      phone: safe.phone,
      role: safe.role,
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return this.mapUser(user);
  }

  async updateProfile(userId: string, payload: Partial<Record<string, any>>) {
    const allowed: any = {};
    if (payload.firstName !== undefined) allowed.firstName = payload.firstName;
    if (payload.lastName !== undefined) allowed.lastName = payload.lastName;
    if (payload.email !== undefined) allowed.email = payload.email;
    if (payload.phone !== undefined) allowed.phone = payload.phone;

    const user = await this.prisma.user.update({ where: { id: userId }, data: allowed });
    return this.mapUser(user);
  }
}

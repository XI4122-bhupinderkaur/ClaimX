import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwtService: JwtService) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return null;

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return null;

    // do not return passwordHash
    // return minimal user object
    const { passwordHash, ...safe } = user as any;
    return safe;
  }

  async login(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload);
    return { user, token };
  }

  async verifyToken(token: string) {
    try {
      return this.jwtService.verifyAsync(token);
    } catch (e) {
      throw new UnauthorizedException();
    }
  }
}

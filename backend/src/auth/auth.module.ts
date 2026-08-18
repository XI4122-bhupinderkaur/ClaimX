import { Module, OnModuleInit } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PrismaModule,
    // Import ProfileModule so AuthController can inject ProfileService
    // without creating a duplicate provider.
    require('../profile/profile.module').ProfileModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule implements OnModuleInit {
  onModuleInit() {
    if (!process.env.JWT_SECRET) {
      // Do not hardcode a secret. Fail fast in development if missing.
      // It is the deployer's responsibility to supply JWT_SECRET in env.
      // eslint-disable-next-line no-console
      console.warn('Warning: JWT_SECRET is not set; JWT signing may fail.');
    }
  }
}

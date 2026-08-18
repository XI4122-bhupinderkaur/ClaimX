import { Controller, Post, Body, UsePipes, ValidationPipe, Get, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ProfileService } from '../profile/profile.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService, private profileService: ProfileService) {}

  @Post('login')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async login(@Body() dto: LoginDto) {
    const user = await this.authService.validateUser(dto.email, dto.password);
    if (!user) {
      return Promise.reject({ status: 401, message: 'Invalid credentials' });
    }

    return this.authService.login(user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: any) {
    // req.user populated by JwtStrategy.validate
    // Ensure we load the full canonical user shape from DB using authenticated id
    const userId = req.user?.id;
    const profile = await this.profileService.getProfile(userId);
    // Defensive: ensure no sensitive fields are returned
    const { passwordHash, ...safe } = profile as any;
    return safe;
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout() {
    // stateless JWT logout endpoint — frontend should remove token client-side
    return { success: true };
  }
}

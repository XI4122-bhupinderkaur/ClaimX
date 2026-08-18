import { Controller, Get, Patch, Body, UseGuards, UsePipes, ValidationPipe, Req } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('profile')
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class ProfileController {
  constructor(private service: ProfileService) {}

  @Get()
  async get(@Req() req: any) {
    const user = req.user;
    return this.service.getProfile(user.id);
  }

  @Patch()
  async update(@Req() req: any, @Body() dto: UpdateProfileDto) {
    const user = req.user;
    return this.service.updateProfile(user.id, dto as any);
  }
}

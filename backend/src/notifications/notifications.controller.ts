import { Controller, Get, Param, Patch, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private service: NotificationsService) {}

  @Get('/notifications')
  async list(@Req() req: any) {
    return this.service.listNotifications(req.user.id);
  }

  @Get('/notifications/:id')
  async get(@Param('id') id: string, @Req() req: any) {
    return this.service.getNotificationById(id, req.user.id);
  }

  @Patch('/notifications/:id/read')
  async markRead(@Param('id') id: string, @Req() req: any) {
    return this.service.markAsRead(id, req.user.id);
  }
}

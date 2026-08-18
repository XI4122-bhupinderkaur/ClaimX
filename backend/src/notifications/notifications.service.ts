import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  private mapNotification(record: any) {
    return {
      id: record.id,
      title: record.title,
      message: record.message,
      read: record.read,
      createdAt: record.createdAt.toISOString(),
      type: record.type,
    };
  }

  async listNotifications(userId: string) {
    const records = await this.prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
    return records.map((r) => this.mapNotification(r));
  }

  async getNotificationById(id: string, userId: string) {
    const record = await this.prisma.notification.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Notification not found');
    if (record.userId !== userId) throw new ForbiddenException('Not authorized to access this notification');
    return this.mapNotification(record);
  }

  async markAsRead(id: string, userId: string) {
    const record = await this.prisma.notification.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Notification not found');
    if (record.userId !== userId) throw new ForbiddenException('Not authorized to modify this notification');

    const updated = await this.prisma.notification.update({ where: { id }, data: { read: true } });
    return this.mapNotification(updated);
  }
}

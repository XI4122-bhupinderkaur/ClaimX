import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  const mockPrisma: any = {
    notification: { findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
  };

  beforeEach(() => {
    jest.resetAllMocks();
    service = new NotificationsService(mockPrisma as any);
  });

  it('listNotifications returns notifications for user', async () => {
    mockPrisma.notification.findMany.mockResolvedValue([
      { id: 'n1', userId: 'u1', title: 't', message: 'm', read: false, createdAt: new Date(), type: 'INFO' },
    ]);

    const res = await service.listNotifications('u1');
    expect(res).toHaveLength(1);
    expect(res[0].id).toBe('n1');
  });

  it('getNotificationById returns notification when owned', async () => {
    mockPrisma.notification.findUnique.mockResolvedValue({ id: 'n1', userId: 'u1', title: 't', message: 'm', read: false, createdAt: new Date(), type: 'INFO' });
    const res = await service.getNotificationById('n1', 'u1');
    expect(res.id).toBe('n1');
  });

  it('getNotificationById throws 404 when missing', async () => {
    mockPrisma.notification.findUnique.mockResolvedValue(null);
    await expect(service.getNotificationById('no', 'u1')).rejects.toThrow();
  });

  it('getNotificationById rejects another user', async () => {
    mockPrisma.notification.findUnique.mockResolvedValue({ id: 'n1', userId: 'u2', title: 't', message: 'm', read: false, createdAt: new Date(), type: 'INFO' });
    await expect(service.getNotificationById('n1', 'u1')).rejects.toThrow();
  });

  it('markAsRead persists read=true and returns updated record', async () => {
    mockPrisma.notification.findUnique.mockResolvedValue({ id: 'n1', userId: 'u1', title: 't', message: 'm', read: false, createdAt: new Date(), type: 'INFO' });
    mockPrisma.notification.update.mockResolvedValue({ id: 'n1', userId: 'u1', title: 't', message: 'm', read: true, createdAt: new Date(), type: 'INFO' });

    const res = await service.markAsRead('n1', 'u1');
    expect(res.read).toBe(true);
  });

  it('markAsRead rejects another user', async () => {
    mockPrisma.notification.findUnique.mockResolvedValue({ id: 'n1', userId: 'u2', title: 't', message: 'm', read: false, createdAt: new Date(), type: 'INFO' });
    await expect(service.markAsRead('n1', 'u1')).rejects.toThrow();
  });
});

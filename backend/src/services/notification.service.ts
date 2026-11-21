import { prisma } from '../prisma/client';
import { getIO } from '../sockets';

export class NotificationService {
  public async getNotificationsForUser(userId: string) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  public async markAsRead(userId: string, notificationId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });
    if (!notification || notification.userId !== userId) {
      throw new Error('Notification not found.');
    }

    return prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });
  }

  public async createNotification(
    hospitalId: string,
    userId: string,
    title: string,
    body: string
  ) {
    const notif = await prisma.notification.create({
      data: {
        hospitalId,
        userId,
        title,
        body,
      },
    });

    const io = getIO();
    if (io) {
      io.to(`user:${userId}`).emit('notification:new', notif);
    }

    return notif;
  }
}

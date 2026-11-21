import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service';
import { sendSuccess } from '../utils/response';

const notificationService = new NotificationService();

export class NotificationController {
  public static async getUserNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const notifications = await notificationService.getNotificationsForUser(req.user!.id);
      sendSuccess(res, notifications, 'Notifications fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async markRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const updated = await notificationService.markAsRead(req.user!.id, id);
      sendSuccess(res, updated, 'Notification marked as read');
    } catch (error) {
      next(error);
    }
  }
}

import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.use(authenticate);

router.get('/', NotificationController.getUserNotifications);
router.patch('/:id/read', NotificationController.markRead);

export default router;

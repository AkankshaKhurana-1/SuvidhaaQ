import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { roleMiddleware } from '../middleware/role.middleware';

const router = Router();

// Secure all admin endpoints - restrict access to system admins only
router.use(authMiddleware);
router.use(roleMiddleware(['ADMIN']));

// Define endpoints according to contract
router.get('/command-center', AdminController.getCommandCenter);
router.get('/analytics', AdminController.getAnalytics);
router.get('/staff', AdminController.getStaff);

export default router;

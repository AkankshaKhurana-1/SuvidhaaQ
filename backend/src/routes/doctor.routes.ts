import { Router } from 'express';
import { DoctorController } from '../controllers/doctor.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { roleMiddleware } from '../middleware/role.middleware';

const router = Router();

// Secure all doctor endpoints
router.use(authMiddleware);

// Define endpoints according to contract
router.put('/status', roleMiddleware(['ADMIN', 'DOCTOR']), DoctorController.updateStatus);
router.get('/:doctor_id', DoctorController.getProfile);

export default router;

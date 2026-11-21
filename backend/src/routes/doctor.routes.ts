import { Router } from 'express';
import { DoctorController } from '../controllers/doctor.controller';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { Role } from '@prisma/client';

const router = Router();

// Scoped strictly to authenticated DOCTOR role
router.use(authenticate, requireRole(Role.DOCTOR));

// Doctor workstation queue
router.get('/queue', DoctorController.getQueue);

// Call next patient
router.post('/call-next', DoctorController.callNext);

// Start consultation
router.post('/:id/start', DoctorController.startConsultation);

// Complete consultation
router.post('/:id/complete', DoctorController.completeConsultation);

// Consultation history
router.get('/history', DoctorController.getHistory);

// Update doctor availability
router.put('/availability', DoctorController.updateAvailability);

export default router;

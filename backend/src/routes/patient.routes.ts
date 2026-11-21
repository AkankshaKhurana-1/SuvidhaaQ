import { Router } from 'express';
import { PatientController } from '../controllers/patient.controller';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

// Patient specific routes
router.get('/dashboard', requireRole(Role.PATIENT), PatientController.getDashboard);
router.get('/profile', requireRole(Role.PATIENT), PatientController.getProfile);
router.patch('/profile', requireRole(Role.PATIENT), PatientController.updateProfile);
router.get('/appointments', requireRole(Role.PATIENT), PatientController.getAppointments);
router.post('/', requireRole(Role.PATIENT), PatientController.bookVisit);

export default router;

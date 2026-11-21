import { Router } from 'express';
import { PatientController } from '../controllers/patient.controller';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

// Cancel appointment
router.post('/:id/cancel', requireRole(Role.PATIENT, Role.RECEPTIONIST, Role.ADMIN), PatientController.cancelAppointment);

export default router;

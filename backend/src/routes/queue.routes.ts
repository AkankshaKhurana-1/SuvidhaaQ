import { Router } from 'express';
import { QueueController } from '../controllers/queue.controller';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { Role } from '@prisma/client';

const router = Router();

// All queue routes require authentication
router.use(authenticate);

// Walk-in registration (Receptionist or Admin)
router.post(
  '/walk-in',
  requireRole(Role.RECEPTIONIST, Role.ADMIN),
  QueueController.registerWalkIn
);

// Mark arrived (Receptionist or Admin)
router.post(
  '/:id/arrive',
  requireRole(Role.RECEPTIONIST, Role.ADMIN),
  QueueController.markArrived
);

// Mark no show (Receptionist or Admin)
router.post(
  '/:id/no-show',
  requireRole(Role.RECEPTIONIST, Role.ADMIN),
  QueueController.markNoShow
);

// Emergency triage flag (Receptionist or Admin)
router.post(
  '/emergency',
  requireRole(Role.RECEPTIONIST, Role.ADMIN),
  QueueController.flagEmergency
);

// Live queue board (Receptionist, Admin, Doctor)
router.get(
  '/live',
  requireRole(Role.RECEPTIONIST, Role.ADMIN, Role.DOCTOR),
  QueueController.getLive
);

// Patient search (Receptionist, Admin, Doctor)
router.get(
  '/patients',
  requireRole(Role.RECEPTIONIST, Role.ADMIN, Role.DOCTOR),
  QueueController.searchPatients
);

export default router;

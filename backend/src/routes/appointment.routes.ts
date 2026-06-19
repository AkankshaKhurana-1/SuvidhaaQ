import { Router } from 'express';
import { AppointmentController } from '../controllers/appointment.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Apply auth middleware to protect these routes
router.use(authMiddleware);

// Define endpoints according to contract
router.post('/book', AppointmentController.book);
router.get('/all', AppointmentController.getAll);
router.get('/:patient_id', AppointmentController.getByPatient);

export default router;

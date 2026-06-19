import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Apply auth middleware to protect these routes
router.use(authMiddleware);

// Define endpoints according to contract
router.post('/upload', ReportController.upload);
router.get('/:patient_id', ReportController.getByPatient);
router.get('/doctor/:token_id', ReportController.getByDoctorToken);

export default router;

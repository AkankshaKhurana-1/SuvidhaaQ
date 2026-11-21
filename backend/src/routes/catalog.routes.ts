import { Router } from 'express';
import { CatalogController } from '../controllers/catalog.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

// Public / Authenticated catalog browsing
router.get('/hospitals', CatalogController.getHospitals);
router.get('/hospitals/:id/departments', CatalogController.getDepartments);
router.get('/doctors', CatalogController.getDoctors);

export default router;

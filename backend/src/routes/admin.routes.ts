import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { Role } from '@prisma/client';

const router = Router();

// Scoped strictly to authenticated ADMIN role
router.use(authenticate, requireRole(Role.ADMIN));

// Overview KPIs
router.get('/overview', AdminController.getOverview);

// Department load
router.get('/departments/load', AdminController.getDepartmentLoad);

// Doctor roster
router.get('/doctors', AdminController.getDoctorRoster);
router.patch('/doctors/:id', AdminController.updateDoctorRoster);

// Staff accounts
router.get('/staff', AdminController.getStaff);
router.post('/staff', AdminController.createStaff);
router.patch('/staff/:id', AdminController.updateStaff);

// Capacity settings
router.post('/capacity', AdminController.updateCapacitySettings);

// Audit logs
router.get('/audit-logs', AdminController.getAuditLogs);

// Departments
router.post('/departments', AdminController.createDepartment);

export default router;

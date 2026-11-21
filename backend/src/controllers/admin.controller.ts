import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../services/admin.service';
import { sendSuccess, sendError } from '../utils/response';
import {
  createStaffSchema,
  updateStaffSchema,
  updateDoctorRosterSchema,
  capacitySettingsSchema,
  createDepartmentSchema,
} from '../validators/admin.validator';

const adminService = new AdminService();

export class AdminController {
  public static async getOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await adminService.getOverview(req.user!.hospitalId!);
      sendSuccess(res, data, 'Command center overview fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async getDepartmentLoad(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await adminService.getDepartmentLoad(req.user!.hospitalId!);
      sendSuccess(res, data, 'Department load breakdown fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async getDoctorRoster(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await adminService.getDoctorRoster(req.user!.hospitalId!);
      sendSuccess(res, data, 'Doctor roster fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async updateDoctorRoster(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = updateDoctorRosterSchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR', parsed.error.format());
        return;
      }
      const updated = await adminService.updateDoctorRoster(
        req.user!.hospitalId!,
        req.params.id as string,
        parsed.data,
        req.user!.id
      );
      sendSuccess(res, updated, 'Doctor roster updated successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async getStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const staff = await adminService.getStaff(req.user!.hospitalId!);
      sendSuccess(res, staff, 'Staff accounts fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async createStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = createStaffSchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR', parsed.error.format());
        return;
      }
      const staff = await adminService.createStaff(
        req.user!.hospitalId!,
        parsed.data,
        req.user!.id
      );
      sendSuccess(res, staff, 'Staff account created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  public static async updateStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = updateStaffSchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR', parsed.error.format());
        return;
      }
      const updated = await adminService.updateStaff(
        req.user!.hospitalId!,
        req.params.id as string,
        parsed.data,
        req.user!.id
      );
      sendSuccess(res, updated, 'Staff account updated successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async updateCapacitySettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = capacitySettingsSchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR', parsed.error.format());
        return;
      }
      const result = await adminService.setCapacitySettings(
        req.user!.hospitalId!,
        parsed.data,
        req.user!.id
      );
      sendSuccess(res, result, 'Capacity settings updated successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { actorId, action, limit, offset } = req.query;
      const logs = await adminService.getAuditLogs(req.user!.hospitalId!, {
        actorId: actorId as string | undefined,
        action: action as string | undefined,
        limit: limit ? parseInt(limit as string, 10) : 50,
        offset: offset ? parseInt(offset as string, 10) : 0,
      });
      sendSuccess(res, logs, 'Audit logs retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async createDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = createDepartmentSchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR', parsed.error.format());
        return;
      }
      const department = await adminService.createDepartment(
        req.user!.hospitalId!,
        parsed.data,
        req.user!.id
      );
      sendSuccess(res, department, 'Department created successfully', 201);
    } catch (error) {
      next(error);
    }
  }
}

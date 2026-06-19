import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../services/admin.service';
import { sendSuccess } from '../utils/response';

const adminService = new AdminService();

export class AdminController {
  /**
   * GET /api/admin/command-center
   * Fetches real-time command center metrics.
   */
  public static async getCommandCenter(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await adminService.getCommandCenterData();
      sendSuccess(res, data, 'Command center metrics retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/analytics
   * Fetches historical analytical breakdown data.
   */
  public static async getAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await adminService.getAnalyticsData();
      sendSuccess(res, data, 'Analytical metrics retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/staff
   * Fetches staff list details.
   */
  public static async getStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const staffList = await adminService.getStaffList();
      sendSuccess(res, staffList, 'Staff registry list retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

import { Request, Response, NextFunction } from 'express';
import { CatalogService } from '../services/catalog.service';
import { sendSuccess, sendError } from '../utils/response';

const catalogService = new CatalogService();

export class CatalogController {
  public static async getHospitals(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await catalogService.getHospitals();
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  public static async getDepartments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const hospitalId = req.params.id as string;
      if (!hospitalId) {
        sendError(res, 'Hospital ID is required', 400);
        return;
      }
      const data = await catalogService.getDepartmentsByHospital(hospitalId);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  public static async getDoctors(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { hospitalId, departmentId } = req.query;
      const data = await catalogService.getDoctors(
        hospitalId as string | undefined,
        departmentId as string | undefined
      );
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }
}

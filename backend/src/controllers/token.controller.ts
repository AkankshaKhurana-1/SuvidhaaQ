import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../services/token.service';
import { sendSuccess, sendError } from '../utils/response';

const tokenService = new TokenService();

export class TokenController {
  /**
   * GET /api/token/print/:token_id
   * Generates token details for print receipts.
   */
  public static async printToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token_id = Number(req.params.token_id);
      if (isNaN(token_id)) {
        sendError(res, 'Token ID parameter must be an integer', 400);
        return;
      }

      const tokenDetails = await tokenService.printTokenDetails(token_id);
      sendSuccess(res, tokenDetails, 'Token printed successfully');
    } catch (error) {
      next(error);
    }
  }
}

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { sendError } from '../utils/response';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
  console.error('⚠️ [ErrorHandler] Uncaught error:', err);

  if (err instanceof ZodError) {
    sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR', err.format());
    return;
  }

  const statusCode = err.statusCode || (err.status && typeof err.status === 'number' ? err.status : 500);
  const message = err.message || 'Internal Server Error';
  const code = err.code || 'SERVER_ERROR';

  sendError(res, message, statusCode, code);
}

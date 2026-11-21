import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  messageOrStatus: string | number = 200,
  statusCode = 200
): void {
  let message: string | undefined = undefined;
  let status = 200;

  if (typeof messageOrStatus === 'string') {
    message = messageOrStatus;
    status = statusCode || 200;
  } else if (typeof messageOrStatus === 'number') {
    status = messageOrStatus;
  }

  const payload: ApiResponse<T> = {
    success: true,
    ...(message && { message }),
    data,
  };
  res.status(status).json(payload);
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 400,
  codeOrDetails: any = 'BAD_REQUEST',
  details?: any
): void {
  let code = 'BAD_REQUEST';
  let finalDetails = details;

  if (typeof codeOrDetails === 'string') {
    code = codeOrDetails;
  } else if (typeof codeOrDetails === 'object' && codeOrDetails !== null) {
    finalDetails = codeOrDetails;
  }

  const payload: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      details: finalDetails,
    },
  };
  res.status(statusCode).json(payload);
}

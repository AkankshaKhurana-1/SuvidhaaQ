import { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  details?: unknown;
}

export const sendSuccess = <T>(
  res: Response,
  data: T | null = null,
  message = 'Request successful',
  statusCode = 200
): void => {
  const responsePayload: ApiResponse<T> = {
    success: true,
    message,
  };

  if (data !== null) {
    responsePayload.data = data;
  }

  res.status(statusCode).json(responsePayload);
};

export const sendError = (
  res: Response,
  message = 'An error occurred',
  statusCode = 400,
  details: unknown = null
): void => {
  const responsePayload: ApiResponse = {
    success: false,
    message,
  };

  if (details !== null) {
    responsePayload.details = details;
  }

  res.status(statusCode).json(responsePayload);
};

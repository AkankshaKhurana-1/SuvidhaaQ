import rateLimit from 'express-rate-limit';
import { sendError } from '../utils/response';

export const loginRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: process.env.NODE_ENV === 'test' ? 1000 : 10, // 10 per min in prod, permissive in test
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    sendError(res, 'Too many login attempts. Please try again after 1 minute.', 429, 'TOO_MANY_REQUESTS');
  },
});

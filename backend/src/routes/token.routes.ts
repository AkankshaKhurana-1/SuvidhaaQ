import { Router } from 'express';
import { TokenController } from '../controllers/token.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Apply auth middleware to protect these routes
router.use(authMiddleware);

// Define endpoints according to contract
router.get('/print/:token_id', TokenController.printToken);

export default router;

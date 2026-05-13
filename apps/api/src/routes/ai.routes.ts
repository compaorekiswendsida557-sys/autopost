import { Router } from 'express';
import * as ctrl from '../controllers/ai.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { checkQuota } from '../middleware/plan.middleware';

const router = Router();

router.post('/generate', authMiddleware, checkQuota('ai_per_month'), ctrl.generateValidation, ctrl.generate);
router.get('/history', authMiddleware, ctrl.getHistory);

export default router;

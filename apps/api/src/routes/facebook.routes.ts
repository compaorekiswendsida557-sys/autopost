import { Router } from 'express';
import * as ctrl from '../controllers/facebook.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { checkPageQuota } from '../middleware/plan.middleware';

const router = Router();

router.get('/auth-url', authMiddleware, ctrl.getAuthUrl);
router.get('/callback', ctrl.handleCallback);
router.get('/pages/available', authMiddleware, ctrl.getAvailablePages);
router.get('/pages', authMiddleware, ctrl.getConnectedPages);
router.post('/pages/connect', authMiddleware, checkPageQuota(), ctrl.connectPage);
router.delete('/pages/:id', authMiddleware, ctrl.disconnectPage);
router.get('/pages/:pageId/profile', authMiddleware, ctrl.getPageProfile);
router.post('/pages/:pageId/profile', authMiddleware, ctrl.upsertPageProfile);
router.put('/pages/:pageId/profile', authMiddleware, ctrl.upsertPageProfile);

export default router;

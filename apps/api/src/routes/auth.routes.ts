import { Router } from 'express';
import * as ctrl from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', ctrl.registerValidation, ctrl.register);
router.post('/login', ctrl.loginValidation, ctrl.login);
router.post('/refresh', ctrl.refresh);
router.post('/logout', authMiddleware, ctrl.logout);
router.get('/me', authMiddleware, ctrl.getMe);
router.put('/profile', authMiddleware, ctrl.updateProfile);

export default router;

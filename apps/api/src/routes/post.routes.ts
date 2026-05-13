import { Router } from 'express';
import * as ctrl from '../controllers/post.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { checkQuota } from '../middleware/plan.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', ctrl.listPosts);
router.post('/', checkQuota('posts_per_month'), ctrl.createPost);
router.post('/bulk-schedule', checkQuota('posts_per_month'), ctrl.bulkSchedule);
router.get('/:id', ctrl.getPost);
router.put('/:id', ctrl.updatePost);
router.delete('/:id', ctrl.deletePost);
router.post('/:id/validate', ctrl.validatePost);
router.post('/:id/reject', ctrl.rejectPost);
router.post('/:id/schedule', ctrl.schedulePost);
router.post('/:id/publish-now', ctrl.publishNow);

export default router;

import { Router, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../types';

const router = Router();
router.use(authMiddleware);

router.get('/overview', async (req: AuthRequest, res: Response): Promise<void> => {
  const { pageId, period = '30' } = req.query;
  const since = new Date(Date.now() - Number(period) * 24 * 3600 * 1000);

  const where: Record<string, unknown> = { userId: req.userId! };
  if (pageId) where.pageId = pageId;

  const [total, published, scheduled, drafts] = await Promise.all([
    prisma.post.count({ where }),
    prisma.post.count({ where: { ...where, status: 'PUBLISHED', publishedAt: { gte: since } } }),
    prisma.post.count({ where: { ...where, status: 'SCHEDULED' } }),
    prisma.post.count({ where: { ...where, status: 'DRAFT' } }),
  ]);

  const recentPosts = await prisma.post.findMany({
    where: { ...where, status: 'PUBLISHED', publishedAt: { gte: since } },
    include: { analytics: { orderBy: { fetchedAt: 'desc' }, take: 1 } },
    orderBy: { publishedAt: 'desc' },
    take: 10,
  });

  res.json({ total, published, scheduled, drafts, recentPosts });
});

router.get('/posts', async (req: AuthRequest, res: Response): Promise<void> => {
  const { pageId } = req.query;
  const where: Record<string, unknown> = { userId: req.userId!, status: 'PUBLISHED' };
  if (pageId) where.pageId = pageId;

  const posts = await prisma.post.findMany({
    where,
    include: {
      analytics: { orderBy: { fetchedAt: 'desc' }, take: 1 },
      page: { select: { pageName: true } },
    },
    orderBy: { publishedAt: 'desc' },
    take: 50,
  });

  res.json(posts);
});

export default router;

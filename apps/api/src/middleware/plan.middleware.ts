import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';

const PLAN_ORDER: Record<string, number> = {
  FREE: 0,
  STARTER: 1,
  PRO: 2,
  AGENCY: 3,
};

const PLAN_LIMITS: Record<string, Record<string, number>> = {
  FREE:    { posts_per_month: 100, ai_per_month: 200, pages: 1 },
  STARTER: { posts_per_month: 50,  ai_per_month: 100, pages: 3 },
  PRO:     { posts_per_month: 300, ai_per_month: 500, pages: 10 },
  AGENCY:  { posts_per_month: 9999, ai_per_month: 9999, pages: 50 },
};

export function requirePlan(minPlan: string) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const userPlan = req.userPlan || 'FREE';
    if ((PLAN_ORDER[userPlan] ?? 0) < (PLAN_ORDER[minPlan] ?? 0)) {
      res.status(403).json({
        error: 'upgrade_required',
        message: `Cette fonctionnalité nécessite le plan ${minPlan} ou supérieur`,
        required_plan: minPlan,
      });
      return;
    }
    next();
  };
}

export function checkQuota(resource: 'posts_per_month' | 'ai_per_month') {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.userId) { res.status(401).json({ error: 'Non authentifié' }); return; }

    const plan = req.userPlan || 'FREE';
    const limit = PLAN_LIMITS[plan]?.[resource] ?? 0;
    const month = new Date().toISOString().slice(0, 7);
    const key = `quota:${req.userId}:${resource}:${month}`;

    const current = await redis.incr(key);
    if (current === 1) await redis.expire(key, 32 * 24 * 3600);

    if (current > limit) {
      res.status(429).json({
        error: 'quota_exceeded',
        message: `Limite mensuelle atteinte (${limit} ${resource}). Passez à un plan supérieur.`,
        limit,
        current: current - 1,
      });
      return;
    }
    next();
  };
}

export function checkPageQuota() {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.userId) { res.status(401).json({ error: 'Non authentifié' }); return; }
    const plan = req.userPlan || 'FREE';
    const limit = PLAN_LIMITS[plan]?.pages ?? 1;
    const count = await prisma.facebookPage.count({ where: { userId: req.userId, isActive: true } });
    if (count >= limit) {
      res.status(429).json({
        error: 'page_limit_reached',
        message: `Vous avez atteint la limite de ${limit} page(s) pour votre plan.`,
      });
      return;
    }
    next();
  };
}

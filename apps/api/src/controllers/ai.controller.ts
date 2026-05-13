import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthRequest } from '../types';
import { generatePost } from '../services/ai.service';
import { prisma } from '../lib/prisma';

export const generateValidation = [
  body('pageId').isUUID(),
  body('theme').trim().isLength({ min: 3 }),
  body('tone').isIn(['PROFESSIONAL', 'SELLER', 'MOTIVATION', 'FUNNY', 'EDUCATIONAL']),
  body('length').isIn(['SHORT', 'MEDIUM', 'LONG']),
  body('objective').isIn(['AWARENESS', 'ENGAGEMENT', 'CONVERSION', 'TRAFFIC']),
  body('variantsCount').optional().isInt({ min: 1, max: 10 }),
];

export async function generate(req: AuthRequest, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const variants = await generatePost(req.body, req.userId!);
    res.json({ variants });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur génération IA';
    if (message === 'Profil business non configuré') {
      res.status(400).json({ error: 'Veuillez d\'abord configurer le profil business de votre page' });
    } else {
      res.status(500).json({ error: message });
    }
  }
}

export async function getHistory(req: AuthRequest, res: Response): Promise<void> {
  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [generations, total] = await Promise.all([
    prisma.aiGeneration.findMany({
      where: { userId: req.userId! },
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: { page: { select: { pageName: true } } },
    }),
    prisma.aiGeneration.count({ where: { userId: req.userId! } }),
  ]);

  res.json({ generations, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
}

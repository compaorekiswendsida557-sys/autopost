import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import * as authService from '../services/auth.service';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../types';

export const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Mot de passe minimum 8 caractères'),
  body('fullName').optional().trim().isLength({ min: 2 }),
];

export const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

export async function register(req: Request, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const { email, password, fullName } = req.body;
    const user = await authService.registerUser(email, password, fullName);
    const tokens = authService.generateTokens({ id: user.id, email: user.email, plan: user.plan });

    res.status(201).json({
      message: 'Compte créé avec succès',
      user,
      ...tokens,
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'EMAIL_EXISTS') {
      res.status(409).json({ error: 'Cet email est déjà utilisé' });
    } else {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const { email, password } = req.body;
    const result = await authService.loginUser(email, password);
    res.json(result);
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'INVALID_CREDENTIALS') {
      res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    } else {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const { refreshToken } = req.body;
  if (!refreshToken) { res.status(400).json({ error: 'Refresh token manquant' }); return; }

  try {
    const tokens = await authService.refreshAccessToken(refreshToken);
    res.json(tokens);
  } catch {
    res.status(401).json({ error: 'Refresh token invalide' });
  }
}

export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: {
      id: true, email: true, fullName: true, avatarUrl: true,
      plan: true, planExpiresAt: true, createdAt: true,
      facebookPages: {
        where: { isActive: true },
        select: { id: true, pageName: true, pictureUrl: true, pageId: true },
      },
    },
  });
  if (!user) { res.status(404).json({ error: 'Utilisateur introuvable' }); return; }
  res.json(user);
}

export async function updateProfile(req: AuthRequest, res: Response): Promise<void> {
  const { fullName, avatarUrl } = req.body;
  const user = await prisma.user.update({
    where: { id: req.userId },
    data: { fullName, avatarUrl },
    select: { id: true, email: true, fullName: true, avatarUrl: true, plan: true },
  });
  res.json(user);
}

export async function logout(req: AuthRequest, res: Response): Promise<void> {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  }
  res.json({ message: 'Déconnecté avec succès' });
}

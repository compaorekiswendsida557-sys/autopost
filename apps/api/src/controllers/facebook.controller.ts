import { Response } from 'express';
import { AuthRequest } from '../types';
import * as fbService from '../services/facebook.service';
import { prisma } from '../lib/prisma';

export async function getAuthUrl(req: AuthRequest, res: Response): Promise<void> {
  const url = fbService.getFacebookAuthUrl(req.userId!);
  res.json({ url });
}

export async function handleCallback(req: AuthRequest, res: Response): Promise<void> {
  const { code, state } = req.query as { code: string; state: string };
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  try {
    const { userId } = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));
    const { connection } = await fbService.handleFacebookCallback(code, userId);

    // Auto-connect every admin page found
    const availablePages = await fbService.getUserPages(connection.id);
    await Promise.all(
      availablePages.map((p) => fbService.connectPage(userId, connection.id, p).catch(() => {}))
    );

    res.redirect(`${frontendUrl}/oauth/success?status=connected&count=${availablePages.length}`);
  } catch (err) {
    console.error('Facebook callback error:', err);
    res.redirect(`${frontendUrl}/oauth/success?status=error`);
  }
}

export async function getAvailablePages(req: AuthRequest, res: Response): Promise<void> {
  const connections = await prisma.facebookConnection.findMany({
    where: { userId: req.userId!, isActive: true },
  });

  if (connections.length === 0) {
    res.json({ pages: [] });
    return;
  }

  const allPages = await Promise.all(
    connections.map((conn) => fbService.getUserPages(conn.id).catch(() => []))
  );

  res.json({ pages: allPages.flat() });
}

export async function connectPage(req: AuthRequest, res: Response): Promise<void> {
  const { pageData, connectionId } = req.body;
  if (!pageData || !connectionId) {
    res.status(400).json({ error: 'Données page manquantes' });
    return;
  }

  try {
    const page = await fbService.connectPage(req.userId!, connectionId, pageData);
    res.status(201).json(page);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la connexion de la page' });
  }
}

export async function getConnectedPages(req: AuthRequest, res: Response): Promise<void> {
  const pages = await prisma.facebookPage.findMany({
    where: { userId: req.userId!, isActive: true },
    include: {
      businessProfile: true,
      _count: { select: { posts: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(pages);
}

export async function disconnectPage(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const page = await prisma.facebookPage.findFirst({ where: { id, userId: req.userId! } });
  if (!page) { res.status(404).json({ error: 'Page introuvable' }); return; }

  await prisma.facebookPage.update({ where: { id }, data: { isActive: false } });
  res.json({ message: 'Page déconnectée' });
}

export async function getPageProfile(req: AuthRequest, res: Response): Promise<void> {
  const { pageId } = req.params;
  const page = await prisma.facebookPage.findFirst({
    where: { id: pageId, userId: req.userId! },
    include: { businessProfile: true },
  });
  if (!page) { res.status(404).json({ error: 'Page introuvable' }); return; }
  res.json(page.businessProfile);
}

export async function upsertPageProfile(req: AuthRequest, res: Response): Promise<void> {
  const { pageId } = req.params;
  const page = await prisma.facebookPage.findFirst({ where: { id: pageId, userId: req.userId! } });
  if (!page) { res.status(404).json({ error: 'Page introuvable' }); return; }

  const {
    businessName, activity, mainTheme, tone, slogan,
    whatsapp, phone, email, address, hashtags, language,
  } = req.body;

  const profile = await prisma.businessProfile.upsert({
    where: { pageId },
    create: { pageId, businessName, activity, mainTheme, tone, slogan, whatsapp, phone, email, address, hashtags: hashtags || [], language: language || 'fr' },
    update: { businessName, activity, mainTheme, tone, slogan, whatsapp, phone, email, address, hashtags: hashtags || [], language: language || 'fr' },
  });

  res.json(profile);
}

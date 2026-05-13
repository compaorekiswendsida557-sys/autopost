import { Response } from 'express';
import { AuthRequest } from '../types';
import * as postService from '../services/post.service';

export async function createPost(req: AuthRequest, res: Response): Promise<void> {
  try {
    const post = await postService.createDraftPost({ ...req.body, userId: req.userId! });
    res.status(201).json(post);
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Erreur serveur' });
  }
}

export async function listPosts(req: AuthRequest, res: Response): Promise<void> {
  const { status, pageId, page, limit } = req.query;
  const result = await postService.getUserPosts(req.userId!, {
    status: status as string,
    pageId: pageId as string,
    page: Number(page) || 1,
    limit: Number(limit) || 20,
  });
  res.json(result);
}

export async function getPost(req: AuthRequest, res: Response): Promise<void> {
  try {
    const post = await postService.getPostById(req.params.id, req.userId!);
    res.json(post);
  } catch {
    res.status(404).json({ error: 'Post introuvable' });
  }
}

export async function updatePost(req: AuthRequest, res: Response): Promise<void> {
  try {
    const post = await postService.updatePost(req.params.id, req.userId!, req.body);
    res.json(post);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur';
    res.status(msg === 'POST_NOT_FOUND' ? 404 : 400).json({ error: msg });
  }
}

export async function deletePost(req: AuthRequest, res: Response): Promise<void> {
  try {
    await postService.deletePost(req.params.id, req.userId!);
    res.json({ message: 'Post supprimé' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur';
    res.status(msg === 'POST_NOT_FOUND' ? 404 : 400).json({ error: msg });
  }
}

export async function validatePost(req: AuthRequest, res: Response): Promise<void> {
  try {
    const post = await postService.validatePost(req.params.id, req.userId!);
    res.json(post);
  } catch (err: unknown) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Erreur' });
  }
}

export async function rejectPost(req: AuthRequest, res: Response): Promise<void> {
  try {
    const post = await postService.rejectPost(req.params.id, req.userId!, req.body.reason);
    res.json(post);
  } catch (err: unknown) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Erreur' });
  }
}

export async function schedulePost(req: AuthRequest, res: Response): Promise<void> {
  const { scheduledFor } = req.body;
  if (!scheduledFor) { res.status(400).json({ error: 'Date de programmation manquante' }); return; }

  try {
    const post = await postService.schedulePostForPublishing(
      req.params.id,
      req.userId!,
      new Date(scheduledFor)
    );
    res.json(post);
  } catch (err: unknown) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Erreur' });
  }
}

export async function publishNow(req: AuthRequest, res: Response): Promise<void> {
  try {
    const post = await postService.publishPostNow(req.params.id, req.userId!);
    res.json(post);
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Erreur publication' });
  }
}

export async function bulkSchedule(req: AuthRequest, res: Response): Promise<void> {
  const { pageId, posts, startDate, times } = req.body;
  if (!pageId || !posts?.length || !startDate || !times?.length) {
    res.status(400).json({ error: 'Données manquantes (pageId, posts, startDate, times)' });
    return;
  }
  try {
    const result = await postService.bulkSchedulePosts(req.userId!, { pageId, posts, startDate, times });
    res.status(201).json(result);
  } catch (err: unknown) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Erreur programmation en masse' });
  }
}

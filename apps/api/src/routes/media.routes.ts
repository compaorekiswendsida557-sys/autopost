import { Router, Request, Response } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { authMiddleware } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../types';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

const router = Router();
router.use(authMiddleware);

router.post('/upload', upload.single('file'), async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.file) { res.status(400).json({ error: 'Fichier manquant' }); return; }

  try {
    const base64 = req.file.buffer.toString('base64');
    const dataUri = `data:${req.file.mimetype};base64,${base64}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: `autopost/${req.userId}`,
      resource_type: 'auto',
    });

    const media = await prisma.mediaFile.create({
      data: {
        userId: req.userId!,
        pageId: req.body.pageId || null,
        cloudinaryId: result.public_id,
        url: result.secure_url,
        thumbnailUrl: result.resource_type === 'video'
          ? cloudinary.url(result.public_id, { resource_type: 'video', format: 'jpg', transformation: [{ width: 400, crop: 'scale' }] })
          : result.secure_url,
        fileType: result.resource_type,
        fileSizeKb: Math.round(result.bytes / 1024),
        width: result.width,
        height: result.height,
        durationSec: result.duration ? Math.round(result.duration) : null,
      },
    });

    res.status(201).json(media);
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Erreur upload' });
  }
});

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { pageId } = req.query;
  const files = await prisma.mediaFile.findMany({
    where: { userId: req.userId!, ...(pageId ? { pageId: pageId as string } : {}) },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json(files);
});

router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const file = await prisma.mediaFile.findFirst({ where: { id: req.params.id, userId: req.userId! } });
  if (!file) { res.status(404).json({ error: 'Fichier introuvable' }); return; }

  if (file.cloudinaryId) {
    await cloudinary.uploader.destroy(file.cloudinaryId, { resource_type: file.fileType as 'image' | 'video' | 'raw' }).catch(() => {});
  }
  await prisma.mediaFile.delete({ where: { id: file.id } });
  res.json({ message: 'Fichier supprimé' });
});

export default router;

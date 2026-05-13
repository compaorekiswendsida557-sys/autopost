import { Worker, Job } from 'bullmq';
import { prisma } from '../lib/prisma';
import { publishToFacebook } from '../services/facebook.service';
import { PostStatus } from '@prisma/client';

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
};

export function startPostPublisherWorker() {
  const worker = new Worker(
    'post-publishing',
    async (job: Job) => {
      const { postId } = job.data;

      const post = await prisma.post.findUnique({ where: { id: postId } });
      if (!post) { console.log(`Post ${postId} introuvable, job annulé`); return; }
      if (post.status !== PostStatus.SCHEDULED) {
        console.log(`Post ${postId} n'est plus en statut SCHEDULED, job annulé`);
        return;
      }

      await prisma.post.update({ where: { id: postId }, data: { status: PostStatus.PUBLISHING } });

      try {
        const fbPostId = await publishToFacebook(post.pageId, post.content, post.mediaUrls);
        await prisma.post.update({
          where: { id: postId },
          data: { status: PostStatus.PUBLISHED, fbPostId, publishedAt: new Date() },
        });
        console.log(`Post ${postId} publié avec succès sur Facebook (${fbPostId})`);
      } catch (err) {
        await prisma.post.update({ where: { id: postId }, data: { status: PostStatus.FAILED } });
        console.error(`Échec publication post ${postId}:`, err);
        throw err;
      }
    },
    {
      connection,
      concurrency: 5,
    }
  );

  worker.on('completed', (job) => console.log(`Job ${job.id} terminé`));
  worker.on('failed', (job, err) => console.error(`Job ${job?.id} échoué:`, err.message));

  return worker;
}

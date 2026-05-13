import { Queue, Worker, Job } from 'bullmq';
import { redis } from './redis';

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
};

export const postQueue = new Queue('post-publishing', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { age: 7 * 24 * 3600 },
    removeOnFail: { age: 30 * 24 * 3600 },
  },
});

export const analyticsQueue = new Queue('analytics-sync', {
  connection,
  defaultJobOptions: { attempts: 2, backoff: { type: 'fixed', delay: 10000 } },
});

export async function schedulePost(postId: string, scheduledFor: Date): Promise<void> {
  const delay = scheduledFor.getTime() - Date.now();
  if (delay < 0) throw new Error('La date de publication doit être dans le futur');

  await postQueue.add(
    'publish_post',
    { postId },
    { delay, jobId: `post-${postId}` }
  );
}

export async function cancelScheduledPost(postId: string): Promise<void> {
  const job = await postQueue.getJob(`post-${postId}`);
  if (job) await job.remove();
}

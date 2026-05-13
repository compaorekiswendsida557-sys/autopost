import { prisma } from '../lib/prisma';
import { schedulePost, cancelScheduledPost } from '../lib/queue';
import { publishToFacebook } from './facebook.service';
import { PostStatus, MediaType, Objective, Tone, PostLength } from '@prisma/client';

export async function createDraftPost(data: {
  userId: string;
  pageId: string;
  content: string;
  contentVariants?: object;
  mediaUrls?: string[];
  mediaType?: string;
  objective?: string;
  toneUsed?: string;
  lengthUsed?: string;
  aiPromptUsed?: string;
  scheduledFor?: Date;
}) {
  return prisma.post.create({
    data: {
      userId: data.userId,
      pageId: data.pageId,
      content: data.content,
      contentVariants: data.contentVariants as never,
      status: PostStatus.DRAFT,
      mediaUrls: data.mediaUrls || [],
      mediaType: data.mediaType as MediaType | undefined,
      objective: data.objective as Objective | undefined,
      toneUsed: data.toneUsed as Tone | undefined,
      lengthUsed: data.lengthUsed as PostLength | undefined,
      aiPromptUsed: data.aiPromptUsed,
      scheduledFor: data.scheduledFor,
    },
    include: { page: { select: { pageName: true, pictureUrl: true } } },
  });
}

export async function getUserPosts(userId: string, filters: {
  status?: string;
  pageId?: string;
  page?: number;
  limit?: number;
}) {
  const { page = 1, limit = 20, status, pageId } = filters;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { userId };
  if (status) where.status = status;
  if (pageId) where.pageId = pageId;

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        page: { select: { pageName: true, pictureUrl: true } },
        analytics: { orderBy: { fetchedAt: 'desc' }, take: 1 },
      },
    }),
    prisma.post.count({ where }),
  ]);

  return { posts, total, page, pages: Math.ceil(total / limit) };
}

export async function getPostById(id: string, userId: string) {
  const post = await prisma.post.findFirst({
    where: { id, userId },
    include: {
      page: { select: { pageName: true, pictureUrl: true, pageId: true } },
      analytics: { orderBy: { fetchedAt: 'desc' }, take: 1 },
    },
  });
  if (!post) throw new Error('POST_NOT_FOUND');
  return post;
}

export async function updatePost(id: string, userId: string, data: {
  content?: string;
  mediaUrls?: string[];
  scheduledFor?: Date | null;
}) {
  const post = await prisma.post.findFirst({ where: { id, userId } });
  if (!post) throw new Error('POST_NOT_FOUND');
  if (([PostStatus.PUBLISHED, PostStatus.PUBLISHING] as PostStatus[]).includes(post.status)) {
    throw new Error('Cannot edit a published post');
  }

  return prisma.post.update({ where: { id }, data });
}

export async function validatePost(id: string, userId: string) {
  const post = await prisma.post.findFirst({ where: { id, userId } });
  if (!post) throw new Error('POST_NOT_FOUND');

  return prisma.post.update({
    where: { id },
    data: { status: PostStatus.VALIDATED },
  });
}

export async function rejectPost(id: string, userId: string, reason?: string) {
  const post = await prisma.post.findFirst({ where: { id, userId } });
  if (!post) throw new Error('POST_NOT_FOUND');

  await cancelScheduledPost(id).catch(() => {});

  return prisma.post.update({
    where: { id },
    data: { status: PostStatus.REJECTED, aiPromptUsed: reason || post.aiPromptUsed },
  });
}

export async function schedulePostForPublishing(id: string, userId: string, scheduledFor: Date) {
  const post = await prisma.post.findFirst({ where: { id, userId } });
  if (!post) throw new Error('POST_NOT_FOUND');
  if (scheduledFor <= new Date()) throw new Error('La date doit être dans le futur');

  await prisma.post.update({
    where: { id },
    data: { status: PostStatus.SCHEDULED, scheduledFor },
  });

  await schedulePost(id, scheduledFor);

  return prisma.post.findUnique({ where: { id } });
}

export async function publishPostNow(id: string, userId: string) {
  const post = await prisma.post.findFirst({ where: { id, userId } });
  if (!post) throw new Error('POST_NOT_FOUND');

  await prisma.post.update({ where: { id }, data: { status: PostStatus.PUBLISHING } });

  try {
    const fbPostId = await publishToFacebook(post.pageId, post.content, post.mediaUrls);
    return prisma.post.update({
      where: { id },
      data: {
        status: PostStatus.PUBLISHED,
        fbPostId,
        publishedAt: new Date(),
      },
    });
  } catch (err) {
    await prisma.post.update({ where: { id }, data: { status: PostStatus.FAILED } });
    throw err;
  }
}

export async function deletePost(id: string, userId: string) {
  const post = await prisma.post.findFirst({ where: { id, userId } });
  if (!post) throw new Error('POST_NOT_FOUND');
  if (post.status === PostStatus.PUBLISHED) throw new Error('Cannot delete a published post');

  await cancelScheduledPost(id).catch(() => {});
  await prisma.post.delete({ where: { id } });
}

function generateTimeSlots(startDate: string, times: string[], total: number): Date[] {
  const slots: Date[] = [];
  const now = new Date();
  let day = new Date(startDate + 'T00:00:00');

  while (slots.length < total) {
    const sorted = [...times].sort();
    for (const time of sorted) {
      if (slots.length >= total) break;
      const [h, m] = time.split(':').map(Number);
      const slot = new Date(day);
      slot.setHours(h, m, 0, 0);
      if (slot > now) slots.push(slot);
    }
    day = new Date(day.getTime() + 86_400_000);
  }
  return slots;
}

export async function bulkSchedulePosts(
  userId: string,
  data: {
    pageId: string;
    posts: Array<{
      content: string;
      richContent?: string;
      imageUrl?: string;
      contentVariants?: object;
      toneUsed?: string;
      lengthUsed?: string;
      objective?: string;
      aiPromptUsed?: string;
    }>;
    startDate: string;
    times: string[];
  }
) {
  const slots = generateTimeSlots(data.startDate, data.times, data.posts.length);

  const created = [];
  for (let i = 0; i < data.posts.length; i++) {
    const p = data.posts[i];
    const slot = slots[i];
    const post = await prisma.post.create({
      data: {
        userId,
        pageId: data.pageId,
        content: p.content,
        contentVariants: (p.richContent ? { richHtml: p.richContent, ...(p.contentVariants || {}) } : p.contentVariants) as never,
        mediaUrls: p.imageUrl ? [p.imageUrl] : [],
        status: PostStatus.SCHEDULED,
        scheduledFor: slot,
        toneUsed: p.toneUsed as Tone | undefined,
        lengthUsed: p.lengthUsed as PostLength | undefined,
        objective: p.objective as Objective | undefined,
        aiPromptUsed: p.aiPromptUsed,
      },
    });
    await schedulePost(post.id, slot);
    created.push(post);
  }
  return { posts: created, count: created.length };
}

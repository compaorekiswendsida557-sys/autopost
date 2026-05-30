import axios from 'axios';
import { prisma } from '../lib/prisma';
import { encryptToken, decryptToken } from '../lib/crypto';
import { FacebookPageData } from '../types';

const META_BASE = 'https://graph.facebook.com/v21.0';
const APP_ID = process.env.META_APP_ID!;
const APP_SECRET = process.env.META_APP_SECRET!;
const REDIRECT_URI = `${process.env.API_URL}/api/facebook/callback`;

export function getFacebookAuthUrl(userId: string): string {
  const state = Buffer.from(JSON.stringify({ userId })).toString('base64');
  const scopes = [
    'pages_manage_posts',
    'pages_read_engagement',
    'pages_show_list',
    'pages_manage_metadata',
  ].join(',');

  return `https://www.facebook.com/v21.0/dialog/oauth?client_id=${APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${scopes}&state=${state}&response_type=code`;
}

export async function handleFacebookCallback(code: string, userId: string) {
  const tokenRes = await axios.get(`${META_BASE}/oauth/access_token`, {
    params: { client_id: APP_ID, client_secret: APP_SECRET, redirect_uri: REDIRECT_URI, code },
  });

  const userAccessToken: string = tokenRes.data.access_token;

  const longTokenRes = await axios.get(`${META_BASE}/oauth/access_token`, {
    params: {
      grant_type: 'fb_exchange_token',
      client_id: APP_ID,
      client_secret: APP_SECRET,
      fb_exchange_token: userAccessToken,
    },
  });

  const longLivedToken: string = longTokenRes.data.access_token;
  const expiresIn: number = longTokenRes.data.expires_in;

  const meRes = await axios.get(`${META_BASE}/me`, { params: { access_token: longLivedToken } });
  const fbUserId: string = meRes.data.id;

  const connection = await prisma.facebookConnection.upsert({
    where: { id: `${userId}-${fbUserId}` },
    create: {
      id: `${userId}-${fbUserId}`,
      userId,
      fbUserId,
      accessToken: encryptToken(longLivedToken),
      tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
    },
    update: {
      accessToken: encryptToken(longLivedToken),
      tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
      isActive: true,
    },
  });

  return { connection, fbUserId };
}

export async function getUserPages(connectionId: string): Promise<FacebookPageData[]> {
  const connection = await prisma.facebookConnection.findUnique({ where: { id: connectionId } });
  if (!connection) throw new Error('Connexion introuvable');

  const token = decryptToken(connection.accessToken);
  const pagesRes = await axios.get(`${META_BASE}/me/accounts`, {
    params: { access_token: token, fields: 'id,name,access_token,category,followers_count,picture' },
  });

  return pagesRes.data.data as FacebookPageData[];
}

export async function connectPage(userId: string, connectionId: string, pageData: FacebookPageData) {
  const page = await prisma.facebookPage.upsert({
    where: { userId_pageId: { userId, pageId: pageData.id } },
    create: {
      userId,
      connectionId,
      pageId: pageData.id,
      pageName: pageData.name,
      pageAccessToken: encryptToken(pageData.access_token),
      category: pageData.category,
      followersCount: pageData.followers_count || 0,
      pictureUrl: pageData.picture?.data?.url,
    },
    update: {
      pageAccessToken: encryptToken(pageData.access_token),
      pageName: pageData.name,
      followersCount: pageData.followers_count || 0,
      pictureUrl: pageData.picture?.data?.url,
      isActive: true,
    },
  });

  await prisma.businessProfile.upsert({
    where: { pageId: page.id },
    create: { pageId: page.id, businessName: pageData.name },
    update: {},
  });

  return page;
}

export async function importFacebookPosts(userId: string, pageDbId: string) {
  const page = await prisma.facebookPage.findFirst({ where: { id: pageDbId, userId } });
  if (!page) throw new Error('Page introuvable');

  const pageToken = decryptToken(page.pageAccessToken);

  let fbPosts: { message?: string; created_time: string }[] = [];

  try {
    // Paginate to fetch up to 500 posts (5 pages × 100)
    let nextUrl: string | null = `${META_BASE}/${page.pageId}/posts`;
    let params: Record<string, string> | undefined = { access_token: pageToken, fields: 'message,created_time', limit: '100' };
    let pageCount = 0;

    while (nextUrl && pageCount < 5) {
      const res: { data: { data?: { message?: string; created_time: string }[]; paging?: { next?: string } } } =
        await axios.get(nextUrl, { params });
      fbPosts = fbPosts.concat(res.data.data || []);
      nextUrl = res.data.paging?.next ?? null;
      params = undefined;
      pageCount++;
    }
  } catch (err: unknown) {
    const fbError = (err as { response?: { data?: { error?: { message?: string; code?: number } } } })
      ?.response?.data?.error;
    if (fbError?.code === 190) throw new Error('TOKEN_EXPIRED');
    if (fbError?.code === 10 || fbError?.code === 200) throw new Error('PERMISSION_MISSING');
    throw new Error(fbError?.message || 'Erreur Facebook API');
  }

  const postsWithText = fbPosts.filter(p => p.message && p.message.trim().length > 20);

  let imported = 0;
  for (const fbPost of postsWithText) {
    const existing = await prisma.post.findFirst({
      where: { pageId: pageDbId, content: fbPost.message!, status: 'PUBLISHED' },
    });
    if (!existing) {
      await prisma.post.create({
        data: {
          userId,
          pageId: pageDbId,
          content: fbPost.message!,
          status: 'PUBLISHED',
          publishedAt: new Date(fbPost.created_time),
        },
      });
      imported++;
    }
  }

  return { total: postsWithText.length, imported };
}

export async function connectWithManualToken(userId: string, userAccessToken: string) {
  // Get user ID
  const meRes = await axios.get(`${META_BASE}/me`, {
    params: { access_token: userAccessToken },
  });
  const fbUserId: string = meRes.data.id;

  // Save connection
  const connection = await prisma.facebookConnection.upsert({
    where: { id: `${userId}-${fbUserId}` },
    create: {
      id: `${userId}-${fbUserId}`,
      userId,
      fbUserId,
      accessToken: encryptToken(userAccessToken),
      tokenExpiresAt: new Date(Date.now() + 60 * 24 * 3600 * 1000), // 60 days estimate
    },
    update: {
      accessToken: encryptToken(userAccessToken),
      tokenExpiresAt: new Date(Date.now() + 60 * 24 * 3600 * 1000),
      isActive: true,
    },
  });

  // Fetch and connect all pages
  const pagesRes = await axios.get(`${META_BASE}/me/accounts`, {
    params: { access_token: userAccessToken, fields: 'id,name,access_token,category,followers_count,picture' },
  });
  const pages: FacebookPageData[] = pagesRes.data.data || [];

  await Promise.all(
    pages.map((p) => connectPage(userId, connection.id, p).catch(() => {}))
  );

  return { count: pages.length, pages };
}

export async function uploadPhotoToFacebook(
  pageDbId: string,
  buffer: Buffer,
  mimetype: string
): Promise<string> {
  const page = await prisma.facebookPage.findUnique({ where: { id: pageDbId } });
  if (!page) throw new Error('Page introuvable');
  const pageToken = decryptToken(page.pageAccessToken);

  // Build multipart/form-data manually to avoid relying on browser globals
  const boundary = `----AutoPostBoundary${Date.now()}`;
  const CRLF = '\r\n';

  const head = (
    `--${boundary}${CRLF}` +
    `Content-Disposition: form-data; name="source"; filename="photo.jpg"${CRLF}` +
    `Content-Type: ${mimetype}${CRLF}${CRLF}`
  );
  const textFields = (
    `${CRLF}--${boundary}${CRLF}` +
    `Content-Disposition: form-data; name="published"${CRLF}${CRLF}false${CRLF}` +
    `--${boundary}${CRLF}` +
    `Content-Disposition: form-data; name="access_token"${CRLF}${CRLF}${pageToken}${CRLF}` +
    `--${boundary}--${CRLF}`
  );

  const body = Buffer.concat([
    Buffer.from(head, 'utf8'),
    buffer,
    Buffer.from(textFields, 'utf8'),
  ]);

  const res = await axios.post(`${META_BASE}/${page.pageId}/photos`, body, {
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': body.length,
    },
  });
  return res.data.id as string;
}

export async function publishToFacebook(
  pageDbId: string,
  content: string,
  mediaUrls: string[] = []
): Promise<string> {
  const page = await prisma.facebookPage.findUnique({ where: { id: pageDbId } });
  if (!page) throw new Error('Page introuvable');

  const pageToken = decryptToken(page.pageAccessToken);

  const params: Record<string, unknown> = {
    message: content,
    access_token: pageToken,
  };

  if (mediaUrls.length > 0) {
    const photoIds: string[] = [];
    for (const url of mediaUrls) {
      if (url.startsWith('fb:')) {
        // Already uploaded to Facebook — use the photo ID directly
        photoIds.push(url.slice(3));
      } else {
        const mediaRes = await axios.post(`${META_BASE}/${page.pageId}/photos`, {
          url,
          published: false,
          access_token: pageToken,
        });
        photoIds.push(mediaRes.data.id as string);
      }
    }
    params.attached_media = photoIds.map(id => ({ media_fbid: id }));
  }

  const postRes = await axios.post(`${META_BASE}/${page.pageId}/feed`, params);
  return postRes.data.id as string;
}

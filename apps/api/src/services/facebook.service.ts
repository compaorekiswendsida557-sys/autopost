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

  if (mediaUrls.length === 1) {
    const mediaRes = await axios.post(`${META_BASE}/${page.pageId}/photos`, {
      url: mediaUrls[0],
      published: false,
      access_token: pageToken,
    });
    params.attached_media = [{ media_fbid: mediaRes.data.id }];
  }

  const postRes = await axios.post(`${META_BASE}/${page.pageId}/feed`, params);
  return postRes.data.id as string;
}

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { TokenPayload } from '../types';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = '7d';

export function generateTokens(user: { id: string; email: string; plan: string }) {
  const payload: TokenPayload = { userId: user.id, email: user.email, plan: user.plan };

  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
  const refreshToken = jwt.sign({ userId: user.id }, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_TTL });

  return { accessToken, refreshToken };
}

export async function registerUser(email: string, password: string, fullName?: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error('EMAIL_EXISTS');

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, passwordHash, fullName },
    select: { id: true, email: true, fullName: true, plan: true, createdAt: true },
  });

  return user;
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) throw new Error('INVALID_CREDENTIALS');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new Error('INVALID_CREDENTIALS');

  const tokens = generateTokens({ id: user.id, email: user.email, plan: user.plan });

  await prisma.refreshToken.create({
    data: {
      token: tokens.refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
    },
  });

  return {
    user: { id: user.id, email: user.email, fullName: user.fullName, plan: user.plan },
    ...tokens,
  };
}

export async function refreshAccessToken(refreshToken: string) {
  let payload: { userId: string };
  try {
    payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { userId: string };
  } catch {
    throw new Error('INVALID_REFRESH_TOKEN');
  }

  const storedToken = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
  if (!storedToken || storedToken.expiresAt < new Date()) throw new Error('INVALID_REFRESH_TOKEN');

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) throw new Error('USER_NOT_FOUND');

  const tokens = generateTokens({ id: user.id, email: user.email, plan: user.plan });

  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: { token: tokens.refreshToken, expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000) },
  });

  return tokens;
}

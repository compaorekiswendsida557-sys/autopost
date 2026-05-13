import { Request } from 'express';

export interface AuthRequest extends Request {
  userId?: string;
  userPlan?: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  plan: string;
}

export interface GeneratePostParams {
  pageId: string;
  theme: string;
  tone: string;
  length: string;
  objective: string;
  variantsCount?: number;
  customInstructions?: string;
}

export interface PostVariant {
  text: string;
  hook: string;
  cta: string;
}

export interface FacebookPageData {
  id: string;
  name: string;
  access_token: string;
  category?: string;
  followers_count?: number;
  picture?: { data: { url: string } };
}

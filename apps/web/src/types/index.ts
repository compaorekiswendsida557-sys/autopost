export type Plan = 'FREE' | 'STARTER' | 'PRO' | 'AGENCY';
export type Tone = 'PROFESSIONAL' | 'SELLER' | 'MOTIVATION' | 'FUNNY' | 'EDUCATIONAL';
export type PostStatus = 'DRAFT' | 'PENDING_VALIDATION' | 'VALIDATED' | 'REJECTED' | 'SCHEDULED' | 'PUBLISHING' | 'PUBLISHED' | 'FAILED';
export type MediaType = 'IMAGE' | 'VIDEO' | 'CAROUSEL' | 'NONE';
export type Objective = 'AWARENESS' | 'ENGAGEMENT' | 'CONVERSION' | 'TRAFFIC';
export type PostLength = 'SHORT' | 'MEDIUM' | 'LONG';
export type Frequency = 'DAILY' | 'WEEKLY' | 'CUSTOM';

export interface User {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  plan: Plan;
  planExpiresAt: string | null;
  createdAt: string;
  facebookPages?: FacebookPage[];
}

export interface FacebookPage {
  id: string;
  pageId: string;
  pageName: string;
  pictureUrl: string | null;
  category: string | null;
  followersCount: number;
  isActive: boolean;
  businessProfile?: BusinessProfile;
}

export interface BusinessProfile {
  id: string;
  pageId: string;
  businessName: string | null;
  activity: string | null;
  mainTheme: string | null;
  tone: Tone;
  slogan: string | null;
  whatsapp: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  hashtags: string[];
  language: string;
}

export interface Post {
  id: string;
  userId: string;
  pageId: string;
  content: string;
  contentVariants: PostVariant[] | null;
  status: PostStatus;
  mediaUrls: string[];
  mediaType: MediaType | null;
  objective: Objective | null;
  toneUsed: Tone | null;
  lengthUsed: PostLength | null;
  fbPostId: string | null;
  publishedAt: string | null;
  scheduledFor: string | null;
  createdAt: string;
  updatedAt: string;
  page?: { pageName: string; pictureUrl: string | null };
  analytics?: PostAnalytic[];
}

export interface PostVariant {
  text: string;
  hook: string;
  cta: string;
}

export interface PostAnalytic {
  id: string;
  likes: number;
  comments: number;
  shares: number;
  reach: number;
  impressions: number;
  clicks: number;
  fetchedAt: string;
}

export interface GenerateRequest {
  pageId: string;
  theme: string;
  tone: Tone;
  length: PostLength;
  objective: Objective;
  variantsCount?: number;
  customInstructions?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface PaginatedPosts {
  posts: Post[];
  total: number;
  page: number;
  pages: number;
}

export interface DashboardStats {
  totalPosts: number;
  publishedPosts: number;
  scheduledPosts: number;
  draftPosts: number;
  totalPages: number;
  postsThisMonth: number;
}

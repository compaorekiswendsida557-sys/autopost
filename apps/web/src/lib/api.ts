import axios, { AxiosError } from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: false,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT from localStorage
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as typeof error.config & { _retry?: boolean };
    if (error.response?.status === 401 && !original?._retry) {
      original._retry = true;
      const refresh = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
      if (refresh) {
        try {
          const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken: refresh });
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          if (original?.headers) original.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(original!);
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  register: (data: { email: string; password: string; fullName?: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refreshToken }),
  me: () => api.get('/auth/me'),
  updateProfile: (data: { fullName?: string; avatarUrl?: string }) =>
    api.put('/auth/profile', data),
};

// AI
export const aiApi = {
  generate: (data: {
    pageId: string;
    theme: string;
    tone: string;
    length: string;
    objective: string;
    variantsCount?: number;
    customInstructions?: string;
  }) => api.post('/ai/generate', data),
  history: (page = 1) => api.get(`/ai/history?page=${page}`),
};

// Posts
export const postsApi = {
  list: (params: { status?: string; pageId?: string; page?: number; limit?: number } = {}) =>
    api.get('/posts', { params }),
  get: (id: string) => api.get(`/posts/${id}`),
  create: (data: {
    pageId: string;
    content: string;
    contentVariants?: unknown;
    mediaUrls?: string[];
    objective?: string;
    toneUsed?: string;
    lengthUsed?: string;
  }) => api.post('/posts', data),
  update: (id: string, data: { content?: string; mediaUrls?: string[]; scheduledFor?: string | null }) =>
    api.put(`/posts/${id}`, data),
  delete: (id: string) => api.delete(`/posts/${id}`),
  validate: (id: string) => api.post(`/posts/${id}/validate`),
  reject: (id: string, reason?: string) => api.post(`/posts/${id}/reject`, { reason }),
  schedule: (id: string, scheduledFor: string) =>
    api.post(`/posts/${id}/schedule`, { scheduledFor }),
  publishNow: (id: string) => api.post(`/posts/${id}/publish-now`),
  bulkSchedule: (data: {
    pageId: string;
    posts: Array<{ content: string; richContent?: string; imageUrl?: string; toneUsed?: string; lengthUsed?: string; objective?: string; aiPromptUsed?: string }>;
    startDate: string;
    times: string[];
  }) => api.post('/posts/bulk-schedule', data),
};

// Facebook Pages (routes match backend: /facebook/...)
export const facebookApi = {
  getAuthUrl: () => api.get('/facebook/auth-url'),
  listPages: () => api.get('/facebook/pages'),
  connectPage: (connectionId: string, pageData: unknown) =>
    api.post('/facebook/pages/connect', { connectionId, pageData }),
  getPageConfig: (pageId: string) => api.get(`/facebook/pages/${pageId}/profile`),
  updatePageConfig: (pageId: string, data: unknown) =>
    api.put(`/facebook/pages/${pageId}/profile`, data),
  disconnectPage: (pageId: string) => api.delete(`/facebook/pages/${pageId}`),
};

// Media
export const mediaApi = {
  upload: (file: File, pageId?: string) => {
    const form = new FormData();
    form.append('file', file);
    if (pageId) form.append('pageId', pageId);
    return api.post('/media/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  list: (pageId?: string) => api.get('/media', { params: { pageId } }),
  delete: (id: string) => api.delete(`/media/${id}`),
};

// Analytics (backend route: /analytics/overview)
export const analyticsApi = {
  dashboard: () => api.get('/analytics/overview'),
  posts: () => api.get('/analytics/posts'),
};

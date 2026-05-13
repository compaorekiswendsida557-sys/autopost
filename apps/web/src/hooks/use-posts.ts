'use client';

import { useState, useCallback } from 'react';
import { postsApi } from '@/lib/api';
import type { Post, PaginatedPosts } from '@/types';
import toast from 'react-hot-toast';

export function usePosts(initialStatus?: string) {
  const [data, setData] = useState<PaginatedPosts | null>(null);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async (params: {
    status?: string;
    pageId?: string;
    page?: number;
    limit?: number;
  } = {}) => {
    setLoading(true);
    try {
      const res = await postsApi.list({ status: initialStatus, ...params });
      setData(res.data);
    } catch {
      toast.error('Erreur lors du chargement des posts');
    } finally {
      setLoading(false);
    }
  }, [initialStatus]);

  const validate = async (id: string): Promise<Post | null> => {
    try {
      const res = await postsApi.validate(id);
      toast.success('Post validé !');
      return res.data;
    } catch {
      toast.error('Erreur de validation');
      return null;
    }
  };

  const reject = async (id: string, reason?: string): Promise<Post | null> => {
    try {
      const res = await postsApi.reject(id, reason);
      toast.success('Post rejeté');
      return res.data;
    } catch {
      toast.error('Erreur');
      return null;
    }
  };

  const publishNow = async (id: string): Promise<Post | null> => {
    try {
      const res = await postsApi.publishNow(id);
      toast.success('Post publié sur Facebook !');
      return res.data;
    } catch {
      toast.error('Erreur de publication');
      return null;
    }
  };

  const schedule = async (id: string, scheduledFor: string): Promise<Post | null> => {
    try {
      const res = await postsApi.schedule(id, scheduledFor);
      toast.success('Post programmé !');
      return res.data;
    } catch {
      toast.error('Erreur de programmation');
      return null;
    }
  };

  const remove = async (id: string): Promise<boolean> => {
    try {
      await postsApi.delete(id);
      toast.success('Post supprimé');
      return true;
    } catch {
      toast.error('Erreur de suppression');
      return false;
    }
  };

  return { data, loading, fetch, validate, reject, publishNow, schedule, remove };
}

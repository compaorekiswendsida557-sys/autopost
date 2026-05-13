'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BarChart3, FileText, Calendar, CheckCircle, Clock,
  PlusCircle, TrendingUp, Facebook, Sparkles, ArrowRight
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageLoader } from '@/components/ui/spinner';
import { postsApi, analyticsApi } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { formatRelative, getStatusLabel, getStatusColor, truncate } from '@/lib/utils';
import type { Post } from '@/types';

interface Stats {
  totalPosts: number;
  publishedPosts: number;
  scheduledPosts: number;
  draftPosts: number;
  totalPages: number;
  postsThisMonth: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, postsRes] = await Promise.all([
          analyticsApi.dashboard().catch(() => ({ data: null })),
          postsApi.list({ limit: 5 }),
        ]);
        setStats(statsRes.data || {
          totalPosts: 0, publishedPosts: 0, scheduledPosts: 0,
          draftPosts: 0, totalPages: user?.facebookPages?.length || 0, postsThisMonth: 0,
        });
        setRecentPosts(postsRes.data.posts);
      } catch {
        setStats({ totalPosts: 0, publishedPosts: 0, scheduledPosts: 0, draftPosts: 0, totalPages: 0, postsThisMonth: 0 });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (loading) return <PageLoader />;

  const statCards = [
    { label: 'Posts publiés', value: stats?.publishedPosts ?? 0, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', trend: '+12%' },
    { label: 'Posts programmés', value: stats?.scheduledPosts ?? 0, icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50', trend: null },
    { label: 'Brouillons', value: stats?.draftPosts ?? 0, icon: FileText, color: 'text-gray-600', bg: 'bg-gray-100', trend: null },
    { label: 'Pages connectées', value: stats?.totalPages ?? user?.facebookPages?.length ?? 0, icon: Facebook, color: 'text-blue-600', bg: 'bg-blue-50', trend: null },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Bonjour, {user?.fullName?.split(' ')[0] || 'là'} 👋
          </h2>
          <p className="text-gray-500 text-sm mt-1">Voici l'état de vos publications Facebook</p>
        </div>
        <Link href="/dashboard/create">
          <Button size="md">
            <PlusCircle className="h-4 w-4" />
            Créer un post IA
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label} padding="md">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.bg}`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              {s.trend && (
                <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                  <TrendingUp className="h-3 w-3" />
                  {s.trend}
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{s.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent posts */}
        <div className="lg:col-span-2">
          <Card padding="none">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Publications récentes</h3>
              <Link href="/dashboard/posts" className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                Voir tout <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            {recentPosts.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <Sparkles className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Aucune publication pour le moment</p>
                <Link href="/dashboard/create">
                  <Button size="sm" className="mt-4">Créer mon premier post</Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {recentPosts.map((post) => (
                  <div key={post.id} className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                      <Facebook className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 leading-relaxed">
                        {truncate(post.content, 100)}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(post.status)}`}>
                          {getStatusLabel(post.status)}
                        </span>
                        <span className="text-xs text-gray-400">{formatRelative(post.createdAt)}</span>
                        {post.page && <span className="text-xs text-gray-400">· {post.page.pageName}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Quick actions + FB pages */}
        <div className="space-y-4">
          <Card padding="md">
            <h3 className="font-semibold text-gray-900 mb-4">Actions rapides</h3>
            <div className="space-y-2">
              {[
                { href: '/dashboard/create', icon: Sparkles, label: 'Générer un post IA', color: 'text-indigo-600' },
                { href: '/dashboard/calendar', icon: Calendar, label: 'Voir le calendrier', color: 'text-purple-600' },
                { href: '/dashboard/pages', icon: Facebook, label: 'Connecter une page', color: 'text-blue-600' },
                { href: '/dashboard/posts', icon: BarChart3, label: 'Voir les analyses', color: 'text-green-600' },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                    <action.icon className={`h-4 w-4 ${action.color}`} />
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{action.label}</span>
                  <ArrowRight className="h-4 w-4 text-gray-300 ml-auto group-hover:text-indigo-400 transition-colors" />
                </Link>
              ))}
            </div>
          </Card>

          {/* Connected pages */}
          {user?.facebookPages && user.facebookPages.length > 0 && (
            <Card padding="md">
              <h3 className="font-semibold text-gray-900 mb-4">Pages connectées</h3>
              <div className="space-y-3">
                {user.facebookPages.map((page) => (
                  <div key={page.id} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                      {page.pictureUrl ? (
                        <img src={page.pictureUrl} alt="" className="w-full h-full rounded-xl object-cover" />
                      ) : (
                        <Facebook className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{page.pageName}</p>
                      <p className="text-xs text-gray-400">Active</p>
                    </div>
                    <Badge variant="success" className="ml-auto flex-shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      Actif
                    </Badge>
                  </div>
                ))}
              </div>
              <Link href="/dashboard/pages">
                <Button variant="outline" size="sm" className="w-full mt-4">
                  Gérer les pages
                </Button>
              </Link>
            </Card>
          )}

          {/* No pages yet */}
          {(!user?.facebookPages || user.facebookPages.length === 0) && (
            <Card padding="md" className="border-dashed border-2 border-gray-200 bg-gray-50">
              <div className="text-center">
                <Facebook className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-3">Connectez votre page Facebook pour commencer</p>
                <Link href="/dashboard/pages">
                  <Button size="sm" variant="secondary">Connecter une page</Button>
                </Link>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

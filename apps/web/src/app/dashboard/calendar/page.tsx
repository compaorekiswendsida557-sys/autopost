'use client';

import { useEffect, useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isBefore, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Facebook, Clock, CheckCircle, PlusCircle, Layers } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { postsApi } from '@/lib/api';
import { getStatusColor, getStatusLabel, truncate } from '@/lib/utils';
import type { Post } from '@/types';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [dayPosts, setDayPosts] = useState<Post[]>([]);

  useEffect(() => {
    const loadPosts = async () => {
      setLoading(true);
      try {
        const res = await postsApi.list({ limit: 200 });
        setPosts(res.data.posts);
      } catch {
        toast.error('Erreur chargement');
      } finally {
        setLoading(false);
      }
    };
    loadPosts();
  }, []);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad start
  const startPadding = monthStart.getDay() === 0 ? 6 : monthStart.getDay() - 1;
  const paddedDays = [...Array(startPadding).fill(null), ...days];

  const getPostsForDay = (day: Date) =>
    posts.filter((p) => {
      const date = p.scheduledFor || p.publishedAt;
      return date && isSameDay(new Date(date), day);
    });

  const handleDayClick = (day: Date) => {
    setSelectedDay(day);
    setDayPosts(getPostsForDay(day));
  };

  const statusDot = (status: string) => {
    const colors: Record<string, string> = {
      PUBLISHED: 'bg-green-500',
      SCHEDULED: 'bg-purple-500',
      DRAFT: 'bg-gray-400',
      FAILED: 'bg-red-500',
    };
    return colors[status] || 'bg-gray-400';
  };

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

  const DAYS_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Calendrier de contenu</h2>
          <p className="text-sm text-gray-500">Visualisez et gérez vos publications</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/bulk">
            <Button size="sm" variant="outline">
              <Layers className="h-4 w-4" />
              En masse
            </Button>
          </Link>
          <Link href="/dashboard/create">
            <Button size="sm">
              <PlusCircle className="h-4 w-4" />
              Nouveau post
            </Button>
          </Link>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 flex-wrap">
        {[
          { color: 'bg-green-500', label: 'Publié' },
          { color: 'bg-purple-500', label: 'Programmé' },
          { color: 'bg-gray-400', label: 'Brouillon' },
          { color: 'bg-red-500', label: 'Échec' },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${l.color}`} />
            <span className="text-xs text-gray-600">{l.label}</span>
          </div>
        ))}
      </div>

      <Card padding="none">
        {/* Month nav */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          <h3 className="text-lg font-semibold text-gray-900 capitalize">
            {format(currentDate, 'MMMM yyyy', { locale: fr })}
          </h3>
          <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {DAYS_LABELS.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-medium text-gray-500">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {paddedDays.map((day, idx) => {
            if (!day) return <div key={`pad-${idx}`} className="aspect-square border-b border-r border-gray-50" />;

            const dayPosts = getPostsForDay(day);
            const isPast = isBefore(startOfDay(day), startOfDay(new Date()));
            const isCurrentDay = isToday(day);

            return (
              <button
                key={day.toString()}
                onClick={() => handleDayClick(day)}
                className={`aspect-square border-b border-r border-gray-50 p-2 flex flex-col items-start hover:bg-gray-50 transition-colors group ${
                  isPast ? 'opacity-60' : ''
                }`}
              >
                <span className={`text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full ${
                  isCurrentDay ? 'bg-indigo-600 text-white' : 'text-gray-700 group-hover:bg-gray-200'
                }`}>
                  {format(day, 'd')}
                </span>
                {dayPosts.length > 0 && (
                  <div className="flex flex-wrap gap-0.5 mt-0.5">
                    {dayPosts.slice(0, 3).map((p) => (
                      <div key={p.id} className={`w-2 h-2 rounded-full ${statusDot(p.status)}`} />
                    ))}
                    {dayPosts.length > 3 && (
                      <span className="text-xs text-gray-400">+{dayPosts.length - 3}</span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Monthly stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Publiés ce mois', value: posts.filter((p) => p.status === 'PUBLISHED').length, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
          { label: 'Programmés', value: posts.filter((p) => p.status === 'SCHEDULED').length, icon: Clock, color: 'text-purple-600 bg-purple-50' },
          { label: 'Brouillons', value: posts.filter((p) => p.status === 'DRAFT').length, icon: Facebook, color: 'text-gray-600 bg-gray-100' },
          { label: 'Total', value: posts.length, icon: Facebook, color: 'text-indigo-600 bg-indigo-50' },
        ].map((s) => (
          <Card key={s.label} padding="md">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${s.color.split(' ')[1]}`}>
              <s.icon className={`h-4 w-4 ${s.color.split(' ')[0]}`} />
            </div>
            <p className="text-xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Day detail modal */}
      <Modal
        open={!!selectedDay}
        onClose={() => setSelectedDay(null)}
        title={selectedDay ? format(selectedDay, 'EEEE dd MMMM yyyy', { locale: fr }) : ''}
        size="md"
      >
        {selectedDay && (
          <div className="space-y-3">
            {dayPosts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm mb-4">Aucune publication ce jour</p>
                <Link href="/dashboard/create">
                  <Button size="sm">
                    <PlusCircle className="h-4 w-4" />
                    Créer un post pour ce jour
                  </Button>
                </Link>
              </div>
            ) : (
              dayPosts.map((post) => (
                <div key={post.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${statusDot(post.status)}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800">{truncate(post.content, 100)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(post.status)}`}>
                        {getStatusLabel(post.status)}
                      </span>
                      {post.page && <span className="text-xs text-gray-400">{post.page.pageName}</span>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

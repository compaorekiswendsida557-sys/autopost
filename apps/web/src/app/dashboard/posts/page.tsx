'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Send, Clock, FileText, CheckCircle, XCircle, Trash2,
  RefreshCw, Facebook, Filter, Search, PlusCircle, Eye
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { PageLoader, Spinner } from '@/components/ui/spinner';
import { postsApi } from '@/lib/api';
import { formatRelative, getStatusLabel, getStatusColor, truncate } from '@/lib/utils';
import type { Post } from '@/types';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'DRAFT', label: 'Brouillons' },
  { value: 'PENDING_VALIDATION', label: 'En attente' },
  { value: 'VALIDATED', label: 'Validés' },
  { value: 'SCHEDULED', label: 'Programmés' },
  { value: 'PUBLISHED', label: 'Publiés' },
  { value: 'FAILED', label: 'Échoués' },
];

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [previewPost, setPreviewPost] = useState<Post | null>(null);
  const [scheduleModal, setScheduleModal] = useState<Post | null>(null);
  const [scheduledFor, setScheduledFor] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadPosts = async (p = 1, status = statusFilter) => {
    setLoading(true);
    try {
      const res = await postsApi.list({ status, page: p, limit: 10 });
      setPosts(res.data.posts);
      setTotal(res.data.total);
      setPages(res.data.pages);
      setPage(p);
    } catch {
      toast.error('Erreur chargement des posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPosts(1, statusFilter); }, [statusFilter]);

  const handleAction = async (id: string, action: () => Promise<unknown>, label: string) => {
    setActionLoading(id);
    try {
      await action();
      toast.success(`${label} avec succès !`);
      loadPosts(page);
    } catch {
      toast.error(`Erreur : ${label}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSchedule = async () => {
    if (!scheduleModal || !scheduledFor) return;
    setActionLoading(scheduleModal.id);
    try {
      await postsApi.schedule(scheduleModal.id, new Date(scheduledFor).toISOString());
      toast.success('Post programmé !');
      setScheduleModal(null);
      loadPosts(page);
    } catch {
      toast.error('Erreur de programmation');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredPosts = search
    ? posts.filter((p) => p.content.toLowerCase().includes(search.toLowerCase()))
    : posts;

  const statusBadge = (status: string) => (
    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusColor(status)}`}>
      {getStatusLabel(status)}
    </span>
  );

  return (
    <div className="max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Mes publications</h2>
          <p className="text-sm text-gray-500">{total} publication{total > 1 ? 's' : ''} au total</p>
        </div>
        <Link href="/dashboard/create">
          <Button size="sm">
            <PlusCircle className="h-4 w-4" />
            Nouveau post
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Rechercher dans le contenu..."
            leftIcon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-48">
          <Select
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
        <button
          onClick={() => loadPosts(page)}
          className="p-2.5 border border-gray-300 rounded-xl text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Tab stats */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_OPTIONS.slice(1).map((s) => {
          const count = s.value ? posts.filter((p) => p.status === s.value).length : posts.length;
          return (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                statusFilter === s.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'
              }`}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Posts list */}
      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : filteredPosts.length === 0 ? (
        <Card padding="lg" className="text-center">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Aucune publication trouvée</p>
          <Link href="/dashboard/create">
            <Button size="sm" className="mt-4">Créer un post</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredPosts.map((post) => (
            <Card key={post.id} padding="md" className="hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <Facebook className="h-5 w-5 text-indigo-600" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {statusBadge(post.status)}
                      {post.page && (
                        <span className="text-xs text-gray-400">· {post.page.pageName}</span>
                      )}
                      {post.toneUsed && (
                        <Badge variant="default">{post.toneUsed}</Badge>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">{formatRelative(post.createdAt)}</span>
                  </div>

                  <p className="text-sm text-gray-700 leading-relaxed mb-3">
                    {truncate(post.content, 200)}
                  </p>

                  {post.scheduledFor && (
                    <div className="flex items-center gap-1.5 text-xs text-purple-600 mb-3">
                      <Clock className="h-3.5 w-3.5" />
                      Programmé pour : {new Date(post.scheduledFor).toLocaleString('fr-FR')}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => setPreviewPost(post)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Voir
                    </button>

                    {['DRAFT', 'PENDING_VALIDATION', 'REJECTED'].includes(post.status) && (
                      <>
                        <button
                          onClick={() => handleAction(post.id, () => postsApi.validate(post.id), 'Validé')}
                          disabled={actionLoading === post.id}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-green-600 hover:bg-green-50 transition-colors"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          Valider
                        </button>
                        <button
                          onClick={() => setScheduleModal(post)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-purple-600 hover:bg-purple-50 transition-colors"
                        >
                          <Clock className="h-3.5 w-3.5" />
                          Programmer
                        </button>
                      </>
                    )}

                    {['VALIDATED', 'DRAFT'].includes(post.status) && (
                      <button
                        onClick={() => handleAction(post.id, () => postsApi.publishNow(post.id), 'Publié')}
                        disabled={actionLoading === post.id}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
                      >
                        {actionLoading === post.id ? <Spinner size="sm" /> : <Send className="h-3.5 w-3.5" />}
                        Publier
                      </button>
                    )}

                    {!['PUBLISHED', 'PUBLISHING'].includes(post.status) && (
                      <button
                        onClick={() => handleAction(post.id, () => postsApi.delete(post.id), 'Supprimé')}
                        disabled={actionLoading === post.id}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Supprimer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => loadPosts(page - 1)}>
            Précédent
          </Button>
          <span className="text-sm text-gray-600">Page {page} / {pages}</span>
          <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => loadPosts(page + 1)}>
            Suivant
          </Button>
        </div>
      )}

      {/* Preview modal */}
      <Modal
        open={!!previewPost}
        onClose={() => setPreviewPost(null)}
        title="Aperçu du post"
        size="lg"
      >
        {previewPost && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              {statusBadge(previewPost.status)}
              {previewPost.page && <span className="text-sm text-gray-500">{previewPost.page.pageName}</span>}
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
              {previewPost.content}
            </div>
            {previewPost.mediaUrls.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {previewPost.mediaUrls.map((url, i) => (
                  <img key={i} src={url} alt="" className="rounded-xl object-cover w-full h-32" />
                ))}
              </div>
            )}
            <div className="flex gap-2 pt-2">
              {['DRAFT', 'VALIDATED'].includes(previewPost.status) && (
                <Button
                  onClick={() => {
                    handleAction(previewPost.id, () => postsApi.publishNow(previewPost.id), 'Publié');
                    setPreviewPost(null);
                  }}
                  className="flex-1"
                >
                  <Send className="h-4 w-4" />
                  Publier maintenant
                </Button>
              )}
              <Button variant="outline" onClick={() => setPreviewPost(null)} className="flex-1">
                Fermer
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Schedule modal */}
      <Modal
        open={!!scheduleModal}
        onClose={() => setScheduleModal(null)}
        title="Programmer la publication"
      >
        <div className="space-y-4">
          <Input
            label="Date et heure"
            type="datetime-local"
            value={scheduledFor}
            onChange={(e) => setScheduledFor(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
          />
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setScheduleModal(null)} className="flex-1">Annuler</Button>
            <Button onClick={handleSchedule} loading={!!actionLoading} className="flex-1">
              <Clock className="h-4 w-4" />
              Programmer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

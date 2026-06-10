'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Sparkles, RefreshCw, Send, Calendar, Save, Facebook,
  Check, Copy, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2, Clock,
  ImagePlus, X, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { aiApi, postsApi, facebookApi } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { getToneLabel, getObjectiveLabel, getLengthLabel } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { FacebookPage, PostVariant, Tone, PostLength, Objective } from '@/types';

type MediaItem = {
  id: number;
  preview: string;
  url: string;
  uploading: boolean;
};

const schema = z.object({
  pageId: z.string().min(1, 'Sélectionnez une page'),
  theme: z.string().min(3, 'Décrivez le thème de votre post'),
  tone: z.string().min(1),
  length: z.string().min(1),
  objective: z.string().min(1),
  variantsCount: z.number().min(1).max(10),
  customInstructions: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const TONES = [
  { value: 'PROFESSIONAL', label: 'Professionnel', emoji: '💼' },
  { value: 'SELLER', label: 'Vendeur', emoji: '🎯' },
  { value: 'MOTIVATION', label: 'Motivation', emoji: '🔥' },
  { value: 'FUNNY', label: 'Drôle', emoji: '😄' },
  { value: 'EDUCATIONAL', label: 'Éducatif', emoji: '📚' },
];

const LENGTHS = [
  { value: 'SHORT', label: 'Court', desc: '50-150 mots', emoji: '⚡' },
  { value: 'MEDIUM', label: 'Moyen', desc: '150-300 mots', emoji: '📝' },
  { value: 'LONG', label: 'Long', desc: '300-500 mots', emoji: '📖' },
];

const OBJECTIVES = [
  { value: 'AWARENESS', label: 'Notoriété', emoji: '📢' },
  { value: 'ENGAGEMENT', label: 'Engagement', emoji: '❤️' },
  { value: 'CONVERSION', label: 'Conversion', emoji: '💰' },
  { value: 'TRAFFIC', label: 'Trafic', emoji: '🌐' },
];

const STEPS = [
  { label: 'Générer', icon: Sparkles },
  { label: 'Éditer', icon: Check },
  { label: 'Publier', icon: Send },
];

const STORAGE_KEY = 'autopost_create_form';

function loadSaved() {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null'); } catch { return null; }
}

export default function CreatePostPage() {
  useAuth();
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [step, setStep] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [variants, setVariants] = useState<PostVariant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [editedContent, setEditedContent] = useState('');
  const [scheduleModal, setScheduleModal] = useState(false);
  const [scheduledFor, setScheduledFor] = useState('');
  const [selectedPageId, setSelectedPageId] = useState('');
  const [tone, setTone] = useState('PROFESSIONAL');
  const [length, setLength] = useState('MEDIUM');
  const [objective, setObjective] = useState('ENGAGEMENT');
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { variantsCount: 1, tone: 'PROFESSIONAL', length: 'MEDIUM', objective: 'ENGAGEMENT', theme: '', pageId: '', customInstructions: '' },
  });

  // Restore saved state on mount (must run client-side after sessionStorage is available)
  useEffect(() => {
    const saved = loadSaved();
    if (!saved) return;
    reset({
      pageId: saved.pageId || '',
      theme: saved.theme || '',
      tone: saved.tone || 'PROFESSIONAL',
      length: saved.length || 'MEDIUM',
      objective: saved.objective || 'ENGAGEMENT',
      variantsCount: saved.variantsCount || 1,
      customInstructions: saved.customInstructions || '',
    });
    if (saved.tone) setTone(saved.tone);
    if (saved.length) setLength(saved.length);
    if (saved.objective) setObjective(saved.objective);
    if (saved.selectedPageId) setSelectedPageId(saved.selectedPageId);
    if (saved.step) setStep(saved.step);
    if (saved.variants?.length) {
      setVariants(saved.variants);
      setEditedContent(saved.editedContent || saved.variants[0]?.text || '');
      setSelectedVariant(saved.selectedVariant || 0);
    }
    if (saved.mediaItems?.length) {
      // Restore only uploaded items (no local preview after session ends)
      setMediaItems(saved.mediaItems.filter((m: MediaItem) => m.url).map((m: MediaItem) => ({
        ...m, preview: '', uploading: false,
      })));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist to sessionStorage on every change
  const formValues = watch();
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...formValues, tone, length, objective,
      selectedPageId, variants, editedContent, selectedVariant, step,
      mediaItems: mediaItems.filter(m => !m.uploading),
    }));
  }, [formValues, tone, length, objective, selectedPageId, variants, editedContent, selectedVariant, step, mediaItems]);

  useEffect(() => {
    facebookApi.listPages().then((res) => {
      setPages(res.data?.pages || res.data || []);
    }).catch(() => {});
  }, []);

  useEffect(() => { setValue('tone', tone as Tone); }, [tone, setValue]);
  useEffect(() => { setValue('length', length as PostLength); }, [length, setValue]);
  useEffect(() => { setValue('objective', objective as Objective); }, [objective, setValue]);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const pageId = watch('pageId') || selectedPageId;
    if (!pageId) { toast.error('Sélectionnez une page d\'abord'); return; }
    if (mediaItems.length + files.length > 10) {
      toast.error('Maximum 10 photos par publication');
      return;
    }
    if (e.target) e.target.value = '';

    for (const file of files) {
      const preview = URL.createObjectURL(file);
      const id = Date.now() + Math.random();
      setMediaItems(prev => [...prev, { id, preview, url: '', uploading: true }]);
      try {
        const res = await facebookApi.uploadPhoto(pageId, file);
        setMediaItems(prev => prev.map(m => m.id === id ? { ...m, url: res.data.url, uploading: false } : m));
        toast.success('Photo ajoutée !');
      } catch {
        setMediaItems(prev => prev.filter(m => m.id !== id));
        URL.revokeObjectURL(preview);
        toast.error(`Erreur upload : ${file.name}`);
      }
    }
  };

  const removeMedia = (id: number) => {
    setMediaItems(prev => {
      const item = prev.find(m => m.id === id);
      if (item?.preview) URL.revokeObjectURL(item.preview);
      return prev.filter(m => m.id !== id);
    });
  };

  const getMediaUrls = () => mediaItems.filter(m => m.url && !m.uploading).map(m => m.url);

  const onGenerate = async (data: FormData) => {
    setGenerating(true);
    setVariants([]);
    setSelectedPageId(data.pageId);
    try {
      const res = await aiApi.generate({
        pageId: data.pageId, theme: data.theme, tone: data.tone,
        length: data.length, objective: data.objective,
        variantsCount: data.variantsCount, customInstructions: data.customInstructions,
      });
      const v: PostVariant[] = res.data.variants || res.data;
      setVariants(v);
      setEditedContent(v[0]?.text || '');
      setSelectedVariant(0);
      toast.success(`${v.length} variante(s) générée(s) !`);
      setStep(1);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg || 'Erreur de génération IA. Vérifiez votre configuration de page.');
    } finally {
      setGenerating(false);
    }
  };

  const handleVariantSelect = (idx: number) => {
    setSelectedVariant(idx);
    setEditedContent(variants[idx].text);
  };

  const handleSaveDraft = async () => {
    if (!editedContent || !selectedPageId) return;
    setSaving(true);
    try {
      await postsApi.create({
        pageId: selectedPageId, content: editedContent, contentVariants: variants,
        mediaUrls: getMediaUrls(),
        objective: objective as Objective, toneUsed: tone as Tone, lengthUsed: length as PostLength,
      });
      toast.success('Brouillon sauvegardé !');
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      toast.error('Erreur de sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handlePublishNow = async () => {
    if (!editedContent || !selectedPageId) return;
    setSaving(true);
    try {
      const postRes = await postsApi.create({
        pageId: selectedPageId, content: editedContent, contentVariants: variants,
        mediaUrls: getMediaUrls(),
        objective: objective as Objective, toneUsed: tone as Tone, lengthUsed: length as PostLength,
      });
      await postsApi.validate(postRes.data.id);
      await postsApi.publishNow(postRes.data.id);
      toast.success('Publié sur Facebook !');
      sessionStorage.removeItem(STORAGE_KEY);
      setStep(0); setVariants([]); setEditedContent(''); setMediaItems([]);
    } catch {
      toast.error('Erreur de publication');
    } finally {
      setSaving(false);
    }
  };

  const handleSchedule = async () => {
    if (!scheduledFor || !editedContent || !selectedPageId) return;
    setSaving(true);
    try {
      const postRes = await postsApi.create({
        pageId: selectedPageId, content: editedContent, contentVariants: variants,
        mediaUrls: getMediaUrls(),
        objective: objective as Objective, toneUsed: tone as Tone, lengthUsed: length as PostLength,
      });
      await postsApi.schedule(postRes.data.id, new Date(scheduledFor).toISOString());
      setScheduleModal(false);
      toast.success('Post programmé !');
      sessionStorage.removeItem(STORAGE_KEY);
      setStep(0); setVariants([]); setEditedContent(''); setMediaItems([]);
    } catch {
      toast.error('Erreur de programmation');
    } finally {
      setSaving(false);
    }
  };

  const hasNoPages = pages.length === 0;
  const selectedPage = pages.find(p => p.id === (watch('pageId') || selectedPageId));

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* ── Stepper ── */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const done = i < step;
          const active = i === step;
          return (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <button
                onClick={() => { if (done) setStep(i); }}
                disabled={!done}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all
                  ${active ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : ''}
                  ${done ? 'text-indigo-600 hover:bg-indigo-50 cursor-pointer' : 'text-gray-400 cursor-default'}
                  ${!active && !done ? '' : ''}
                `}
              >
                {done
                  ? <CheckCircle2 className="h-4 w-4 text-indigo-500" />
                  : <Icon className={`h-4 w-4 ${active ? 'text-white' : 'text-gray-400'}`} />
                }
                {s.label}
              </button>
              {i < STEPS.length - 1 && (
                <ChevronRight className={`h-4 w-4 mx-1 ${i < step ? 'text-indigo-400' : 'text-gray-300'}`} />
              )}
            </div>
          );
        })}
      </div>

      {hasNoPages && (
        <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-800">Aucune page Facebook connectée</p>
            <p className="text-sm text-yellow-700 mt-0.5">
              <a href="/dashboard/pages" className="underline font-medium">Connecter une page →</a>
            </p>
          </div>
        </div>
      )}

      {/* ── STEP 0 : Générer ── */}
      {step === 0 && (
        <Card padding="md">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-indigo-600" />
            </div>
            <h2 className="font-semibold text-gray-900">Configurer le post</h2>
          </div>

          <form onSubmit={handleSubmit(onGenerate)} className="space-y-4">
            <Select
              label="Page Facebook"
              options={pages.map((p) => ({ value: p.id, label: p.pageName }))}
              placeholder="Choisir une page..."
              error={errors.pageId?.message}
              {...register('pageId')}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Thème du post <span className="text-red-500">*</span>
              </label>
              <textarea
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm resize-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                rows={3}
                placeholder="Ex: Promotion de notre service, conseil du jour..."
                {...register('theme')}
              />
              {errors.theme && <p className="text-xs text-red-500 mt-1">{errors.theme.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ton</label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                {TONES.map((t) => (
                  <button key={t.value} type="button" onClick={() => setTone(t.value)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 text-xs font-medium transition-all ${
                      tone === t.value ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}>
                    <span className="text-base">{t.emoji}</span>{t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Longueur</label>
              <div className="grid grid-cols-3 gap-1.5">
                {LENGTHS.map((l) => (
                  <button key={l.value} type="button" onClick={() => setLength(l.value)}
                    className={`flex flex-col items-center gap-0.5 p-2 rounded-xl border-2 text-xs font-medium transition-all ${
                      length === l.value ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}>
                    <span>{l.emoji} {l.label}</span>
                    <span className="text-gray-400 font-normal">{l.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Objectif</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {OBJECTIVES.map((o) => (
                  <button key={o.value} type="button" onClick={() => setObjective(o.value)}
                    className={`flex items-center gap-1.5 p-2.5 rounded-xl border-2 text-xs font-medium transition-all ${
                      objective === o.value ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}>
                    {o.emoji} {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Variantes : <span className="text-indigo-600">{watch('variantsCount')}</span>
              </label>
              <input type="range" min={1} max={10} className="w-full accent-indigo-600"
                {...register('variantsCount', { valueAsNumber: true })} />
              <div className="flex justify-between text-xs text-gray-400 mt-1"><span>1</span><span>5</span><span>10</span></div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Instructions spéciales <span className="text-gray-400">(optionnel)</span>
              </label>
              <textarea
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm resize-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                rows={2}
                placeholder="Ex: Mentionner notre nouveau local, utiliser des emojis..."
                {...register('customInstructions')}
              />
            </div>

            <div className="flex gap-3">
              {variants.length > 0 && (
                <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Garder le texte actuel
                </Button>
              )}
              <Button type="submit" loading={generating} disabled={hasNoPages} className={variants.length > 0 ? 'flex-1' : 'w-full'} size="lg">
                <Sparkles className="h-4 w-4" />
                {generating ? 'Génération...' : variants.length > 0 ? 'Regénérer' : 'Générer avec Claude AI'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* ── STEP 1 : Éditer ── */}
      {step === 1 && (
        <div className="space-y-4">
          {/* Variant tabs */}
          {variants.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {variants.map((_, idx) => (
                <button key={idx} onClick={() => handleVariantSelect(idx)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    selectedVariant === idx ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'
                  }`}>
                  {selectedVariant === idx && <Check className="h-3.5 w-3.5" />}
                  Variante {idx + 1}
                </button>
              ))}
              <button onClick={() => { setStep(0); }}
                className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:border-indigo-300 transition-all">
                <RefreshCw className="h-3.5 w-3.5" />
                Régénérer
              </button>
            </div>
          )}

          <Card padding="none" className="overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 flex items-center gap-2">
              <Facebook className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">
                {selectedPage?.pageName || 'Aperçu Facebook'}
              </span>
              <span className="ml-auto text-xs text-gray-400">{editedContent.split(' ').filter(Boolean).length} mots</span>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                  {selectedPage?.pictureUrl
                    ? <img src={selectedPage.pictureUrl} alt="" className="w-full h-full object-cover" />
                    : <Facebook className="h-5 w-5 text-blue-600" />
                  }
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{selectedPage?.pageName || 'Votre Page'}</p>
                  <p className="text-xs text-gray-400">Il y a quelques secondes · 🌍</p>
                </div>
              </div>

              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                rows={12}
                className="border-0 bg-transparent p-0 text-sm text-gray-800 leading-relaxed resize-none focus:ring-0 font-inherit"
                placeholder="Le contenu généré apparaîtra ici..."
              />

              {/* Photo thumbnails preview */}
              {mediaItems.length > 0 && (
                <div className={`mt-3 grid gap-1 rounded-xl overflow-hidden ${
                  mediaItems.length === 1 ? 'grid-cols-1' :
                  mediaItems.length === 2 ? 'grid-cols-2' :
                  mediaItems.length === 3 ? 'grid-cols-3' :
                  'grid-cols-2'
                }`}>
                  {mediaItems.slice(0, 4).map((item, idx) => (
                    <div key={item.id} className={`relative bg-gray-100 ${
                      mediaItems.length === 1 ? 'h-48' : 'h-28'
                    } ${mediaItems.length > 4 && idx === 3 ? 'relative' : ''}`}>
                      {item.preview
                        ? <img src={item.preview} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center bg-indigo-50">
                            <ImagePlus className="h-8 w-8 text-indigo-300" />
                          </div>
                      }
                      {item.uploading && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Loader2 className="h-6 w-6 text-white animate-spin" />
                        </div>
                      )}
                      {mediaItems.length > 4 && idx === 3 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white text-lg font-bold">+{mediaItems.length - 4}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span>👍 ❤️ 😮</span><span>42 réactions</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span>8 commentaires</span><span>3 partages</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Photo upload section */}
          <Card padding="md">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ImagePlus className="h-4 w-4 text-indigo-500" />
                <span className="text-sm font-medium text-gray-700">Photos ({mediaItems.length}/10)</span>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={mediaItems.length >= 10 || mediaItems.some(m => m.uploading)}
                className="flex items-center gap-1.5 text-xs text-indigo-600 font-medium hover:text-indigo-700 disabled:text-gray-300 disabled:cursor-not-allowed"
              >
                <ImagePlus className="h-3.5 w-3.5" /> Ajouter des photos
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handlePhotoSelect}
              />
            </div>
            {mediaItems.length === 0 ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center gap-2 text-gray-400 hover:border-indigo-300 hover:text-indigo-400 hover:bg-indigo-50/50 transition-all"
              >
                <ImagePlus className="h-8 w-8" />
                <span className="text-sm">Cliquer pour ajouter des photos</span>
                <span className="text-xs">Jusqu&apos;à 10 photos • JPG, PNG</span>
              </button>
            ) : (
              <div className="flex flex-wrap gap-2">
                {mediaItems.map((item) => (
                  <div key={item.id} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 flex-shrink-0">
                    {item.preview
                      ? <img src={item.preview} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center">
                          <ImagePlus className="h-6 w-6 text-gray-300" />
                        </div>
                    }
                    {item.uploading
                      ? <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Loader2 className="h-5 w-5 text-white animate-spin" />
                        </div>
                      : <button
                          onClick={() => removeMedia(item.id)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                    }
                  </div>
                ))}
                {mediaItems.length < 10 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={mediaItems.some(m => m.uploading)}
                    className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-indigo-400 hover:text-indigo-400 hover:bg-indigo-50/50 transition-all disabled:opacity-50"
                  >
                    <ImagePlus className="h-5 w-5" />
                    <span className="text-xs mt-1">Ajouter</span>
                  </button>
                )}
              </div>
            )}
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(0)} className="flex items-center gap-2">
              <ChevronLeft className="h-4 w-4" /> Précédent
            </Button>
            <Button variant="ghost" onClick={() => { navigator.clipboard.writeText(editedContent); toast.success('Copié !'); }} size="sm">
              <Copy className="h-4 w-4" /> Copier
            </Button>
            <Button onClick={() => setStep(2)} className="ml-auto flex items-center gap-2" size="lg">
              Valider <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 2 : Publier ── */}
      {step === 2 && (
        <div className="space-y-4">
          <Card padding="md">
            <h3 className="font-semibold text-gray-900 mb-1">Aperçu final</h3>
            <p className="text-xs text-gray-400 mb-4">Vérifie le contenu avant de publier</p>
            <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap border border-gray-100">
              {editedContent}
            </div>
            {mediaItems.filter(m => m.url).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {mediaItems.filter(m => m.url).map(item => (
                  <div key={item.id} className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                    {item.preview
                      ? <img src={item.preview} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center">
                          <ImagePlus className="h-5 w-5 text-gray-300" />
                        </div>
                    }
                  </div>
                ))}
                <span className="text-xs text-gray-400 self-center">
                  {mediaItems.filter(m => m.url).length} photo(s)
                </span>
              </div>
            )}
            <div className="flex gap-2 mt-3 flex-wrap">
              <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full">{getToneLabel(tone)}</span>
              <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full">{getLengthLabel(length)}</span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{getObjectiveLabel(objective)}</span>
              <span className="text-xs text-gray-400 self-center">{editedContent.split(' ').filter(Boolean).length} mots</span>
            </div>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button onClick={handleSaveDraft} disabled={saving}
              className="flex flex-col items-center gap-2 p-5 rounded-2xl border-2 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all group">
              <Save className="h-6 w-6 text-gray-400 group-hover:text-indigo-500" />
              <span className="text-sm font-medium text-gray-700">Brouillon</span>
              <span className="text-xs text-gray-400">Sauvegarder sans publier</span>
            </button>

            <button onClick={() => setScheduleModal(true)}
              className="flex flex-col items-center gap-2 p-5 rounded-2xl border-2 border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all group">
              <Clock className="h-6 w-6 text-gray-400 group-hover:text-green-500" />
              <span className="text-sm font-medium text-gray-700">Programmer</span>
              <span className="text-xs text-gray-400">Choisir une date et heure</span>
            </button>

            <button onClick={handlePublishNow} disabled={saving}
              className="flex flex-col items-center gap-2 p-5 rounded-2xl border-2 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 transition-all group">
              <Send className="h-6 w-6 text-indigo-500" />
              <span className="text-sm font-medium text-indigo-700">Publier maintenant</span>
              <span className="text-xs text-indigo-400">Publier sur Facebook</span>
            </button>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)} className="flex items-center gap-2">
              <ChevronLeft className="h-4 w-4" /> Précédent
            </Button>
          </div>
        </div>
      )}

      {/* Schedule modal */}
      <Modal open={scheduleModal} onClose={() => setScheduleModal(false)}
        title="Programmer la publication" description="Choisissez la date et l'heure de publication">
        <div className="space-y-4">
          <Input label="Date et heure" type="datetime-local" value={scheduledFor}
            onChange={(e) => setScheduledFor(e.target.value)}
            min={new Date().toISOString().slice(0, 16)} />
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setScheduleModal(false)} className="flex-1">Annuler</Button>
            <Button onClick={handleSchedule} loading={saving} className="flex-1">
              <Calendar className="h-4 w-4" /> Confirmer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

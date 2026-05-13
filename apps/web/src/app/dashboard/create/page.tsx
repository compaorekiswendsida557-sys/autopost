'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Sparkles, RefreshCw, Send, Calendar, Save, Facebook,
  Check, Copy, ImagePlus, Trash2, ChevronRight, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { aiApi, postsApi, facebookApi } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { getToneLabel, getObjectiveLabel, getLengthLabel } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { FacebookPage, PostVariant, Tone, PostLength, Objective } from '@/types';

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

export default function CreatePostPage() {
  const { user } = useAuth();
  const [pages, setPages] = useState<FacebookPage[]>([]);
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

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { variantsCount: 1, tone: 'PROFESSIONAL', length: 'MEDIUM', objective: 'ENGAGEMENT' },
  });

  useEffect(() => {
    facebookApi.listPages().then((res) => {
      setPages(res.data?.pages || res.data || []);
    }).catch(() => {});
  }, []);

  useEffect(() => { setValue('tone', tone as Tone); }, [tone, setValue]);
  useEffect(() => { setValue('length', length as PostLength); }, [length, setValue]);
  useEffect(() => { setValue('objective', objective as Objective); }, [objective, setValue]);

  const onGenerate = async (data: FormData) => {
    if (!data.pageId) { toast.error('Sélectionnez une page Facebook'); return; }
    setGenerating(true);
    setVariants([]);
    setSelectedPageId(data.pageId);
    try {
      const res = await aiApi.generate({
        pageId: data.pageId,
        theme: data.theme,
        tone: data.tone,
        length: data.length,
        objective: data.objective,
        variantsCount: data.variantsCount,
        customInstructions: data.customInstructions,
      });
      const v: PostVariant[] = res.data.variants || res.data;
      setVariants(v);
      setEditedContent(v[0]?.text || '');
      setSelectedVariant(0);
      toast.success(`${v.length} variante(s) générée(s) !`);
    } catch (err) {
      toast.error('Erreur de génération IA. Vérifiez votre configuration de page.');
    } finally {
      setGenerating(false);
    }
  };

  const handleVariantSelect = (idx: number) => {
    setSelectedVariant(idx);
    setEditedContent(variants[idx].text);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editedContent);
    toast.success('Copié !');
  };

  const handleSaveDraft = async () => {
    if (!editedContent || !selectedPageId) return;
    setSaving(true);
    try {
      await postsApi.create({
        pageId: selectedPageId,
        content: editedContent,
        contentVariants: variants,
        objective: objective as Objective,
        toneUsed: tone as Tone,
        lengthUsed: length as PostLength,
      });
      toast.success('Brouillon sauvegardé !');
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
        pageId: selectedPageId,
        content: editedContent,
        contentVariants: variants,
        objective: objective as Objective,
        toneUsed: tone as Tone,
        lengthUsed: length as PostLength,
      });
      await postsApi.validate(postRes.data.id);
      await postsApi.publishNow(postRes.data.id);
      toast.success('Publié sur Facebook !');
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
        pageId: selectedPageId,
        content: editedContent,
        contentVariants: variants,
        objective: objective as Objective,
        toneUsed: tone as Tone,
        lengthUsed: length as PostLength,
      });
      await postsApi.schedule(postRes.data.id, new Date(scheduledFor).toISOString());
      setScheduleModal(false);
      toast.success('Post programmé !');
    } catch {
      toast.error('Erreur de programmation');
    } finally {
      setSaving(false);
    }
  };

  const hasNoPages = pages.length === 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {hasNoPages && (
        <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-800">Aucune page Facebook connectée</p>
            <p className="text-sm text-yellow-700 mt-0.5">
              Vous devez d'abord connecter une page Facebook et configurer son profil business.{' '}
              <a href="/dashboard/pages" className="underline font-medium">Connecter une page →</a>
            </p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Generator form */}
        <div className="lg:col-span-2 space-y-4">
          <Card padding="md">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-indigo-600" />
              </div>
              <h2 className="font-semibold text-gray-900">Générateur IA</h2>
            </div>

            <form onSubmit={handleSubmit(onGenerate)} className="space-y-4">
              {/* Page selector */}
              <Select
                label="Page Facebook"
                options={pages.map((p) => ({ value: p.id, label: p.pageName }))}
                placeholder="Choisir une page..."
                error={errors.pageId?.message}
                {...register('pageId')}
              />

              {/* Theme */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Thème du post <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm resize-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                  rows={3}
                  placeholder="Ex: Promotion de notre service, conseil du jour, présentation d'un produit..."
                  {...register('theme')}
                />
                {errors.theme && <p className="text-xs text-red-500 mt-1">{errors.theme.message}</p>}
              </div>

              {/* Tone selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ton</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {TONES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setTone(t.value)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 text-xs font-medium transition-all ${
                        tone === t.value
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-base">{t.emoji}</span>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Length selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Longueur</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {LENGTHS.map((l) => (
                    <button
                      key={l.value}
                      type="button"
                      onClick={() => setLength(l.value)}
                      className={`flex flex-col items-center gap-0.5 p-2 rounded-xl border-2 text-xs font-medium transition-all ${
                        length === l.value
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <span>{l.emoji} {l.label}</span>
                      <span className="text-gray-400 font-normal">{l.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Objective */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Objectif</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {OBJECTIVES.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => setObjective(o.value)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border-2 text-xs font-medium transition-all ${
                        objective === o.value
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {o.emoji} {o.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Variants count */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de variantes : <span className="text-indigo-600">{watch('variantsCount')}</span>
                </label>
                <input
                  type="range"
                  min={1} max={10}
                  className="w-full accent-indigo-600"
                  {...register('variantsCount', { valueAsNumber: true })}
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>1</span><span>5</span><span>10</span>
                </div>
              </div>

              {/* Custom instructions */}
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

              <Button
                type="submit"
                loading={generating}
                disabled={hasNoPages}
                className="w-full"
                size="lg"
              >
                <Sparkles className="h-4 w-4" />
                {generating ? 'Génération en cours...' : 'Générer avec Claude AI'}
              </Button>
            </form>
          </Card>
        </div>

        {/* Preview & variants */}
        <div className="lg:col-span-3 space-y-4">
          {variants.length === 0 ? (
            <Card padding="lg" className="flex flex-col items-center justify-center min-h-[400px] text-center border-dashed border-2 border-gray-200 bg-gray-50">
              <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 text-indigo-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Votre publication apparaîtra ici
              </h3>
              <p className="text-sm text-gray-500 max-w-sm">
                Configurez les paramètres et cliquez sur "Générer" pour créer automatiquement votre post Facebook.
              </p>
            </Card>
          ) : (
            <>
              {/* Variant tabs */}
              {variants.length > 1 && (
                <div className="flex gap-2">
                  {variants.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleVariantSelect(idx)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        selectedVariant === idx
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'
                      }`}
                    >
                      {selectedVariant === idx && <Check className="h-3.5 w-3.5" />}
                      Variante {idx + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => handleSubmit(onGenerate)()}
                    disabled={generating}
                    className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:border-indigo-300 transition-all"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${generating ? 'animate-spin' : ''}`} />
                    Régénérer
                  </button>
                </div>
              )}

              {/* Facebook preview */}
              <Card padding="none" className="overflow-hidden">
                <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 flex items-center gap-2">
                  <Facebook className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Aperçu Facebook</span>
                  {variants[selectedVariant]?.hook && (
                    <Badge variant="info" className="ml-auto">
                      Hook: {variants[selectedVariant].hook.substring(0, 30)}...
                    </Badge>
                  )}
                </div>
                <div className="p-6">
                  {/* FB post mock */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Facebook className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Votre Page</p>
                      <p className="text-xs text-gray-400">Il y a quelques secondes · 🌍</p>
                    </div>
                  </div>

                  {/* Editable content */}
                  <Textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    rows={10}
                    className="border-0 bg-transparent p-0 text-sm text-gray-800 leading-relaxed resize-none focus:ring-0 font-inherit"
                    placeholder="Le contenu généré apparaîtra ici..."
                  />

                  {/* Image placeholder */}
                  <div className="mt-4 border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center gap-2 text-gray-400 hover:border-indigo-300 hover:text-indigo-400 cursor-pointer transition-colors">
                    <ImagePlus className="h-6 w-6" />
                    <span className="text-xs">Ajouter une image ou vidéo</span>
                  </div>

                  {/* FB reactions mock */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>👍 ❤️ 😮</span>
                      <span>42 réactions</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>8 commentaires</span>
                      <span>3 partages</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Metadata */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="info">{getToneLabel(tone)}</Badge>
                <Badge variant="purple">{getLengthLabel(length)}</Badge>
                <Badge variant="default">{getObjectiveLabel(objective)}</Badge>
                <span className="text-xs text-gray-400 self-center">{editedContent.split(' ').length} mots</span>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 flex-wrap">
                <Button variant="ghost" onClick={handleCopy} size="sm">
                  <Copy className="h-4 w-4" />
                  Copier
                </Button>
                <Button variant="ghost" onClick={() => handleSubmit(onGenerate)()} size="sm" disabled={generating}>
                  <RefreshCw className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
                  Régénérer
                </Button>
                <Button variant="outline" onClick={handleSaveDraft} loading={saving} size="sm">
                  <Save className="h-4 w-4" />
                  Sauvegarder brouillon
                </Button>
                <Button variant="secondary" onClick={() => setScheduleModal(true)} size="sm">
                  <Calendar className="h-4 w-4" />
                  Programmer
                </Button>
                <Button onClick={handlePublishNow} loading={saving} size="sm">
                  <Send className="h-4 w-4" />
                  Publier maintenant
                </Button>
              </div>

              {/* CTA in variant */}
              {variants[selectedVariant]?.cta && (
                <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                  <p className="text-xs text-green-700">
                    <span className="font-semibold">CTA détecté : </span>{variants[selectedVariant].cta}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Schedule modal */}
      <Modal
        open={scheduleModal}
        onClose={() => setScheduleModal(false)}
        title="Programmer la publication"
        description="Choisissez la date et l'heure de publication"
      >
        <div className="space-y-4">
          <Input
            label="Date et heure"
            type="datetime-local"
            value={scheduledFor}
            onChange={(e) => setScheduledFor(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
          />
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setScheduleModal(false)} className="flex-1">
              Annuler
            </Button>
            <Button onClick={handleSchedule} loading={saving} className="flex-1">
              <Calendar className="h-4 w-4" />
              Confirmer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

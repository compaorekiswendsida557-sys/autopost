'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Sparkles, Edit3, Calendar, CheckCircle, Plus, Minus,
  Clock, Trash2, ChevronRight, Loader2, AlertCircle, ImageIcon, GripVertical,
  Pause, Play, Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PostEditorModal } from '@/components/editor/PostEditorModal';
import { aiApi, postsApi, facebookApi } from '@/lib/api';
import toast from 'react-hot-toast';
import type { FacebookPage, PostVariant } from '@/types';

/* ─── Helpers ─── */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
}

function computeSlots(startDate: string, times: string[], total: number) {
  const slots: { date: Date; label: string }[] = [];
  const now = new Date();
  let day = new Date(startDate + 'T00:00:00');
  while (slots.length < total) {
    for (const t of [...times].sort()) {
      if (slots.length >= total) break;
      const [h, m] = t.split(':').map(Number);
      const slot = new Date(day);
      slot.setHours(h, m, 0, 0);
      if (slot > now) slots.push({ date: slot, label: format(slot, "EEE dd MMM · HH'h'mm", { locale: fr }) });
    }
    day = new Date(day.getTime() + 86_400_000);
  }
  return slots;
}

function wordStats(content: string) {
  const text = stripHtml(content);
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.length;
  const readTime = Math.max(1, Math.ceil(words / 200));
  return { words, chars, readTime };
}

/* ─── Types ─── */
interface BulkPost { content: string; imageUrl: string; validated: boolean }

/* ─── Constants ─── */
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
  { id: 1, label: 'Générer', icon: Sparkles },
  { id: 2, label: 'Éditer & Valider', icon: Edit3 },
  { id: 3, label: 'Planifier', icon: Calendar },
  { id: 4, label: 'Programmer', icon: CheckCircle },
];

const PRECISION_SHORTCUTS = [
  { label: 'Formel', hint: 'Langage professionnel', append: 'Utilise un ton professionnel et formel.' },
  { label: 'Créatif', hint: 'Métaphores & originalité', append: 'Sois créatif et original, utilise des métaphores.' },
  { label: 'Concis', hint: 'Direct et efficace', append: 'Sois très concis et va à l\'essentiel.' },
  { label: 'Engageant', hint: 'Questions & interaction', append: 'Pose des questions pour engager la communauté.' },
  { label: 'Humoristique', hint: 'Léger et emojis', append: 'Ajoute de l\'humour léger et des emojis pertinents.' },
];

const MOTION_MESSAGES = [
  '✨ Générez jusqu\'à 10 posts en quelques secondes',
  '📅 Planification automatique sur plusieurs jours',
  '🎨 Éditeur riche avec aperçu Facebook réel',
  '🚀 Drag & Drop pour réorganiser votre planning',
  '🤖 Propulsé par Google Gemini AI',
];

const PARTICLES = [
  { w: 10, h: 10, l: 4, t: 15, dur: 3.2, del: 0 },
  { w: 6, h: 6, l: 12, t: 65, dur: 2.6, del: 0.4 },
  { w: 14, h: 14, l: 22, t: 40, dur: 4.0, del: 0.8 },
  { w: 8, h: 8, l: 33, t: 80, dur: 3.5, del: 1.2 },
  { w: 12, h: 12, l: 45, t: 20, dur: 2.9, del: 0.3 },
  { w: 6, h: 6, l: 55, t: 55, dur: 3.8, del: 1.6 },
  { w: 16, h: 16, l: 65, t: 30, dur: 4.2, del: 0.7 },
  { w: 8, h: 8, l: 74, t: 70, dur: 3.1, del: 0.9 },
  { w: 10, h: 10, l: 82, t: 45, dur: 2.7, del: 1.4 },
  { w: 6, h: 6, l: 90, t: 25, dur: 3.6, del: 0.2 },
  { w: 12, h: 12, l: 96, t: 60, dur: 4.4, del: 1.0 },
];

/* ─── Motion Banner ─── */
function MotionBanner() {
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [msgIdx, setMsgIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!playing) return;
    const ms = 3000 / speed;
    const timer = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setMsgIdx(i => (i + 1) % MOTION_MESSAGES.length);
        setVisible(true);
      }, 300);
    }, ms);
    return () => clearInterval(timer);
  }, [playing, speed]);

  return (
    <>
      <style>{`
        @keyframes floatUp {
          0%, 100% { transform: translateY(0px) scale(1); opacity: 0.15; }
          50% { transform: translateY(-12px) scale(1.1); opacity: 0.25; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .banner-msg { transition: opacity 0.3s ease, transform 0.3s ease; }
        .banner-msg.hidden { opacity: 0; transform: translateY(6px); }
        .banner-msg.shown { opacity: 1; transform: translateY(0); }
      `}</style>
      <div className="relative overflow-hidden rounded-2xl mb-6"
        style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #db2777 100%)' }}>
        {/* Particles */}
        {PARTICLES.map((p, i) => (
          <div key={i} className="absolute rounded-full bg-white pointer-events-none"
            style={{
              width: p.w, height: p.h,
              left: `${p.l}%`, top: `${p.t}%`,
              animation: `floatUp ${p.dur}s ease-in-out ${p.del}s infinite`,
            }} />
        ))}

        {/* Content */}
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-white/70 text-xs font-medium mb-0.5">Publication en masse</p>
              <p className={`text-white font-semibold text-sm banner-msg ${visible ? 'shown' : 'hidden'}`}>
                {MOTION_MESSAGES[msgIdx]}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setSpeed(s => Math.max(0.5, +(s - 0.5).toFixed(1)))}
              className="w-7 h-7 rounded-lg bg-white/10 text-white text-sm hover:bg-white/20 transition-colors flex items-center justify-center font-bold"
            >−</button>
            <span className="text-white/60 text-xs w-6 text-center">{speed}x</span>
            <button
              onClick={() => setSpeed(s => Math.min(3, +(s + 0.5).toFixed(1)))}
              className="w-7 h-7 rounded-lg bg-white/10 text-white text-sm hover:bg-white/20 transition-colors flex items-center justify-center font-bold"
            >+</button>

            {/* Play/Pause with shimmer */}
            <button
              onClick={() => setPlaying(p => !p)}
              className="relative overflow-hidden flex items-center gap-1.5 px-4 py-2 bg-white text-indigo-600 rounded-xl text-xs font-bold hover:shadow-lg transition-all ml-1"
            >
              <span className="relative z-10 flex items-center gap-1.5">
                {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                {playing ? 'Pause' : 'Play'}
              </span>
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-100/60 to-transparent"
                style={{ animation: 'shimmer 2s infinite', transform: 'skewX(-20deg)' }} />
            </button>
          </div>
        </div>

        {/* Progress dots */}
        <div className="relative z-10 flex items-center justify-center gap-1.5 pb-3">
          {MOTION_MESSAGES.map((_, i) => (
            <button key={i} onClick={() => { setMsgIdx(i); setVisible(true); }}
              className={`rounded-full transition-all ${i === msgIdx ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/30 hover:bg-white/50'}`} />
          ))}
        </div>
      </div>
    </>
  );
}

/* ─── Precision Prompt ─── */
function PrecisionPrompt({ customInstructions, onChange }: { customInstructions: string; onChange: (v: string) => void }) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggleShortcut = (shortcut: typeof PRECISION_SHORTCUTS[0]) => {
    const isSelected = selected.includes(shortcut.label);
    const newSelected = isSelected
      ? selected.filter(s => s !== shortcut.label)
      : [...selected, shortcut.label];
    setSelected(newSelected);

    let base = customInstructions;
    if (isSelected) {
      base = base.replace(' ' + shortcut.append, '').replace(shortcut.append, '').trim();
    } else {
      base = base ? base + ' ' + shortcut.append : shortcut.append;
    }
    onChange(base.trim());
  };

  return (
    <div className="mb-4 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-indigo-500" />
        <span className="text-sm font-semibold text-indigo-900">Prompt de précision</span>
        <span className="text-xs text-indigo-500">Affinez le style de vos publications</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {PRECISION_SHORTCUTS.map((s) => {
          const active = selected.includes(s.label);
          return (
            <button
              key={s.label}
              type="button"
              onClick={() => toggleShortcut(s)}
              title={s.hint}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                active
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
              }`}
            >
              {active ? '✓ ' : ''}{s.label}
            </button>
          );
        })}
      </div>
      {selected.length > 0 && (
        <p className="text-xs text-indigo-600 mt-2 italic">
          Style appliqué : {selected.join(', ')}
        </p>
      )}
    </div>
  );
}

/* ─── Post Stats ─── */
function PostStats({ content }: { content: string }) {
  const { words, chars, readTime } = wordStats(content);
  return (
    <div className="flex items-center gap-2 text-xs text-gray-400 mt-1.5">
      <span className="flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-300 inline-block" />
        {words} mots
      </span>
      <span>·</span>
      <span>{chars} car.</span>
      <span>·</span>
      <span>{readTime} min</span>
    </div>
  );
}

/* ─── Step Bar ─── */
function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center mb-8 overflow-x-auto">
      {STEPS.map((s, i) => {
        const done = current > s.id;
        const active = current === s.id;
        return (
          <div key={s.id} className="flex items-center flex-shrink-0">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              active ? 'bg-indigo-600 text-white shadow-sm' :
              done ? 'bg-green-100 text-green-700' :
              'bg-gray-100 text-gray-400'
            }`}>
              {done ? <CheckCircle className="h-3.5 w-3.5" /> : <s.icon className="h-3.5 w-3.5 flex-shrink-0" />}
              <span className="hidden sm:block">{s.label}</span>
              <span className="sm:hidden">{s.id}</span>
            </div>
            {i < STEPS.length - 1 && <ChevronRight className="h-4 w-4 text-gray-300 mx-1 flex-shrink-0" />}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Main ─── */
export default function BulkPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Step 1 — Generation
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [selectedPage, setSelectedPage] = useState<FacebookPage | null>(null);
  const [pageId, setPageId] = useState('');
  const [theme, setTheme] = useState('');
  const [tone, setTone] = useState('PROFESSIONAL');
  const [length, setLength] = useState('MEDIUM');
  const [objective, setObjective] = useState('ENGAGEMENT');
  const [count, setCount] = useState(5);
  const [customInstructions, setCustomInstructions] = useState('');
  const [generating, setGenerating] = useState(false);

  // Step 2 — Edit
  const [posts, setPosts] = useState<BulkPost[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Step 3 — Schedule
  const [startDate, setStartDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [times, setTimes] = useState(['08:00', '14:00', '20:00']);
  const [slots, setSlots] = useState<{ date: Date; label: string }[]>([]);

  // Step 4 — Drag & confirm
  const dragIdx = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    facebookApi.listPages().then((res) => {
      const p: FacebookPage[] = res.data?.pages || res.data || [];
      setPages(p);
      if (p.length) { setPageId(p[0].id); setSelectedPage(p[0]); }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (posts.length > 0) setSlots(computeSlots(startDate, times, posts.length));
  }, [startDate, times, posts.length]);

  const handleGenerate = async () => {
    if (!pageId) return toast.error('Sélectionnez une page');
    if (!theme.trim()) return toast.error('Décrivez le thème des posts');
    setGenerating(true);
    try {
      const res = await aiApi.generate({ pageId, theme, tone, length, objective, variantsCount: count, customInstructions: customInstructions || undefined });
      const variants: PostVariant[] = res.data.variants || res.data;
      setPosts(variants.map((v) => ({ content: v.text, imageUrl: '', validated: false })));
      setSlots(computeSlots(startDate, times, variants.length));
      setStep(2);
    } catch {
      toast.error('Erreur de génération IA');
    } finally {
      setGenerating(false);
    }
  };

  const handleEditorSave = (index: number, content: string, imageUrl: string) => {
    const next = [...posts];
    next[index] = { ...next[index], content, imageUrl, validated: true };
    setPosts(next);
    toast.success(`Post #${index + 1} validé !`);
  };

  const addTime = () => { if (times.length < 10) setTimes([...times, '12:00']); };
  const removeTime = (i: number) => { if (times.length > 1) setTimes(times.filter((_, idx) => idx !== i)); };
  const updateTime = (i: number, v: string) => setTimes(times.map((t, idx) => idx === i ? v : t));

  const onDrop = (i: number) => {
    if (dragIdx.current === null || dragIdx.current === i) { setDragOver(null); return; }
    const next = [...posts];
    const [moved] = next.splice(dragIdx.current, 1);
    next.splice(i, 0, moved);
    setPosts(next);
    dragIdx.current = null;
    setDragOver(null);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await postsApi.bulkSchedule({
        pageId,
        posts: posts.map((p) => ({
          content: stripHtml(p.content) || p.content,
          richContent: p.content,
          imageUrl: p.imageUrl || undefined,
          toneUsed: tone,
          lengthUsed: length,
          objective,
          aiPromptUsed: theme,
        })),
        startDate,
        times,
      });
      toast.success(`${posts.length} publications programmées !`);
      router.push('/dashboard/calendar');
    } catch {
      toast.error('Erreur lors de la programmation');
    } finally {
      setSubmitting(false);
    }
  };

  const validatedCount = posts.filter((p) => p.validated).length;
  const minDate = format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Publication en masse</h2>
        <p className="text-sm text-gray-500">Générez, éditez et programmez jusqu'à 10 publications en une fois</p>
      </div>

      {/* Motion Banner */}
      <MotionBanner />

      <StepBar current={step} />

      {/* ══ STEP 1 : Génération ══ */}
      {step === 1 && (
        <div className="space-y-5">
          <Card padding="lg">
            <h3 className="font-semibold text-gray-900 mb-4">Configuration du contenu</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Page Facebook</label>
              <select
                value={pageId}
                onChange={(e) => { setPageId(e.target.value); setSelectedPage(pages.find(p => p.id === e.target.value) || null); }}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {pages.map((p) => <option key={p.id} value={p.id}>{p.pageName}</option>)}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Thème des publications</label>
              <textarea
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="Ex: Promotion de nos services, conseils beauté, offre de la semaine…"
                rows={2}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            {/* Precision Prompt */}
            <PrecisionPrompt customInstructions={customInstructions} onChange={setCustomInstructions} />

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Ton</label>
              <div className="flex flex-wrap gap-2">
                {TONES.map((t) => (
                  <button key={t.value} type="button" onClick={() => setTone(t.value)}
                    className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-all ${tone === t.value ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'}`}>
                    {t.emoji} {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Longueur</label>
              <div className="flex gap-2">
                {LENGTHS.map((l) => (
                  <button key={l.value} type="button" onClick={() => setLength(l.value)}
                    className={`flex-1 px-3 py-2 rounded-xl text-sm border transition-all text-left ${length === l.value ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'}`}>
                    <div className="font-medium">{l.emoji} {l.label}</div>
                    <div className={`text-xs ${length === l.value ? 'text-indigo-200' : 'text-gray-400'}`}>{l.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Objectif</label>
              <div className="flex flex-wrap gap-2">
                {OBJECTIVES.map((o) => (
                  <button key={o.value} type="button" onClick={() => setObjective(o.value)}
                    className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-all ${objective === o.value ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'}`}>
                    {o.emoji} {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de publications</label>
              <div className="flex items-center gap-4">
                <button type="button" onClick={() => setCount(Math.max(1, count - 1))} className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
                  <Minus className="h-4 w-4 text-gray-600" />
                </button>
                <span className="text-2xl font-bold text-indigo-600 w-8 text-center">{count}</span>
                <button type="button" onClick={() => setCount(Math.min(10, count + 1))} className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
                  <Plus className="h-4 w-4 text-gray-600" />
                </button>
                <span className="text-sm text-gray-400">max 10</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Instructions spéciales <span className="text-gray-400 font-normal">(optionnel)</span></label>
              <input type="text" value={customInstructions} onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="Ex: Mentionner une promo -20%, utiliser des emojis…"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleGenerate} disabled={generating} size="lg">
              {generating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
              {generating ? `Génération de ${count} posts…` : `Générer ${count} publications`}
            </Button>
          </div>
        </div>
      )}

      {/* ══ STEP 2 : Édition & Validation ══ */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-xl">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${validatedCount === posts.length ? 'bg-green-100 text-green-700' : 'bg-indigo-100 text-indigo-700'}`}>
                {validatedCount}/{posts.length}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {validatedCount === posts.length ? 'Tous les posts validés ✓' : `${posts.length - validatedCount} post${posts.length - validatedCount > 1 ? 's' : ''} à éditer`}
                </p>
                <p className="text-xs text-gray-500">Cliquez "Éditer" pour ouvrir l'éditeur complet</p>
              </div>
            </div>
            <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: `${(validatedCount / posts.length) * 100}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {posts.map((post, i) => (
              <div key={i} className={`relative bg-white border-2 rounded-xl p-4 transition-all ${post.validated ? 'border-green-200 bg-green-50/30' : 'border-gray-100 hover:border-indigo-200'}`}>
                <div className="flex items-start justify-between mb-2">
                  <span className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                    {i + 1}
                  </span>
                  {post.validated ? (
                    <span className="flex items-center gap-1 text-xs text-green-600 font-medium bg-green-100 px-2 py-0.5 rounded-full">
                      <CheckCircle className="h-3 w-3" /> Validé
                    </span>
                  ) : (
                    <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">À réviser</span>
                  )}
                </div>

                <p className="text-xs text-gray-600 line-clamp-3 mb-1 leading-relaxed"
                   dangerouslySetInnerHTML={{ __html: post.content.substring(0, 150) + (post.content.length > 150 ? '…' : '') }} />

                {/* Real-time stats */}
                <PostStats content={post.content} />

                {post.imageUrl && (
                  <div className="flex items-center gap-1.5 my-2">
                    <ImageIcon className="h-3.5 w-3.5 text-indigo-500" />
                    <span className="text-xs text-indigo-600">Image ajoutée</span>
                    <img src={post.imageUrl} alt="" className="w-8 h-8 rounded object-cover border border-gray-200" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                )}

                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => setEditingIndex(i)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Éditer
                  </button>
                  <button
                    onClick={() => setPosts(posts.filter((_, idx) => idx !== i))}
                    className="p-2 text-gray-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2">
            <button onClick={() => setStep(1)} className="text-sm text-gray-500 hover:text-gray-700">← Retour</button>
            <div className="flex items-center gap-3">
              {validatedCount < posts.length && (
                <span className="text-xs text-amber-600">{posts.length - validatedCount} post(s) non validés</span>
              )}
              <Button onClick={() => setStep(3)} disabled={posts.length === 0} size="lg">
                Planifier <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ══ STEP 3 : Planification ══ */}
      {step === 3 && (
        <div className="space-y-5">
          <Card padding="lg">
            <h3 className="font-semibold text-gray-900 mb-4">Configuration du planning</h3>

            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Date de début</label>
              <input type="date" value={startDate} min={minDate} onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>

            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Horaires de publication</label>
                <button type="button" onClick={addTime} disabled={times.length >= 10}
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 disabled:opacity-40">
                  <Plus className="h-3.5 w-3.5" /> Ajouter
                </button>
              </div>
              <div className="space-y-2">
                {times.map((t, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <input type="time" value={t} onChange={(e) => updateTime(i, e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    <span className="text-sm text-gray-500">Slot {i + 1}</span>
                    {times.length > 1 && (
                      <button onClick={() => removeTime(i)} className="ml-auto text-gray-300 hover:text-red-500 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {times.length} publication{times.length > 1 ? 's' : ''}/jour · {posts.length} posts → {Math.ceil(posts.length / times.length)} jour{Math.ceil(posts.length / times.length) > 1 ? 's' : ''} nécessaire{Math.ceil(posts.length / times.length) > 1 ? 's' : ''}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Aperçu des créneaux</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {slots.map((slot, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 bg-indigo-50 rounded-lg text-sm">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">{i + 1}</span>
                    <span className="text-indigo-800 capitalize">{slot.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <div className="flex items-center justify-between">
            <button onClick={() => setStep(2)} className="text-sm text-gray-500 hover:text-gray-700">← Retour</button>
            <Button onClick={() => setStep(4)} size="lg">
              Confirmer <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ══ STEP 4 : Confirmation & Programmation ══ */}
      {step === 4 && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
            <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700">Glissez-déposez pour réorganiser l'ordre. Cliquez "Éditer" pour des retouches de dernière minute.</p>
          </div>

          <div className="space-y-2">
            {posts.map((post, i) => {
              const stats = wordStats(post.content);
              return (
                <div
                  key={i}
                  draggable
                  onDragStart={() => { dragIdx.current = i; }}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(i); }}
                  onDrop={() => onDrop(i)}
                  onDragEnd={() => setDragOver(null)}
                  className={`flex gap-3 p-4 bg-white border-2 rounded-xl transition-all cursor-grab active:cursor-grabbing ${
                    dragOver === i ? 'border-indigo-400 bg-indigo-50 scale-[1.01]' : post.validated ? 'border-green-200' : 'border-gray-100'
                  }`}
                >
                  <div className="flex-shrink-0 flex flex-col items-center gap-2 pt-1">
                    <GripVertical className="h-4 w-4 text-gray-300" />
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">{i + 1}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 line-clamp-2"
                       dangerouslySetInnerHTML={{ __html: post.content.substring(0, 120) + (post.content.length > 120 ? '…' : '') }} />
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      {slots[i] && (
                        <span className="flex items-center gap-1 text-xs text-purple-600">
                          <Clock className="h-3 w-3" /> <span className="capitalize">{slots[i].label}</span>
                        </span>
                      )}
                      <span className="text-xs text-gray-400">{stats.words} mots · {stats.readTime} min</span>
                      {post.imageUrl && <span className="text-xs text-indigo-500 flex items-center gap-1"><ImageIcon className="h-3 w-3" /> Image</span>}
                      {post.validated && <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Validé</span>}
                    </div>
                  </div>

                  <div className="flex items-start gap-1 flex-shrink-0">
                    <button onClick={() => setEditingIndex(i)} className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors rounded-lg hover:bg-indigo-50">
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button onClick={() => setPosts(posts.filter((_, idx) => idx !== i))} className="p-1.5 text-gray-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {posts.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-sm">Aucun post restant.</p>
              <button onClick={() => setStep(1)} className="mt-2 text-sm text-indigo-600 hover:text-indigo-800">Recommencer</button>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button onClick={() => setStep(3)} className="text-sm text-gray-500 hover:text-gray-700">← Retour</button>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">{posts.length} post{posts.length > 1 ? 's' : ''}</span>
              <Button onClick={handleSubmit} disabled={submitting || posts.length === 0} size="lg">
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle className="h-5 w-5" />}
                {submitting ? 'Programmation…' : 'Programmer tout 🚀'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Editor Modal */}
      {editingIndex !== null && (
        <PostEditorModal
          open={editingIndex !== null}
          onClose={() => setEditingIndex(null)}
          index={editingIndex}
          content={posts[editingIndex]?.content || ''}
          imageUrl={posts[editingIndex]?.imageUrl || ''}
          slotLabel={slots[editingIndex]?.label}
          pageName={selectedPage?.pageName || 'Ma Page'}
          pageAvatar={selectedPage?.pictureUrl}
          onSave={(content, imageUrl) => handleEditorSave(editingIndex, content, imageUrl)}
        />
      )}
    </div>
  );
}

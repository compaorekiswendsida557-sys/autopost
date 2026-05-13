'use client';

import { useEffect, useState } from 'react';
import {
  Facebook, Settings, Trash2, ExternalLink, Users, CheckCircle,
  AlertCircle, Link2, RefreshCw, Globe, ChevronRight, ShieldCheck,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { PageLoader } from '@/components/ui/spinner';
import { facebookApi } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import type { FacebookPage } from '@/types';
import toast from 'react-hot-toast';

const TONE_OPTIONS = [
  { value: 'PROFESSIONAL', label: 'Professionnel' },
  { value: 'SELLER', label: 'Vendeur' },
  { value: 'MOTIVATION', label: 'Motivation' },
  { value: 'FUNNY', label: 'Drôle' },
  { value: 'EDUCATIONAL', label: 'Éducatif' },
];

const META_PERMISSIONS = [
  { perm: 'pages_show_list', desc: 'Voir la liste de vos pages' },
  { perm: 'pages_read_engagement', desc: 'Lire les statistiques' },
  { perm: 'pages_manage_posts', desc: 'Publier du contenu' },
  { perm: 'pages_manage_metadata', desc: 'Gérer les métadonnées' },
];

export default function PagesPage() {
  const { user, refreshUser } = useAuth();
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [configModal, setConfigModal] = useState<FacebookPage | null>(null);
  const [configLoading, setConfigLoading] = useState(false);
  const [setupGuide, setSetupGuide] = useState(false);
  const [config, setConfig] = useState({
    businessName: '', activity: '', mainTheme: '', tone: 'PROFESSIONAL',
    slogan: '', whatsapp: '', phone: '', email: '', address: '',
    hashtags: '', language: 'fr',
  });

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    setLoading(true);
    try {
      const res = await facebookApi.listPages();
      setPages(res.data?.pages || res.data || []);
    } catch {
      setPages(user?.facebookPages || []);
    } finally {
      setLoading(false);
    }
  };

  /* ── Popup OAuth ── */
  const handleConnectFacebook = async () => {
    setConnecting(true);
    try {
      const res = await facebookApi.getAuthUrl();
      if (!res.data.url || res.data.url.includes('undefined')) {
        setSetupGuide(true);
        setConnecting(false);
        return;
      }

      const w = 620, h = 700;
      const left = window.screenX + (window.outerWidth - w) / 2;
      const top = window.screenY + (window.outerHeight - h) / 2;
      const popup = window.open(
        res.data.url,
        'facebook-oauth',
        `width=${w},height=${h},left=${left},top=${top},scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no`
      );

      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        if (event.data?.type === 'FB_OAUTH_SUCCESS') {
          window.removeEventListener('message', handleMessage);
          clearInterval(pollClosed);
          if (event.data.status === 'connected') {
            toast.success(`${event.data.count} page${event.data.count > 1 ? 's' : ''} connectée${event.data.count > 1 ? 's' : ''} !`);
            loadPages();
            refreshUser();
          } else {
            toast.error('Connexion Facebook échouée');
          }
          setConnecting(false);
        }
      };
      window.addEventListener('message', handleMessage);

      const pollClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(pollClosed);
          window.removeEventListener('message', handleMessage);
          setConnecting(false);
        }
      }, 500);

    } catch {
      toast.error('Erreur — vérifiez la configuration Meta API');
      setConnecting(false);
    }
  };

  const handleRefreshPages = async () => {
    toast.loading('Actualisation…', { id: 'refresh' });
    await loadPages();
    toast.success('Pages actualisées', { id: 'refresh' });
  };

  const handleOpenConfig = (page: FacebookPage) => {
    setConfigModal(page);
    const bp = page.businessProfile;
    setConfig({
      businessName: bp?.businessName || page.pageName,
      activity: bp?.activity || '',
      mainTheme: bp?.mainTheme || '',
      tone: bp?.tone || 'PROFESSIONAL',
      slogan: bp?.slogan || '',
      whatsapp: bp?.whatsapp || '',
      phone: bp?.phone || '',
      email: bp?.email || '',
      address: bp?.address || '',
      hashtags: bp?.hashtags?.join(' ') || '',
      language: bp?.language || 'fr',
    });
  };

  const handleSaveConfig = async () => {
    if (!configModal) return;
    setConfigLoading(true);
    try {
      await facebookApi.updatePageConfig(configModal.id, {
        ...config,
        hashtags: config.hashtags.split(/\s+/).filter(Boolean),
      });
      toast.success('Profil sauvegardé !');
      setConfigModal(null);
      loadPages();
      refreshUser();
    } catch {
      toast.error('Erreur de sauvegarde');
    } finally {
      setConfigLoading(false);
    }
  };

  const handleDisconnect = async (pageId: string, pageName: string) => {
    if (!confirm(`Déconnecter "${pageName}" ? Les posts programmés ne seront pas supprimés.`)) return;
    try {
      await facebookApi.disconnectPage(pageId);
      toast.success('Page déconnectée');
      loadPages();
      refreshUser();
    } catch {
      toast.error('Erreur de déconnexion');
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="max-w-4xl space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Pages Facebook</h2>
          <p className="text-sm text-gray-500">Connectez vos pages et configurez leur profil IA</p>
        </div>
        <div className="flex gap-2">
          {pages.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleRefreshPages}>
              <RefreshCw className="h-4 w-4" />
              Actualiser
            </Button>
          )}
          <Button onClick={handleConnectFacebook} loading={connecting}>
            <Facebook className="h-4 w-4" />
            Connecter Facebook
          </Button>
        </div>
      </div>

      {/* ── Meta setup guide banner ── */}
      <div
        className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-2xl p-4 cursor-pointer hover:bg-blue-100/60 transition-colors"
        onClick={() => setSetupGuide(true)}
      >
        <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-blue-800">Configuration Meta App requise</p>
          <p className="text-xs text-blue-600 mt-0.5">
            Pour activer la connexion Facebook, vous avez besoin d'un App ID et App Secret Meta.
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
      </div>

      {/* ── Permissions info ── */}
      <Card padding="md">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="h-5 w-5 text-green-600" />
          <h3 className="text-sm font-semibold text-gray-800">Permissions demandées à Facebook</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {META_PERMISSIONS.map((p) => (
            <div key={p.perm} className="flex items-center gap-2 text-xs text-gray-600">
              <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
              <code className="text-indigo-600 bg-indigo-50 px-1 rounded">{p.perm}</code>
              <span>— {p.desc}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Pages list ── */}
      {pages.length === 0 ? (
        <Card padding="lg" className="text-center border-dashed border-2 border-gray-200">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Facebook className="h-10 w-10 text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Aucune page connectée</h3>
          <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
            Connectez votre compte Facebook — AutoPost détectera automatiquement toutes vos pages admin.
          </p>
          <Button onClick={handleConnectFacebook} loading={connecting} size="lg">
            <Facebook className="h-5 w-5" />
            Connecter mon compte Facebook
          </Button>
          <p className="text-xs text-gray-400 mt-3">Une fenêtre Facebook sécurisée va s'ouvrir</p>
        </Card>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">{pages.length} page{pages.length > 1 ? 's' : ''} connectée{pages.length > 1 ? 's' : ''}</p>
          {pages.map((page) => (
            <Card key={page.id} padding="none">
              <div className="flex items-start gap-4 p-5">
                {/* Avatar */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
                  {page.pictureUrl ? (
                    <img src={page.pictureUrl} alt={page.pageName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-white">{page.pageName[0]}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <h3 className="text-base font-bold text-gray-900 leading-tight">{page.pageName}</h3>
                      {page.category && <p className="text-xs text-gray-500 mt-0.5">{page.category}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                        page.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${page.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                        {page.isActive ? 'Connectée' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center gap-4 mt-2">
                    {page.followersCount > 0 && (
                      <div className="flex items-center gap-1.5 text-sm text-gray-500">
                        <Users className="h-3.5 w-3.5" />
                        <span>{page.followersCount.toLocaleString()} abonnés</span>
                      </div>
                    )}
                    {(page as any)._count?.posts > 0 && (
                      <div className="flex items-center gap-1.5 text-sm text-gray-500">
                        <Globe className="h-3.5 w-3.5" />
                        <span>{(page as any)._count.posts} posts</span>
                      </div>
                    )}
                  </div>

                  {/* Business profile status */}
                  {page.businessProfile ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {page.businessProfile.activity && (
                        <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">{page.businessProfile.activity}</span>
                      )}
                      {page.businessProfile.phone && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">📞 {page.businessProfile.phone}</span>
                      )}
                      {page.businessProfile.hashtags?.length > 0 && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"># {page.businessProfile.hashtags.length} hashtags</span>
                      )}
                      <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                        <CheckCircle className="h-3 w-3" /> Profil IA configuré
                      </span>
                    </div>
                  ) : (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg w-fit">
                      <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                      Configurez le profil business pour générer du contenu IA
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    <Button variant="secondary" size="sm" onClick={() => handleOpenConfig(page)}>
                      <Settings className="h-3.5 w-3.5" />
                      {page.businessProfile ? 'Modifier le profil' : 'Configurer le profil IA'}
                    </Button>
                    <a href={`https://facebook.com/${page.pageId}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-3.5 w-3.5" />
                        Voir sur Facebook
                      </Button>
                    </a>
                    <Button
                      variant="ghost" size="sm"
                      className="text-red-400 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDisconnect(page.id, page.pageName)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Déconnecter
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── Setup Guide Modal ── */}
      <Modal open={setupGuide} onClose={() => setSetupGuide(false)} title="Configuration Meta API" size="lg">
        <div className="space-y-5 text-sm">
          <p className="text-gray-600">Suivez ces étapes pour obtenir votre App ID et App Secret Meta :</p>

          {[
            { step: 1, title: 'Créer une application Meta', desc: 'Allez sur developers.facebook.com → Mes applications → Créer une application → Choisissez "Autre" → "Entreprise".' },
            { step: 2, title: 'Ajouter "Facebook Login"', desc: 'Dans votre application, cliquez "Ajouter un produit" → Trouvez "Facebook Login" → cliquez "Configurer".' },
            { step: 3, title: 'Configurer l\'URL de callback', desc: `Dans Facebook Login → Paramètres → URI de redirection OAuth valides, ajoutez exactement :\nhttp://localhost:4000/api/facebook/callback` },
            { step: 4, title: 'Copier App ID et App Secret', desc: 'Dans Paramètres → Général, copiez l\'ID de l\'application et la clé secrète.' },
            { step: 5, title: 'Mettre à jour le fichier .env', desc: 'Dans apps/api/.env, remplissez :\nMETA_APP_ID="votre_app_id"\nMETA_APP_SECRET="votre_app_secret"' },
            { step: 6, title: 'Redémarrer le serveur', desc: 'Arrêtez et relancez le serveur API. La connexion Facebook sera opérationnelle !' },
          ].map((s) => (
            <div key={s.step} className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{s.step}</div>
              <div>
                <p className="font-semibold text-gray-900">{s.title}</p>
                <pre className="text-gray-600 mt-0.5 whitespace-pre-wrap font-sans text-xs leading-relaxed">{s.desc}</pre>
              </div>
            </div>
          ))}

          <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
            <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button variant="secondary" className="w-full">
                <ExternalLink className="h-4 w-4" />
                Ouvrir Meta for Developers
              </Button>
            </a>
            <Button onClick={() => setSetupGuide(false)} className="flex-1">
              J'ai compris
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Business Profile Config Modal ── */}
      <Modal
        open={!!configModal}
        onClose={() => setConfigModal(null)}
        title={`Profil IA — ${configModal?.pageName}`}
        description="Ces informations sont intégrées automatiquement par l'IA dans chaque post généré."
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nom de l'entreprise" value={config.businessName}
              onChange={(e) => setConfig({ ...config, businessName: e.target.value })}
              placeholder="Ma Super Boutique" />
            <Input label="Activité / secteur" value={config.activity}
              onChange={(e) => setConfig({ ...config, activity: e.target.value })}
              placeholder="Vêtements, restauration…" />
          </div>
          <Input label="Thème principal" value={config.mainTheme}
            onChange={(e) => setConfig({ ...config, mainTheme: e.target.value })}
            placeholder="Mode africaine, cuisine sénégalaise…" />
          <Input label="Slogan" value={config.slogan}
            onChange={(e) => setConfig({ ...config, slogan: e.target.value })}
            placeholder="La qualité à votre service" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Téléphone" value={config.phone}
              onChange={(e) => setConfig({ ...config, phone: e.target.value })}
              placeholder="+226 70 00 00 00" />
            <Input label="WhatsApp" value={config.whatsapp}
              onChange={(e) => setConfig({ ...config, whatsapp: e.target.value })}
              placeholder="+226 70 00 00 00" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Email" value={config.email}
              onChange={(e) => setConfig({ ...config, email: e.target.value })}
              placeholder="contact@entreprise.com" />
            <Input label="Adresse" value={config.address}
              onChange={(e) => setConfig({ ...config, address: e.target.value })}
              placeholder="Ouagadougou, Burkina Faso" />
          </div>
          <Select label="Ton par défaut" options={TONE_OPTIONS} value={config.tone}
            onChange={(e) => setConfig({ ...config, tone: e.target.value })} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Hashtags automatiques</label>
            <input type="text" value={config.hashtags}
              onChange={(e) => setConfig({ ...config, hashtags: e.target.value })}
              placeholder="#business #mode #ouagadougou"
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <p className="text-xs text-gray-400 mt-1">Séparés par des espaces — ajoutés à chaque post généré</p>
          </div>
          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <Button variant="outline" onClick={() => setConfigModal(null)} className="flex-1">Annuler</Button>
            <Button onClick={handleSaveConfig} loading={configLoading} className="flex-1">
              <CheckCircle className="h-4 w-4" />
              Sauvegarder
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

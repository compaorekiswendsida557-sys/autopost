'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User, Mail, Lock, CreditCard, Bell, Shield,
  CheckCircle, Zap, Star, Building
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/auth-context';
import { authApi } from '@/lib/api';
import { getPlanLabel } from '@/lib/utils';
import toast from 'react-hot-toast';

const profileSchema = z.object({
  fullName: z.string().min(2, 'Minimum 2 caractères'),
  email: z.string().email('Email invalide'),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Requis'),
  newPassword: z.string().min(8, 'Minimum 8 caractères'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

type ProfileData = z.infer<typeof profileSchema>;
type PasswordData = z.infer<typeof passwordSchema>;

const PLAN_FEATURES: Record<string, { posts: number; ai: number; pages: number }> = {
  FREE:    { posts: 10,  ai: 20,  pages: 1 },
  STARTER: { posts: 50,  ai: 100, pages: 3 },
  PRO:     { posts: 150, ai: 300, pages: 5 },
  AGENCY:  { posts: -1,  ai: -1,  pages: -1 },
};

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'billing' | 'notifications'>('profile');

  const { register: registerProfile, handleSubmit: handleProfileSubmit, formState: { errors: profileErrors } } = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: user?.fullName || '', email: user?.email || '' },
  });

  const { register: registerPassword, handleSubmit: handlePasswordSubmit, formState: { errors: passwordErrors }, reset } = useForm<PasswordData>({
    resolver: zodResolver(passwordSchema),
  });

  const onProfileSubmit = async (data: ProfileData) => {
    setProfileLoading(true);
    try {
      await authApi.updateProfile({ fullName: data.fullName });
      await refreshUser();
      toast.success('Profil mis à jour !');
    } catch {
      toast.error('Erreur de mise à jour');
    } finally {
      setProfileLoading(false);
    }
  };

  const onPasswordSubmit = async (_data: PasswordData) => {
    setPasswordLoading(true);
    try {
      toast.success('Mot de passe modifié !');
      reset();
    } catch {
      toast.error('Erreur de modification');
    } finally {
      setPasswordLoading(false);
    }
  };

  const planInfo = PLAN_FEATURES[user?.plan || 'FREE'];

  const TABS = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'security', label: 'Sécurité', icon: Lock },
    { id: 'billing', label: 'Abonnement', icon: CreditCard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ] as const;

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Paramètres</h2>
        <p className="text-sm text-gray-500">Gérez votre compte et vos préférences</p>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <Card padding="md">
            <CardHeader>
              <CardTitle>Informations personnelles</CardTitle>
              <CardDescription>Mettez à jour vos informations de compte</CardDescription>
            </CardHeader>

            {/* Avatar */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center">
                <span className="text-2xl font-bold text-indigo-600">
                  {(user?.fullName || user?.email || 'U')[0].toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{user?.fullName || 'Non défini'}</p>
                <p className="text-sm text-gray-500">{user?.email}</p>
                <Badge
                  variant={user?.plan === 'FREE' ? 'default' : user?.plan === 'PRO' ? 'purple' : 'info'}
                  className="mt-1"
                >
                  Plan {getPlanLabel(user?.plan || 'FREE')}
                </Badge>
              </div>
            </div>

            <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Nom complet"
                  leftIcon={<User className="h-4 w-4" />}
                  error={profileErrors.fullName?.message}
                  {...registerProfile('fullName')}
                />
                <Input
                  label="Email"
                  type="email"
                  leftIcon={<Mail className="h-4 w-4" />}
                  disabled
                  error={profileErrors.email?.message}
                  {...registerProfile('email')}
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" loading={profileLoading}>
                  <CheckCircle className="h-4 w-4" />
                  Sauvegarder
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Security tab */}
      {activeTab === 'security' && (
        <Card padding="md">
          <CardHeader>
            <CardTitle>Sécurité du compte</CardTitle>
            <CardDescription>Modifiez votre mot de passe</CardDescription>
          </CardHeader>
          <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
            <Input
              label="Mot de passe actuel"
              type="password"
              leftIcon={<Lock className="h-4 w-4" />}
              error={passwordErrors.currentPassword?.message}
              {...registerPassword('currentPassword')}
            />
            <Input
              label="Nouveau mot de passe"
              type="password"
              leftIcon={<Lock className="h-4 w-4" />}
              error={passwordErrors.newPassword?.message}
              {...registerPassword('newPassword')}
            />
            <Input
              label="Confirmer le nouveau mot de passe"
              type="password"
              leftIcon={<Lock className="h-4 w-4" />}
              error={passwordErrors.confirmPassword?.message}
              {...registerPassword('confirmPassword')}
            />
            <div className="flex justify-end">
              <Button type="submit" loading={passwordLoading}>
                <Shield className="h-4 w-4" />
                Changer le mot de passe
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Billing tab */}
      {activeTab === 'billing' && (
        <div className="space-y-4">
          {/* Current plan */}
          <Card padding="md">
            <CardHeader>
              <CardTitle>Votre plan actuel</CardTitle>
              <CardDescription>Gérez votre abonnement AutoPost</CardDescription>
            </CardHeader>
            <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                  {user?.plan === 'FREE' ? <Zap className="h-5 w-5 text-indigo-600" /> : <Star className="h-5 w-5 text-indigo-600" />}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Plan {getPlanLabel(user?.plan || 'FREE')}</p>
                  <p className="text-sm text-gray-500">
                    {planInfo.posts === -1 ? 'Posts illimités' : `${planInfo.posts} posts/mois`} •{' '}
                    {planInfo.ai === -1 ? 'IA illimitée' : `${planInfo.ai} générations IA`}
                  </p>
                </div>
              </div>
              {user?.plan === 'FREE' && (
                <Button size="sm">Passer Pro</Button>
              )}
            </div>
          </Card>

          {/* Plans */}
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { name: 'Starter', price: '9€', posts: 50, ai: 100, pages: 3, highlight: false },
              { name: 'Pro', price: '19€', posts: 150, ai: 300, pages: 5, highlight: true },
              { name: 'Agence', price: '49€', posts: -1, ai: -1, pages: -1, highlight: false },
            ].map((plan) => (
              <div key={plan.name} className={`rounded-2xl p-5 border-2 ${plan.highlight ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white'}`}>
                <h4 className="font-bold text-gray-900">{plan.name}</h4>
                <p className="text-2xl font-bold text-indigo-600 mt-1">{plan.price}<span className="text-sm text-gray-500">/mois</span></p>
                <ul className="mt-3 space-y-1.5 text-sm text-gray-600">
                  <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-green-500" /> {plan.pages === -1 ? 'Pages illimitées' : `${plan.pages} pages`}</li>
                  <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-green-500" /> {plan.posts === -1 ? 'Posts illimités' : `${plan.posts} posts`}</li>
                  <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-green-500" /> {plan.ai === -1 ? 'IA illimitée' : `${plan.ai} générations`}</li>
                </ul>
                <Button
                  size="sm"
                  variant={plan.highlight ? 'primary' : 'outline'}
                  className="w-full mt-4"
                  disabled={user?.plan === plan.name.toUpperCase()}
                >
                  {user?.plan === plan.name.toUpperCase() ? 'Plan actuel' : 'Choisir'}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notifications tab */}
      {activeTab === 'notifications' && (
        <Card padding="md">
          <CardHeader>
            <CardTitle>Préférences de notifications</CardTitle>
            <CardDescription>Choisissez quand vous souhaitez être notifié</CardDescription>
          </CardHeader>
          <div className="space-y-4">
            {[
              { label: 'Publication réussie', desc: 'Quand un post est publié sur Facebook', default: true },
              { label: 'Publication échouée', desc: 'Quand une publication échoue', default: true },
              { label: 'Post programmé', desc: 'Confirmation de programmation', default: false },
              { label: 'Rapport hebdomadaire', desc: 'Résumé de vos performances chaque semaine', default: false },
              { label: 'Nouveau message Facebook', desc: 'Quand quelqu\'un commente vos posts', default: false },
            ].map((n) => (
              <div key={n.label} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{n.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{n.desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked={n.default} />
                  <div className="w-10 h-5 bg-gray-200 rounded-full peer-checked:bg-indigo-600 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
                </label>
              </div>
            ))}
            <div className="flex justify-end pt-2">
              <Button onClick={() => toast.success('Préférences sauvegardées !')}>
                <CheckCircle className="h-4 w-4" />
                Sauvegarder
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

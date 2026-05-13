'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';
import { CheckCircle } from 'lucide-react';

const schema = z.object({
  fullName: z.string().min(2, 'Minimum 2 caractères'),
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Minimum 8 caractères'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await registerUser(data.email, data.password, data.fullName);
      toast.success('Compte créé avec succès !');
      router.push('/dashboard');
    } catch (err) {
      const axiosErr = err as AxiosError<{ error: string }>;
      const msg = axiosErr.response?.data?.error || 'Erreur lors de la création du compte';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Créer votre compte</h1>
          <p className="text-gray-500 text-sm mt-2">14 jours gratuits • Aucune carte bancaire</p>
        </div>

        <div className="flex gap-4 mb-6 bg-indigo-50 rounded-2xl p-4">
          {['Génération IA', 'Planification', 'Facebook'].map((f) => (
            <div key={f} className="flex items-center gap-1.5 text-xs text-indigo-700">
              <CheckCircle className="h-3.5 w-3.5" />
              {f}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Nom complet"
            type="text"
            placeholder="Jean Dupont"
            leftIcon={<User className="h-4 w-4" />}
            error={errors.fullName?.message}
            {...register('fullName')}
          />
          <Input
            label="Email"
            type="email"
            placeholder="votre@email.com"
            leftIcon={<Mail className="h-4 w-4" />}
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="Mot de passe"
            type={showPassword ? 'text' : 'password'}
            placeholder="Minimum 8 caractères"
            leftIcon={<Lock className="h-4 w-4" />}
            rightIcon={
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="focus:outline-none">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
            error={errors.password?.message}
            {...register('password')}
          />
          <Input
            label="Confirmer le mot de passe"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            leftIcon={<Lock className="h-4 w-4" />}
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          <Button type="submit" loading={loading} className="w-full mt-2" size="lg">
            Créer mon compte gratuit
          </Button>
        </form>

        <p className="mt-4 text-xs text-center text-gray-400">
          En créant un compte, vous acceptez nos{' '}
          <a href="#" className="underline">CGU</a> et notre{' '}
          <a href="#" className="underline">Politique de confidentialité</a>
        </p>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Déjà un compte ?{' '}
            <Link href="/login" className="text-indigo-600 font-semibold hover:text-indigo-800">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

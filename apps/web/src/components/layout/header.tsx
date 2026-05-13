'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, PlusCircle, Menu, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Tableau de bord',
  '/dashboard/create': 'Créer un post',
  '/dashboard/posts': 'Mes publications',
  '/dashboard/calendar': 'Calendrier de contenu',
  '/dashboard/pages': 'Pages Facebook',
  '/dashboard/settings': 'Paramètres',
};

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const title = pageTitles[pathname] || 'AutoPost';

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-100 px-6 h-16 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
        >
          <Menu className="h-5 w-5" />
        </button>
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-gray-900">AutoPost</span>
        </div>
        <h1 className="hidden lg:block text-lg font-semibold text-gray-900">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <Link href="/dashboard/create">
          <Button size="sm" className="hidden sm:inline-flex">
            <PlusCircle className="h-4 w-4" />
            Nouveau post
          </Button>
        </Link>
        <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-600 rounded-full" />
        </button>
        {user && (
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
            <span className="text-sm font-bold text-indigo-600">
              {(user.fullName || user.email)[0].toUpperCase()}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}

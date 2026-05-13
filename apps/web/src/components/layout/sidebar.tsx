'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, PlusCircle, FileText, Calendar,
  Facebook, Settings, Zap, LogOut, ChevronRight, Layers
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { cn, getPlanLabel } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const navItems = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/dashboard/create', label: 'Créer un post', icon: PlusCircle },
  { href: '/dashboard/bulk', label: 'Publication en masse', icon: Layers },
  { href: '/dashboard/posts', label: 'Mes publications', icon: FileText },
  { href: '/dashboard/calendar', label: 'Calendrier', icon: Calendar },
  { href: '/dashboard/pages', label: 'Pages Facebook', icon: Facebook },
  { href: '/dashboard/settings', label: 'Paramètres', icon: Settings },
];

const planColors: Record<string, string> = {
  FREE: 'bg-gray-100 text-gray-600',
  STARTER: 'bg-blue-100 text-blue-700',
  PRO: 'bg-indigo-100 text-indigo-700',
  AGENCY: 'bg-purple-100 text-purple-700',
};

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    toast.success('Déconnecté');
    router.push('/login');
  };

  return (
    <aside className="w-64 flex-shrink-0 hidden lg:flex flex-col h-screen sticky top-0 bg-white border-r border-gray-100">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold text-gray-900">AutoPost</span>
            <span className="block text-xs text-gray-400 -mt-0.5">IA Facebook</span>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
                active
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <Icon className={cn('h-5 w-5 flex-shrink-0', active ? 'text-white' : 'text-gray-400 group-hover:text-gray-600')} />
              {label}
              {active && <ChevronRight className="h-4 w-4 ml-auto text-indigo-300" />}
            </Link>
          );
        })}
      </nav>

      {/* User / Plan */}
      <div className="p-3 border-t border-gray-100">
        {user && (
          <div className="px-3 py-3 rounded-xl bg-gray-50 mb-2">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-indigo-600">
                  {(user.fullName || user.email)[0].toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.fullName || user.email}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
            <span className={cn('inline-block text-xs px-2 py-0.5 rounded-full font-medium', planColors[user.plan])}>
              Plan {getPlanLabel(user.plan)}
            </span>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}

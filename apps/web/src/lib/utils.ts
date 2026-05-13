import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isToday, isTomorrow } from 'date-fns';
import { fr } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isToday(d)) return `Aujourd'hui à ${format(d, 'HH:mm')}`;
  if (isTomorrow(d)) return `Demain à ${format(d, 'HH:mm')}`;
  return format(d, 'dd MMM yyyy à HH:mm', { locale: fr });
}

export function formatRelative(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: fr });
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    DRAFT: 'Brouillon',
    PENDING_VALIDATION: 'En attente',
    VALIDATED: 'Validé',
    REJECTED: 'Rejeté',
    SCHEDULED: 'Programmé',
    PUBLISHING: 'Publication...',
    PUBLISHED: 'Publié',
    FAILED: 'Échec',
  };
  return labels[status] || status;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-700',
    PENDING_VALIDATION: 'bg-yellow-100 text-yellow-700',
    VALIDATED: 'bg-blue-100 text-blue-700',
    REJECTED: 'bg-red-100 text-red-700',
    SCHEDULED: 'bg-purple-100 text-purple-700',
    PUBLISHING: 'bg-orange-100 text-orange-700',
    PUBLISHED: 'bg-green-100 text-green-700',
    FAILED: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
}

export function getToneLabel(tone: string): string {
  const labels: Record<string, string> = {
    PROFESSIONAL: 'Professionnel',
    SELLER: 'Vendeur',
    MOTIVATION: 'Motivation',
    FUNNY: 'Drôle',
    EDUCATIONAL: 'Éducatif',
  };
  return labels[tone] || tone;
}

export function getObjectiveLabel(objective: string): string {
  const labels: Record<string, string> = {
    AWARENESS: 'Notoriété',
    ENGAGEMENT: 'Engagement',
    CONVERSION: 'Conversion',
    TRAFFIC: 'Trafic',
  };
  return labels[objective] || objective;
}

export function getLengthLabel(length: string): string {
  const labels: Record<string, string> = {
    SHORT: 'Court',
    MEDIUM: 'Moyen',
    LONG: 'Long',
  };
  return labels[length] || length;
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function getPlanLabel(plan: string): string {
  const labels: Record<string, string> = {
    FREE: 'Gratuit',
    STARTER: 'Starter',
    PRO: 'Pro',
    AGENCY: 'Agence',
  };
  return labels[plan] || plan;
}

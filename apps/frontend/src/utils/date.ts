// utils/date.ts
// Utilitaires de manipulation de dates.

/**
 * Formate une date ISO en format lisible fr-FR.
 * Ex : "2024-05-06T14:30:00Z" → "06/05/2024"
 */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso));
}

/**
 * Formate une date ISO avec l'heure.
 * Ex : "06/05/2024 14:30"
 */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

/**
 * Retourne vrai si la date est dans le passé.
 */
export function isOverdue(iso: string | null | undefined): boolean {
  if (!iso) return false;
  return new Date(iso) < new Date();
}

/**
 * Retourne le nombre de jours restants (négatif si passé).
 */
export function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Retourne une date ISO pour aujourd'hui (YYYY-MM-DD).
 */
export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Retourne le temps relatif (ex : "il y a 3 jours").
 */
export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return '—';
  const rtf = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' });
  const diff = (new Date(iso).getTime() - Date.now()) / 1000;
  if (Math.abs(diff) < 60) return rtf.format(Math.round(diff), 'second');
  if (Math.abs(diff) < 3600) return rtf.format(Math.round(diff / 60), 'minute');
  if (Math.abs(diff) < 86400) return rtf.format(Math.round(diff / 3600), 'hour');
  return rtf.format(Math.round(diff / 86400), 'day');
}

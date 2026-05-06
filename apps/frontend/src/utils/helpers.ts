// utils/helpers.ts
// Fonctions utilitaires générales.

/**
 * Génère des initiales depuis un nom complet.
 * Ex : "Jean Dupont" → "JD"
 */
export function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Tronque un texte à la longueur donnée.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Groupe un tableau par une clé.
 */
export function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce<Record<string, T[]>>((acc, item) => {
    const k = String(item[key]);
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {});
}

/**
 * Retourne une couleur de badge selon la sévérité.
 */
export function severityColor(severity: string | null | undefined): string {
  switch (severity) {
    case 'critical': return 'bg-red-100 text-red-800';
    case 'high':     return 'bg-orange-100 text-orange-800';
    case 'medium':   return 'bg-yellow-100 text-yellow-800';
    case 'low':      return 'bg-green-100 text-green-800';
    default:         return 'bg-gray-100 text-gray-600';
  }
}

/**
 * Retourne une couleur de badge selon le statut.
 */
export function statusColor(status: string | null | undefined): string {
  switch (status) {
    case 'resolved':    return 'bg-green-100 text-green-800';
    case 'in_progress': return 'bg-blue-100 text-blue-800';
    case 'rejected':    return 'bg-red-100 text-red-800';
    case 'submitted':   return 'bg-yellow-100 text-yellow-800';
    default:            return 'bg-gray-100 text-gray-600';
  }
}

/**
 * Convertit des octets en taille lisible.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / 1024 ** 2).toFixed(1)} Mo`;
}

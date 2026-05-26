export const CURRENCY_OPTIONS = [
  { code: 'EUR', label: 'Euro (EUR)' },
  { code: 'USD', label: 'US Dollar (USD)' },
  { code: 'GBP', label: 'Pound Sterling (GBP)' },
  { code: 'CHF', label: 'Swiss Franc (CHF)' },
  { code: 'CAD', label: 'Canadian Dollar (CAD)' },
] as const;

export type SupportedCurrency = (typeof CURRENCY_OPTIONS)[number]['code'];

const CURRENCY_SET: ReadonlySet<string> = new Set(CURRENCY_OPTIONS.map((option) => option.code));

export function isSupportedCurrency(value: unknown): value is SupportedCurrency {
  return typeof value === 'string' && CURRENCY_SET.has(value);
}

export function normalizeCurrency(value: unknown, fallback: SupportedCurrency = 'EUR'): SupportedCurrency {
  if (isSupportedCurrency(value)) {
    return value;
  }
  return fallback;
}

export function formatCurrency(
  value: number,
  currency: SupportedCurrency,
  options?: Intl.NumberFormatOptions
) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
    ...options,
  }).format(value);
}

export function resolveUserCurrency(userMetadata: Record<string, unknown>, projectId?: string | null): SupportedCurrency {
  const defaultCurrency = normalizeCurrency(userMetadata.default_currency, 'EUR');

  if (!projectId) {
    return defaultCurrency;
  }

  const overridesRaw = userMetadata.project_currency_overrides;
  if (!overridesRaw || typeof overridesRaw !== 'object' || Array.isArray(overridesRaw)) {
    return defaultCurrency;
  }

  const overrides = overridesRaw as Record<string, unknown>;
  return normalizeCurrency(overrides[projectId], defaultCurrency);
}

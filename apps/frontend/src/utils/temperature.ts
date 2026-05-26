export const TEMPERATURE_UNIT_OPTIONS = [
  { code: 'C', label: 'Celsius (°C)' },
  { code: 'F', label: 'Fahrenheit (°F)' },
] as const;

export type TemperatureUnit = (typeof TEMPERATURE_UNIT_OPTIONS)[number]['code'];

const TEMPERATURE_UNIT_SET: ReadonlySet<string> = new Set(TEMPERATURE_UNIT_OPTIONS.map((option) => option.code));

export function isSupportedTemperatureUnit(value: unknown): value is TemperatureUnit {
  return typeof value === 'string' && TEMPERATURE_UNIT_SET.has(value);
}

export function normalizeTemperatureUnit(value: unknown, fallback: TemperatureUnit = 'C'): TemperatureUnit {
  if (isSupportedTemperatureUnit(value)) {
    return value;
  }
  return fallback;
}

export function resolveUserTemperatureUnit(userMetadata: Record<string, unknown>, projectId?: string | null): TemperatureUnit {
  const defaultUnit = normalizeTemperatureUnit(userMetadata.default_temperature_unit, 'C');

  if (!projectId) {
    return defaultUnit;
  }

  const overridesRaw = userMetadata.project_temperature_unit_overrides;
  if (!overridesRaw || typeof overridesRaw !== 'object' || Array.isArray(overridesRaw)) {
    return defaultUnit;
  }

  const overrides = overridesRaw as Record<string, unknown>;
  return normalizeTemperatureUnit(overrides[projectId], defaultUnit);
}

export function toTemperatureUnit(valueInCelsius: number, unit: TemperatureUnit): number {
  if (unit === 'F') {
    return (valueInCelsius * 9) / 5 + 32;
  }
  return valueInCelsius;
}

export function formatTemperature(valueInCelsius: number, unit: TemperatureUnit): string {
  const converted = toTemperatureUnit(valueInCelsius, unit);
  const rounded = Math.round(converted);
  return `${rounded}°${unit}`;
}

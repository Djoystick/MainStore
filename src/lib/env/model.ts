export const ENV_KEYS = {
  PUBLIC: [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ] as const,
  SERVER_ONLY: [
    'SUPABASE_SERVICE_ROLE_KEY',
    'TELEGRAM_BOT_TOKEN',
    'APP_SESSION_SECRET',
  ] as const,
} as const;

export type PublicEnvKey = (typeof ENV_KEYS.PUBLIC)[number];
export type ServerOnlyEnvKey = (typeof ENV_KEYS.SERVER_ONLY)[number];
export type KnownEnvKey = PublicEnvKey | ServerOnlyEnvKey;

export function readEnvOptional(name: KnownEnvKey): string | null {
  const value = process.env[name];
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function readEnvRequired(name: KnownEnvKey): string {
  const value = readEnvOptional(name);
  if (!value) {
    throw new Error(
      `Missing environment variable: ${name}. Fill it in .env.local (local) or Vercel Environment Variables (cloud).`,
    );
  }
  return value;
}

export function getMissingEnvKeys(
  names: readonly KnownEnvKey[],
): KnownEnvKey[] {
  return names.filter((name) => !readEnvOptional(name));
}

export function formatMissingEnvMessage(
  context: string,
  names: readonly KnownEnvKey[],
): string {
  const missing = getMissingEnvKeys(names);
  if (missing.length === 0) {
    return `${context}: all required env values are present.`;
  }
  return `${context}: missing ${missing.join(', ')}.`;
}

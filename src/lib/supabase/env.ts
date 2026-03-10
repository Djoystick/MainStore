import {
  ENV_KEYS,
  formatMissingEnvMessage,
  getMissingEnvKeys,
  readEnvOptional as readEnvGlobalOptional,
  readEnvRequired,
} from '@/lib/env/model';

export function getSupabaseConfigOptional() {
  const url = readEnvGlobalOptional('NEXT_PUBLIC_SUPABASE_URL');
  const anonKey = readEnvGlobalOptional('NEXT_PUBLIC_SUPABASE_ANON_KEY');

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}

export function getSupabaseConfig() {
  return {
    url: readEnvRequired('NEXT_PUBLIC_SUPABASE_URL'),
    anonKey: readEnvRequired('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  };
}

export function getSupabasePublicMissingEnvKeys() {
  return getMissingEnvKeys(ENV_KEYS.PUBLIC);
}

export function getSupabasePublicMissingEnvMessage() {
  return formatMissingEnvMessage('Supabase public client configuration', ENV_KEYS.PUBLIC);
}

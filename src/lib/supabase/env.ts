type SupabaseEnvName =
  | 'NEXT_PUBLIC_SUPABASE_URL'
  | 'NEXT_PUBLIC_SUPABASE_ANON_KEY';

function readEnv(name: SupabaseEnvName): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `Missing environment variable: ${name}. Add it to your local .env file.`,
    );
  }

  return value;
}

function readEnvOptional(name: SupabaseEnvName): string | null {
  const value = process.env[name];
  return value ? value : null;
}

export function getSupabaseConfigOptional() {
  const url = readEnvOptional('NEXT_PUBLIC_SUPABASE_URL');
  const anonKey = readEnvOptional('NEXT_PUBLIC_SUPABASE_ANON_KEY');

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}

export function getSupabaseConfig() {
  return {
    url: readEnv('NEXT_PUBLIC_SUPABASE_URL'),
    anonKey: readEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  };
}

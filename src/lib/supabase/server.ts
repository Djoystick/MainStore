import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/types/db';

import { getSupabaseConfig, getSupabaseConfigOptional } from './env';

export function createSupabaseServerClient(): SupabaseClient<Database> {
  const { url, anonKey } = getSupabaseConfig();

  return createClient<Database>(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

export function createSupabaseServerClientOptional():
  | SupabaseClient<Database>
  | null {
  const config = getSupabaseConfigOptional();

  if (!config) {
    return null;
  }

  return createClient<Database>(config.url, config.anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

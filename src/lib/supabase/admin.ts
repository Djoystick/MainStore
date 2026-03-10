import 'server-only';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/types/db';

import { getSupabaseConfigOptional } from './env';

function getServiceRoleKeyOptional(): string | null {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return serviceRoleKey ? serviceRoleKey : null;
}

export function createSupabaseAdminClientOptional():
  | SupabaseClient<Database>
  | null {
  const config = getSupabaseConfigOptional();
  const serviceRoleKey = getServiceRoleKeyOptional();

  if (!config || !serviceRoleKey) {
    return null;
  }

  return createClient<Database>(config.url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

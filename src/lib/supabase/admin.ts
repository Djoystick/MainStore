import 'server-only';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/types/db';
import { ENV_KEYS, formatMissingEnvMessage, getMissingEnvKeys, readEnvOptional } from '@/lib/env/model';

import { getSupabaseConfigOptional, getSupabaseProjectRefMismatchMessage } from './env';

const adminRequiredEnv = [
  ...ENV_KEYS.PUBLIC,
  'SUPABASE_SERVICE_ROLE_KEY',
] as const;

function getServiceRoleKeyOptional(): string | null {
  return readEnvOptional('SUPABASE_SERVICE_ROLE_KEY');
}

export function createSupabaseAdminClientOptional():
  | SupabaseClient<Database>
  | null {
  const config = getSupabaseConfigOptional();
  const serviceRoleKey = getServiceRoleKeyOptional();
  const refMismatchMessage = getSupabaseProjectRefMismatchMessage();

  if (!config || !serviceRoleKey || refMismatchMessage) {
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

export function getSupabaseAdminMissingEnvKeys() {
  return getMissingEnvKeys(adminRequiredEnv);
}

export function getSupabaseAdminMissingEnvMessage() {
  const refMismatchMessage = getSupabaseProjectRefMismatchMessage();
  if (refMismatchMessage) {
    return refMismatchMessage;
  }

  return formatMissingEnvMessage(
    'Supabase admin server client configuration',
    adminRequiredEnv,
  );
}

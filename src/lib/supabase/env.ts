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

function parseSupabaseProjectRefFromUrl(url: string | null): string | null {
  if (!url) {
    return null;
  }

  try {
    return new URL(url).hostname.split('.')[0] ?? null;
  } catch {
    return null;
  }
}

function parseSupabaseProjectRefFromJwt(token: string | null): string | null {
  if (!token) {
    return null;
  }

  const [, payload] = token.split('.');
  if (!payload) {
    return null;
  }

  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8')) as {
      ref?: string;
    };
    return typeof decoded.ref === 'string' && decoded.ref ? decoded.ref : null;
  } catch {
    return null;
  }
}

export interface SupabaseProjectRefDiagnostics {
  urlRef: string | null;
  anonRef: string | null;
  serviceRoleRef: string | null;
}

export function getSupabaseProjectRefDiagnostics(): SupabaseProjectRefDiagnostics {
  const url = readEnvGlobalOptional('NEXT_PUBLIC_SUPABASE_URL');
  const anonKey = readEnvGlobalOptional('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  const serviceRoleKey = readEnvGlobalOptional('SUPABASE_SERVICE_ROLE_KEY');

  return {
    urlRef: parseSupabaseProjectRefFromUrl(url),
    anonRef: parseSupabaseProjectRefFromJwt(anonKey),
    serviceRoleRef: parseSupabaseProjectRefFromJwt(serviceRoleKey),
  };
}

export function getSupabaseProjectRefMismatchMessage(): string | null {
  const diagnostics = getSupabaseProjectRefDiagnostics();
  const mismatches: string[] = [];

  if (
    diagnostics.urlRef &&
    diagnostics.anonRef &&
    diagnostics.urlRef !== diagnostics.anonRef
  ) {
    mismatches.push(
      `NEXT_PUBLIC_SUPABASE_URL points to ${diagnostics.urlRef}, but NEXT_PUBLIC_SUPABASE_ANON_KEY belongs to ${diagnostics.anonRef}.`,
    );
  }

  if (
    diagnostics.urlRef &&
    diagnostics.serviceRoleRef &&
    diagnostics.urlRef !== diagnostics.serviceRoleRef
  ) {
    mismatches.push(
      `NEXT_PUBLIC_SUPABASE_URL points to ${diagnostics.urlRef}, but SUPABASE_SERVICE_ROLE_KEY belongs to ${diagnostics.serviceRoleRef}.`,
    );
  }

  if (mismatches.length === 0) {
    return null;
  }

  return `Supabase project ref mismatch detected. ${mismatches.join(' ')}`;
}

import { NextResponse, type NextRequest } from 'next/server';

import { createAdminCategory, getAdminRequestAccess } from '@/features/admin';
import { getSupabaseAdminMissingEnvMessage } from '@/lib/supabase';

interface CategoryPayload {
  title?: string;
  slug?: string;
  isActive?: boolean;
}

function getAccessStatusCode(reason: string): number {
  return reason === 'no_session' ? 401 : 403;
}

export async function POST(request: NextRequest) {
  const access = await getAdminRequestAccess(request);
  if (!access.ok) {
    return NextResponse.json(
      { ok: false, error: 'admin_access_denied' },
      { status: getAccessStatusCode(access.reason ?? 'forbidden') },
    );
  }

  let payload: CategoryPayload;
  try {
    payload = (await request.json()) as CategoryPayload;
  } catch {
    return NextResponse.json(
      { ok: false, error: 'invalid_request_body' },
      { status: 400 },
    );
  }

  if (!payload.title || !payload.slug) {
    return NextResponse.json(
      { ok: false, error: 'title_and_slug_required' },
      { status: 400 },
    );
  }

  const result = await createAdminCategory(
    payload.title,
    payload.slug,
    payload.isActive ?? true,
  );

  if (!result.ok || !result.data) {
    const status = result.error === 'not_configured' ? 503 : 400;
    const details = status === 503 ? [getSupabaseAdminMissingEnvMessage()] : undefined;
    return NextResponse.json(
      { ok: false, error: result.error, details },
      { status },
    );
  }

  return NextResponse.json({ ok: true, id: result.data.id });
}

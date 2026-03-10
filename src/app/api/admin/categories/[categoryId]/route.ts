import { NextResponse, type NextRequest } from 'next/server';

import { getAdminRequestAccess, updateAdminCategory } from '@/features/admin';

interface CategoryPayload {
  title?: string;
  slug?: string;
  isActive?: boolean;
}

function getAccessStatusCode(reason: string): number {
  return reason === 'no_session' ? 401 : 403;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> },
) {
  const access = await getAdminRequestAccess(request);
  if (!access.ok) {
    return NextResponse.json(
      { ok: false, error: 'admin_access_denied' },
      { status: getAccessStatusCode(access.reason ?? 'forbidden') },
    );
  }

  const { categoryId } = await params;
  if (!categoryId) {
    return NextResponse.json(
      { ok: false, error: 'category_id_required' },
      { status: 400 },
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

  if (!payload.title || !payload.slug || typeof payload.isActive !== 'boolean') {
    return NextResponse.json(
      { ok: false, error: 'invalid_category_payload' },
      { status: 400 },
    );
  }

  const result = await updateAdminCategory(
    categoryId,
    payload.title,
    payload.slug,
    payload.isActive,
  );

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: result.error === 'not_configured' ? 503 : 400 },
    );
  }

  return NextResponse.json({ ok: true });
}

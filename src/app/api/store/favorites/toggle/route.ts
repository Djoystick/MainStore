import { NextResponse, type NextRequest } from 'next/server';

import { getRequestUserContext } from '@/features/auth';
import { toggleFavoriteForProfile } from '@/features/user-store/data';

interface ToggleFavoriteBody {
  productId?: string;
}

function getStatusByError(error: string): number {
  if (error === 'unauthorized') {
    return 401;
  }
  if (error === 'not_configured') {
    return 503;
  }
  return 400;
}

export async function POST(request: NextRequest) {
  const { profile } = await getRequestUserContext(request);

  if (!profile) {
    return NextResponse.json(
      { ok: false, error: 'unauthorized' },
      { status: 401 },
    );
  }

  let body: ToggleFavoriteBody;
  try {
    body = (await request.json()) as ToggleFavoriteBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: 'invalid_request' },
      { status: 400 },
    );
  }

  const productId = body.productId?.trim();
  if (!productId) {
    return NextResponse.json(
      { ok: false, error: 'product_id_required' },
      { status: 400 },
    );
  }

  const result = await toggleFavoriteForProfile(profile.id, productId);
  if (!result.ok || !result.data) {
    const error = result.error ?? 'favorite_toggle_failed';
    return NextResponse.json(
      { ok: false, error },
      { status: getStatusByError(error) },
    );
  }

  return NextResponse.json({
    ok: true,
    favorited: result.data.favorited,
  });
}

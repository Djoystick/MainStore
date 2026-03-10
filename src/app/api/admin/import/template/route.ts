import * as XLSX from 'xlsx';
import { NextResponse, type NextRequest } from 'next/server';

import { getAdminRequestAccess } from '@/features/admin';
import { importFieldKeys } from '@/features/admin-import';

export const runtime = 'nodejs';

function getAccessStatusCode(reason: string): number {
  return reason === 'no_session' ? 401 : 403;
}

export async function GET(request: NextRequest) {
  const access = await getAdminRequestAccess(request);
  if (!access.ok) {
    return NextResponse.json(
      { ok: false, error: 'admin_access_denied' },
      { status: getAccessStatusCode(access.reason ?? 'forbidden') },
    );
  }

  const headers = [...importFieldKeys];
  const sample = {
    slug: 'example-product',
    title: 'Пример товара',
    short_description: 'Короткое описание',
    description: 'Развёрнутое описание для витрины.',
    price: '49.90',
    compare_at_price: '59.90',
    currency: 'USD',
    status: 'active',
    is_featured: 'true',
    stock_quantity: '20',
    category: 'odezhda',
    collection: 'rekomenduemoe,novinki',
    image_url: 'https://example.com/image.jpg',
    image_alt: 'Пример изображения',
    image_sort_order: '0',
    image_is_primary: 'true',
  } as Record<string, string>;

  const sheetRows = [headers, headers.map((header) => sample[header] ?? '')];
  const sheet = XLSX.utils.aoa_to_sheet(sheetRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'products_import');
  const workbookArray = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;

  return new NextResponse(workbookArray, {
    status: 200,
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition':
        'attachment; filename="mainstore-catalog-import-template.xlsx"',
      'Cache-Control': 'no-store',
    },
  });
}

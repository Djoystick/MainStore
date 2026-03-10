import 'server-only';

import { createSupabaseAdminClientOptional } from '@/lib/supabase';
import type { Database } from '@/types/db';

import type { OrderStatus, ProductImageUpsertInput, ProductStatus, ProductUpsertInput } from './types';

type ProductRow = Database['public']['Tables']['products']['Row'];
type ProductImageRow = Database['public']['Tables']['product_images']['Row'];
type CategoryRow = Database['public']['Tables']['categories']['Row'];

const PRODUCT_STATUS_VALUES: ProductStatus[] = ['draft', 'active', 'archived'];
const ORDER_STATUS_VALUES: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
];

export interface MutationResult<T = undefined> {
  ok: boolean;
  data?: T;
  error?: string;
}

function isSlugValid(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

function normalizeText(value: string | null | undefined, maxLength: number): string {
  return (value ?? '').trim().slice(0, maxLength);
}

function parseNullableNumber(value: number | null | undefined): number | null {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return null;
  }
  if (!Number.isFinite(value)) {
    return null;
  }
  return value;
}

function validateProductInput(input: ProductUpsertInput): string | null {
  if (!isSlugValid(normalizeText(input.slug, 120))) {
    return 'invalid_slug';
  }
  if (!normalizeText(input.title, 180)) {
    return 'title_required';
  }
  if (!PRODUCT_STATUS_VALUES.includes(input.status)) {
    return 'invalid_status';
  }
  if (!normalizeText(input.currency, 3)) {
    return 'currency_required';
  }
  if (!Number.isFinite(input.price) || input.price < 0) {
    return 'invalid_price';
  }
  const compareAtPrice = parseNullableNumber(input.compareAtPrice);
  if (compareAtPrice !== null && compareAtPrice < input.price) {
    return 'compare_at_price_less_than_price';
  }
  if (!Number.isInteger(input.stockQuantity) || input.stockQuantity < 0) {
    return 'invalid_stock_quantity';
  }
  return null;
}

function validateImageInput(input: ProductImageUpsertInput): string | null {
  if (!normalizeText(input.url, 2000)) {
    return 'image_url_required';
  }
  if (!Number.isInteger(input.sortOrder) || input.sortOrder < 0) {
    return 'invalid_sort_order';
  }
  return null;
}

async function ensureCategoryExists(categoryId: string | null): Promise<boolean> {
  if (!categoryId) {
    return true;
  }

  const client = createSupabaseAdminClientOptional();
  if (!client) {
    return false;
  }

  const result = await client
    .from('categories')
    .select('id')
    .eq('id', categoryId)
    .maybeSingle();

  return !result.error && Boolean(result.data);
}

async function clearOtherPrimaryImages(productId: string, exceptImageId?: string) {
  const client = createSupabaseAdminClientOptional();
  if (!client) {
    return;
  }

  let query = client
    .from('product_images')
    .update({ is_primary: false } as never)
    .eq('product_id', productId)
    .eq('is_primary', true);

  if (exceptImageId) {
    query = query.neq('id', exceptImageId);
  }

  await query;
}

export async function createAdminProduct(
  input: ProductUpsertInput,
): Promise<MutationResult<{ id: string }>> {
  const client = createSupabaseAdminClientOptional();
  if (!client) {
    return { ok: false, error: 'not_configured' };
  }

  const validationError = validateProductInput(input);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  const categoryId = input.categoryId ?? null;
  const categoryExists = await ensureCategoryExists(categoryId);
  if (!categoryExists) {
    return { ok: false, error: 'invalid_category' };
  }

  const payload = {
    slug: normalizeText(input.slug, 120),
    title: normalizeText(input.title, 180),
    short_description: normalizeText(input.shortDescription, 400) || null,
    description: normalizeText(input.description, 5000) || null,
    price: input.price,
    compare_at_price: parseNullableNumber(input.compareAtPrice),
    currency: normalizeText(input.currency, 3).toUpperCase(),
    status: input.status,
    is_featured: input.isFeatured,
    stock_quantity: input.stockQuantity,
    category_id: categoryId,
  };

  const result = await client
    .from('products')
    .insert(payload as never)
    .select('id')
    .single();
  const typedResult = result as {
    data: Pick<ProductRow, 'id'> | null;
    error: { message: string } | null;
  };

  if (typedResult.error || !typedResult.data) {
    return { ok: false, error: typedResult.error?.message || 'create_product_failed' };
  }

  return {
    ok: true,
    data: { id: typedResult.data.id },
  };
}

export async function updateAdminProduct(
  productId: string,
  input: ProductUpsertInput,
): Promise<MutationResult> {
  const client = createSupabaseAdminClientOptional();
  if (!client) {
    return { ok: false, error: 'not_configured' };
  }

  const validationError = validateProductInput(input);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  const categoryId = input.categoryId ?? null;
  const categoryExists = await ensureCategoryExists(categoryId);
  if (!categoryExists) {
    return { ok: false, error: 'invalid_category' };
  }

  const payload = {
    slug: normalizeText(input.slug, 120),
    title: normalizeText(input.title, 180),
    short_description: normalizeText(input.shortDescription, 400) || null,
    description: normalizeText(input.description, 5000) || null,
    price: input.price,
    compare_at_price: parseNullableNumber(input.compareAtPrice),
    currency: normalizeText(input.currency, 3).toUpperCase(),
    status: input.status,
    is_featured: input.isFeatured,
    stock_quantity: input.stockQuantity,
    category_id: categoryId,
  };

  const result = await client
    .from('products')
    .update(payload as never)
    .eq('id', productId);

  if (result.error) {
    return { ok: false, error: result.error.message };
  }

  return { ok: true };
}

export async function updateAdminProductStatus(
  productId: string,
  status: ProductStatus,
): Promise<MutationResult> {
  if (!PRODUCT_STATUS_VALUES.includes(status)) {
    return { ok: false, error: 'invalid_status' };
  }

  const client = createSupabaseAdminClientOptional();
  if (!client) {
    return { ok: false, error: 'not_configured' };
  }

  const result = await client
    .from('products')
    .update({ status } as never)
    .eq('id', productId);

  if (result.error) {
    return { ok: false, error: result.error.message };
  }

  return { ok: true };
}

export async function createAdminProductImage(
  productId: string,
  input: ProductImageUpsertInput,
): Promise<MutationResult<{ id: string }>> {
  const client = createSupabaseAdminClientOptional();
  if (!client) {
    return { ok: false, error: 'not_configured' };
  }

  const validationError = validateImageInput(input);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  const productResult = await client
    .from('products')
    .select('id')
    .eq('id', productId)
    .maybeSingle();

  if (productResult.error || !productResult.data) {
    return { ok: false, error: 'invalid_product' };
  }

  if (input.isPrimary) {
    await clearOtherPrimaryImages(productId);
  }

  const result = await client
    .from('product_images')
    .insert(
      {
        product_id: productId,
        url: normalizeText(input.url, 2000),
        alt: normalizeText(input.alt, 500) || null,
        sort_order: input.sortOrder,
        is_primary: input.isPrimary,
      } as never,
    )
    .select('id')
    .single();
  const typedResult = result as {
    data: Pick<ProductImageRow, 'id'> | null;
    error: { message: string } | null;
  };

  if (typedResult.error || !typedResult.data) {
    return { ok: false, error: typedResult.error?.message || 'create_image_failed' };
  }

  return {
    ok: true,
    data: { id: typedResult.data.id },
  };
}

export async function updateAdminProductImage(
  imageId: string,
  input: ProductImageUpsertInput,
): Promise<MutationResult> {
  const client = createSupabaseAdminClientOptional();
  if (!client) {
    return { ok: false, error: 'not_configured' };
  }

  const validationError = validateImageInput(input);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  const imageResult = await client
    .from('product_images')
    .select('id, product_id')
    .eq('id', imageId)
    .maybeSingle();

  if (imageResult.error || !imageResult.data) {
    return { ok: false, error: 'image_not_found' };
  }

  const imageRow = imageResult.data as Pick<ProductImageRow, 'id' | 'product_id'>;
  if (input.isPrimary) {
    await clearOtherPrimaryImages(imageRow.product_id, imageId);
  }

  const updateResult = await client
    .from('product_images')
    .update(
      {
        url: normalizeText(input.url, 2000),
        alt: normalizeText(input.alt, 500) || null,
        sort_order: input.sortOrder,
        is_primary: input.isPrimary,
      } as never,
    )
    .eq('id', imageId);

  if (updateResult.error) {
    return { ok: false, error: updateResult.error.message };
  }

  return { ok: true };
}

export async function deleteAdminProductImage(imageId: string): Promise<MutationResult> {
  const client = createSupabaseAdminClientOptional();
  if (!client) {
    return { ok: false, error: 'not_configured' };
  }

  const imageResult = await client
    .from('product_images')
    .select('id, product_id, is_primary')
    .eq('id', imageId)
    .maybeSingle();

  if (imageResult.error || !imageResult.data) {
    return { ok: false, error: 'image_not_found' };
  }

  const imageRow = imageResult.data as Pick<ProductImageRow, 'id' | 'product_id' | 'is_primary'>;

  const removeResult = await client
    .from('product_images')
    .delete()
    .eq('id', imageId);

  if (removeResult.error) {
    return { ok: false, error: removeResult.error.message };
  }

  if (imageRow.is_primary) {
    const nextImageResult = await client
      .from('product_images')
      .select('id')
      .eq('product_id', imageRow.product_id)
      .order('sort_order', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!nextImageResult.error && nextImageResult.data) {
      await client
        .from('product_images')
        .update({ is_primary: true } as never)
        .eq('id', (nextImageResult.data as Pick<ProductImageRow, 'id'>).id);
    }
  }

  return { ok: true };
}

export async function updateAdminOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<MutationResult> {
  if (!ORDER_STATUS_VALUES.includes(status)) {
    return { ok: false, error: 'invalid_order_status' };
  }

  const client = createSupabaseAdminClientOptional();
  if (!client) {
    return { ok: false, error: 'not_configured' };
  }

  const result = await client
    .from('orders')
    .update({ status } as never)
    .eq('id', orderId)
    .select('id')
    .maybeSingle();
  const typedResult = result as {
    data: { id: string } | null;
    error: { message: string } | null;
  };

  if (typedResult.error || !typedResult.data) {
    return { ok: false, error: typedResult.error?.message || 'order_not_found' };
  }

  return { ok: true };
}

export async function createAdminCategory(
  title: string,
  slug: string,
  isActive = true,
): Promise<MutationResult<{ id: string }>> {
  const client = createSupabaseAdminClientOptional();
  if (!client) {
    return { ok: false, error: 'not_configured' };
  }

  const normalizedTitle = normalizeText(title, 160);
  const normalizedSlug = normalizeText(slug, 120);
  if (!normalizedTitle) {
    return { ok: false, error: 'category_title_required' };
  }
  if (!isSlugValid(normalizedSlug)) {
    return { ok: false, error: 'invalid_category_slug' };
  }

  const result = await client
    .from('categories')
    .insert(
      {
        title: normalizedTitle,
        slug: normalizedSlug,
        is_active: isActive,
      } as never,
    )
    .select('id')
    .single();
  const typedResult = result as {
    data: Pick<CategoryRow, 'id'> | null;
    error: { message: string } | null;
  };

  if (typedResult.error || !typedResult.data) {
    return { ok: false, error: typedResult.error?.message || 'create_category_failed' };
  }

  return {
    ok: true,
    data: { id: typedResult.data.id },
  };
}

export async function updateAdminCategory(
  categoryId: string,
  title: string,
  slug: string,
  isActive: boolean,
): Promise<MutationResult> {
  const client = createSupabaseAdminClientOptional();
  if (!client) {
    return { ok: false, error: 'not_configured' };
  }

  const normalizedTitle = normalizeText(title, 160);
  const normalizedSlug = normalizeText(slug, 120);
  if (!normalizedTitle) {
    return { ok: false, error: 'category_title_required' };
  }
  if (!isSlugValid(normalizedSlug)) {
    return { ok: false, error: 'invalid_category_slug' };
  }

  const result = await client
    .from('categories')
    .update(
      {
        title: normalizedTitle,
        slug: normalizedSlug,
        is_active: isActive,
      } as never,
    )
    .eq('id', categoryId)
    .select('id')
    .maybeSingle();
  const typedResult = result as {
    data: Pick<CategoryRow, 'id'> | null;
    error: { message: string } | null;
  };

  if (typedResult.error || !typedResult.data) {
    return { ok: false, error: typedResult.error?.message || 'update_category_failed' };
  }

  return { ok: true };
}

import {
  createSupabaseAdminClientOptional,
  getSupabaseAdminMissingEnvMessage,
} from '@/lib/supabase';
import type { Database } from '@/types/db';

import type { RowValidationError, ValidatedImportRow } from './types';
import { slugify } from './utils';

type ProductRow = Database['public']['Tables']['products']['Row'];
type CategoryRow = Database['public']['Tables']['categories']['Row'];
type CollectionRow = Database['public']['Tables']['collections']['Row'];
type ProductImageRow = Database['public']['Tables']['product_images']['Row'];

interface TaxonomyEnsureResult {
  idsByLabel: Map<string, string>;
  createdCount: number;
}

interface ImportExecutionResult {
  importedRows: Array<{
    rowNumber: number;
    slug: string;
    action: 'created' | 'updated';
  }>;
  errors: RowValidationError[];
  createdProducts: number;
  updatedProducts: number;
  createdCategories: number;
  createdCollections: number;
  createdImages: number;
  updatedImages: number;
}

function labelKey(value: string): string {
  return value.trim().toLowerCase();
}

function buildSafeSlug(prefix: string, value: string): string {
  const normalized = slugify(value);
  if (normalized) {
    return normalized.slice(0, 96);
  }

  const hash = Buffer.from(value, 'utf-8').toString('hex').slice(0, 16);
  return `${prefix}-${hash}`;
}

async function ensureTaxonomy(
  kind: 'categories' | 'collections',
  labels: string[],
): Promise<TaxonomyEnsureResult> {
  const client = createSupabaseAdminClientOptional();
  if (!client) {
    throw new Error(getSupabaseAdminMissingEnvMessage());
  }

  const uniqueLabels = Array.from(new Set(labels.map((entry) => entry.trim()).filter(Boolean)));
  if (uniqueLabels.length === 0) {
    return { idsByLabel: new Map(), createdCount: 0 };
  }

  const existingResult =
    kind === 'categories'
      ? await client.from('categories').select('id, slug, title')
      : await client.from('collections').select('id, slug, title');

  if (existingResult.error) {
    throw new Error(existingResult.error.message);
  }

  const existingRows = (existingResult.data ?? []) as Array<
    Pick<CategoryRow | CollectionRow, 'id' | 'slug' | 'title'>
  >;
  const bySlug = new Map(existingRows.map((row) => [labelKey(row.slug), row.id]));
  const byTitle = new Map(existingRows.map((row) => [labelKey(row.title), row.id]));

  const idsByLabel = new Map<string, string>();
  let createdCount = 0;

  for (const label of uniqueLabels) {
    const key = labelKey(label);
    const slugCandidate = buildSafeSlug(kind === 'categories' ? 'category' : 'collection', label);
    const existingId = bySlug.get(key) || byTitle.get(key) || bySlug.get(slugCandidate);

    if (existingId) {
      idsByLabel.set(key, existingId);
      continue;
    }

    let currentSlug = slugCandidate;
    let createdId: string | null = null;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const insertResult =
        kind === 'categories'
          ? await client
              .from('categories')
              .insert({
                slug: currentSlug,
                title: label.slice(0, 160),
                is_active: true,
                description: 'Создано во время импорта Excel.',
              } as never)
          : await client
              .from('collections')
              .insert({
                slug: currentSlug,
                title: label.slice(0, 160),
                is_active: true,
                description: 'Создано во время импорта Excel.',
              } as never);

      if (!insertResult.error) {
        const lookupAfterInsert =
          kind === 'categories'
            ? await client
                .from('categories')
                .select('id')
                .eq('slug', currentSlug)
                .maybeSingle()
            : await client
                .from('collections')
                .select('id')
                .eq('slug', currentSlug)
                .maybeSingle();

        if (!lookupAfterInsert.error && lookupAfterInsert.data) {
          createdId = (lookupAfterInsert.data as { id: string }).id;
          break;
        }
      }

      const duplicate =
        insertResult.error?.message.includes('duplicate key value') ?? false;
      if (!duplicate) {
        throw new Error(insertResult.error?.message || `Failed to create ${kind.slice(0, -1)}.`);
      }

      const existingBySlug =
        kind === 'categories'
          ? await client
              .from('categories')
              .select('id')
              .eq('slug', currentSlug)
              .maybeSingle()
          : await client
              .from('collections')
              .select('id')
              .eq('slug', currentSlug)
              .maybeSingle();

      if (!existingBySlug.error && existingBySlug.data) {
        createdId = (existingBySlug.data as { id: string }).id;
        break;
      }

      currentSlug = `${slugCandidate}-${attempt + 2}`.slice(0, 120);
    }

    if (!createdId) {
      throw new Error(`Failed to create ${kind.slice(0, -1)} for "${label}".`);
    }

    idsByLabel.set(key, createdId);
    bySlug.set(currentSlug, createdId);
    byTitle.set(key, createdId);
    createdCount += 1;
  }

  return { idsByLabel, createdCount };
}

async function upsertProductImage(args: {
  productId: string;
  image: NonNullable<ValidatedImportRow['image']>;
}): Promise<'created' | 'updated'> {
  const client = createSupabaseAdminClientOptional();
  if (!client) {
    throw new Error(getSupabaseAdminMissingEnvMessage());
  }

  const existing = await client
    .from('product_images')
    .select('id')
    .eq('product_id', args.productId)
    .eq('url', args.image.url)
    .maybeSingle();

  if (existing.error) {
    throw new Error(existing.error.message);
  }

  const existingId = (existing.data as Pick<ProductImageRow, 'id'> | null)?.id ?? null;

  if (args.image.isPrimary) {
    let clearPrimaryQuery = client
      .from('product_images')
      .update({ is_primary: false } as never)
      .eq('product_id', args.productId)
      .eq('is_primary', true);

    if (existingId) {
      clearPrimaryQuery = clearPrimaryQuery.neq('id', existingId);
    }

    const clearPrimaryResult = await clearPrimaryQuery;
    if (clearPrimaryResult.error) {
      throw new Error(clearPrimaryResult.error.message);
    }
  }

  if (existingId) {
    const updateResult = await client
      .from('product_images')
      .update(
        {
          alt: args.image.alt,
          sort_order: args.image.sortOrder,
          is_primary: args.image.isPrimary,
        } as never,
      )
      .eq('id', existingId);

    if (updateResult.error) {
      throw new Error(updateResult.error.message);
    }

    return 'updated';
  }

  const insertResult = await client
    .from('product_images')
    .insert(
      {
        product_id: args.productId,
        url: args.image.url,
        alt: args.image.alt,
        sort_order: args.image.sortOrder,
        is_primary: args.image.isPrimary,
      } as never,
    );

  if (insertResult.error) {
    throw new Error(insertResult.error.message);
  }

  return 'created';
}

export async function executeValidatedImport(
  rows: ValidatedImportRow[],
): Promise<ImportExecutionResult> {
  const client = createSupabaseAdminClientOptional();
  if (!client) {
    throw new Error(getSupabaseAdminMissingEnvMessage());
  }

  const categoryLabels = rows
    .map((row) => row.categoryLabel)
    .filter((value): value is string => Boolean(value));
  const collectionLabels = rows.flatMap((row) => row.collectionLabels);

  const [categoryResult, collectionResult] = await Promise.all([
    ensureTaxonomy('categories', categoryLabels),
    ensureTaxonomy('collections', collectionLabels),
  ]);

  const slugs = rows.map((row) => row.slug);
  const existingProducts = await client
    .from('products')
    .select('id, slug')
    .in('slug', slugs);

  if (existingProducts.error) {
    throw new Error(existingProducts.error.message);
  }

  const productIdBySlug = new Map(
    ((existingProducts.data ?? []) as Array<Pick<ProductRow, 'id' | 'slug'>>).map((row) => [
      row.slug,
      row.id,
    ]),
  );

  const result: ImportExecutionResult = {
    importedRows: [],
    errors: [],
    createdProducts: 0,
    updatedProducts: 0,
    createdCategories: categoryResult.createdCount,
    createdCollections: collectionResult.createdCount,
    createdImages: 0,
    updatedImages: 0,
  };

  for (const row of rows) {
    try {
      const existingProductId = productIdBySlug.get(row.slug) ?? null;
      const categoryId = row.categoryLabel
        ? categoryResult.idsByLabel.get(labelKey(row.categoryLabel)) ?? null
        : null;

      if (row.categoryLabel && !categoryId) {
        result.errors.push({
          rowNumber: row.rowNumber,
          field: 'category',
          message: `Could not resolve category "${row.categoryLabel}".`,
        });
        continue;
      }

      const upsertPayload = {
        slug: row.slug,
        title: row.title,
        short_description: row.shortDescription,
        description: row.description,
        price: row.price,
        compare_at_price: row.compareAtPrice,
        currency: row.currency,
        status: row.status,
        is_featured: row.isFeatured,
        stock_quantity: row.stockQuantity,
        category_id: categoryId,
      };

      const upsertResult = await client
        .from('products')
        .upsert(upsertPayload as never, { onConflict: 'slug' })
        .select('id, slug')
        .single();
      const typedUpsertResult = upsertResult as {
        data: Pick<ProductRow, 'id' | 'slug'> | null;
        error: { message: string } | null;
      };

      if (typedUpsertResult.error || !typedUpsertResult.data) {
        result.errors.push({
          rowNumber: row.rowNumber,
          field: 'row',
          message: typedUpsertResult.error?.message || 'Could not create/update product.',
        });
        continue;
      }

      const productData = typedUpsertResult.data;
      const productId = productData.id;
      const action: 'created' | 'updated' = existingProductId ? 'updated' : 'created';

      if (action === 'created') {
        result.createdProducts += 1;
      } else {
        result.updatedProducts += 1;
      }

      result.importedRows.push({
        rowNumber: row.rowNumber,
        slug: row.slug,
        action,
      });
      productIdBySlug.set(row.slug, productId);

      if (row.collectionLabels.length > 0) {
        for (let index = 0; index < row.collectionLabels.length; index += 1) {
          const label = row.collectionLabels[index];
          const collectionId = collectionResult.idsByLabel.get(labelKey(label));

          if (!collectionId) {
            result.errors.push({
              rowNumber: row.rowNumber,
              field: 'collection',
              message: `Could not resolve collection "${label}".`,
            });
            continue;
          }

          const collectionItemResult = await client
            .from('collection_items')
            .upsert(
              {
                collection_id: collectionId,
                product_id: productId,
                sort_order: index,
              } as never,
              { onConflict: 'collection_id,product_id' },
            );

          if (collectionItemResult.error) {
            result.errors.push({
              rowNumber: row.rowNumber,
              field: 'collection',
              message: `Could not assign collection "${label}".`,
            });
          }
        }
      }

      if (row.image) {
        const imageAction = await upsertProductImage({
          productId,
          image: row.image,
        });

        if (imageAction === 'created') {
          result.createdImages += 1;
        } else {
          result.updatedImages += 1;
        }
      }
    } catch (error) {
      result.errors.push({
        rowNumber: row.rowNumber,
        field: 'row',
        message:
          error instanceof Error
            ? error.message
            : 'Непредвиденная ошибка при импорте этой строки.',
      });
    }
  }

  return result;
}

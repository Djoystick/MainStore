import type { ImportColumnMapping, ImportFieldKey } from './types';
import { importFieldKeys } from './types';
import { normalizeKey } from './utils';

const mappingAliases: Record<ImportFieldKey, string[]> = {
  slug: ['slug', 'sku_slug', 'product_slug'],
  title: ['title', 'name', 'product_name', 'product_title'],
  short_description: ['short_description', 'short_desc', 'summary', 'subtitle'],
  description: ['description', 'details', 'long_description'],
  price: ['price', 'amount', 'sale_price'],
  compare_at_price: ['compare_at_price', 'old_price', 'list_price', 'original_price'],
  currency: ['currency', 'currency_code'],
  status: ['status', 'product_status'],
  is_featured: ['is_featured', 'featured'],
  stock_quantity: ['stock_quantity', 'stock', 'qty', 'quantity'],
  category: ['category', 'category_slug', 'category_title'],
  collection: ['collection', 'collections', 'collection_slug', 'collection_title'],
  image_url: ['image_url', 'image', 'photo', 'image_link', 'main_image'],
  image_alt: ['image_alt', 'alt', 'alt_text', 'image_description'],
  image_sort_order: ['image_sort_order', 'sort_order', 'image_position'],
  image_is_primary: ['image_is_primary', 'is_primary', 'primary_image'],
};

export const requiredImportFields: ImportFieldKey[] = ['slug', 'title', 'price'];

export function buildSuggestedMapping(columns: string[]): ImportColumnMapping {
  const normalizedColumns = columns.map((column) => ({
    original: column,
    normalized: normalizeKey(column),
  }));

  const result: ImportColumnMapping = {};
  const usedColumns = new Set<string>();

  importFieldKeys.forEach((field) => {
    const aliases = mappingAliases[field] ?? [];
    const match = normalizedColumns.find(
      (column) =>
        !usedColumns.has(column.original) &&
        aliases.includes(column.normalized),
    );

    if (!match) {
      return;
    }

    result[field] = match.original;
    usedColumns.add(match.original);
  });

  return result;
}

export function sanitizeMapping(
  rawMapping: unknown,
  columns: string[],
): ImportColumnMapping {
  if (!rawMapping || typeof rawMapping !== 'object') {
    return {};
  }

  const available = new Set(columns);
  const mapping: ImportColumnMapping = {};

  Object.entries(rawMapping as Record<string, unknown>).forEach(([key, value]) => {
    if (!importFieldKeys.includes(key as ImportFieldKey)) {
      return;
    }

    if (typeof value !== 'string') {
      return;
    }

    const trimmed = value.trim();
    if (!trimmed || !available.has(trimmed)) {
      return;
    }

    mapping[key as ImportFieldKey] = trimmed;
  });

  return mapping;
}


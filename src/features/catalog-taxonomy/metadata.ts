import type { Json } from '@/types/db';

interface TaxonomyMetadataShape {
  short_text?: string;
  display_order?: number;
  is_featured?: boolean;
}

export interface ParsedTaxonomyMetadata {
  shortText: string | null;
  displayOrder: number;
  isFeatured: boolean;
}

function isRecord(value: Json): value is Record<string, Json | undefined> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function parseTaxonomyMetadata(metadata: Json): ParsedTaxonomyMetadata {
  if (!isRecord(metadata)) {
    return {
      shortText: null,
      displayOrder: 0,
      isFeatured: false,
    };
  }

  const shape = metadata as TaxonomyMetadataShape;

  return {
    shortText:
      typeof shape.short_text === 'string' && shape.short_text.trim()
        ? shape.short_text.trim()
        : null,
    displayOrder:
      typeof shape.display_order === 'number' && Number.isFinite(shape.display_order)
        ? Math.trunc(shape.display_order)
        : 0,
    isFeatured: shape.is_featured === true,
  };
}

export function buildTaxonomyMetadata(input: {
  shortText?: string | null;
  displayOrder?: number;
  isFeatured?: boolean;
}): Json {
  return {
    short_text: input.shortText?.trim() ? input.shortText.trim().slice(0, 180) : null,
    display_order:
      typeof input.displayOrder === 'number' && Number.isFinite(input.displayOrder)
        ? Math.trunc(input.displayOrder)
        : 0,
    is_featured: input.isFeatured === true,
  };
}

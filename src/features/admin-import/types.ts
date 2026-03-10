import type { ProductStatus } from '@/types/db';

export const importFieldKeys = [
  'slug',
  'title',
  'short_description',
  'description',
  'price',
  'compare_at_price',
  'currency',
  'status',
  'is_featured',
  'stock_quantity',
  'category',
  'collection',
  'image_url',
  'image_alt',
  'image_sort_order',
  'image_is_primary',
] as const;

export type ImportFieldKey = (typeof importFieldKeys)[number];

export type ImportColumnMapping = Partial<Record<ImportFieldKey, string>>;

export interface ParsedExcelRow {
  rowNumber: number;
  values: Record<string, string>;
}

export interface ParsedExcelData {
  fileName: string;
  fileSizeBytes: number;
  sheetName: string;
  columns: string[];
  rows: ParsedExcelRow[];
  truncatedRowsCount: number;
}

export interface ImportPreviewPayload {
  fileName: string;
  fileSizeBytes: number;
  sheetName: string;
  columns: string[];
  totalRows: number;
  truncatedRowsCount: number;
  previewRows: ParsedExcelRow[];
  suggestedMapping: ImportColumnMapping;
}

export interface RowValidationError {
  rowNumber: number;
  field: ImportFieldKey | 'row';
  message: string;
}

export interface ValidationSummary {
  totalRows: number;
  validRows: number;
  rowsWithErrors: number;
}

export interface ValidatedImportRow {
  rowNumber: number;
  slug: string;
  title: string;
  shortDescription: string | null;
  description: string | null;
  price: number;
  compareAtPrice: number | null;
  currency: string;
  status: ProductStatus;
  isFeatured: boolean;
  stockQuantity: number;
  categoryLabel: string | null;
  collectionLabels: string[];
  image: {
    url: string;
    alt: string | null;
    sortOrder: number;
    isPrimary: boolean;
  } | null;
}

export interface ValidationResultPayload {
  mapping: ImportColumnMapping;
  summary: ValidationSummary;
  errors: RowValidationError[];
}

export interface ImportReportPayload {
  mapping: ImportColumnMapping;
  summary: ValidationSummary & {
    createdProducts: number;
    updatedProducts: number;
    skippedRows: number;
    importErrors: number;
    createdCategories: number;
    createdCollections: number;
    createdImages: number;
    updatedImages: number;
  };
  errors: RowValidationError[];
  importedRows: Array<{
    rowNumber: number;
    slug: string;
    action: 'created' | 'updated';
  }>;
}


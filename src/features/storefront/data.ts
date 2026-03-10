import { createSupabaseServerClientOptional } from '@/lib/supabase';
import { findStoreProduct, storeProducts } from '@/components/store/mock-products';
import type { StoreProduct } from '@/components/store/types';
import type { Database } from '@/types/db';

type ProductRow = Database['public']['Tables']['products']['Row'];
type ProductImageRow = Database['public']['Tables']['product_images']['Row'];
type CategoryRow = Database['public']['Tables']['categories']['Row'];
type ProductListRow = Pick<
  ProductRow,
  | 'id'
  | 'category_id'
  | 'slug'
  | 'title'
  | 'short_description'
  | 'description'
  | 'price'
  | 'currency'
  | 'is_featured'
  | 'created_at'
>;
type ProductImageListRow = Pick<
  ProductImageRow,
  'id' | 'product_id' | 'url' | 'alt' | 'sort_order' | 'is_primary' | 'created_at'
>;

const fallbackGradients = [
  'linear-gradient(135deg, #9fb8ff 0%, #5f7de8 100%)',
  'linear-gradient(135deg, #9ce6d7 0%, #37b59b 100%)',
  'linear-gradient(135deg, #f7d8a7 0%, #d6a85b 100%)',
  'linear-gradient(135deg, #b5d3fb 0%, #4d8ddd 100%)',
  'linear-gradient(135deg, #f7e5b9 0%, #d4bb78 100%)',
  'linear-gradient(135deg, #c2c4fb 0%, #7278e4 100%)',
];

const fallbackCategories: StorefrontCategory[] = [
  { id: 'all', slug: 'all', title: 'All' },
  { id: 'essentials', slug: 'essentials', title: 'Essentials' },
  { id: 'home', slug: 'home', title: 'Home' },
  { id: 'tech', slug: 'tech', title: 'Tech' },
];

function toPriceCents(price: unknown): number {
  if (typeof price === 'number' && Number.isFinite(price)) {
    return Math.round(price * 100);
  }

  const parsed = Number(price);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
}

function buildGradient(seed: string): string {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index);
    hash |= 0;
  }

  const normalized = Math.abs(hash) % fallbackGradients.length;
  return fallbackGradients[normalized];
}

function buildLabel(title: string): string {
  const words = title.split(' ').filter(Boolean);
  if (words.length === 0) {
    return 'Product';
  }
  return words.slice(0, 2).join(' ');
}

function mapImageByProductId(
  rows: ProductImageListRow[],
): Map<string, ProductImageListRow> {
  const byProductId = new Map<string, ProductImageListRow[]>();

  rows.forEach((row) => {
    const bucket = byProductId.get(row.product_id);
    if (bucket) {
      bucket.push(row);
      return;
    }
    byProductId.set(row.product_id, [row]);
  });

  const primaryMap = new Map<string, ProductImageListRow>();
  byProductId.forEach((images, productId) => {
    const sorted = [...images].sort((left, right) => {
      if (left.is_primary !== right.is_primary) {
        return left.is_primary ? -1 : 1;
      }
      if (left.sort_order !== right.sort_order) {
        return left.sort_order - right.sort_order;
      }
      return left.created_at.localeCompare(right.created_at);
    });

    if (sorted[0]) {
      primaryMap.set(productId, sorted[0]);
    }
  });

  return primaryMap;
}

function mapProductRows(
  rows: ProductListRow[],
  images: ProductImageListRow[],
): StoreProduct[] {
  const primaryImageByProductId = mapImageByProductId(images);

  return rows.map((row) => {
    const primaryImage = primaryImageByProductId.get(row.id);

    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      shortDescription: row.short_description,
      description:
        row.short_description ||
        row.description ||
        'Product description will be available soon.',
      priceCents: toPriceCents(row.price),
      currency: row.currency,
      imageLabel: buildLabel(row.title),
      imageGradient: buildGradient(row.slug || row.id),
      imageUrl: primaryImage?.url ?? null,
      imageAlt: primaryImage?.alt ?? row.title,
      isFeatured: row.is_featured,
      createdAt: row.created_at,
      categoryId: row.category_id,
    };
  });
}

async function fetchActiveProducts(limit?: number) {
  const client = createSupabaseServerClientOptional();

  if (!client) {
    return { kind: 'no_env' as const };
  }

  const baseQuery = client
    .from('products')
    .select(
      'id, category_id, slug, title, short_description, description, price, currency, is_featured, created_at',
    )
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  const { data: productRows, error: productsError } =
    limit && limit > 0 ? await baseQuery.limit(limit) : await baseQuery;

  if (productsError) {
    return { kind: 'error' as const, message: productsError.message };
  }

  const rows = (productRows ?? []) as ProductListRow[];
  if (rows.length === 0) {
    return { kind: 'ok' as const, products: [] as StoreProduct[] };
  }

  const { data: imageRows, error: imagesError } = await client
    .from('product_images')
    .select('id, product_id, url, alt, sort_order, is_primary, created_at')
    .in(
      'product_id',
      rows.map((row) => row.id),
    )
    .order('sort_order', { ascending: true });

  if (imagesError) {
    return { kind: 'error' as const, message: imagesError.message };
  }

  return {
    kind: 'ok' as const,
    products: mapProductRows(rows, (imageRows ?? []) as ProductImageListRow[]),
  };
}

async function fetchActiveCategories(): Promise<StorefrontCategory[]> {
  const client = createSupabaseServerClientOptional();
  if (!client) {
    return fallbackCategories;
  }

  const { data, error } = await client
    .from('categories')
    .select('id, slug, title')
    .eq('is_active', true)
    .order('title', { ascending: true });

  if (error || !data || data.length === 0) {
    return fallbackCategories;
  }

  return [
    { id: 'all', slug: 'all', title: 'All' },
    ...(data as Pick<CategoryRow, 'id' | 'slug' | 'title'>[]).map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
    })),
  ];
}

export interface StorefrontCategory {
  id: string;
  slug: string;
  title: string;
}

export interface HomeStorefrontDataResult {
  status: 'live' | 'empty' | 'fallback_env' | 'fallback_error';
  featuredProducts: StoreProduct[];
  latestProducts: StoreProduct[];
  message?: string;
}

export interface CatalogStorefrontDataResult {
  status: 'live' | 'empty' | 'fallback_env' | 'fallback_error';
  products: StoreProduct[];
  categories: StorefrontCategory[];
  message?: string;
}

export interface ProductStorefrontDataResult {
  status:
    | 'live'
    | 'not_found'
    | 'fallback_env'
    | 'fallback_error'
    | 'error';
  product: StoreProduct | null;
  relatedProducts: StoreProduct[];
  message?: string;
}

export async function getHomeStorefrontData(): Promise<HomeStorefrontDataResult> {
  const activeProductsResult = await fetchActiveProducts(16);

  if (activeProductsResult.kind === 'no_env') {
    return {
      status: 'fallback_env',
      featuredProducts: storeProducts.slice(0, 4),
      latestProducts: storeProducts.slice(4, 8),
      message:
        'Supabase is not configured. Showing fallback products from local seed.',
    };
  }

  if (activeProductsResult.kind === 'error') {
    return {
      status: 'fallback_error',
      featuredProducts: storeProducts.slice(0, 4),
      latestProducts: storeProducts.slice(4, 8),
      message: `Supabase request failed. Showing fallback products. Details: ${activeProductsResult.message}`,
    };
  }

  const products = activeProductsResult.products;

  if (products.length === 0) {
    return {
      status: 'empty',
      featuredProducts: [],
      latestProducts: [],
      message: 'No active products found in Supabase.',
    };
  }

  const featuredCandidates = products
    .filter((product) => product.isFeatured)
    .slice(0, 4);
  const featuredProducts =
    featuredCandidates.length > 0 ? featuredCandidates : products.slice(0, 4);
  const featuredIds = new Set(featuredProducts.map((product) => product.id));
  const latestProducts = products
    .filter((product) => !featuredIds.has(product.id))
    .slice(0, 4);

  return {
    status: 'live',
    featuredProducts,
    latestProducts: latestProducts.length > 0 ? latestProducts : products.slice(0, 4),
  };
}

export async function getCatalogStorefrontData(): Promise<CatalogStorefrontDataResult> {
  const [activeProductsResult, categories] = await Promise.all([
    fetchActiveProducts(),
    fetchActiveCategories(),
  ]);

  if (activeProductsResult.kind === 'no_env') {
    return {
      status: 'fallback_env',
      products: storeProducts,
      categories,
      message:
        'Supabase is not configured. Showing fallback products from local seed.',
    };
  }

  if (activeProductsResult.kind === 'error') {
    return {
      status: 'fallback_error',
      products: storeProducts,
      categories,
      message: `Supabase request failed. Showing fallback products. Details: ${activeProductsResult.message}`,
    };
  }

  if (activeProductsResult.products.length === 0) {
    return {
      status: 'empty',
      products: [],
      categories,
      message: 'No active products available in Supabase yet.',
    };
  }

  return {
    status: 'live',
    products: activeProductsResult.products,
    categories,
  };
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function getProductStorefrontData(
  productParam: string,
): Promise<ProductStorefrontDataResult> {
  const client = createSupabaseServerClientOptional();

  if (!client) {
    const fallbackProduct = findStoreProduct(productParam);
    if (!fallbackProduct) {
      return {
        status: 'not_found',
        product: null,
        relatedProducts: [],
        message: 'Supabase is not configured and fallback product is missing.',
      };
    }

    return {
      status: 'fallback_env',
      product: fallbackProduct,
      relatedProducts: storeProducts
        .filter((item) => item.id !== fallbackProduct.id)
        .slice(0, 3),
      message:
        'Supabase is not configured. Showing fallback product from local seed.',
    };
  }

  try {
    const productQuery = client
      .from('products')
      .select(
        'id, category_id, slug, title, short_description, description, price, currency, is_featured, created_at',
      )
      .eq('status', 'active')
      .eq('slug', productParam)
      .maybeSingle();

    const { data: productBySlug, error: productError } = await productQuery;
    if (productError) {
      throw new Error(productError.message);
    }

    let productRow = (productBySlug as ProductListRow | null) ?? null;

    if (!productRow && isUuid(productParam)) {
      const byId = await client
        .from('products')
        .select(
          'id, category_id, slug, title, short_description, description, price, currency, is_featured, created_at',
        )
        .eq('status', 'active')
        .eq('id', productParam)
        .maybeSingle();

      if (byId.error) {
        throw new Error(byId.error.message);
      }
      productRow = (byId.data as ProductListRow | null) ?? null;
    }

    if (!productRow) {
      return {
        status: 'not_found',
        product: null,
        relatedProducts: [],
        message: 'Product not found.',
      };
    }

    const productImagesResult = await client
      .from('product_images')
      .select('id, product_id, url, alt, sort_order, is_primary, created_at')
      .eq('product_id', productRow.id)
      .order('sort_order', { ascending: true });

    if (productImagesResult.error) {
      throw new Error(productImagesResult.error.message);
    }

    let relatedQuery = client
      .from('products')
      .select(
        'id, category_id, slug, title, short_description, description, price, currency, is_featured, created_at',
      )
      .eq('status', 'active')
      .neq('id', productRow.id)
      .order('created_at', { ascending: false })
      .limit(3);

    if (productRow.category_id) {
      relatedQuery = relatedQuery.eq('category_id', productRow.category_id);
    }

    let relatedResult = await relatedQuery;
    if (relatedResult.error) {
      throw new Error(relatedResult.error.message);
    }

    if ((relatedResult.data ?? []).length === 0 && productRow.category_id) {
      relatedResult = await client
        .from('products')
        .select(
          'id, category_id, slug, title, short_description, description, price, currency, is_featured, created_at',
        )
        .eq('status', 'active')
        .neq('id', productRow.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (relatedResult.error) {
        throw new Error(relatedResult.error.message);
      }
    }

    const relatedRows = (relatedResult.data ?? []) as ProductListRow[];
    let relatedImages: ProductImageListRow[] = [];

    if (relatedRows.length > 0) {
      const relatedImagesResult = await client
        .from('product_images')
        .select('id, product_id, url, alt, sort_order, is_primary, created_at')
        .in(
          'product_id',
          relatedRows.map((row) => row.id),
        )
        .order('sort_order', { ascending: true });

      if (relatedImagesResult.error) {
        throw new Error(relatedImagesResult.error.message);
      }

      relatedImages = (relatedImagesResult.data ?? []) as ProductImageListRow[];
    }

    const product = mapProductRows(
      [productRow as ProductListRow],
      (productImagesResult.data ?? []) as ProductImageListRow[],
    )[0];

    const relatedProducts = mapProductRows(relatedRows, relatedImages);

    return {
      status: 'live',
      product,
      relatedProducts,
    };
  } catch (error) {
    const fallbackProduct = findStoreProduct(productParam);
    if (!fallbackProduct) {
      return {
        status: 'error',
        product: null,
        relatedProducts: [],
        message:
          error instanceof Error
            ? error.message
            : 'Unknown storefront product query error.',
      };
    }

    return {
      status: 'fallback_error',
      product: fallbackProduct,
      relatedProducts: storeProducts
        .filter((item) => item.id !== fallbackProduct.id)
        .slice(0, 3),
      message:
        error instanceof Error
          ? `Supabase request failed. Showing fallback product. Details: ${error.message}`
          : 'Supabase request failed. Showing fallback product.',
    };
  }
}

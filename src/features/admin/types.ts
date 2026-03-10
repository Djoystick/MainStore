import type { Database } from '@/types/db';

export type ProductStatus = Database['public']['Enums']['product_status'];
export type OrderStatus = Database['public']['Enums']['order_status'];

export interface AdminCategoryOption {
  id: string;
  title: string;
  slug: string;
  isActive: boolean;
}

export interface AdminProductListItem {
  id: string;
  slug: string;
  title: string;
  status: ProductStatus;
  isFeatured: boolean;
  price: number;
  compareAtPrice: number | null;
  currency: string;
  stockQuantity: number;
  categoryId: string | null;
  categoryTitle: string | null;
  updatedAt: string;
  primaryImageUrl: string | null;
}

export interface AdminProductImageItem {
  id: string;
  productId: string;
  url: string;
  alt: string | null;
  sortOrder: number;
  isPrimary: boolean;
  createdAt: string;
}

export interface AdminProductDetail extends AdminProductListItem {
  shortDescription: string | null;
  description: string | null;
  images: AdminProductImageItem[];
}

export interface AdminOrderListItem {
  id: string;
  userId: string;
  status: OrderStatus;
  totalAmount: number;
  currency: string;
  customerDisplayName: string | null;
  customerUsername: string | null;
  createdAt: string;
  itemsCount: number;
}

export interface AdminOrderDetailItem {
  id: string;
  quantity: number;
  productTitle: string;
  productSlug: string | null;
  productImageUrl: string | null;
  unitPrice: number;
  lineTotal: number;
  currency: string;
}

export interface AdminOrderDetail {
  id: string;
  userId: string;
  status: OrderStatus;
  subtotalAmount: number;
  totalAmount: number;
  currency: string;
  customerDisplayName: string | null;
  customerUsername: string | null;
  customerPhone: string | null;
  shippingAddress: {
    city: string | null;
    addressLine: string | null;
    postalCode: string | null;
  };
  notes: string | null;
  createdAt: string;
  items: AdminOrderDetailItem[];
}

export interface AdminDashboardData {
  productsCount: number;
  activeProductsCount: number;
  draftProductsCount: number;
  archivedProductsCount: number;
  ordersCount: number;
  pendingOrdersCount: number;
}

export interface ProductUpsertInput {
  slug: string;
  title: string;
  shortDescription?: string | null;
  description?: string | null;
  price: number;
  compareAtPrice?: number | null;
  currency: string;
  status: ProductStatus;
  isFeatured: boolean;
  stockQuantity: number;
  categoryId?: string | null;
}

export interface ProductImageUpsertInput {
  url: string;
  alt?: string | null;
  sortOrder: number;
  isPrimary: boolean;
}

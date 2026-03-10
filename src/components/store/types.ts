export interface StoreProduct {
  id: string;
  slug: string;
  title: string;
  shortDescription?: string | null;
  description: string;
  priceCents: number;
  currency: string;
  imageLabel: string;
  imageGradient: string;
  imageUrl?: string | null;
  imageAlt?: string | null;
  isFeatured?: boolean;
  createdAt?: string;
  categoryId?: string | null;
}

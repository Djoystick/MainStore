import type { StoreProduct } from '@/components/store/types';

interface PromoCategory {
  id: string;
  slug: string;
  title: string;
}

export interface StorefrontPromoBanner {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
}

export function buildStorefrontPromoBanners(
  products: StoreProduct[],
  categories: PromoCategory[],
): StorefrontPromoBanner[] {
  const heroProduct = products.find((product) => product.isFeatured) ?? products[0];
  const firstCategory = categories.find((category) => category.id !== 'all');

  return [
    {
      id: 'weekly-pick',
      eyebrow: 'Выбор недели',
      title: heroProduct ? heroProduct.title : 'Подборка MainStore',
      description: heroProduct
        ? `Быстрая доставка и продуманная база для повседневных покупок. Посмотрите ${heroProduct.title.toLowerCase()} прямо сейчас.`
        : 'Быстрая доставка и аккуратно подобранные товары от команды MainStore.',
      ctaLabel: heroProduct ? 'Открыть товар' : 'Открыть каталог',
      ctaHref: heroProduct ? `/products/${heroProduct.slug}` : '/catalog',
    },
    {
      id: 'category-entry',
      eyebrow: 'Удобный старт',
      title: firstCategory ? `${firstCategory.title}: главное` : 'Главные подборки',
      description:
        'Используйте быстрые переходы по категориям и подборкам, чтобы найти нужные товары за пару касаний.',
      ctaLabel: firstCategory ? 'Открыть категорию' : 'Смотреть каталог',
      ctaHref: firstCategory ? `/catalog?category=${firstCategory.slug}` : '/catalog',
    },
  ];
}

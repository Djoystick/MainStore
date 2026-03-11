import type { StorefrontCategory } from './data';

interface CatalogCategoryGroupDefinition {
  slug: string;
  title: string;
  description: string;
  childSlugs: string[];
}

export interface CatalogCategoryGroup {
  slug: string;
  title: string;
  description: string;
  subcategories: StorefrontCategory[];
}

const catalogGroupDefinitions: CatalogCategoryGroupDefinition[] = [
  {
    slug: 'apparel',
    title: 'Одежда',
    description: 'Базовые и сезонные вещи на каждый день',
    childSlugs: ['hoodies', 'jackets', 'tshirts', 'shirts', 'pants'],
  },
  {
    slug: 'footwear',
    title: 'Обувь',
    description: 'Повседневные пары и спортивные модели',
    childSlugs: ['sneakers', 'sport'],
  },
  {
    slug: 'bags-accessories',
    title: 'Сумки и аксессуары',
    description: 'Сумки, рюкзаки и детали образа',
    childSlugs: ['bags', 'backpacks', 'accessories', 'travel'],
  },
  {
    slug: 'home',
    title: 'Дом',
    description: 'Домашние сценарии, свет и кухня',
    childSlugs: ['home-living', 'lighting', 'kitchen', 'wellness'],
  },
  {
    slug: 'tech',
    title: 'Техника',
    description: 'Аудио, зарядка и полезные гаджеты',
    childSlugs: ['audio', 'chargers', 'stationery'],
  },
  {
    slug: 'gifts-family',
    title: 'Подарки и семья',
    description: 'Идеи для подарков и семейных покупок',
    childSlugs: ['kids', 'gifts'],
  },
];

export function buildCatalogCategoryGroups(categories: StorefrontCategory[]): CatalogCategoryGroup[] {
  const categoryBySlug = new Map(
    categories
      .filter((category) => category.id !== 'all')
      .map((category) => [category.slug, category] as const),
  );

  return catalogGroupDefinitions
    .map((group) => ({
      slug: group.slug,
      title: group.title,
      description: group.description,
      subcategories: group.childSlugs
        .map((slug) => categoryBySlug.get(slug))
        .filter((category): category is StorefrontCategory => Boolean(category)),
    }))
    .filter((group) => group.subcategories.length > 0);
}

export function inferCatalogGroupSlug(categorySlug: string | null | undefined): string | null {
  if (!categorySlug) {
    return null;
  }

  const normalized = categorySlug.trim().toLowerCase();
  const match = catalogGroupDefinitions.find((group) => group.childSlugs.includes(normalized));
  return match?.slug ?? null;
}

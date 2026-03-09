import type { StoreProduct } from '@/components/store/types';

export const storeProducts: StoreProduct[] = [
  {
    id: 'demo-product',
    title: 'Daily Comfort Hoodie',
    description: 'Soft cotton hoodie for everyday wear.',
    priceCents: 4990,
    imageLabel: 'Hoodie',
    imageGradient: 'linear-gradient(135deg, #9fb8ff 0%, #5f7de8 100%)',
  },
  {
    id: 'urban-sneakers',
    title: 'Urban Motion Sneakers',
    description: 'Lightweight sneakers with flexible sole.',
    priceCents: 7390,
    imageLabel: 'Sneakers',
    imageGradient: 'linear-gradient(135deg, #9ce6d7 0%, #37b59b 100%)',
  },
  {
    id: 'canvas-bag',
    title: 'Canvas Weekend Bag',
    description: 'Compact carry bag with two inner pockets.',
    priceCents: 3590,
    imageLabel: 'Bag',
    imageGradient: 'linear-gradient(135deg, #f7d8a7 0%, #d6a85b 100%)',
  },
  {
    id: 'smart-bottle',
    title: 'Smart Steel Bottle',
    description: 'Vacuum insulated bottle, 500 ml.',
    priceCents: 2490,
    imageLabel: 'Bottle',
    imageGradient: 'linear-gradient(135deg, #b5d3fb 0%, #4d8ddd 100%)',
  },
  {
    id: 'desk-lamp',
    title: 'Focus Desk Lamp',
    description: 'Warm-white table lamp with touch control.',
    priceCents: 4190,
    imageLabel: 'Lamp',
    imageGradient: 'linear-gradient(135deg, #f7e5b9 0%, #d4bb78 100%)',
  },
  {
    id: 'wireless-speaker',
    title: 'Mini Bluetooth Speaker',
    description: 'Pocket-size speaker with rich low end.',
    priceCents: 5890,
    imageLabel: 'Speaker',
    imageGradient: 'linear-gradient(135deg, #c2c4fb 0%, #7278e4 100%)',
  },
  {
    id: 'notebook-set',
    title: 'Notebook Set',
    description: 'Set of 3 minimal notebooks for daily notes.',
    priceCents: 1390,
    imageLabel: 'Notebook',
    imageGradient: 'linear-gradient(135deg, #f8c8c8 0%, #de7f7f 100%)',
  },
  {
    id: 'charger-kit',
    title: 'Travel Charger Kit',
    description: 'Fast charger with compact travel adapter.',
    priceCents: 6790,
    imageLabel: 'Charger',
    imageGradient: 'linear-gradient(135deg, #b8ece8 0%, #4ebcb3 100%)',
  },
];

export function findStoreProduct(productId: string): StoreProduct | undefined {
  return storeProducts.find((product) => product.id === productId);
}

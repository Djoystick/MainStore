import Link from 'next/link';

import { ProductCard } from '@/components/store/ProductCard';
import { StoreScreen } from '@/components/store/StoreScreen';
import { StoreSection } from '@/components/store/StoreSection';
import { storeProducts } from '@/components/store/mock-products';
import styles from '@/components/store/store.module.css';

const featuredProducts = storeProducts.slice(0, 4);
const freshDrops = storeProducts.slice(4, 8);

export default function HomePage() {
  return (
    <StoreScreen
      title="Home"
      subtitle="Compact storefront ready for Telegram Mini App"
      back={false}
    >
      <section className={styles.hero}>
        <h2 className={styles.heroTitle}>New season essentials</h2>
        <p className={styles.heroText}>
          MainStore UI scaffold is ready. Product cards, sections, and navigation
          are prepared for real data integration in the next stage.
        </p>
        <div className={styles.heroActions}>
          <Link href="/catalog" className={styles.heroButton}>
            Open catalog
          </Link>
          <Link href="/orders" className={styles.heroGhostButton}>
            View orders
          </Link>
        </div>
      </section>

      <StoreSection title="Featured now" actionLabel="See all" actionHref="/catalog">
        <div className={styles.scrollRow}>
          {featuredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              href={`/products/${product.id}`}
              compact
            />
          ))}
        </div>
      </StoreSection>

      <StoreSection title="Fresh drops" actionLabel="Catalog" actionHref="/catalog">
        <div className={styles.scrollRow}>
          {freshDrops.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              href={`/products/${product.id}`}
              compact
            />
          ))}
        </div>
      </StoreSection>
    </StoreScreen>
  );
}

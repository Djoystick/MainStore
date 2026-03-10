import Link from 'next/link';

import { ProductCard } from '@/components/store/ProductCard';
import { StoreEmptyState } from '@/components/store/StoreEmptyState';
import { StoreScreen } from '@/components/store/StoreScreen';
import { StoreSection } from '@/components/store/StoreSection';
import { classNames } from '@/css/classnames';
import { getHomeStorefrontData } from '@/features/storefront/data';
import styles from '@/components/store/store.module.css';

export default async function HomePage() {
  const homeData = await getHomeStorefrontData();

  return (
    <StoreScreen
      title="Home"
      subtitle="Discover products in a clean customer-first storefront"
      back={false}
    >
      <section className={styles.hero}>
        <h2 className={styles.heroTitle}>Everyday picks, curated fast</h2>
        <p className={styles.heroText}>
          Premium baseline UI for a Telegram store. Browse the catalog and add
          items in a few taps.
        </p>
        <div className={styles.heroActions}>
          <Link
            href="/catalog"
            className={styles.heroButton}
            aria-label="Open catalog from home hero section"
          >
            Open catalog
          </Link>
        </div>
      </section>

      {homeData.message && (
        <section
          className={classNames(
            styles.dataNotice,
            homeData.status === 'fallback_error' && styles.dataNoticeError,
          )}
        >
          <p className={styles.dataNoticeTitle}>Storefront data status</p>
          <p className={styles.dataNoticeText}>{homeData.message}</p>
        </section>
      )}

      {homeData.status === 'empty' ? (
        <StoreEmptyState
          title="No products yet"
          description="No active products found in Supabase. Add products and set status to active to fill the storefront."
          actionLabel="Open catalog"
          actionHref="/catalog"
        />
      ) : (
        <>
          <StoreSection title="Featured now" actionLabel="See all" actionHref="/catalog">
            <div className={styles.scrollRow}>
              {homeData.featuredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  href={`/products/${product.slug}`}
                  compact
                />
              ))}
            </div>
          </StoreSection>

          <StoreSection title="Fresh drops" actionLabel="Catalog" actionHref="/catalog">
            <div className={styles.scrollRow}>
              {homeData.latestProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  href={`/products/${product.slug}`}
                  compact
                />
              ))}
            </div>
          </StoreSection>
        </>
      )}
    </StoreScreen>
  );
}

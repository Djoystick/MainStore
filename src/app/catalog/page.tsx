import { ProductCard } from '@/components/store/ProductCard';
import { StoreEmptyState } from '@/components/store/StoreEmptyState';
import { StoreScreen } from '@/components/store/StoreScreen';
import { StoreSection } from '@/components/store/StoreSection';
import { classNames } from '@/css/classnames';
import { getCatalogStorefrontData } from '@/features/storefront/data';
import styles from '@/components/store/store.module.css';

export default async function CatalogPage() {
  const catalogData = await getCatalogStorefrontData();

  return (
    <StoreScreen title="Catalog" subtitle="Find products by category or keyword">
      <div className={styles.searchRow}>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Search products"
          aria-label="Search products"
          readOnly
        />
        <button
          type="button"
          className={styles.filterButton}
          aria-label="Open filters"
        >
          Filters
        </button>
      </div>

      <div className={styles.chipRow}>
        {catalogData.categories.map((category, index) => (
          <span
            key={category.id}
            className={`${styles.chip} ${index === 0 ? styles.chipActive : ''}`}
          >
            {category.title}
          </span>
        ))}
      </div>

      {catalogData.message && (
        <section
          className={classNames(
            styles.dataNotice,
            catalogData.status === 'fallback_error' && styles.dataNoticeError,
          )}
        >
          <p className={styles.dataNoticeTitle}>Storefront data status</p>
          <p className={styles.dataNoticeText}>{catalogData.message}</p>
        </section>
      )}

      <StoreSection title="All products">
        {catalogData.status === 'empty' ? (
          <StoreEmptyState
            title="Catalog is empty"
            description="There are no active products in Supabase yet. Add seed data or create products in the dashboard."
          />
        ) : (
          <div className={styles.catalogGrid}>
            {catalogData.products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                href={`/products/${product.slug}`}
              />
            ))}
          </div>
        )}
      </StoreSection>
    </StoreScreen>
  );
}

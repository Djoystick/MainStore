import { ProductCard } from '@/components/store/ProductCard';
import { StoreScreen } from '@/components/store/StoreScreen';
import { StoreSection } from '@/components/store/StoreSection';
import {
  findStoreProduct,
  storeProducts,
} from '@/components/store/mock-products';
import styles from '@/components/store/store.module.css';

export default async function ProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const product = findStoreProduct(productId) ?? storeProducts[0];
  const relatedProducts = storeProducts
    .filter((item) => item.id !== product.id)
    .slice(0, 3);

  const price = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(product.priceCents / 100);

  return (
    <StoreScreen
      title="Product"
      subtitle={`SKU: ${product.id}`}
      back={true}
      showBottomNav={true}
    >
      <section className={styles.detailCard}>
        <div
          className={styles.detailImage}
          style={{ background: product.imageGradient }}
        >
          <span className={styles.productImageLabel}>{product.imageLabel}</span>
        </div>
        <div className={styles.detailMeta}>
          <h2 className={styles.detailTitle}>{product.title}</h2>
          <p className={styles.detailPrice}>{price}</p>
          <p className={styles.detailDescription}>
            {product.description} This is a UI placeholder for the product
            screen. Stock, options, and add-to-cart logic will be connected in
            the next stage.
          </p>
          <button type="button" className={styles.primaryButton}>
            Add to cart
          </button>
        </div>
      </section>

      <StoreSection title="You may also like">
        <div className={styles.scrollRow}>
          {relatedProducts.map((item) => (
            <ProductCard
              key={item.id}
              product={item}
              href={`/products/${item.id}`}
              compact
            />
          ))}
        </div>
      </StoreSection>
    </StoreScreen>
  );
}

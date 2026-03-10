import { ProductCard } from '@/components/store/ProductCard';
import { StoreEmptyState } from '@/components/store/StoreEmptyState';
import { StoreScreen } from '@/components/store/StoreScreen';
import { StoreSection } from '@/components/store/StoreSection';
import { classNames } from '@/css/classnames';
import { getProductStorefrontData } from '@/features/storefront/data';
import styles from '@/components/store/store.module.css';

export default async function ProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const productData = await getProductStorefrontData(productId);
  const product = productData.product;

  const price = product
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: product.currency || 'USD',
        minimumFractionDigits: 0,
      }).format(product.priceCents / 100)
    : '';

  const detailImageStyle = product?.imageUrl
    ? {
        backgroundImage: `linear-gradient(rgba(12, 18, 31, 0.18), rgba(12, 18, 31, 0.18)), url(${product.imageUrl})`,
        backgroundPosition: 'center',
        backgroundSize: 'cover',
      }
    : {
        background:
          product?.imageGradient ||
          'linear-gradient(135deg, #9fb8ff 0%, #5f7de8 100%)',
      };

  return (
    <StoreScreen
      title="Product"
      subtitle={product ? `SKU: ${product.slug}` : 'Product details'}
      back={true}
      showBottomNav={false}
    >
      {productData.message && (
        <section
          className={classNames(
            styles.dataNotice,
            (productData.status === 'error' ||
              productData.status === 'fallback_error') &&
              styles.dataNoticeError,
          )}
        >
          <p className={styles.dataNoticeTitle}>Storefront data status</p>
          <p className={styles.dataNoticeText}>{productData.message}</p>
        </section>
      )}

      {!product ? (
        <StoreEmptyState
          title="Product not found"
          description="The requested product is missing or inactive. Open the catalog to continue browsing."
          actionLabel="Go to catalog"
          actionHref="/catalog"
        />
      ) : (
        <>
          <div className={styles.productPageBottomSpace}>
            <section className={styles.detailCard}>
              <div className={styles.detailImage} style={detailImageStyle}>
                <span className={styles.productImageLabel}>{product.imageLabel}</span>
              </div>
              <div className={styles.detailMeta}>
                <h2 className={styles.detailTitle}>{product.title}</h2>
                <p className={styles.detailPrice}>{price}</p>
                <p className={styles.detailDescription}>{product.description}</p>
              </div>
            </section>

            {productData.relatedProducts.length > 0 && (
              <StoreSection title="You may also like">
                <div className={styles.scrollRow}>
                  {productData.relatedProducts.map((item) => (
                    <ProductCard
                      key={item.id}
                      product={item}
                      href={`/products/${item.slug}`}
                      compact
                    />
                  ))}
                </div>
              </StoreSection>
            )}
          </div>

          <div className={styles.stickyBar}>
            <div className={styles.stickyBarInner}>
              <button
                type="button"
                className={styles.stickyBarButton}
                aria-label={`Add ${product.title} to cart`}
              >
                Add to cart
              </button>
            </div>
          </div>
        </>
      )}
    </StoreScreen>
  );
}

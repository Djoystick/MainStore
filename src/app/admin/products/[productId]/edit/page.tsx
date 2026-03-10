import Link from 'next/link';

import { AdminProductDangerZone } from '@/components/admin/AdminProductDangerZone';
import { AdminProductDuplicateButton } from '@/components/admin/AdminProductDuplicateButton';
import { AdminProductFeatureToggle } from '@/components/admin/AdminProductFeatureToggle';
import { AdminProductCollectionsManager } from '@/components/admin/AdminProductCollectionsManager';
import { AdminProductForm } from '@/components/admin/AdminProductForm';
import { AdminProductImagesManager } from '@/components/admin/AdminProductImagesManager';
import { AdminProductOverviewCard } from '@/components/admin/AdminProductOverviewCard';
import { AdminProductStatusControl } from '@/components/admin/AdminProductStatusControl';
import { AdminScreen } from '@/components/admin/AdminScreen';
import adminStyles from '@/components/admin/admin.module.css';
import { StoreEmptyState } from '@/components/store/StoreEmptyState';
import { classNames } from '@/css/classnames';
import { getAdminProductDetail } from '@/features/admin';
import storeStyles from '@/components/store/store.module.css';

export default async function AdminEditProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const detailResult = await getAdminProductDetail(productId);

  return (
    <AdminScreen title="Edit Product" subtitle="Manage content, publication, images, and deletion" back={true}>
      {detailResult.message && (
        <section
          className={classNames(
            storeStyles.dataNotice,
            detailResult.status === 'error' && storeStyles.dataNoticeError,
          )}
        >
          <p className={storeStyles.dataNoticeTitle}>Product details update</p>
          <p className={storeStyles.dataNoticeText}>{detailResult.message}</p>
          {(detailResult.status === 'error' || detailResult.status === 'not_configured') && (
            <div className={storeStyles.dataNoticeActions}>
              <Link
                href={`/admin/products/${productId}/edit`}
                className={storeStyles.dataNoticeRetry}
                aria-label="Retry loading product details"
              >
                Retry
              </Link>
            </div>
          )}
        </section>
      )}

      <div className={adminStyles.adminActions}>
        <Link href="/admin/products" className={adminStyles.adminActionLink}>
          Back to products
        </Link>
        {detailResult.product && (
          <AdminProductDuplicateButton productId={detailResult.product.id} label="Duplicate card" />
        )}
      </div>

      {!detailResult.product ? (
        <StoreEmptyState
          title="Product not found"
          description="Requested product does not exist."
          actionLabel="Back to products"
          actionHref="/admin/products"
        />
      ) : (
        <div className={adminStyles.adminSectionStack}>
          <AdminProductOverviewCard product={detailResult.product} />

          <section className={adminStyles.adminCard}>
            <h2 className={adminStyles.adminCardTitle}>Quick controls</h2>
            <p className={adminStyles.adminCardSub}>
              Adjust publication and promotion without opening the full form.
            </p>
            <div className={adminStyles.adminStackActions}>
              <AdminProductStatusControl
                productId={detailResult.product.id}
                initialStatus={detailResult.product.status}
              />
              <AdminProductFeatureToggle
                productId={detailResult.product.id}
                initialIsFeatured={detailResult.product.isFeatured}
              />
            </div>
          </section>

          <AdminProductForm
            mode="edit"
            product={detailResult.product}
            categories={detailResult.categories}
          />

          <AdminProductCollectionsManager
            productId={detailResult.product.id}
            collections={detailResult.collections}
            assignments={detailResult.product.collectionAssignments}
          />

          <AdminProductImagesManager
            productId={detailResult.product.id}
            images={detailResult.product.images}
          />

          <AdminProductDangerZone product={detailResult.product} />
        </div>
      )}
    </AdminScreen>
  );
}

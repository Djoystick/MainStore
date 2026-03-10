import { AdminScreen } from '@/components/admin/AdminScreen';
import adminStyles from '@/components/admin/admin.module.css';
import { StoreSection } from '@/components/store/StoreSection';

export default function AdminImportPage() {
  return (
    <AdminScreen title="Catalog Import" subtitle="Preparation for spreadsheet ingestion">
      <StoreSection title="Import module scaffold">
        <section className={adminStyles.adminCard}>
          <h2 className={adminStyles.adminCardTitle}>Planned file formats</h2>
          <p className={adminStyles.adminCardSub}>XLSX, XLS, XLSM, XLTX</p>
          <p className={adminStyles.adminCardSub}>
            This screen is a dedicated integration point for the next stage where
            we will parse files, validate rows, and run bulk upserts for products
            and images.
          </p>
          <p className={adminStyles.adminCardSub}>
            Current stage keeps this flow as an explicit hook without fake upload logic.
          </p>
        </section>
      </StoreSection>
    </AdminScreen>
  );
}

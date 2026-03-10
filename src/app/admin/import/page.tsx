import { AdminScreen } from '@/components/admin/AdminScreen';
import { AdminCatalogImportFlow } from '@/components/admin/AdminCatalogImportFlow';
import adminStyles from '@/components/admin/admin.module.css';
import { StoreSection } from '@/components/store/StoreSection';

export default function AdminImportPage() {
  return (
    <AdminScreen title="Catalog Import" subtitle="Upload Excel, validate rows, and import safely">
      <StoreSection title="Excel Import">
        <AdminCatalogImportFlow />
      </StoreSection>
      <StoreSection title="Supported formats">
        <section className={adminStyles.adminCard}>
          <h2 className={adminStyles.adminCardTitle}>File types</h2>
          <p className={adminStyles.adminCardSub}>XLSX, XLS, XLSM, XLTX</p>
          <p className={adminStyles.adminCardSub}>
            Import works in preview-first mode. Data is written only after explicit confirmation.
          </p>
        </section>
      </StoreSection>
    </AdminScreen>
  );
}

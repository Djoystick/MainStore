import Link from 'next/link';

import { AdminCatalogImportFlow } from '@/components/admin/AdminCatalogImportFlow';
import { AdminScreen } from '@/components/admin/AdminScreen';
import adminStyles from '@/components/admin/admin.module.css';
import { StoreSection } from '@/components/store/StoreSection';

export default function AdminImportPage() {
  return (
    <AdminScreen title="Импорт каталога" subtitle="Массовое обновление товаров через Excel">
      <section className={adminStyles.adminPageLead}>
        <h2 className={adminStyles.adminPageLeadTitle}>Импорт с предпросмотром без слепой записи в базу</h2>
        <p className={adminStyles.adminPageLeadText}>
          Используйте импорт для больших обновлений каталога, а точечные правки оставляйте для
          рабочей карточки товара. Форматы `XLSX`, `XLS`, `XLSM`, `XLTX` сохраняются без изменений.
        </p>
        <div className={adminStyles.adminActionBar}>
          <Link href="/admin/products" className={adminStyles.adminActionLink}>
            Открыть каталог
          </Link>
        </div>
      </section>

      <StoreSection title="Импорт Excel">
        <AdminCatalogImportFlow />
      </StoreSection>

      <StoreSection title="Когда использовать импорт">
        <section className={adminStyles.adminCard}>
          <div className={adminStyles.adminSummaryGrid}>
            <div className={adminStyles.adminSummaryCard}>
              <p className={adminStyles.adminSummaryLabel}>Подходит для</p>
              <p className={adminStyles.adminSummaryValue}>Массовых правок</p>
              <p className={adminStyles.adminSummaryText}>
                Цена, остатки, описания, изображения и связки каталога в одном файле.
              </p>
            </div>
            <div className={adminStyles.adminSummaryCard}>
              <p className={adminStyles.adminSummaryLabel}>Не заменяет</p>
              <p className={adminStyles.adminSummaryValue}>Ручное редактирование</p>
              <p className={adminStyles.adminSummaryText}>
                Для точечной публикации, проверки карточки и быстрых правок удобнее интерфейс товара.
              </p>
            </div>
          </div>
        </section>
      </StoreSection>
    </AdminScreen>
  );
}

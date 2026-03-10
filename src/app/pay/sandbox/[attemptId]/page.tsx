import Link from 'next/link';

import { SandboxPaymentActions } from '@/components/store/SandboxPaymentActions';
import { StoreEmptyState } from '@/components/store/StoreEmptyState';
import { StoreScreen } from '@/components/store/StoreScreen';
import { formatStorePrice } from '@/components/store/formatPrice';
import { classNames } from '@/css/classnames';
import { getCurrentUserContext } from '@/features/auth';
import { formatPaymentProvider, formatPaymentStatus, getPaymentAttemptForProfile } from '@/features/payments';
import styles from '@/components/store/store.module.css';

function getPaymentStatusClass(status: string): string {
  switch (status) {
    case 'pending':
      return styles.paymentStatusPending;
    case 'requires_action':
      return styles.paymentStatusAction;
    case 'paid':
      return styles.paymentStatusPaid;
    case 'failed':
      return styles.paymentStatusFailed;
    case 'cancelled':
      return styles.paymentStatusCancelled;
    case 'expired':
      return styles.paymentStatusExpired;
    default:
      return '';
  }
}

export default async function SandboxPaymentPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  const { profile } = await getCurrentUserContext();
  const attemptResult = await getPaymentAttemptForProfile(profile?.id ?? null, attemptId);
  const attempt = attemptResult.attempt;

  return (
    <StoreScreen title="Оплата" subtitle="Тестовый платёжный шаг" back={true} showBottomNav={false}>
      {attemptResult.message && (
        <section
          className={classNames(
            styles.dataNotice,
            attemptResult.status === 'error' && styles.dataNoticeError,
          )}
        >
          <p className={styles.dataNoticeTitle}>Обновление оплаты</p>
          <p className={styles.dataNoticeText}>{attemptResult.message}</p>
        </section>
      )}

      {attemptResult.status === 'unauthorized' ? (
        <StoreEmptyState
          title="Нужна сессия Telegram"
          description="Откройте MainStore в Telegram, чтобы завершить оплату."
          actionLabel="Открыть каталог"
          actionHref="/catalog"
        />
      ) : null}

      {attemptResult.status === 'not_found' ? (
        <StoreEmptyState
          title="Платёжная сессия не найдена"
          description="Возможно, она уже завершена или больше недоступна."
          actionLabel="К заказам"
          actionHref="/orders"
        />
      ) : null}

      {!attempt &&
      attemptResult.status !== 'unauthorized' &&
      attemptResult.status !== 'not_found' ? (
        <StoreEmptyState
          title="Оплата временно недоступна"
          description="Проверьте заказ чуть позже или вернитесь к списку заказов."
          actionLabel="К заказам"
          actionHref="/orders"
        />
      ) : null}

      {attempt ? (
        <>
          <section className={styles.panel}>
            <div className={styles.orderCardHeader}>
              <h2 className={styles.panelTitle}>Заказ #{attempt.orderId.slice(0, 8).toUpperCase()}</h2>
              <span className={classNames(styles.paymentStatusBadge, getPaymentStatusClass(attempt.status))}>
                {formatPaymentStatus(attempt.status)}
              </span>
            </div>
            <p className={styles.panelText}>
              Провайдер: {formatPaymentProvider(attempt.provider)}
            </p>
            <p className={styles.paymentAmount}>
              {formatStorePrice(Math.round(attempt.orderTotalAmount * 100), attempt.orderCurrency)}
            </p>
          </section>

          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>Что происходит</h2>
            <p className={styles.panelText}>
              Это sandbox-провайдер для первого платёжного прохода. Он имитирует hosted checkout,
              но использует уже реальную order/payment архитектуру: попытки оплаты, payment status,
              retry и server-side обновление заказа.
            </p>
          </section>

          {attempt.status === 'requires_action' || attempt.status === 'pending' ? (
            <SandboxPaymentActions attemptId={attempt.id} orderId={attempt.orderId} />
          ) : (
            <section className={styles.panel}>
              <p className={styles.panelText}>
                Текущий статус оплаты: {formatPaymentStatus(attempt.status)}.
              </p>
            </section>
          )}

          <Link href={`/orders/${attempt.orderId}`} className={styles.secondaryInlineLink}>
            К заказу
          </Link>
        </>
      ) : null}
    </StoreScreen>
  );
}

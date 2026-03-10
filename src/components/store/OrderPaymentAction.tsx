'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { useTelegramUnauthorizedMessage } from '@/components/auth/TelegramSessionBootstrap';

import styles from './store.module.css';

function mapRetryPaymentError(error: string | undefined, unauthorizedMessage: string): string {
  switch (error) {
    case 'unauthorized':
      return unauthorizedMessage;
    case 'order_not_found':
      return 'Заказ не найден.';
    case 'order_cancelled':
      return 'Оплата недоступна для отмененного заказа.';
    case 'already_paid':
      return 'Этот заказ уже оплачен.';
    case 'not_configured':
      return 'Платежный слой временно недоступен.';
    case 'payment_provider_not_supported':
      return 'Текущий платежный провайдер пока не подключен.';
    default:
      return 'Не удалось продолжить оплату. Попробуйте еще раз.';
  }
}

interface OrderPaymentActionProps {
  orderId: string;
  label: string;
}

export function OrderPaymentAction({ orderId, label }: OrderPaymentActionProps) {
  const router = useRouter();
  const unauthorizedMessage = useTelegramUnauthorizedMessage(
    'Откройте MainStore в Telegram, чтобы продолжить оплату.',
  );
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isSubmittingRef = useRef(false);

  const handleClick = () => {
    if (isPending || isSubmittingRef.current) {
      return;
    }

    isSubmittingRef.current = true;

    startTransition(async () => {
      setErrorMessage(null);

      try {
        const response = await fetch(`/api/store/orders/${orderId}/payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ idempotencyKey: crypto.randomUUID() }),
        });

        const payload = (await response.json().catch(() => null)) as
          | {
              ok: true;
              checkoutUrl?: string | null;
              orderId: string;
            }
          | {
              ok: false;
              error?: string;
            }
          | null;

        if (!response.ok || !payload || !payload.ok) {
          setErrorMessage(
            mapRetryPaymentError(
              payload && !payload.ok ? payload.error : undefined,
              unauthorizedMessage,
            ),
          );
          return;
        }

        if (payload.checkoutUrl) {
          window.location.href = payload.checkoutUrl;
          return;
        }

        router.push(`/orders/${payload.orderId}`);
        router.refresh();
      } catch {
        setErrorMessage('Сетевая ошибка при продолжении оплаты.');
      } finally {
        isSubmittingRef.current = false;
      }
    });
  };

  return (
    <div className={styles.inlineActionStack}>
      <button
        type="button"
        className={styles.primaryButton}
        onClick={handleClick}
        disabled={isPending}
      >
        {isPending ? 'Открываем оплату...' : label}
      </button>
      {errorMessage ? <p className={styles.inlineActionMessageError}>{errorMessage}</p> : null}
    </div>
  );
}

'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { useTelegramUnauthorizedMessage } from '@/components/auth/TelegramSessionBootstrap';

import styles from './store.module.css';

function mapSandboxError(error: string | undefined, unauthorizedMessage: string): string {
  switch (error) {
    case 'unauthorized':
      return unauthorizedMessage;
    case 'payment_attempt_not_found':
      return 'Платёжная сессия не найдена.';
    case 'order_not_found':
      return 'Заказ не найден.';
    case 'not_configured':
      return 'Платёжный sandbox временно недоступен.';
    default:
      return 'Не удалось обновить платёжный статус. Попробуйте ещё раз.';
  }
}

interface SandboxPaymentActionsProps {
  attemptId: string;
  orderId: string;
}

export function SandboxPaymentActions({ attemptId, orderId }: SandboxPaymentActionsProps) {
  const router = useRouter();
  const unauthorizedMessage = useTelegramUnauthorizedMessage(
    'Откройте MainStore в Telegram, чтобы завершить оплату.',
  );
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isSubmittingRef = useRef(false);

  const submitAction = (action: 'paid' | 'failed' | 'cancelled') => {
    if (isPending || isSubmittingRef.current) {
      return;
    }

    isSubmittingRef.current = true;
    startTransition(async () => {
      setErrorMessage(null);

      try {
        const response = await fetch(`/api/store/payments/sandbox/${attemptId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ action }),
        });

        const payload = (await response.json().catch(() => null)) as
          | { ok: true; paymentStatus?: string }
          | { ok: false; error?: string }
          | null;

        if (!response.ok || !payload || !payload.ok) {
          setErrorMessage(mapSandboxError(payload && !payload.ok ? payload.error : undefined, unauthorizedMessage));
          return;
        }

        const query = action === 'paid' ? 'success' : action === 'failed' ? 'failed' : 'cancel';
        router.replace(`/orders/${orderId}?payment=${query}`);
      } catch {
        setErrorMessage('Сетевая ошибка при обновлении оплаты.');
      } finally {
        isSubmittingRef.current = false;
      }
    });
  };

  return (
    <div className={styles.paymentActionGrid}>
      <button
        type="button"
        className={styles.primaryButton}
        onClick={() => submitAction('paid')}
        disabled={isPending}
      >
        {isPending ? 'Обрабатываем...' : 'Оплатить'}
      </button>
      <button
        type="button"
        className={styles.secondaryButton}
        onClick={() => submitAction('failed')}
        disabled={isPending}
      >
        Сообщить об ошибке
      </button>
      <button
        type="button"
        className={styles.secondaryButton}
        onClick={() => submitAction('cancelled')}
        disabled={isPending}
      >
        Отменить оплату
      </button>
      {errorMessage && (
        <p className={`${styles.inlineActionMessage} ${styles.inlineActionMessageError}`}>
          {errorMessage}
        </p>
      )}
    </div>
  );
}


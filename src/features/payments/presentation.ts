import type { PaymentProvider, PaymentStatus } from '@/types/db';

export function formatPaymentStatus(status: PaymentStatus): string {
  switch (status) {
    case 'pending':
      return 'Запускается';
    case 'requires_action':
      return 'Ожидает оплаты';
    case 'paid':
      return 'Оплачено';
    case 'failed':
      return 'Ошибка оплаты';
    case 'cancelled':
      return 'Оплата отменена';
    case 'expired':
      return 'Сессия истекла';
    default:
      return status;
  }
}

export function formatPaymentProvider(provider: PaymentProvider | null): string {
  switch (provider) {
    case 'sandbox':
      return 'Тестовый шлюз';
    case 'legacy':
      return 'Старый поток без онлайн-оплаты';
    default:
      return 'Не выбран';
  }
}

export function canRetryPayment(status: PaymentStatus, orderStatus: string): boolean {
  if (orderStatus === 'cancelled') {
    return false;
  }

  return ['pending', 'requires_action', 'failed', 'cancelled', 'expired'].includes(status);
}

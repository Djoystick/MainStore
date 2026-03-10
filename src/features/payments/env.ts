import type { PaymentProvider } from '@/types/db';

export function getRuntimePaymentProvider(): Exclude<PaymentProvider, 'legacy'> {
  const raw = process.env.PAYMENT_PROVIDER?.trim().toLowerCase();

  if (!raw || raw === 'sandbox') {
    return 'sandbox';
  }

  throw new Error(`Unsupported PAYMENT_PROVIDER: ${raw}`);
}

export function getPaymentWebhookSecretOptional(provider: Exclude<PaymentProvider, 'legacy'>): string | null {
  switch (provider) {
    case 'sandbox':
      return process.env.PAYMENT_SANDBOX_WEBHOOK_SECRET?.trim() || null;
    default:
      return null;
  }
}

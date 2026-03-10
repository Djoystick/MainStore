import type { NextRequest } from 'next/server';

import { getPaymentWebhookSecretOptional } from '@/features/payments/env';
import type { PaymentStatus } from '@/types/db';

import type {
  PaymentProviderAdapter,
  PaymentSessionContext,
  PaymentSessionDescriptor,
  PaymentWebhookEvent,
} from './base';

function isPaymentStatus(value: unknown): value is PaymentStatus {
  return (
    value === 'pending' ||
    value === 'requires_action' ||
    value === 'paid' ||
    value === 'failed' ||
    value === 'cancelled' ||
    value === 'expired'
  );
}

export const sandboxPaymentProvider: PaymentProviderAdapter = {
  provider: 'sandbox',
  async createPaymentSession(input: PaymentSessionContext): Promise<PaymentSessionDescriptor> {
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    return {
      provider: 'sandbox',
      status: 'requires_action',
      checkoutUrl: `${input.appOrigin}/pay/sandbox/${input.attemptId}`,
      providerReference: `sandbox_${input.attemptId}`,
      expiresAt,
      metadata: {
        return_url: input.returnUrl,
        cancel_url: input.cancelUrl,
      },
    };
  },

  async parseWebhook(request: NextRequest): Promise<PaymentWebhookEvent | null> {
    const secret = getPaymentWebhookSecretOptional('sandbox');
    const providedSecret = request.headers.get('x-payment-webhook-secret');

    if (secret && providedSecret !== secret) {
      return null;
    }

    const body = (await request.json().catch(() => null)) as
      | {
          attemptId?: string;
          status?: PaymentStatus;
          providerReference?: string;
          errorCode?: string;
          errorMessage?: string;
          completedAt?: string;
        }
      | null;

    if (!body?.attemptId || !isPaymentStatus(body.status)) {
      return null;
    }

    return {
      attemptId: body.attemptId,
      status: body.status,
      providerReference: body.providerReference ?? `sandbox_${body.attemptId}`,
      errorCode: body.errorCode ?? null,
      errorMessage: body.errorMessage ?? null,
      completedAt: body.completedAt ?? null,
    };
  },
};

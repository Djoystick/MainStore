import type { NextRequest } from 'next/server';

import type { Json, PaymentProvider, PaymentStatus } from '@/types/db';

export interface PaymentSessionContext {
  attemptId: string;
  orderId: string;
  amount: number;
  currency: string;
  appOrigin: string;
  customerDisplayName: string | null;
  customerPhone: string | null;
  returnUrl: string;
  cancelUrl: string;
  metadata?: Json;
}

export interface PaymentSessionDescriptor {
  provider: Exclude<PaymentProvider, 'legacy'>;
  status: PaymentStatus;
  checkoutUrl: string | null;
  providerReference: string;
  expiresAt: string | null;
  metadata?: Json;
}

export interface PaymentWebhookEvent {
  attemptId: string;
  status: PaymentStatus;
  providerReference?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  completedAt?: string | null;
}

export interface PaymentProviderAdapter {
  provider: Exclude<PaymentProvider, 'legacy'>;
  createPaymentSession(input: PaymentSessionContext): Promise<PaymentSessionDescriptor>;
  parseWebhook(request: NextRequest): Promise<PaymentWebhookEvent | null>;
}

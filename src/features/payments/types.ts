import type { Json, PaymentProvider, PaymentStatus } from '@/types/db';

export interface PaymentAttemptSummary {
  id: string;
  orderId: string;
  userId: string;
  provider: PaymentProvider;
  status: PaymentStatus;
  idempotencyKey: string;
  amount: number;
  currency: string;
  checkoutUrl: string | null;
  providerReference: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  metadata: Json;
  expiresAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentInitiationResult {
  ok: boolean;
  error?: string;
  orderId?: string;
  paymentAttemptId?: string;
  paymentStatus?: PaymentStatus;
  paymentProvider?: PaymentProvider | null;
  checkoutUrl?: string | null;
  totalAmount?: number;
  totalCents?: number;
  currency?: string;
}

export interface PaymentUpdateResult {
  ok: boolean;
  error?: string;
  orderId?: string;
  paymentAttemptId?: string;
  paymentStatus?: PaymentStatus;
  orderStatus?: string;
}

export interface PaymentUpdatePayload {
  status: PaymentStatus;
  providerReference?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  completedAt?: string | null;
}

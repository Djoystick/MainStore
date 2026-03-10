import 'server-only';

import {
  createSupabaseAdminClientOptional,
  getSupabaseAdminMissingEnvMessage,
} from '@/lib/supabase';
import type { Database, Json } from '@/types/db';
import { canRetryPayment } from '@/features/payments';

type OrderRow = Database['public']['Tables']['orders']['Row'];
type OrderItemRow = Database['public']['Tables']['order_items']['Row'];
type PaymentAttemptRow = Database['public']['Tables']['payment_attempts']['Row'];
type OrderStatus = Database['public']['Enums']['order_status'];
type PaymentStatus = Database['public']['Enums']['payment_status'];
type PaymentProvider = Database['public']['Enums']['payment_provider'];

interface ShippingAddressSnapshot {
  city: string | null;
  addressLine: string | null;
  postalCode: string | null;
}

export interface OrderListItem {
  id: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentProvider: PaymentProvider | null;
  totalCents: number;
  currency: string;
  createdAt: string;
  itemsCount: number;
  latestPaymentAttemptId: string | null;
  canRetryPayment: boolean;
}

export interface OrderListResult {
  status: 'ok' | 'unauthorized' | 'not_configured' | 'error';
  orders: OrderListItem[];
  totalOrders: number;
  inProgressOrders: number;
  message?: string;
}

export interface OrderDetailItem {
  id: string;
  quantity: number;
  productTitle: string;
  productSlug: string | null;
  productImageUrl: string | null;
  unitPriceCents: number;
  lineTotalCents: number;
  currency: string;
}

export interface OrderDetail {
  id: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentProvider: PaymentProvider | null;
  paymentCompletedAt: string | null;
  paymentLastError: string | null;
  totalCents: number;
  subtotalCents: number;
  discountCents: number;
  currency: string;
  createdAt: string;
  customerDisplayName: string | null;
  customerPhone: string | null;
  shippingAddress: ShippingAddressSnapshot;
  notes: string | null;
  items: OrderDetailItem[];
  latestPaymentAttempt: {
    id: string;
    status: PaymentStatus;
    provider: PaymentProvider;
    checkoutUrl: string | null;
    expiresAt: string | null;
  } | null;
  canRetryPayment: boolean;
}

export interface OrderDetailResult {
  status:
    | 'ok'
    | 'unauthorized'
    | 'not_configured'
    | 'not_found'
    | 'error';
  order: OrderDetail | null;
  message?: string;
}

function toPriceCents(price: unknown): number {
  if (typeof price === 'number' && Number.isFinite(price)) {
    return Math.round(price * 100);
  }

  const parsed = Number(price);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
}

function parseShippingAddress(shippingAddress: Json): ShippingAddressSnapshot {
  if (!shippingAddress || typeof shippingAddress !== 'object' || Array.isArray(shippingAddress)) {
    return {
      city: null,
      addressLine: null,
      postalCode: null,
    };
  }

  const city = typeof shippingAddress.city === 'string' ? shippingAddress.city : null;
  const addressLine =
    typeof shippingAddress.address_line === 'string' ? shippingAddress.address_line : null;
  const postalCode =
    typeof shippingAddress.postal_code === 'string' ? shippingAddress.postal_code : null;

  return {
    city,
    addressLine,
    postalCode,
  };
}

function toPublicDataErrorMessage(baseMessage: string, details: string): string {
  if (process.env.NODE_ENV === 'development') {
    return `${baseMessage} Подробности: ${details}`;
  }
  return baseMessage;
}

export async function getOrdersForProfile(
  profileId: string | null,
): Promise<OrderListResult> {
  if (!profileId) {
    return {
      status: 'unauthorized',
      orders: [],
      totalOrders: 0,
      inProgressOrders: 0,
    };
  }

  const client = createSupabaseAdminClientOptional();
  if (!client) {
    return {
      status: 'not_configured',
      orders: [],
      totalOrders: 0,
      inProgressOrders: 0,
      message: toPublicDataErrorMessage(
        'Заказы временно недоступны.',
        getSupabaseAdminMissingEnvMessage(),
      ),
    };
  }

  const ordersResult = await client
    .from('orders')
    .select('id, status, payment_status, payment_provider, total_amount, currency, created_at')
    .eq('user_id', profileId)
    .order('created_at', { ascending: false });

  if (ordersResult.error) {
    return {
      status: 'error',
      orders: [],
      totalOrders: 0,
      inProgressOrders: 0,
      message: toPublicDataErrorMessage(
        'Сейчас не удалось загрузить заказы.',
        ordersResult.error.message,
      ),
    };
  }

  const orderRows = (ordersResult.data ?? []) as Array<
    Pick<
      OrderRow,
      'id' | 'status' | 'payment_status' | 'payment_provider' | 'total_amount' | 'currency' | 'created_at'
    >
  >;

  if (orderRows.length === 0) {
    return {
      status: 'ok',
      orders: [],
      totalOrders: 0,
      inProgressOrders: 0,
    };
  }

  const orderIds = orderRows.map((row) => row.id);
  const [itemsResult, attemptsResult] = await Promise.all([
    client.from('order_items').select('order_id, quantity').in('order_id', orderIds),
    client
      .from('payment_attempts')
      .select('id, order_id, status, provider, checkout_url, expires_at, created_at')
      .in('order_id', orderIds)
      .order('created_at', { ascending: false }),
  ]);

  if (itemsResult.error) {
    return {
      status: 'error',
      orders: [],
      totalOrders: 0,
      inProgressOrders: 0,
      message: toPublicDataErrorMessage(
        'Сейчас не удалось загрузить позиции заказа.',
        itemsResult.error.message,
      ),
    };
  }

  if (attemptsResult.error) {
    return {
      status: 'error',
      orders: [],
      totalOrders: 0,
      inProgressOrders: 0,
      message: toPublicDataErrorMessage(
        'Сейчас не удалось загрузить платёжные попытки.',
        attemptsResult.error.message,
      ),
    };
  }

  const itemRows = (itemsResult.data ?? []) as Array<Pick<OrderItemRow, 'order_id' | 'quantity'>>;
  const attemptRows = (attemptsResult.data ?? []) as Array<
    Pick<PaymentAttemptRow, 'id' | 'order_id' | 'status' | 'provider' | 'checkout_url' | 'expires_at' | 'created_at'>
  >;

  const itemsCountByOrderId = new Map<string, number>();
  itemRows.forEach((row) => {
    const existing = itemsCountByOrderId.get(row.order_id) ?? 0;
    itemsCountByOrderId.set(row.order_id, existing + row.quantity);
  });

  const latestAttemptByOrderId = new Map<string, (typeof attemptRows)[number]>();
  attemptRows.forEach((row) => {
    if (!latestAttemptByOrderId.has(row.order_id)) {
      latestAttemptByOrderId.set(row.order_id, row);
    }
  });

  const orders: OrderListItem[] = orderRows.map((row) => {
    const latestAttempt = latestAttemptByOrderId.get(row.id) ?? null;
    return {
      id: row.id,
      status: row.status,
      paymentStatus: row.payment_status,
      paymentProvider: row.payment_provider,
      totalCents: toPriceCents(row.total_amount),
      currency: row.currency,
      createdAt: row.created_at,
      itemsCount: itemsCountByOrderId.get(row.id) ?? 0,
      latestPaymentAttemptId: latestAttempt?.id ?? null,
      canRetryPayment: canRetryPayment(row.payment_status, row.status),
    };
  });

  const inProgressOrders = orders.filter(
    (order) => !['delivered', 'cancelled'].includes(order.status),
  ).length;

  return {
    status: 'ok',
    orders,
    totalOrders: orders.length,
    inProgressOrders,
  };
}

export async function getOrderDetailForProfile(
  profileId: string | null,
  orderId: string,
): Promise<OrderDetailResult> {
  if (!profileId) {
    return {
      status: 'unauthorized',
      order: null,
    };
  }

  const client = createSupabaseAdminClientOptional();
  if (!client) {
    return {
      status: 'not_configured',
      order: null,
      message: toPublicDataErrorMessage(
        'Детали заказа временно недоступны.',
        getSupabaseAdminMissingEnvMessage(),
      ),
    };
  }

  const orderResult = await client
    .from('orders')
    .select(
      'id, status, payment_status, payment_provider, payment_completed_at, payment_last_error, total_amount, subtotal_amount, discount_amount, currency, created_at, customer_display_name, customer_phone, shipping_address, notes',
    )
    .eq('user_id', profileId)
    .eq('id', orderId)
    .maybeSingle();

  if (orderResult.error) {
    return {
      status: 'error',
      order: null,
      message: toPublicDataErrorMessage(
        'Сейчас не удалось загрузить детали заказа.',
        orderResult.error.message,
      ),
    };
  }

  if (!orderResult.data) {
    return {
      status: 'not_found',
      order: null,
    };
  }

  const orderRow = orderResult.data as Pick<
    OrderRow,
    | 'id'
    | 'status'
    | 'payment_status'
    | 'payment_provider'
    | 'payment_completed_at'
    | 'payment_last_error'
    | 'total_amount'
    | 'subtotal_amount'
    | 'discount_amount'
    | 'currency'
    | 'created_at'
    | 'customer_display_name'
    | 'customer_phone'
    | 'shipping_address'
    | 'notes'
  >;

  const [itemsResult, attemptResult] = await Promise.all([
    client
      .from('order_items')
      .select(
        'id, quantity, product_title, product_slug, product_image_url, unit_price, line_total, currency',
      )
      .eq('order_id', orderRow.id)
      .order('created_at', { ascending: true }),
    client
      .from('payment_attempts')
      .select('id, status, provider, checkout_url, expires_at, created_at')
      .eq('order_id', orderRow.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (itemsResult.error) {
    return {
      status: 'error',
      order: null,
      message: toPublicDataErrorMessage(
        'Сейчас не удалось загрузить позиции заказа.',
        itemsResult.error.message,
      ),
    };
  }

  if (attemptResult.error) {
    return {
      status: 'error',
      order: null,
      message: toPublicDataErrorMessage(
        'Сейчас не удалось загрузить платёжный статус заказа.',
        attemptResult.error.message,
      ),
    };
  }

  const itemRows = (itemsResult.data ?? []) as Array<
    Pick<
      OrderItemRow,
      | 'id'
      | 'quantity'
      | 'product_title'
      | 'product_slug'
      | 'product_image_url'
      | 'unit_price'
      | 'line_total'
      | 'currency'
    >
  >;

  const latestAttempt = (attemptResult.data ?? null) as Pick<
    PaymentAttemptRow,
    'id' | 'status' | 'provider' | 'checkout_url' | 'expires_at' | 'created_at'
  > | null;

  const items: OrderDetailItem[] = itemRows.map((item) => ({
    id: item.id,
    quantity: item.quantity,
    productTitle: item.product_title,
    productSlug: item.product_slug,
    productImageUrl: item.product_image_url,
    unitPriceCents: toPriceCents(item.unit_price),
    lineTotalCents: toPriceCents(item.line_total),
    currency: item.currency,
  }));

  return {
    status: 'ok',
    order: {
      id: orderRow.id,
      status: orderRow.status,
      paymentStatus: orderRow.payment_status,
      paymentProvider: orderRow.payment_provider,
      paymentCompletedAt: orderRow.payment_completed_at,
      paymentLastError: orderRow.payment_last_error,
      totalCents: toPriceCents(orderRow.total_amount),
      subtotalCents: toPriceCents(orderRow.subtotal_amount),
      discountCents: toPriceCents(orderRow.discount_amount),
      currency: orderRow.currency,
      createdAt: orderRow.created_at,
      customerDisplayName: orderRow.customer_display_name,
      customerPhone: orderRow.customer_phone,
      shippingAddress: parseShippingAddress(orderRow.shipping_address),
      notes: orderRow.notes,
      items,
      latestPaymentAttempt: latestAttempt
        ? {
            id: latestAttempt.id,
            status: latestAttempt.status,
            provider: latestAttempt.provider,
            checkoutUrl: latestAttempt.checkout_url,
            expiresAt: latestAttempt.expires_at,
          }
        : null,
      canRetryPayment: canRetryPayment(orderRow.payment_status, orderRow.status),
    },
  };
}

export async function getLatestOrderForProfile(
  profileId: string | null,
): Promise<OrderListItem | null> {
  const listResult = await getOrdersForProfile(profileId);
  if (listResult.status !== 'ok') {
    return null;
  }
  return listResult.orders[0] ?? null;
}

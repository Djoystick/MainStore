import Link from 'next/link';
import type { CSSProperties } from 'react';

import { TelegramSessionRequiredState } from '@/components/auth/TelegramSessionRequiredState';
import { StoreEmptyState } from '@/components/store/StoreEmptyState';
import { OrderPaymentAction } from '@/components/store/OrderPaymentAction';
import { OrderRepeatAction } from '@/components/store/OrderRepeatAction';
import { StoreScreen } from '@/components/store/StoreScreen';
import { StoreSection } from '@/components/store/StoreSection';
import { formatStorePrice } from '@/components/store/formatPrice';
import { classNames } from '@/css/classnames';
import { getCurrentUserContext } from '@/features/auth';
import { formatPaymentProvider, formatPaymentStatus } from '@/features/payments';
import { getOrderDetailForProfile } from '@/features/orders/data';
import styles from '@/components/store/store.module.css';

function formatOrderDate(value: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatOrderStatus(status: string): string {
  switch (status) {
    case 'pending':
      return 'РћР¶РёРґР°РµС‚';
    case 'confirmed':
      return 'РџРѕРґС‚РІРµСЂР¶РґС‘РЅ';
    case 'processing':
      return 'Р’ РѕР±СЂР°Р±РѕС‚РєРµ';
    case 'shipped':
      return 'РћС‚РїСЂР°РІР»РµРЅ';
    case 'delivered':
      return 'Р”РѕСЃС‚Р°РІР»РµРЅ';
    case 'cancelled':
      return 'РћС‚РјРµРЅС‘РЅ';
    default:
      return status;
  }
}

function getOrderStatusClass(status: string): string {
  switch (status) {
    case 'pending':
      return styles.orderStatusPending;
    case 'confirmed':
      return styles.orderStatusConfirmed;
    case 'processing':
      return styles.orderStatusProcessing;
    case 'shipped':
      return styles.orderStatusShipped;
    case 'delivered':
      return styles.orderStatusDelivered;
    case 'cancelled':
      return styles.orderStatusCancelled;
    default:
      return '';
  }
}

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

function mapPaymentQueryNotice(value: string | undefined): { title: string; text: string; isError?: boolean } | null {
  switch (value) {
    case 'success':
      return {
        title: 'РћРїР»Р°С‚Р° РїРѕРґС‚РІРµСЂР¶РґРµРЅР°',
        text: 'РџР»Р°С‚С‘Р¶ Р·Р°РІРµСЂС€С‘РЅ, Р·Р°РєР°Р· РїРµСЂРµРІРµРґС‘РЅ РІ РїРѕРґС‚РІРµСЂР¶РґС‘РЅРЅРѕРµ СЃРѕСЃС‚РѕСЏРЅРёРµ.',
      };
    case 'cancel':
      return {
        title: 'РћРїР»Р°С‚Р° РѕС‚РјРµРЅРµРЅР°',
        text: 'Р’С‹ РјРѕР¶РµС‚Рµ РІРµСЂРЅСѓС‚СЊСЃСЏ Рє Р·Р°РєР°Р·Сѓ Рё Р·Р°РїСѓСЃС‚РёС‚СЊ РѕРїР»Р°С‚Сѓ РїРѕРІС‚РѕСЂРЅРѕ.',
        isError: true,
      };
    case 'failed':
      return {
        title: 'РћРїР»Р°С‚Р° РЅРµ РїСЂРѕС€Р»Р°',
        text: 'РџСЂРѕРІРµСЂСЊС‚Рµ Р·Р°РєР°Р· Рё РїРѕРїСЂРѕР±СѓР№С‚Рµ РѕРїР»Р°С‚РёС‚СЊ РµРіРѕ РµС‰С‘ СЂР°Р·.',
        isError: true,
      };
    default:
      return null;
  }
}

function buildImageStyle(imageUrl: string | null): CSSProperties {
  if (imageUrl) {
    return {
      backgroundImage: `linear-gradient(rgba(12, 18, 31, 0.15), rgba(12, 18, 31, 0.15)), url(${imageUrl})`,
      backgroundPosition: 'center',
      backgroundSize: 'cover',
    };
  }

  return {
    background: 'linear-gradient(135deg, #9fb8ff 0%, #5f7de8 100%)',
  };
}

function getNextActionSummary(input: {
  status: string;
  paymentStatus: string;
  canRetryPayment: boolean;
}): { title: string; text: string } {
  if (input.canRetryPayment) {
    return {
      title: 'РќСѓР¶РЅРѕ Р·Р°РІРµСЂС€РёС‚СЊ РѕРїР»Р°С‚Сѓ',
      text: 'Р—Р°РєР°Р· СѓР¶Рµ СЃРѕР·РґР°РЅ. РџСЂРѕРґРѕР»Р¶РёС‚Рµ РѕРїР»Р°С‚Сѓ, С‡С‚РѕР±С‹ РјР°РіР°Р·РёРЅ РЅР°С‡Р°Р» РµРіРѕ РѕР±СЂР°Р±РѕС‚РєСѓ.',
    };
  }

  if (input.status === 'processing') {
    return {
      title: 'Р—Р°РєР°Р· РІ СЂР°Р±РѕС‚Рµ',
      text: 'РњС‹ СѓР¶Рµ РѕР±СЂР°Р±Р°С‚С‹РІР°РµРј Р·Р°РєР°Р·. РЎР»РµРґСѓСЋС‰РµРµ Р·Р°РјРµС‚РЅРѕРµ РѕР±РЅРѕРІР»РµРЅРёРµ РїРѕСЏРІРёС‚СЃСЏ, РєРѕРіРґР° РѕРЅ Р±СѓРґРµС‚ РѕС‚РїСЂР°РІР»РµРЅ.',
    };
  }

  if (input.status === 'shipped') {
    return {
      title: 'Р—Р°РєР°Р· РѕС‚РїСЂР°РІР»РµРЅ',
      text: 'Р”Р°Р»СЊС€Рµ РѕСЃС‚Р°С‘С‚СЃСЏ РґРѕР¶РґР°С‚СЊСЃСЏ РґРѕСЃС‚Р°РІРєРё. Р’СЃРµ РїРѕР·РёС†РёРё Рё Р°РґСЂРµСЃ СЃРѕС…СЂР°РЅРµРЅС‹ РІ РґРµС‚Р°Р»СЏС… РЅРёР¶Рµ.',
    };
  }

  if (input.status === 'delivered') {
    return {
      title: 'Р—Р°РєР°Р· Р·Р°РІРµСЂС€С‘РЅ',
      text: 'РњРѕР¶РЅРѕ РІРµСЂРЅСѓС‚СЊСЃСЏ РІ РєР°С‚Р°Р»РѕРі РёР»Рё РїРѕРІС‚РѕСЂРёС‚СЊ Р·Р°РєР°Р·, РµСЃР»Рё С…РѕС‚РёС‚Рµ РєСѓРїРёС‚СЊ СЌС‚Рё РїРѕР·РёС†РёРё СЃРЅРѕРІР°.',
    };
  }

  if (input.status === 'cancelled') {
    return {
      title: 'Р—Р°РєР°Р· РѕС‚РјРµРЅС‘РЅ',
      text: 'Р•СЃР»Рё РїРѕР·РёС†РёРё РІСЃС‘ РµС‰С‘ Р°РєС‚СѓР°Р»СЊРЅС‹, РјРѕР¶РЅРѕ СЃРѕР±СЂР°С‚СЊ РЅРѕРІС‹Р№ Р·Р°РєР°Р· С‡РµСЂРµР· РєР°С‚Р°Р»РѕРі РёР»Рё РїРѕРІС‚РѕСЂ Р·Р°РєР°Р·Р°.',
    };
  }

  if (input.paymentStatus === 'paid') {
    return {
      title: 'РћРїР»Р°С‚Р° РїРѕРґС‚РІРµСЂР¶РґРµРЅР°',
      text: 'Р—Р°РєР°Р· РѕРїР»Р°С‡РµРЅ Рё РѕР¶РёРґР°РµС‚ РґР°Р»СЊРЅРµР№С€РµРіРѕ РѕР±РЅРѕРІР»РµРЅРёСЏ СЃС‚Р°С‚СѓСЃР° РјР°РіР°Р·РёРЅР°.',
    };
  }

  return {
    title: 'РЎР»РµРґРёС‚Рµ Р·Р° СЃС‚Р°С‚СѓСЃРѕРј',
    text: 'Р’СЃРµ РѕР±РЅРѕРІР»РµРЅРёСЏ РїРѕ РѕРїР»Р°С‚Рµ Рё РѕР±СЂР°Р±РѕС‚РєРµ Р±СѓРґСѓС‚ РїРѕСЏРІР»СЏС‚СЊСЃСЏ РїСЂСЏРјРѕ РІ СЌС‚РѕР№ РєР°СЂС‚РѕС‡РєРµ.',
  };
}

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>;
  searchParams?: Promise<{ payment?: string }>;
}) {
  const { orderId } = await params;
  const paymentNotice = mapPaymentQueryNotice((await searchParams)?.payment);
  const { profile } = await getCurrentUserContext();
  const orderData = await getOrderDetailForProfile(profile?.id ?? null, orderId);
  const order = orderData.order;

  if (orderData.status === 'unauthorized') {
    return (
      <StoreScreen title="Заказ" subtitle="Детали заказа и доставка" back={true}>
        <TelegramSessionRequiredState
          fallbackTitle="Нужна сессия Telegram"
          fallbackDescription="Откройте MainStore в Telegram, чтобы посмотреть свои заказы."
          fallbackActionLabel="Открыть каталог"
          fallbackActionHref="/catalog"
          retryHref={`/orders/${orderId}`}
        />
      </StoreScreen>
    );
  }

  if (orderData.status === 'not_found') {
    return (
      <StoreScreen title="Р—Р°РєР°Р·" subtitle="Р”РµС‚Р°Р»Рё Р·Р°РєР°Р·Р° Рё РґРѕСЃС‚Р°РІРєР°" back={true}>
        <StoreEmptyState
          title="Р—Р°РєР°Р· РЅРµ РЅР°Р№РґРµРЅ"
          description="РўР°РєРѕРіРѕ Р·Р°РєР°Р·Р° РЅРµС‚ РёР»Рё РѕРЅ РЅРµ РѕС‚РЅРѕСЃРёС‚СЃСЏ Рє РІР°С€РµРјСѓ Р°РєРєР°СѓРЅС‚Сѓ."
          actionLabel="Рљ Р·Р°РєР°Р·Р°Рј"
          actionHref="/orders"
        />
      </StoreScreen>
    );
  }

  const nextAction = order
    ? getNextActionSummary({
        status: order.status,
        paymentStatus: order.paymentStatus,
        canRetryPayment: order.canRetryPayment,
      })
    : null;

  return (
    <StoreScreen title="Р—Р°РєР°Р·" subtitle="Р”РµС‚Р°Р»Рё Р·Р°РєР°Р·Р° Рё РґРѕСЃС‚Р°РІРєР°" back={true}>
      {paymentNotice ? (
        <section className={classNames(styles.dataNotice, paymentNotice.isError && styles.dataNoticeError)}>
          <p className={styles.dataNoticeTitle}>{paymentNotice.title}</p>
          <p className={styles.dataNoticeText}>{paymentNotice.text}</p>
        </section>
      ) : null}

      {orderData.message ? (
        <section
          className={classNames(
            styles.dataNotice,
            orderData.status === 'error' && styles.dataNoticeError,
          )}
        >
          <p className={styles.dataNoticeTitle}>РћР±РЅРѕРІР»РµРЅРёРµ Р·Р°РєР°Р·Р°</p>
          <p className={styles.dataNoticeText}>{orderData.message}</p>
          {(orderData.status === 'error' || orderData.status === 'not_configured') ? (
            <div className={styles.dataNoticeActions}>
              <Link href={`/orders/${orderId}`} className={styles.dataNoticeRetry} aria-label="РџРѕРІС‚РѕСЂРёС‚СЊ Р·Р°РіСЂСѓР·РєСѓ Р·Р°РєР°Р·Р°">
                РџРѕРІС‚РѕСЂРёС‚СЊ
              </Link>
            </div>
          ) : null}
        </section>
      ) : null}

      {order ? (
        <>
          <section className={styles.panel}>
            <div className={styles.orderCardHeader}>
              <h2 className={styles.panelTitle}>Р—Р°РєР°Р· #{order.id.slice(0, 8).toUpperCase()}</h2>
              <p className={styles.orderMetaItem}>{formatOrderDate(order.createdAt)}</p>
            </div>

            <div className={styles.paymentBadgeRow}>
              <span className={classNames(styles.orderStatusBadge, getOrderStatusClass(order.status))}>
                {formatOrderStatus(order.status)}
              </span>
              <span className={classNames(styles.paymentStatusBadge, getPaymentStatusClass(order.paymentStatus))}>
                {formatPaymentStatus(order.paymentStatus)}
              </span>
            </div>

            <p className={styles.checkoutHint}>РџСЂРѕРІР°Р№РґРµСЂ: {formatPaymentProvider(order.paymentProvider)}</p>
            {order.paymentCompletedAt ? (
              <p className={styles.checkoutHint}>РћРїР»Р°С‚Р° РїРѕРґС‚РІРµСЂР¶РґРµРЅР° {formatOrderDate(order.paymentCompletedAt)}</p>
            ) : null}
            {order.paymentLastError ? (
              <p className={classNames(styles.inlineActionMessage, styles.inlineActionMessageError)}>{order.paymentLastError}</p>
            ) : null}
          </section>

          {nextAction ? (
            <section className={styles.panel}>
              <h2 className={styles.panelTitle}>{nextAction.title}</h2>
              <p className={styles.panelText}>{nextAction.text}</p>
              <div className={styles.panelActions}>
                {order.canRetryPayment ? <OrderPaymentAction orderId={order.id} label="РџСЂРѕРґРѕР»Р¶РёС‚СЊ РѕРїР»Р°С‚Сѓ" /> : null}
                <OrderRepeatAction orderId={order.id} />
                <Link href="/catalog" className={styles.secondaryButton}>
                  Р’РµСЂРЅСѓС‚СЊСЃСЏ РІ РєР°С‚Р°Р»РѕРі
                </Link>
              </div>
            </section>
          ) : null}

          <StoreSection title="РЎРІРѕРґРєР°">
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <p className={styles.infoLabel}>РџРѕРґС‹С‚РѕРі</p>
                <p className={styles.infoValue}>{formatStorePrice(order.subtotalCents, order.currency)}</p>
              </div>
              {order.discountCents > 0 ? (
                <div className={styles.infoItem}>
                  <p className={styles.infoLabel}>РЎРєРёРґРєР°</p>
                  <p className={styles.infoValue}>{formatStorePrice(order.discountCents, order.currency)}</p>
                </div>
              ) : null}
              <div className={styles.infoItem}>
                <p className={styles.infoLabel}>РС‚РѕРіРѕ</p>
                <p className={styles.infoValue}>{formatStorePrice(order.totalCents, order.currency)}</p>
              </div>
              <div className={styles.infoItem}>
                <p className={styles.infoLabel}>РџРѕР·РёС†РёРё</p>
                <p className={styles.infoValue}>{order.items.length}</p>
              </div>
            </div>
          </StoreSection>

          <StoreSection title="Р”РѕСЃС‚Р°РІРєР°">
            <div className={styles.orderDetailsGrid}>
              <p className={styles.orderDetailsValue}>{order.customerDisplayName || 'РџРѕРєСѓРїР°С‚РµР»СЊ'}</p>
              <p className={styles.orderDetailsValue}>{order.customerPhone || 'РўРµР»РµС„РѕРЅ РЅРµ СѓРєР°Р·Р°РЅ'}</p>
              <p className={styles.orderDetailsMuted}>{order.shippingAddress.city || 'Р“РѕСЂРѕРґ РЅРµ СѓРєР°Р·Р°РЅ'}</p>
              <p className={styles.orderDetailsMuted}>{order.shippingAddress.addressLine || 'РђРґСЂРµСЃ РЅРµ СѓРєР°Р·Р°РЅ'}</p>
              {order.shippingAddress.postalCode ? (
                <p className={styles.orderDetailsMuted}>РРЅРґРµРєСЃ: {order.shippingAddress.postalCode}</p>
              ) : null}
            </div>
          </StoreSection>

          <StoreSection title="РЎРѕСЃС‚Р°РІ Р·Р°РєР°Р·Р°">
            <div className={styles.orderItemsList}>
              {order.items.map((item) => {
                const preview = (
                  <>
                    <div className={styles.orderItemImage} style={buildImageStyle(item.productImageUrl)} />
                    <div className={styles.orderItemMeta}>
                      <p className={styles.orderItemTitle}>{item.productTitle}</p>
                      <p className={styles.orderItemSub}>
                        {item.quantity} x {formatStorePrice(item.unitPriceCents, item.currency)}
                      </p>
                      <p className={styles.orderItemTotal}>{formatStorePrice(item.lineTotalCents, item.currency)}</p>
                    </div>
                  </>
                );

                if (item.productSlug) {
                  return (
                    <Link
                      key={item.id}
                      href={`/products/${item.productSlug}`}
                      className={styles.orderItemRow}
                      aria-label={`РћС‚РєСЂС‹С‚СЊ С‚РѕРІР°СЂ ${item.productTitle}`}
                    >
                      {preview}
                    </Link>
                  );
                }

                return (
                  <article key={item.id} className={styles.orderItemRow}>
                    {preview}
                  </article>
                );
              })}
            </div>
          </StoreSection>

          {order.notes ? (
            <section className={styles.panel}>
              <h2 className={styles.panelTitle}>РљРѕРјРјРµРЅС‚Р°СЂРёР№ Рє Р·Р°РєР°Р·Сѓ</h2>
              <p className={styles.panelText}>{order.notes}</p>
            </section>
          ) : null}
        </>
      ) : null}
    </StoreScreen>
  );
}



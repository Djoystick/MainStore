'use client';

import { useMemo, useRef, useState, useTransition, type FormEventHandler } from 'react';
import Link from 'next/link';

import { useTelegramUnauthorizedMessage } from '@/components/auth/TelegramSessionBootstrap';
import { classNames } from '@/css/classnames';

import { formatStorePrice } from './formatPrice';
import styles from './store.module.css';

interface CheckoutFormProps {
  initialFullName?: string | null;
  initialPhone?: string | null;
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  currency: string;
}

interface PaymentStartSuccess {
  orderId: string;
  paymentAttemptId: string;
  checkoutUrl: string | null;
  totalCents: number;
  currency: string;
}

interface CheckoutFieldErrors {
  fullName?: string;
  phone?: string;
  city?: string;
  addressLine?: string;
  postalCode?: string;
}

function mapCheckoutError(error: string, unauthorizedMessage: string): string {
  switch (error) {
    case 'unauthorized':
      return unauthorizedMessage;
    case 'full_name_required':
      return 'РЈРєР°Р¶РёС‚Рµ РёРјСЏ РїРѕР»СѓС‡Р°С‚РµР»СЏ.';
    case 'full_name_too_short':
      return 'РРјСЏ РїРѕР»СѓС‡Р°С‚РµР»СЏ СЃР»РёС€РєРѕРј РєРѕСЂРѕС‚РєРѕРµ.';
    case 'phone_required':
      return 'РЈРєР°Р¶РёС‚Рµ С‚РµР»РµС„РѕРЅ РґР»СЏ СЃРІСЏР·Рё.';
    case 'phone_invalid':
      return 'РџСЂРѕРІРµСЂСЊС‚Рµ РЅРѕРјРµСЂ С‚РµР»РµС„РѕРЅР°.';
    case 'city_required':
      return 'РЈРєР°Р¶РёС‚Рµ РіРѕСЂРѕРґ РґРѕСЃС‚Р°РІРєРё.';
    case 'city_too_short':
      return 'РќР°Р·РІР°РЅРёРµ РіРѕСЂРѕРґР° РІС‹РіР»СЏРґРёС‚ СЃР»РёС€РєРѕРј РєРѕСЂРѕС‚РєРёРј.';
    case 'address_required':
      return 'РЈРєР°Р¶РёС‚Рµ Р°РґСЂРµСЃ РґРѕСЃС‚Р°РІРєРё.';
    case 'address_too_short':
      return 'Р”РѕР±Р°РІСЊС‚Рµ Р±РѕР»РµРµ С‚РѕС‡РЅС‹Р№ Р°РґСЂРµСЃ РґРѕСЃС‚Р°РІРєРё.';
    case 'postal_code_invalid':
      return 'РџСЂРѕРІРµСЂСЊС‚Рµ РёРЅРґРµРєСЃ.';
    case 'invalid_input':
      return 'РџСЂРѕРІРµСЂСЊС‚Рµ РѕР±СЏР·Р°С‚РµР»СЊРЅС‹Рµ РїРѕР»СЏ РґРѕСЃС‚Р°РІРєРё.';
    case 'empty_cart':
      return 'РљРѕСЂР·РёРЅР° РїСѓСЃС‚Р°. Р”РѕР±Р°РІСЊС‚Рµ С‚РѕРІР°СЂС‹ Рё РїРѕРїСЂРѕР±СѓР№С‚Рµ СЃРЅРѕРІР°.';
    case 'unavailable_items':
      return 'Р§Р°СЃС‚СЊ С‚РѕРІР°СЂРѕРІ Р±РѕР»СЊС€Рµ РЅРµРґРѕСЃС‚СѓРїРЅР°. РџСЂРѕРІРµСЂСЊС‚Рµ РєРѕСЂР·РёРЅСѓ.';
    case 'mixed_currency':
      return 'Р’ РѕРґРЅРѕРј Р·Р°РєР°Р·Рµ РїРѕРґРґРµСЂР¶РёРІР°РµС‚СЃСЏ С‚РѕР»СЊРєРѕ РѕРґРЅР° РІР°Р»СЋС‚Р°.';
    case 'not_configured':
      return 'РџР»Р°С‚С‘Р¶РЅС‹Р№ СЃР»РѕР№ РІСЂРµРјРµРЅРЅРѕ РЅРµРґРѕСЃС‚СѓРїРµРЅ.';
    case 'payment_provider_not_supported':
      return 'Р’С‹Р±СЂР°РЅРЅС‹Р№ РїР»Р°С‚С‘Р¶РЅС‹Р№ РїСЂРѕРІР°Р№РґРµСЂ РїРѕРєР° РЅРµ РїРѕРґРєР»СЋС‡С‘РЅ.';
    default:
      return 'РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РїСѓСЃС‚РёС‚СЊ РѕРїР»Р°С‚Сѓ. РџРѕРїСЂРѕР±СѓР№С‚Рµ РµС‰С‘ СЂР°Р·.';
  }
}

function validateFields(input: {
  fullName: string;
  phone: string;
  city: string;
  addressLine: string;
  postalCode: string;
}): CheckoutFieldErrors {
  const errors: CheckoutFieldErrors = {};
  const fullName = input.fullName.trim();
  const phone = input.phone.trim();
  const city = input.city.trim();
  const addressLine = input.addressLine.trim();
  const postalCode = input.postalCode.trim();
  const phoneDigits = phone.replace(/\D/g, '');

  if (!fullName) {
    errors.fullName = 'РЈРєР°Р¶РёС‚Рµ РёРјСЏ Рё С„Р°РјРёР»РёСЋ РїРѕР»СѓС‡Р°С‚РµР»СЏ.';
  } else if (fullName.length < 2) {
    errors.fullName = 'РРјСЏ СЃР»РёС€РєРѕРј РєРѕСЂРѕС‚РєРѕРµ.';
  }

  if (!phone) {
    errors.phone = 'РЈРєР°Р¶РёС‚Рµ С‚РµР»РµС„РѕРЅ РґР»СЏ СЃРІСЏР·Рё.';
  } else if (phoneDigits.length < 6) {
    errors.phone = 'РџСЂРѕРІРµСЂСЊС‚Рµ РЅРѕРјРµСЂ С‚РµР»РµС„РѕРЅР°.';
  }

  if (!city) {
    errors.city = 'РЈРєР°Р¶РёС‚Рµ РіРѕСЂРѕРґ РґРѕСЃС‚Р°РІРєРё.';
  } else if (city.length < 2) {
    errors.city = 'РќР°Р·РІР°РЅРёРµ РіРѕСЂРѕРґР° СЃР»РёС€РєРѕРј РєРѕСЂРѕС‚РєРѕРµ.';
  }

  if (!addressLine) {
    errors.addressLine = 'РЈРєР°Р¶РёС‚Рµ Р°РґСЂРµСЃ РґРѕСЃС‚Р°РІРєРё.';
  } else if (addressLine.length < 6) {
    errors.addressLine = 'Р”РѕР±Р°РІСЊС‚Рµ РґРѕРј, СѓР»РёС†Сѓ Рё РґСЂСѓРіРёРµ РґРµС‚Р°Р»Рё Р°РґСЂРµСЃР°.';
  }

  if (postalCode && postalCode.length < 3) {
    errors.postalCode = 'РџСЂРѕРІРµСЂСЊС‚Рµ РёРЅРґРµРєСЃ.';
  }

  return errors;
}

export function CheckoutForm({
  initialFullName,
  initialPhone,
  subtotalCents,
  discountCents,
  totalCents,
  currency,
}: CheckoutFormProps) {
  const unauthorizedMessage = useTelegramUnauthorizedMessage(
    'Откройте MainStore в Telegram, чтобы перейти к оплате.',
  );
  const [isPending, startTransition] = useTransition();
  const [fullName, setFullName] = useState(initialFullName ?? '');
  const [phone, setPhone] = useState(initialPhone ?? '');
  const [city, setCity] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [notes, setNotes] = useState('');
  const [fieldErrors, setFieldErrors] = useState<CheckoutFieldErrors>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [startedPayment, setStartedPayment] = useState<PaymentStartSuccess | null>(null);
  const isSubmittingRef = useRef(false);
  const idempotencyKeyRef = useRef<string>(crypto.randomUUID());

  const paymentSummaryLabel = useMemo(
    () => formatStorePrice(totalCents, currency),
    [currency, totalCents],
  );

  const clearFieldError = (field: keyof CheckoutFieldErrors) => {
    setFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();

    if (isPending || isSubmittingRef.current) {
      return;
    }

    const nextFieldErrors = validateFields({
      fullName,
      phone,
      city,
      addressLine,
      postalCode,
    });

    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length > 0) {
      setErrorMessage('РџСЂРѕРІРµСЂСЊС‚Рµ РїРѕР»СЏ С„РѕСЂРјС‹ Рё РїРѕРїСЂРѕР±СѓР№С‚Рµ РµС‰С‘ СЂР°Р·.');
      return;
    }

    isSubmittingRef.current = true;

    startTransition(async () => {
      setErrorMessage(null);

      try {
        const response = await fetch('/api/store/checkout/start-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            fullName,
            phone,
            city,
            addressLine,
            postalCode,
            notes,
            idempotencyKey: idempotencyKeyRef.current,
          }),
        });

        const payload = (await response.json().catch(() => null)) as
          | {
              ok: true;
              orderId: string;
              paymentAttemptId: string;
              checkoutUrl?: string | null;
              totalCents: number;
              currency: string;
            }
          | {
              ok: false;
              error?: string;
            }
          | null;

        if (!response.ok || !payload || !payload.ok) {
          const code = payload && !payload.ok ? payload.error ?? 'unknown' : 'unknown';
          setErrorMessage(mapCheckoutError(code, unauthorizedMessage));
          return;
        }

        const nextState = {
          orderId: payload.orderId,
          paymentAttemptId: payload.paymentAttemptId,
          checkoutUrl: payload.checkoutUrl ?? null,
          totalCents: payload.totalCents,
          currency: payload.currency,
        };

        setStartedPayment(nextState);

        if (payload.checkoutUrl) {
          window.location.assign(payload.checkoutUrl);
          return;
        }
      } catch {
        setErrorMessage('РЎРµС‚РµРІР°СЏ РѕС€РёР±РєР° РїСЂРё Р·Р°РїСѓСЃРєРµ РѕРїР»Р°С‚С‹.');
      } finally {
        isSubmittingRef.current = false;
      }
    });
  };

  if (startedPayment) {
    return (
      <section className={styles.checkoutSuccess}>
        <h2 className={styles.checkoutSuccessTitle}>Р—Р°РєР°Р· СЃРѕР·РґР°РЅ</h2>
        <p className={styles.checkoutSuccessText}>
          РЎСѓРјРјР° Рє РѕРїР»Р°С‚Рµ: {formatStorePrice(startedPayment.totalCents, startedPayment.currency)}
        </p>
        <div className={styles.checkoutSummaryCard}>
          <div className={styles.checkoutSummaryRow}>
            <span>Р—Р°РєР°Р·</span>
            <span>#{startedPayment.orderId.slice(0, 8).toUpperCase()}</span>
          </div>
          <div className={styles.checkoutSummaryRow}>
            <span>РџР»Р°С‚С‘Р¶РЅР°СЏ РїРѕРїС‹С‚РєР°</span>
            <span>#{startedPayment.paymentAttemptId.slice(0, 8).toUpperCase()}</span>
          </div>
        </div>
        <p className={styles.checkoutHint}>
          Р•СЃР»Рё Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРёР№ РїРµСЂРµС…РѕРґ РЅРµ СЃСЂР°Р±РѕС‚Р°Р», РѕС‚РєСЂРѕР№С‚Рµ СЃР»РµРґСѓСЋС‰РёР№ С€Р°Рі РІСЂСѓС‡РЅСѓСЋ РёР»Рё РїСЂРѕРІРµСЂСЊС‚Рµ СЃС‚Р°С‚СѓСЃ
          Р·Р°РєР°Р·Р° РїРѕР·Р¶Рµ.
        </p>
        <div className={styles.checkoutActionsRow}>
          {startedPayment.checkoutUrl ? (
            <Link href={startedPayment.checkoutUrl} className={styles.primaryLinkButton}>
              РџРµСЂРµР№С‚Рё Рє РѕРїР»Р°С‚Рµ
            </Link>
          ) : null}
          <Link href={`/orders/${startedPayment.orderId}`} className={styles.secondaryButton}>
            РћС‚РєСЂС‹С‚СЊ Р·Р°РєР°Р·
          </Link>
        </div>
      </section>
    );
  }

  return (
    <form className={styles.checkoutForm} onSubmit={handleSubmit}>
      <section className={styles.checkoutSection}>
        <h3 className={styles.checkoutSectionTitle}>РџРѕР»СѓС‡Р°С‚РµР»СЊ</h3>
        <div className={styles.checkoutFields}>
          <label className={styles.checkoutField}>
            <span className={styles.checkoutLabel}>РРјСЏ Рё С„Р°РјРёР»РёСЏ</span>
            <input
              className={classNames(styles.checkoutInput, fieldErrors.fullName && styles.checkoutInputError)}
              value={fullName}
              onChange={(event) => {
                setFullName(event.target.value);
                clearFieldError('fullName');
              }}
              autoComplete="name"
              placeholder="РљР°Рє Рє РІР°Рј РѕР±СЂР°С‰Р°С‚СЊСЃСЏ"
              maxLength={120}
              required
            />
            {fieldErrors.fullName ? <span className={styles.checkoutFieldError}>{fieldErrors.fullName}</span> : null}
          </label>

          <label className={styles.checkoutField}>
            <span className={styles.checkoutLabel}>РўРµР»РµС„РѕРЅ</span>
            <input
              className={classNames(styles.checkoutInput, fieldErrors.phone && styles.checkoutInputError)}
              value={phone}
              onChange={(event) => {
                setPhone(event.target.value);
                clearFieldError('phone');
              }}
              autoComplete="tel"
              inputMode="tel"
              placeholder="+7 999 123-45-67"
              maxLength={40}
              required
            />
            {fieldErrors.phone ? <span className={styles.checkoutFieldError}>{fieldErrors.phone}</span> : null}
          </label>
        </div>
      </section>

      <section className={styles.checkoutSection}>
        <h3 className={styles.checkoutSectionTitle}>Р”РѕСЃС‚Р°РІРєР°</h3>
        <div className={styles.checkoutFields}>
          <label className={styles.checkoutField}>
            <span className={styles.checkoutLabel}>Р“РѕСЂРѕРґ</span>
            <input
              className={classNames(styles.checkoutInput, fieldErrors.city && styles.checkoutInputError)}
              value={city}
              onChange={(event) => {
                setCity(event.target.value);
                clearFieldError('city');
              }}
              autoComplete="address-level2"
              placeholder="РњРѕСЃРєРІР°"
              maxLength={120}
              required
            />
            {fieldErrors.city ? <span className={styles.checkoutFieldError}>{fieldErrors.city}</span> : null}
          </label>

          <label className={styles.checkoutField}>
            <span className={styles.checkoutLabel}>РђРґСЂРµСЃ</span>
            <input
              className={classNames(styles.checkoutInput, fieldErrors.addressLine && styles.checkoutInputError)}
              value={addressLine}
              onChange={(event) => {
                setAddressLine(event.target.value);
                clearFieldError('addressLine');
              }}
              autoComplete="street-address"
              placeholder="РЈР»РёС†Р°, РґРѕРј, РєРІР°СЂС‚РёСЂР°, РїРѕРґСЉРµР·Рґ"
              maxLength={240}
              required
            />
            {fieldErrors.addressLine ? (
              <span className={styles.checkoutFieldError}>{fieldErrors.addressLine}</span>
            ) : (
              <span className={styles.checkoutFieldHint}>Р”РѕР±Р°РІСЊС‚Рµ РґРµС‚Р°Р»Рё, С‡С‚РѕР±С‹ РґРѕСЃС‚Р°РІРєР° Р±С‹Р»Р° Р±РµР· СѓС‚РѕС‡РЅРµРЅРёР№.</span>
            )}
          </label>

          <label className={styles.checkoutField}>
            <span className={styles.checkoutLabel}>РРЅРґРµРєСЃ</span>
            <input
              className={classNames(styles.checkoutInput, fieldErrors.postalCode && styles.checkoutInputError)}
              value={postalCode}
              onChange={(event) => {
                setPostalCode(event.target.value);
                clearFieldError('postalCode');
              }}
              autoComplete="postal-code"
              inputMode="numeric"
              placeholder="РќРµРѕР±СЏР·Р°С‚РµР»СЊРЅРѕ"
              maxLength={40}
            />
            {fieldErrors.postalCode ? (
              <span className={styles.checkoutFieldError}>{fieldErrors.postalCode}</span>
            ) : (
              <span className={styles.checkoutFieldHint}>РњРѕР¶РЅРѕ РѕСЃС‚Р°РІРёС‚СЊ РїСѓСЃС‚С‹Рј, РµСЃР»Рё РёРЅРґРµРєСЃ РЅРµ РЅСѓР¶РµРЅ.</span>
            )}
          </label>
        </div>
      </section>

      <section className={styles.checkoutSection}>
        <h3 className={styles.checkoutSectionTitle}>РљРѕРјРјРµРЅС‚Р°СЂРёР№ Рє Р·Р°РєР°Р·Сѓ</h3>
        <label className={styles.checkoutField}>
          <span className={styles.checkoutLabel}>РџРѕР¶РµР»Р°РЅРёСЏ</span>
          <textarea
            className={styles.checkoutTextarea}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            placeholder="РќР°РїСЂРёРјРµСЂ: РїРѕР·РІРѕРЅРёС‚СЊ РїРµСЂРµРґ РґРѕСЃС‚Р°РІРєРѕР№"
            maxLength={500}
          />
          <span className={styles.checkoutFieldHint}>РќРµРѕР±СЏР·Р°С‚РµР»СЊРЅРѕ. РљРѕРјРјРµРЅС‚Р°СЂРёР№ СЃРѕС…СЂР°РЅРёС‚СЃСЏ РІ Р·Р°РєР°Р·Рµ.</span>
        </label>
      </section>

      <div className={styles.checkoutSummaryCard}>
        <div className={styles.checkoutSummaryRow}>
          <span>Р”Рѕ СЃРєРёРґРѕРє</span>
          <span>{formatStorePrice(subtotalCents, currency)}</span>
        </div>
        {discountCents > 0 ? (
          <div className={styles.checkoutSummaryRow}>
            <span>РЎРєРёРґРєР°</span>
            <span>{formatStorePrice(discountCents, currency)}</span>
          </div>
        ) : null}
        <div className={styles.checkoutSummaryRow}>
          <span>Рљ РѕРїР»Р°С‚Рµ</span>
          <strong>{paymentSummaryLabel}</strong>
        </div>
      </div>

      <p className={styles.checkoutHint}>
        РџРѕСЃР»Рµ РїРѕРґС‚РІРµСЂР¶РґРµРЅРёСЏ СЃРѕР·РґР°С‘С‚СЃСЏ Р·Р°РєР°Р· Рё РѕС‚РєСЂС‹РІР°РµС‚СЃСЏ РїР»Р°С‚С‘Р¶РЅР°СЏ СЃРµСЃСЃРёСЏ. Р¤РёРЅР°Р»СЊРЅР°СЏ С†РµРЅР° Рё СЃРєРёРґРєРё
        РїРѕРґС‚РІРµСЂР¶РґР°СЋС‚СЃСЏ РЅР° СЃРµСЂРІРµСЂРµ.
      </p>

      {errorMessage ? (
        <p
          className={classNames(styles.inlineActionMessage, styles.inlineActionMessageError)}
          role="status"
          aria-live="polite"
        >
          {errorMessage}
        </p>
      ) : null}

      <button type="submit" className={styles.primaryButton} disabled={isPending} aria-label="РЎРѕР·РґР°С‚СЊ Р·Р°РєР°Р· Рё РїРµСЂРµР№С‚Рё Рє РѕРїР»Р°С‚Рµ">
        {isPending ? 'Р—Р°РїСѓСЃРєР°РµРј РѕРїР»Р°С‚Сѓ...' : 'РЎРѕР·РґР°С‚СЊ Р·Р°РєР°Р· Рё РїРµСЂРµР№С‚Рё Рє РѕРїР»Р°С‚Рµ'}
      </button>
    </form>
  );
}


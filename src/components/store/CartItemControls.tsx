'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import styles from './store.module.css';

interface CartItemControlsProps {
  itemId: string;
  quantity: number;
}

function mapCartError(error: string): string {
  if (error === 'unauthorized') {
    return 'Open this store in Telegram to manage cart.';
  }
  if (error === 'not_configured') {
    return 'Cart backend is not configured yet.';
  }
  return 'Could not update cart item.';
}

export function CartItemControls({ itemId, quantity }: CartItemControlsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const updateQuantity = (nextQuantity: number) => {
    startTransition(async () => {
      setStatusMessage(null);

      try {
        const response = await fetch(`/api/store/cart/items/${itemId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ quantity: nextQuantity }),
        });
        const payload = (await response.json()) as
          | { ok: true; quantity: number }
          | { ok: false; error?: string };

        if (!response.ok || !payload.ok) {
          setStatusMessage(mapCartError(payload.ok ? 'unknown' : payload.error ?? 'unknown'));
          return;
        }

        router.refresh();
      } catch {
        setStatusMessage('Network error while updating cart item.');
      }
    });
  };

  const removeItem = () => {
    startTransition(async () => {
      setStatusMessage(null);

      try {
        const response = await fetch(`/api/store/cart/items/${itemId}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        const payload = (await response.json()) as
          | { ok: true }
          | { ok: false; error?: string };

        if (!response.ok || !payload.ok) {
          setStatusMessage(mapCartError(payload.ok ? 'unknown' : payload.error ?? 'unknown'));
          return;
        }

        router.refresh();
      } catch {
        setStatusMessage('Network error while removing cart item.');
      }
    });
  };

  return (
    <div className={styles.cartItemControls}>
      <div className={styles.quantityControl} aria-label="Cart item quantity controls">
        <button
          type="button"
          className={styles.quantityButton}
          onClick={() => updateQuantity(quantity - 1)}
          disabled={isPending}
          aria-label="Decrease quantity"
        >
          -
        </button>
        <span className={styles.quantityValue} aria-live="polite">
          {quantity}
        </span>
        <button
          type="button"
          className={styles.quantityButton}
          onClick={() => updateQuantity(quantity + 1)}
          disabled={isPending}
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>

      <button
        type="button"
        className={styles.cartRemoveButton}
        onClick={removeItem}
        disabled={isPending}
        aria-label="Remove item from cart"
      >
        Remove
      </button>

      {statusMessage && (
        <p className={styles.cartActionError} role="status" aria-live="polite">
          {statusMessage}
        </p>
      )}
    </div>
  );
}

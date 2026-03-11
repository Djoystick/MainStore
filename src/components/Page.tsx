'use client';

import { backButton, closingBehavior, swipeBehavior } from '@tma.js/sdk-react';
import { PropsWithChildren, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import {
  buildTelegramNavigationEntry,
  consumeTelegramBackTarget,
  rememberTelegramNavigationEntry,
  resolveTelegramBackFallback,
  shouldDisableTelegramVerticalSwipe,
  shouldProtectTelegramClose,
} from '@/features/telegram/navigation';

export function Page({ children, back = true }: PropsWithChildren<{
  /**
   * True if it is allowed to go back from this page.
   * @default true
   */
  back?: boolean
}>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentEntry = buildTelegramNavigationEntry(pathname, searchParams.toString());
  const fallbackHref = resolveTelegramBackFallback(pathname);
  const protectClose = shouldProtectTelegramClose(pathname);
  const disableVerticalSwipe = shouldDisableTelegramVerticalSwipe(pathname);

  useEffect(() => {
    rememberTelegramNavigationEntry(currentEntry);
  }, [currentEntry]);

  useEffect(() => {
    backButton.mount.ifAvailable();
    closingBehavior.mount.ifAvailable();
    swipeBehavior.mount.ifAvailable();

    return () => {
      backButton.hide.ifAvailable();
    };
  }, []);

  useEffect(() => {
    if (back) {
      backButton.show.ifAvailable();
    } else {
      backButton.hide.ifAvailable();
    }
  }, [back]);

  useEffect(() => {
    return backButton.onClick(() => {
      if (!back) {
        return;
      }

      const target = consumeTelegramBackTarget(currentEntry, fallbackHref);
      if (target && target !== currentEntry) {
        router.replace(target);
        return;
      }

      router.back();
    });
  }, [back, currentEntry, fallbackHref, router]);

  useEffect(() => {
    if (protectClose) {
      closingBehavior.enableConfirmation.ifAvailable();
      return () => {
        closingBehavior.disableConfirmation.ifAvailable();
      };
    }

    closingBehavior.disableConfirmation.ifAvailable();
  }, [protectClose]);

  useEffect(() => {
    if (disableVerticalSwipe) {
      swipeBehavior.disableVertical.ifAvailable();
      return () => {
        swipeBehavior.enableVertical.ifAvailable();
      };
    }

    swipeBehavior.enableVertical.ifAvailable();
  }, [disableVerticalSwipe]);

  return <>{children}</>;
}

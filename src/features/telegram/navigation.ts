import { retrieveLaunchParams } from '@tma.js/sdk-react';

const TELEGRAM_NAVIGATION_STACK_KEY = 'mainstore:telegram-navigation-stack';
const TELEGRAM_NAVIGATION_STACK_LIMIT = 48;

interface TelegramNavigationState {
  entries: string[];
  suppressNext?: string | null;
}

export function resolveTelegramBackFallback(pathname: string): string {
  if (!pathname || pathname === '/') {
    return '/';
  }

  if (pathname.startsWith('/products/')) {
    return '/catalog';
  }

  if (pathname === '/checkout') {
    return '/cart';
  }

  if (pathname.startsWith('/pay/')) {
    return '/orders';
  }

  if (pathname.startsWith('/orders/')) {
    return '/orders';
  }

  if (pathname === '/orders') {
    return '/profile';
  }

  if (pathname === '/favorites' || pathname === '/cart' || pathname === '/catalog') {
    return '/';
  }

  if (pathname === '/profile') {
    return '/';
  }

  if (pathname.startsWith('/admin/orders/')) {
    return '/admin/orders';
  }

  if (pathname === '/admin') {
    return '/profile';
  }

  if (pathname.startsWith('/admin/products/') && pathname.endsWith('/edit')) {
    return '/admin/products';
  }

  if (pathname === '/admin/products/new') {
    return '/admin/products';
  }

  if (pathname.startsWith('/admin')) {
    return '/admin';
  }

  return '/';
}

export function buildTelegramNavigationEntry(pathname: string, search?: string | null): string {
  if (!pathname) {
    return '/';
  }

  if (!search) {
    return pathname;
  }

  const normalizedSearch = search.startsWith('?') ? search : `?${search}`;
  return `${pathname}${normalizedSearch}`;
}

function readTelegramNavigationState(): TelegramNavigationState {
  if (typeof window === 'undefined') {
    return { entries: [] };
  }

  try {
    const raw = window.sessionStorage.getItem(TELEGRAM_NAVIGATION_STACK_KEY);
    if (!raw) {
      return { entries: [] };
    }

    const parsed = JSON.parse(raw) as Partial<TelegramNavigationState> | null;
    if (!parsed || !Array.isArray(parsed.entries)) {
      return { entries: [] };
    }

    const entries = parsed.entries.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0);
    return {
      entries,
      suppressNext: typeof parsed.suppressNext === 'string' ? parsed.suppressNext : null,
    };
  } catch {
    return { entries: [] };
  }
}

function writeTelegramNavigationState(state: TelegramNavigationState): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.sessionStorage.setItem(
      TELEGRAM_NAVIGATION_STACK_KEY,
      JSON.stringify({
        entries: state.entries.slice(-TELEGRAM_NAVIGATION_STACK_LIMIT),
        suppressNext: state.suppressNext ?? null,
      }),
    );
  } catch {
    // Ignore storage failures and fall back to route-based navigation.
  }
}

export function rememberTelegramNavigationEntry(entry: string): void {
  if (!entry) {
    return;
  }

  const state = readTelegramNavigationState();

  if (state.suppressNext === entry) {
    writeTelegramNavigationState({
      entries: state.entries.length > 0 ? state.entries : [entry],
      suppressNext: null,
    });
    return;
  }

  const lastEntry = state.entries[state.entries.length - 1];
  if (lastEntry === entry) {
    if (state.suppressNext) {
      writeTelegramNavigationState({
        entries: state.entries,
        suppressNext: null,
      });
    }
    return;
  }

  writeTelegramNavigationState({
    entries: [...state.entries, entry].slice(-TELEGRAM_NAVIGATION_STACK_LIMIT),
    suppressNext: null,
  });
}

export function consumeTelegramBackTarget(currentEntry: string, fallbackHref: string): string | null {
  const state = readTelegramNavigationState();
  const currentIndex = state.entries.lastIndexOf(currentEntry);

  if (currentIndex > 0) {
    const nextEntries = state.entries.slice(0, currentIndex);
    const target = nextEntries[nextEntries.length - 1] ?? fallbackHref;

    writeTelegramNavigationState({
      entries: nextEntries.length > 0 ? nextEntries : [target],
      suppressNext: target,
    });

    return target;
  }

  if (!fallbackHref || fallbackHref === currentEntry) {
    return null;
  }

  writeTelegramNavigationState({
    entries: [fallbackHref],
    suppressNext: fallbackHref,
  });

  return fallbackHref;
}

export function shouldProtectTelegramClose(pathname: string): boolean {
  return pathname === '/checkout' || pathname.startsWith('/pay/');
}

export function shouldDisableTelegramVerticalSwipe(pathname: string): boolean {
  return pathname === '/checkout' || pathname.startsWith('/pay/');
}

export function buildStoreAbsoluteUrl(pathname: string, origin: string): string {
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return new URL(normalizedPath, origin).toString();
}

export function buildTelegramShareUrl(targetUrl: string, text?: string): string {
  const shareUrl = new URL('https://t.me/share/url');
  shareUrl.searchParams.set('url', targetUrl);
  if (text) {
    shareUrl.searchParams.set('text', text);
  }
  return shareUrl.toString();
}

export function isTelegramMiniAppRuntime(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const runtime = window as Window & {
    Telegram?: { WebApp?: object };
    TelegramWebviewProxy?: object;
  };

  if (runtime.Telegram?.WebApp || runtime.TelegramWebviewProxy) {
    return true;
  }

  const searchParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const launchKeys = ['tgWebAppData', 'tgWebAppPlatform', 'tgWebAppVersion', 'tgWebAppStartParam'];

  if (launchKeys.some((key) => searchParams.has(key) || hashParams.has(key))) {
    return true;
  }

  try {
    const launchParams = retrieveLaunchParams();
    return Boolean(
      launchParams.tgWebAppPlatform ||
        launchParams.tgWebAppVersion ||
        launchParams.tgWebAppData,
    );
  } catch {
    return false;
  }
}

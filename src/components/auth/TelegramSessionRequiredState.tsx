'use client';

import { StoreEmptyState } from '@/components/store/StoreEmptyState';
import { useTelegramSessionBootstrapState } from './TelegramSessionBootstrap';

interface TelegramSessionRequiredStateProps {
  fallbackTitle: string;
  fallbackDescription: string;
  fallbackActionLabel?: string;
  fallbackActionHref?: string;
  retryHref: string;
}

export function TelegramSessionRequiredState({
  fallbackTitle,
  fallbackDescription,
  fallbackActionLabel,
  fallbackActionHref,
  retryHref,
}: TelegramSessionRequiredStateProps) {
  const { status, hasInitData, isTelegramRuntime } = useTelegramSessionBootstrapState();

  if (hasInitData && (status === 'pending' || status === 'ready')) {
    return (
      <StoreEmptyState
        title="Проверяем сессию Telegram"
        description="Личный раздел откроется автоматически, как только подтвердится сессия Mini App."
      />
    );
  }

  if (hasInitData && status === 'failed') {
    return (
      <StoreEmptyState
        title="Не удалось подтвердить сессию Telegram"
        description="Mini App открыт из Telegram, но серверная сессия не создалась. Обновите экран или откройте магазин заново из бота."
        actionLabel="Обновить экран"
        actionHref={retryHref}
      />
    );
  }

  if (isTelegramRuntime && status === 'idle') {
    return (
      <StoreEmptyState
        title="Подключаем Telegram"
        description="Ждем данные запуска от Telegram. Если экран не обновится автоматически, перезапустите Mini App из бота."
        actionLabel="Обновить экран"
        actionHref={retryHref}
      />
    );
  }

  return (
    <StoreEmptyState
      title={fallbackTitle}
      description={fallbackDescription}
      actionLabel={fallbackActionLabel}
      actionHref={fallbackActionHref}
    />
  );
}

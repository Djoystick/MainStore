# Telegram Mini App Session Fix

## Root cause
- Корневая проблема была в коде: `TelegramSessionBootstrap` создавал `ms_session` только после client-side mount, а приватные страницы (`/profile`, `/favorites`, `/cart`, `/orders`, `/checkout`, `/pay/sandbox/...`) рендерились на сервере раньше и видели `null` в `getCurrentSession()`.
- Из-за этого при реальном запуске из Telegram первый SSR показывал ложные состояния вроде `Нет активной сессии` или `Нужна сессия Telegram`.
- После успешного bootstrap серверные страницы не принудительно перечитывали cookie, поэтому ложный fallback мог оставаться до ручного refresh.
- Отдельный риск с внешней конфигурацией тоже остаётся: если бот открывает обычный URL, а не `web_app`, Telegram не передаст `initData`, и browser fallback должен продолжать работать. Это не было основной причиной ложного поведения внутри уже открытого Mini App.

## What was changed
- `TelegramSessionBootstrap` переведён в stateful provider с явными состояниями `idle | pending | ready | failed`.
- После успешного POST в `/api/auth/telegram/bootstrap` добавлен `router.refresh()`, чтобы server components перечитали `ms_session` и приватные поверхности перестали показывать ложный `unauthorized` fallback.
- Добавлен `TelegramSessionRequiredState` для приватных customer screens. Он различает:
  - реальный non-Telegram fallback
  - ожидание `initData`
  - ожидание server bootstrap
  - ошибку bootstrap
- Клиентские customer actions (`AddToCartButton`, `FavoriteToggleButton`, `CartItemControls`, `CheckoutForm`, `OrderPaymentAction`, `OrderRepeatAction`, `SandboxPaymentActions`) теперь показывают bootstrap-aware сообщения вместо ложного `Откройте MainStore в Telegram`, когда Mini App уже открыт корректно.
- `Root` теперь оборачивает приложение в `TelegramSessionBootstrap` provider.

## Files changed
- `src/components/auth/TelegramSessionBootstrap.tsx`
- `src/components/auth/TelegramSessionRequiredState.tsx`
- `src/components/Root/Root.tsx`
- `src/app/profile/page.tsx`
- `src/app/favorites/page.tsx`
- `src/app/cart/page.tsx`
- `src/app/checkout/page.tsx`
- `src/app/orders/page.tsx`
- `src/app/orders/[orderId]/page.tsx`
- `src/app/pay/sandbox/[attemptId]/page.tsx`
- `src/components/store/AddToCartButton.tsx`
- `src/components/store/FavoriteToggleButton.tsx`
- `src/components/store/CartItemControls.tsx`
- `src/components/store/CheckoutForm.tsx`
- `src/components/store/OrderPaymentAction.tsx`
- `src/components/store/OrderRepeatAction.tsx`
- `src/components/store/SandboxPaymentActions.tsx`

## Checks run
- `pnpm run lint`
- `pnpm run build`

## Remaining risks / leftovers
- Если Telegram bot button или menu button откроет магазин как обычную ссылку, а не как `web_app`, `initData` не придёт, и приложение корректно останется в browser fallback режиме.
- В `lint/build` остаётся неблокирующее предупреждение `baseline-browser-mapping`.
- Для полного подтверждения нужно проверить именно production Mini App launch из Telegram на `https://main-store.vercel.app`.

## Exact commands or external steps required from the user
1. Задеплоить текущие изменения на production URL `https://main-store.vercel.app`.
2. В BotFather проверить, что `Menu Button` или `Open Store` кнопка настроена как `web_app` и указывает ровно на `https://main-store.vercel.app`.
3. Если раньше была старая кнопка с plain URL, пересоздать её как `web_app` кнопку и заново открыть магазин из бота.
4. После деплоя вручную проверить `/profile`, `/favorites`, `/cart`, `/orders`, `/checkout` и `/pay/sandbox/[attemptId]` при открытии через Telegram.

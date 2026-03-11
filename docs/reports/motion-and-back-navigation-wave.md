# Motion + Native-like Back Navigation Wave

## Исходные UX-проблемы
- Интерфейсу не хватало мягкого motion layer: экраны, карточки, кнопки, фильтры и overlay-поверхности выглядели статично.
- Telegram Back Button был подключён слишком прямо: возврат опирался на `router.back()` и route fallback без собственной mini-app history.
- При deep link и некоторых переходах назад был риск получить неестественное поведение вместо возврата в предыдущий внутренний экран.
- На чувствительных шагах вроде checkout и sandbox payment не было отдельной страховки от случайного закрытия или вертикального swipe.

## Внесённые изменения
- Добавлена общая motion-основа в глобальные токены: duration/easing переменные, keyframes и `prefers-reduced-motion` fallback.
- В storefront добавлены мягкие enter/stagger-анимации для экранов и контента, а также transitions для карточек, CTA, фильтров, чипов, bottom nav, product options, reviews и specs surface.
- В admin добавлены только лёгкие motion-enhancements: hover/press/focus transitions на карточки, навигацию и action buttons без перегрузки интерфейса.
- Telegram navigation переписан на внутренний mini-app stack в `sessionStorage`: текущий маршрут с query сохраняется, а Back Button возвращает пользователя в предыдущий внутренний экран вместо слепого `router.back()`.
- Для прямых входов и пустого внутреннего стека сохранены route-aware fallback’и: товар возвращает в каталог, checkout в корзину, order detail в список заказов, admin dashboard в профиль.
- На `checkout` и `pay/*` добавлены close/swipe safety-правила: включается confirmation на закрытие и отключается вертикальный swipe, чтобы снизить риск случайного выхода с чувствительных шагов.
- Admin dashboard теперь тоже поддерживает back navigation через Telegram Back Button и корректный fallback в профиль.

## Затронутые файлы
- `src/app/_assets/globals.css`
- `src/app/admin/page.tsx`
- `src/components/Page.tsx`
- `src/components/store/StoreScreenContainer.tsx`
- `src/components/store/store.module.css`
- `src/components/admin/admin.module.css`
- `src/features/telegram/navigation.ts`

## Результаты проверок
- `pnpm run lint` — пройдено успешно.
- `pnpm run build` — пройдено успешно.
- В обоих прогонах остались только информационные предупреждения `baseline-browser-mapping`.

## Остаточные ограничения / follow-ups
- Реальный gesture-level тест внутри Telegram клиента всё ещё стоит отдельно прогнать на iOS/Android, потому что desktop/webview и нативные клиенты отличаются по ощущению back/swipe.
- Внутренний navigation stack сделан как безопасный application-layer слой поверх текущего router behavior; глобальный refactor router architecture намеренно не выполнялся.
- Import/payment/bootstrap/admin guards, storefront business logic и Excel support matrix `XLSX/XLS/XLSM/XLTX` в рамках волны не менялись.

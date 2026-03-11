# Fix Checkout Russian Encoding

## Root cause
- Проблема оказалась локальной для checkout UI.
- Источник поломки был в самих строковых литералах, уже сохранённых в испорченном виде в checkout-файлах.
- Это не была проблема шрифта, Telegram runtime, i18n-слоя или server response.
- Проверка файлов показала, что они читаются как UTF-8:
  - `src/components/store/CheckoutForm.tsx`
  - `src/app/checkout/page.tsx`
  - `src/app/checkout/loading.tsx`
- Значит причина была не в текущем чтении файла как не-UTF-8, а в том, что часть русских строк была ранее записана в mojibake-виде.

## Files fixed
- [src/components/store/CheckoutForm.tsx](/h:/Work/MainStore/src/components/store/CheckoutForm.tsx)
- [src/app/checkout/page.tsx](/h:/Work/MainStore/src/app/checkout/page.tsx)
- [src/app/checkout/loading.tsx](/h:/Work/MainStore/src/app/checkout/loading.tsx)

## What was restored
- Восстановлены нормальные русские строки для:
  - labels формы
  - placeholders
  - helper text
  - validation messages
  - payment start / success messages
  - order summary labels
  - empty/error/loading state copy
  - checkout intro/explanation text
- Примеры восстановленных строк:
  - `Телефон`
  - `Доставка`
  - `Получатель`
  - `Имя и фамилия`
  - `Комментарий к заказу`
  - `До скидок`
  - `К оплате`
  - `Создать заказ и перейти к оплате`
  - `Загружаем оформление`

## What was not changed
- Telegram auth/bootstrap hardening
- Cart / orders / profile / admin surfaces
- Excel import pipeline
- Payment sandbox foundation
- API contract and checkout server logic

## Verification
- UTF-8 validation:
  - `src/components/store/CheckoutForm.tsx` -> `UTF8_OK`
  - `src/app/checkout/page.tsx` -> `UTF8_OK`
  - `src/app/checkout/loading.tsx` -> `UTF8_OK`
- `pnpm run lint`
  - passed
  - remaining non-blocking warning: `baseline-browser-mapping` data is outdated
- `pnpm run build`
  - passed

## Residual risk
- Если в production данных или внешних CMS/seed-источниках есть отдельные испорченные строки, они потребуют отдельной адресной правки. В рамках этого бага checkout UI literals в коде восстановлены.

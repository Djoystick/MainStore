# Telegram User Persistence Fix

## Root cause
- Точный runtime path для persistence использует `src/app/api/auth/telegram/bootstrap/route.ts` -> `verifyTelegramInitData()` -> `upsertProfileFromTelegramIdentity()` -> `setSessionCookie()`.
- В коде нет штатной ветки, которая должна выдавать `ms_session` без успешного `upsertProfileFromTelegramIdentity()` в том Supabase project, к которому подключён admin client.
- При этом UI действительно может показывать customer profile card без строки в `public.profiles`: `getProfileBySession()` в `src/features/auth/profile.ts` падает обратно на session payload, если admin client недоступен или профиль не найден.
- В текущем конфиге обнаружен точный `Supabase project ref mismatch`:
  - `NEXT_PUBLIC_SUPABASE_URL` -> `wjmbjqnrpoqzigvmoudp`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` -> `wcdtrmlaupsemdxvyzfa`
  - `SUPABASE_SERVICE_ROLE_KEY` -> `wcdtrmlaupsemdxvyzfa`
- Это означает, что URL и keys смотрят на разные Supabase projects. В такой конфигурации persistence либо идёт не в тот проект, который проверяется в dashboard, либо ведёт себя непредсказуемо.

## What was changed
- Добавлена диагностика `Supabase project ref mismatch` в `src/lib/supabase/env.ts`.
- `src/lib/supabase/admin.ts` теперь считает такой mismatch configuration issue и не создаёт admin client молча.
- `src/features/auth/profile.ts` теперь:
  - возвращает явный `supabase_admin_unavailable` reason для bootstrap path
  - логирует session-only fallback в development, когда persisted profile недоступен
- `src/app/api/auth/telegram/bootstrap/route.ts` теперь отдаёт стабильные `reason` codes для bootstrap failures.
- Ранее добавленный bootstrap-aware UI теперь может показать точный код причины вместо общего fail state.

## Files changed
- `src/lib/supabase/env.ts`
- `src/lib/supabase/admin.ts`
- `src/features/auth/profile.ts`
- `src/app/api/auth/telegram/bootstrap/route.ts`
- `docs/reports/telegram-user-persistence-fix.md`

## Checks run
- `pnpm run lint`
- `pnpm run build`

## Exact commands or external steps required from the user
1. Выровнять production env в Vercel так, чтобы `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` и `SUPABASE_SERVICE_ROLE_KEY` относились к одному и тому же Supabase project ref.
2. После выравнивания env redeploy production.
3. Открыть MainStore из Telegram и проверить, что в нужном Supabase project появляются записи в:
   - `Authentication -> Users`
   - `public.profiles`
4. Если bootstrap снова не проходит, зафиксировать новый `reason` code из UI.

## Remaining risks / leftovers
- Пока production env не выровнены на один project ref, persistence нельзя считать надёжной.
- `getProfileBySession()` всё ещё умеет показывать session-only fallback identity, чтобы не ломать уже работающие customer flows; это осознанно, но именно поэтому UI может выглядеть «авторизованным» даже без DB-строки.
- В `lint/build` остаётся неблокирующее предупреждение `baseline-browser-mapping`.

# MainStore Infrastructure Setup Runbook

This runbook is the canonical sequence to prepare local + Vercel runtime without guesswork.

## 1) Environment Variables

Use `.env.example` as the source of truth.

### Public

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Server-only

- `SUPABASE_SERVICE_ROLE_KEY`
- `TELEGRAM_BOT_TOKEN`
- `APP_SESSION_SECRET`

Do not expose server-only values in client code.

## 2) Local Setup

1. Install dependencies:

```bash
pnpm install
```

2. Create `.env.local`:

```powershell
Copy-Item .env.example .env.local
```

3. Fill values.

4. Run env diagnostics:

```bash
pnpm run infra:check -- --strict
```

## 3) Supabase Setup

Use migration files in `supabase/migrations`:

- `20260309190000_store_backend_foundation.sql`
- `20260310123000_checkout_order_flow.sql`

### Local DB (recommended)

```bash
supabase db reset
```

This applies migrations and seed (`supabase/seed.sql`) for local development.

### Remote DB

1. Link project:

```bash
supabase link --project-ref <your-project-ref>
```

2. Push migrations:

```bash
supabase db push
```

3. Apply `supabase/seed.sql` manually (SQL Editor) for test data when needed.

## 4) Vercel Setup

In Vercel Project Settings -> Environment Variables, add all variables from `.env.example`:

- for `Development`
- for `Preview`
- for `Production`

No additional `vercel.json` is required for current project.

## 5) Local Runtime Commands

```bash
pnpm run dev
pnpm run lint
pnpm run build
```

## 6) Runtime Guardrails (Expected Behavior)

- Missing public Supabase env:
  - storefront falls back to controlled local mock data with explicit notice.
- Missing server-only env:
  - user mutations / checkout / admin actions return clear `503` with diagnostic details.
- Outside Telegram:
  - storefront remains readable (read-only behavior),
  - session-dependent actions show controlled errors instead of crash.

## 7) Post-Setup Validation

Use:

- [docs/MANUAL_VERIFICATION_CHECKLIST.md](./MANUAL_VERIFICATION_CHECKLIST.md)

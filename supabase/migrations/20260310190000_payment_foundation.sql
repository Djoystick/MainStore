begin;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type public.payment_status as enum (
      'pending',
      'requires_action',
      'paid',
      'failed',
      'cancelled',
      'expired'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'payment_provider') then
    create type public.payment_provider as enum (
      'legacy',
      'sandbox'
    );
  end if;
end
$$;

alter table public.orders
  add column if not exists checkout_idempotency_key text,
  add column if not exists payment_status public.payment_status not null default 'pending',
  add column if not exists payment_provider public.payment_provider,
  add column if not exists payment_completed_at timestamptz,
  add column if not exists payment_last_error text,
  add column if not exists payment_reference text;

create unique index if not exists idx_orders_checkout_idempotency_key
  on public.orders (checkout_idempotency_key)
  where checkout_idempotency_key is not null;

update public.orders
set
  payment_status = 'paid',
  payment_provider = coalesce(payment_provider, 'legacy'),
  payment_completed_at = coalesce(payment_completed_at, created_at),
  payment_last_error = null
where payment_provider is null
  and payment_status = 'pending';

create table if not exists public.payment_attempts (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  provider public.payment_provider not null,
  status public.payment_status not null default 'pending',
  idempotency_key text not null unique,
  amount numeric(12, 2) not null,
  currency char(3) not null default 'USD',
  checkout_url text,
  provider_reference text,
  error_code text,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  expires_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payment_attempts_amount_non_negative_chk check (amount >= 0)
);

create index if not exists idx_orders_payment_status
  on public.orders (payment_status);

create index if not exists idx_orders_payment_provider
  on public.orders (payment_provider);

create index if not exists idx_payment_attempts_order_id_created_at
  on public.payment_attempts (order_id, created_at desc);

create index if not exists idx_payment_attempts_user_id_created_at
  on public.payment_attempts (user_id, created_at desc);

create unique index if not exists idx_payment_attempts_provider_reference
  on public.payment_attempts (provider, provider_reference)
  where provider_reference is not null;

drop trigger if exists trg_payment_attempts_set_updated_at on public.payment_attempts;
create trigger trg_payment_attempts_set_updated_at
before update on public.payment_attempts
for each row execute function public.set_updated_at();

alter table public.payment_attempts enable row level security;

drop policy if exists payment_attempts_select_own_or_admin on public.payment_attempts;
create policy payment_attempts_select_own_or_admin
on public.payment_attempts
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists payment_attempts_admin_manage on public.payment_attempts;
create policy payment_attempts_admin_manage
on public.payment_attempts
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

commit;

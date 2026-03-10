begin;

create or replace function public.create_order_from_cart(
  p_user_id uuid,
  p_customer_display_name text,
  p_customer_phone text,
  p_shipping_city text,
  p_shipping_address_line text,
  p_shipping_postal_code text default null,
  p_notes text default null
)
returns table (
  order_id uuid,
  total_amount numeric,
  currency char(3),
  items_count integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total_cart_items integer;
  v_total_valid_items integer;
  v_distinct_currencies integer;
  v_subtotal numeric(12, 2);
  v_currency char(3);
  v_order_id uuid;
  v_items_count integer;
  v_customer_username text;
begin
  if p_user_id is null then
    raise exception 'unauthorized';
  end if;

  select count(*)
  into v_total_cart_items
  from public.cart_items c
  where c.user_id = p_user_id;

  if v_total_cart_items = 0 then
    raise exception 'cart_empty';
  end if;

  select count(*)
  into v_total_valid_items
  from public.cart_items c
  join public.products p
    on p.id = c.product_id
  where c.user_id = p_user_id
    and p.status = 'active';

  if v_total_valid_items <> v_total_cart_items then
    raise exception 'cart_contains_unavailable_items';
  end if;

  select count(distinct p.currency)
  into v_distinct_currencies
  from public.cart_items c
  join public.products p
    on p.id = c.product_id
  where c.user_id = p_user_id
    and p.status = 'active';

  if v_distinct_currencies > 1 then
    raise exception 'mixed_currency_not_supported';
  end if;

  select
    p.currency,
    round(sum((p.price * c.quantity)::numeric), 2)
  into v_currency, v_subtotal
  from public.cart_items c
  join public.products p
    on p.id = c.product_id
  where c.user_id = p_user_id
    and p.status = 'active'
  group by p.currency
  limit 1;

  if v_currency is null then
    raise exception 'cart_empty';
  end if;

  select pr.username
  into v_customer_username
  from public.profiles pr
  where pr.id = p_user_id;

  insert into public.orders (
    user_id,
    status,
    subtotal_amount,
    discount_amount,
    shipping_amount,
    total_amount,
    currency,
    customer_display_name,
    customer_username,
    customer_phone,
    shipping_address,
    notes
  )
  values (
    p_user_id,
    'pending',
    v_subtotal,
    0,
    0,
    v_subtotal,
    v_currency,
    nullif(trim(p_customer_display_name), ''),
    v_customer_username,
    nullif(trim(p_customer_phone), ''),
    jsonb_build_object(
      'city', nullif(trim(p_shipping_city), ''),
      'address_line', nullif(trim(p_shipping_address_line), ''),
      'postal_code', nullif(trim(p_shipping_postal_code), '')
    ),
    nullif(trim(p_notes), '')
  )
  returning id into v_order_id;

  insert into public.order_items (
    order_id,
    product_id,
    quantity,
    product_title,
    product_slug,
    product_image_url,
    unit_price,
    currency
  )
  select
    v_order_id,
    p.id,
    c.quantity,
    p.title,
    p.slug,
    pi.url,
    p.price,
    p.currency
  from public.cart_items c
  join public.products p
    on p.id = c.product_id
  left join lateral (
    select i.url
    from public.product_images i
    where i.product_id = p.id
    order by i.is_primary desc, i.sort_order asc, i.created_at asc
    limit 1
  ) pi on true
  where c.user_id = p_user_id
    and p.status = 'active';

  get diagnostics v_items_count = row_count;

  if v_items_count = 0 then
    raise exception 'cart_empty';
  end if;

  delete from public.cart_items
  where user_id = p_user_id;

  return query
  select v_order_id, v_subtotal, v_currency, v_items_count;
end;
$$;

revoke all on function public.create_order_from_cart(
  uuid,
  text,
  text,
  text,
  text,
  text,
  text
) from public;

grant execute on function public.create_order_from_cart(
  uuid,
  text,
  text,
  text,
  text,
  text,
  text
) to authenticated;

commit;

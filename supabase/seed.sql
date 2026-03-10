begin;

delete from public.collection_items;
delete from public.product_images
where product_id in (
  '5015f4c0-a4eb-4ff7-90f2-6147164f7f01',
  '5015f4c0-a4eb-4ff7-90f2-6147164f7f02',
  '5015f4c0-a4eb-4ff7-90f2-6147164f7f03',
  '5015f4c0-a4eb-4ff7-90f2-6147164f7f04',
  '5015f4c0-a4eb-4ff7-90f2-6147164f7f05',
  '5015f4c0-a4eb-4ff7-90f2-6147164f7f06'
);
delete from public.collections
where id in (
  '45f471f8-c8b0-4f80-b6e4-fd844350e101',
  '45f471f8-c8b0-4f80-b6e4-fd844350e102'
);
delete from public.products
where id in (
  '5015f4c0-a4eb-4ff7-90f2-6147164f7f01',
  '5015f4c0-a4eb-4ff7-90f2-6147164f7f02',
  '5015f4c0-a4eb-4ff7-90f2-6147164f7f03',
  '5015f4c0-a4eb-4ff7-90f2-6147164f7f04',
  '5015f4c0-a4eb-4ff7-90f2-6147164f7f05',
  '5015f4c0-a4eb-4ff7-90f2-6147164f7f06'
);
delete from public.categories
where id in (
  '0f4b6849-8f8e-4a33-a4be-e8d4049a7301',
  '0f4b6849-8f8e-4a33-a4be-e8d4049a7302',
  '0f4b6849-8f8e-4a33-a4be-e8d4049a7303'
);

insert into public.categories (
  id,
  slug,
  title,
  description,
  is_active
)
values
  (
    '0f4b6849-8f8e-4a33-a4be-e8d4049a7301',
    'apparel',
    'Apparel',
    'Everyday wearable essentials.',
    true
  ),
  (
    '0f4b6849-8f8e-4a33-a4be-e8d4049a7302',
    'home',
    'Home',
    'Useful items for your home and workspace.',
    true
  ),
  (
    '0f4b6849-8f8e-4a33-a4be-e8d4049a7303',
    'gadgets',
    'Gadgets',
    'Portable accessories and tech picks.',
    true
  );

insert into public.products (
  id,
  category_id,
  slug,
  title,
  short_description,
  description,
  price,
  compare_at_price,
  currency,
  status,
  is_featured,
  stock_quantity
)
values
  (
    '5015f4c0-a4eb-4ff7-90f2-6147164f7f01',
    '0f4b6849-8f8e-4a33-a4be-e8d4049a7301',
    'daily-comfort-hoodie',
    'Daily Comfort Hoodie',
    'Soft cotton hoodie for everyday wear.',
    'A relaxed fit hoodie designed for daily use with breathable cotton and a clean silhouette.',
    49.90,
    69.90,
    'USD',
    'active',
    true,
    54
  ),
  (
    '5015f4c0-a4eb-4ff7-90f2-6147164f7f02',
    '0f4b6849-8f8e-4a33-a4be-e8d4049a7301',
    'urban-motion-sneakers',
    'Urban Motion Sneakers',
    'Lightweight sneakers with flexible sole.',
    'Everyday sneakers with soft inner lining and responsive sole for long city walks.',
    73.90,
    89.90,
    'USD',
    'active',
    true,
    37
  ),
  (
    '5015f4c0-a4eb-4ff7-90f2-6147164f7f03',
    '0f4b6849-8f8e-4a33-a4be-e8d4049a7302',
    'canvas-weekend-bag',
    'Canvas Weekend Bag',
    'Compact carry bag with two inner pockets.',
    'Durable canvas bag suitable for short trips, daily office carry, and gym essentials.',
    35.90,
    45.90,
    'USD',
    'active',
    false,
    63
  ),
  (
    '5015f4c0-a4eb-4ff7-90f2-6147164f7f04',
    '0f4b6849-8f8e-4a33-a4be-e8d4049a7303',
    'mini-bluetooth-speaker',
    'Mini Bluetooth Speaker',
    'Pocket-size speaker with rich low end.',
    'Portable speaker with stable Bluetooth connection and balanced sound profile for home or travel.',
    58.90,
    null,
    'USD',
    'active',
    false,
    71
  ),
  (
    '5015f4c0-a4eb-4ff7-90f2-6147164f7f05',
    '0f4b6849-8f8e-4a33-a4be-e8d4049a7302',
    'focus-desk-lamp',
    'Focus Desk Lamp',
    'Warm-white table lamp with touch control.',
    'Compact lamp with touch dimmer and anti-glare beam designed for work desks.',
    41.90,
    49.90,
    'USD',
    'active',
    false,
    28
  ),
  (
    '5015f4c0-a4eb-4ff7-90f2-6147164f7f06',
    '0f4b6849-8f8e-4a33-a4be-e8d4049a7303',
    'travel-charger-kit',
    'Travel Charger Kit',
    'Fast charger with compact travel adapter.',
    'High-speed charger with foldable plug and cable set for daily and travel use.',
    67.90,
    79.90,
    'USD',
    'active',
    false,
    45
  );

insert into public.product_images (
  id,
  product_id,
  url,
  alt,
  sort_order,
  is_primary
)
values
  (
    '3a608eb8-9448-4fdb-83cf-518987fbf101',
    '5015f4c0-a4eb-4ff7-90f2-6147164f7f01',
    'https://images.unsplash.com/photo-1611312449408-fcece27cdbb7?auto=format&fit=crop&w=1000&q=80',
    'Daily Comfort Hoodie',
    0,
    true
  ),
  (
    '3a608eb8-9448-4fdb-83cf-518987fbf102',
    '5015f4c0-a4eb-4ff7-90f2-6147164f7f02',
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1000&q=80',
    'Urban Motion Sneakers',
    0,
    true
  ),
  (
    '3a608eb8-9448-4fdb-83cf-518987fbf103',
    '5015f4c0-a4eb-4ff7-90f2-6147164f7f03',
    'https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=1000&q=80',
    'Canvas Weekend Bag',
    0,
    true
  ),
  (
    '3a608eb8-9448-4fdb-83cf-518987fbf104',
    '5015f4c0-a4eb-4ff7-90f2-6147164f7f04',
    'https://images.unsplash.com/photo-1589003077984-894e133dabab?auto=format&fit=crop&w=1000&q=80',
    'Mini Bluetooth Speaker',
    0,
    true
  ),
  (
    '3a608eb8-9448-4fdb-83cf-518987fbf105',
    '5015f4c0-a4eb-4ff7-90f2-6147164f7f05',
    'https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?auto=format&fit=crop&w=1000&q=80',
    'Focus Desk Lamp',
    0,
    true
  ),
  (
    '3a608eb8-9448-4fdb-83cf-518987fbf106',
    '5015f4c0-a4eb-4ff7-90f2-6147164f7f06',
    'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=1000&q=80',
    'Travel Charger Kit',
    0,
    true
  );

insert into public.collections (
  id,
  slug,
  title,
  description,
  is_active
)
values
  (
    '45f471f8-c8b0-4f80-b6e4-fd844350e101',
    'featured',
    'Featured',
    'Editor picks for the homepage.',
    true
  ),
  (
    '45f471f8-c8b0-4f80-b6e4-fd844350e102',
    'fresh-drops',
    'Fresh Drops',
    'Recently added products.',
    true
  );

insert into public.collection_items (
  id,
  collection_id,
  product_id,
  sort_order
)
values
  (
    '84ec804d-81d2-43b8-afba-e77d0f6f5101',
    '45f471f8-c8b0-4f80-b6e4-fd844350e101',
    '5015f4c0-a4eb-4ff7-90f2-6147164f7f01',
    1
  ),
  (
    '84ec804d-81d2-43b8-afba-e77d0f6f5102',
    '45f471f8-c8b0-4f80-b6e4-fd844350e101',
    '5015f4c0-a4eb-4ff7-90f2-6147164f7f02',
    2
  ),
  (
    '84ec804d-81d2-43b8-afba-e77d0f6f5103',
    '45f471f8-c8b0-4f80-b6e4-fd844350e102',
    '5015f4c0-a4eb-4ff7-90f2-6147164f7f04',
    1
  ),
  (
    '84ec804d-81d2-43b8-afba-e77d0f6f5104',
    '45f471f8-c8b0-4f80-b6e4-fd844350e102',
    '5015f4c0-a4eb-4ff7-90f2-6147164f7f06',
    2
  );

commit;

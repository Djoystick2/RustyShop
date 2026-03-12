-- Optional seed for local preview and smoke-test.
-- Keep data compact and deterministic.

insert into store_settings (
  id,
  store_name,
  brand_slogan,
  hero_badge,
  mascot_emoji,
  store_description,
  welcome_text,
  info_block,
  promo_title,
  promo_text
)
values (
  'main',
  'Ярмарка мастера',
  'Теплые вещи с душой',
  'Handmade',
  '🧵',
  'Персональная ярмарка авторских изделий.',
  'Добро пожаловать в уютную мастерскую.',
  'Каждое изделие создается вручную небольшими партиями.',
  'Весенняя подборка',
  'Собрали любимые работы и новинки сезона.'
)
on conflict (id) do update
set
  store_name = excluded.store_name,
  brand_slogan = excluded.brand_slogan,
  hero_badge = excluded.hero_badge,
  mascot_emoji = excluded.mascot_emoji,
  store_description = excluded.store_description,
  welcome_text = excluded.welcome_text,
  info_block = excluded.info_block,
  promo_title = excluded.promo_title,
  promo_text = excluded.promo_text;

insert into seller_settings (
  id,
  seller_name,
  short_bio,
  brand_story,
  philosophy,
  materials_focus,
  telegram_username,
  telegram_link,
  contact_text,
  about_seller,
  city
)
values (
  'main',
  'Мастер RustyLand',
  'Делаю уютные вещи для дома и подарков.',
  'Небольшая мастерская, где каждая вещь проходит через руки мастера.',
  'Тактильность, теплые оттенки и практичность.',
  'Хлопок, лен, дерево, натуральные фактуры.',
  '',
  '',
  'Свяжитесь в Telegram, чтобы уточнить детали заказа.',
  'Работаю с небольшими сериями и индивидуальными запросами.',
  'Казань'
)
on conflict (id) do update
set
  seller_name = excluded.seller_name,
  short_bio = excluded.short_bio,
  brand_story = excluded.brand_story,
  philosophy = excluded.philosophy,
  materials_focus = excluded.materials_focus,
  telegram_username = excluded.telegram_username,
  telegram_link = excluded.telegram_link,
  contact_text = excluded.contact_text,
  about_seller = excluded.about_seller,
  city = excluded.city;

insert into categories (id, slug, name, description, emoji, sort_order, is_visible)
values
  ('11111111-1111-4111-8111-111111111111', 'home', 'Уют для дома', 'Декор, свечи и текстиль ручной работы.', '🏠', 10, true),
  ('22222222-2222-4222-8222-222222222222', 'toys', 'Игрушки', 'Мягкие игрушки и подарки.', '🧸', 20, true)
on conflict (id) do update
set
  slug = excluded.slug,
  name = excluded.name,
  description = excluded.description,
  emoji = excluded.emoji,
  sort_order = excluded.sort_order,
  is_visible = excluded.is_visible;

insert into products (
  id,
  category_id,
  title,
  description,
  price_text,
  status,
  materials,
  is_visible,
  is_available,
  is_giveaway_eligible,
  is_featured
)
values
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '11111111-1111-4111-8111-111111111111',
    'Свеча в керамике',
    'Теплый аромат и ручная заливка в многоразовой керамике.',
    '2 300 ₽',
    'new',
    array['соевый воск', 'керамика'],
    true,
    true,
    true,
    true
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    '22222222-2222-4222-8222-222222222222',
    'Мягкий зайка',
    'Игрушка из мягкого хлопка, подходит для подарка.',
    '3 100 ₽',
    'popular',
    array['хлопок', 'наполнитель'],
    true,
    true,
    false,
    false
  )
on conflict (id) do update
set
  category_id = excluded.category_id,
  title = excluded.title,
  description = excluded.description,
  price_text = excluded.price_text,
  status = excluded.status,
  materials = excluded.materials,
  is_visible = excluded.is_visible,
  is_available = excluded.is_available,
  is_giveaway_eligible = excluded.is_giveaway_eligible,
  is_featured = excluded.is_featured;

insert into product_images (id, product_id, url, is_primary, position)
values
  (
    'aaaaaaaa-0000-4000-8000-aaaaaaaa0000',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'https://images.unsplash.com/photo-1602872030219-ad2b9ccf5f68?auto=format&fit=crop&w=1200&q=80',
    true,
    1
  ),
  (
    'bbbbbbbb-0000-4000-8000-bbbbbbbb0000',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1200&q=80',
    true,
    1
  )
on conflict (id) do update
set
  product_id = excluded.product_id,
  url = excluded.url,
  is_primary = excluded.is_primary,
  position = excluded.position;

insert into homepage_sections (
  id,
  section_type,
  title,
  subtitle,
  content,
  linked_category_id,
  linked_product_ids,
  sort_order,
  is_enabled
)
values
  (
    '10000000-0000-4000-8000-000000000001',
    'hero',
    'Добро пожаловать',
    'Авторская ярмарка',
    'Уникальные изделия ручной работы.',
    null,
    '{}',
    10,
    true
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    'new_arrivals',
    'Новинки',
    '',
    '',
    null,
    '{}',
    20,
    true
  ),
  (
    '10000000-0000-4000-8000-000000000003',
    'recommended',
    'Рекомендуем',
    '',
    '',
    null,
    '{}',
    30,
    true
  ),
  (
    '10000000-0000-4000-8000-000000000004',
    'about',
    'О мастере',
    '',
    'История, подход и материалы.',
    null,
    '{}',
    40,
    true
  )
on conflict (id) do update
set
  section_type = excluded.section_type,
  title = excluded.title,
  subtitle = excluded.subtitle,
  content = excluded.content,
  linked_category_id = excluded.linked_category_id,
  linked_product_ids = excluded.linked_product_ids,
  sort_order = excluded.sort_order,
  is_enabled = excluded.is_enabled;


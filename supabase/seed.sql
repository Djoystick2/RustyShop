-- Optional seed for local preview and smoke-test.
-- Keep data compact and deterministic.

insert into store_settings (
  id,
  store_name,
  brand_slogan,
  hero_badge,
  hero_image_url,
  mascot_emoji,
  store_description,
  welcome_text,
  info_block,
  promo_title,
  promo_text
)
values (
  'main',
  'РЇСЂРјР°СЂРєР° РјР°СЃС‚РµСЂР°',
  'РўРµРїР»С‹Рµ РІРµС‰Рё СЃ РґСѓС€РѕР№',
  'Handmade',
  '',
  'рџ§µ',
  'РџРµСЂСЃРѕРЅР°Р»СЊРЅР°СЏ СЏСЂРјР°СЂРєР° Р°РІС‚РѕСЂСЃРєРёС… РёР·РґРµР»РёР№.',
  'Р”РѕР±СЂРѕ РїРѕР¶Р°Р»РѕРІР°С‚СЊ РІ СѓСЋС‚РЅСѓСЋ РјР°СЃС‚РµСЂСЃРєСѓСЋ.',
  'РљР°Р¶РґРѕРµ РёР·РґРµР»РёРµ СЃРѕР·РґР°РµС‚СЃСЏ РІСЂСѓС‡РЅСѓСЋ РЅРµР±РѕР»СЊС€РёРјРё РїР°СЂС‚РёСЏРјРё.',
  'Р’РµСЃРµРЅРЅСЏСЏ РїРѕРґР±РѕСЂРєР°',
  'РЎРѕР±СЂР°Р»Рё Р»СЋР±РёРјС‹Рµ СЂР°Р±РѕС‚С‹ Рё РЅРѕРІРёРЅРєРё СЃРµР·РѕРЅР°.'
)
on conflict (id) do update
set
  store_name = excluded.store_name,
  brand_slogan = excluded.brand_slogan,
  hero_badge = excluded.hero_badge,
  hero_image_url = excluded.hero_image_url,
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
  city,
  purchase_message_template,
  purchase_button_label
)
values (
  'main',
  'РњР°СЃС‚РµСЂ RustyLand',
  'Р”РµР»Р°СЋ СѓСЋС‚РЅС‹Рµ РІРµС‰Рё РґР»СЏ РґРѕРјР° Рё РїРѕРґР°СЂРєРѕРІ.',
  'РќРµР±РѕР»СЊС€Р°СЏ РјР°СЃС‚РµСЂСЃРєР°СЏ, РіРґРµ РєР°Р¶РґР°СЏ РІРµС‰СЊ РїСЂРѕС…РѕРґРёС‚ С‡РµСЂРµР· СЂСѓРєРё РјР°СЃС‚РµСЂР°.',
  'РўР°РєС‚РёР»СЊРЅРѕСЃС‚СЊ, С‚РµРїР»С‹Рµ РѕС‚С‚РµРЅРєРё Рё РїСЂР°РєС‚РёС‡РЅРѕСЃС‚СЊ.',
  'РҐР»РѕРїРѕРє, Р»РµРЅ, РґРµСЂРµРІРѕ, РЅР°С‚СѓСЂР°Р»СЊРЅС‹Рµ С„Р°РєС‚СѓСЂС‹.',
  '',
  '',
  'РЎРІСЏР¶РёС‚РµСЃСЊ РІ Telegram, С‡С‚РѕР±С‹ СѓС‚РѕС‡РЅРёС‚СЊ РґРµС‚Р°Р»Рё Р·Р°РєР°Р·Р°.',
  'Р Р°Р±РѕС‚Р°СЋ СЃ РЅРµР±РѕР»СЊС€РёРјРё СЃРµСЂРёСЏРјРё Рё РёРЅРґРёРІРёРґСѓР°Р»СЊРЅС‹РјРё Р·Р°РїСЂРѕСЃР°РјРё.',
  'РљР°Р·Р°РЅСЊ',
  'Р—РґСЂР°РІСЃС‚РІСѓР№С‚Рµ! РҐРѕС‡Сѓ РїСЂРёРѕР±СЂРµСЃС‚Рё С‚РѕРІР°СЂ: {product}',
  'РџСЂРёРѕР±СЂРµСЃС‚Рё'
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
  city = excluded.city,
  purchase_message_template = excluded.purchase_message_template,
  purchase_button_label = excluded.purchase_button_label;

insert into categories (
  id,
  slug,
  parent_category_id,
  name,
  description,
  emoji,
  image_url,
  banner_url,
  sort_order,
  is_visible
)
values
  ('11111111-1111-4111-8111-111111111111', 'home', null, 'РЈСЋС‚ РґР»СЏ РґРѕРјР°', 'Р”РµРєРѕСЂ, СЃРІРµС‡Рё Рё С‚РµРєСЃС‚РёР»СЊ СЂСѓС‡РЅРѕР№ СЂР°Р±РѕС‚С‹.', 'рџЏ ', '', '', 10, true),
  ('11111111-1111-4111-8111-111111111112', 'candles', '11111111-1111-4111-8111-111111111111', 'РЎРІРµС‡Рё', 'РђСЂРѕРјР°С‚РЅС‹Рµ Рё РґРµРєРѕСЂР°С‚РёРІРЅС‹Рµ СЃРІРµС‡Рё.', 'рџ•Ї', '', '', 10, true),
  ('22222222-2222-4222-8222-222222222222', 'toys', null, 'РРіСЂСѓС€РєРё', 'РњСЏРіРєРёРµ РёРіСЂСѓС€РєРё Рё РїРѕРґР°СЂРєРё.', 'рџ§ё', '', '', 20, true),
  ('22222222-2222-4222-8222-222222222223', 'soft-toys', '22222222-2222-4222-8222-222222222222', 'РњСЏРіРєРёРµ РёРіСЂСѓС€РєРё', 'РўРµРєСЃС‚РёР»СЊРЅС‹Рµ РіРµСЂРѕРё РґР»СЏ РґРµС‚РµР№ Рё РїРѕРґР°СЂРєРѕРІ.', 'рџђ°', '', '', 10, true)
on conflict (id) do update
set
  slug = excluded.slug,
  parent_category_id = excluded.parent_category_id,
  name = excluded.name,
  description = excluded.description,
  emoji = excluded.emoji,
  image_url = excluded.image_url,
  banner_url = excluded.banner_url,
  sort_order = excluded.sort_order,
  is_visible = excluded.is_visible;

insert into products (
  id,
  category_id,
  sku,
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
    '11111111-1111-4111-8111-111111111112',
    'CNDL-001',
    'РЎРІРµС‡Р° РІ РєРµСЂР°РјРёРєРµ',
    'РўРµРїР»С‹Р№ Р°СЂРѕРјР°С‚ Рё СЂСѓС‡РЅР°СЏ Р·Р°Р»РёРІРєР° РІ РјРЅРѕРіРѕСЂР°Р·РѕРІРѕР№ РєРµСЂР°РјРёРєРµ.',
    '2 300 в‚Ѕ',
    'new',
    array['СЃРѕРµРІС‹Р№ РІРѕСЃРє', 'РєРµСЂР°РјРёРєР°'],
    true,
    true,
    true,
    true
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    '22222222-2222-4222-8222-222222222223',
    'TOY-001',
    'РњСЏРіРєРёР№ Р·Р°Р№РєР°',
    'РРіСЂСѓС€РєР° РёР· РјСЏРіРєРѕРіРѕ С…Р»РѕРїРєР°, РїРѕРґС…РѕРґРёС‚ РґР»СЏ РїРѕРґР°СЂРєР°.',
    '3 100 в‚Ѕ',
    'popular',
    array['С…Р»РѕРїРѕРє', 'РЅР°РїРѕР»РЅРёС‚РµР»СЊ'],
    true,
    true,
    false,
    false
  )
on conflict (id) do update
set
  category_id = excluded.category_id,
  sku = excluded.sku,
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
    'Р”РѕР±СЂРѕ РїРѕР¶Р°Р»РѕРІР°С‚СЊ',
    'РђРІС‚РѕСЂСЃРєР°СЏ СЏСЂРјР°СЂРєР°',
    'РЈРЅРёРєР°Р»СЊРЅС‹Рµ РёР·РґРµР»РёСЏ СЂСѓС‡РЅРѕР№ СЂР°Р±РѕС‚С‹.',
    null,
    '{}',
    10,
    true
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    'new_arrivals',
    'РќРѕРІРёРЅРєРё',
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
    'Р РµРєРѕРјРµРЅРґСѓРµРј',
    '',
    '',
    null,
    '{}',
    30,
    true
  ),
  (
    '10000000-0000-4000-8000-000000000004',
    'category_pick',
    'РџРѕРґР±РѕСЂРєР° РєР°С‚РµРіРѕСЂРёРё',
    '',
    '',
    '11111111-1111-4111-8111-111111111111',
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

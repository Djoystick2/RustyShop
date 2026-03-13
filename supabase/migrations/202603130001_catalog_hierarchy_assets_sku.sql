alter table categories
  add column if not exists parent_category_id uuid references categories(id) on delete restrict,
  add column if not exists image_url text not null default '',
  add column if not exists banner_url text not null default '';

create index if not exists categories_parent_sort_idx
  on categories(parent_category_id, sort_order, created_at);

alter table products
  add column if not exists sku text not null default '';

alter table store_settings
  add column if not exists hero_image_url text not null default '';

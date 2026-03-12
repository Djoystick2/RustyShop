create extension if not exists pgcrypto with schema extensions;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_user_role') then
    create type app_user_role as enum ('user', 'admin');
  end if;
  if not exists (select 1 from pg_type where typname = 'product_status') then
    create type product_status as enum ('new', 'popular', 'sold_out');
  end if;
  if not exists (select 1 from pg_type where typname = 'giveaway_session_status') then
    create type giveaway_session_status as enum ('draft', 'active', 'completed');
  end if;
end $$;

create table if not exists profiles (
  id uuid primary key default extensions.gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  telegram_user_id bigint unique,
  display_name text not null default 'Гость ярмарки',
  avatar_url text not null default '',
  role app_user_role not null default 'user',
  about text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists categories (
  id uuid primary key default extensions.gen_random_uuid(),
  slug text unique,
  name text not null,
  description text not null default '',
  emoji text not null default '🧵',
  sort_order integer not null default 100,
  is_visible boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists products (
  id uuid primary key default extensions.gen_random_uuid(),
  category_id uuid not null references categories(id) on delete restrict,
  title text not null,
  description text not null default '',
  price_text text not null default 'Цена по запросу',
  status product_status not null default 'new',
  materials text[] not null default '{}',
  is_visible boolean not null default true,
  is_available boolean not null default true,
  is_giveaway_eligible boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists product_images (
  id uuid primary key default extensions.gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  url text not null,
  storage_path text,
  is_primary boolean not null default false,
  position integer not null default 1,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists product_images_primary_idx
  on product_images(product_id)
  where is_primary = true;

create table if not exists favorites (
  profile_id uuid not null references profiles(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (profile_id, product_id)
);

create table if not exists store_settings (
  id text primary key default 'main',
  store_name text not null default 'Ярмарка мастера',
  store_description text not null default '',
  welcome_text text not null default '',
  info_block text not null default '',
  admin_telegram_ids bigint[] not null default '{}',
  updated_at timestamptz not null default timezone('utc', now()),
  constraint store_settings_singleton check (id = 'main')
);

create table if not exists seller_settings (
  id text primary key default 'main',
  seller_name text not null default '',
  telegram_username text not null default '',
  telegram_link text not null default '',
  contact_text text not null default '',
  about_seller text not null default '',
  city text not null default '',
  purchase_message_template text not null default 'Здравствуйте! Хочу приобрести товар: {product}',
  purchase_button_label text not null default 'Приобрести',
  updated_at timestamptz not null default timezone('utc', now()),
  constraint seller_settings_singleton check (id = 'main')
);

create table if not exists giveaway_sessions (
  id uuid primary key default extensions.gen_random_uuid(),
  title text not null,
  description text not null default '',
  status giveaway_session_status not null default 'draft',
  draw_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists giveaway_items (
  id uuid primary key default extensions.gen_random_uuid(),
  session_id uuid not null references giveaway_sessions(id) on delete cascade,
  product_id uuid not null references products(id) on delete restrict,
  slots integer not null default 1 check (slots > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  unique (session_id, product_id)
);

create table if not exists giveaway_results (
  id uuid primary key default extensions.gen_random_uuid(),
  session_id uuid not null references giveaway_sessions(id) on delete cascade,
  product_id uuid not null references products(id) on delete restrict,
  profile_id uuid not null references profiles(id) on delete restrict,
  won_at timestamptz not null default timezone('utc', now()),
  note text not null default ''
);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on profiles;
create trigger profiles_set_updated_at
before update on profiles
for each row execute procedure set_updated_at();

drop trigger if exists categories_set_updated_at on categories;
create trigger categories_set_updated_at
before update on categories
for each row execute procedure set_updated_at();

drop trigger if exists products_set_updated_at on products;
create trigger products_set_updated_at
before update on products
for each row execute procedure set_updated_at();

drop trigger if exists store_settings_set_updated_at on store_settings;
create trigger store_settings_set_updated_at
before update on store_settings
for each row execute procedure set_updated_at();

drop trigger if exists seller_settings_set_updated_at on seller_settings;
create trigger seller_settings_set_updated_at
before update on seller_settings
for each row execute procedure set_updated_at();

drop trigger if exists giveaway_sessions_set_updated_at on giveaway_sessions;
create trigger giveaway_sessions_set_updated_at
before update on giveaway_sessions
for each row execute procedure set_updated_at();

insert into store_settings(id) values ('main')
on conflict (id) do nothing;

insert into seller_settings(id) values ('main')
on conflict (id) do nothing;

create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1
    from profiles p
    where p.auth_user_id = auth.uid() and p.role = 'admin'
  );
$$;

grant execute on function is_admin() to anon, authenticated;

alter table profiles enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table favorites enable row level security;
alter table store_settings enable row level security;
alter table seller_settings enable row level security;
alter table giveaway_sessions enable row level security;
alter table giveaway_items enable row level security;
alter table giveaway_results enable row level security;

drop policy if exists "Public read categories" on categories;
create policy "Public read categories" on categories
for select using (true);

drop policy if exists "Admin manage categories" on categories;
create policy "Admin manage categories" on categories
for all using (is_admin()) with check (is_admin());

drop policy if exists "Public read products" on products;
create policy "Public read products" on products
for select using (true);

drop policy if exists "Admin manage products" on products;
create policy "Admin manage products" on products
for all using (is_admin()) with check (is_admin());

drop policy if exists "Public read product_images" on product_images;
create policy "Public read product_images" on product_images
for select using (true);

drop policy if exists "Admin manage product_images" on product_images;
create policy "Admin manage product_images" on product_images
for all using (is_admin()) with check (is_admin());

drop policy if exists "Owner read favorites" on favorites;
create policy "Owner read favorites" on favorites
for select using (
  is_admin()
  or exists (
    select 1
    from profiles p
    where p.id = favorites.profile_id and p.auth_user_id = auth.uid()
  )
);

drop policy if exists "Owner add favorites" on favorites;
create policy "Owner add favorites" on favorites
for insert with check (
  is_admin()
  or exists (
    select 1
    from profiles p
    where p.id = favorites.profile_id and p.auth_user_id = auth.uid()
  )
);

drop policy if exists "Owner remove favorites" on favorites;
create policy "Owner remove favorites" on favorites
for delete using (
  is_admin()
  or exists (
    select 1
    from profiles p
    where p.id = favorites.profile_id and p.auth_user_id = auth.uid()
  )
);

drop policy if exists "Owner read own profile" on profiles;
create policy "Owner read own profile" on profiles
for select using (
  is_admin() or auth_user_id = auth.uid()
);

drop policy if exists "Owner upsert own profile" on profiles;
create policy "Owner upsert own profile" on profiles
for insert with check (
  is_admin() or auth_user_id = auth.uid()
);

drop policy if exists "Owner update own profile" on profiles;
create policy "Owner update own profile" on profiles
for update using (
  is_admin() or auth_user_id = auth.uid()
) with check (
  is_admin() or auth_user_id = auth.uid()
);

drop policy if exists "Admin delete profiles" on profiles;
create policy "Admin delete profiles" on profiles
for delete using (is_admin());

drop policy if exists "Public read store_settings" on store_settings;
create policy "Public read store_settings" on store_settings
for select using (true);

drop policy if exists "Admin update store_settings" on store_settings;
create policy "Admin update store_settings" on store_settings
for all using (is_admin()) with check (is_admin());

drop policy if exists "Public read seller_settings" on seller_settings;
create policy "Public read seller_settings" on seller_settings
for select using (true);

drop policy if exists "Admin update seller_settings" on seller_settings;
create policy "Admin update seller_settings" on seller_settings
for all using (is_admin()) with check (is_admin());

drop policy if exists "Public read giveaway_sessions" on giveaway_sessions;
create policy "Public read giveaway_sessions" on giveaway_sessions
for select using (true);

drop policy if exists "Admin manage giveaway_sessions" on giveaway_sessions;
create policy "Admin manage giveaway_sessions" on giveaway_sessions
for all using (is_admin()) with check (is_admin());

drop policy if exists "Public read giveaway_items" on giveaway_items;
create policy "Public read giveaway_items" on giveaway_items
for select using (true);

drop policy if exists "Admin manage giveaway_items" on giveaway_items;
create policy "Admin manage giveaway_items" on giveaway_items
for all using (is_admin()) with check (is_admin());

drop policy if exists "Public read giveaway_results" on giveaway_results;
create policy "Public read giveaway_results" on giveaway_results
for select using (true);

drop policy if exists "Admin manage giveaway_results" on giveaway_results;
create policy "Admin manage giveaway_results" on giveaway_results
for all using (is_admin()) with check (is_admin());

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "Public read product-images bucket" on storage.objects;
create policy "Public read product-images bucket" on storage.objects
for select using (bucket_id = 'product-images');

drop policy if exists "Admin upload product-images bucket" on storage.objects;
create policy "Admin upload product-images bucket" on storage.objects
for insert with check (bucket_id = 'product-images' and is_admin());

drop policy if exists "Admin update product-images bucket" on storage.objects;
create policy "Admin update product-images bucket" on storage.objects
for update using (bucket_id = 'product-images' and is_admin());

drop policy if exists "Admin delete product-images bucket" on storage.objects;
create policy "Admin delete product-images bucket" on storage.objects
for delete using (bucket_id = 'product-images' and is_admin());

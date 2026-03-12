alter table products
  add column if not exists is_featured boolean not null default false;

alter table store_settings
  add column if not exists brand_slogan text not null default '',
  add column if not exists hero_badge text not null default '',
  add column if not exists mascot_emoji text not null default '',
  add column if not exists promo_title text not null default '',
  add column if not exists promo_text text not null default '';

alter table seller_settings
  add column if not exists avatar_url text not null default '',
  add column if not exists short_bio text not null default '',
  add column if not exists brand_story text not null default '',
  add column if not exists philosophy text not null default '',
  add column if not exists materials_focus text not null default '';

create table if not exists homepage_sections (
  id uuid primary key default extensions.gen_random_uuid(),
  section_type text not null check (
    section_type in (
      'hero',
      'new_arrivals',
      'recommended',
      'giveaway',
      'category_pick',
      'about',
      'promo',
      'seasonal_pick'
    )
  ),
  title text not null default '',
  subtitle text not null default '',
  content text not null default '',
  linked_category_id uuid references categories(id) on delete set null,
  linked_product_ids uuid[] not null default '{}',
  is_enabled boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists homepage_sections_sort_idx on homepage_sections(sort_order asc);

drop trigger if exists homepage_sections_set_updated_at on homepage_sections;
create trigger homepage_sections_set_updated_at
before update on homepage_sections
for each row execute procedure set_updated_at();

alter table homepage_sections enable row level security;

drop policy if exists "Public read homepage_sections" on homepage_sections;
create policy "Public read homepage_sections" on homepage_sections
for select using (true);

drop policy if exists "Admin manage homepage_sections" on homepage_sections;
create policy "Admin manage homepage_sections" on homepage_sections
for all using (is_admin()) with check (is_admin());

insert into homepage_sections (section_type, title, subtitle, sort_order, is_enabled)
select 'hero', 'Главный блок', '', 10, true
where not exists (select 1 from homepage_sections);

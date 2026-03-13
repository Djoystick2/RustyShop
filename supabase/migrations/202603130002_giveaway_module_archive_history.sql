alter table giveaway_sessions
  add column if not exists mode text not null default 'scenario';

alter table giveaway_items
  add column if not exists item_type text not null default 'catalog_product',
  add column if not exists title text not null default '',
  add column if not exists description text not null default '',
  add column if not exists emoji text not null default '',
  add column if not exists image_url text not null default '';

alter table giveaway_items
  alter column product_id drop not null;

update giveaway_items as items
set
  title = coalesce(nullif(items.title, ''), products.title),
  description = coalesce(nullif(items.description, ''), products.description)
from products
where products.id = items.product_id;

create table if not exists giveaway_participants (
  id uuid primary key default extensions.gen_random_uuid(),
  session_id uuid not null references giveaway_sessions(id) on delete cascade,
  nickname text not null,
  comment text not null default '',
  created_at timestamptz not null default timezone('utc', now())
);

alter table giveaway_results
  add column if not exists giveaway_item_id uuid references giveaway_items(id) on delete restrict,
  add column if not exists item_type text not null default 'catalog_product',
  add column if not exists participant_id uuid references giveaway_participants(id) on delete set null,
  add column if not exists prize_title text not null default '';

alter table giveaway_results
  alter column product_id drop not null;

update giveaway_results as results
set
  giveaway_item_id = items.id,
  prize_title = coalesce(
    nullif(results.prize_title, ''),
    (
      select products.title
      from products
      where products.id = results.product_id
    )
  )
from giveaway_items as items
where items.session_id = results.session_id
  and items.product_id is not distinct from results.product_id
  and results.giveaway_item_id is null;

create table if not exists giveaway_events (
  id uuid primary key default extensions.gen_random_uuid(),
  session_id uuid not null references giveaway_sessions(id) on delete cascade,
  event_type text not null,
  message text not null,
  created_at timestamptz not null default timezone('utc', now())
);

alter table giveaway_participants enable row level security;
alter table giveaway_events enable row level security;

drop policy if exists "Public read giveaway_participants" on giveaway_participants;
create policy "Public read giveaway_participants" on giveaway_participants
for select using (true);

drop policy if exists "Admin manage giveaway_participants" on giveaway_participants;
create policy "Admin manage giveaway_participants" on giveaway_participants
for all using (is_admin()) with check (is_admin());

drop policy if exists "Public read giveaway_events" on giveaway_events;
create policy "Public read giveaway_events" on giveaway_events
for select using (true);

drop policy if exists "Admin manage giveaway_events" on giveaway_events;
create policy "Admin manage giveaway_events" on giveaway_events
for all using (is_admin()) with check (is_admin());

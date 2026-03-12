-- Runtime readiness fixes for production-like integration.

do $$
begin
  if exists (
    select 1
    from information_schema.table_constraints
    where constraint_schema = 'public'
      and table_name = 'giveaway_results'
      and constraint_name = 'giveaway_results_profile_id_fkey'
  ) then
    alter table giveaway_results
      drop constraint giveaway_results_profile_id_fkey;
  end if;
end $$;

alter table giveaway_results
  add constraint giveaway_results_profile_id_fkey
  foreign key (profile_id)
  references profiles(id)
  on delete set null;

create index if not exists product_images_product_position_idx
  on product_images(product_id, position);

alter table homepage_sections
  alter column linked_product_ids set default '{}';

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;


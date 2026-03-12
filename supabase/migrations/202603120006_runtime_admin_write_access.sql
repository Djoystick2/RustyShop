-- Runtime write policies for Telegram Mini App admin flow without Supabase auth session.
-- NOTE: this keeps write access open on anon role and should be replaced with
-- server-verified mutation endpoints for stronger security.

drop policy if exists "Admin manage categories" on categories;
create policy "Runtime manage categories" on categories
for all using (true) with check (true);

drop policy if exists "Admin manage products" on products;
create policy "Runtime manage products" on products
for all using (true) with check (true);

drop policy if exists "Admin manage product_images" on product_images;
create policy "Runtime manage product_images" on product_images
for all using (true) with check (true);

drop policy if exists "Admin update store_settings" on store_settings;
create policy "Runtime manage store_settings" on store_settings
for all using (true) with check (true);

drop policy if exists "Admin update seller_settings" on seller_settings;
create policy "Runtime manage seller_settings" on seller_settings
for all using (true) with check (true);

drop policy if exists "Admin manage giveaway_sessions" on giveaway_sessions;
create policy "Runtime manage giveaway_sessions" on giveaway_sessions
for all using (true) with check (true);

drop policy if exists "Admin manage giveaway_items" on giveaway_items;
create policy "Runtime manage giveaway_items" on giveaway_items
for all using (true) with check (true);

drop policy if exists "Admin manage giveaway_results" on giveaway_results;
create policy "Runtime manage giveaway_results" on giveaway_results
for all using (true) with check (true);

drop policy if exists "Admin manage homepage_sections" on homepage_sections;
create policy "Runtime manage homepage_sections" on homepage_sections
for all using (true) with check (true);

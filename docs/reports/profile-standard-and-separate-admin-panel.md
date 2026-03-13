# Profile Standard And Separate Admin Panel

Date: 2026-03-13

## Goal

Make the normal profile clean and standard, and move all administrative work to a separate admin page instead of keeping admin UX inside `ProfilePage`.

## What changed

### 1. Profile page

- `ProfilePage` was rebuilt as a normal, friendly profile screen.
- Removed the embedded admin hub from the profile.
- Removed admin-marketing/service copy like “compact admin hub”.
- Added a dedicated `Админ-панель` button for administrators.
- Kept the profile focused on:
  - identity;
  - favorites;
  - purchase/help links;
  - theme switch.

### 2. Telegram name and avatar

- Added `photo_url` to the Telegram runtime user type.
- Exposed `telegramUser` from `AppContext`.
- `ProfilePage` now uses Telegram runtime data as the primary source for profile name and avatar.
- Current behavior:
  - name priority: `telegramUser.first_name + last_name`, then `telegram username`, then local profile fallback;
  - avatar priority: `telegramUser.photo_url`, and only if Telegram user data is unavailable does it fall back to local profile avatar.

### 3. Separate admin page

- Added a separate `/admin` route and `AdminPage`.
- Admin page is linked from the profile and feels like a distinct administrative area.
- Bottom navigation treats `/admin` as part of the profile section for active state.

### 4. Admin page tabs

- Added a compact tab switch at the top of `AdminPage`.
- Two tabs are available:
  - `Работа`
  - `Товары`

### 5. Work tab

- `Работа` now groups:
  - storefront texts;
  - purchase/seller texts;
  - quick actions;
  - focused jump to the products tab;
  - giveaway management section.

### 6. Products tab

- `Товары` now contains the real product admin surface only.
- Available actions:
  - list products;
  - search/filter products;
  - add product;
  - open edit;
  - delete product;
  - hide/show;
  - switch `под заказ / в наличии`;
  - recommend/remove recommendation;
  - open product screen;
  - use storefront buy CTA as admin.

## Real actions now working

- Save storefront texts.
- Save seller/purchase texts.
- Open quick navigation targets from the work tab.
- Switch from the work tab to the products tab via focused action.
- Create/update giveaway sessions.
- Change giveaway session status.
- Add/remove giveaway lots.
- Create/update products.
- Delete products.
- Toggle product flags.
- Open product UI and buy CTA as admin.

## Transition to admin page

- Entry point: `ProfilePage` now shows a dedicated `Админ-панель` button for admins.
- Route: `/admin`
- Guarding:
  - if the admin runtime is not verified/available, `AdminPage` shows a dedicated access-denied screen with status refresh instead of pretending the panel works.

## Telegram name/avatar result

- Name is now sourced from Telegram runtime data whenever it is available.
- Avatar is now sourced from Telegram `photo_url` whenever it is available.
- Limitation:
  - if the current runtime does not provide Telegram user data or does not include `photo_url`, the UI cannot claim strict Telegram avatar parity.
  - in that case the best honest fallback is used:
    - name falls back to local profile display name;
    - avatar falls back only when Telegram user data itself is unavailable.

## Files changed

- `src/types/telegram.ts`
- `src/context/AppContext.tsx`
- `src/pages/ProfilePage.tsx`
- `src/pages/AdminPage.tsx`
- `src/App.tsx`
- `src/components/layout/BottomNav.tsx`
- `src/components/admin/AdminPanel.tsx`
- `src/styles.css`

## Checks performed

- `npm run typecheck`
- `npm run build`

## Remaining limitations

- Product deletion is still intentionally blocked when a product already exists in `giveaway_results` history, because current backend constraints preserve giveaway history.
- Telegram avatar strictness still depends on whether the Mini App runtime actually supplies `photo_url` in the current session.
- No backend schema changes were made in this task.

# Admin Hub Real Management Wave

Date: 2026-03-13

## Goal

Turn the current Profile/Admin screen into a real action-first admin hub for RustyShop instead of a set of descriptive cards with links to other screens.

## What was reworked

### 1. Profile/Admin shell

- Simplified the admin branch of `ProfilePage`.
- Removed the old 4-card informational hub surface.
- Kept the profile hero compact and focused on quick navigation, counts, theme, and admin access state.
- Mounted the new `AdminPanel` directly as the main working surface.

### 2. Storefront / texts zone

- Rebuilt `AdminPanel` into a dense multi-section admin hub.
- Split public text management into two compact forms:
  - storefront texts: store name, hero badge, slogan, store description;
  - seller / purchase texts: seller name, city, short bio, contact text, purchase button label.
- Kept real save actions through existing `updateStoreSettings` and `updateSellerSettings`.
- Removed long helper/explanatory paragraphs from the main surface.

### 3. Products zone

- Added a real compact product management block inside the admin hub.
- Added a focused product editor with real save support through existing `saveProduct`.
- Added quick list actions directly in the hub:
  - add product;
  - edit product;
  - hide / show;
  - switch `под заказ / в наличии`;
  - recommend / remove recommendation;
  - open product screen;
  - buy/contact action for storefront scenario;
  - delete product.
- Added search and filters for the admin product list.

### 4. Real product delete flow

- Extended repository contracts and `AppContext` with `deleteProduct`.
- Implemented delete in local repository.
- Implemented delete in Supabase repository with cleanup of:
  - giveaway items for that product;
  - storage files for product images;
  - homepage linked product ids.
- Deletion is intentionally blocked for products already present in giveaway results history.

### 5. Giveaway zone

- Added a dedicated admin section in the hub for giveaway management.
- Preserved the existing full giveaway page/flow.
- Added real inline giveaway actions in the hub:
  - create session;
  - edit session;
  - change session status (`draft`, `active`, `completed`);
  - add lot to selected session;
  - remove active lot;
  - jump to the full giveaway page for wheel/history.

### 6. Storefront scenario for admin

- Restored the storefront purchase experience for admins in product UI.
- Admins now still see purchase/contact CTA in:
  - product cards;
  - mini product cards;
  - quick view modal;
  - full product page.
- Admin controls remain available in parallel instead of replacing the user purchase flow.

### 7. Dark theme and density

- Reworked dark theme variables toward a higher-contrast charcoal palette.
- Added compact admin-specific layout and mobile rules for:
  - section headers;
  - product rows;
  - session rows;
  - lot rows;
  - admin search and filter controls.

## Real admin actions now available on the admin hub

### Texts / Storefront

- Save storefront texts.
- Save seller/public purchase texts.

### Products

- Create product.
- Edit product.
- Delete product.
- Hide / show product.
- Toggle `под заказ / в наличии`.
- Recommend / remove recommendation.
- Open product page.
- Trigger storefront buy/contact CTA from the same admin list.

### Giveaway

- Create giveaway session.
- Edit giveaway session.
- Activate session.
- Move session back to draft.
- Complete session.
- Add lot to session.
- Remove active lot from session.
- Open full giveaway control page.

## Files changed

- `src/pages/ProfilePage.tsx`
- `src/components/admin/AdminPanel.tsx`
- `src/components/products/ProductCard.tsx`
- `src/components/products/ProductMiniCard.tsx`
- `src/components/products/ProductQuickViewModal.tsx`
- `src/pages/ProductPage.tsx`
- `src/context/AppContext.tsx`
- `src/data/repositories/contracts.ts`
- `src/data/repositories/local-repository.ts`
- `src/data/repositories/supabase-repository.ts`
- `src/data/repositories/unavailable-repository.ts`
- `src/styles.css`

## Checks performed

- `npm run typecheck`
- `npm run build`

## Limitations

- Product deletion is blocked when the product already exists in `giveaway_results` history. This is intentional and matches current backend constraints (`products` referenced by giveaway results with restricted delete semantics).
- No backend schema changes were introduced in this wave.
- No fake placeholder actions were added; all surfaced actions are wired to real existing flows or to the new real `deleteProduct` path.

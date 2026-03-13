# Giveaway Module: Archive, History, Special Prizes

## Changed files

- `src/types/entities.ts`
  - Expanded giveaway model with session mode, special-prize lots, participants, richer results and event log.
- `src/data/state.ts`
  - Added bootstrap/state support for participants and event log plus richer giveaway inputs.
- `src/data/seed.ts`
  - Rebuilt fallback data so local bootstrap includes quick/scenario sessions, archive data, participants and events.
- `src/types/db.ts`
  - Extended Supabase table types for new giveaway fields and tables.
- `src/data/repositories/contracts.ts`
  - Added repository methods for participants and richer giveaway result payload.
- `src/data/repositories/mappers.ts`
  - Added mappers for participants/events and updated session/item/result mapping.
- `src/data/repositories/local-repository.ts`
  - Added persistence/normalization for giveaway participants, special prizes, archive data and event log.
- `src/data/repositories/supabase-repository.ts`
  - Added Supabase bootstrap and mutations for new giveaway schema, archive/history writes and event log.
- `src/data/repositories/unavailable-repository.ts`
  - Synced repository contract with new giveaway participant methods.
- `src/context/AppContext.tsx`
  - Added admin actions for special prizes, participants and richer spin result/event handling.
- `src/domain/giveaway/wheel.ts`
  - Updated wheel segments for nullable product binding and special-prize labels.
- `src/pages/GiveawayPage.tsx`
  - Reworked giveaway into a tabbed module: quick mode, scenario mode, archive, winner history, session log.
- `src/styles.css`
  - Added compact layout styles for giveaway stats, lists and archive/log blocks.
- `supabase/migrations/202603130002_giveaway_module_archive_history.sql`
  - Added DB migration for session mode, special-prize lot fields, participants and giveaway event log.

## How it works now

### Quick giveaway

- Quick mode uses giveaway sessions with `mode = quick`.
- Admin can create a fresh quick session from the module, add catalog lots, add special prizes, add participants and immediately spin.
- Each spin still saves a normal giveaway result, so quick mode also lands in archive/history.

### Scenario giveaway

- Scenario mode uses giveaway sessions with `mode = scenario`.
- Admin can create or update a scenario session with title, description, draw time and spin duration.
- The working session screen shows status, lots, participants, results and session log in one place.
- Session can be opened, moved back to draft or completed manually.

### Archive

- Archive tab shows completed sessions only.
- Admin can open a конкретная completed session and inspect its results, lots and event log.
- Archive is fed from persistent `giveaway_results`, `giveaway_items`, `giveaway_participants` and `giveaway_events`.

### Winner history

- Winner history is now a separate readable layer built from saved giveaway results.
- Each record stores prize title, winner nickname, session id, lot id, item type, optional product id and optional participant id.
- Ordering is chronological by saved result timestamp.

### Special prizes

- Giveaway lot now supports two types:
  - `catalog_product`
  - `special_prize`
- Special prize does not require a catalog product binding.
- Admin can define title, description, emoji and optional image URL.

### Event log

- Each session now keeps a practical event log.
- Events are recorded for session creation/update/status change, lot add/remove, participant add/remove, spin start, result save and completion.
- Event log is visible in the working session and in archive.

## What admin can do in UI now

- Create a quick giveaway session.
- Create/update a scenario giveaway session.
- Open, stop back to draft and complete a session.
- Add giveaway lots from catalog products.
- Add special-prize lots without product binding.
- Remove active lots safely when they are not already part of history.
- Add participants manually with nickname/name and optional comment.
- Remove participants safely when they are not already referenced by saved results.
- Select a participant for the next spin.
- Run a spin and save the result into persistent history.
- Browse completed sessions in archive.
- Inspect winner history and session log.

## What is still not fully closed

- The richer giveaway workflow is concentrated on `/giveaway`; the older compact giveaway block inside the profile admin tab was not fully rebuilt into the same surface.
- Special-prize media uses URL input only; there is no dedicated upload/storage UI for prize media.
- Manual mid-spin stop is still not a true interruptable wheel-stop mechanic; session stop/draft control is available, but not a partial spin interruption.
- Archive details currently focus on results, lots and event log; participant comments are visible in working mode and base archive data, but archive does not yet have a more elaborate participant timeline view.

## Verification

- `npm run typecheck`
- `npm run build`

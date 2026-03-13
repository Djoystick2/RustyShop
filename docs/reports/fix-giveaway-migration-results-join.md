# Fix: giveaway migration `results` join

## What was fixed

File:

- `supabase/migrations/202603130002_giveaway_module_archive_history.sql`

Problematic fragment before:

```sql
update giveaway_results as results
set
  giveaway_item_id = items.id,
  prize_title = coalesce(nullif(results.prize_title, ''), products.title)
from giveaway_items as items
left join products on products.id = results.product_id
where items.session_id = results.session_id
  and items.product_id is not distinct from results.product_id
  and results.giveaway_item_id is null;
```

Fixed fragment now:

```sql
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
```

## Why the error happened

PostgreSQL does not allow the target table alias from `UPDATE giveaway_results as results` to be referenced inside the `JOIN ... ON` clause of the `FROM` section.

The broken part was:

- `left join products on products.id = results.product_id`

That produced:

- `invalid reference to FROM-clause entry for table "results" (SQLSTATE 42P01)`

## Why this is now Postgres-compatible

- The `LEFT JOIN products ... ON ... results.product_id` dependency was removed.
- The lookup of `products.title` was moved into a correlated subquery inside `SET`.
- References to `results.*` now remain in places PostgreSQL accepts for `UPDATE ... FROM`:
  - inside `SET`
  - inside `WHERE`

Business meaning was preserved:

- `giveaway_item_id` is still populated from matching `giveaway_items`
- `prize_title` is still backfilled from the product title only when `results.prize_title` is empty

## Other similar places checked

Searched the same migration for similar alias misuse.

Result:

- No other `JOIN ... ON` fragments were found that reference `results`
- Remaining `results.*` references are only in:
  - `SET`
  - `WHERE`

Those usages are valid for PostgreSQL `UPDATE ... FROM`.

## Checks

Performed:

- manual SQL review of the patched fragment
- search for other `results` references in problematic join positions
- `supabase --version`

Could not fully execute:

- `supabase db lint --local --fail-on error`

Reason:

- local Postgres was not running in this environment
- CLI error was connection refusal to `127.0.0.1:54322`, not a SQL parse error

## Exact changed lines

The effective fix is in:

- `supabase/migrations/202603130002_giveaway_module_archive_history.sql:38`
- `supabase/migrations/202603130002_giveaway_module_archive_history.sql:49`

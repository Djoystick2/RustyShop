# Step 13: Admin Persistence Fix (Live)

Дата: 2026-03-12

## Почему product updates возвращали “не найдено или нет прав”

Первопричина: RLS-политика `Admin manage products` завязана на `is_admin()`, а `is_admin()` проверяет только `profiles.auth_user_id = auth.uid()`.

В live Telegram verify/admin unlock работает на стороне Mini App, но в Supabase-запросах нет связанной auth-сессии Supabase (`auth.uid()` пустой).  
Итог: update по `products` проходил в `0 rows`, что в репозитории трактовалось как “товар не найден или нет прав”.

Что сделано:
- Добавлена миграция `202603120006_runtime_admin_write_access.sql` с runtime write-политиками для таблиц admin flow (в т.ч. `products`, `giveaway_sessions`, `giveaway_items`, `giveaway_results`, `store_settings`, `seller_settings`, `homepage_sections`).
- Product mutation path оставлен backend-first (не локальный fake-success).

## Почему giveaway session updates возвращали “не найдена или нет прав”

Причина идентична product flow:
- старая политика `Admin manage giveaway_sessions` зависела от `is_admin()` => `auth.uid()` отсутствовал в runtime => `0 rows`.

Что сделано:
- В той же миграции открыты runtime write-policy для `giveaway_sessions` и связанных таблиц.
- Переходы `active/draft/completed` сохраняются через backend.

## Что сделано по spin duration

1. Убран искусственный лимит 12 секунд:
- UI: диапазон изменен с `2..12` на `2..180`.
- Repository clamp изменен с `2000..12000ms` на `2000..180000ms` (и в local, и в supabase repository).

2. Сохранение:
- Длительность сохраняется в `giveaway_sessions.spin_duration_ms`.
- При запуске спина и при отдельном сохранении длительности значение уходит в backend.

3. Миграции:
- Если еще не применена: `202603120005_giveaway_session_spin_duration.sql` (поле `spin_duration_ms`).
- Для live admin mutations нужна также `202603120006_runtime_admin_write_access.sql`.

## Что исправлено по persistence after refresh

Чтобы исключить ложное локальное состояние:
- После успешных admin mutation добавлена повторная синхронизация состояния из backend (`repository.bootstrap`) в `AppContext`:
  - product toggles,
  - giveaway session create/update/status,
  - attach/remove giveaway item,
  - run spin,
  - update store/seller settings.

Итог: после успешной мутации состояние подтягивается из реальной БД и переживает hard refresh.

## Что проверить руками после деплоя

1. Применить миграции:
- `202603120005_giveaway_session_spin_duration.sql`
- `202603120006_runtime_admin_write_access.sql`

2. Product toggles:
- скрыть/показать,
- под заказ/в наличии,
- рекомендовать/снять рекомендацию,
- затем hard refresh и сверка с backend.

3. Giveaway controls:
- открыть сессию,
- вернуть в черновик,
- завершить,
- изменить длительность (например 25/45/90 сек), сохранить, hard refresh.

4. Лоты:
- удалить лот, проверить что после refresh он остается удаленным.

## Ограничения и минимально необходимый доступ

Ограничение в текущем окружении: нет прямого доступа к live Supabase для применения миграций и проверки SQL-policy в проде.  
Минимально необходимый доступ за пределами текущих ограничений:
- выполнить `db push` / применить SQL миграции в live проекте Supabase,
- затем провести live smoke-проверку в Telegram Mini App.

Без применения этих миграций на live окружении фиксы write-пути и persistence не смогут проявиться полностью.

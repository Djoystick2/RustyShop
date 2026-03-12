# Step 12: Mini App Live Admin Cleanup

Дата: 2026-03-12

## Что реально исправлено (live bugfix cleanup)

1. Устранен остаточный UUID-баг `invalid input syntax for type uuid: "guest_local"`:
- В `supabase-repository` добавлены жесткие UUID-guards (`assertUuid`) перед всеми мутациями по UUID-полям.
- Гостевые/локальные идентификаторы больше не отправляются в uuid-поля Supabase.
- Для favorites при невалидном profile id теперь используется безопасный early-fail (`FAVORITES_AUTH_REQUIRED`) до запроса в БД.
- Для giveaway result `profile_id` сохраняется только если это валидный UUID, иначе `null`.

2. Устранен остаточный `Cannot coerce the result to a single JSON object`:
- Полностью убран single-object паттерн из боевых запросов (`.single()`/`.maybeSingle()`).
- Мутации переведены на `.select("*")` + явный `unwrapMutationRow(...)` с проверкой количества строк.
- Для read-path, где допускается 0 строк, используется `unwrapOptionalRow(...)` и мягкая обработка.

3. Product admin actions доведены до рабочего состояния:
- `Скрыть товар`, `Под заказ/В наличии`, `Снять рекомендацию/Рекомендовать` проходят через backend update с UUID-guard.
- Ложный локальный успех устранен: состояние меняется только после подтвержденного backend-ответа.
- Сохранение состояния после hard refresh обеспечивается чтением из backend при bootstrap.

4. CTA `Приобрести` и contact fallback:
- Покупка у себя (admin/seller view) не показывается на карточках и странице товара.
- При отсутствии seller link/username больше не используется бессмысленный `t.me/share` fallback.
- Введен осмысленный fallback: показывается переход к контактам (`/about`/профиль), а не fake-покупка.

5. Product page cleanup под admin role:
- Разделены user-сценарий и admin-сценарий.
- Добавлен компактный отдельный `Admin actions` блок.
- Управление розыгрышем с product page не возвращалось.

6. Giveaway page доведена до рабочего состояния:
- Длительность спина теперь персистентная (`giveaway_sessions.spin_duration_ms`), редактируется и сохраняется.
- UX статусов упрощен:
  - `Открыть сессию`
  - `Вернуть в черновик`
  - `Завершить`
- Исправлены действия:
  - завершение сессии,
  - удаление лотов,
  - активация/деактивация сессии.
- Убраны ложные success-уведомления: UI показывает успех только при `true` от context action.

7. Admin profile restructuring (live-driven wave 2):
- Профиль администратора разделен на блоки:
  - статус/auth,
  - быстрые действия,
  - товары/каталог,
  - розыгрыш,
  - бренд-настройки,
  - compact debug/service.
- Исключено смешивание admin и user-потока в один длинный экран.
- Кнопка `Написать продавцу` отсутствует в admin-представлении.

8. Admin settings финально упрощены:
- В brand-настройках оставлены только:
  - название бренда,
  - слоган,
  - hero badge.
- Лишние seller/service формы из admin panel удалены.

## Где именно оставался `guest_local`

- Источник: `src/data/repositories/supabase-repository.ts` (guest fallback profile).
- Рискованные места до фикса: mutations, где могли использоваться id из runtime state.
- После фикса:
  - `guest_local` остается только как локальный guest id в UI-модели,
  - в backend uuid-поля он не уходит.

## Где именно оставался `Cannot coerce...`

- Источник: single-object мутации в `src/data/repositories/supabase-repository.ts` (ранее через `.maybeSingle()`).
- После фикса:
  - хрупкие single/maybeSingle-path удалены из runtime mutation слоя,
  - мутации используют массивный ответ + явный unwrap.

## Что изменено в product admin flow

- Ужесточена валидация id перед backend update.
- Тогглы товаров работают только при успешном backend-ответе.
- Product page для admin упрощена и не смешивается с user purchase CTA.

## Что изменено в giveaway flow

- Добавлена миграция: `supabase/migrations/202603120005_giveaway_session_spin_duration.sql`.
- Добавлено поле `spin_duration_ms` в:
  - `src/types/db.ts`,
  - `src/types/entities.ts`,
  - `src/data/repositories/mappers.ts`,
  - `local/supabase repositories`.
- `GiveawayPage` обновлена:
  - сохранение длительности,
  - понятные кнопки статуса,
  - корректные confirm-only success notices.

## Как усилен admin profile

- Профиль перестроен в admin-hub с явными секциями и навигацией.
- Убраны лишние user-блоки из admin-режима.
- Debug/service-информация вынесена в компактный блок.

## Что проверить руками после деплоя

1. Verify/admin unlock:
- Открыть Mini App в реальном Telegram.
- Проверить, что verify по-прежнему успешен и admin role определяется корректно.

2. UUID safety:
- В guest/неполной auth-ситуации попробовать favorites/giveaway actions.
- Убедиться, что нет `invalid input syntax for type uuid`.

3. Product admin toggles:
- На карточке/странице товара по очереди:
  - скрыть/показать,
  - под заказ/в наличии,
  - рекомендовать/снять рекомендацию.
- Сделать hard refresh и проверить сохранение.

4. CTA:
- Под user ролью проверить `Приобрести` на карточке и странице товара.
- Под admin ролью убедиться, что buy CTA отсутствует.
- При пустом seller username/link убедиться, что показывается fallback к контактам, а не нерабочая покупка.

5. Giveaway:
- Изменить длительность, сохранить, сделать hard refresh и проверить сохранение.
- Открыть сессию, запустить спин, завершить сессию.
- Добавить и удалить лот, затем hard refresh.

6. Admin profile:
- Проверить новую структуру блоков и отсутствие user/contact clutter в admin view.

## Ограничения, которые остались

1. Требуется применить новую миграцию в Supabase:
- `202603120005_giveaway_session_spin_duration.sql`
- Без нее персистентная длительность спина в runtime не будет работать.

2. Если seller-контакт не настроен (нет username/link), purchase CTA не отправляет в Telegram напрямую:
- это intentional fallback во избежание ложного UX.

3. При неконсистентных данных singleton-таблиц (`store_settings`/`seller_settings`) выбирается первая запись и пишется предупреждение в console.

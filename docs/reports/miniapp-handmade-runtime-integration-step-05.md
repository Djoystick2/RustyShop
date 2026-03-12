# Отчет: miniapp-handmade-runtime-integration-step-05

Дата: 2026-03-12

## Что доведено по env/runtime

- Финализирован `.env.example` с явным разделением:
  - обязательные env для Supabase mode,
  - опциональные env,
  - матрица режимов `supabase` / `local_fallback` / `unavailable`.
- Добавлен централизованный runtime-config:
  - [runtime.ts](../../src/config/runtime.ts)
  - единая логика чтения env и выбора режима repository.
- Убрано падение приложения при неполном env:
  - добавлен `unavailable` repository режим с предсказуемой ошибкой в UI вместо crash.

## Что сделано по Supabase readiness

- Репозиторий теперь выбирается предсказуемо через runtime mode:
  - [index.ts](../../src/data/repositories/index.ts)
  - [unavailable-repository.ts](../../src/data/repositories/unavailable-repository.ts)
  - [contracts.ts](../../src/data/repositories/contracts.ts)
- Инициализация Supabase клиента и storage bucket завязаны на runtime-config:
  - [client.ts](../../src/data/supabase/client.ts)
- Добавлен интеграционный guard для избранного в guest-профиле Supabase mode:
  - [supabase-repository.ts](../../src/data/repositories/supabase-repository.ts)
  - вместо неясной FK-ошибки возвращается понятное сообщение.

## Что сделано по Telegram verify integration point

- Verify endpoint читается централизованно из runtime-config:
  - [telegram.ts](../../src/lib/telegram.ts)
- Доведены состояния verify в контексте:
  - `verifying`, `verified`, `failed`, `no_endpoint`, `unavailable`
  - [AppContext.tsx](../../src/context/AppContext.tsx)
- Улучшены runtime-баннеры для verify и storage:
  - [AppShell.tsx](../../src/components/layout/AppShell.tsx)
- В профиле добавлена более понятная расшифровка verify статуса:
  - [ProfilePage.tsx](../../src/pages/ProfilePage.tsx)

## Что сделано по RBAC/admin hardening

- Усилен admin guard в `AppContext`:
  - admin-mutations теперь дополнительно защищены `guardAdminAction` на уровне client action flow.
- Для Supabase mode admin-доступ зависит от `authVerificationStatus === verified`.
- Явно разделены сценарии:
  - `local` (dev/demo fallback),
  - `supabase + verified`,
  - `unavailable` (runtime config incomplete).

## Что сделано по storage/media readiness

- Добавлены user-friendly storage ошибки при upload:
  - bucket not found / RLS policy issues
  - [supabase-repository.ts](../../src/data/repositories/supabase-repository.ts)
- В AppShell добавлено предупреждение при кастомном bucket:
  - необходимость ручной синхронизации storage policies.
- Обновлен seed для более полезного smoke-test медиапотока:
  - [seed.sql](../../supabase/seed.sql)

## Что сделано по миграциям/deployment readiness

- Добавлена корректирующая миграция:
  - [202603120004_runtime_readiness_fixes.sql](../../supabase/migrations/202603120004_runtime_readiness_fixes.sql)
- В миграции:
  - корректировка FK `giveaway_results.profile_id` на `on delete set null`,
  - индекс на `product_images(product_id, position)`,
  - стабилизация bucket `product-images` через upsert.
- Добавлен setup-док по применению миграций и запуску:
  - [runtime-supabase-setup.md](../../docs/setup/runtime-supabase-setup.md)

## Какой smoke-test checklist добавлен

- Добавлен:
  - [miniapp-handmade-smoke-test-checklist-step-05.md](./miniapp-handmade-smoke-test-checklist-step-05.md)
- Покрывает:
  - env setup,
  - Supabase/local fallback режимы,
  - storefront/catalog/product/purchase/favorites/profile/about,
  - admin/category/product/homepage sections/giveaway,
  - media upload/storage,
  - Telegram verify endpoint behavior.

## Проверки

- `npm run typecheck` — успешно.
- `npm run build` — успешно.
- `npm run lint` — не запускался, т.к. в `package.json` нет скрипта `lint`.

## Ограничения, которые остались

- В текущем окружении нет подключенного live Supabase проекта:
  - нельзя подтвердить runtime behavior реальных RLS/storage policies end-to-end.
- Нет рабочего production verify endpoint:
  - невозможно проверить server-side Telegram initData verification в реальном канале.

## Что нужно сделать руками вне кода

- Подставить реальные значения в `.env.local`:
  - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_TELEGRAM_AUTH_VERIFY_URL`.
- Применить миграции в реальный Supabase проект.
- Проверить bucket и storage policies под фактическое имя bucket.
- Прогнать чеклист:
  - [miniapp-handmade-smoke-test-checklist-step-05.md](./miniapp-handmade-smoke-test-checklist-step-05.md)

## Минимальный required exception/доступ

- Доступ к live Supabase проекту (env + SQL migrations + storage policies).
- Доступ к рабочему endpoint серверной проверки Telegram initData.

## Что готово для следующего шага

- Проект переведен в предсказуемые runtime-режимы без хаотичных падений.
- Конфиг/миграции/seed/setup и smoke-checklist подготовлены для ручной интеграционной проверки.
- Основа готова к ручному smoke-test и последующему пушу без крупных архитектурных переделок.


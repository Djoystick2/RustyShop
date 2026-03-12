# Runtime Setup: Supabase + Telegram Verify

Дата: 2026-03-12

## 1. Подготовьте env

Создайте `.env.local` на основе [.env.example](../../.env.example) и задайте:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_STORAGE_BUCKET` (обычно `product-images`)
- `VITE_ENABLE_LOCAL_FALLBACK`

Для verify:

- `VITE_TELEGRAM_AUTH_VERIFY_URL` (опционально)
- если переменная пустая, клиент автоматически использует same-origin fallback: `/api/telegram/verify`

Для serverless verify endpoint (Vercel):

- `TELEGRAM_BOT_TOKEN` (обязательно)
- `TELEGRAM_INIT_DATA_MAX_AGE_SEC` (опционально, по умолчанию `86400`)

## 2. Примените миграции

1. Инициализируйте/свяжите Supabase project.
2. Примените SQL миграции из `supabase/migrations` по порядку:
   - `202603120001_init_handmade_foundation.sql`
   - `202603120002_giveaway_results_spin_fields.sql`
   - `202603120003_brand_homepage_sections.sql`
   - `202603120004_runtime_readiness_fixes.sql`
3. Опционально примените `supabase/seed.sql` для smoke-test данных.

## 3. Проверьте storage

- Bucket должен совпадать с `VITE_SUPABASE_STORAGE_BUCKET`.
- Если bucket отличается от `product-images`, обновите storage policies под ваш bucket.
- Для загрузки изображений нужны права insert/update/delete на `storage.objects` для admin-пользователя.

## 4. Проверьте Telegram verify endpoint

В проекте реализован endpoint:

- `POST /api/telegram/verify`
- body: `{ "initData": "<raw Telegram initData>" }`
- response: `{ "ok": true, "verified": true, ... }` или `{ "ok": false, "error": "...", "message": "..." }`

Проверка реальная:

- валидация hash по `TELEGRAM_BOT_TOKEN`,
- проверка `auth_date` freshness через `TELEGRAM_INIT_DATA_MAX_AGE_SEC`,
- корректные HTTP-коды ошибок.

## 5. Локальный fallback

Если Supabase env не задан:

- при `VITE_ENABLE_LOCAL_FALLBACK=true` включается localStorage mode;
- при `VITE_ENABLE_LOCAL_FALLBACK=false` приложение показывает явную runtime-конфиг ошибку.


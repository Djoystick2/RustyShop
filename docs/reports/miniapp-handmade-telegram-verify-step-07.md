# Отчет: miniapp-handmade-telegram-verify-step-07

Дата: 2026-03-12

## Что реализовано по verify endpoint

- Добавлен реальный server-side verify endpoint для Telegram WebApp initData:
  - [verify.ts](../../api/telegram/verify.ts)
  - путь: `POST /api/telegram/verify`
- Реализована реальная проверка:
  - валидация `hash` по `TELEGRAM_BOT_TOKEN` через HMAC-SHA256,
  - проверка `auth_date` freshness,
  - корректные статусы и ответы ошибок.
- Поддержан `same-origin` fallback на клиенте:
  - если `VITE_TELEGRAM_AUTH_VERIFY_URL` пустой, используется `/api/telegram/verify`.

## Какие env нужны

Клиент:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_STORAGE_BUCKET`
- `VITE_TELEGRAM_AUTH_VERIFY_URL` (опционально, при пустом значении включается fallback)
- `VITE_ENABLE_LOCAL_FALLBACK`

Сервер (Vercel):
- `TELEGRAM_BOT_TOKEN` (обязательно)
- `TELEGRAM_INIT_DATA_MAX_AGE_SEC` (опционально, default `86400`)

Обновлены:
- [.env.example](../../.env.example)
- [runtime-supabase-setup.md](../../docs/setup/runtime-supabase-setup.md)

## Как теперь определяется admin

- В Supabase mode admin-доступ выдается только при `authVerificationStatus === verified`.
- Базовое право admin определяется через существующую модель:
  - `store_settings.admin_telegram_ids` (основной источник),
  - плюс существующая роль профиля.
- Без успешной verify admin-mutations остаются закрытыми.

Ключевые файлы:
- [runtime.ts](../../src/config/runtime.ts)
- [telegram.ts](../../src/lib/telegram.ts)
- [AppContext.tsx](../../src/context/AppContext.tsx)
- [admin-role.ts](../../src/security/admin-role.ts)

## Что именно разблокировано

После успешной verify владелец магазина (telegram id из `admin_telegram_ids`) получает runtime-доступ к:
- управлению товарами,
- управлению категориями,
- управлению homepage sections,
- управлению store/seller settings,
- управлению giveaway,
- upload изображений товаров через admin UI (при корректных storage policies).

## Что нужно проверить руками после деплоя

1. В Vercel задать `TELEGRAM_BOT_TOKEN`.
2. Задеплоить проект и открыть Mini App из Telegram.
3. Убедиться, что verify дает `verified` в профиле.
4. Проверить admin-сценарии:
   - создание/редактирование товара,
   - создание/редактирование категории,
   - редактирование homepage sections,
   - настройки магазина/продавца,
   - создание/управление giveaway.
5. Проверить media upload:
   - загрузка файлов,
   - preview на карточке/странице товара,
   - сохранение в `product_images`.

## Что сохраняется как ограничение

- В текущей сессии нет live Telegram initData из реального контейнера Telegram:
  - локально невозможно полностью эмулировать production verify flow.
- В текущей сессии нет доступа к live Vercel/Supabase runtime:
  - нельзя выполнить финальную e2e проверку CRUD/upload от лица реального admin-пользователя.

## Минимальный required exception/доступ

- Доступ к Vercel env для установки `TELEGRAM_BOT_TOKEN`.
- Доступ к deployed приложению внутри Telegram Mini App.
- Доступ к live Supabase проекту (storage policies/таблицы уже на месте).


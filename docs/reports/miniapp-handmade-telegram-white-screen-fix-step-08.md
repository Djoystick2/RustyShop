# Mini App Handmade - Step 08 Report (Telegram White Screen Fix)

## Что было источником unauthorized POST

- Источник был в `src/data/repositories/supabase-repository.ts` внутри `bootstrap()`.
- На старте выполнялся `ensureSingletonRows(client)`, который делал:
  - `upsert` в `store_settings` (`id = main`)
  - `upsert` в `seller_settings` (`id = main`)
- В Telegram runtime (до verified admin) эти POST-запросы упирались в RLS и давали `401 Unauthorized`, после чего bootstrap срывался.

## Что изменено

- Удалены startup-mutation для singleton settings из bootstrap:
  - больше нет автозаписи в `store_settings`/`seller_settings` на старте.
- Bootstrap переведен на безопасный read-only flow:
  - чтение `store_settings` и `seller_settings` через `maybeSingle()`;
  - при `401/403` или отсутствии singleton-строки применяется безопасный fallback state.
- Усилен bootstrap error handling:
  - auth/RLS ошибки (`401/403`, permission/JWT/RLS) для bootstrap-чтения теперь не валят рендер;
  - storefront поднимается в guest-safe режиме на fallback-данных.
- Убраны скрытые startup writes в профиле:
  - удалено авто-создание `profiles` в `resolveProfile()` во время bootstrap;
  - профиль на старте только читается, без `insert`.

## Какие запросы перестали выполняться в guest bootstrap

- Больше не выполняются:
  - `POST /rest/v1/store_settings?select=id` (upsert singleton)
  - `POST /rest/v1/seller_settings?select=id` (upsert singleton)
- Bootstrap теперь стартует с `SELECT` и fallback при недоступности настроек.

## Что проверить после деплоя внутри Telegram

1. Открыть Mini App внутри Telegram и убедиться, что белого экрана больше нет.
2. Проверить в Network, что на старте нет `POST/upsert` к `store_settings` и `seller_settings`.
3. Проверить, что storefront доступен гостю до verify и данные отображаются (или fallback-состояние без падения).
4. Пройти Telegram verify и убедиться, что admin-действия после verify по-прежнему работают.
5. Проверить, что admin mutations остаются закрытыми до успешной verify.

## Проверки в репозитории

- `npm run typecheck` - успешно.
- `npm run build` - успешно.

## Ограничения, которые остаются

- Полная live-валидация Telegram runtime возможна только после деплоя и проверки внутри реального Telegram WebApp-контекста.
- Если в Supabase реально отсутствуют singleton-строки `store_settings`/`seller_settings`, storefront теперь работает на fallback до явного admin-update.


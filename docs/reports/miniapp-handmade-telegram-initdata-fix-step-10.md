# Mini App Handmade - Step 10 Report (Telegram initData Fix)

## Причина недоступности initData

- Инициализация Telegram bridge была хрупкой:
  - `initData` читался только из `window.Telegram.WebApp.initData` в ранний момент.
  - если bridge еще не успел подняться, приложение фиксировало `unavailable`.
- Дополнительно не было гарантированного подключения `telegram-web-app.js` в `index.html`.
- Не было fallback-чтения `tgWebAppData` из URL/hash Telegram.

## Что изменено

1. Подключен Telegram WebApp SDK:
   - `index.html`: добавлен `<script src="https://telegram.org/js/telegram-web-app.js"></script>`.

2. Усилен слой Telegram integration в `src/lib/telegram.ts`:
   - добавлен controlled wait bridge (`waitForTelegramBridge`) с таймаутом;
   - добавлена загрузка SDK при отсутствии bridge (`ensureTelegramSdkScriptLoaded`);
   - добавлен fallback чтения initData из URL/hash (`tgWebAppData`);
   - добавлен парсинг пользователя из initData (`user`), даже если `initDataUnsafe.user` еще не доступен;
   - добавлен `resolveTelegramRuntimeContext()` для устойчивого определения bridge/initData/user/source.

3. Обновлен `AppContext` bootstrap/verify timing:
   - bridge/initData теперь получаются асинхронно через `resolveTelegramRuntimeContext()`;
   - verify flow запускается после завершения bridge-resolution, а не слишком рано;
   - добавлен флаг отправки verify request (`verifyRequestSent`) для диагностики;
   - сохранен guest-safe flow: storefront не блокируется.

4. Добавлена аккуратная диагностика в профиле:
   - `src/pages/ProfilePage.tsx` показывает:
     - найден ли Telegram bridge;
     - источник bridge (`window/script/none`);
     - есть ли initData и источник (`webapp/url/none`);
     - был ли отправлен verify request.

## Как теперь определяется Telegram bridge

- Сначала проверяется `window.Telegram.WebApp`.
- Если bridge нет:
  - пытаемся подключить SDK;
  - ожидаем bridge ограниченное время (без бесконечных таймеров).
- `initData` берется:
  - сначала из `WebApp.initData`;
  - если пусто, из `tgWebAppData` в URL/hash.

## Как теперь запускается verify

- В `supabase` режиме verify запускается только после завершения bridge-resolution.
- Если `initData` найден, отправляется verify запрос (включая same-origin fallback `/api/telegram/verify`).
- Статус переходит в `verified/failed/no_endpoint/unavailable` осмысленно.
- Guest storefront продолжает работать независимо от verify результата.

## Что проверить после деплоя

1. В Telegram Mini App в профиле:
   - `Telegram bridge: найден`;
   - `initData: есть (...)`;
   - `verify request: отправлен`.
2. В Network: есть запрос к verify endpoint (`/api/telegram/verify` или env endpoint).
3. При корректном `admin_telegram_ids` в `store_settings` после успешного verify открывается admin flow.
4. Для non-admin пользователя admin actions остаются закрыты.
5. В обычном браузере storefront не ломается.

## Проверки в репозитории

- `npm run typecheck` - успешно.
- `npm run build` - успешно.

## Ограничения

- Полную live-проверку verify/admin unlock можно подтвердить только в реальном Telegram WebView после деплоя.
- Если Telegram клиент не передает `initData` для конкретного запуска, admin unlock невозможен до корректного запуска в Telegram контексте.


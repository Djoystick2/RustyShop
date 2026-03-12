# Mini App Handmade - Step 09 Report (Telegram Empty Root Fix)

## Где найден empty render path

- Проблема найдена в верхнем роутинге: `src/App.tsx`.
- Использовался `HashRouter` с layout-route без `path`, а дочерние роуты были только явные (`/catalog`, `/profile`, ...), без `*` fallback.
- В Telegram Mini App хэш может приходить в служебном формате (`#tgWebApp...`), который не матчился ни одним route.
- Итог: `<Routes />` рендерил `null`, `#root` оставался пустым (`children.length === 0`) при том, что ассеты и bootstrap-запросы к Supabase уже выполнялись.

## Что изменено

1. Исправлен верхний роутинг в `src/App.tsx`:
   - layout-route переведен на `path="/"`;
   - пути детей сделаны относительными;
   - добавлен `Route path="*"` с fallback на `FeedPage`.

2. Усилен безопасный старт Telegram bridge в `src/lib/telegram.ts`:
   - `webApp.ready()` и `webApp.expand()` теперь вызываются в `try/catch`;
   - исключения Telegram bridge не ломают initial render.

3. Добавлен верхнеуровневый `ErrorBoundary`:
   - файл `src/components/common/AppErrorBoundary.tsx`;
   - подключен в `src/main.tsx` вокруг `AppProvider/App`;
   - при runtime-crash показывается контролируемый fallback UI вместо пустого root.

## Почему root оставался пустым

- Из-за unmatched маршрута в `HashRouter` в Telegram-хэше дерево маршрутов возвращало `null`.
- Дополнительно, без верхнего `ErrorBoundary` любой непойманный render-error тоже приводил к полному размонтированию дерева.
- Поэтому визуально получался белый экран при существующем `#root`.

## Как теперь ведет себя bootstrap в Telegram

- Роутер всегда отдает UI (минимум fallback на ленту через `*` route).
- Даже при нестандартном Telegram hash приложение не уходит в пустой root.
- Telegram verify/bootstrap не блокируют отрисовку storefront.
- При runtime-ошибке отображается fallback-экран ErrorBoundary, а не белый экран.

## Что проверить после деплоя

1. Открыть Mini App внутри Telegram и убедиться, что `#root` больше не пустой.
2. Проверить сценарий с Telegram hash-параметрами: должен рендериться UI (лента/fallback), не white screen.
3. Проверить, что storefront в обычном браузере работает как раньше.
4. Проверить, что verify flow не сломан и admin gating остался корректным.
5. Проверить, что при искусственной runtime-ошибке показывается fallback ErrorBoundary.

## Проверки в репозитории

- `npm run typecheck` - успешно.
- `npm run build` - успешно.

## Ограничения

- Полная live-валидация Telegram hash/bridge поведения требует проверки в реальном Telegram WebView после деплоя.
- Без доступа к runtime-логам конкретного устройства невозможно на 100% подтвердить все Telegram-специфичные edge-case сценарии до деплоя.


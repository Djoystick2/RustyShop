# Theme Hydration And Startup Loading

Date: 2026-03-13

## Причина позднего применения темы

Проблема была в том, что theme state жила внутри `ProfilePage`:

- сохранённая тема читалась только при монтировании профиля
- `data-theme` на `document.documentElement` тоже выставлялся только из `ProfilePage`
- до открытия профиля приложение стартовало без раннего theme override и попадало в fallback-палитру
- из-за этого при сохранённой `light` теме приложение могло сначала открыться в тёмном состоянии, а затем "догонять" правильную тему только после позднего профиля/hydration flow

## Что изменено

1. Тема вынесена в общий app-level слой:
   - добавлен `src/lib/theme.ts`
   - в `AppContext` появился общий `themeMode` и `setThemeMode`
   - сохранение и применение темы теперь происходят в `AppProvider`, а не в `ProfilePage`

2. Добавлено раннее применение темы до основного рендера:
   - в `index.html` добавлен ранний boot script, который читает `rustyshop-theme-mode` из `localStorage` и сразу ставит `data-theme`
   - в `src/main.tsx` тема дополнительно применяется до `ReactDOM.createRoot(...)`

3. `ProfilePage` переведён на общий theme state:
   - сама страница больше не управляет `localStorage` и не является точкой theme hydration
   - она только показывает текущий режим и вызывает `setThemeMode(...)`

4. Технический loading state заменён на брендированный splash:
   - добавлен `src/components/common/StartupSplash.tsx`
   - `DataStateBoundary` больше не показывает сырой текст "Загружаем данные..."
   - вместо этого показывается брендированный boot splash с мягкой анимацией и skeleton-lines
   - в `index.html` добавлен matching pre-React fallback splash, чтобы старт выглядел цельно ещё до монтирования React

5. Startup loading очищен от служебного шума:
   - в `AppShell` скрыты верхние технические баннеры и нижний navigation bar во время bootstrap-фазы

## Как теперь работает тема

- `light`: ставится сразу с первого кадра через ранний script в `index.html`
- `dark`: аналогично ставится сразу с первого кадра
- `system`: `data-theme` не форсируется, и приложение использует системную `prefers-color-scheme` логику из CSS без ожидания профиля

## Как теперь работает startup loading

- до запуска React пользователь видит лёгкий брендированный splash
- во время `isBootstrapping` React показывает тот же product-style splash вместо технической карточки
- splash использует лёгкие pulse/shimmer анимации без тяжёлых эффектов и без привязки к данным профиля

## Изменённые файлы

- `index.html`
- `src/main.tsx`
- `src/lib/theme.ts`
- `src/context/AppContext.tsx`
- `src/pages/ProfilePage.tsx`
- `src/components/common/DataStateBoundary.tsx`
- `src/components/common/StartupSplash.tsx`
- `src/components/layout/AppShell.tsx`

## Проверки

- `npm run typecheck`
- `npm run build`

## Ограничения

- `system` режим по-прежнему опирается на `prefers-color-scheme` браузера/вебвью. Отдельной синхронизации с Telegram `WebApp.colorScheme` в этом изменении не добавлялось, чтобы не вносить поздний bridge-dependent theme switch обратно в startup path.

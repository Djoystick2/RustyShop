# Smoke-Test Checklist: miniapp-handmade-step-05

Дата: 2026-03-12

## A. Запуск и режимы

- [ ] `npm install`
- [ ] `npm run typecheck`
- [ ] `npm run build`
- [ ] `npm run dev`
- [ ] Приложение открывается без runtime crash

## B. Env setup

- [ ] `.env.local` заполнен на основе `.env.example`
- [ ] Для Supabase mode заданы `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY`
- [ ] Проверен `VITE_SUPABASE_STORAGE_BUCKET`
- [ ] Проверен `VITE_TELEGRAM_AUTH_VERIFY_URL` (если используется)
- [ ] Проверен `VITE_ENABLE_LOCAL_FALLBACK`

## C. Supabase mode

- [ ] Data source в профиле показывает `supabase`
- [ ] Лента и каталог читают данные из backend
- [ ] CRUD категорий/товаров сохраняется после перезагрузки
- [ ] Избранное сохраняется для авторизованного профиля

## D. Fallback mode

- [ ] При отсутствии Supabase env и `VITE_ENABLE_LOCAL_FALLBACK=true` включается `local`
- [ ] Товары/категории/настройки сохраняются в локальном режиме
- [ ] DEV-переключение роли работает только в локальном fallback

## E. Витрина / каталог / товар

- [ ] Лента отображает секции главной
- [ ] Поиск и фильтры работают
- [ ] Каталог открывает страницы категорий
- [ ] Карточка товара открывается корректно
- [ ] Длинные названия/описания не ломают layout

## F. «Приобрести»

- [ ] Кнопка формирует ссылку на продавца из `seller_settings`
- [ ] Подставляется шаблон сообщения с `{product}`
- [ ] При отсутствии username/link используется share fallback

## G. Профиль / О мастере / избранное

- [ ] Профиль отображает состояние auth verify
- [ ] Страница «О мастере» открывается и читает backend контент
- [ ] Избранное корректно отображается в профиле

## H. Админка и RBAC

- [ ] Не-admin не видит admin-panel
- [ ] В Supabase mode admin-действия доступны только после verify=verified
- [ ] При verify fail/no-endpoint admin-действия блокируются с понятным сообщением
- [ ] Создание/редактирование категорий работает
- [ ] Создание/редактирование товаров работает
- [ ] Управление `homepage_sections` (create/edit/reorder/toggle/delete) работает

## I. Розыгрыш

- [ ] Создание giveaway session
- [ ] Переключение статуса session (draft/active/completed)
- [ ] Добавление/удаление лотов
- [ ] Spin доступен только admin
- [ ] Результаты сохраняются в `giveaway_results`
- [ ] Выпавший лот исключается из следующего круга

## J. Media / storage

- [ ] Upload изображений работает в Supabase mode
- [ ] Ошибки bucket/policy показываются понятным текстом
- [ ] Превью изображений корректно отображается на карточке и странице товара
- [ ] Ручная правка порядка/удаления URL изображений через форму товара работает

## K. Verify endpoint behavior

- [ ] `VITE_TELEGRAM_AUTH_VERIFY_URL` не задан: показывает статус `no_endpoint`
- [ ] endpoint недоступен: показывает `failed` или `unavailable` с сообщением
- [ ] endpoint возвращает `ok=true`: статус `verified`
- [ ] endpoint возвращает `ok=false`: admin-действия блокируются


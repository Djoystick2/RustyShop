# Admin Vitrina / Catalog / Seller Settings

Дата: 2026-03-13

## Что изменено

- Админская вкладка `Работа` вынесена в отдельный компонент `src/components/admin/AdminWorkPanel.tsx`, чтобы разделить storefront-настройки и product CRUD.
- `src/components/admin/AdminPanel.tsx` теперь собирает админку из трёх рабочих поверхностей:
  - `Работа` для витрины, каталога и seller settings,
  - `Товары` для product management,
  - существующий giveaway-блок без ломки текущего flow.
- `src/lib/acquire-link.ts` расширен шаблонным сообщением покупки с поддержкой `{product}`, `{price}` и `{link}`.
- Товарные storefront CTA переведены на новый purchase-template слой в:
  - `src/components/products/ProductCard.tsx`
  - `src/components/products/ProductMiniCard.tsx`
  - `src/components/products/ProductQuickViewModal.tsx`
  - `src/pages/ProductPage.tsx`
- В админском product list CTA `Приобрести` тоже использует тот же шаблон и остаётся видимым для администратора.

## Какие сущности и слои теперь управляют админкой

### Витрина / главная

- `storeSettings`
  - `storeName`
  - `heroBadge`
  - `mascotEmoji`
  - `brandSlogan`
  - `welcomeText`
  - `storeDescription`
  - `infoBlock`
  - `promoTitle`
  - `promoText`
- `homepageSections`
  - тип секции
  - порядок
  - включение / выключение
  - заголовок
  - подзаголовок
  - контент
  - linked category
  - linked product ids для ручной подборки там, где это уже поддерживает текущая архитектура

### Каталог

- `categories`
  - имя
  - описание
  - emoji
  - sort order
  - visible flag
- Плиточный storefront-каталог остаётся на текущем runtime-слое и теперь редактируется через существующий persistence path категорий, без ручной правки кода.

### Seller settings / покупка

- `sellerSettings`
  - `sellerName`
  - `telegramUsername`
  - `telegramLink`
  - `city`
  - `shortBio`
  - `aboutSeller`
  - `contactText`
  - `purchaseButtonLabel`
  - `purchaseMessageTemplate`
- `buildAcquireLink(...)`
  - теперь собирает итоговое сообщение покупки из seller settings и конкретного товара
  - поддерживает шаблоны `{product}`, `{price}`, `{link}`

## Что стало редактируемым из админки

- Витрина:
  - имя магазина
  - hero badge
  - brand emoji
  - слоган
  - welcome text
  - описание магазина
  - promo title
  - info block
  - promo text
- Главная:
  - создание новой секции
  - редактирование существующей секции
  - включение / выключение
  - изменение порядка
  - удаление секции
  - linked category для category-pick секций
  - ручная подборка товаров для `seasonal_pick`
- Каталог:
  - создание категории
  - редактирование категории
  - изменение порядка
  - включение / выключение плитки
  - название / описание / emoji
- Seller settings:
  - Telegram username
  - Telegram link
  - имя продавца
  - город
  - короткий bio
  - текст страницы продавца
  - контактный текст
  - текст кнопки `Приобрести`
  - шаблон сообщения покупки
  - переключатели добавления цены и ссылки в сообщение
- Товары:
  - product CRUD и быстрые product actions сохранены в отдельной вкладке `Товары`

## Что не закрыто полностью

- Отдельной сущности под подкатегории в текущей модели нет. В этом блоке сохранено управление существующей одноуровневой иерархией каталога.
- Отдельного backend-слоя для загрузки/редактирования hero image или banner image нет. В этой задаче добавлено только управление тем hero/storefront слоем, который уже поддерживался через настройки.
- Артикул не добавлялся: текущая модель `Product` не содержит SKU/article field, поэтому переключатель для `{article}` честно не включён в рабочий UI.
- Удаление категории не добавлялось: для этого в текущем persistence path нет готового безопасного delete-flow.

## Проверки

- `npm run typecheck`
- `npm run build`

## Ограничения

Решение не блокировалось stated restrictions. Оставшиеся незакрытые пункты упираются не в запрет на изменения, а в отсутствие соответствующих сущностей в текущей архитектуре. Минимальные исключения не требуются; для полного закрытия оставшихся пунктов нужна отдельная задача на расширение доменной модели каталога и storefront assets.

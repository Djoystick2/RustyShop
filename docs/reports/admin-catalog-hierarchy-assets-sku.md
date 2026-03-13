# Admin Catalog Hierarchy / Assets / SKU

## 1. Какие файлы изменены и зачем

- `src/types/entities.ts`
  - расширены доменные сущности:
  - `Category`: `slug`, `parentCategoryId`, `imageUrl`, `bannerUrl`
  - `Product`: `sku`
  - `StoreSettings`: `heroImageUrl`

- `src/data/state.ts`
  - расширены `CategoryInput` и `ProductInput` под новые поля.

- `src/data/seed.ts`
  - fallback-данные перестроены под иерархию категорий и SKU;
  - добавлены подкатегории и asset URL-поля.

- `src/types/db.ts`
  - обновлены typed Supabase table definitions под:
  - `categories.parent_category_id`
  - `categories.image_url`
  - `categories.banner_url`
  - `products.sku`
  - `store_settings.hero_image_url`

- `supabase/migrations/202603130001_catalog_hierarchy_assets_sku.sql`
  - новая миграция для иерархии категорий, category assets, storefront hero asset и SKU.

- `supabase/seed.sql`
  - сиды приведены к новой схеме;
  - добавлены подкатегории и SKU.

- `src/data/repositories/contracts.ts`
  - в repository contract добавлен `deleteCategory`.

- `src/data/repositories/mappers.ts`
  - маппинг новых category/store/product полей в домен и обратно.

- `src/data/repositories/local-repository.ts`
  - поддержка новых полей в local mode;
  - безопасное удаление категории с отказом при товарах/детях/homepage link.

- `src/data/repositories/supabase-repository.ts`
  - upsert/read новых полей;
  - безопасный `deleteCategory` с серверными проверками зависимостей.

- `src/data/repositories/unavailable-repository.ts`
  - доведён до нового repository interface.

- `src/context/AppContext.tsx`
  - state actions расширены:
  - сохранение category hierarchy/assets
  - удаление категорий
  - сохранение SKU у товаров
  - защита от самоссылок и лишней глубины вложенности

- `src/lib/acquire-link.ts`
  - placeholder `{article}` теперь реально подставляет SKU.

- `src/lib/catalog.ts`
  - новый helper-layer для root/child categories, descendant product picks и category labels.

- `src/components/storefront/HeroBanner.tsx`
  - hero banner теперь принимает runtime image URL, не только статичный `header.png`.

- `src/components/storefront/HomepageSectionRenderer.tsx`
  - storefront hero использует `storeSettings.heroImageUrl`, если он задан.

- `src/components/storefront/CategoryTile.tsx`
  - новый компактный tile-компонент для категорий и подкатегорий.

- `src/pages/CatalogPage.tsx`
  - каталог теперь показывает только корневые плитки;
  - counts агрегируются с учётом подкатегорий.

- `src/pages/CategoryPage.tsx`
  - при наличии дочерних категорий сначала показывается вложенный уровень;
  - товарный листинг остаётся на конечном уровне.

- `src/pages/FeedPage.tsx`
  - `category_pick` теперь тянет товары не только по плоской категории, но и по её потомкам.

- `src/pages/ProductPage.tsx`
  - SKU показывается на странице товара.

- `src/components/products/ProductQuickViewModal.tsx`
  - SKU добавлен в quick view.

- `src/components/admin/AdminPanel.tsx`
  - SKU добавлен в редактирование товара;
  - category selector умеет работать с подкатегориями.

- `src/components/admin/AdminWorkPanel.tsx`
  - storefront hero image URL;
  - article toggle в purchase template;
  - category / subcategory CRUD-поля;
  - порядок, видимость, parent assignment;
  - delete-flow для категорий и storefront sections.

- `src/styles.css`
  - стили под category images, category banner, subcategory rows и breadcrumbs.

## 2. Как теперь устроены данные и поведение

### Категории

- Категория осталась одной сущностью `Category`, но теперь поддерживает:
  - `parentCategoryId`
  - `slug`
  - `imageUrl`
  - `bannerUrl`
  - `sortOrder`
  - `isVisible`

- Корневые категории:
  - показываются на `/catalog` плитками.

- Если у категории есть дочерние категории:
  - экран `/catalog/:categoryId` сначала показывает плитки подкатегорий.

### Подкатегории

- Подкатегория реализована как `Category` с заполненным `parentCategoryId`.
- Из админки можно:
  - создать подкатегорию
  - выбрать parent category
  - менять порядок внутри sibling-группы
  - переключать видимость
  - редактировать `name`, `slug`, `description`, `emoji`, `imageUrl`, `bannerUrl`

- В storefront flow:
  - сначала root category tiles
  - затем subcategory tiles
  - затем product listing

### Безопасное удаление

- Удаление категории/подкатегории не делается “тихо”.
- Сейчас применяется безопасная стратегия `restrict with message`.
- Удаление блокируется, если:
  - у категории есть подкатегории
  - к категории привязаны товары
  - категория используется в `homepage_sections.linked_category_id`

- Для admin это означает:
  - сначала переназначить товары/section link или удалить дочерние узлы,
  - потом повторить delete.

### Banner assets

- Для storefront hero:
  - добавлено `storeSettings.heroImageUrl`
  - если URL задан, hero использует его;
  - если нет, остаётся прежний `header.png`

- Для category/subcategory:
  - `imageUrl` используется для плиток
  - `bannerUrl` используется в hero-блоке category page

- Реализация сделана через URL-поля, без отдельной media-platform.

### SKU / article

- В `Product` добавлено поле `sku`.
- SKU редактируется из admin product editor.
- В purchase template placeholder `{article}` теперь реально работает.
- В seller settings добавлен отдельный toggle для включения/выключения строки с артикулом.
- Кнопка `Приобрести` не меняла базовую модель работы.
- Для администратора кнопка `Приобрести` по-прежнему видна и рабочая.

## 3. Что теперь редактируется из админки

- Корневая категория:
  - название
  - slug
  - описание
  - emoji
  - tile image URL
  - banner image URL
  - порядок
  - видимость

- Подкатегория:
  - всё то же самое плюс parent assignment

- Storefront:
  - store name
  - hero badge
  - hero image URL
  - slogan
  - welcome text
  - store description
  - info block
  - promo title
  - promo text

- Seller / purchase:
  - seller contact fields
  - purchase button label
  - purchase message template
  - toggles для `{price}`, `{link}`, `{article}`

- Товар:
  - категория / подкатегория привязки
  - SKU / article
  - прочие существующие product fields

- Homepage sections:
  - порядок
  - видимость
  - linked category
  - linked products

## 4. Что ещё не закрыто внутри этого блока

- `slug` хранится и редактируется, но storefront routes по-прежнему работают по `id`, чтобы не ломать текущую навигацию.
- Category/storefront assets редактируются через URL-поля.
  - Отдельной загрузки файлов для category/banner assets в storage пока нет.
- Hero/banner layer доведён для storefront hero и category/subcategory pages.
  - Arbitrary image field для каждого homepage section отдельно не добавлялся, чтобы не раздувать CMS-слой.
- Ограничение глубины вложенности фактически оставлено на одном рабочем вложенном уровне.
  - Это сделано осознанно под текущий storefront flow `category tiles -> subcategory tiles -> products`.

## 5. Проверки

- `npm run typecheck`
  - успешно

- `npm run build`
  - успешно

## 6. Итог

- Админка теперь умеет управлять не только плоским каталогом, но и рабочей иерархией.
- Storefront flow с плитками не сломан.
- Безопасное удаление реализовано через явный запрет при зависимостях.
- Hero/banner assets доведены до практичного рабочего состояния без расползания проекта.
- SKU/article доведён от product model до purchase template.

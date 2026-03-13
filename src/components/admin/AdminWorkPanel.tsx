import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import { getCategoryLabel, getChildCategories, getRootCategories, sortCategories } from "../../lib/catalog";
import type { Category, HomepageSection, HomepageSectionType, Product } from "../../types/entities";

interface AdminWorkPanelProps {
  onSelectProducts?: () => void;
}

interface StorefrontFormState {
  storeName: string;
  heroBadge: string;
  heroImageUrl: string;
  mascotEmoji: string;
  brandSlogan: string;
  welcomeText: string;
  storeDescription: string;
  infoBlock: string;
  promoTitle: string;
  promoText: string;
}

interface SellerFormState {
  sellerName: string;
  telegramUsername: string;
  telegramLink: string;
  city: string;
  shortBio: string;
  aboutSeller: string;
  contactText: string;
  purchaseButtonLabel: string;
  purchaseMessageTemplate: string;
}

interface CategoryFormState {
  id: string;
  parentCategoryId: string;
  name: string;
  slug: string;
  description: string;
  emoji: string;
  imageUrl: string;
  bannerUrl: string;
  sortOrder: number;
  isVisible: boolean;
}

interface HomepageSectionFormState {
  id: string;
  type: HomepageSectionType;
  title: string;
  subtitle: string;
  content: string;
  linkedCategoryId: string;
  linkedProductIds: string[];
  isEnabled: boolean;
  sortOrder: number;
}

const sectionTypeLabel: Record<HomepageSectionType, string> = {
  hero: "Hero",
  new_arrivals: "РќРѕРІРёРЅРєРё",
  recommended: "Р РµРєРѕРјРµРЅРґСѓРµРј",
  giveaway: "Р РѕР·С‹РіСЂС‹С€",
  category_pick: "РџРѕРґР±РѕСЂРєР° РєР°С‚РµРіРѕСЂРёРё",
  about: "Рћ РїСЂРѕРґР°РІС†Рµ",
  promo: "РџСЂРѕРјРѕ",
  seasonal_pick: "Р СѓС‡РЅР°СЏ РїРѕРґР±РѕСЂРєР°"
};

function getNextSortOrder(items: Array<{ sortOrder: number }>) {
  return items.reduce((maxValue, item) => Math.max(maxValue, item.sortOrder), 0) + 10;
}

function appendTemplateLine(template: string, line: string, placeholder: string) {
  if (template.includes(placeholder)) {
    return template;
  }
  return template.trim() ? `${template.trim()}\n${line}` : line;
}

function removeTemplatePlaceholder(template: string, placeholder: string) {
  return template
    .split(/\r?\n/)
    .filter((line) => !line.includes(placeholder))
    .join("\n")
    .trim();
}

function buildPurchasePreview(template: string, product: Product | null) {
  const fallback = "Здравствуйте! Хочу приобрести товар: {product}";
  if (!product) {
    return template.trim() || fallback;
  }
  return (template.trim() || fallback)
    .replaceAll("{product}", product.title)
    .replaceAll("{price}", product.priceText)
    .replaceAll("{link}", `#/product/${product.id}`)
    .replaceAll("{article}", product.sku);
}

function createEmptyCategoryForm(categories: Category[]): CategoryFormState {
  return {
    id: "",
    parentCategoryId: "",
    name: "",
    slug: "",
    description: "",
    emoji: "рџ§¶",
    imageUrl: "",
    bannerUrl: "",
    sortOrder: getNextSortOrder(categories),
    isVisible: true
  };
}

function buildCategoryForm(category: Category): CategoryFormState {
  return {
    id: category.id,
    parentCategoryId: category.parentCategoryId ?? "",
    name: category.name,
    slug: category.slug,
    description: category.description,
    emoji: category.emoji,
    imageUrl: category.imageUrl,
    bannerUrl: category.bannerUrl,
    sortOrder: category.sortOrder,
    isVisible: category.isVisible
  };
}

function createEmptySectionForm(sections: HomepageSection[]): HomepageSectionFormState {
  return {
    id: "",
    type: "seasonal_pick",
    title: "",
    subtitle: "",
    content: "",
    linkedCategoryId: "",
    linkedProductIds: [],
    isEnabled: true,
    sortOrder: getNextSortOrder(sections)
  };
}

function buildSectionForm(section: HomepageSection): HomepageSectionFormState {
  return {
    id: section.id,
    type: section.type,
    title: section.title,
    subtitle: section.subtitle,
    content: section.content,
    linkedCategoryId: section.linkedCategoryId ?? "",
    linkedProductIds: section.linkedProductIds,
    isEnabled: section.isEnabled,
    sortOrder: section.sortOrder
  };
}

function getSiblingCategories(categories: Category[], category: Category) {
  return sortCategories(categories).filter(
    (item) => (item.parentCategoryId ?? "") === (category.parentCategoryId ?? "")
  );
}

export function AdminWorkPanel({ onSelectProducts }: AdminWorkPanelProps) {
  const {
    state,
    isSaving,
    saveCategory,
    deleteCategory,
    saveHomepageSection,
    deleteHomepageSection,
    moveHomepageSection,
    updateStoreSettings,
    updateSellerSettings
  } = useAppContext();

  const categories = useMemo(() => sortCategories(state.categories), [state.categories]);
  const roots = useMemo(() => getRootCategories(categories), [categories]);
  const homepageSections = useMemo(
    () => [...state.homepageSections].sort((a, b) => a.sortOrder - b.sortOrder),
    [state.homepageSections]
  );
  const productOptions = useMemo(
    () => [...state.products].sort((a, b) => a.title.localeCompare(b.title, "ru")),
    [state.products]
  );
  const sampleProduct = productOptions[0] ?? null;

  const [storefrontForm, setStorefrontForm] = useState<StorefrontFormState>({
    storeName: state.storeSettings.storeName,
    heroBadge: state.storeSettings.heroBadge,
    heroImageUrl: state.storeSettings.heroImageUrl,
    mascotEmoji: state.storeSettings.mascotEmoji,
    brandSlogan: state.storeSettings.brandSlogan,
    welcomeText: state.storeSettings.welcomeText,
    storeDescription: state.storeSettings.storeDescription,
    infoBlock: state.storeSettings.infoBlock,
    promoTitle: state.storeSettings.promoTitle,
    promoText: state.storeSettings.promoText
  });
  const [sellerForm, setSellerForm] = useState<SellerFormState>({
    sellerName: state.sellerSettings.sellerName,
    telegramUsername: state.sellerSettings.telegramUsername,
    telegramLink: state.sellerSettings.telegramLink,
    city: state.sellerSettings.city,
    shortBio: state.sellerSettings.shortBio,
    aboutSeller: state.sellerSettings.aboutSeller,
    contactText: state.sellerSettings.contactText,
    purchaseButtonLabel: state.sellerSettings.purchaseButtonLabel,
    purchaseMessageTemplate: state.sellerSettings.purchaseMessageTemplate
  });
  const [categoryForm, setCategoryForm] = useState(() => createEmptyCategoryForm(categories));
  const [sectionForm, setSectionForm] = useState(() => createEmptySectionForm(homepageSections));
  const [workNotice, setWorkNotice] = useState("");

  useEffect(() => {
    setStorefrontForm({
      storeName: state.storeSettings.storeName,
      heroBadge: state.storeSettings.heroBadge,
      heroImageUrl: state.storeSettings.heroImageUrl,
      mascotEmoji: state.storeSettings.mascotEmoji,
      brandSlogan: state.storeSettings.brandSlogan,
      welcomeText: state.storeSettings.welcomeText,
      storeDescription: state.storeSettings.storeDescription,
      infoBlock: state.storeSettings.infoBlock,
      promoTitle: state.storeSettings.promoTitle,
      promoText: state.storeSettings.promoText
    });
    setSellerForm({
      sellerName: state.sellerSettings.sellerName,
      telegramUsername: state.sellerSettings.telegramUsername,
      telegramLink: state.sellerSettings.telegramLink,
      city: state.sellerSettings.city,
      shortBio: state.sellerSettings.shortBio,
      aboutSeller: state.sellerSettings.aboutSeller,
      contactText: state.sellerSettings.contactText,
      purchaseButtonLabel: state.sellerSettings.purchaseButtonLabel,
      purchaseMessageTemplate: state.sellerSettings.purchaseMessageTemplate
    });
  }, [state.sellerSettings, state.storeSettings]);

  const includePrice = sellerForm.purchaseMessageTemplate.includes("{price}");
  const includeLink = sellerForm.purchaseMessageTemplate.includes("{link}");
  const includeArticle = sellerForm.purchaseMessageTemplate.includes("{article}");

  async function submitStorefront(event: FormEvent) {
    event.preventDefault();
    await updateStoreSettings({ ...storefrontForm });
    setWorkNotice("Витрина сохранена.");
  }

  async function submitSeller(event: FormEvent) {
    event.preventDefault();
    await updateSellerSettings({ ...sellerForm });
    setWorkNotice("Настройки продавца сохранены.");
  }

  async function submitCategory(event: FormEvent) {
    event.preventDefault();
    await saveCategory({
      id: categoryForm.id || undefined,
      parentCategoryId: categoryForm.parentCategoryId || null,
      name: categoryForm.name,
      slug: categoryForm.slug,
      description: categoryForm.description,
      emoji: categoryForm.emoji,
      imageUrl: categoryForm.imageUrl,
      bannerUrl: categoryForm.bannerUrl,
      sortOrder: categoryForm.sortOrder,
      isVisible: categoryForm.isVisible
    });
    setCategoryForm(createEmptyCategoryForm(categories));
    setWorkNotice("Каталог обновлён.");
  }

  async function submitSection(event: FormEvent) {
    event.preventDefault();
    await saveHomepageSection({
      id: sectionForm.id || undefined,
      type: sectionForm.type,
      title: sectionForm.title,
      subtitle: sectionForm.subtitle,
      content: sectionForm.content,
      linkedCategoryId: sectionForm.linkedCategoryId || null,
      linkedProductIds: sectionForm.linkedProductIds,
      isEnabled: sectionForm.isEnabled,
      sortOrder: sectionForm.sortOrder
    });
    setSectionForm(createEmptySectionForm(homepageSections));
    setWorkNotice("Секция storefront сохранена.");
  }

  async function saveCategoryPatch(category: Category, patch: Partial<Category>) {
    await saveCategory({
      id: category.id,
      parentCategoryId: patch.parentCategoryId ?? category.parentCategoryId,
      name: patch.name ?? category.name,
      slug: patch.slug ?? category.slug,
      description: patch.description ?? category.description,
      emoji: patch.emoji ?? category.emoji,
      imageUrl: patch.imageUrl ?? category.imageUrl,
      bannerUrl: patch.bannerUrl ?? category.bannerUrl,
      sortOrder: patch.sortOrder ?? category.sortOrder,
      isVisible: patch.isVisible ?? category.isVisible
    });
  }

  async function moveCategory(category: Category, direction: -1 | 1) {
    const siblings = getSiblingCategories(categories, category);
    const index = siblings.findIndex((item) => item.id === category.id);
    const target = siblings[index + direction];
    if (!target) {
      return;
    }
    await saveCategoryPatch(category, { sortOrder: target.sortOrder });
    await saveCategoryPatch(target, { sortOrder: category.sortOrder });
  }

  async function handleDeleteCategory(category: Category) {
    if (!window.confirm(`Удалить «${getCategoryLabel(categories, category.id)}»?`)) {
      return;
    }
    await deleteCategory(category.id);
  }

  async function handleDeleteSection(section: HomepageSection) {
    if (!window.confirm(`Удалить секцию «${section.title || sectionTypeLabel[section.type]}»?`)) {
      return;
    }
    await deleteHomepageSection(section.id);
  }

  function renderCategoryRow(category: Category, child = false) {
    const productCount = state.products.filter((product) => product.categoryId === category.id).length;
    const siblings = getSiblingCategories(categories, category);
    const index = siblings.findIndex((item) => item.id === category.id);

    return (
      <article key={category.id} className={`admin-item${child ? " admin-item_subcategory" : ""}`}>
        <div className="stack-sm">
          <strong>
            {category.emoji} {category.name}
          </strong>
          <small>
            {getCategoryLabel(categories, category.id)} · {productCount} товаров · {category.isVisible ? "видима" : "скрыта"}
          </small>
        </div>
        <div className="toolbar">
          <button type="button" className="btn btn_secondary btn_compact" onClick={() => setCategoryForm(buildCategoryForm(category))}>
            Править
          </button>
          <button type="button" className="btn btn_ghost btn_compact" disabled={index === 0 || isSaving("category")} onClick={() => void moveCategory(category, -1)}>
            ↑
          </button>
          <button type="button" className="btn btn_ghost btn_compact" disabled={index === siblings.length - 1 || isSaving("category")} onClick={() => void moveCategory(category, 1)}>
            ↓
          </button>
          <button type="button" className="btn btn_ghost btn_compact" onClick={() => void saveCategoryPatch(category, { isVisible: !category.isVisible })}>
            {category.isVisible ? "Скрыть" : "Показать"}
          </button>
          <button type="button" className="btn btn_ghost btn_compact" disabled={isSaving("category")} onClick={() => void handleDeleteCategory(category)}>
            Удалить
          </button>
        </div>
      </article>
    );
  }

  return (
    <>
      <section className="admin-panel__section stack">
        <div className="admin-panel__split">
          <article className="card stack-sm admin-panel__card">
            <h3>Витрина и hero</h3>
            <form className="admin-panel__form stack" onSubmit={(event) => void submitStorefront(event)}>
              <div className="admin-panel__grid admin-panel__grid_compact">
                <label className="field"><span>Название магазина</span><input value={storefrontForm.storeName} onChange={(event) => setStorefrontForm((prev) => ({ ...prev, storeName: event.target.value }))} /></label>
                <label className="field"><span>Hero badge</span><input value={storefrontForm.heroBadge} onChange={(event) => setStorefrontForm((prev) => ({ ...prev, heroBadge: event.target.value }))} /></label>
                <label className="field"><span>Hero image URL</span><input value={storefrontForm.heroImageUrl} onChange={(event) => setStorefrontForm((prev) => ({ ...prev, heroImageUrl: event.target.value }))} /></label>
                <label className="field"><span>Эмодзи бренда</span><input value={storefrontForm.mascotEmoji} onChange={(event) => setStorefrontForm((prev) => ({ ...prev, mascotEmoji: event.target.value }))} /></label>
              </div>
              <label className="field"><span>Слоган</span><input value={storefrontForm.brandSlogan} onChange={(event) => setStorefrontForm((prev) => ({ ...prev, brandSlogan: event.target.value }))} /></label>
              <label className="field"><span>Welcome text</span><textarea rows={2} value={storefrontForm.welcomeText} onChange={(event) => setStorefrontForm((prev) => ({ ...prev, welcomeText: event.target.value }))} /></label>
              <label className="field"><span>Описание магазина</span><textarea rows={2} value={storefrontForm.storeDescription} onChange={(event) => setStorefrontForm((prev) => ({ ...prev, storeDescription: event.target.value }))} /></label>
              <label className="field"><span>Info block</span><input value={storefrontForm.infoBlock} onChange={(event) => setStorefrontForm((prev) => ({ ...prev, infoBlock: event.target.value }))} /></label>
              <label className="field"><span>Promo title</span><input value={storefrontForm.promoTitle} onChange={(event) => setStorefrontForm((prev) => ({ ...prev, promoTitle: event.target.value }))} /></label>
              <label className="field"><span>Promo text</span><textarea rows={2} value={storefrontForm.promoText} onChange={(event) => setStorefrontForm((prev) => ({ ...prev, promoText: event.target.value }))} /></label>
              <div className="admin-panel__actions"><button className="btn btn_primary btn_compact" type="submit" disabled={isSaving("settings_store")}>{isSaving("settings_store") ? "Сохраняем..." : "Сохранить витрину"}</button><Link to="/" className="btn btn_ghost btn_compact">Проверить главную</Link></div>
            </form>
          </article>

          <article className="card stack-sm admin-panel__card">
            <h3>Продавец и покупка</h3>
            <form className="admin-panel__form stack" onSubmit={(event) => void submitSeller(event)}>
              <div className="admin-panel__grid admin-panel__grid_compact">
                <label className="field"><span>Имя</span><input value={sellerForm.sellerName} onChange={(event) => setSellerForm((prev) => ({ ...prev, sellerName: event.target.value }))} /></label>
                <label className="field"><span>Telegram username</span><input value={sellerForm.telegramUsername} onChange={(event) => setSellerForm((prev) => ({ ...prev, telegramUsername: event.target.value }))} /></label>
                <label className="field"><span>Telegram link</span><input value={sellerForm.telegramLink} onChange={(event) => setSellerForm((prev) => ({ ...prev, telegramLink: event.target.value }))} /></label>
                <label className="field"><span>Город</span><input value={sellerForm.city} onChange={(event) => setSellerForm((prev) => ({ ...prev, city: event.target.value }))} /></label>
              </div>
              <label className="field"><span>Короткое био</span><textarea rows={2} value={sellerForm.shortBio} onChange={(event) => setSellerForm((prev) => ({ ...prev, shortBio: event.target.value }))} /></label>
              <label className="field"><span>About seller</span><textarea rows={2} value={sellerForm.aboutSeller} onChange={(event) => setSellerForm((prev) => ({ ...prev, aboutSeller: event.target.value }))} /></label>
              <label className="field"><span>Contact text</span><input value={sellerForm.contactText} onChange={(event) => setSellerForm((prev) => ({ ...prev, contactText: event.target.value }))} /></label>
              <label className="field"><span>Label кнопки</span><input value={sellerForm.purchaseButtonLabel} onChange={(event) => setSellerForm((prev) => ({ ...prev, purchaseButtonLabel: event.target.value }))} /></label>
              <label className="field"><span>Шаблон сообщения</span><textarea rows={3} value={sellerForm.purchaseMessageTemplate} onChange={(event) => setSellerForm((prev) => ({ ...prev, purchaseMessageTemplate: event.target.value }))} /></label>
              <div className="admin-panel__checkbox-grid">
                <label className="field field_inline admin-panel__switch"><input type="checkbox" checked={includePrice} onChange={(event) => setSellerForm((prev) => ({ ...prev, purchaseMessageTemplate: event.target.checked ? appendTemplateLine(prev.purchaseMessageTemplate, "Цена: {price}", "{price}") : removeTemplatePlaceholder(prev.purchaseMessageTemplate, "{price}") }))} /><span>Цена</span></label>
                <label className="field field_inline admin-panel__switch"><input type="checkbox" checked={includeLink} onChange={(event) => setSellerForm((prev) => ({ ...prev, purchaseMessageTemplate: event.target.checked ? appendTemplateLine(prev.purchaseMessageTemplate, "Ссылка: {link}", "{link}") : removeTemplatePlaceholder(prev.purchaseMessageTemplate, "{link}") }))} /><span>Ссылка</span></label>
                <label className="field field_inline admin-panel__switch"><input type="checkbox" checked={includeArticle} onChange={(event) => setSellerForm((prev) => ({ ...prev, purchaseMessageTemplate: event.target.checked ? appendTemplateLine(prev.purchaseMessageTemplate, "Артикул: {article}", "{article}") : removeTemplatePlaceholder(prev.purchaseMessageTemplate, "{article}") }))} /><span>Артикул</span></label>
              </div>
              <small className="admin-panel__helper">Превью: {buildPurchasePreview(sellerForm.purchaseMessageTemplate, sampleProduct)}</small>
              <div className="admin-panel__actions"><button className="btn btn_primary btn_compact" type="submit" disabled={isSaving("settings_seller")}>{isSaving("settings_seller") ? "Сохраняем..." : "Сохранить продавца"}</button><button type="button" className="btn btn_secondary btn_compact" onClick={() => onSelectProducts?.()}>Открыть товары</button></div>
            </form>
          </article>
        </div>
      </section>

      <section className="admin-panel__section stack">
        <div className="admin-panel__split">
          <article className="card stack-sm admin-panel__card">
            <h3>Секции storefront</h3>
            <form className="admin-panel__form stack" onSubmit={(event) => void submitSection(event)}>
              <div className="admin-panel__grid admin-panel__grid_compact">
                <label className="field"><span>Тип</span><select value={sectionForm.type} onChange={(event) => setSectionForm((prev) => ({ ...prev, type: event.target.value as HomepageSectionType, linkedCategoryId: event.target.value === "category_pick" ? prev.linkedCategoryId : "", linkedProductIds: event.target.value === "seasonal_pick" ? prev.linkedProductIds : [] }))}>{Object.entries(sectionTypeLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                <label className="field"><span>Порядок</span><input type="number" value={sectionForm.sortOrder} onChange={(event) => setSectionForm((prev) => ({ ...prev, sortOrder: Number(event.target.value) || 0 }))} /></label>
                <label className="field"><span>Заголовок</span><input value={sectionForm.title} onChange={(event) => setSectionForm((prev) => ({ ...prev, title: event.target.value }))} /></label>
                <label className="field"><span>Подзаголовок</span><input value={sectionForm.subtitle} onChange={(event) => setSectionForm((prev) => ({ ...prev, subtitle: event.target.value }))} /></label>
              </div>
              <label className="field"><span>Контент</span><textarea rows={2} value={sectionForm.content} onChange={(event) => setSectionForm((prev) => ({ ...prev, content: event.target.value }))} /></label>
              <label className="field"><span>Связанная категория</span><select value={sectionForm.linkedCategoryId} disabled={sectionForm.type !== "category_pick"} onChange={(event) => setSectionForm((prev) => ({ ...prev, linkedCategoryId: event.target.value }))}><option value="">Не выбрана</option>{categories.map((category) => <option key={category.id} value={category.id}>{getCategoryLabel(categories, category.id)}</option>)}</select></label>
              <label className="field"><span>Ручная подборка</span><select multiple value={sectionForm.linkedProductIds} disabled={sectionForm.type !== "seasonal_pick"} onChange={(event) => setSectionForm((prev) => ({ ...prev, linkedProductIds: Array.from(event.target.selectedOptions, (option) => option.value) }))}>{productOptions.map((product) => <option key={product.id} value={product.id}>{product.title}</option>)}</select></label>
              <label className="field field_inline admin-panel__switch"><input type="checkbox" checked={sectionForm.isEnabled} onChange={(event) => setSectionForm((prev) => ({ ...prev, isEnabled: event.target.checked }))} /><span>Включена</span></label>
              <div className="admin-panel__actions"><button className="btn btn_primary btn_compact" type="submit" disabled={isSaving("homepage")}>{isSaving("homepage") ? "Сохраняем..." : "Сохранить секцию"}</button></div>
            </form>
            <div className="admin-list">{homepageSections.map((section, index) => <article key={section.id} className="admin-item"><div className="stack-sm"><strong>{section.title || sectionTypeLabel[section.type]}</strong><small>{sectionTypeLabel[section.type]} · {section.isEnabled ? "включена" : "скрыта"}</small></div><div className="toolbar"><button type="button" className="btn btn_secondary btn_compact" onClick={() => setSectionForm(buildSectionForm(section))}>Править</button><button type="button" className="btn btn_ghost btn_compact" disabled={index === 0 || isSaving("homepage")} onClick={() => void moveHomepageSection(section.id, -1)}>↑</button><button type="button" className="btn btn_ghost btn_compact" disabled={index === homepageSections.length - 1 || isSaving("homepage")} onClick={() => void moveHomepageSection(section.id, 1)}>↓</button><button type="button" className="btn btn_ghost btn_compact" onClick={() => void saveHomepageSection({ id: section.id, type: section.type, title: section.title, subtitle: section.subtitle, content: section.content, linkedCategoryId: section.linkedCategoryId, linkedProductIds: section.linkedProductIds, isEnabled: !section.isEnabled, sortOrder: section.sortOrder })}>{section.isEnabled ? "Скрыть" : "Показать"}</button><button type="button" className="btn btn_ghost btn_compact" disabled={isSaving("homepage")} onClick={() => void handleDeleteSection(section)}>Удалить</button></div></article>)}</div>
          </article>

          <article className="card stack-sm admin-panel__card">
            <h3>Категории и подкатегории</h3>
            <form className="admin-panel__form stack" onSubmit={(event) => void submitCategory(event)}>
              <div className="admin-panel__grid admin-panel__grid_compact">
                <label className="field"><span>Название</span><input value={categoryForm.name} onChange={(event) => setCategoryForm((prev) => ({ ...prev, name: event.target.value }))} /></label>
                <label className="field"><span>Parent</span><select value={categoryForm.parentCategoryId} onChange={(event) => setCategoryForm((prev) => ({ ...prev, parentCategoryId: event.target.value }))}><option value="">Корневая категория</option>{roots.filter((category) => category.id !== categoryForm.id).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
                <label className="field"><span>Slug</span><input value={categoryForm.slug} onChange={(event) => setCategoryForm((prev) => ({ ...prev, slug: event.target.value }))} /></label>
                <label className="field"><span>Эмодзи</span><input value={categoryForm.emoji} onChange={(event) => setCategoryForm((prev) => ({ ...prev, emoji: event.target.value }))} /></label>
              </div>
              <label className="field"><span>Описание</span><textarea rows={2} value={categoryForm.description} onChange={(event) => setCategoryForm((prev) => ({ ...prev, description: event.target.value }))} /></label>
              <div className="admin-panel__grid admin-panel__grid_compact">
                <label className="field"><span>Tile image URL</span><input value={categoryForm.imageUrl} onChange={(event) => setCategoryForm((prev) => ({ ...prev, imageUrl: event.target.value }))} /></label>
                <label className="field"><span>Banner image URL</span><input value={categoryForm.bannerUrl} onChange={(event) => setCategoryForm((prev) => ({ ...prev, bannerUrl: event.target.value }))} /></label>
                <label className="field"><span>Порядок</span><input type="number" value={categoryForm.sortOrder} onChange={(event) => setCategoryForm((prev) => ({ ...prev, sortOrder: Number(event.target.value) || 0 }))} /></label>
              </div>
              <label className="field field_inline admin-panel__switch"><input type="checkbox" checked={categoryForm.isVisible} onChange={(event) => setCategoryForm((prev) => ({ ...prev, isVisible: event.target.checked }))} /><span>Видима в storefront</span></label>
              <div className="admin-panel__actions"><button className="btn btn_primary btn_compact" type="submit" disabled={isSaving("category")}>{isSaving("category") ? "Сохраняем..." : "Сохранить категорию"}</button><Link to="/catalog" className="btn btn_ghost btn_compact">Проверить каталог</Link></div>
            </form>
            <div className="admin-list">{roots.map((category) => [renderCategoryRow(category), ...getChildCategories(categories, category.id).map((child) => renderCategoryRow(child, true))])}</div>
          </article>
        </div>
        {workNotice ? <small className="admin-panel__notice">{workNotice}</small> : null}
      </section>
    </>
  );
}

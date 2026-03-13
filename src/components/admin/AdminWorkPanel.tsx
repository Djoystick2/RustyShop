import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import type { Category, HomepageSection, HomepageSectionType, Product } from "../../types/entities";

interface AdminWorkPanelProps {
  onSelectProducts?: () => void;
}

interface StorefrontFormState {
  storeName: string;
  heroBadge: string;
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
  name: string;
  description: string;
  emoji: string;
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
  new_arrivals: "Новинки",
  recommended: "Рекомендуем",
  giveaway: "Розыгрыш",
  category_pick: "Подборка категории",
  about: "О продавце",
  promo: "Промо",
  seasonal_pick: "Ручная подборка"
};

function getNextSortOrder(items: Array<{ sortOrder: number }>) {
  return items.reduce((maxValue, item) => Math.max(maxValue, item.sortOrder), 0) + 10;
}

function createEmptyCategoryForm(sortOrder: number): CategoryFormState {
  return { id: "", name: "", description: "", emoji: "🧶", sortOrder, isVisible: true };
}

function buildCategoryForm(category: Category): CategoryFormState {
  return {
    id: category.id,
    name: category.name,
    description: category.description,
    emoji: category.emoji,
    sortOrder: category.sortOrder,
    isVisible: category.isVisible
  };
}

function createEmptySectionForm(sortOrder: number): HomepageSectionFormState {
  return {
    id: "",
    type: "seasonal_pick",
    title: "",
    subtitle: "",
    content: "",
    linkedCategoryId: "",
    linkedProductIds: [],
    isEnabled: true,
    sortOrder
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

function appendTemplateLine(template: string, line: string, placeholder: string) {
  if (template.includes(placeholder)) {
    return template;
  }

  const trimmed = template.trim();
  return trimmed ? `${trimmed}\n${line}` : line;
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
    .replaceAll("{article}", "");
}

export function AdminWorkPanel({ onSelectProducts }: AdminWorkPanelProps) {
  const {
    deleteHomepageSection,
    isSaving,
    moveHomepageSection,
    saveCategory,
    saveHomepageSection,
    state,
    updateSellerSettings,
    updateStoreSettings
  } = useAppContext();

  const categories = useMemo(
    () => [...state.categories].sort((first, second) => first.sortOrder - second.sortOrder),
    [state.categories]
  );
  const homepageSections = useMemo(
    () => [...state.homepageSections].sort((first, second) => first.sortOrder - second.sortOrder),
    [state.homepageSections]
  );
  const productOptions = useMemo(
    () => [...state.products].sort((first, second) => first.title.localeCompare(second.title, "ru")),
    [state.products]
  );
  const sampleProduct = productOptions[0] ?? null;

  const [storefrontForm, setStorefrontForm] = useState<StorefrontFormState>({
    storeName: state.storeSettings.storeName,
    heroBadge: state.storeSettings.heroBadge,
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
  const [categoryForm, setCategoryForm] = useState(() =>
    createEmptyCategoryForm(getNextSortOrder(state.categories))
  );
  const [sectionForm, setSectionForm] = useState(() =>
    createEmptySectionForm(getNextSortOrder(state.homepageSections))
  );
  const [workNotice, setWorkNotice] = useState("");

  useEffect(() => {
    setStorefrontForm({
      storeName: state.storeSettings.storeName,
      heroBadge: state.storeSettings.heroBadge,
      mascotEmoji: state.storeSettings.mascotEmoji,
      brandSlogan: state.storeSettings.brandSlogan,
      welcomeText: state.storeSettings.welcomeText,
      storeDescription: state.storeSettings.storeDescription,
      infoBlock: state.storeSettings.infoBlock,
      promoTitle: state.storeSettings.promoTitle,
      promoText: state.storeSettings.promoText
    });
  }, [
    state.storeSettings.brandSlogan,
    state.storeSettings.heroBadge,
    state.storeSettings.infoBlock,
    state.storeSettings.mascotEmoji,
    state.storeSettings.promoText,
    state.storeSettings.promoTitle,
    state.storeSettings.storeDescription,
    state.storeSettings.storeName,
    state.storeSettings.welcomeText
  ]);

  useEffect(() => {
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
  }, [
    state.sellerSettings.aboutSeller,
    state.sellerSettings.city,
    state.sellerSettings.contactText,
    state.sellerSettings.purchaseButtonLabel,
    state.sellerSettings.purchaseMessageTemplate,
    state.sellerSettings.sellerName,
    state.sellerSettings.shortBio,
    state.sellerSettings.telegramLink,
    state.sellerSettings.telegramUsername
  ]);

  const includePrice = sellerForm.purchaseMessageTemplate.includes("{price}");
  const includeLink = sellerForm.purchaseMessageTemplate.includes("{link}");
  const purchasePreview = buildPurchasePreview(sellerForm.purchaseMessageTemplate, sampleProduct);

  async function submitStorefront(event: FormEvent) {
    event.preventDefault();
    setWorkNotice("");
    await updateStoreSettings({
      storeName: storefrontForm.storeName,
      heroBadge: storefrontForm.heroBadge,
      mascotEmoji: storefrontForm.mascotEmoji,
      brandSlogan: storefrontForm.brandSlogan,
      welcomeText: storefrontForm.welcomeText,
      storeDescription: storefrontForm.storeDescription,
      infoBlock: storefrontForm.infoBlock,
      promoTitle: storefrontForm.promoTitle,
      promoText: storefrontForm.promoText
    });
    setWorkNotice("Витрина сохранена.");
  }

  async function submitSellerSettings(event: FormEvent) {
    event.preventDefault();
    setWorkNotice("");
    await updateSellerSettings({
      sellerName: sellerForm.sellerName,
      telegramUsername: sellerForm.telegramUsername,
      telegramLink: sellerForm.telegramLink,
      city: sellerForm.city,
      shortBio: sellerForm.shortBio,
      aboutSeller: sellerForm.aboutSeller,
      contactText: sellerForm.contactText,
      purchaseButtonLabel: sellerForm.purchaseButtonLabel,
      purchaseMessageTemplate: sellerForm.purchaseMessageTemplate
    });
    setWorkNotice("Настройки продавца сохранены.");
  }

  async function submitCategory(event: FormEvent) {
    event.preventDefault();
    if (!categoryForm.name.trim()) {
      return;
    }

    setWorkNotice("");
    await saveCategory({
      id: categoryForm.id || undefined,
      name: categoryForm.name,
      description: categoryForm.description,
      emoji: categoryForm.emoji,
      sortOrder: categoryForm.sortOrder,
      isVisible: categoryForm.isVisible
    });
    setCategoryForm(createEmptyCategoryForm(getNextSortOrder(categories)));
    setWorkNotice("Каталог обновлён.");
  }

  async function submitHomepageSection(event: FormEvent) {
    event.preventDefault();
    setWorkNotice("");
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
    setSectionForm(createEmptySectionForm(getNextSortOrder(homepageSections)));
    setWorkNotice("Секция главной сохранена.");
  }

  async function moveCategory(categoryId: string, direction: -1 | 1) {
    const currentIndex = categories.findIndex((category) => category.id === categoryId);
    const targetIndex = currentIndex + direction;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= categories.length) {
      return;
    }

    const current = categories[currentIndex];
    const target = categories[targetIndex];

    await saveCategory({
      id: current.id,
      name: current.name,
      description: current.description,
      emoji: current.emoji,
      sortOrder: target.sortOrder,
      isVisible: current.isVisible
    });
    await saveCategory({
      id: target.id,
      name: target.name,
      description: target.description,
      emoji: target.emoji,
      sortOrder: current.sortOrder,
      isVisible: target.isVisible
    });
  }

  async function toggleCategoryVisibility(category: Category) {
    await saveCategory({
      id: category.id,
      name: category.name,
      description: category.description,
      emoji: category.emoji,
      sortOrder: category.sortOrder,
      isVisible: !category.isVisible
    });
  }

  async function toggleSection(section: HomepageSection) {
    await saveHomepageSection({
      id: section.id,
      type: section.type,
      title: section.title,
      subtitle: section.subtitle,
      content: section.content,
      linkedCategoryId: section.linkedCategoryId,
      linkedProductIds: section.linkedProductIds,
      isEnabled: !section.isEnabled,
      sortOrder: section.sortOrder
    });
  }

  async function handleDeleteSection(section: HomepageSection) {
    if (!window.confirm(`Удалить секцию «${section.title || sectionTypeLabel[section.type]}»?`)) {
      return;
    }

    await deleteHomepageSection(section.id);
    if (sectionForm.id === section.id) {
      setSectionForm(createEmptySectionForm(getNextSortOrder(homepageSections)));
    }
  }

  return (
    <>
      <section className="admin-panel__section stack">
        <div className="admin-panel__section-head">
          <div className="stack-sm admin-panel__section-copy">
            <p className="hero__eyebrow">Витрина / Каталог / Продавец</p>
            <h2 className="section-title">Управление storefront без правки кода</h2>
          </div>
          <div className="profile-page__meta">
            <span className="badge badge_soft">{homepageSections.length} секций</span>
            <span className="badge badge_soft">{categories.length} категорий</span>
            <span className="badge badge_soft">{state.products.length} товаров</span>
          </div>
        </div>

        <div className="admin-panel__split">
          <article className="card stack-sm admin-panel__card">
            <div className="stack-sm">
              <h3>Витрина и hero</h3>
              <small>Название магазина, hero-слой и ключевые тексты главной.</small>
            </div>

            <form className="admin-panel__form stack" onSubmit={(event) => void submitStorefront(event)}>
              <div className="admin-panel__grid admin-panel__grid_compact">
                <label className="field">
                  <span>Название магазина</span>
                  <input
                    value={storefrontForm.storeName}
                    onChange={(event) =>
                      setStorefrontForm((prev) => ({ ...prev, storeName: event.target.value }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Hero badge</span>
                  <input
                    value={storefrontForm.heroBadge}
                    onChange={(event) =>
                      setStorefrontForm((prev) => ({ ...prev, heroBadge: event.target.value }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Эмодзи бренда</span>
                  <input
                    value={storefrontForm.mascotEmoji}
                    onChange={(event) =>
                      setStorefrontForm((prev) => ({ ...prev, mascotEmoji: event.target.value }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Короткий слоган</span>
                  <input
                    value={storefrontForm.brandSlogan}
                    onChange={(event) =>
                      setStorefrontForm((prev) => ({ ...prev, brandSlogan: event.target.value }))
                    }
                  />
                </label>
              </div>

              <label className="field">
                <span>Welcome text</span>
                <textarea
                  rows={2}
                  value={storefrontForm.welcomeText}
                  onChange={(event) =>
                    setStorefrontForm((prev) => ({ ...prev, welcomeText: event.target.value }))
                  }
                />
              </label>

              <label className="field">
                <span>Описание магазина</span>
                <textarea
                  rows={2}
                  value={storefrontForm.storeDescription}
                  onChange={(event) =>
                    setStorefrontForm((prev) => ({ ...prev, storeDescription: event.target.value }))
                  }
                />
              </label>

              <div className="admin-panel__grid admin-panel__grid_compact">
                <label className="field">
                  <span>Заголовок promo</span>
                  <input
                    value={storefrontForm.promoTitle}
                    onChange={(event) =>
                      setStorefrontForm((prev) => ({ ...prev, promoTitle: event.target.value }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Info block</span>
                  <input
                    value={storefrontForm.infoBlock}
                    onChange={(event) =>
                      setStorefrontForm((prev) => ({ ...prev, infoBlock: event.target.value }))
                    }
                  />
                </label>
              </div>

              <label className="field">
                <span>Текст promo</span>
                <textarea
                  rows={2}
                  value={storefrontForm.promoText}
                  onChange={(event) =>
                    setStorefrontForm((prev) => ({ ...prev, promoText: event.target.value }))
                  }
                />
              </label>

              <div className="admin-panel__actions row-wrap">
                <button
                  className="btn btn_primary btn_compact"
                  type="submit"
                  disabled={isSaving("settings_store")}
                  aria-busy={isSaving("settings_store")}
                >
                  {isSaving("settings_store") ? "Сохраняем..." : "Сохранить витрину"}
                </button>
                <Link to="/" className="btn btn_ghost btn_compact">
                  Проверить главную
                </Link>
              </div>
            </form>
          </article>

          <article className="card stack-sm admin-panel__card">
            <div className="stack-sm">
              <h3>Продавец и покупка</h3>
              <small>Контакт, CTA и шаблон сообщения для кнопки «Приобрести».</small>
            </div>

            <form className="admin-panel__form stack" onSubmit={(event) => void submitSellerSettings(event)}>
              <div className="admin-panel__grid admin-panel__grid_compact">
                <label className="field">
                  <span>Имя продавца</span>
                  <input
                    value={sellerForm.sellerName}
                    onChange={(event) =>
                      setSellerForm((prev) => ({ ...prev, sellerName: event.target.value }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Telegram username</span>
                  <input
                    value={sellerForm.telegramUsername}
                    onChange={(event) =>
                      setSellerForm((prev) => ({ ...prev, telegramUsername: event.target.value }))
                    }
                    placeholder="@username"
                  />
                </label>
                <label className="field">
                  <span>Telegram link</span>
                  <input
                    value={sellerForm.telegramLink}
                    onChange={(event) =>
                      setSellerForm((prev) => ({ ...prev, telegramLink: event.target.value }))
                    }
                    placeholder="https://t.me/username"
                  />
                </label>
                <label className="field">
                  <span>Город</span>
                  <input
                    value={sellerForm.city}
                    onChange={(event) => setSellerForm((prev) => ({ ...prev, city: event.target.value }))}
                  />
                </label>
              </div>

              <label className="field">
                <span>Короткое описание</span>
                <textarea
                  rows={2}
                  value={sellerForm.shortBio}
                  onChange={(event) => setSellerForm((prev) => ({ ...prev, shortBio: event.target.value }))}
                />
              </label>

              <label className="field">
                <span>Текст для страницы продавца</span>
                <textarea
                  rows={2}
                  value={sellerForm.aboutSeller}
                  onChange={(event) =>
                    setSellerForm((prev) => ({ ...prev, aboutSeller: event.target.value }))
                  }
                />
              </label>

              <label className="field">
                <span>Контактный текст</span>
                <textarea
                  rows={2}
                  value={sellerForm.contactText}
                  onChange={(event) =>
                    setSellerForm((prev) => ({ ...prev, contactText: event.target.value }))
                  }
                />
              </label>

              <div className="admin-panel__grid admin-panel__grid_compact">
                <label className="field">
                  <span>Текст кнопки покупки</span>
                  <input
                    value={sellerForm.purchaseButtonLabel}
                    onChange={(event) =>
                      setSellerForm((prev) => ({ ...prev, purchaseButtonLabel: event.target.value }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Шаблон сообщения</span>
                  <input
                    value={sellerForm.purchaseMessageTemplate}
                    onChange={(event) =>
                      setSellerForm((prev) => ({ ...prev, purchaseMessageTemplate: event.target.value }))
                    }
                    placeholder="Здравствуйте! Хочу приобрести товар: {product}"
                  />
                </label>
              </div>

              <div className="admin-panel__checkbox-grid">
                <label className="field field_inline admin-panel__switch">
                  <input
                    type="checkbox"
                    checked={includePrice}
                    onChange={(event) =>
                      setSellerForm((prev) => ({
                        ...prev,
                        purchaseMessageTemplate: event.target.checked
                          ? appendTemplateLine(prev.purchaseMessageTemplate, "Цена: {price}", "{price}")
                          : removeTemplatePlaceholder(prev.purchaseMessageTemplate, "{price}")
                      }))
                    }
                  />
                  <span>Добавлять цену</span>
                </label>
                <label className="field field_inline admin-panel__switch">
                  <input
                    type="checkbox"
                    checked={includeLink}
                    onChange={(event) =>
                      setSellerForm((prev) => ({
                        ...prev,
                        purchaseMessageTemplate: event.target.checked
                          ? appendTemplateLine(prev.purchaseMessageTemplate, "Ссылка: {link}", "{link}")
                          : removeTemplatePlaceholder(prev.purchaseMessageTemplate, "{link}")
                      }))
                    }
                  />
                  <span>Добавлять ссылку</span>
                </label>
              </div>

              <small className="admin-panel__helper">
                Доступные плейсхолдеры: <code>{"{product}"}</code>, <code>{"{price}"}</code>,
                {" "}
                <code>{"{link}"}</code>. Артикул пока не поддерживается текущей моделью товара.
              </small>
              <small className="admin-panel__helper">Превью: {purchasePreview}</small>

              <div className="admin-panel__actions row-wrap">
                <button
                  className="btn btn_primary btn_compact"
                  type="submit"
                  disabled={isSaving("settings_seller")}
                  aria-busy={isSaving("settings_seller")}
                >
                  {isSaving("settings_seller") ? "Сохраняем..." : "Сохранить продавца"}
                </button>
                <button
                  type="button"
                  className="btn btn_secondary btn_compact"
                  onClick={() => onSelectProducts?.()}
                >
                  Открыть товары
                </button>
              </div>
            </form>
          </article>
        </div>
      </section>

      <section className="admin-panel__section stack">
        <div className="admin-panel__section-head">
          <div className="stack-sm admin-panel__section-copy">
            <p className="hero__eyebrow">Главная и каталог</p>
            <h2 className="section-title">Секции витрины и плитки категорий</h2>
          </div>
        </div>

        <div className="admin-panel__split">
          <article className="card stack-sm admin-panel__card">
            <div className="row-between row-wrap">
              <div className="stack-sm">
                <h3>{sectionForm.id ? "Редактирование секции" : "Новая секция"}</h3>
                <small>Порядок, видимость, заголовки и ручная подборка товаров для главной.</small>
              </div>
              <button
                type="button"
                className="btn btn_secondary btn_compact"
                onClick={() => setSectionForm(createEmptySectionForm(getNextSortOrder(homepageSections)))}
              >
                Новая секция
              </button>
            </div>

            <form className="admin-panel__form stack" onSubmit={(event) => void submitHomepageSection(event)}>
              <div className="admin-panel__grid admin-panel__grid_compact">
                <label className="field">
                  <span>Тип секции</span>
                  <select
                    value={sectionForm.type}
                    onChange={(event) =>
                      setSectionForm((prev) => ({
                        ...prev,
                        type: event.target.value as HomepageSectionType,
                        linkedCategoryId: event.target.value === "category_pick" ? prev.linkedCategoryId : "",
                        linkedProductIds: event.target.value === "seasonal_pick" ? prev.linkedProductIds : []
                      }))
                    }
                  >
                    {Object.entries(sectionTypeLabel).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Порядок</span>
                  <input
                    type="number"
                    value={sectionForm.sortOrder}
                    onChange={(event) =>
                      setSectionForm((prev) => ({ ...prev, sortOrder: Number(event.target.value) || 0 }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Заголовок</span>
                  <input
                    value={sectionForm.title}
                    onChange={(event) => setSectionForm((prev) => ({ ...prev, title: event.target.value }))}
                  />
                </label>
                <label className="field">
                  <span>Подзаголовок</span>
                  <input
                    value={sectionForm.subtitle}
                    onChange={(event) => setSectionForm((prev) => ({ ...prev, subtitle: event.target.value }))}
                  />
                </label>
              </div>

              <label className="field">
                <span>Контент / текст секции</span>
                <textarea
                  rows={2}
                  value={sectionForm.content}
                  onChange={(event) => setSectionForm((prev) => ({ ...prev, content: event.target.value }))}
                />
              </label>

              <div className="admin-panel__grid admin-panel__grid_compact">
                <label className="field">
                  <span>Связанная категория</span>
                  <select
                    value={sectionForm.linkedCategoryId}
                    disabled={sectionForm.type !== "category_pick"}
                    onChange={(event) =>
                      setSectionForm((prev) => ({ ...prev, linkedCategoryId: event.target.value }))
                    }
                  >
                    <option value="">Не выбрана</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.emoji} {category.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Ручная подборка товаров</span>
                  <select
                    multiple
                    value={sectionForm.linkedProductIds}
                    disabled={sectionForm.type !== "seasonal_pick"}
                    onChange={(event) =>
                      setSectionForm((prev) => ({
                        ...prev,
                        linkedProductIds: Array.from(event.target.selectedOptions, (option) => option.value)
                      }))
                    }
                  >
                    {productOptions.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.title}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="field field_inline admin-panel__switch">
                <input
                  type="checkbox"
                  checked={sectionForm.isEnabled}
                  onChange={(event) =>
                    setSectionForm((prev) => ({ ...prev, isEnabled: event.target.checked }))
                  }
                />
                <span>Секция включена</span>
              </label>

              <div className="admin-panel__actions row-wrap">
                <button
                  className="btn btn_primary btn_compact"
                  type="submit"
                  disabled={isSaving("homepage")}
                  aria-busy={isSaving("homepage")}
                >
                  {isSaving("homepage") ? "Сохраняем..." : "Сохранить секцию"}
                </button>
              </div>
            </form>

            <div className="admin-list">
              {homepageSections.map((section, index) => (
                <article key={section.id} className="admin-item">
                  <div className="stack-sm">
                    <strong>{section.title || sectionTypeLabel[section.type]}</strong>
                    <small>
                      {sectionTypeLabel[section.type]} · {section.isEnabled ? "включена" : "скрыта"}
                    </small>
                  </div>
                  <div className="toolbar">
                    <button
                      type="button"
                      className="btn btn_secondary btn_compact"
                      onClick={() => setSectionForm(buildSectionForm(section))}
                    >
                      Править
                    </button>
                    <button
                      type="button"
                      className="btn btn_ghost btn_compact"
                      disabled={index === 0 || isSaving("homepage")}
                      onClick={() => void moveHomepageSection(section.id, -1)}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="btn btn_ghost btn_compact"
                      disabled={index === homepageSections.length - 1 || isSaving("homepage")}
                      onClick={() => void moveHomepageSection(section.id, 1)}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="btn btn_ghost btn_compact"
                      onClick={() => void toggleSection(section)}
                    >
                      {section.isEnabled ? "Скрыть" : "Показать"}
                    </button>
                    <button
                      type="button"
                      className="btn btn_ghost btn_compact"
                      disabled={isSaving("homepage")}
                      onClick={() => void handleDeleteSection(section)}
                    >
                      Удалить
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </article>

          <article className="card stack-sm admin-panel__card">
            <div className="row-between row-wrap">
              <div className="stack-sm">
                <h3>{categoryForm.id ? "Редактирование категории" : "Новая категория"}</h3>
                <small>Плитки каталога, порядок, видимость и тексты без ручной правки кода.</small>
              </div>
              <button
                type="button"
                className="btn btn_secondary btn_compact"
                onClick={() => setCategoryForm(createEmptyCategoryForm(getNextSortOrder(categories)))}
              >
                Новая категория
              </button>
            </div>

            <form className="admin-panel__form stack" onSubmit={(event) => void submitCategory(event)}>
              <div className="admin-panel__grid admin-panel__grid_compact">
                <label className="field">
                  <span>Название</span>
                  <input
                    value={categoryForm.name}
                    onChange={(event) => setCategoryForm((prev) => ({ ...prev, name: event.target.value }))}
                  />
                </label>
                <label className="field">
                  <span>Эмодзи</span>
                  <input
                    value={categoryForm.emoji}
                    onChange={(event) => setCategoryForm((prev) => ({ ...prev, emoji: event.target.value }))}
                  />
                </label>
                <label className="field">
                  <span>Порядок</span>
                  <input
                    type="number"
                    value={categoryForm.sortOrder}
                    onChange={(event) =>
                      setCategoryForm((prev) => ({ ...prev, sortOrder: Number(event.target.value) || 0 }))
                    }
                  />
                </label>
              </div>

              <label className="field">
                <span>Описание категории</span>
                <textarea
                  rows={2}
                  value={categoryForm.description}
                  onChange={(event) =>
                    setCategoryForm((prev) => ({ ...prev, description: event.target.value }))
                  }
                />
              </label>

              <label className="field field_inline admin-panel__switch">
                <input
                  type="checkbox"
                  checked={categoryForm.isVisible}
                  onChange={(event) =>
                    setCategoryForm((prev) => ({ ...prev, isVisible: event.target.checked }))
                  }
                />
                <span>Категория видима в каталоге</span>
              </label>

              <div className="admin-panel__actions row-wrap">
                <button
                  className="btn btn_primary btn_compact"
                  type="submit"
                  disabled={isSaving("category")}
                  aria-busy={isSaving("category")}
                >
                  {isSaving("category") ? "Сохраняем..." : "Сохранить категорию"}
                </button>
                <Link to="/catalog" className="btn btn_ghost btn_compact">
                  Проверить каталог
                </Link>
              </div>
            </form>

            <div className="admin-list">
              {categories.map((category, index) => {
                const productCount = state.products.filter((product) => product.categoryId === category.id).length;

                return (
                  <article key={category.id} className="admin-item">
                    <div className="stack-sm">
                      <strong>
                        {category.emoji} {category.name}
                      </strong>
                      <small>
                        {productCount} товаров · {category.isVisible ? "плитка активна" : "скрыта"}
                      </small>
                    </div>
                    <div className="toolbar">
                      <button
                        type="button"
                        className="btn btn_secondary btn_compact"
                        onClick={() => setCategoryForm(buildCategoryForm(category))}
                      >
                        Править
                      </button>
                      <button
                        type="button"
                        className="btn btn_ghost btn_compact"
                        disabled={index === 0 || isSaving("category")}
                        onClick={() => void moveCategory(category.id, -1)}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="btn btn_ghost btn_compact"
                        disabled={index === categories.length - 1 || isSaving("category")}
                        onClick={() => void moveCategory(category.id, 1)}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className="btn btn_ghost btn_compact"
                        onClick={() => void toggleCategoryVisibility(category)}
                      >
                        {category.isVisible ? "Скрыть" : "Показать"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </article>
        </div>

        {workNotice ? <small className="admin-panel__notice">{workNotice}</small> : null}
      </section>
    </>
  );
}

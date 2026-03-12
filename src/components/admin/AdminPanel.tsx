import { type FormEvent, useMemo, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import type { HomepageSectionInput, ProductInput } from "../../data/state";
import type { ProductStatus } from "../../types/entities";

type SessionStatus = "draft" | "active" | "completed";

const sectionTypeOptions: Array<{ value: HomepageSectionInput["type"]; label: string }> = [
  { value: "hero", label: "Hero / приветствие" },
  { value: "new_arrivals", label: "Новинки" },
  { value: "recommended", label: "Рекомендации" },
  { value: "giveaway", label: "Розыгрыш" },
  { value: "category_pick", label: "Подборка категории" },
  { value: "about", label: "О мастере" },
  { value: "promo", label: "Промо-блок" },
  { value: "seasonal_pick", label: "Сезонная подборка" }
];

function parseCsv(input: string): string[] {
  return input.split(",").map((item) => item.trim()).filter(Boolean);
}

export function AdminPanel() {
  const {
    state,
    isSaving,
    canUploadProductImages,
    saveCategory,
    saveProduct,
    saveHomepageSection,
    deleteHomepageSection,
    moveHomepageSection,
    updateStoreSettings,
    updateSellerSettings,
    createGiveawaySession,
    updateGiveawaySession,
    updateGiveawaySessionStatus,
    attachProductToGiveaway,
    removeGiveawayItem
  } = useAppContext();

  const [storeForm, setStoreForm] = useState({
    storeName: state.storeSettings.storeName,
    brandSlogan: state.storeSettings.brandSlogan,
    heroBadge: state.storeSettings.heroBadge,
    mascotEmoji: state.storeSettings.mascotEmoji,
    storeDescription: state.storeSettings.storeDescription,
    welcomeText: state.storeSettings.welcomeText,
    infoBlock: state.storeSettings.infoBlock,
    promoTitle: state.storeSettings.promoTitle,
    promoText: state.storeSettings.promoText,
    adminIds: state.storeSettings.adminTelegramIds.join(", ")
  });

  const [sellerForm, setSellerForm] = useState({
    sellerName: state.sellerSettings.sellerName,
    avatarUrl: state.sellerSettings.avatarUrl,
    shortBio: state.sellerSettings.shortBio,
    brandStory: state.sellerSettings.brandStory,
    philosophy: state.sellerSettings.philosophy,
    materialsFocus: state.sellerSettings.materialsFocus,
    telegramUsername: state.sellerSettings.telegramUsername,
    telegramLink: state.sellerSettings.telegramLink,
    contactText: state.sellerSettings.contactText,
    aboutSeller: state.sellerSettings.aboutSeller,
    city: state.sellerSettings.city,
    purchaseMessageTemplate: state.sellerSettings.purchaseMessageTemplate,
    purchaseButtonLabel: state.sellerSettings.purchaseButtonLabel
  });

  const [categoryForm, setCategoryForm] = useState({
    id: "",
    name: "",
    description: "",
    emoji: "🧵",
    sortOrder: 100,
    isVisible: true
  });

  const [productForm, setProductForm] = useState({
    id: "",
    title: "",
    description: "",
    priceText: "",
    categoryId: state.categories[0]?.id ?? "",
    status: "new" as ProductStatus,
    materials: "",
    imageUrls: "",
    isVisible: true,
    isAvailable: true,
    isGiveawayEligible: false,
    isFeatured: false
  });
  const [productFiles, setProductFiles] = useState<File[]>([]);

  const [homepageForm, setHomepageForm] = useState({
    id: "",
    type: "promo" as HomepageSectionInput["type"],
    title: "",
    subtitle: "",
    content: "",
    linkedCategoryId: "",
    linkedProductIds: "",
    isEnabled: true,
    sortOrder: Math.max(100, state.homepageSections.length * 10 + 10)
  });

  const [sessionForm, setSessionForm] = useState({
    id: "",
    title: "",
    description: "",
    drawAt: "",
    status: "draft" as SessionStatus
  });
  const [selectedSessionId, setSelectedSessionId] = useState(state.giveawaySessions[0]?.id ?? "");
  const [giveawayProductId, setGiveawayProductId] = useState(state.products[0]?.id ?? "");

  const selectedSession = state.giveawaySessions.find((item) => item.id === selectedSessionId) ?? null;
  const selectedItems = state.giveawayItems.filter((item) => item.sessionId === selectedSession?.id);
  const selectedResults = state.giveawayResults.filter((item) => item.sessionId === selectedSession?.id);

  const categoryMap = useMemo(
    () => Object.fromEntries(state.categories.map((item) => [item.id, item.name])),
    [state.categories]
  );

  async function submitStore(event: FormEvent) {
    event.preventDefault();
    await updateStoreSettings({
      storeName: storeForm.storeName,
      brandSlogan: storeForm.brandSlogan,
      heroBadge: storeForm.heroBadge,
      mascotEmoji: storeForm.mascotEmoji,
      storeDescription: storeForm.storeDescription,
      welcomeText: storeForm.welcomeText,
      infoBlock: storeForm.infoBlock,
      promoTitle: storeForm.promoTitle,
      promoText: storeForm.promoText,
      adminTelegramIds: parseCsv(storeForm.adminIds).map((item) => Number(item)).filter(Number.isInteger)
    });
  }

  async function submitSeller(event: FormEvent) {
    event.preventDefault();
    await updateSellerSettings({ ...sellerForm });
  }

  async function submitCategory(event: FormEvent) {
    event.preventDefault();
    if (!categoryForm.name.trim()) return;
    await saveCategory({
      id: categoryForm.id || undefined,
      name: categoryForm.name,
      description: categoryForm.description,
      emoji: categoryForm.emoji || "🧵",
      sortOrder: categoryForm.sortOrder,
      isVisible: categoryForm.isVisible
    });
    setCategoryForm({ id: "", name: "", description: "", emoji: "🧵", sortOrder: 100, isVisible: true });
  }

  async function submitProduct(event: FormEvent) {
    event.preventDefault();
    if (!productForm.title.trim() || !productForm.categoryId) return;
    const payload: ProductInput = {
      id: productForm.id || undefined,
      title: productForm.title,
      description: productForm.description,
      priceText: productForm.priceText || "Цена по запросу",
      categoryId: productForm.categoryId,
      status: productForm.status,
      materials: parseCsv(productForm.materials),
      imageUrls: parseCsv(productForm.imageUrls),
      imageFiles: productFiles,
      isVisible: productForm.isVisible,
      isAvailable: productForm.isAvailable,
      isGiveawayEligible: productForm.isGiveawayEligible,
      isFeatured: productForm.isFeatured
    };
    await saveProduct(payload);
    setProductForm({
      id: "",
      title: "",
      description: "",
      priceText: "",
      categoryId: state.categories[0]?.id ?? "",
      status: "new",
      materials: "",
      imageUrls: "",
      isVisible: true,
      isAvailable: true,
      isGiveawayEligible: false,
      isFeatured: false
    });
    setProductFiles([]);
  }

  async function submitHomepage(event: FormEvent) {
    event.preventDefault();
    await saveHomepageSection({
      id: homepageForm.id || undefined,
      type: homepageForm.type,
      title: homepageForm.title,
      subtitle: homepageForm.subtitle,
      content: homepageForm.content,
      linkedCategoryId: homepageForm.linkedCategoryId || null,
      linkedProductIds: parseCsv(homepageForm.linkedProductIds),
      isEnabled: homepageForm.isEnabled,
      sortOrder: homepageForm.sortOrder
    });
    setHomepageForm({
      id: "",
      type: "promo",
      title: "",
      subtitle: "",
      content: "",
      linkedCategoryId: "",
      linkedProductIds: "",
      isEnabled: true,
      sortOrder: Math.max(100, state.homepageSections.length * 10 + 10)
    });
  }

  async function submitSession(event: FormEvent) {
    event.preventDefault();
    if (!sessionForm.title || !sessionForm.drawAt) return;
    if (sessionForm.id) {
      await updateGiveawaySession(sessionForm.id, {
        title: sessionForm.title,
        description: sessionForm.description,
        drawAt: new Date(sessionForm.drawAt).toISOString(),
        status: sessionForm.status
      });
    } else {
      await createGiveawaySession({
        title: sessionForm.title,
        description: sessionForm.description,
        drawAt: new Date(sessionForm.drawAt).toISOString()
      });
    }
    setSessionForm({ id: "", title: "", description: "", drawAt: "", status: "draft" });
  }

  return (
    <section className="admin-panel card stack-lg">
      <header className="stack-sm">
        <h2 className="section-title">Админ-панель</h2>
        <p className="section-subtitle">Управление брендом, витриной и товарами.</p>
      </header>

      <div className="admin-grid">
        <form className="stack" onSubmit={(event) => void submitStore(event)}>
          <h3>Бренд и магазин</h3>
          <label className="field">
            <span>Название бренда</span>
            <input value={storeForm.storeName} onChange={(event) => setStoreForm((prev) => ({ ...prev, storeName: event.target.value }))} />
          </label>
          <label className="field">
            <span>Слоган</span>
            <input value={storeForm.brandSlogan} onChange={(event) => setStoreForm((prev) => ({ ...prev, brandSlogan: event.target.value }))} />
          </label>
          <div className="toolbar">
            <label className="field">
              <span>Hero badge</span>
              <input value={storeForm.heroBadge} onChange={(event) => setStoreForm((prev) => ({ ...prev, heroBadge: event.target.value }))} />
            </label>
            <label className="field">
              <span>Маскот/emoji</span>
              <input value={storeForm.mascotEmoji} onChange={(event) => setStoreForm((prev) => ({ ...prev, mascotEmoji: event.target.value }))} />
            </label>
          </div>
          <label className="field">
            <span>Описание магазина</span>
            <textarea rows={2} value={storeForm.storeDescription} onChange={(event) => setStoreForm((prev) => ({ ...prev, storeDescription: event.target.value }))} />
          </label>
          <label className="field">
            <span>Приветствие</span>
            <textarea rows={2} value={storeForm.welcomeText} onChange={(event) => setStoreForm((prev) => ({ ...prev, welcomeText: event.target.value }))} />
          </label>
          <label className="field">
            <span>Инфо-блок</span>
            <textarea rows={2} value={storeForm.infoBlock} onChange={(event) => setStoreForm((prev) => ({ ...prev, infoBlock: event.target.value }))} />
          </label>
          <label className="field">
            <span>Промо-заголовок</span>
            <input value={storeForm.promoTitle} onChange={(event) => setStoreForm((prev) => ({ ...prev, promoTitle: event.target.value }))} />
          </label>
          <label className="field">
            <span>Промо-текст</span>
            <textarea rows={2} value={storeForm.promoText} onChange={(event) => setStoreForm((prev) => ({ ...prev, promoText: event.target.value }))} />
          </label>
          <label className="field">
            <span>Telegram ID админов (через запятую)</span>
            <input value={storeForm.adminIds} onChange={(event) => setStoreForm((prev) => ({ ...prev, adminIds: event.target.value }))} />
          </label>
          <button className="btn btn_primary" type="submit" disabled={isSaving("settings_store")}>
            {isSaving("settings_store") ? "Сохраняем..." : "Сохранить бренд"}
          </button>
        </form>

        <form className="stack" onSubmit={(event) => void submitSeller(event)}>
          <h3>О мастере</h3>
          <label className="field">
            <span>Имя / псевдоним</span>
            <input value={sellerForm.sellerName} onChange={(event) => setSellerForm((prev) => ({ ...prev, sellerName: event.target.value }))} />
          </label>
          <label className="field">
            <span>Аватар (URL)</span>
            <input value={sellerForm.avatarUrl} onChange={(event) => setSellerForm((prev) => ({ ...prev, avatarUrl: event.target.value }))} />
          </label>
          <label className="field">
            <span>Короткое описание</span>
            <textarea rows={2} value={sellerForm.shortBio} onChange={(event) => setSellerForm((prev) => ({ ...prev, shortBio: event.target.value }))} />
          </label>
          <label className="field">
            <span>История бренда</span>
            <textarea rows={3} value={sellerForm.brandStory} onChange={(event) => setSellerForm((prev) => ({ ...prev, brandStory: event.target.value }))} />
          </label>
          <label className="field">
            <span>Философия</span>
            <textarea rows={2} value={sellerForm.philosophy} onChange={(event) => setSellerForm((prev) => ({ ...prev, philosophy: event.target.value }))} />
          </label>
          <label className="field">
            <span>Материалы / подход</span>
            <textarea rows={2} value={sellerForm.materialsFocus} onChange={(event) => setSellerForm((prev) => ({ ...prev, materialsFocus: event.target.value }))} />
          </label>
          <div className="toolbar">
            <label className="field">
              <span>Telegram username</span>
              <input value={sellerForm.telegramUsername} onChange={(event) => setSellerForm((prev) => ({ ...prev, telegramUsername: event.target.value }))} />
            </label>
            <label className="field">
              <span>Telegram link</span>
              <input value={sellerForm.telegramLink} onChange={(event) => setSellerForm((prev) => ({ ...prev, telegramLink: event.target.value }))} />
            </label>
          </div>
          <label className="field">
            <span>Контакты</span>
            <textarea rows={2} value={sellerForm.contactText} onChange={(event) => setSellerForm((prev) => ({ ...prev, contactText: event.target.value }))} />
          </label>
          <label className="field">
            <span>О мастере (доп. текст)</span>
            <textarea rows={2} value={sellerForm.aboutSeller} onChange={(event) => setSellerForm((prev) => ({ ...prev, aboutSeller: event.target.value }))} />
          </label>
          <div className="toolbar">
            <label className="field">
              <span>Город</span>
              <input value={sellerForm.city} onChange={(event) => setSellerForm((prev) => ({ ...prev, city: event.target.value }))} />
            </label>
            <label className="field">
              <span>Кнопка «Приобрести»</span>
              <input value={sellerForm.purchaseButtonLabel} onChange={(event) => setSellerForm((prev) => ({ ...prev, purchaseButtonLabel: event.target.value }))} />
            </label>
          </div>
          <label className="field">
            <span>Шаблон сообщения ({`{product}`})</span>
            <textarea rows={2} value={sellerForm.purchaseMessageTemplate} onChange={(event) => setSellerForm((prev) => ({ ...prev, purchaseMessageTemplate: event.target.value }))} />
          </label>
          <button className="btn btn_primary" type="submit" disabled={isSaving("settings_seller")}>
            {isSaving("settings_seller") ? "Сохраняем..." : "Сохранить раздел мастера"}
          </button>
        </form>
      </div>

      <div className="admin-grid">
        <div className="stack">
          <h3>Категории</h3>
          <form className="stack" onSubmit={(event) => void submitCategory(event)}>
            <label className="field">
              <span>Название</span>
              <input value={categoryForm.name} onChange={(event) => setCategoryForm((prev) => ({ ...prev, name: event.target.value }))} />
            </label>
            <label className="field">
              <span>Описание</span>
              <textarea rows={2} value={categoryForm.description} onChange={(event) => setCategoryForm((prev) => ({ ...prev, description: event.target.value }))} />
            </label>
            <div className="toolbar">
              <label className="field">
                <span>Emoji</span>
                <input value={categoryForm.emoji} onChange={(event) => setCategoryForm((prev) => ({ ...prev, emoji: event.target.value }))} />
              </label>
              <label className="field">
                <span>Порядок</span>
                <input type="number" value={categoryForm.sortOrder} onChange={(event) => setCategoryForm((prev) => ({ ...prev, sortOrder: Number(event.target.value) || 100 }))} />
              </label>
            </div>
            <label className="field field_inline">
              <input type="checkbox" checked={categoryForm.isVisible} onChange={(event) => setCategoryForm((prev) => ({ ...prev, isVisible: event.target.checked }))} />
              <span>Показывать</span>
            </label>
            <button className="btn btn_primary" type="submit" disabled={isSaving("category")}>
              {isSaving("category") ? "Сохраняем..." : categoryForm.id ? "Сохранить категорию" : "Создать категорию"}
            </button>
          </form>
          <div className="admin-list">
            {state.categories.slice().sort((a, b) => a.sortOrder - b.sortOrder).map((category) => (
              <article key={category.id} className="admin-item">
                <div>
                  <strong>{category.emoji} {category.name}</strong>
                  <p>{category.description}</p>
                </div>
                <button type="button" className="btn btn_secondary" onClick={() => setCategoryForm({ id: category.id, name: category.name, description: category.description, emoji: category.emoji, sortOrder: category.sortOrder, isVisible: category.isVisible })}>
                  Редактировать
                </button>
              </article>
            ))}
          </div>
        </div>

        <div className="stack">
          <h3>Товары</h3>
          <form className="stack" onSubmit={(event) => void submitProduct(event)}>
            <label className="field"><span>Название</span><input value={productForm.title} onChange={(event) => setProductForm((prev) => ({ ...prev, title: event.target.value }))} /></label>
            <label className="field"><span>Описание</span><textarea rows={2} value={productForm.description} onChange={(event) => setProductForm((prev) => ({ ...prev, description: event.target.value }))} /></label>
            <div className="toolbar">
              <label className="field"><span>Цена</span><input value={productForm.priceText} onChange={(event) => setProductForm((prev) => ({ ...prev, priceText: event.target.value }))} /></label>
              <label className="field"><span>Статус</span><select value={productForm.status} onChange={(event) => setProductForm((prev) => ({ ...prev, status: event.target.value as ProductStatus }))}><option value="new">Новинка</option><option value="popular">Хит</option><option value="sold_out">Продано</option></select></label>
            </div>
            <label className="field"><span>Категория</span><select value={productForm.categoryId} onChange={(event) => setProductForm((prev) => ({ ...prev, categoryId: event.target.value }))}>{state.categories.map((category) => (<option key={category.id} value={category.id}>{categoryMap[category.id]}</option>))}</select></label>
            <label className="field"><span>Материалы (csv)</span><input value={productForm.materials} onChange={(event) => setProductForm((prev) => ({ ...prev, materials: event.target.value }))} /></label>
            <label className="field"><span>Изображения URL (csv)</span><textarea rows={2} value={productForm.imageUrls} onChange={(event) => setProductForm((prev) => ({ ...prev, imageUrls: event.target.value }))} /></label>
            <label className="field"><span>Файлы {canUploadProductImages ? "" : "(нужен storage)"}</span><input type="file" multiple accept="image/png,image/jpeg,image/webp" disabled={!canUploadProductImages} onChange={(event) => setProductFiles(Array.from(event.target.files ?? []))} /></label>
            <label className="field field_inline"><input type="checkbox" checked={productForm.isVisible} onChange={(event) => setProductForm((prev) => ({ ...prev, isVisible: event.target.checked }))} /><span>Видимый</span></label>
            <label className="field field_inline"><input type="checkbox" checked={productForm.isAvailable} onChange={(event) => setProductForm((prev) => ({ ...prev, isAvailable: event.target.checked }))} /><span>В наличии</span></label>
            <label className="field field_inline"><input type="checkbox" checked={productForm.isGiveawayEligible} onChange={(event) => setProductForm((prev) => ({ ...prev, isGiveawayEligible: event.target.checked }))} /><span>Розыгрыш</span></label>
            <label className="field field_inline"><input type="checkbox" checked={productForm.isFeatured} onChange={(event) => setProductForm((prev) => ({ ...prev, isFeatured: event.target.checked }))} /><span>Рекомендуемый</span></label>
            <button className="btn btn_primary" type="submit" disabled={isSaving("product")}>{isSaving("product") ? "Сохраняем..." : productForm.id ? "Сохранить товар" : "Создать товар"}</button>
          </form>
          <div className="admin-list">
            {state.products.map((product) => (
              <article key={product.id} className="admin-item">
                <div><strong>{product.title}</strong><p>{product.priceText}</p></div>
                <button type="button" className="btn btn_secondary" onClick={() => setProductForm({ id: product.id, title: product.title, description: product.description, priceText: product.priceText, categoryId: product.categoryId, status: product.status, materials: product.materials.join(", "), imageUrls: state.productImages.filter((item) => item.productId === product.id).sort((a, b) => a.position - b.position).map((item) => item.url).join(", "), isVisible: product.isVisible, isAvailable: product.isAvailable, isGiveawayEligible: product.isGiveawayEligible, isFeatured: product.isFeatured })}>Редактировать</button>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="admin-grid">
        <div className="stack">
          <h3>Конструктор главной</h3>
          <form className="stack" onSubmit={(event) => void submitHomepage(event)}>
            <label className="field">
              <span>Тип секции</span>
              <select
                value={homepageForm.type}
                onChange={(event) => setHomepageForm((prev) => ({ ...prev, type: event.target.value as HomepageSectionInput["type"] }))}
              >
                {sectionTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Заголовок</span>
              <input value={homepageForm.title} onChange={(event) => setHomepageForm((prev) => ({ ...prev, title: event.target.value }))} />
            </label>
            <label className="field">
              <span>Подзаголовок</span>
              <input value={homepageForm.subtitle} onChange={(event) => setHomepageForm((prev) => ({ ...prev, subtitle: event.target.value }))} />
            </label>
            <label className="field">
              <span>Текст</span>
              <textarea rows={2} value={homepageForm.content} onChange={(event) => setHomepageForm((prev) => ({ ...prev, content: event.target.value }))} />
            </label>
            <label className="field">
              <span>Категория</span>
              <select value={homepageForm.linkedCategoryId} onChange={(event) => setHomepageForm((prev) => ({ ...prev, linkedCategoryId: event.target.value }))}>
                <option value="">Не выбрано</option>
                {state.categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {categoryMap[category.id]}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Привязанные товары (id через запятую)</span>
              <input value={homepageForm.linkedProductIds} onChange={(event) => setHomepageForm((prev) => ({ ...prev, linkedProductIds: event.target.value }))} />
            </label>
            <div className="toolbar">
              <label className="field">
                <span>Порядок</span>
                <input type="number" value={homepageForm.sortOrder} onChange={(event) => setHomepageForm((prev) => ({ ...prev, sortOrder: Number(event.target.value) || 100 }))} />
              </label>
              <label className="field field_inline">
                <input type="checkbox" checked={homepageForm.isEnabled} onChange={(event) => setHomepageForm((prev) => ({ ...prev, isEnabled: event.target.checked }))} />
                <span>Включена</span>
              </label>
            </div>
            <button className="btn btn_primary" type="submit" disabled={isSaving("homepage")}>
              {isSaving("homepage") ? "Сохраняем..." : homepageForm.id ? "Сохранить секцию" : "Создать секцию"}
            </button>
          </form>
        </div>

        <div className="stack">
          <h3>Секции витрины</h3>
          <div className="admin-list">
            {state.homepageSections
              .slice()
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((section) => (
                <article key={section.id} className="admin-item">
                  <div>
                    <strong>{section.title || sectionTypeOptions.find((item) => item.value === section.type)?.label}</strong>
                    <p>{sectionTypeOptions.find((item) => item.value === section.type)?.label}</p>
                    <small>{section.isEnabled ? "Включена" : "Выключена"} · порядок {section.sortOrder}</small>
                  </div>
                  <div className="toolbar">
                    <button type="button" className="btn btn_ghost" onClick={() => void moveHomepageSection(section.id, -1)}>↑</button>
                    <button type="button" className="btn btn_ghost" onClick={() => void moveHomepageSection(section.id, 1)}>↓</button>
                    <button
                      type="button"
                      className="btn btn_ghost"
                      onClick={() =>
                        void saveHomepageSection({
                          id: section.id,
                          type: section.type,
                          title: section.title,
                          subtitle: section.subtitle,
                          content: section.content,
                          linkedCategoryId: section.linkedCategoryId,
                          linkedProductIds: section.linkedProductIds,
                          isEnabled: !section.isEnabled,
                          sortOrder: section.sortOrder
                        })
                      }
                    >
                      {section.isEnabled ? "Выкл" : "Вкл"}
                    </button>
                    <button
                      type="button"
                      className="btn btn_secondary"
                      onClick={() =>
                        setHomepageForm({
                          id: section.id,
                          type: section.type,
                          title: section.title,
                          subtitle: section.subtitle,
                          content: section.content,
                          linkedCategoryId: section.linkedCategoryId || "",
                          linkedProductIds: section.linkedProductIds.join(", "),
                          isEnabled: section.isEnabled,
                          sortOrder: section.sortOrder
                        })
                      }
                    >
                      Редактировать
                    </button>
                    <button type="button" className="btn btn_ghost" onClick={() => void deleteHomepageSection(section.id)}>
                      Удалить
                    </button>
                  </div>
                </article>
              ))}
          </div>
        </div>
      </div>

      <div className="admin-grid">
        <div className="stack">
          <h3>{sessionForm.id ? "Редактировать сессию" : "Создать сессию"}</h3>
          <form className="stack" onSubmit={(event) => void submitSession(event)}>
            <label className="field"><span>Название</span><input value={sessionForm.title} onChange={(event) => setSessionForm((prev) => ({ ...prev, title: event.target.value }))} /></label>
            <label className="field"><span>Описание</span><textarea rows={2} value={sessionForm.description} onChange={(event) => setSessionForm((prev) => ({ ...prev, description: event.target.value }))} /></label>
            <label className="field"><span>Дата</span><input type="datetime-local" value={sessionForm.drawAt} onChange={(event) => setSessionForm((prev) => ({ ...prev, drawAt: event.target.value }))} /></label>
            <label className="field"><span>Статус</span><select value={sessionForm.status} onChange={(event) => setSessionForm((prev) => ({ ...prev, status: event.target.value as SessionStatus }))}><option value="draft">Черновик</option><option value="active">Активна</option><option value="completed">Завершена</option></select></label>
            <button className="btn btn_primary" type="submit" disabled={isSaving("giveaway")}>{sessionForm.id ? "Сохранить сессию" : "Создать сессию"}</button>
          </form>
          <div className="admin-list">
            {state.giveawaySessions.map((session) => (
              <article key={session.id} className="admin-item">
                <div><strong>{session.title}</strong><p>{session.description}</p><small>{new Date(session.drawAt).toLocaleString("ru-RU")}</small></div>
                <div className="toolbar">
                  <button type="button" className="btn btn_secondary" onClick={() => setSessionForm({ id: session.id, title: session.title, description: session.description, drawAt: session.drawAt.slice(0, 16), status: session.status })}>Редактировать</button>
                  <button type="button" className="btn btn_secondary" onClick={() => void updateGiveawaySessionStatus(session.id, "active")}>Активировать</button>
                  <button type="button" className="btn btn_secondary" onClick={() => void updateGiveawaySessionStatus(session.id, "completed")}>Завершить</button>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="stack">
          <h3>Лоты и результаты</h3>
          <label className="field">
            <span>Сессия</span>
            <select value={selectedSessionId} onChange={(event) => setSelectedSessionId(event.target.value)}>
              {state.giveawaySessions.map((session) => (
                <option key={session.id} value={session.id}>{session.title}</option>
              ))}
            </select>
          </label>
          <form className="stack" onSubmit={(event) => { event.preventDefault(); if (selectedSessionId && giveawayProductId) void attachProductToGiveaway(selectedSessionId, giveawayProductId); }}>
            <label className="field"><span>Добавить лот</span><select value={giveawayProductId} onChange={(event) => setGiveawayProductId(event.target.value)}>{state.products.filter((product) => product.isGiveawayEligible).map((product) => (<option key={product.id} value={product.id}>{product.title}</option>))}</select></label>
            <button className="btn btn_primary" type="submit" disabled={!selectedSession || isSaving("giveaway")}>Добавить</button>
          </form>
          <div className="stack">
            <strong>Текущие лоты</strong>
            {selectedItems.length === 0 ? <p>Лотов пока нет.</p> : selectedItems.map((item) => {
              const product = state.products.find((candidate) => candidate.id === item.productId);
              return (
                <div key={item.id} className="row-between">
                  <span>{product?.title ?? "Удалённый товар"}</span>
                  <button type="button" className="btn btn_ghost" disabled={selectedSession?.status !== "draft"} onClick={() => void removeGiveawayItem(item.id)}>Удалить</button>
                </div>
              );
            })}
          </div>
          <div className="stack">
            <strong>Результаты</strong>
            {selectedResults.length === 0 ? <p>Результатов пока нет.</p> : selectedResults.map((result) => {
              const product = state.products.find((candidate) => candidate.id === result.productId);
              return (
                <div key={result.id} className="row-between">
                  <span>{product?.title ?? "Удалённый товар"}</span>
                  <small>{result.winnerNickname || "без ника"}</small>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

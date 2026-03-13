import { type ChangeEvent, type FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import type { ProductInput } from "../../data/state";
import { listProductsAvailableForGiveawaySession } from "../../domain/giveaway/wheel";
import { buildAcquireLink } from "../../lib/acquire-link";
import { getCategoryLabel, sortCategories } from "../../lib/catalog";
import { PRODUCT_PLACEHOLDER_IMAGE } from "../../lib/placeholders";
import { getPrimaryProductImage, getProductImages, sortProducts } from "../../lib/product-utils";
import { openTelegramLink } from "../../lib/telegram";
import type { GiveawaySessionStatus, Product } from "../../types/entities";
import { AdminWorkPanel } from "./AdminWorkPanel";

type ProductListFilter = "all" | "visible" | "hidden" | "featured" | "giveaway";

interface ProductFormState {
  id: string;
  categoryId: string;
  sku: string;
  title: string;
  description: string;
  priceText: string;
  status: Product["status"];
  materials: string;
  imageUrls: string;
  isVisible: boolean;
  isAvailable: boolean;
  isGiveawayEligible: boolean;
  isFeatured: boolean;
}

interface SessionFormState {
  id: string;
  title: string;
  description: string;
  drawAt: string;
  status: GiveawaySessionStatus;
}

interface AdminPanelProps {
  activeTab?: "work" | "products";
  onSelectTab?: (tab: "work" | "products") => void;
}

const sessionStatusLabel: Record<GiveawaySessionStatus, string> = {
  draft: "Черновик",
  active: "Активна",
  completed: "Завершена"
};

function parseTextareaList(value: string): string[] {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeSpinDuration(value: string | number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 6;
  }

  return Math.max(2, Math.min(180, Math.round(parsed)));
}

function sessionDurationToSeconds(spinDurationMs: number | null | undefined): number {
  if (typeof spinDurationMs !== "number" || !Number.isFinite(spinDurationMs)) {
    return 6;
  }

  return normalizeSpinDuration(Math.round(spinDurationMs / 1000));
}

function toDatetimeLocal(value: string): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const formatter = new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

  const parts = formatter
    .formatToParts(date)
    .reduce<Record<string, string>>((accumulator, part) => {
      if (part.type !== "literal") {
        accumulator[part.type] = part.value;
      }

      return accumulator;
    }, {});

  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

function createEmptyProductForm(defaultCategoryId: string): ProductFormState {
  return {
    id: "",
    categoryId: defaultCategoryId,
    sku: "",
    title: "",
    description: "",
    priceText: "",
    status: "new",
    materials: "",
    imageUrls: "",
    isVisible: true,
    isAvailable: true,
    isGiveawayEligible: false,
    isFeatured: false
  };
}

function buildProductForm(product: Product, imageUrls: string[]): ProductFormState {
  return {
    id: product.id,
    categoryId: product.categoryId,
    sku: product.sku,
    title: product.title,
    description: product.description,
    priceText: product.priceText,
    status: product.status,
    materials: product.materials.join(", "),
    imageUrls: imageUrls.join("\n"),
    isVisible: product.isVisible,
    isAvailable: product.isAvailable,
    isGiveawayEligible: product.isGiveawayEligible,
    isFeatured: product.isFeatured
  };
}

function createEmptySessionForm(): SessionFormState {
  return {
    id: "",
    title: "",
    description: "",
    drawAt: "",
    status: "draft"
  };
}

export function AdminPanel({ activeTab = "work", onSelectTab }: AdminPanelProps) {
  const {
    state,
    canUploadProductImages,
    isSaving,
    saveProduct,
    deleteProduct,
    toggleProductAvailability,
    toggleProductFeatured,
    toggleProductVisibility,
    createGiveawaySession,
    updateGiveawaySession,
    updateGiveawaySessionStatus,
    attachProductToGiveaway,
    removeGiveawayItem
  } = useAppContext();

  const categories = useMemo(
    () => sortCategories(state.categories),
    [state.categories]
  );
  const defaultCategoryId = categories[0]?.id ?? "";
  const showWork = activeTab === "work";
  const showProducts = activeTab === "products";

  const [productForm, setProductForm] = useState<ProductFormState>(() =>
    createEmptyProductForm(defaultCategoryId)
  );
  const [productFiles, setProductFiles] = useState<File[]>([]);
  const [productFileInputKey, setProductFileInputKey] = useState(0);
  const [productQuery, setProductQuery] = useState("");
  const [productFilter, setProductFilter] = useState<ProductListFilter>("all");
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [sessionForm, setSessionForm] = useState<SessionFormState>(createEmptySessionForm);
  const [spinDurationInput, setSpinDurationInput] = useState("6");
  const [lotProductId, setLotProductId] = useState("");
  const [productNotice, setProductNotice] = useState("");
  const [giveawayNotice, setGiveawayNotice] = useState("");

  useEffect(() => {
    if (!productForm.id) {
      if (!productForm.categoryId && defaultCategoryId) {
        setProductForm((prev) => ({ ...prev, categoryId: defaultCategoryId }));
      }
      return;
    }

    const existingProduct = state.products.find((item) => item.id === productForm.id);
    if (!existingProduct) {
      setProductForm(createEmptyProductForm(defaultCategoryId));
      setProductFiles([]);
      setProductFileInputKey((prev) => prev + 1);
      setProductNotice("");
      return;
    }

    setProductForm(
      buildProductForm(
        existingProduct,
        getProductImages(existingProduct.id, state.productImages).map((image) => image.url)
      )
    );
  }, [defaultCategoryId, productForm.categoryId, productForm.id, state.productImages, state.products]);

  useEffect(() => {
    if (!state.giveawaySessions.length) {
      setSelectedSessionId("");
      return;
    }

    const activeSession = state.giveawaySessions.find((session) => session.status === "active");
    const fallbackSessionId = activeSession?.id ?? state.giveawaySessions[0].id;

    if (!selectedSessionId) {
      setSelectedSessionId(fallbackSessionId);
      return;
    }

    const exists = state.giveawaySessions.some((session) => session.id === selectedSessionId);
    if (!exists) {
      setSelectedSessionId(fallbackSessionId);
    }
  }, [selectedSessionId, state.giveawaySessions]);

  const selectedSession = state.giveawaySessions.find((session) => session.id === selectedSessionId) ?? null;

  useEffect(() => {
    if (!selectedSession) {
      return;
    }

    setSpinDurationInput(String(sessionDurationToSeconds(selectedSession.spinDurationMs)));
  }, [selectedSession?.id, selectedSession?.spinDurationMs]);

  const sessionItems = useMemo(
    () => state.giveawayItems.filter((item) => item.sessionId === selectedSession?.id),
    [selectedSession?.id, state.giveawayItems]
  );
  const sessionResults = useMemo(
    () =>
      state.giveawayResults
        .filter((result) => result.sessionId === selectedSession?.id)
        .sort((first, second) => new Date(second.wonAt).getTime() - new Date(first.wonAt).getTime()),
    [selectedSession?.id, state.giveawayResults]
  );
  const remainingItems = useMemo(() => sessionItems.filter((item) => item.isActive), [sessionItems]);
  const availableProductsForLot = useMemo(
    () => sortProducts(listProductsAvailableForGiveawaySession(state.products, sessionItems), "newest"),
    [sessionItems, state.products]
  );

  useEffect(() => {
    if (!availableProductsForLot.length) {
      setLotProductId("");
      return;
    }

    const exists = availableProductsForLot.some((product) => product.id === lotProductId);
    if (!exists) {
      setLotProductId(availableProductsForLot[0].id);
    }
  }, [availableProductsForLot, lotProductId]);

  const activeGiveaway = useMemo(
    () => state.giveawaySessions.find((session) => session.status === "active") ?? null,
    [state.giveawaySessions]
  );
  const productSummary = useMemo(
    () => ({
      hidden: state.products.filter((product) => !product.isVisible).length,
      featured: state.products.filter((product) => product.isFeatured).length,
      preorder: state.products.filter((product) => product.isVisible && !product.isAvailable).length
    }),
    [state.products]
  );
  const giveawayHistoryProductIds = useMemo(
    () => new Set(state.giveawayResults.map((result) => result.productId)),
    [state.giveawayResults]
  );
  const visibleProducts = useMemo(() => {
    const normalizedQuery = productQuery.trim().toLowerCase();

    return sortProducts(
      state.products.filter((product) => {
        if (productFilter === "visible" && !product.isVisible) {
          return false;
        }
        if (productFilter === "hidden" && product.isVisible) {
          return false;
        }
        if (productFilter === "featured" && !product.isFeatured) {
          return false;
        }
        if (productFilter === "giveaway" && !product.isGiveawayEligible) {
          return false;
        }
        if (!normalizedQuery) {
          return true;
        }

        const categoryName = getCategoryLabel(state.categories, product.categoryId).toLowerCase();

        return (
          product.title.toLowerCase().includes(normalizedQuery) ||
          product.description.toLowerCase().includes(normalizedQuery) ||
          categoryName.includes(normalizedQuery) ||
          product.sku.toLowerCase().includes(normalizedQuery)
        );
      }),
      "newest"
    );
  }, [productFilter, productQuery, state.categories, state.products]);

  function resetProductForm() {
    setProductForm(createEmptyProductForm(defaultCategoryId));
    setProductFiles([]);
    setProductFileInputKey((prev) => prev + 1);
    setProductNotice("");
  }

  function startProductEdit(product: Product) {
    setProductForm(
      buildProductForm(product, getProductImages(product.id, state.productImages).map((image) => image.url))
    );
    setProductFiles([]);
    setProductFileInputKey((prev) => prev + 1);
    setProductNotice("");
  }

  function handleProductFilesChange(event: ChangeEvent<HTMLInputElement>) {
    setProductFiles(Array.from(event.target.files ?? []));
  }

  async function submitProduct(event: FormEvent) {
    event.preventDefault();
    if (!productForm.title.trim() || !productForm.categoryId) {
      return;
    }

    setProductNotice("");

    const payload: ProductInput = {
      id: productForm.id || undefined,
      categoryId: productForm.categoryId,
      sku: productForm.sku,
      title: productForm.title,
      description: productForm.description,
      priceText: productForm.priceText,
      status: productForm.status,
      materials: parseTextareaList(productForm.materials),
      imageUrls: parseTextareaList(productForm.imageUrls),
      imageFiles: productFiles,
      isVisible: productForm.isVisible,
      isAvailable: productForm.isAvailable,
      isGiveawayEligible: productForm.isGiveawayEligible,
      isFeatured: productForm.isFeatured
    };

    await saveProduct(payload);

    if (productForm.id) {
      setProductFiles([]);
      setProductFileInputKey((prev) => prev + 1);
    } else {
      resetProductForm();
    }
  }

  async function handleDeleteProduct(product: Product) {
    const hasGiveawayHistory = giveawayHistoryProductIds.has(product.id);
    const deleteWarning = hasGiveawayHistory
      ? "Товар сохранён в истории розыгрыша, поэтому его нельзя удалить. Это не мешает снова добавить его в новую giveaway-сессию."
      : `Удалить товар «${product.title}»? Активные лоты этого товара тоже будут сняты.`;

    if (hasGiveawayHistory) {
      setProductNotice(deleteWarning);
      return;
    }

    if (!window.confirm(deleteWarning)) {
      return;
    }

    await deleteProduct(product.id);

    if (productForm.id === product.id) {
      resetProductForm();
    }
    if (lotProductId === product.id) {
      setLotProductId("");
    }
  }

  async function submitSession(event: FormEvent) {
    event.preventDefault();
    if (!sessionForm.title.trim() || !sessionForm.drawAt) {
      return;
    }

    setGiveawayNotice("");

    if (sessionForm.id) {
      const updated = await updateGiveawaySession(sessionForm.id, {
        title: sessionForm.title.trim(),
        description: sessionForm.description.trim(),
        drawAt: new Date(sessionForm.drawAt).toISOString(),
        status: sessionForm.status,
        spinDurationMs: normalizeSpinDuration(spinDurationInput) * 1000
      });

      if (!updated) {
        return;
      }

      setGiveawayNotice("Сессия обновлена.");
    } else {
      const created = await createGiveawaySession({
        title: sessionForm.title.trim(),
        description: sessionForm.description.trim(),
        drawAt: new Date(sessionForm.drawAt).toISOString(),
        spinDurationMs: normalizeSpinDuration(spinDurationInput) * 1000
      });

      if (!created) {
        return;
      }

      setGiveawayNotice("Сессия создана.");
    }

    setSessionForm(createEmptySessionForm());
    setSpinDurationInput("6");
  }

  async function handleActivateSession() {
    if (!selectedSession) {
      return;
    }
    if (remainingItems.length === 0) {
      setGiveawayNotice("Нельзя открыть сессию без лотов.");
      return;
    }

    setGiveawayNotice("");
    const currentlyActive = state.giveawaySessions.find(
      (session) => session.status === "active" && session.id !== selectedSession.id
    );

    if (currentlyActive) {
      const demoted = await updateGiveawaySessionStatus(currentlyActive.id, "draft");
      if (!demoted) {
        return;
      }
    }

    const activated = await updateGiveawaySessionStatus(selectedSession.id, "active");
    if (activated) {
      setGiveawayNotice("Сессия открыта.");
    }
  }

  async function handleMoveToDraft() {
    if (!selectedSession) {
      return;
    }

    const updated = await updateGiveawaySessionStatus(selectedSession.id, "draft");
    if (updated) {
      setGiveawayNotice("Сессия переведена в черновик.");
    }
  }

  async function handleFinishSession() {
    if (!selectedSession) {
      return;
    }

    const updated = await updateGiveawaySessionStatus(selectedSession.id, "completed");
    if (updated) {
      setGiveawayNotice("Сессия завершена.");
    }
  }

  async function handleAddLot() {
    if (!selectedSession || !lotProductId) {
      return;
    }

    const attached = await attachProductToGiveaway(selectedSession.id, lotProductId);
    if (attached) {
      setGiveawayNotice("Лот добавлен.");
    }
  }

  async function handleRemoveLot(itemId: string) {
    const removed = await removeGiveawayItem(itemId);
    if (removed) {
      setGiveawayNotice("Лот удалён.");
    }
  }

  return (
    <section className="admin-panel stack-lg">
      {showWork ? <AdminWorkPanel onSelectProducts={() => onSelectTab?.("products")} /> : null}

      {showProducts ? (
        <section className="admin-panel__section stack">
          <div className="admin-panel__section-head">
            <div className="stack-sm admin-panel__section-copy">
              <p className="hero__eyebrow">Товары</p>
              <h2 className="section-title">Быстрые действия и focused editor</h2>
            </div>
            <div className="profile-page__meta">
              <span className="badge badge_soft">{state.products.length} товаров</span>
              <span className="badge badge_soft">{productSummary.hidden} скрыто</span>
              <span className="badge badge_soft">{productSummary.featured} рекомендовано</span>
              <span className="badge badge_soft">{productSummary.preorder} под заказ</span>
            </div>
          </div>

          <div className="admin-products">
            <article className="card stack-sm admin-panel__card">
              <div className="row-between row-wrap">
                <div className="stack-sm">
                  <h3>{productForm.id ? "Редактирование товара" : "Новый товар"}</h3>
                  <small>Добавление, обновление и основные флаги в одном месте.</small>
                </div>
                <div className="toolbar">
                  <button type="button" className="btn btn_secondary btn_compact" onClick={resetProductForm}>
                    Новый
                  </button>
                  <Link to="/catalog" className="btn btn_ghost btn_compact">
                    Каталог
                  </Link>
                </div>
              </div>

              <form className="admin-panel__form stack" onSubmit={(event) => void submitProduct(event)}>
                <div className="admin-panel__grid admin-panel__grid_compact">
                  <label className="field">
                    <span>Название</span>
                    <input
                      value={productForm.title}
                      onChange={(event) => setProductForm((prev) => ({ ...prev, title: event.target.value }))}
                    />
                  </label>
                  <label className="field">
                    <span>Категория</span>
                    <select
                      value={productForm.categoryId}
                      onChange={(event) => setProductForm((prev) => ({ ...prev, categoryId: event.target.value }))}
                    >
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.parentCategoryId ? `— ${getCategoryLabel(state.categories, category.id)}` : category.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>SKU / артикул</span>
                    <input
                      value={productForm.sku}
                      onChange={(event) => setProductForm((prev) => ({ ...prev, sku: event.target.value }))}
                      placeholder="Например: CNDL-LUNA-001"
                    />
                  </label>
                  <label className="field">
                    <span>Цена</span>
                    <input
                      value={productForm.priceText}
                      onChange={(event) => setProductForm((prev) => ({ ...prev, priceText: event.target.value }))}
                      placeholder="Например: 4 900 ₽"
                    />
                  </label>
                  <label className="field">
                    <span>Статус</span>
                    <select
                      value={productForm.status}
                      onChange={(event) =>
                        setProductForm((prev) => ({ ...prev, status: event.target.value as Product["status"] }))
                      }
                    >
                      <option value="new">Новинка</option>
                      <option value="popular">Популярный</option>
                      <option value="sold_out">Продано</option>
                    </select>
                  </label>
                </div>

                <label className="field">
                  <span>Описание</span>
                  <textarea
                    rows={3}
                    value={productForm.description}
                    onChange={(event) => setProductForm((prev) => ({ ...prev, description: event.target.value }))}
                  />
                </label>

                <div className="admin-panel__grid admin-panel__grid_compact">
                  <label className="field">
                    <span>Материалы</span>
                    <textarea
                      rows={2}
                      value={productForm.materials}
                      onChange={(event) => setProductForm((prev) => ({ ...prev, materials: event.target.value }))}
                      placeholder="шерсть, хлопок, дерево"
                    />
                  </label>
                  <label className="field">
                    <span>Изображения по URL</span>
                    <textarea
                      rows={2}
                      value={productForm.imageUrls}
                      onChange={(event) => setProductForm((prev) => ({ ...prev, imageUrls: event.target.value }))}
                      placeholder="Каждый URL с новой строки"
                    />
                  </label>
                </div>

                {canUploadProductImages ? (
                  <label className="field">
                    <span>Локальные изображения</span>
                    <input
                      key={productFileInputKey}
                      type="file"
                      multiple
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleProductFilesChange}
                    />
                  </label>
                ) : null}

                <div className="admin-panel__checkbox-grid">
                  <label className="field field_inline admin-panel__switch">
                    <input
                      type="checkbox"
                      checked={productForm.isVisible}
                      onChange={(event) =>
                        setProductForm((prev) => ({ ...prev, isVisible: event.target.checked }))
                      }
                    />
                    <span>Показывать</span>
                  </label>
                  <label className="field field_inline admin-panel__switch">
                    <input
                      type="checkbox"
                      checked={productForm.isAvailable}
                      onChange={(event) =>
                        setProductForm((prev) => ({ ...prev, isAvailable: event.target.checked }))
                      }
                    />
                    <span>В наличии</span>
                  </label>
                  <label className="field field_inline admin-panel__switch">
                    <input
                      type="checkbox"
                      checked={productForm.isFeatured}
                      onChange={(event) =>
                        setProductForm((prev) => ({ ...prev, isFeatured: event.target.checked }))
                      }
                    />
                    <span>Рекомендовать</span>
                  </label>
                  <label className="field field_inline admin-panel__switch">
                    <input
                      type="checkbox"
                      checked={productForm.isGiveawayEligible}
                      onChange={(event) =>
                        setProductForm((prev) => ({ ...prev, isGiveawayEligible: event.target.checked }))
                      }
                    />
                    <span>Участвует в розыгрыше</span>
                  </label>
                </div>

                <div className="admin-panel__actions row-wrap">
                  <button
                    className="btn btn_primary btn_compact"
                    type="submit"
                    disabled={isSaving("product") || categories.length === 0}
                    aria-busy={isSaving("product")}
                  >
                    {isSaving("product")
                      ? "Сохраняем..."
                      : productForm.id
                        ? "Сохранить товар"
                        : "Добавить товар"}
                  </button>
                  {productForm.id ? (
                    <button type="button" className="btn btn_secondary btn_compact" onClick={resetProductForm}>
                      Сбросить
                    </button>
                  ) : null}
                </div>
              </form>

              {productNotice ? <small className="admin-panel__notice">{productNotice}</small> : null}
            </article>

            <article className="card stack-sm admin-panel__card">
              <div className="row-between row-wrap">
                <div className="stack-sm">
                  <h3>Список товаров</h3>
                  <small>Управление без переходов по нескольким экранам.</small>
                </div>
                <div className="toolbar">
                  <input
                    className="admin-panel__search"
                    value={productQuery}
                    onChange={(event) => setProductQuery(event.target.value)}
                    placeholder="Поиск по товару"
                  />
                </div>
              </div>

              <div className="toolbar admin-panel__filters">
                <button
                  type="button"
                  className={`btn btn_secondary btn_compact${productFilter === "all" ? " btn_active" : ""}`}
                  onClick={() => setProductFilter("all")}
                >
                  Все
                </button>
                <button
                  type="button"
                  className={`btn btn_secondary btn_compact${productFilter === "visible" ? " btn_active" : ""}`}
                  onClick={() => setProductFilter("visible")}
                >
                  Видимые
                </button>
                <button
                  type="button"
                  className={`btn btn_secondary btn_compact${productFilter === "hidden" ? " btn_active" : ""}`}
                  onClick={() => setProductFilter("hidden")}
                >
                  Скрытые
                </button>
                <button
                  type="button"
                  className={`btn btn_secondary btn_compact${productFilter === "featured" ? " btn_active" : ""}`}
                  onClick={() => setProductFilter("featured")}
                >
                  Рекомендуемые
                </button>
                <button
                  type="button"
                  className={`btn btn_secondary btn_compact${productFilter === "giveaway" ? " btn_active" : ""}`}
                  onClick={() => setProductFilter("giveaway")}
                >
                  Розыгрыш
                </button>
              </div>

              <div className="admin-products__list">
                {visibleProducts.length === 0 ? (
                  <div className="admin-panel__empty">
                    <strong>Ничего не найдено</strong>
                    <small>Измените фильтр или добавьте новый товар.</small>
                  </div>
                ) : (
                  visibleProducts.map((product) => {
                    const categoryName =
                      state.categories.find((category) => category.id === product.categoryId)?.name ??
                      "Без категории";
                    const imageUrl =
                      getPrimaryProductImage(product.id, state.productImages) ?? PRODUCT_PLACEHOLDER_IMAGE;
                    const buyLink = buildAcquireLink(state.sellerSettings, product);

                    return (
                      <article
                        key={product.id}
                        className={`admin-product-row${productForm.id === product.id ? " admin-product-row_active" : ""}`}
                      >
                        <img className="admin-product-row__media" src={imageUrl} alt={product.title} loading="lazy" />

                        <div className="stack-sm">
                          <div className="row-between row-wrap">
                            <div className="stack-sm admin-product-row__copy">
                              <strong>{product.title}</strong>
                              <small>
                                {categoryName} · {product.priceText}
                              </small>
                            </div>
                            <div className="profile-page__meta admin-product-row__meta">
                              {!product.isVisible ? <span className="badge badge_soft">Скрыт</span> : null}
                              {product.isAvailable ? (
                                <span className="badge badge_available">В наличии</span>
                              ) : (
                                <span className="badge badge_soft">Под заказ</span>
                              )}
                              {product.isFeatured ? <span className="badge badge_popular">Рекомендуем</span> : null}
                              {product.isGiveawayEligible ? (
                                <span className="badge badge_giveaway">Розыгрыш</span>
                              ) : null}
                            </div>
                          </div>

                          <p className="admin-product-row__description">{product.description}</p>

                          <div className="toolbar">
                            <button
                              type="button"
                              className="btn btn_secondary btn_compact"
                              onClick={() => startProductEdit(product)}
                            >
                              Редактировать
                            </button>
                            <Link to={`/product/${product.id}`} className="btn btn_ghost btn_compact">
                              Открыть
                            </Link>
                            {buyLink ? (
                              <button
                                type="button"
                                className="btn btn_primary btn_compact"
                                onClick={() => openTelegramLink(buyLink)}
                                disabled={product.status === "sold_out"}
                              >
                                {state.sellerSettings.purchaseButtonLabel || "Приобрести"}
                              </button>
                            ) : (
                              <Link to="/about" className="btn btn_primary btn_compact">
                                Контакты
                              </Link>
                            )}
                          </div>

                          <div className="toolbar admin-product-row__quick-actions">
                            <button
                              type="button"
                              className="btn btn_ghost btn_compact"
                              onClick={() => void toggleProductVisibility(product.id)}
                            >
                              {product.isVisible ? "Скрыть" : "Показать"}
                            </button>
                            <button
                              type="button"
                              className="btn btn_ghost btn_compact"
                              onClick={() => void toggleProductAvailability(product.id)}
                            >
                              {product.isAvailable ? "Под заказ" : "В наличии"}
                            </button>
                            <button
                              type="button"
                              className="btn btn_ghost btn_compact"
                              onClick={() => void toggleProductFeatured(product.id)}
                            >
                              {product.isFeatured ? "Снять рекомендацию" : "Рекомендовать"}
                            </button>
                            <button
                              type="button"
                              className="btn btn_ghost btn_compact"
                              disabled={isSaving("product")}
                              title="Удалить товар"
                              onClick={() => void handleDeleteProduct(product)}
                            >
                              Удалить
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </article>
          </div>
        </section>
      ) : null}

      {showWork ? (
        <section className="admin-panel__section stack">
          <div className="admin-panel__section-head">
            <div className="stack-sm admin-panel__section-copy">
              <p className="hero__eyebrow">Розыгрыш</p>
              <h2 className="section-title">Сессии, лоты и быстрые статусы</h2>
            </div>
            <div className="profile-page__meta">
              <span className="badge badge_soft">{state.giveawaySessions.length} сессий</span>
              <span className="badge badge_soft">{state.giveawayItems.length} лотов</span>
              <span className="badge badge_soft">Активная: {activeGiveaway ? activeGiveaway.title : "нет"}</span>
            </div>
          </div>

          <div className="admin-giveaway">
            <article className="card stack-sm admin-panel__card">
              <div className="row-between row-wrap">
                <div className="stack-sm">
                  <h3>{sessionForm.id ? "Редактирование сессии" : "Новая сессия"}</h3>
                  <small>Создание и обновление без ухода со страницы.</small>
                </div>
                <Link to="/giveaway" className="btn btn_secondary btn_compact">
                  Колесо и история
                </Link>
              </div>

              <form className="admin-panel__form stack" onSubmit={(event) => void submitSession(event)}>
                <div className="admin-panel__grid admin-panel__grid_compact">
                  <label className="field">
                    <span>Название</span>
                    <input
                      value={sessionForm.title}
                      onChange={(event) => setSessionForm((prev) => ({ ...prev, title: event.target.value }))}
                    />
                  </label>
                  <label className="field">
                    <span>Дата розыгрыша</span>
                    <input
                      type="datetime-local"
                      value={sessionForm.drawAt}
                      onChange={(event) => setSessionForm((prev) => ({ ...prev, drawAt: event.target.value }))}
                    />
                  </label>
                  <label className="field">
                    <span>Статус</span>
                    <select
                      value={sessionForm.status}
                      onChange={(event) =>
                        setSessionForm((prev) => ({ ...prev, status: event.target.value as GiveawaySessionStatus }))
                      }
                    >
                      <option value="draft">Черновик</option>
                      <option value="active">Активна</option>
                      <option value="completed">Завершена</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>Длительность спина, сек.</span>
                    <input
                      type="number"
                      min={2}
                      max={180}
                      value={spinDurationInput}
                      onChange={(event) => setSpinDurationInput(event.target.value)}
                    />
                  </label>
                </div>

                <label className="field">
                  <span>Описание</span>
                  <textarea
                    rows={2}
                    value={sessionForm.description}
                    onChange={(event) =>
                      setSessionForm((prev) => ({ ...prev, description: event.target.value }))
                    }
                  />
                </label>

                <div className="admin-panel__actions row-wrap">
                  <button
                    className="btn btn_primary btn_compact"
                    type="submit"
                    disabled={isSaving("giveaway")}
                    aria-busy={isSaving("giveaway")}
                  >
                    {isSaving("giveaway")
                      ? "Сохраняем..."
                      : sessionForm.id
                        ? "Сохранить сессию"
                        : "Создать сессию"}
                  </button>
                  {sessionForm.id ? (
                    <button
                      type="button"
                      className="btn btn_secondary btn_compact"
                      onClick={() => {
                        setSessionForm(createEmptySessionForm());
                        setSpinDurationInput("6");
                      }}
                    >
                      Сбросить
                    </button>
                  ) : null}
                </div>
              </form>
            </article>

            <article className="card stack-sm admin-panel__card">
              <div className="row-between row-wrap">
                <div className="stack-sm">
                  <h3>{selectedSession ? selectedSession.title : "Сессии"}</h3>
                  <small>
                    {selectedSession
                      ? `${sessionStatusLabel[selectedSession.status]} · ${new Date(selectedSession.drawAt).toLocaleString("ru-RU")}`
                      : "Создайте первую сессию"}
                  </small>
                </div>
                {selectedSession ? (
                  <div className="toolbar">
                    {selectedSession.status === "active" ? (
                      <button
                        type="button"
                        className="btn btn_secondary btn_compact"
                        disabled={isSaving("giveaway")}
                        onClick={() => void handleMoveToDraft()}
                      >
                        В черновик
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn_primary btn_compact"
                        disabled={isSaving("giveaway") || remainingItems.length === 0}
                        onClick={() => void handleActivateSession()}
                      >
                        Открыть
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn_ghost btn_compact"
                      disabled={isSaving("giveaway") || selectedSession.status === "completed"}
                      onClick={() => void handleFinishSession()}
                    >
                      Завершить
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="admin-session-list">
                {state.giveawaySessions.length === 0 ? (
                  <div className="admin-panel__empty">
                    <strong>Сессий пока нет</strong>
                    <small>Создайте первую сессию слева.</small>
                  </div>
                ) : (
                  state.giveawaySessions.map((session) => (
                    <article
                      key={session.id}
                      className={`admin-session-row${selectedSessionId === session.id ? " admin-session-row_active" : ""}`}
                    >
                      <div className="stack-sm">
                        <strong>{session.title}</strong>
                        <small>
                          {sessionStatusLabel[session.status]} · {new Date(session.drawAt).toLocaleString("ru-RU")}
                        </small>
                      </div>
                      <div className="toolbar">
                        <button
                          type="button"
                          className="btn btn_secondary btn_compact"
                          onClick={() => setSelectedSessionId(session.id)}
                        >
                          Выбрать
                        </button>
                        <button
                          type="button"
                          className="btn btn_ghost btn_compact"
                          onClick={() => {
                            setSelectedSessionId(session.id);
                            setSessionForm({
                              id: session.id,
                              title: session.title,
                              description: session.description,
                              drawAt: toDatetimeLocal(session.drawAt),
                              status: session.status
                            });
                            setSpinDurationInput(String(sessionDurationToSeconds(session.spinDurationMs)));
                          }}
                        >
                          Править
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>

              {selectedSession ? (
                <>
                  <div className="admin-panel__divider" />

                  <form
                    className="stack-sm"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void handleAddLot();
                    }}
                  >
                    <div className="row-between row-wrap">
                      <div className="stack-sm">
                        <h4>Лоты</h4>
                        <small>
                          Осталось {remainingItems.length} · результатов {sessionResults.length}
                        </small>
                      </div>
                      <span className="badge badge_soft">
                        {selectedSession.status === "active" ? "Сессия открыта" : "Сессия не открыта"}
                      </span>
                    </div>

                    <div className="admin-panel__grid admin-panel__grid_compact">
                      <label className="field">
                        <span>Добавить товар</span>
                        <select value={lotProductId} onChange={(event) => setLotProductId(event.target.value)}>
                          {availableProductsForLot.length === 0 ? (
                            <option value="">Нет доступных товаров</option>
                          ) : (
                            availableProductsForLot.map((product) => (
                              <option key={product.id} value={product.id}>
                                {product.title}
                              </option>
                            ))
                          )}
                        </select>
                      </label>
                      <div className="admin-panel__actions admin-panel__actions_bottom">
                        <button
                          type="submit"
                          className="btn btn_secondary btn_compact"
                          disabled={
                            !lotProductId ||
                            availableProductsForLot.length === 0 ||
                            isSaving("giveaway") ||
                            selectedSession.status === "completed"
                          }
                          aria-busy={isSaving("giveaway")}
                        >
                          Добавить лот
                        </button>
                      </div>
                    </div>
                  </form>

                  <div className="admin-lot-list">
                    {sessionItems.length === 0 ? (
                      <div className="admin-panel__empty">
                        <strong>Лотов пока нет</strong>
                        <small>Добавьте товары в выбранную сессию.</small>
                      </div>
                    ) : (
                      sessionItems.map((item) => {
                        const product = state.products.find((candidate) => candidate.id === item.productId);

                        return (
                          <div key={item.id} className="admin-lot-row">
                            <div className="stack-sm">
                              <strong>{product?.title ?? "Удалённый товар"}</strong>
                              <small>{item.isActive ? "В розыгрыше" : "Уже разыгран"}</small>
                            </div>
                            <button
                              type="button"
                              className="btn btn_ghost btn_compact"
                              disabled={isSaving("giveaway") || selectedSession.status === "completed" || !item.isActive}
                              onClick={() => void handleRemoveLot(item.id)}
                            >
                              Удалить
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              ) : null}
            </article>
          </div>

          {giveawayNotice ? <small className="admin-panel__notice">{giveawayNotice}</small> : null}
        </section>
      ) : null}
    </section>
  );
}

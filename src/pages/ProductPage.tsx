import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ProductMiniCard } from "../components/products/ProductMiniCard";
import { useAppContext } from "../context/AppContext";
import { buildAcquireLink, hasSellerContact } from "../lib/acquire-link";
import { PRODUCT_PLACEHOLDER_IMAGE } from "../lib/placeholders";
import {
  canViewProduct,
  getPrimaryProductImage,
  getProductImages,
  sortProducts
} from "../lib/product-utils";
import { openTelegramLink } from "../lib/telegram";
import type { Product } from "../types/entities";

function getStatusBadges(product: Product): string[] {
  const badges: string[] = [];
  if (product.status === "new") {
    badges.push("Новинка");
  }
  if (product.status === "popular" || product.isFeatured) {
    badges.push("Рекомендуем");
  }
  if (product.status === "sold_out") {
    badges.push("Продано");
  } else if (!product.isAvailable) {
    badges.push("Под заказ");
  } else {
    badges.push("В наличии");
  }
  if (product.isGiveawayEligible) {
    badges.push("Розыгрыш");
  }
  return badges;
}

export function ProductPage() {
  const { productId } = useParams();
  const {
    currentProfile,
    isAdmin,
    state,
    toggleFavorite,
    toggleProductAvailability,
    toggleProductFeatured,
    toggleProductVisibility
  } = useAppContext();
  const product = state.products.find((item) => item.id === productId);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [productId]);

  const isFavorite = useMemo(
    () =>
      state.favorites.some(
        (item) => item.profileId === currentProfile?.id && item.productId === productId
      ),
    [currentProfile?.id, productId, state.favorites]
  );

  if (!product || !canViewProduct(product, isAdmin)) {
    return (
      <div className="page">
        <section className="card empty-state">
          <h1>Товар не найден</h1>
          <Link to="/" className="btn btn_secondary">
            Вернуться в ленту
          </Link>
        </section>
      </div>
    );
  }

  const images = getProductImages(product.id, state.productImages);
  const activeImage = images[activeImageIndex]?.url ?? images[0]?.url ?? PRODUCT_PLACEHOLDER_IMAGE;
  const buyLink = buildAcquireLink(state.sellerSettings, product.title);
  const hasContact = hasSellerContact(state.sellerSettings);
  const category = state.categories.find((item) => item.id === product.categoryId);
  const recommendations = sortProducts(
    state.products
      .filter((item) => item.id !== product.id)
      .filter((item) => item.categoryId === product.categoryId)
      .filter((item) => canViewProduct(item, isAdmin)),
    "newest"
  ).slice(0, 4);

  return (
    <div className="page stack-lg product-page">
      <section className="card stack product-page__overview">
        <Link to={category ? `/catalog/${category.id}` : "/catalog"} className="text-link product-page__back-link">
          ← Назад в каталог
        </Link>

        <div className="product-page__hero-layout">
          <div className="stack-sm product-page__media-column">
            <div className="product-page__media">
              <img src={activeImage} alt={product.title} />
            </div>
            {images.length > 1 ? (
              <div className="gallery-row">
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    type="button"
                    className={`gallery-thumb${activeImageIndex === index ? " gallery-thumb_active" : ""}`}
                    onClick={() => setActiveImageIndex(index)}
                  >
                    <img src={image.url} alt={`${product.title} ${index + 1}`} />
                  </button>
                ))}
              </div>
            ) : (
              <small className="product-page__gallery-note">
                Дополнительные фото появятся после обновления карточки.
              </small>
            )}
          </div>

          <div className="stack product-page__summary">
            <div className="product-title-row">
              <div className="stack-sm product-page__title-block">
                <p className="hero__eyebrow">{category?.name ?? "Товар мастера"}</p>
                <h1>{product.title}</h1>
              </div>
              {!isAdmin ? (
                <button
                  type="button"
                  className={`icon-button${isFavorite ? " icon-button_active" : ""}`}
                  onClick={() => void toggleFavorite(product.id)}
                  aria-label={isFavorite ? "Убрать из избранного" : "Добавить в избранное"}
                >
                  {isFavorite ? "♥" : "♡"}
                </button>
              ) : null}
            </div>

            <div className="product-page__price-row">
              <p className="product-price">{product.priceText}</p>
              {!product.isVisible ? <span className="badge badge_soft">Скрытый товар</span> : null}
            </div>

            <div className="badge-row product-page__badges">
              {getStatusBadges(product).map((label) => (
                <span key={label} className="badge badge_soft">
                  {label}
                </span>
              ))}
            </div>

            <p className="product-page__description">{product.description}</p>

            <div className="product-page__action-panel">
              <div className="toolbar product-page__cta">
                {buyLink ? (
                  <button
                    type="button"
                    className="btn btn_primary"
                    onClick={() => openTelegramLink(buyLink)}
                    disabled={product.status === "sold_out"}
                  >
                    {state.sellerSettings.purchaseButtonLabel || "Приобрести"}
                  </button>
                ) : (
                  <Link to="/about" className="btn btn_secondary">
                    Контакты продавца
                  </Link>
                )}
                {!isAdmin ? (
                  <button
                    type="button"
                    className="btn btn_secondary"
                    onClick={() => void toggleFavorite(product.id)}
                  >
                    {isFavorite ? "Убрать из избранного" : "В избранное"}
                  </button>
                ) : null}
              </div>
              {hasContact ? (
                <small className="product-page__contact">
                  Связь с мастером: @{state.sellerSettings.telegramUsername || "—"} · {state.sellerSettings.city}
                </small>
              ) : (
                <small className="product-page__contact">
                  Контакты продавца пока не настроены. Их можно открыть в разделе «О мастере».
                </small>
              )}
            </div>

            {isAdmin ? (
              <div className="card stack-sm product-page__admin-panel">
                <h3>Admin actions</h3>
                <div className="toolbar">
                  <button type="button" className="btn btn_ghost btn_compact" onClick={() => void toggleProductVisibility(product.id)}>
                    {product.isVisible ? "Скрыть товар" : "Показать товар"}
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
                </div>
                <small>Управление лотами и статусом сессий выполняется на странице «Розыгрыш».</small>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="product-specs-grid">
        <div className="card product-spec-card stack-sm">
          <h3>Материалы</h3>
          <div className="chips-row">
            {product.materials.length === 0
              ? "Скоро добавим детали."
              : product.materials.map((material) => (
                  <span key={material} className="chip">
                    {material}
                  </span>
                ))}
          </div>
        </div>
        <div className="card product-spec-card stack-sm">
          <h3>Характеристики</h3>
          <ul className="plain-list">
            <li>Ручная работа мастера</li>
            <li>Упаковка для подарка по запросу</li>
            <li>Согласование деталей в личных сообщениях</li>
          </ul>
        </div>
      </section>

      <section className="stack">
        <div className="row-between row-wrap">
          <h2 className="section-title">Похожие товары</h2>
          {category ? (
            <Link to={`/catalog/${category.id}`} className="text-link">
              Больше в разделе {category.name}
            </Link>
          ) : null}
        </div>
        {recommendations.length === 0 ? (
          <div className="card empty-state">
            <p>Похожие товары скоро появятся.</p>
          </div>
        ) : (
          <div className="shelf-row">
            {recommendations.map((item) => (
              <ProductMiniCard
                key={item.id}
                product={item}
                sellerSettings={state.sellerSettings}
                imageUrl={getPrimaryProductImage(item.id, state.productImages)}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

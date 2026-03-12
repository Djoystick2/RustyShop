import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ProductMiniCard } from "../components/products/ProductMiniCard";
import { useAppContext } from "../context/AppContext";
import { buildAcquireLink } from "../lib/acquire-link";
import { PRODUCT_PLACEHOLDER_IMAGE } from "../lib/placeholders";
import {
  canViewProduct,
  getProductImages,
  getPrimaryProductImage,
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
    toggleProductGiveaway,
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
  const category = state.categories.find((item) => item.id === product.categoryId);
  const recommendations = sortProducts(
    state.products
      .filter((item) => item.id !== product.id)
      .filter((item) => item.categoryId === product.categoryId)
      .filter((item) => canViewProduct(item, isAdmin)),
    "newest"
  ).slice(0, 4);

  return (
    <div className="page stack-lg">
      <section className="card stack product-page__hero-card">
        <Link to="/" className="text-link">
          ← Назад
        </Link>
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
          <small>Дополнительные фото появятся после обновления карточки.</small>
        )}
      </section>

      <section className="card stack product-page__details">
        <div className="product-title-row">
          <h1>{product.title}</h1>
          <button
            type="button"
            className={`icon-button${isFavorite ? " icon-button_active" : ""}`}
            onClick={() => void toggleFavorite(product.id)}
            aria-label={isFavorite ? "Убрать из избранного" : "Добавить в избранное"}
          >
            {isFavorite ? "♥" : "♡"}
          </button>
        </div>
        <p className="product-price">{product.priceText}</p>
        <div className="badge-row">
          {getStatusBadges(product).map((label) => (
            <span key={label} className="badge badge_soft">
              {label}
            </span>
          ))}
          <span className="badge badge_soft">{category?.name ?? "Без категории"}</span>
          {!product.isVisible ? <span className="badge badge_soft">Скрытый товар</span> : null}
        </div>
        <p>{product.description}</p>

        <div className="product-specs-grid">
          <div className="card product-spec-card">
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
          <div className="card product-spec-card">
            <h3>Характеристики</h3>
            <ul className="plain-list">
              <li>Ручная работа мастера</li>
              <li>Упаковка для подарка по запросу</li>
              <li>Согласование деталей в личных сообщениях</li>
            </ul>
          </div>
        </div>

        <div className="toolbar product-page__cta">
          <button
            type="button"
            className="btn btn_primary"
            onClick={() => openTelegramLink(buyLink)}
            disabled={product.status === "sold_out"}
          >
            {state.sellerSettings.purchaseButtonLabel || "Приобрести"}
          </button>
          <button
            type="button"
            className="btn btn_secondary"
            onClick={() => void toggleFavorite(product.id)}
          >
            {isFavorite ? "Убрать из избранного" : "В избранное"}
          </button>
        </div>
        <small>
          Связь с мастером: @{state.sellerSettings.telegramUsername || "seller"} ·{" "}
          {state.sellerSettings.city}
        </small>

        {isAdmin ? (
          <div className="toolbar">
            <button type="button" className="btn btn_ghost" onClick={() => void toggleProductVisibility(product.id)}>
              {product.isVisible ? "Скрыть товар" : "Показать товар"}
            </button>
            <button
              type="button"
              className="btn btn_ghost"
              onClick={() => void toggleProductAvailability(product.id)}
            >
              {product.isAvailable ? "Под заказ" : "В наличии"}
            </button>
            <button type="button" className="btn btn_ghost" onClick={() => void toggleProductGiveaway(product.id)}>
              {product.isGiveawayEligible ? "Убрать из розыгрыша" : "Добавить в розыгрыш"}
            </button>
            <button type="button" className="btn btn_ghost" onClick={() => void toggleProductFeatured(product.id)}>
              {product.isFeatured ? "Снять рекомендацию" : "Рекомендовать"}
            </button>
          </div>
        ) : null}
      </section>

      <section className="stack">
        <h2 className="section-title">Похожие товары</h2>
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
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}


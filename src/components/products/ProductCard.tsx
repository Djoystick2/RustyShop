import { Link } from "react-router-dom";
import { buildAcquireLink } from "../../lib/acquire-link";
import { PRODUCT_PLACEHOLDER_IMAGE } from "../../lib/placeholders";
import { openTelegramLink } from "../../lib/telegram";
import type { Product, SellerSettings } from "../../types/entities";

interface ProductCardProps {
  product: Product;
  imageUrl?: string;
  isFavorite: boolean;
  sellerSettings: SellerSettings;
  isAdmin: boolean;
  onToggleFavorite: (productId: string) => void | Promise<void>;
  onToggleVisibility: (productId: string) => void | Promise<void>;
  onToggleAvailability: (productId: string) => void | Promise<void>;
  onToggleFeatured: (productId: string) => void | Promise<void>;
}

function buildStatusBadges(product: Product): Array<{ key: string; label: string; className: string }> {
  const badges: Array<{ key: string; label: string; className: string }> = [];
  if (product.status === "new") {
    badges.push({ key: "new", label: "Новинка", className: "badge_new" });
  }
  if (product.status === "popular" || product.isFeatured) {
    badges.push({ key: "featured", label: "Рекомендуем", className: "badge_popular" });
  }
  if (product.status === "sold_out") {
    badges.push({ key: "sold", label: "Продано", className: "badge_sold_out" });
  } else if (!product.isAvailable) {
    badges.push({ key: "preorder", label: "Под заказ", className: "badge_soft" });
  } else {
    badges.push({ key: "available", label: "В наличии", className: "badge_available" });
  }
  if (product.isGiveawayEligible) {
    badges.push({ key: "giveaway", label: "Розыгрыш", className: "badge_giveaway" });
  }
  return badges;
}

export function ProductCard({
  product,
  imageUrl,
  isFavorite,
  sellerSettings,
  isAdmin,
  onToggleFavorite,
  onToggleVisibility,
  onToggleAvailability,
  onToggleFeatured
}: ProductCardProps) {
  const buyLink = buildAcquireLink(sellerSettings, product.title);
  const canBuyViaTelegram = Boolean(buyLink);
  const mediaSrc = imageUrl ?? PRODUCT_PLACEHOLDER_IMAGE;
  const statusBadges = buildStatusBadges(product);
  const availabilityNote =
    product.status === "sold_out"
      ? "Товар уже нашёл владельца, но можно запросить похожую работу."
      : product.isAvailable
        ? "Можно оформить прямо сейчас."
        : "Изделие доступно под заказ.";

  return (
    <article className={`card product-card${product.isVisible ? "" : " product-card_hidden"}`}>
      <Link to={`/product/${product.id}`} className="product-card__media">
        <img src={mediaSrc} alt={product.title} loading="lazy" />
      </Link>

      <div className="product-card__content">
        <div className="product-card__top">
          <div className="badge-row product-card__badges">
            {statusBadges.map((badge) => (
              <span key={badge.key} className={`badge ${badge.className}`}>
                {badge.label}
              </span>
            ))}
          </div>
          {!isAdmin ? (
            <button
              type="button"
              className={`icon-button${isFavorite ? " icon-button_active" : ""}`}
              onClick={() => void onToggleFavorite(product.id)}
              aria-label={isFavorite ? "Убрать из избранного" : "Добавить в избранное"}
            >
              {isFavorite ? "♥" : "♡"}
            </button>
          ) : null}
        </div>

        <div className="product-card__summary">
          <Link to={`/product/${product.id}`} className="product-card__title">
            {product.title}
          </Link>
          <p className="product-card__description">{product.description}</p>
          <div className="product-card__meta">
            <p className="product-card__price">{product.priceText}</p>
            <small className="product-card__note">{availabilityNote}</small>
          </div>
        </div>

        <div className="product-card__actions">
          {canBuyViaTelegram ? (
            <button
              type="button"
              className="btn btn_primary btn_compact"
              onClick={() => openTelegramLink(buyLink!)}
              disabled={product.status === "sold_out"}
            >
              {sellerSettings.purchaseButtonLabel || "Приобрести"}
            </button>
          ) : (
            <Link to="/about" className="btn btn_secondary btn_compact">
              Контакты продавца
            </Link>
          )}
          {!isAdmin ? (
            <Link to={`/product/${product.id}`} className="btn btn_secondary btn_compact">
              Подробнее
            </Link>
          ) : (
            <Link to={`/product/${product.id}`} className="btn btn_secondary btn_compact">
              Открыть управление
            </Link>
          )}
        </div>

        {isAdmin ? (
          <div className="product-card__admin-actions">
            <button type="button" className="btn btn_ghost btn_compact" onClick={() => void onToggleVisibility(product.id)}>
              {product.isVisible ? "Скрыть" : "Показать"}
            </button>
            <button
              type="button"
              className="btn btn_ghost btn_compact"
              onClick={() => void onToggleAvailability(product.id)}
            >
              {product.isAvailable ? "Под заказ" : "В наличии"}
            </button>
            <button type="button" className="btn btn_ghost btn_compact" onClick={() => void onToggleFeatured(product.id)}>
              {product.isFeatured ? "Снять рекомендацию" : "Рекомендовать"}
            </button>
          </div>
        ) : null}
      </div>
    </article>
  );
}

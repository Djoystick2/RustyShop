import { Link } from "react-router-dom";
import { buildAcquireLink } from "../../lib/acquire-link";
import { PRODUCT_PLACEHOLDER_IMAGE } from "../../lib/placeholders";
import { openTelegramLink } from "../../lib/telegram";
import type { Product, SellerSettings } from "../../types/entities";

interface ProductMiniCardProps {
  product: Product;
  imageUrl?: string;
  sellerSettings: SellerSettings;
  isAdmin?: boolean;
}

export function ProductMiniCard({
  product,
  imageUrl,
  sellerSettings,
  isAdmin = false
}: ProductMiniCardProps) {
  const mediaSrc = imageUrl ?? PRODUCT_PLACEHOLDER_IMAGE;
  const buyLink = buildAcquireLink(sellerSettings, product.title);
  const canBuyViaTelegram = Boolean(buyLink);
  const hasBadges = product.status === "new" || product.isFeatured || product.isGiveawayEligible;
  const availabilityLabel =
    product.status === "sold_out" ? "Продано" : product.isAvailable ? "В наличии" : "Под заказ";

  return (
    <article className="mini-product-card">
      <Link to={`/product/${product.id}`} className="mini-product-card__media">
        <img src={mediaSrc} alt={product.title} loading="lazy" />
      </Link>
      <div className="mini-product-card__content">
        <Link to={`/product/${product.id}`} className="mini-product-card__title">
          {product.title}
        </Link>
        <div className="mini-product-card__meta">
          <p className="mini-product-card__price">{product.priceText}</p>
          <small className="mini-product-card__status">{availabilityLabel}</small>
        </div>
        {hasBadges ? (
          <div className="badge-row mini-product-card__badges">
            {product.status === "new" ? <span className="badge badge_new">Новинка</span> : null}
            {product.isFeatured ? <span className="badge badge_popular">Рекомендуем</span> : null}
            {product.isGiveawayEligible ? <span className="badge badge_giveaway">Розыгрыш</span> : null}
          </div>
        ) : null}
        {!isAdmin ? (
          canBuyViaTelegram ? (
            <button
              type="button"
              className="btn btn_secondary btn_compact mini-product-card__action"
              onClick={() => openTelegramLink(buyLink!)}
              disabled={product.status === "sold_out"}
            >
              {sellerSettings.purchaseButtonLabel || "Приобрести"}
            </button>
          ) : (
            <Link to="/about" className="btn btn_secondary btn_compact mini-product-card__action">
              Контакты
            </Link>
          )
        ) : (
          <Link to={`/product/${product.id}`} className="btn btn_secondary btn_compact mini-product-card__action">
            Открыть
          </Link>
        )}
      </div>
    </article>
  );
}

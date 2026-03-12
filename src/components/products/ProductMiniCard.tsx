import { Link } from "react-router-dom";
import { buildAcquireLink } from "../../lib/acquire-link";
import { openTelegramLink } from "../../lib/telegram";
import type { Product, SellerSettings } from "../../types/entities";

interface ProductMiniCardProps {
  product: Product;
  imageUrl?: string;
  sellerSettings: SellerSettings;
}

const fallbackImage =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='480'%3E%3Crect width='100%25' height='100%25' fill='%23ffe6c7'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' font-family='Verdana' font-size='28' fill='%235c3d2e'%3EФото скоро%3C/text%3E%3C/svg%3E";

export function ProductMiniCard({ product, imageUrl, sellerSettings }: ProductMiniCardProps) {
  const mediaSrc = imageUrl ?? fallbackImage;
  const buyLink = buildAcquireLink(sellerSettings, product.title);

  return (
    <article className="mini-product-card">
      <Link to={`/product/${product.id}`} className="mini-product-card__media">
        <img src={mediaSrc} alt={product.title} />
      </Link>
      <div className="mini-product-card__content">
        <Link to={`/product/${product.id}`} className="mini-product-card__title">
          {product.title}
        </Link>
        <div className="badge-row">
          {product.status === "new" ? <span className="badge badge_new">Новинка</span> : null}
          {product.isFeatured ? <span className="badge badge_popular">Рекомендуем</span> : null}
          {product.isGiveawayEligible ? <span className="badge badge_giveaway">Розыгрыш</span> : null}
        </div>
        <p className="mini-product-card__price">{product.priceText}</p>
        <button
          type="button"
          className="btn btn_secondary"
          onClick={() => openTelegramLink(buyLink)}
          disabled={!product.isAvailable}
        >
          {sellerSettings.purchaseButtonLabel || "Приобрести"}
        </button>
      </div>
    </article>
  );
}

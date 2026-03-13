import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import { buildAcquireLink, hasSellerContact } from "../../lib/acquire-link";
import { PRODUCT_PLACEHOLDER_IMAGE } from "../../lib/placeholders";
import { openTelegramLink } from "../../lib/telegram";
import type { Product } from "../../types/entities";

interface ProductQuickViewModalProps {
  product: Product;
  imageUrl?: string;
  onClose: () => void;
}

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

export function ProductQuickViewModal({ product, imageUrl, onClose }: ProductQuickViewModalProps) {
  const {
    currentProfile,
    isAdmin,
    state,
    toggleFavorite,
    toggleProductAvailability,
    toggleProductFeatured,
    toggleProductVisibility
  } = useAppContext();

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  const isFavorite = useMemo(
    () =>
      state.favorites.some(
        (item) => item.profileId === currentProfile?.id && item.productId === product.id
      ),
    [currentProfile?.id, product.id, state.favorites]
  );

  const buyLink = buildAcquireLink(state.sellerSettings, product);
  const hasContact = hasSellerContact(state.sellerSettings);
  const category = state.categories.find((item) => item.id === product.categoryId);
  const badges = getStatusBadges(product);
  const previewImage = imageUrl ?? PRODUCT_PLACEHOLDER_IMAGE;

  return (
    <div className="product-quick-view" role="dialog" aria-modal="true" aria-labelledby="quick-view-title">
      <button type="button" className="product-quick-view__backdrop" aria-label="Закрыть" onClick={onClose} />
      <section className="product-quick-view__sheet">
        <div className="product-quick-view__handle" aria-hidden="true" />
        <div className="product-quick-view__head">
          <p className="product-quick-view__eyebrow">{category?.name ?? "Товар"}</p>
          <button type="button" className="icon-button product-quick-view__close" onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </div>

        <div className="product-quick-view__media">
          <img src={previewImage} alt={product.title} loading="lazy" />
        </div>

        <div className="product-quick-view__body stack">
          <div className="stack-sm">
            <h2 id="quick-view-title">{product.title}</h2>
            <p className="product-price">{product.priceText}</p>
          </div>

          <div className="badge-row">
            {badges.map((label) => (
              <span key={label} className="badge badge_soft">
                {label}
              </span>
            ))}
            {!product.isVisible ? <span className="badge badge_soft">Скрытый товар</span> : null}
          </div>

          <p>{product.description}</p>

          {product.materials.length > 0 ? (
            <div className="chips-row">
              {product.materials.map((material) => (
                <span key={material} className="chip">
                  {material}
                </span>
              ))}
            </div>
          ) : null}

          <div className="toolbar product-quick-view__actions">
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
              <Link to="/about" className="btn btn_secondary" onClick={onClose}>
                Контакты продавца
              </Link>
            )}
            {!isAdmin ? (
              <button type="button" className="btn btn_secondary" onClick={() => void toggleFavorite(product.id)}>
                {isFavorite ? "Убрать из избранного" : "В избранное"}
              </button>
            ) : null}
            <Link to={`/product/${product.id}`} className="btn btn_ghost" onClick={onClose}>
              Открыть полный экран
            </Link>
          </div>

          {hasContact ? (
            <small>
              Связь с мастером: @{state.sellerSettings.telegramUsername || "—"} · {state.sellerSettings.city}
            </small>
          ) : (
            <small>Контакты продавца пока не настроены. Их можно открыть в разделе «О мастере».</small>
          )}

          {isAdmin ? (
            <div className="card stack-sm product-quick-view__admin">
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
                <button type="button" className="btn btn_ghost" onClick={() => void toggleProductFeatured(product.id)}>
                  {product.isFeatured ? "Снять рекомендацию" : "Рекомендовать"}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

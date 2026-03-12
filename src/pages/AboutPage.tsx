import { useMemo } from "react";
import { ProductMiniCard } from "../components/products/ProductMiniCard";
import { useAppContext } from "../context/AppContext";
import { buildSellerContactLink } from "../lib/acquire-link";
import { getPrimaryProductImage } from "../lib/product-utils";
import { openTelegramLink } from "../lib/telegram";

export function AboutPage() {
  const { state } = useAppContext();

  const featuredProducts = useMemo(
    () => state.products.filter((item) => item.isFeatured && item.isVisible).slice(0, 4),
    [state.products]
  );

  return (
    <div className="page stack-lg">
      <section className="card about-hero">
        <div className="about-hero__avatar-wrap">
          {state.sellerSettings.avatarUrl ? (
            <img
              className="about-hero__avatar"
              src={state.sellerSettings.avatarUrl}
              alt={state.sellerSettings.sellerName}
            />
          ) : (
            <div className="about-hero__avatar about-hero__avatar_placeholder" aria-hidden>
              🧵
            </div>
          )}
        </div>
        <div className="stack-sm">
          <p className="hero__eyebrow">О мастере</p>
          <h1>{state.sellerSettings.sellerName}</h1>
          <p>{state.sellerSettings.shortBio || state.sellerSettings.aboutSeller}</p>
          <div className="toolbar">
            <button
              type="button"
              className="btn btn_primary"
              onClick={() =>
                openTelegramLink(
                  buildSellerContactLink(
                    state.sellerSettings,
                    "Здравствуйте! Хочу обсудить заказ и детали изготовления."
                  )
                )
              }
            >
              Написать мастеру
            </button>
          </div>
          <div className="about-hero__meta">
            <span className="chip">@{state.sellerSettings.telegramUsername || "seller"}</span>
            <span className="chip">{state.sellerSettings.city || "Город не указан"}</span>
          </div>
        </div>
      </section>

      <section className="card stack">
        <h2 className="section-title">История бренда</h2>
        <p>{state.sellerSettings.brandStory || state.sellerSettings.aboutSeller}</p>
      </section>

      <section className="card stack">
        <h2 className="section-title">Философия и подход</h2>
        <p>{state.sellerSettings.philosophy || "Теплые изделия ручной работы для дома и подарков."}</p>
        <p>{state.sellerSettings.materialsFocus || "Натуральные и качественные материалы."}</p>
      </section>

      <section className="card stack">
        <h2 className="section-title">Контакты</h2>
        <p>{state.sellerSettings.contactText}</p>
        <div className="about-contact-grid">
          <small>
            Telegram: @{state.sellerSettings.telegramUsername || "seller"}
          </small>
          <small>Город: {state.sellerSettings.city || "не указан"}</small>
        </div>
      </section>

      <section className="stack">
        <h2 className="section-title">Избранные работы</h2>
        {featuredProducts.length === 0 ? (
          <div className="card empty-state">
            <p>Подборка скоро появится.</p>
          </div>
        ) : (
          <div className="shelf-row">
            {featuredProducts.map((product) => (
              <ProductMiniCard
                key={product.id}
                product={product}
                sellerSettings={state.sellerSettings}
                imageUrl={getPrimaryProductImage(product.id, state.productImages)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}


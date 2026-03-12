import { useMemo } from "react";
import { useAppContext } from "../context/AppContext";
import { buildSellerContactLink } from "../lib/acquire-link";
import { openTelegramLink } from "../lib/telegram";
import { ProductMiniCard } from "../components/products/ProductMiniCard";
import { getPrimaryProductImage } from "../lib/product-utils";

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
            <div className="about-hero__avatar about-hero__avatar_placeholder" />
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
        <small>
          Telegram: @{state.sellerSettings.telegramUsername || "seller"} · Город:{" "}
          {state.sellerSettings.city || "не указан"}
        </small>
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

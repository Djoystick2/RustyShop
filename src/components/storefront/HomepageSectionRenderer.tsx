import { Link } from "react-router-dom";
import { ProductMiniCard } from "../products/ProductMiniCard";
import { getPrimaryProductImage } from "../../lib/product-utils";
import type { Category, HomepageSection, Product, ProductImage, SellerSettings, StoreSettings } from "../../types/entities";

interface HomepageSectionRendererProps {
  section: HomepageSection;
  products: Product[];
  categories: Category[];
  productImages: ProductImage[];
  storeSettings: StoreSettings;
  sellerSettings: SellerSettings;
}

function renderProductShelf(
  products: Product[],
  sellerSettings: SellerSettings,
  productImages: ProductImage[],
  emptyText: string
) {
  if (products.length === 0) {
    return (
      <div className="card empty-state">
        <p>{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="shelf-row">
      {products.map((product) => (
        <ProductMiniCard
          key={product.id}
          product={product}
          sellerSettings={sellerSettings}
          imageUrl={getPrimaryProductImage(product.id, productImages)}
        />
      ))}
    </div>
  );
}

export function HomepageSectionRenderer({
  section,
  products,
  categories,
  productImages,
  storeSettings,
  sellerSettings
}: HomepageSectionRendererProps) {
  if (!section.isEnabled) {
    return null;
  }

  if (section.type === "hero") {
    return (
      <section className="card hero hero_showcase">
        <p className="hero__eyebrow">{storeSettings.heroBadge || "Ручная работа"}</p>
        <h1>
          {storeSettings.mascotEmoji ? `${storeSettings.mascotEmoji} ` : ""}
          {storeSettings.storeName}
        </h1>
        <p>{storeSettings.brandSlogan || storeSettings.welcomeText}</p>
        <p className="hero__soft">{storeSettings.storeDescription}</p>
        <div className="toolbar">
          <Link to="/catalog" className="btn btn_primary">
            Смотреть каталог
          </Link>
          <Link to="/about" className="btn btn_secondary">
            О мастере
          </Link>
        </div>
      </section>
    );
  }

  if (section.type === "about") {
    return (
      <section className="card stack">
        <h2 className="section-title">{section.title || "О мастере"}</h2>
        <p>{section.content || sellerSettings.shortBio || sellerSettings.aboutSeller}</p>
        <div className="toolbar">
          <Link to="/about" className="btn btn_secondary">
            Подробнее о бренде
          </Link>
        </div>
      </section>
    );
  }

  if (section.type === "promo") {
    return (
      <section className="card promo-card">
        <h2 className="section-title">{section.title || storeSettings.promoTitle || "Промо-блок"}</h2>
        <p>{section.content || storeSettings.promoText || "Свяжитесь с мастером для индивидуального заказа."}</p>
      </section>
    );
  }

  if (section.type === "category_pick") {
    const category = categories.find((item) => item.id === section.linkedCategoryId);
    return (
      <section className="stack">
        <div className="row-between row-wrap">
          <h2 className="section-title">{section.title || "Подборка категории"}</h2>
          {category ? (
            <Link to={`/catalog/${category.id}`} className="text-link">
              {category.emoji} {category.name}
            </Link>
          ) : null}
        </div>
        {renderProductShelf(products, sellerSettings, productImages, "В этой подборке пока нет товаров.")}
      </section>
    );
  }

  if (section.type === "seasonal_pick") {
    return (
      <section className="stack">
        <h2 className="section-title">{section.title || "Сезонная подборка"}</h2>
        {section.subtitle ? <p className="section-subtitle">{section.subtitle}</p> : null}
        {renderProductShelf(products, sellerSettings, productImages, "Сезонная подборка пока пуста.")}
      </section>
    );
  }

  if (section.type === "new_arrivals") {
    return (
      <section className="stack">
        <h2 className="section-title">{section.title || "Новинки"}</h2>
        {section.subtitle ? <p className="section-subtitle">{section.subtitle}</p> : null}
        {renderProductShelf(products, sellerSettings, productImages, "Новинок пока нет.")}
      </section>
    );
  }

  if (section.type === "recommended") {
    return (
      <section className="stack">
        <h2 className="section-title">{section.title || "Рекомендуем"}</h2>
        {section.subtitle ? <p className="section-subtitle">{section.subtitle}</p> : null}
        {renderProductShelf(products, sellerSettings, productImages, "Рекомендации скоро появятся.")}
      </section>
    );
  }

  if (section.type === "giveaway") {
    return (
      <section className="stack">
        <h2 className="section-title">{section.title || "Участвуют в розыгрыше"}</h2>
        {section.subtitle ? <p className="section-subtitle">{section.subtitle}</p> : null}
        {renderProductShelf(products, sellerSettings, productImages, "Сейчас нет товаров в розыгрыше.")}
      </section>
    );
  }

  return null;
}

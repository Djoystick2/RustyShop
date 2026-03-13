import { useMemo, useState } from "react";
import { ProductQuickViewModal } from "../components/products/ProductQuickViewModal";
import { HomepageSectionRenderer } from "../components/storefront/HomepageSectionRenderer";
import { StorefrontProductList } from "../components/storefront/StorefrontProductList";
import { useAppContext } from "../context/AppContext";
import { getCategoryProducts } from "../lib/catalog";
import { canViewProduct, filterProducts, sortProducts } from "../lib/product-utils";
import type { Category, HomepageSection, Product } from "../types/entities";

function pickSectionProducts(
  section: HomepageSection,
  categories: Category[],
  products: Product[],
  newProducts: Product[],
  recommendedProducts: Product[],
  giveawayProducts: Product[]
): Product[] {
  if (section.type === "new_arrivals") {
    return newProducts;
  }
  if (section.type === "recommended") {
    return recommendedProducts;
  }
  if (section.type === "giveaway") {
    return giveawayProducts;
  }
  if (section.type === "category_pick") {
    return section.linkedCategoryId
      ? getCategoryProducts(products, categories, section.linkedCategoryId).slice(0, 6)
      : [];
  }
  if (section.type === "seasonal_pick") {
    if (section.linkedProductIds.length > 0) {
      const byIds = section.linkedProductIds
        .map((id) => products.find((item) => item.id === id))
        .filter((item): item is Product => Boolean(item));
      if (byIds.length > 0) {
        return byIds;
      }
    }
    return products.filter((item) => item.isFeatured || item.status === "new").slice(0, 6);
  }
  return [];
}

export function FeedPage() {
  const {
    currentProfile,
    isAdmin,
    state,
    isSaving,
    setSearchQuery,
    toggleFavorite,
    toggleProductAvailability,
    toggleProductFeatured,
    toggleProductVisibility
  } = useAppContext();

  const [quickView, setQuickView] = useState<{ product: Product; imageUrl?: string } | null>(null);

  const favoritesSet = useMemo(
    () =>
      new Set(
        state.favorites
          .filter((item) => item.profileId === currentProfile?.id)
          .map((item) => item.productId)
      ),
    [currentProfile?.id, state.favorites]
  );

  const storefrontProducts = useMemo(
    () => state.products.filter((product) => canViewProduct(product, isAdmin)),
    [isAdmin, state.products]
  );

  const searchProducts = useMemo(
    () => filterProducts(storefrontProducts, { query: state.searchQuery }),
    [state.searchQuery, storefrontProducts]
  );

  const newProducts = useMemo(
    () => sortProducts(storefrontProducts.filter((item) => item.status === "new"), "newest").slice(0, 6),
    [storefrontProducts]
  );

  const recommendedProducts = useMemo(() => {
    const favoriteScores = new Map<string, number>();
    state.favorites.forEach((item) => {
      favoriteScores.set(item.productId, (favoriteScores.get(item.productId) ?? 0) + 1);
    });

    return [...storefrontProducts]
      .sort((a, b) => {
        if (a.isFeatured !== b.isFeatured) {
          return a.isFeatured ? -1 : 1;
        }
        const scoreDiff = (favoriteScores.get(b.id) ?? 0) - (favoriteScores.get(a.id) ?? 0);
        if (scoreDiff !== 0) {
          return scoreDiff;
        }
        if (a.status === "popular" && b.status !== "popular") {
          return -1;
        }
        if (b.status === "popular" && a.status !== "popular") {
          return 1;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .slice(0, 6);
  }, [state.favorites, storefrontProducts]);

  const giveawayProducts = useMemo(
    () => storefrontProducts.filter((product) => product.isGiveawayEligible).slice(0, 6),
    [storefrontProducts]
  );

  const homepageSections = useMemo(
    () =>
      [...state.homepageSections]
        .filter((item) => item.isEnabled)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [state.homepageSections]
  );

  function openQuickView(product: Product, imageUrl?: string) {
    setQuickView({ product, imageUrl });
  }

  return (
    <>
      <div className="page stack-lg">
        <section className="card stack">
          <label className="field">
            <span>Поиск по товарам</span>
            <input
              value={state.searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Например: свеча, игрушка, серьги"
            />
          </label>
          {isSaving("product") ? <small>Сохраняем изменения по товарам...</small> : null}
        </section>

        {state.searchQuery.trim() ? (
          <section className="stack">
            <h2 className="section-title">Результаты поиска</h2>
            <StorefrontProductList
              products={searchProducts}
              productImages={state.productImages}
              sellerSettings={state.sellerSettings}
              isAdmin={isAdmin}
              favoritesSet={favoritesSet}
              onToggleFavorite={toggleFavorite}
              onToggleVisibility={toggleProductVisibility}
              onToggleAvailability={toggleProductAvailability}
              onToggleFeatured={toggleProductFeatured}
              emptyTitle="Ничего не найдено"
              emptyMessage="Попробуйте другое слово или очистите поиск."
            />
          </section>
        ) : (
          homepageSections.map((section) => (
            <HomepageSectionRenderer
              key={section.id}
              section={section}
              products={pickSectionProducts(
                section,
                state.categories,
                storefrontProducts,
                newProducts,
                recommendedProducts,
                giveawayProducts
              )}
              categories={state.categories}
              productImages={state.productImages}
              storeSettings={state.storeSettings}
              sellerSettings={state.sellerSettings}
              isAdmin={isAdmin}
              onOpenProduct={openQuickView}
            />
          ))
        )}
      </div>

      {quickView ? (
        <ProductQuickViewModal
          product={quickView.product}
          imageUrl={quickView.imageUrl}
          onClose={() => setQuickView(null)}
        />
      ) : null}
    </>
  );
}

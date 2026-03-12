import { useMemo, useState } from "react";
import { ProductCard } from "../components/products/ProductCard";
import { HomepageSectionRenderer } from "../components/storefront/HomepageSectionRenderer";
import { useAppContext } from "../context/AppContext";
import {
  canViewProduct,
  filterProducts,
  getPrimaryProductImage,
  sortProducts,
  type ProductSortMode
} from "../lib/product-utils";
import type { HomepageSection, Product } from "../types/entities";

function pickSectionProducts(
  section: HomepageSection,
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
    return products
      .filter((item) => item.categoryId === section.linkedCategoryId)
      .slice(0, 6);
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

  const [listFilter, setListFilter] = useState<"all" | "available" | "giveaway">("all");
  const [listSort, setListSort] = useState<ProductSortMode>("newest");

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

  const listingProducts = useMemo(() => {
    const filtered = filterProducts(storefrontProducts, {
      query: state.searchQuery,
      onlyAvailable: listFilter === "available",
      onlyGiveaway: listFilter === "giveaway"
    });
    return sortProducts(filtered, listSort);
  }, [listFilter, listSort, state.searchQuery, storefrontProducts]);

  const homepageSections = useMemo(
    () =>
      [...state.homepageSections]
        .filter((item) => item.isEnabled)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [state.homepageSections]
  );

  return (
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
          {searchProducts.length === 0 ? (
            <div className="card empty-state">
              <h3>Ничего не найдено</h3>
              <p>Попробуйте другое слово или очистите поиск.</p>
            </div>
          ) : (
            searchProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                imageUrl={getPrimaryProductImage(product.id, state.productImages)}
                isFavorite={favoritesSet.has(product.id)}
                sellerSettings={state.sellerSettings}
                isAdmin={isAdmin}
                onToggleFavorite={toggleFavorite}
                onToggleVisibility={toggleProductVisibility}
                onToggleAvailability={toggleProductAvailability}
                onToggleFeatured={toggleProductFeatured}
              />
            ))
          )}
        </section>
      ) : (
        homepageSections.map((section) => (
          <HomepageSectionRenderer
            key={section.id}
            section={section}
            products={pickSectionProducts(
              section,
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
          />
        ))
      )}

      <section className="stack">
        <div className="row-between row-wrap">
          <h2 className="section-title">Вся витрина</h2>
          <div className="toolbar">
            <button
              type="button"
              className={`btn btn_secondary${listFilter === "all" ? " btn_active" : ""}`}
              onClick={() => setListFilter("all")}
            >
              Все
            </button>
            <button
              type="button"
              className={`btn btn_secondary${listFilter === "available" ? " btn_active" : ""}`}
              onClick={() => setListFilter("available")}
            >
              В наличии
            </button>
            <button
              type="button"
              className={`btn btn_secondary${listFilter === "giveaway" ? " btn_active" : ""}`}
              onClick={() => setListFilter("giveaway")}
            >
              Розыгрыш
            </button>
            <select
              className="compact-select"
              value={listSort}
              onChange={(event) => setListSort(event.target.value as ProductSortMode)}
            >
              <option value="newest">Сначала новые</option>
              <option value="title">По названию</option>
              <option value="price_asc">Цена по возрастанию</option>
              <option value="price_desc">Цена по убыванию</option>
            </select>
          </div>
        </div>
        {listingProducts.length === 0 ? (
          <div className="card empty-state">
            <h3>Пока нечего показать</h3>
            <p>Измените фильтры или добавьте товары в админке.</p>
          </div>
        ) : (
          listingProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              imageUrl={getPrimaryProductImage(product.id, state.productImages)}
              isFavorite={favoritesSet.has(product.id)}
              sellerSettings={state.sellerSettings}
              isAdmin={isAdmin}
              onToggleFavorite={toggleFavorite}
              onToggleVisibility={toggleProductVisibility}
              onToggleAvailability={toggleProductAvailability}
              onToggleFeatured={toggleProductFeatured}
            />
          ))
        )}
      </section>
    </div>
  );
}

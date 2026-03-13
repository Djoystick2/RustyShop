import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CategoryTile } from "../components/storefront/CategoryTile";
import { StorefrontProductList } from "../components/storefront/StorefrontProductList";
import { useAppContext } from "../context/AppContext";
import { getCategoryProducts, getCategoryTrail, getChildCategories } from "../lib/catalog";
import {
  canViewProduct,
  filterProducts,
  sortProducts,
  type ProductSortMode
} from "../lib/product-utils";

export function CategoryPage() {
  const { categoryId } = useParams();
  const {
    currentProfile,
    isAdmin,
    state,
    isSaving,
    toggleFavorite,
    toggleProductAvailability,
    toggleProductFeatured,
    toggleProductVisibility
  } = useAppContext();

  const [searchQuery, setSearchQuery] = useState("");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [onlyGiveaway, setOnlyGiveaway] = useState(false);
  const [sortMode, setSortMode] = useState<ProductSortMode>("newest");

  const category = state.categories.find((item) => item.id === categoryId);

  const favoritesSet = useMemo(
    () =>
      new Set(
        state.favorites
          .filter((item) => item.profileId === currentProfile?.id)
          .map((item) => item.productId)
      ),
    [currentProfile?.id, state.favorites]
  );

  const visibleSubcategories = useMemo(
    () =>
      category
        ? getChildCategories(state.categories, category.id).filter((item) => (isAdmin ? true : item.isVisible))
        : [],
    [category, isAdmin, state.categories]
  );

  const directCategoryProducts = useMemo(
    () =>
      category
        ? state.products.filter((item) => item.categoryId === category.id && canViewProduct(item, isAdmin))
        : [],
    [category, isAdmin, state.products]
  );

  const products = useMemo(
    () =>
      sortProducts(
        filterProducts(directCategoryProducts, {
          query: searchQuery,
          onlyAvailable,
          onlyGiveaway
        }),
        sortMode
      ),
    [directCategoryProducts, onlyAvailable, onlyGiveaway, searchQuery, sortMode]
  );

  const trail = useMemo(
    () => (category ? getCategoryTrail(state.categories, category.id) : []),
    [category, state.categories]
  );

  if (!category) {
    return (
      <div className="page">
        <section className="card empty-state">
          <h1>РљР°С‚РµРіРѕСЂРёСЏ РЅРµ РЅР°Р№РґРµРЅР°</h1>
          <Link to="/catalog" className="btn btn_secondary">
            Р’РµСЂРЅСѓС‚СЊСЃСЏ РІ РєР°С‚Р°Р»РѕРі
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="page stack-lg category-page">
      <section className="card stack category-page__hero">
        <div className="toolbar category-page__breadcrumbs">
          <Link to="/catalog" className="text-link">
            Каталог
          </Link>
          {trail.slice(0, -1).map((item) => (
            <Link key={item.id} to={`/catalog/${item.id}`} className="text-link">
              / {item.name}
            </Link>
          ))}
        </div>

        {category.bannerUrl || category.imageUrl ? (
          <div className="category-page__banner">
            <img src={category.bannerUrl || category.imageUrl} alt={category.name} loading="lazy" />
          </div>
        ) : null}

        <div className="category-page__heading">
          <div className="stack-sm">
            <p className="hero__eyebrow">
              {visibleSubcategories.length > 0 ? "Раздел каталога" : "Подборка категории"}
            </p>
            <h1>
              {category.emoji} {category.name}
            </h1>
            <p>{category.description}</p>
          </div>
          <div className="category-page__summary">
            <span className="badge badge_soft">{visibleSubcategories.length} подкатегорий</span>
            <span className="badge badge_soft">{directCategoryProducts.length} товаров</span>
          </div>
        </div>
      </section>

      {visibleSubcategories.length > 0 ? (
        <section className="stack">
          <div className="row-between row-wrap">
            <h2 className="section-title">Подкатегории</h2>
            <small className="admin-panel__helper">Сначала выберите нужный вложенный раздел.</small>
          </div>
          <div className="category-grid catalog-page__grid">
            {visibleSubcategories.map((subcategory) => {
              const subcategoryProducts = getCategoryProducts(
                state.products.filter((item) => canViewProduct(item, isAdmin)),
                state.categories,
                subcategory.id
              );

              return (
                <CategoryTile
                  key={subcategory.id}
                  category={subcategory}
                  href={`/catalog/${subcategory.id}`}
                  productCount={subcategoryProducts.length}
                  detailText={`Товаров: ${subcategoryProducts.length}`}
                  previewText={subcategoryProducts.slice(0, 2).map((item) => item.title).join(" • ")}
                />
              );
            })}
          </div>
        </section>
      ) : null}

      {directCategoryProducts.length > 0 || visibleSubcategories.length === 0 ? (
        <>
          <section className="card stack category-page__filters">
            <label className="field">
              <span>РџРѕРёСЃРє РІРЅСѓС‚СЂРё РєР°С‚РµРіРѕСЂРёРё</span>
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="РќР°Р·РІР°РЅРёРµ, РѕРїРёСЃР°РЅРёРµ РёР»Рё РјР°С‚РµСЂРёР°Р»"
              />
            </label>
            <div className="toolbar">
              <button
                type="button"
                className={`btn btn_secondary${onlyAvailable ? " btn_active" : ""}`}
                onClick={() => setOnlyAvailable((prev) => !prev)}
              >
                РўРѕР»СЊРєРѕ РІ РЅР°Р»РёС‡РёРё
              </button>
              <button
                type="button"
                className={`btn btn_secondary${onlyGiveaway ? " btn_active" : ""}`}
                onClick={() => setOnlyGiveaway((prev) => !prev)}
              >
                РўРѕР»СЊРєРѕ СЂРѕР·С‹РіСЂС‹С€
              </button>
              <select
                className="compact-select"
                value={sortMode}
                onChange={(event) => setSortMode(event.target.value as ProductSortMode)}
              >
                <option value="newest">РЎРЅР°С‡Р°Р»Р° РЅРѕРІС‹Рµ</option>
                <option value="title">РџРѕ РЅР°Р·РІР°РЅРёСЋ</option>
                <option value="price_asc">Р¦РµРЅР° РїРѕ РІРѕР·СЂР°СЃС‚Р°РЅРёСЋ</option>
                <option value="price_desc">Р¦РµРЅР° РїРѕ СѓР±С‹РІР°РЅРёСЋ</option>
              </select>
            </div>
            {isSaving("product") ? <small>РЎРѕС…СЂР°РЅСЏРµРј С‚РѕРІР°СЂРЅС‹Рµ РёР·РјРµРЅРµРЅРёСЏ...</small> : null}
          </section>

          <StorefrontProductList
            products={products}
            productImages={state.productImages}
            sellerSettings={state.sellerSettings}
            isAdmin={isAdmin}
            favoritesSet={favoritesSet}
            onToggleFavorite={toggleFavorite}
            onToggleVisibility={toggleProductVisibility}
            onToggleAvailability={toggleProductAvailability}
            onToggleFeatured={toggleProductFeatured}
            emptyTitle="Р’ СЌС‚РѕР№ РєР°С‚РµРіРѕСЂРёРё РЅРµС‚ С‚РѕРІР°СЂРѕРІ РїРѕ С‚РµРєСѓС‰РёРј С„РёР»СЊС‚СЂР°Рј"
            emptyMessage="РЎР±СЂРѕСЃСЊС‚Рµ С„РёР»СЊС‚СЂС‹ РёР»Рё РІРµСЂРЅРёС‚РµСЃСЊ РїРѕР·Р¶Рµ."
            className="storefront-product-list category-page__listing"
          />
        </>
      ) : null}
    </div>
  );
}

import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ProductCard } from "../components/products/ProductCard";
import { useAppContext } from "../context/AppContext";
import {
  canViewProduct,
  filterProducts,
  getPrimaryProductImage,
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

  const categoryProducts = useMemo(
    () =>
      state.products.filter((item) => item.categoryId === categoryId && canViewProduct(item, isAdmin)),
    [categoryId, isAdmin, state.products]
  );

  const products = useMemo(
    () =>
      sortProducts(
        filterProducts(categoryProducts, {
          query: searchQuery,
          onlyAvailable,
          onlyGiveaway
        }),
        sortMode
      ),
    [categoryProducts, onlyAvailable, onlyGiveaway, searchQuery, sortMode]
  );

  if (!category) {
    return (
      <div className="page">
        <section className="card empty-state">
          <h1>Категория не найдена</h1>
          <Link to="/catalog" className="btn btn_secondary">
            Вернуться в каталог
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="page stack-lg category-page">
      <section className="card stack category-page__hero">
        <Link to="/catalog" className="text-link">
          ← Назад в каталог
        </Link>
        <div className="category-page__heading">
          <div className="stack-sm">
            <p className="hero__eyebrow">Подборка категории</p>
            <h1>
              {category.emoji} {category.name}
            </h1>
            <p>{category.description}</p>
          </div>
          <div className="category-page__summary">
            <span className="badge badge_soft">{categoryProducts.length} всего</span>
            <span className="badge badge_soft">{products.length} по фильтрам</span>
          </div>
        </div>
      </section>

      <section className="card stack category-page__filters">
        <label className="field">
          <span>Поиск внутри категории</span>
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Название, описание или материал"
          />
        </label>
        <div className="toolbar">
          <button
            type="button"
            className={`btn btn_secondary${onlyAvailable ? " btn_active" : ""}`}
            onClick={() => setOnlyAvailable((prev) => !prev)}
          >
            Только в наличии
          </button>
          <button
            type="button"
            className={`btn btn_secondary${onlyGiveaway ? " btn_active" : ""}`}
            onClick={() => setOnlyGiveaway((prev) => !prev)}
          >
            Только розыгрыш
          </button>
          <select
            className="compact-select"
            value={sortMode}
            onChange={(event) => setSortMode(event.target.value as ProductSortMode)}
          >
            <option value="newest">Сначала новые</option>
            <option value="title">По названию</option>
            <option value="price_asc">Цена по возрастанию</option>
            <option value="price_desc">Цена по убыванию</option>
          </select>
        </div>
        {isSaving("product") ? <small>Сохраняем товарные изменения...</small> : null}
      </section>

      {products.length === 0 ? (
        <section className="card empty-state">
          <h3>В этой категории нет товаров по текущим фильтрам</h3>
          <p>Сбросьте фильтры или вернитесь позже.</p>
        </section>
      ) : (
        <section className="stack category-page__listing">
          {products.map((product) => (
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
          ))}
        </section>
      )}
    </div>
  );
}

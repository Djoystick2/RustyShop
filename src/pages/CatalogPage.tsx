import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import {
  canViewProduct,
  filterProducts,
  sortProducts,
  type ProductSortMode
} from "../lib/product-utils";

export function CatalogPage() {
  const { isAdmin, state } = useAppContext();
  const [listFilter, setListFilter] = useState<"all" | "available" | "giveaway">("all");
  const [listSort, setListSort] = useState<ProductSortMode>("newest");

  const categories = useMemo(
    () =>
      state.categories
        .filter((item) => (isAdmin ? true : item.isVisible))
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [isAdmin, state.categories]
  );

  const storefrontProducts = useMemo(
    () => state.products.filter((product) => canViewProduct(product, isAdmin)),
    [isAdmin, state.products]
  );

  const filteredProducts = useMemo(
    () =>
      sortProducts(
        filterProducts(storefrontProducts, {
          onlyAvailable: listFilter === "available",
          onlyGiveaway: listFilter === "giveaway"
        }),
        listSort
      ),
    [listFilter, listSort, storefrontProducts]
  );

  return (
    <div className="page stack-lg">
      <section className="card stack">
        <h1>Каталог</h1>
        <p>Выберите тематический блок и откройте подборку изделий мастера.</p>
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
      </section>

      {categories.length === 0 ? (
        <section className="card empty-state">
          <h3>Категорий пока нет</h3>
          <p>Создайте категории в админке профиля.</p>
        </section>
      ) : (
        <section className="category-grid">
          {categories.map((category) => {
            const categoryProducts = filteredProducts.filter(
              (product) => product.categoryId === category.id
            );
            const hasProducts = categoryProducts.length > 0;

            return (
              <Link key={category.id} to={`/catalog/${category.id}`} className="card category-card">
                <p className="category-card__emoji">{category.emoji}</p>
                <h2>{category.name}</h2>
                <p>{category.description}</p>
                {hasProducts ? (
                  <>
                    <small>{categoryProducts.length} товаров</small>
                    <p className="category-card__preview">
                      {categoryProducts
                        .slice(0, 2)
                        .map((item) => item.title)
                        .join(" • ")}
                    </p>
                  </>
                ) : (
                  <small>Пока нет товаров по текущим фильтрам</small>
                )}
              </Link>
            );
          })}
        </section>
      )}
    </div>
  );
}

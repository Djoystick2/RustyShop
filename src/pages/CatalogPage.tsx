import { useMemo, useState } from "react";
import { CategoryTile } from "../components/storefront/CategoryTile";
import { useAppContext } from "../context/AppContext";
import { getCategoryProducts, getRootCategories } from "../lib/catalog";
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
      getRootCategories(state.categories).filter((item) => (isAdmin ? true : item.isVisible)),
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
    <div className="page stack-lg catalog-page">
      <section className="card stack catalog-page__hero">
        <p className="hero__eyebrow">РќР°РІРёРіР°С†РёСЏ РїРѕ РІРёС‚СЂРёРЅРµ</p>
        <div className="catalog-page__heading">
          <div className="stack-sm">
            <h1>РљР°С‚Р°Р»РѕРі</h1>
            <p>РЎРЅР°С‡Р°Р»Р° РѕС‚РєСЂРѕР№С‚Рµ РєР°С‚РµРіРѕСЂРёСЋ, Р·Р°С‚РµРј РїСЂРё РЅР°Р»РёС‡РёРё РІС‹Р±РµСЂРёС‚Рµ РЅСѓР¶РЅСѓСЋ РїРѕРґРєР°С‚РµРіРѕСЂРёСЋ Рё С‚РѕР»СЊРєРѕ РїРѕСЃР»Рµ СЌС‚РѕРіРѕ РїРµСЂРµС…РѕРґРёС‚Рµ Рє Р»РёСЃС‚РёРЅРіСѓ.</p>
          </div>
          <div className="catalog-page__summary">
            <span className="badge badge_soft">{categories.length} РєР°С‚РµРіРѕСЂРёР№</span>
            <span className="badge badge_soft">{filteredProducts.length} С‚РѕРІР°СЂРѕРІ</span>
          </div>
        </div>
      </section>

      <section className="card stack catalog-page__filters">
        <div className="toolbar">
          <button
            type="button"
            className={`btn btn_secondary${listFilter === "all" ? " btn_active" : ""}`}
            onClick={() => setListFilter("all")}
          >
            Р’СЃРµ
          </button>
          <button
            type="button"
            className={`btn btn_secondary${listFilter === "available" ? " btn_active" : ""}`}
            onClick={() => setListFilter("available")}
          >
            Р’ РЅР°Р»РёС‡РёРё
          </button>
          <button
            type="button"
            className={`btn btn_secondary${listFilter === "giveaway" ? " btn_active" : ""}`}
            onClick={() => setListFilter("giveaway")}
          >
            Р РѕР·С‹РіСЂС‹С€
          </button>
          <select
            className="compact-select"
            value={listSort}
            onChange={(event) => setListSort(event.target.value as ProductSortMode)}
          >
            <option value="newest">РЎРЅР°С‡Р°Р»Р° РЅРѕРІС‹Рµ</option>
            <option value="title">РџРѕ РЅР°Р·РІР°РЅРёСЋ</option>
            <option value="price_asc">Р¦РµРЅР° РїРѕ РІРѕР·СЂР°СЃС‚Р°РЅРёСЋ</option>
            <option value="price_desc">Р¦РµРЅР° РїРѕ СѓР±С‹РІР°РЅРёСЋ</option>
          </select>
        </div>
      </section>

      {categories.length === 0 ? (
        <section className="card empty-state">
          <h3>РљР°С‚РµРіРѕСЂРёР№ РїРѕРєР° РЅРµС‚</h3>
          <p>РЎРѕР·РґР°Р№С‚Рµ РєР°С‚РµРіРѕСЂРёРё РІ Р°РґРјРёРЅРєРµ РїСЂРѕС„РёР»СЏ.</p>
        </section>
      ) : (
        <section className="category-grid catalog-page__grid">
          {categories.map((category) => {
            const categoryProducts = getCategoryProducts(filteredProducts, state.categories, category.id);
            const subcategoryCount = state.categories.filter(
              (item) => item.parentCategoryId === category.id && (isAdmin ? true : item.isVisible)
            ).length;

            return (
              <CategoryTile
                key={category.id}
                category={category}
                href={`/catalog/${category.id}`}
                productCount={categoryProducts.length}
                detailText={
                  subcategoryCount > 0
                    ? `Подкатегорий: ${subcategoryCount}`
                    : `Товаров по текущим фильтрам: ${categoryProducts.length}`
                }
                previewText={categoryProducts.slice(0, 2).map((item) => item.title).join(" • ")}
              />
            );
          })}
        </section>
      )}
    </div>
  );
}

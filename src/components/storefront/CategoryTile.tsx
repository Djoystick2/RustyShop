import { Link } from "react-router-dom";
import type { Category } from "../../types/entities";

interface CategoryTileProps {
  category: Category;
  href: string;
  productCount: number;
  previewText?: string;
  detailText?: string;
}

export function CategoryTile({
  category,
  href,
  productCount,
  previewText,
  detailText
}: CategoryTileProps) {
  return (
    <Link to={href} className="card category-card">
      {category.imageUrl ? (
        <div className="category-card__media">
          <img src={category.imageUrl} alt={category.name} loading="lazy" />
        </div>
      ) : null}
      <div className="category-card__head">
        <p className="category-card__emoji">{category.emoji}</p>
        <span className="badge badge_soft">{productCount}</span>
      </div>
      <h2>{category.name}</h2>
      <p>{category.description}</p>
      {detailText ? <small className="category-card__count">{detailText}</small> : null}
      {previewText ? (
        <p className="category-card__preview">{previewText}</p>
      ) : (
        <small className="category-card__count">Сейчас нет товаров по выбранным фильтрам</small>
      )}
    </Link>
  );
}

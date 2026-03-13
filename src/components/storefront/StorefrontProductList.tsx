import { getPrimaryProductImage } from "../../lib/product-utils";
import type { Product, ProductImage, SellerSettings } from "../../types/entities";
import { ProductCard } from "../products/ProductCard";

interface StorefrontProductListProps {
  products: Product[];
  productImages: ProductImage[];
  sellerSettings: SellerSettings;
  isAdmin: boolean;
  favoritesSet: Set<string>;
  onToggleFavorite: (productId: string) => void | Promise<void>;
  onToggleVisibility: (productId: string) => void | Promise<void>;
  onToggleAvailability: (productId: string) => void | Promise<void>;
  onToggleFeatured: (productId: string) => void | Promise<void>;
  emptyTitle?: string;
  emptyMessage?: string;
  className?: string;
}

export function StorefrontProductList({
  products,
  productImages,
  sellerSettings,
  isAdmin,
  favoritesSet,
  onToggleFavorite,
  onToggleVisibility,
  onToggleAvailability,
  onToggleFeatured,
  emptyTitle,
  emptyMessage,
  className = "storefront-product-list"
}: StorefrontProductListProps) {
  if (products.length === 0) {
    return emptyTitle && emptyMessage ? (
      <div className="card empty-state">
        <h3>{emptyTitle}</h3>
        <p>{emptyMessage}</p>
      </div>
    ) : null;
  }

  return (
    <div className={className}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          imageUrl={getPrimaryProductImage(product.id, productImages)}
          isFavorite={favoritesSet.has(product.id)}
          sellerSettings={sellerSettings}
          isAdmin={isAdmin}
          onToggleFavorite={onToggleFavorite}
          onToggleVisibility={onToggleVisibility}
          onToggleAvailability={onToggleAvailability}
          onToggleFeatured={onToggleFeatured}
        />
      ))}
    </div>
  );
}

import type { Product, ProductImage } from "../types/entities";

export function canViewProduct(product: Product, isAdmin: boolean): boolean {
  if (isAdmin) {
    return true;
  }
  return product.isVisible;
}

export function getProductImages(productId: string, productImages: ProductImage[]): ProductImage[] {
  return productImages
    .filter((item) => item.productId === productId)
    .sort((a, b) => a.position - b.position);
}

export function getPrimaryProductImage(productId: string, productImages: ProductImage[]): string | undefined {
  const images = getProductImages(productId, productImages);
  return images.find((item) => item.isPrimary)?.url ?? images[0]?.url;
}

export function extractPriceNumber(priceText: string): number | null {
  const normalized = priceText.replace(",", ".").replace(/[^\d.]/g, "");
  if (!normalized) {
    return null;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export type ProductSortMode = "newest" | "price_asc" | "price_desc" | "title";

export function sortProducts(
  products: Product[],
  sortBy: ProductSortMode
): Product[] {
  const cloned = [...products];
  switch (sortBy) {
    case "price_asc":
      return cloned.sort((a, b) => (extractPriceNumber(a.priceText) ?? 0) - (extractPriceNumber(b.priceText) ?? 0));
    case "price_desc":
      return cloned.sort((a, b) => (extractPriceNumber(b.priceText) ?? 0) - (extractPriceNumber(a.priceText) ?? 0));
    case "title":
      return cloned.sort((a, b) => a.title.localeCompare(b.title, "ru-RU"));
    case "newest":
    default:
      return cloned.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }
}

export interface ProductFilterOptions {
  query?: string;
  onlyAvailable?: boolean;
  onlyGiveaway?: boolean;
  includeSoldOut?: boolean;
}

export function filterProducts(products: Product[], options: ProductFilterOptions): Product[] {
  const query = options.query?.trim().toLowerCase() ?? "";
  const includeSoldOut = options.includeSoldOut ?? true;

  return products.filter((product) => {
    if (options.onlyAvailable && !product.isAvailable) {
      return false;
    }
    if (options.onlyGiveaway && !product.isGiveawayEligible) {
      return false;
    }
    if (!includeSoldOut && product.status === "sold_out") {
      return false;
    }
    if (!query) {
      return true;
    }
    return (
      product.title.toLowerCase().includes(query) ||
      product.description.toLowerCase().includes(query) ||
      product.materials.some((material) => material.toLowerCase().includes(query))
    );
  });
}

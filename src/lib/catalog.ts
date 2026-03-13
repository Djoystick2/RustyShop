import type { Category, Product } from "../types/entities";

export function sortCategories(categories: Category[]): Category[] {
  return [...categories].sort((first, second) => {
    if ((first.parentCategoryId ?? "") !== (second.parentCategoryId ?? "")) {
      if (!first.parentCategoryId) {
        return -1;
      }
      if (!second.parentCategoryId) {
        return 1;
      }
      return first.parentCategoryId.localeCompare(second.parentCategoryId);
    }
    if (first.sortOrder !== second.sortOrder) {
      return first.sortOrder - second.sortOrder;
    }
    return first.name.localeCompare(second.name, "ru");
  });
}

export function getRootCategories(categories: Category[]): Category[] {
  return sortCategories(categories).filter((category) => !category.parentCategoryId);
}

export function getChildCategories(categories: Category[], parentCategoryId: string): Category[] {
  return sortCategories(categories).filter((category) => category.parentCategoryId === parentCategoryId);
}

export function getDescendantCategoryIds(categories: Category[], categoryId: string): string[] {
  const ids = new Set<string>([categoryId]);
  const queue = [categoryId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    categories
      .filter((category) => category.parentCategoryId === currentId)
      .forEach((category) => {
        if (!ids.has(category.id)) {
          ids.add(category.id);
          queue.push(category.id);
        }
      });
  }

  return [...ids];
}

export function getCategoryProducts(
  products: Product[],
  categories: Category[],
  categoryId: string
): Product[] {
  const categoryIds = new Set(getDescendantCategoryIds(categories, categoryId));
  return products.filter((product) => categoryIds.has(product.categoryId));
}

export function getCategoryLabel(categories: Category[], categoryId: string): string {
  const category = categories.find((item) => item.id === categoryId);
  if (!category) {
    return "Без категории";
  }

  const parent = category.parentCategoryId
    ? categories.find((item) => item.id === category.parentCategoryId)
    : null;

  return parent ? `${parent.name} / ${category.name}` : category.name;
}

export function getCategoryTrail(categories: Category[], categoryId: string): Category[] {
  const trail: Category[] = [];
  let current = categories.find((item) => item.id === categoryId) ?? null;

  while (current) {
    trail.unshift(current);
    const parentCategoryId = current.parentCategoryId;
    current = parentCategoryId
      ? categories.find((item) => item.id === parentCategoryId) ?? null
      : null;
  }

  return trail;
}

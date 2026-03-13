import type { GiveawayItem, Product } from "../../types/entities";

export interface GiveawayWheelSegment {
  giveawayItemId: string;
  productId: string;
  label: string;
  color: string;
}

const wheelPalette = ["#ffb26f", "#ffd58a", "#ff9e80", "#ffc56f", "#ffd9a6", "#ffab91"];

export function listProductsAvailableForGiveawaySession(
  products: Product[],
  sessionItems: GiveawayItem[]
): Product[] {
  const sessionProductIds = new Set(sessionItems.map((item) => item.productId));

  // Giveaway history remains informational. Only products already attached to
  // the current session are excluded from the current lot picker.
  return products
    .filter((product) => product.status !== "sold_out")
    .filter((product) => !sessionProductIds.has(product.id));
}

export function buildGiveawayWheelSegments(
  items: GiveawayItem[],
  products: Product[]
): GiveawayWheelSegment[] {
  return items
    .filter((item) => item.isActive)
    .map((item, index) => {
      const product = products.find((candidate) => candidate.id === item.productId);
      return {
        giveawayItemId: item.id,
        productId: item.productId,
        label: product?.title ?? "Лот без названия",
        color: wheelPalette[index % wheelPalette.length]
      };
    });
}

export function pickWinningSegmentIndex(total: number): number {
  if (total <= 1) {
    return 0;
  }
  return Math.floor(Math.random() * total);
}

export function computeSpinTargetRotation(
  currentRotation: number,
  segmentIndex: number,
  segmentCount: number,
  durationMs: number
): number {
  const safeCount = Math.max(segmentCount, 1);
  const segmentAngle = 360 / safeCount;
  const centerAngle = segmentIndex * segmentAngle + segmentAngle / 2;
  const turns = durationMs >= 7000 ? 9 : durationMs >= 5000 ? 7 : 5;
  return currentRotation + turns * 360 + (360 - centerAngle);
}

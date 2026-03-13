export type UserRole = "user" | "admin";

export type ProductStatus = "new" | "popular" | "sold_out";
export type GiveawaySessionStatus = "draft" | "active" | "completed";
export type HomepageSectionType =
  | "hero"
  | "new_arrivals"
  | "recommended"
  | "giveaway"
  | "category_pick"
  | "about"
  | "promo"
  | "seasonal_pick";

export interface Profile {
  id: string;
  telegramUserId: number | null;
  displayName: string;
  avatarUrl: string;
  role: UserRole;
  about: string;
}

export interface Product {
  id: string;
  categoryId: string;
  sku: string;
  title: string;
  description: string;
  priceText: string;
  status: ProductStatus;
  materials: string[];
  isVisible: boolean;
  isAvailable: boolean;
  isGiveawayEligible: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  isPrimary: boolean;
  position: number;
}

export interface Category {
  id: string;
  slug: string;
  parentCategoryId: string | null;
  name: string;
  description: string;
  emoji: string;
  imageUrl: string;
  bannerUrl: string;
  sortOrder: number;
  isVisible: boolean;
}

export interface Favorite {
  id: string;
  profileId: string;
  productId: string;
  createdAt: string;
}

export interface StoreSettings {
  id: string;
  storeName: string;
  brandSlogan: string;
  heroBadge: string;
  heroImageUrl: string;
  mascotEmoji: string;
  storeDescription: string;
  welcomeText: string;
  infoBlock: string;
  promoTitle: string;
  promoText: string;
  adminTelegramIds: number[];
  updatedAt: string;
}

export interface SellerSettings {
  id: string;
  sellerName: string;
  avatarUrl: string;
  shortBio: string;
  brandStory: string;
  philosophy: string;
  materialsFocus: string;
  telegramUsername: string;
  telegramLink: string;
  contactText: string;
  aboutSeller: string;
  city: string;
  purchaseMessageTemplate: string;
  purchaseButtonLabel: string;
  updatedAt: string;
}

export interface HomepageSection {
  id: string;
  type: HomepageSectionType;
  title: string;
  subtitle: string;
  content: string;
  linkedCategoryId: string | null;
  linkedProductIds: string[];
  isEnabled: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface GiveawaySession {
  id: string;
  title: string;
  description: string;
  status: GiveawaySessionStatus;
  drawAt: string;
  spinDurationMs: number;
  createdAt: string;
  updatedAt: string;
}

export interface GiveawayItem {
  id: string;
  sessionId: string;
  productId: string;
  slots: number;
  isActive: boolean;
}

export interface GiveawayResult {
  id: string;
  sessionId: string;
  productId: string;
  profileId: string | null;
  winnerNickname: string;
  spinDurationMs: number;
  wonAt: string;
  note: string;
}

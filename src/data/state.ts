import type {
  Category,
  Favorite,
  GiveawayEvent,
  HomepageSection,
  GiveawayItem,
  GiveawayParticipant,
  GiveawayResult,
  GiveawaySession,
  Product,
  ProductImage,
  Profile,
  SellerSettings,
  StoreSettings
} from "../types/entities";
import {
  fallbackCategories,
  fallbackFavorites,
  fallbackGiveawayEvents,
  fallbackGiveawayItems,
  fallbackGiveawayParticipants,
  fallbackGiveawayResults,
  fallbackGiveawaySessions,
  fallbackHomepageSections,
  fallbackProductImages,
  fallbackProducts,
  fallbackProfiles,
  fallbackSellerSettings,
  fallbackStoreSettings
} from "./seed";

export interface AppState {
  activeProfileId: string;
  profiles: Profile[];
  products: Product[];
  productImages: ProductImage[];
  categories: Category[];
  favorites: Favorite[];
  storeSettings: StoreSettings;
  sellerSettings: SellerSettings;
  homepageSections: HomepageSection[];
  giveawaySessions: GiveawaySession[];
  giveawayItems: GiveawayItem[];
  giveawayParticipants: GiveawayParticipant[];
  giveawayResults: GiveawayResult[];
  giveawayEvents: GiveawayEvent[];
  searchQuery: string;
}

export interface BootstrapPayload {
  activeProfileId: string;
  profiles: Profile[];
  products: Product[];
  productImages: ProductImage[];
  categories: Category[];
  favorites: Favorite[];
  storeSettings: StoreSettings;
  sellerSettings: SellerSettings;
  homepageSections: HomepageSection[];
  giveawaySessions: GiveawaySession[];
  giveawayItems: GiveawayItem[];
  giveawayParticipants: GiveawayParticipant[];
  giveawayResults: GiveawayResult[];
  giveawayEvents: GiveawayEvent[];
}

export interface ProductInput {
  id?: string;
  categoryId: string;
  sku: string;
  title: string;
  description: string;
  priceText: string;
  status: Product["status"];
  materials: string[];
  imageUrls: string[];
  imageFiles?: File[];
  isVisible: boolean;
  isAvailable: boolean;
  isGiveawayEligible: boolean;
  isFeatured: boolean;
}

export interface CategoryInput {
  id?: string;
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

export interface GiveawaySessionInput {
  title: string;
  description: string;
  mode?: GiveawaySession["mode"];
  drawAt: string;
  spinDurationMs?: number;
}

export interface GiveawaySessionPatch {
  title?: string;
  description?: string;
  mode?: GiveawaySession["mode"];
  drawAt?: string;
  status?: GiveawaySession["status"];
  spinDurationMs?: number;
}

export interface GiveawayParticipantInput {
  sessionId: string;
  nickname: string;
  comment?: string;
}

export interface GiveawayItemInput {
  id?: string;
  sessionId: string;
  itemType: GiveawayItem["itemType"];
  productId?: string | null;
  title: string;
  description: string;
  emoji: string;
  imageUrl: string;
  slots?: number;
  isActive?: boolean;
}

export interface GiveawaySpinInput {
  sessionId: string;
  giveawayItemId: string;
  participantId: string | null;
  productId: string | null;
  prizeTitle: string;
  itemType: GiveawayItem["itemType"];
  winnerNickname: string;
  spinDurationMs: number;
  note?: string;
}

export interface HomepageSectionInput {
  id?: string;
  type: HomepageSection["type"];
  title: string;
  subtitle: string;
  content: string;
  linkedCategoryId: string | null;
  linkedProductIds: string[];
  isEnabled: boolean;
  sortOrder: number;
}

export function createFallbackBootstrap(): BootstrapPayload {
  return {
    activeProfileId: fallbackProfiles[0].id,
    profiles: fallbackProfiles.map((item) => ({ ...item })),
    products: fallbackProducts.map((item) => ({ ...item, materials: [...item.materials] })),
    productImages: fallbackProductImages.map((item) => ({ ...item })),
    categories: fallbackCategories.map((item) => ({ ...item })),
    favorites: fallbackFavorites.map((item) => ({ ...item })),
    storeSettings: { ...fallbackStoreSettings, adminTelegramIds: [...fallbackStoreSettings.adminTelegramIds] },
    sellerSettings: { ...fallbackSellerSettings },
    homepageSections: fallbackHomepageSections.map((item) => ({ ...item, linkedProductIds: [...item.linkedProductIds] })),
    giveawaySessions: fallbackGiveawaySessions.map((item) => ({ ...item })),
    giveawayItems: fallbackGiveawayItems.map((item) => ({ ...item })),
    giveawayParticipants: fallbackGiveawayParticipants.map((item) => ({ ...item })),
    giveawayResults: fallbackGiveawayResults.map((item) => ({ ...item })),
    giveawayEvents: fallbackGiveawayEvents.map((item) => ({ ...item }))
  };
}

export function makeAppState(payload: BootstrapPayload): AppState {
  return {
    ...payload,
    searchQuery: ""
  };
}
